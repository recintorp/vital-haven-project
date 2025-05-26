// Cloudflare Pages Function version of caregivers routes
// All endpoints: POST / (register), GET / (list caregivers), GET /:StaffNumber, PUT /:StaffNumber, DELETE /:StaffNumber
// Place this as functions/api/caregivers/index.js

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const method = context.request.method;
  const pathParts = url.pathname.split('/').filter(Boolean);
  const isRoot = pathParts.length === 2; // /api/caregivers
  const isItem = pathParts.length === 3; // /api/caregivers/:StaffNumber
  const staffNumberParam = isItem ? decodeURIComponent(pathParts[2]) : null;

  // Helper to send JSON responses
  const json = (data, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' }
    });

  // ---- POST /api/caregivers (Register caregiver) ----
  if (method === "POST" && isRoot) {
    const {
      StaffNumber,
      Password,
      Fullname,
      ContactNo,
      Email,
      AssignedResident,
      Shift
    } = await context.request.json();

    // Validation
    const errors = {};
    if (!StaffNumber || !/^N-\d{6}$/.test(StaffNumber)) {
      errors.StaffNumber = 'Staff number is required and must match format N-012025';
    }
    if (!Password || Password.length < 8) {
      errors.Password = 'Password is required and must be at least 8 characters';
    }
    if (!Fullname) errors.Fullname = 'Full name is required';
    if (!AssignedResident) errors.AssignedResident = 'Assigned resident is required';
    if (!Shift) errors.Shift = 'Shift is required';

    if (Object.keys(errors).length > 0) {
      return json({ message: 'Validation failed', errors }, 400);
    }

    try {
      // Try to insert, enforcing uniqueness on StaffNumber
      await context.env.DB.prepare(
        `INSERT INTO Caregivers
          (StaffNumber, Password, Fullname, ContactNo, Email, AssignedResident, Shift)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        StaffNumber,
        Password,
        Fullname,
        ContactNo || null,
        Email || null,
        AssignedResident,
        Shift
      ).run();

      return json({ message: 'Caregiver registered successfully.' }, 201);
    } catch (err) {
      // Constraint violation (uniqueness)
      if (err.message && err.message.includes('UNIQUE')) {
        return json({ message: 'Staff number already exists.' }, 409);
      }
      console.error('DB insert error:', err);
      return json({ message: 'Server error. Please try again.' }, 500);
    }
  }

  // ---- POST /api/caregivers/login (Login) ----
  if (method === "POST" && isRoot && url.pathname.endsWith('/login')) {
    // This route is handled in caregivers/login.js, not here
    return new Response('Not found', { status: 404 });
  }

  // ---- GET /api/caregivers (List all caregivers) ----
  if (method === "GET" && isRoot) {
    try {
      const { results } = await context.env.DB.prepare(
        `SELECT StaffNumber, Password, Fullname, ContactNo, Email, AssignedResident, Shift FROM Caregivers`
      ).all();
      return json(results);
    } catch (err) {
      console.error('DB fetch error:', err);
      return json({ message: 'Server error fetching caregivers.' }, 500);
    }
  }

  // ---- GET /api/caregivers/:StaffNumber ----
  if (method === "GET" && isItem) {
    try {
      const { results } = await context.env.DB.prepare(
        `SELECT StaffNumber, Password, Fullname, ContactNo, Email, AssignedResident, Shift FROM Caregivers WHERE StaffNumber = ?`
      ).bind(staffNumberParam).all();
      if (!results.length) {
        return json({ message: 'Caregiver not found.' }, 404);
      }
      // Send password as is for admin viewing/editing
      const caregiver = results[0];
      caregiver.Password = caregiver.Password || "";
      return json(caregiver);
    } catch (err) {
      return json({ message: 'Database error.' }, 500);
    }
  }

  // ---- PUT /api/caregivers/:StaffNumber ----
  if (method === "PUT" && isItem) {
    const {
      Password,
      Fullname,
      ContactNo,
      Email,
      AssignedResident,
      Shift
    } = await context.request.json();

    // Validation
    const errors = {};
    if (!Password || Password.length < 8) {
      errors.Password = 'Password is required and must be at least 8 characters';
    }
    if (!Fullname) errors.Fullname = 'Full name is required';
    if (!AssignedResident) errors.AssignedResident = 'Assigned resident is required';
    if (!Shift) errors.Shift = 'Shift is required';

    if (Object.keys(errors).length > 0) {
      return json({ message: 'Validation failed', errors }, 400);
    }

    try {
      const { success } = await context.env.DB.prepare(
        `UPDATE Caregivers SET
            Password = ?,
            Fullname = ?,
            ContactNo = ?,
            Email = ?,
            AssignedResident = ?,
            Shift = ?
         WHERE StaffNumber = ?`
      ).bind(
        Password,
        Fullname,
        ContactNo || null,
        Email || null,
        AssignedResident,
        Shift,
        staffNumberParam
      ).run();

      if (success) {
        return json({ message: 'Caregiver updated.' });
      }
      return json({ message: 'Caregiver not found.' }, 404);
    } catch (err) {
      console.error('DB update error:', err);
      return json({ message: 'Update failed.' }, 500);
    }
  }

  // ---- DELETE /api/caregivers/:StaffNumber ----
  if (method === "DELETE" && isItem) {
    try {
      const { success } = await context.env.DB.prepare(
        `DELETE FROM Caregivers WHERE StaffNumber = ?`
      ).bind(staffNumberParam).run();
      if (success) {
        return json({ message: 'Caregiver deleted.' });
      }
      return json({ message: 'Caregiver not found.' }, 404);
    } catch (err) {
      return json({ message: 'Delete failed.' }, 500);
    }
  }

  // Not found
  return new Response('Not found', { status: 404 });
}