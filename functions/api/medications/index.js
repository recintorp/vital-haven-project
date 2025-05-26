export async function onRequest(context) {
  const url = new URL(context.request.url);
  const method = context.request.method;
  const pathParts = url.pathname.split('/').filter(Boolean);
  const isRoot = pathParts.length === 2; // /api/medications
  const isItem = pathParts.length === 3; // /api/medications/:id
  const medicationId = isItem ? decodeURIComponent(pathParts[2]) : null;

  // Helper for JSON responses
  const json = (data, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' }
    });

  // ---- GET /api/medications?staffNumber=... ----
  if (method === "GET" && isRoot) {
    const StaffNumber = url.searchParams.get("staffNumber");
    const residentId = url.searchParams.get("residentId");
    const status = url.searchParams.get("status");
    const search = url.searchParams.get("q") || "";

    if (!StaffNumber) {
      return json({ message: "Missing staffNumber parameter." }, 400);
    }

    try {
      // Get assigned residents for this caregiver
      const { results: residents } = await context.env.DB.prepare(
        `SELECT ResidentID, Fullname FROM Residents WHERE AssignedCaregiver = ?`
      ).bind(StaffNumber).all();

      if (!residents.length) return json([]);

      const residentIds = residents.map(r => r.ResidentID);
      if (!residentIds.length) return json([]);

      // Build dynamic WHERE clause for resident IDs
      let whereClause = residentIds.map(() => `m.ResidentID = ?`).join(' OR ');
      if (whereClause) {
        whereClause = `(${whereClause})`;
      } else {
        return json([]);
      }

      let query = `
        SELECT 
          m.MedicationID,
          m.ResidentID,
          r.Fullname,
          m.MedicationName,
          m.Dosage,
          m.Time,
          m.Frequency,
          m.Priority,
          m.LastAdministered
        FROM Medication m
        INNER JOIN Residents r ON m.ResidentID = r.ResidentID
        WHERE ${whereClause}
      `;
      const params = [...residentIds];

      if (residentId) {
        query += ' AND m.ResidentID = ?';
        params.push(residentId);
      }
      if (status) {
        query += ' AND m.Status = ?';
        params.push(status);
      }
      if (search) {
        query += ' AND (m.MedicationName LIKE ? OR m.Dosage LIKE ? OR r.Fullname LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }
      query += ' ORDER BY m.Time ASC';

      const { results: medications } = await context.env.DB.prepare(query).bind(...params).all();
      return json(medications);
    } catch (err) {
      console.error('DB medication fetch error:', err);
      return json({ message: 'Server error fetching medications.' }, 500);
    }
  }

  // ---- POST /api/medications ----
  if (method === "POST" && isRoot) {
    let data;
    try {
      data = await context.request.json();
    } catch {
      return json({ message: "Invalid JSON." }, 400);
    }
    const {
      ResidentID,
      StaffNumber,
      MedicationName,
      Dosage,
      Time,
      Frequency,
      Priority,
      LastAdministered
    } = data || {};

    // Minimal validation
    if (
      !ResidentID ||
      !StaffNumber ||
      !MedicationName ||
      !Dosage ||
      !Time ||
      !Frequency ||
      !Priority
    ) {
      return json({ message: "All required fields must be provided." }, 400);
    }

    try {
      await context.env.DB.prepare(
        `INSERT INTO Medication
          (ResidentID, StaffNumber, MedicationName, Dosage, Time, Frequency, Priority, LastAdministered)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        ResidentID,
        StaffNumber,
        MedicationName,
        Dosage,
        Time,
        Frequency,
        Priority,
        LastAdministered || null
      ).run();
      return json({ message: 'Medication added successfully.' }, 201);
    } catch (err) {
      console.error('DB medication insert error:', err);
      return json({ message: 'Server error adding medication.' }, 500);
    }
  }

  // ---- PUT /api/medications/:id ----
  if (method === "PUT" && isItem) {
    let data;
    try {
      data = await context.request.json();
    } catch {
      return json({ message: "Invalid JSON." }, 400);
    }
    const {
      MedicationName,
      Dosage,
      Time,
      Frequency,
      Priority,
      LastAdministered
    } = data || {};

    if (!medicationId) {
      return json({ message: "MedicationID is required." }, 400);
    }

    try {
      await context.env.DB.prepare(
        `UPDATE Medication SET
          MedicationName = ?,
          Dosage = ?,
          Time = ?,
          Frequency = ?,
          Priority = ?,
          LastAdministered = ?
        WHERE MedicationID = ?`
      ).bind(
        MedicationName,
        Dosage,
        Time,
        Frequency,
        Priority,
        LastAdministered || null,
        medicationId
      ).run();
      return json({ message: 'Medication updated successfully.' });
    } catch (err) {
      console.error('DB medication update error:', err);
      return json({ message: 'Server error updating medication.' }, 500);
    }
  }

  // ---- DELETE /api/medications/:id ----
  if (method === "DELETE" && isItem) {
    if (!medicationId) {
      return json({ message: "MedicationID is required." }, 400);
    }

    try {
      await context.env.DB.prepare(
        `DELETE FROM Medication WHERE MedicationID = ?`
      ).bind(medicationId).run();
      return json({ message: 'Medication deleted successfully.' });
    } catch (err) {
      console.error('DB medication delete error:', err);
      return json({ message: 'Server error deleting medication.' }, 500);
    }
  }

  // Not found
  return new Response('Not found', { status: 404 });
}