// Cloudflare Pages Function for /api/residents
// Handles: GET (all/filter), GET by ID, POST (new), PUT (update), DELETE (delete)
// Note: File upload for MedicalFilePath must use a client-side upload to public storage (Cloudflare R2, S3, etc.)
// Here, MedicalFilePath is a URL or path string, not a server-uploaded file

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const method = context.request.method;
  const pathParts = url.pathname.split('/').filter(Boolean);
  const isRoot = pathParts.length === 2; // /api/residents
  const isItem = pathParts.length === 3; // /api/residents/:id
  const residentId = isItem ? decodeURIComponent(pathParts[2]) : null;

  // Helper for JSON responses
  const json = (data, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' }
    });

  // ---- GET /api/residents?AssignedCaregiver=... ----
  if (method === "GET" && isRoot) {
    try {
      const AssignedCaregiver = url.searchParams.get("AssignedCaregiver") || url.searchParams.get("StaffNumber");
      let query = `SELECT ResidentID, Fullname, DateOfBirth, Gender, MedicalFilePath, ContactNo, AssignedCaregiver FROM Residents`;
      let params = [];
      if (AssignedCaregiver) {
        query += ` WHERE AssignedCaregiver = ?`;
        params.push(AssignedCaregiver);
      }
      const { results } = await (params.length
        ? context.env.DB.prepare(query).bind(...params).all()
        : context.env.DB.prepare(query).all()
      );
      return json(results);
    } catch (err) {
      console.error('DB fetch error:', err);
      return json({ message: 'Server error fetching residents.' }, 500);
    }
  }

  // ---- GET /api/residents/:id ----
  if (method === "GET" && isItem) {
    try {
      const { results } = await context.env.DB.prepare(
        `SELECT ResidentID, Fullname, DateOfBirth, Gender, MedicalFilePath, ContactNo, AssignedCaregiver FROM Residents WHERE ResidentID = ?`
      ).bind(residentId).all();
      if (!results.length) {
        return json({ message: 'Resident not found.' }, 404);
      }
      return json(results[0]);
    } catch (err) {
      console.error('DB fetch error:', err);
      return json({ message: 'Server error fetching resident.' }, 500);
    }
  }

  // ---- POST /api/residents ----
  if (method === "POST" && isRoot) {
    // The frontend should upload files to a public storage and send the resulting URL as MedicalFilePath
    const body = await context.request.json();
    const fullname = body.Fullname || body.fullname;
    const dateOfBirth = body.DateOfBirth || body.dateOfBirth;
    const gender = body.Gender || body.gender;
    const contactNo = body.ContactNo || body.contactNo;
    const AssignedCaregiver = body.AssignedCaregiver || body.assignedCaregiver;
    const medicalFilePath = body.MedicalFilePath || body.medicalFilePath;

    // Validation
    const errors = {};
    if (!fullname || !fullname.trim()) errors.Fullname = "Full name is required";
    if (!dateOfBirth) errors.DateOfBirth = "Date of birth is required";
    if (!gender) errors.Gender = "Gender is required";
    if (!AssignedCaregiver) errors.AssignedCaregiver = "Assigned caregiver is required";
    if (!medicalFilePath) errors.MedicalFilePath = "Medical file path (URL) is required";

    if (Object.keys(errors).length > 0) {
      return json({ message: "Validation failed", errors }, 400);
    }

    try {
      await context.env.DB.prepare(
        `INSERT INTO Residents
          (Fullname, DateOfBirth, Gender, MedicalFilePath, ContactNo, AssignedCaregiver)
        VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(
        fullname.trim(),
        dateOfBirth,
        gender,
        medicalFilePath,
        contactNo || null,
        AssignedCaregiver
      ).run();
      return json({ message: 'Resident registered successfully.' }, 201);
    } catch (err) {
      console.error('DB insert error:', err);
      return json({ message: 'Database error.' }, 500);
    }
  }

  // ---- PUT /api/residents/:id ----
  if (method === "PUT" && isItem) {
    const body = await context.request.json();
    const fullname = body.Fullname || body.fullname;
    const dateOfBirth = body.DateOfBirth || body.dateOfBirth;
    const gender = body.Gender || body.gender;
    const contactNo = body.ContactNo || body.contactNo;
    const AssignedCaregiver = body.AssignedCaregiver || body.assignedCaregiver;
    const medicalFilePath = body.MedicalFilePath || body.medicalFilePath;

    // Validation
    const errors = {};
    if (!fullname || !fullname.trim()) errors.Fullname = "Full name is required";
    if (!dateOfBirth) errors.DateOfBirth = "Date of birth is required";
    if (!gender) errors.Gender = "Gender is required";
    if (!AssignedCaregiver) errors.AssignedCaregiver = "Assigned caregiver is required";

    if (Object.keys(errors).length > 0) {
      return json({ message: "Validation failed", errors }, 400);
    }

    // Build update assignments
    const assignments = [
      "Fullname = ?",
      "DateOfBirth = ?",
      "Gender = ?",
      "ContactNo = ?",
      "AssignedCaregiver = ?"
    ];
    const params = [
      fullname.trim(),
      dateOfBirth,
      gender,
      contactNo || null,
      AssignedCaregiver
    ];
    if (medicalFilePath) {
      assignments.push("MedicalFilePath = ?");
      params.push(medicalFilePath);
    }
    params.push(residentId);

    try {
      // Check existence
      const { results: exists } = await context.env.DB.prepare(
        `SELECT MedicalFilePath FROM Residents WHERE ResidentID = ?`
      ).bind(residentId).all();
      if (!exists.length) {
        return json({ message: 'Resident not found.' }, 404);
      }

      await context.env.DB.prepare(
        `UPDATE Residents SET
          ${assignments.join(", ")}
         WHERE ResidentID = ?`
      ).bind(...params).run();

      // Note: File deletion must be handled in your storage provider, not here
      return json({ message: 'Resident updated successfully.' });
    } catch (err) {
      console.error('DB update error:', err);
      return json({ message: 'Error updating resident.' }, 500);
    }
  }

  // ---- DELETE /api/residents/:id ----
  if (method === "DELETE" && isItem) {
    try {
      // Fetch medical file path (for possible deletion in your storage provider)
      const { results: existing } = await context.env.DB.prepare(
        `SELECT MedicalFilePath FROM Residents WHERE ResidentID = ?`
      ).bind(residentId).all();

      await context.env.DB.prepare(
        `DELETE FROM Residents WHERE ResidentID = ?`
      ).bind(residentId).run();

      // Note: Deletion of the file must be handled in your storage provider!
      return json({ message: 'Resident deleted successfully.' });
    } catch (err) {
      console.error('DB delete error:', err);
      return json({ message: 'Error deleting resident.' }, 500);
    }
  }

  // Not found
  return new Response('Not found', { status: 404 });
}