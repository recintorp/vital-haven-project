export async function onRequest(context) {
  const method = context.request.method;

  // Helper for JSON responses
  const json = (data, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json" }
    });

  // ---- POST /api/emails ----
  if (method === "POST") {
    let parsed;
    try {
      parsed = await context.request.json();
    } catch {
      return json({ message: "Invalid JSON." }, 400);
    }
    const { body } = parsed || {};
    if (!body || typeof body !== "string" || !body.trim()) {
      return json({ message: "Request body must not be empty." }, 400);
    }
    try {
      await context.env.DB.prepare(
        `INSERT INTO Emails (Body) VALUES (?)`
      ).bind(body).run();
      return json({ message: "Request submitted successfully." }, 201);
    } catch (err) {
      console.error("DB insert error:", err);
      return json({ message: "Server error. Please try again." }, 500);
    }
  }

  // ---- GET /api/emails ----
  if (method === "GET") {
    try {
      const { results } = await context.env.DB.prepare(
        `SELECT EmailID, Body FROM Emails ORDER BY EmailID DESC`
      ).all();
      return json(results);
    } catch (err) {
      console.error("DB fetch error:", err);
      return json({ message: "Fetch error." }, 500);
    }
  }

  // Not found
  return new Response("Not found", { status: 404 });
}