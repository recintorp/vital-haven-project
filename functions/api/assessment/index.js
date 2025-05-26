// Cloudflare Pages Function for /api/assessment
// Handles: GET (recent assessments by caregiver), POST (new assessment)
// Place this as functions/api/assessment/index.js

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const method = context.request.method;

  // Helper for JSON responses
  const json = (data, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' }
    });

  // ---- GET /api/assessment?staffNumber=... ----
  if (method === "GET") {
    const staffNumber = url.searchParams.get("staffNumber");
    const search = url.searchParams.get("q") || "";

    if (!staffNumber) {
      return json({ message: "Missing staffNumber parameter." }, 400);
    }

    try {
      // Get all residents assigned to this caregiver
      const { results: residents } = await context.env.DB.prepare(
        `SELECT ResidentID, Fullname FROM Residents WHERE AssignedCaregiver = ?`
      ).bind(staffNumber).all();

      if (!residents.length) {
        return json([]); // No assigned residents
      }
      const residentIds = residents.map(r => r.ResidentID);
      if (!residentIds.length) {
        return json([]);
      }

      // Build the query dynamically for D1 (no named parameters, use ?)
      let query = `
        SELECT 
          a.AssessmentID,
          a.ResidentID,
          r.Fullname,
          a.StaffNumber,
          a.AssessmentDate,
          a.Notes
        FROM HealthAssessments a
        INNER JOIN Residents r ON a.ResidentID = r.ResidentID
        WHERE 
          (${residentIds.map(() => `a.ResidentID = ?`).join(" OR ")})
      `;
      const params = [...residentIds];

      // Optional search filter
      if (search) {
        query += " AND (r.Fullname LIKE ? OR a.Notes LIKE ?)";
        params.push(`%${search}%`, `%${search}%`);
      }
      query += " ORDER BY a.AssessmentDate DESC";

      const { results: assessments } = await context.env.DB.prepare(query).bind(...params).all();

      return json(assessments);
    } catch (err) {
      console.error('DB assessment fetch error:', err);
      return json({ message: 'Server error fetching assessments.' }, 500);
    }
  }

  // ---- POST /api/assessment ----
  if (method === "POST") {
    const { ResidentID, StaffNumber, Notes } = await context.request.json();

    if (
      !ResidentID ||
      !StaffNumber ||
      !Notes ||
      !Notes.toString().trim()
    ) {
      return json({ message: "Resident, StaffNumber, and Notes are required." }, 400);
    }

    try {
      // Use current date in ISO8601 format
      const now = new Date().toISOString();
      await context.env.DB.prepare(
        `INSERT INTO HealthAssessments (ResidentID, StaffNumber, AssessmentDate, Notes)
         VALUES (?, ?, ?, ?)`
      ).bind(
        ResidentID,
        StaffNumber,
        now,
        Notes.toString().trim()
      ).run();
      return json({ message: 'Assessment saved successfully.' }, 201);
    } catch (err) {
      console.error('DB assessment insert error:', err);
      return json({ message: 'Server error saving assessment.' }, 500);
    }
  }

  // Not found
  return new Response('Not found', { status: 404 });
}