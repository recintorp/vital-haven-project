export async function onRequestPost(context) {
  let data;
  try {
    data = await context.request.json();
  } catch {
    return new Response(
      JSON.stringify({ message: 'Invalid JSON.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
  const { StaffNumber, Password } = data || {};

  if (!StaffNumber || !Password) {
    return new Response(
      JSON.stringify({ message: 'StaffNumber and Password are required.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Hardcoded admin login (for development/demo only)
  if (StaffNumber === 'admin' && Password === '1234') {
    return new Response(
      JSON.stringify({ message: 'Admin login successful.' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { results } = await context.env.DB.prepare(
      `SELECT StaffNumber FROM Caregivers WHERE StaffNumber = ? AND Password = ?`
    ).bind(StaffNumber, Password).all();

    if (results.length === 1) {
      return new Response(
        JSON.stringify({ message: 'Login successful.', StaffNumber: results[0].StaffNumber }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return new Response(
      JSON.stringify({ message: 'Invalid credentials.' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('DB login error:', err);
    return new Response(
      JSON.stringify({ message: 'Server error.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}