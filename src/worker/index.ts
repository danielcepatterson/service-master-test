import { Hono } from "hono";
import { cors } from "hono/cors";

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use("/api/*", cors());

// ─── Helpers ──────────────────────────────────────────────
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function generateToken(): string {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Auth middleware: checks Authorization header for Bearer token
async function getUser(c: any): Promise<{ id: number; username: string; userType: string } | null> {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const session = await c.env.DB.prepare(
    "SELECT s.user_id, u.username, u.user_type FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ? AND s.expires_at > datetime('now')"
  )
    .bind(token)
    .first();
  if (!session) return null;
  return { id: session.user_id as number, username: session.username as string, userType: session.user_type as string };
}

function unauthorized() {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

// ─── Auto-run migrations on cold start ────────────────────
let migrationsRan = false;
async function runMigrations(db: D1Database) {
  if (migrationsRan) return;
  migrationsRan = true;
  try {
    await db.prepare(`ALTER TABLE users ADD COLUMN user_type TEXT NOT NULL DEFAULT 'tech'`).run();
  } catch (_) { /* column already exists */ }
  await db.prepare(`CREATE TABLE IF NOT EXISTS work_order_notes (id INTEGER PRIMARY KEY AUTOINCREMENT, work_order_number TEXT NOT NULL, note TEXT NOT NULL, author TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT)`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS system_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL DEFAULT '', action TEXT NOT NULL, category TEXT NOT NULL DEFAULT 'general', target TEXT NOT NULL DEFAULT '', detail TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT (datetime('now')))`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS team_profiles (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL UNIQUE, schedule TEXT NOT NULL DEFAULT '{}', pay_rate TEXT NOT NULL DEFAULT '0', pto_total INTEGER NOT NULL DEFAULT 0, pto_used INTEGER NOT NULL DEFAULT 0, sick_total INTEGER NOT NULL DEFAULT 0, sick_used INTEGER NOT NULL DEFAULT 0, notes TEXT NOT NULL DEFAULT '', updated_at TEXT NOT NULL DEFAULT (datetime('now')))`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS days_off (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, date TEXT NOT NULL, reason TEXT NOT NULL DEFAULT '', type TEXT NOT NULL DEFAULT 'PTO', status TEXT NOT NULL DEFAULT 'pending', created_at TEXT NOT NULL DEFAULT (datetime('now')))`).run();
  try { await db.prepare(`ALTER TABLE work_orders ADD COLUMN assigned_to TEXT NOT NULL DEFAULT ''`).run(); } catch (_) {}
  try { await db.prepare(`ALTER TABLE work_orders ADD COLUMN created_by TEXT NOT NULL DEFAULT ''`).run(); } catch (_) {}
  try { await db.prepare(`ALTER TABLE work_order_history ADD COLUMN changed_by TEXT NOT NULL DEFAULT ''`).run(); } catch (_) {}
  await db.prepare(`CREATE TABLE IF NOT EXISTS recurring_items (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, property_name TEXT NOT NULL DEFAULT '', instructions TEXT NOT NULL DEFAULT '', frequency TEXT NOT NULL DEFAULT 'monthly', day_of_week TEXT NOT NULL DEFAULT '', day_of_month INTEGER NOT NULL DEFAULT 1, assigned_to TEXT NOT NULL DEFAULT '', active INTEGER NOT NULL DEFAULT 1, last_generated TEXT NOT NULL DEFAULT '', next_due TEXT NOT NULL DEFAULT '', notes TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')))`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS internal_services (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, category TEXT NOT NULL DEFAULT 'general', description TEXT NOT NULL DEFAULT '', frequency TEXT NOT NULL DEFAULT 'monthly', day_of_week TEXT NOT NULL DEFAULT '', day_of_month INTEGER NOT NULL DEFAULT 1, assigned_to TEXT NOT NULL DEFAULT '', active INTEGER NOT NULL DEFAULT 1, last_completed TEXT NOT NULL DEFAULT '', next_due TEXT NOT NULL DEFAULT '', notes TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')))`).run();
}

async function writeLog(db: D1Database, username: string, action: string, category: string, target: string, detail: string) {
  try {
    const now = new Date().toISOString();
    await db.prepare(`INSERT INTO system_logs (username, action, category, target, detail, created_at) VALUES (?, ?, ?, ?, ?, ?)`)
      .bind(username, action, category, target, detail, now).run();
  } catch (_) { /* never block the main request */ }
}

app.use("/api/*", async (c, next) => {
  await runMigrations(c.env.DB);
  return next();
});

// ─── DB Init (auto-run migrations) ────────────────────────
app.get("/api/init", async (c) => {
  const db = c.env.DB;
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  // Add user_type column if it doesn't exist yet
  try {
    await db.exec(`ALTER TABLE users ADD COLUMN user_type TEXT NOT NULL DEFAULT 'tech';`);
  } catch (_) { /* column already exists */ }
  await db.exec(`
    CREATE TABLE IF NOT EXISTS work_order_notes (id INTEGER PRIMARY KEY AUTOINCREMENT, work_order_number TEXT NOT NULL, note TEXT NOT NULL, author TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT);
  `);
  await db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      expires_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);
  await db.exec(`
    CREATE TABLE IF NOT EXISTS properties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      property_name TEXT NOT NULL,
      address TEXT NOT NULL,
      street TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      zip TEXT NOT NULL,
      owner_name TEXT NOT NULL,
      owner_phone TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  await db.exec(`
    CREATE TABLE IF NOT EXISTS work_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      number TEXT NOT NULL UNIQUE,
      property_name TEXT NOT NULL,
      title TEXT NOT NULL,
      instructions TEXT NOT NULL,
      scheduled_time TEXT NOT NULL,
      scheduled_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      completed_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  await db.exec(`
    CREATE TABLE IF NOT EXISTS work_order_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      work_order_number TEXT NOT NULL,
      status TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (work_order_number) REFERENCES work_orders(number)
    );
  `);
  await db.exec(`
    CREATE TABLE IF NOT EXISTS vendors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      contact_name TEXT NOT NULL,
      contact_number TEXT NOT NULL,
      contact_email TEXT NOT NULL,
      address TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  await db.exec(`
    CREATE TABLE IF NOT EXISTS purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      work_order_number TEXT NOT NULL,
      vendor TEXT NOT NULL,
      price TEXT NOT NULL,
      purchaser TEXT NOT NULL,
      purpose TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  await db.exec(`
    CREATE TABLE IF NOT EXISTS inventory_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price TEXT NOT NULL,
      cost TEXT NOT NULL,
      part_number TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  await db.exec(`
    CREATE TABLE IF NOT EXISTS inventory_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  await db.exec(`
    CREATE TABLE IF NOT EXISTS work_order_photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      work_order_number TEXT NOT NULL,
      filename TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (work_order_number) REFERENCES work_orders(number)
    );
  `);
  await db.exec(`
    CREATE TABLE IF NOT EXISTS estimates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      number TEXT NOT NULL UNIQUE,
      property_name TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      estimated_cost TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending',
      converted_to TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  await db.exec(`
    CREATE TABLE IF NOT EXISTS work_order_expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      work_order_number TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'Part',
      quantity TEXT NOT NULL DEFAULT '1',
      unit_cost TEXT NOT NULL DEFAULT '0',
      total_cost TEXT NOT NULL DEFAULT '0',
      vendor TEXT NOT NULL DEFAULT '',
      part_number TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (work_order_number) REFERENCES work_orders(number)
    );
  `);
  return c.json({ ok: true, message: "Database initialized" });
});

// ─── Auth ─────────────────────────────────────────────────
app.post("/api/auth/register", async (c) => {
  const { username, password } = await c.req.json();
  if (!username || !password) return c.json({ error: "Username and password required" }, 400);
  if (password.length < 4) return c.json({ error: "Password must be at least 4 characters" }, 400);

  const existing = await c.env.DB.prepare("SELECT id FROM users WHERE username = ?").bind(username).first();
  if (existing) return c.json({ error: "Username already exists" }, 409);

  const passwordHash = await hashPassword(password);
  await c.env.DB.prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)").bind(username, passwordHash).run();

  return c.json({ ok: true, message: "User registered" });
});

app.post("/api/auth/login", async (c) => {
  const { username, password } = await c.req.json();
  if (!username || !password) return c.json({ error: "Username and password required" }, 400);

  const passwordHash = await hashPassword(password);
  const user = await c.env.DB.prepare("SELECT id, username, user_type FROM users WHERE username = ? AND password_hash = ?")
    .bind(username, passwordHash)
    .first();
  if (!user) return c.json({ error: "Invalid username or password" }, 401);

  const token = generateToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days
  await c.env.DB.prepare("INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)")
    .bind(user.id, token, expiresAt)
    .run();
  await writeLog(c.env.DB, user.username as string, 'login', 'auth', '', 'User logged in');
  return c.json({ ok: true, token, user: { id: user.id, username: user.username, userType: user.user_type } });
});

app.post("/api/auth/logout", async (c) => {
  const authHeader = c.req.header("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    await c.env.DB.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
  }
  return c.json({ ok: true });
});

app.get("/api/auth/me", async (c) => {
  const user = await getUser(c);
  if (!user) return unauthorized();
  return c.json({ ok: true, user });
});

// ─── User Management ──────────────────────────────────────
app.get("/api/users", async (c) => {
  const user = await getUser(c);
  if (!user) return unauthorized();
  const { results } = await c.env.DB.prepare(
    "SELECT id, username, password_hash, user_type, created_at FROM users ORDER BY id ASC"
  ).all();
  return c.json(results || []);
});

app.post("/api/users", async (c) => {
  const user = await getUser(c);
  if (!user) return unauthorized();
  const { username, password, userType } = await c.req.json();
  if (!username || !password) return c.json({ error: "Username and password required" }, 400);
  const existing = await c.env.DB.prepare("SELECT id FROM users WHERE username = ?").bind(username).first();
  if (existing) return c.json({ error: "Username already exists" }, 409);
  const passwordHash = await hashPassword(password);
  await c.env.DB.prepare("INSERT INTO users (username, password_hash, user_type) VALUES (?, ?, ?)")
    .bind(username, passwordHash, userType || 'tech').run();  const actor = await getUser(c);
  await writeLog(c.env.DB, actor?.username || '?', 'create_user', 'user', username, `Created user type=${userType || 'tech'}`);  return c.json({ ok: true });
});

app.put("/api/users/:id", async (c) => {
  const user = await getUser(c);
  if (!user) return unauthorized();
  const id = c.req.param("id");
  const { username, password, userType } = await c.req.json();
  if (password) {
    const passwordHash = await hashPassword(password);
    await c.env.DB.prepare("UPDATE users SET username = ?, password_hash = ?, user_type = ? WHERE id = ?")
      .bind(username, passwordHash, userType, id).run();
  } else {
    await c.env.DB.prepare("UPDATE users SET username = ?, user_type = ? WHERE id = ?")
      .bind(username, userType, id).run();
  }
  await writeLog(c.env.DB, user.username, 'update_user', 'user', username, `Updated user id=${id}`);
  return c.json({ ok: true });
});

app.delete("/api/users/:id", async (c) => {
  const user = await getUser(c);
  if (!user) return unauthorized();
  const id = c.req.param("id");
  await c.env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(id).run();
  await c.env.DB.prepare("DELETE FROM users WHERE id = ?").bind(id).run();
  await writeLog(c.env.DB, user.username, 'delete_user', 'user', id, `Deleted user id=${id}`);
  return c.json({ ok: true });
});

// ─── System Logs ──────────────────────────────────────────
app.get("/api/system-logs", async (c) => {
  const user = await getUser(c);
  if (!user) return unauthorized();
  if (user.userType !== 'admin') return c.json({ error: 'Forbidden' }, 403);
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM system_logs ORDER BY id DESC LIMIT 2000"
  ).all();
  return c.json(results || []);
});

// ─── Work Order Notes ─────────────────────────────────────
app.get("/api/work-orders/:number/notes", async (c) => {
  const user = await getUser(c);
  if (!user) return unauthorized();
  const woNumber = c.req.param("number");
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM work_order_notes WHERE work_order_number = ? ORDER BY created_at ASC"
  ).bind(woNumber).all();
  return c.json(results || []);
});

app.post("/api/work-orders/:number/notes", async (c) => {
  const user = await getUser(c);
  if (!user) return unauthorized();
  const woNumber = c.req.param("number");
  const { note } = await c.req.json();
  const now = new Date().toISOString();
  await c.env.DB.prepare(
    "INSERT INTO work_order_notes (work_order_number, note, author, created_at) VALUES (?, ?, ?, ?)"
  ).bind(woNumber, note, user.username, now).run();
  return c.json({ ok: true });
});

app.put("/api/work-order-notes/:id", async (c) => {
  const user = await getUser(c);
  if (!user) return unauthorized();
  const id = c.req.param("id");
  const { note } = await c.req.json();
  const now = new Date().toISOString();
  await c.env.DB.prepare("UPDATE work_order_notes SET note = ?, updated_at = ? WHERE id = ?")
    .bind(note, now, id).run();
  return c.json({ ok: true });
});

app.delete("/api/work-order-notes/:id", async (c) => {
  const user = await getUser(c);
  if (!user) return unauthorized();
  const id = c.req.param("id");
  await c.env.DB.prepare("DELETE FROM work_order_notes WHERE id = ?").bind(id).run();
  return c.json({ ok: true });
});

// ─── Properties ───────────────────────────────────────────
app.get("/api/properties", async (c) => {
  const user = await getUser(c);
  if (!user) return unauthorized();
  const { results } = await c.env.DB.prepare("SELECT * FROM properties ORDER BY id ASC").all();
  return c.json(
    (results || []).map((p: any) => ({
      id: p.id,
      propertyName: p.property_name,
      address: p.address,
      street: p.street,
      city: p.city,
      state: p.state,
      zip: p.zip,
      ownerName: p.owner_name,
      ownerPhone: p.owner_phone,
    }))
  );
});

app.post("/api/properties", async (c) => {
  const user = await getUser(c);
  if (!user) return unauthorized();
  const body = await c.req.json();
  const { propertyName, address, street, city, state, zip, ownerName, ownerPhone } = body;
  await c.env.DB.prepare(
    "INSERT INTO properties (property_name, address, street, city, state, zip, owner_name, owner_phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  )
    .bind(propertyName, address, street, city, state, zip, ownerName, ownerPhone)
    .run();
  await writeLog(c.env.DB, user.username, 'create_property', 'property', propertyName, `Created property`);
  return c.json({ ok: true });
});

app.delete("/api/properties/:id", async (c) => {
  const user = await getUser(c);
  if (!user) return unauthorized();
  const id = c.req.param("id");
  await c.env.DB.prepare("DELETE FROM properties WHERE id = ?").bind(id).run();
  await writeLog(c.env.DB, user.username, 'delete_property', 'property', id, `Deleted property id=${id}`);
  return c.json({ ok: true });
});

app.put("/api/properties/:id", async (c) => {
  const user = await getUser(c);
  if (!user) return unauthorized();
  const id = c.req.param("id");
  const { propertyName, address, street, city, state, zip, ownerName, ownerPhone } = await c.req.json();
  await c.env.DB.prepare(
    "UPDATE properties SET property_name=?, address=?, street=?, city=?, state=?, zip=?, owner_name=?, owner_phone=? WHERE id=?"
  ).bind(propertyName, address, street, city, state, zip, ownerName, ownerPhone, id).run();
  await writeLog(c.env.DB, user.username, 'update_property', 'property', propertyName, `Updated property id=${id}`);
  return c.json({ ok: true });
});

// ─── Work Orders ──────────────────────────────────────────
app.get("/api/work-orders", async (c) => {
  const user = await getUser(c);
  if (!user) return unauthorized();
  const { results: orders } = await c.env.DB.prepare("SELECT * FROM work_orders ORDER BY id ASC").all();
  const enriched = await Promise.all(
    (orders || []).map(async (wo: any) => {
      const { results: history } = await c.env.DB.prepare(
        "SELECT status, timestamp, changed_by FROM work_order_history WHERE work_order_number = ? ORDER BY id ASC"
      )
        .bind(wo.number)
        .all();
      return {
        number: wo.number,
        propertyName: wo.property_name,
        title: wo.title,
        instructions: wo.instructions,
        scheduledTime: wo.scheduled_time,
        scheduledDate: wo.scheduled_date,
        status: wo.status,
        completedAt: wo.completed_at,
        assignedTo: wo.assigned_to || '',
        createdBy: wo.created_by || '',
        history: (history || []).map((h: any) => ({ status: h.status, timestamp: h.timestamp, changedBy: h.changed_by || '' })),
      };
    })
  );
  return c.json(enriched);
});

app.post("/api/work-orders", async (c) => {
  const user = await getUser(c);
  if (!user) return unauthorized();
  const body = await c.req.json();
  const { number, propertyName, title, instructions, scheduledTime, scheduledDate } = body;
  const now = new Date().toISOString();
  await c.env.DB.prepare(
    "INSERT INTO work_orders (number, property_name, title, instructions, scheduled_time, scheduled_date, status) VALUES (?, ?, ?, ?, ?, ?, 'draft')"
  )
    .bind(number, propertyName, title, instructions, scheduledTime, scheduledDate)
    .run();
  await c.env.DB.prepare("INSERT INTO work_order_history (work_order_number, status, timestamp) VALUES (?, 'draft', ?)")
    .bind(number, now)
    .run();  await writeLog(c.env.DB, user.username, 'create_workorder', 'workorder', number, `Created WO: ${title} (${propertyName})`);  return c.json({ ok: true });
});

app.get("/api/work-orders/next-number", async (c) => {
  const user = await getUser(c);
  if (!user) return unauthorized();
  const last = await c.env.DB.prepare("SELECT number FROM work_orders ORDER BY id DESC LIMIT 1").first();
  if (!last) return c.json({ number: "WO-1001" });
  const num = parseInt((last.number as string).replace("WO-", "")) + 1;
  return c.json({ number: `WO-${num}` });
});

app.put("/api/work-orders/:number/status", async (c) => {
  const user = await getUser(c);
  if (!user) return unauthorized();
  const woNumber = c.req.param("number");
  const { status, timestamp } = await c.req.json();
  const now = timestamp || new Date().toISOString();

  if (status === "completed") {
    await c.env.DB.prepare("UPDATE work_orders SET status = ?, completed_at = ? WHERE number = ?")
      .bind(status, now, woNumber)
      .run();
  } else {
    await c.env.DB.prepare("UPDATE work_orders SET status = ? WHERE number = ?").bind(status, woNumber).run();
  }
  await c.env.DB.prepare("INSERT INTO work_order_history (work_order_number, status, timestamp, changed_by) VALUES (?, ?, ?, ?)")    .bind(woNumber, status, now, user.username)
    .run();
  await writeLog(c.env.DB, user.username, 'update_workorder', 'workorder', woNumber, `Status changed to ${status}`);
  return c.json({ ok: true });
});

app.put("/api/work-orders/:number/assign", async (c) => {
  const user = await getUser(c);
  if (!user) return unauthorized();
  const woNumber = c.req.param("number");
  const { assignedTo } = await c.req.json();
  await c.env.DB.prepare("UPDATE work_orders SET assigned_to = ? WHERE number = ?").bind(assignedTo || '', woNumber).run();
  const now2 = new Date().toISOString();
  const label = assignedTo ? `assigned:${assignedTo}` : 'unassigned';
  await c.env.DB.prepare("INSERT INTO work_order_history (work_order_number, status, timestamp, changed_by) VALUES (?, ?, ?, ?)").bind(woNumber, label, now2, user.username).run();
  await writeLog(c.env.DB, user.username, 'assign_workorder', 'workorder', woNumber, `Assigned to: ${assignedTo || '(none)'}`);
  return c.json({ ok: true });
});

app.put("/api/work-orders/:number", async (c) => {
  const user = await getUser(c);
  if (!user) return unauthorized();
  const woNumber = c.req.param("number");
  const { propertyName, title, instructions, scheduledDate, scheduledTime, assignedTo } = await c.req.json();
  await c.env.DB.prepare(
    "UPDATE work_orders SET property_name = ?, title = ?, instructions = ?, scheduled_date = ?, scheduled_time = ?, assigned_to = ? WHERE number = ?"
  ).bind(propertyName, title, instructions, scheduledDate, scheduledTime, assignedTo ?? '', woNumber).run();
  await writeLog(c.env.DB, user.username, 'update_workorder', 'workorder', woNumber, `Updated WO details`);
  return c.json({ ok: true });
});

app.delete("/api/work-orders/:number", async (c) => {
  const user = await getUser(c);
  if (!user) return unauthorized();
  const woNumber = c.req.param("number");
  const now = new Date().toISOString();
  await c.env.DB.prepare("UPDATE work_orders SET status = 'deleted' WHERE number = ?").bind(woNumber).run();
  await c.env.DB.prepare("INSERT INTO work_order_history (work_order_number, status, timestamp, changed_by) VALUES (?, 'deleted', ?, ?)")    .bind(woNumber, now, user.username).run();
  await writeLog(c.env.DB, user.username, 'delete_workorder', 'workorder', woNumber, `Work order marked deleted`);
  return c.json({ ok: true });
});

// ─── Vendors ──────────────────────────────────────────────
app.get("/api/vendors", async (c) => {
  const user = await getUser(c);
  if (!user) return unauthorized();
  const { results } = await c.env.DB.prepare("SELECT * FROM vendors ORDER BY id ASC").all();
  return c.json(
    (results || []).map((v: any) => ({
      name: v.name,
      category: v.category,
      contactName: v.contact_name,
      contactNumber: v.contact_number,
      contactEmail: v.contact_email,
      address: v.address,
    }))
  );
});

app.post("/api/vendors", async (c) => {
  const user = await getUser(c);
  if (!user) return unauthorized();
  const { name, category, contactName, contactNumber, contactEmail, address } = await c.req.json();
  await c.env.DB.prepare(
    "INSERT INTO vendors (name, category, contact_name, contact_number, contact_email, address) VALUES (?, ?, ?, ?, ?, ?)"
  )
    .bind(name, category, contactName, contactNumber, contactEmail, address)
    .run();
  return c.json({ ok: true });
});

// ─── Purchases ────────────────────────────────────────────
app.get("/api/purchases", async (c) => {
  const user = await getUser(c);
  if (!user) return unauthorized();
  const { results } = await c.env.DB.prepare("SELECT * FROM purchases ORDER BY id ASC").all();
  return c.json(
    (results || []).map((p: any) => ({
      date: p.date,
      workOrderNumber: p.work_order_number,
      vendor: p.vendor,
      price: p.price,
      purchaser: p.purchaser,
      purpose: p.purpose,
    }))
  );
});

app.post("/api/purchases", async (c) => {
  const user = await getUser(c);
  if (!user) return unauthorized();
  const { date, workOrderNumber, vendor, price, purchaser, purpose } = await c.req.json();
  await c.env.DB.prepare(
    "INSERT INTO purchases (date, work_order_number, vendor, price, purchaser, purpose) VALUES (?, ?, ?, ?, ?, ?)"
  )
    .bind(date, workOrderNumber, vendor, price, purchaser, purpose)
    .run();
  return c.json({ ok: true });
});

// ─── Inventory Items ──────────────────────────────────────
app.get("/api/inventory-items", async (c) => {
  const user = await getUser(c);
  if (!user) return unauthorized();
  const { results } = await c.env.DB.prepare("SELECT * FROM inventory_items ORDER BY id ASC").all();
  return c.json(
    (results || []).map((i: any) => ({
      id: i.item_id,
      name: i.name,
      category: i.category,
      price: i.price,
      cost: i.cost,
      partNumber: i.part_number,
    }))
  );
});

app.post("/api/inventory-items", async (c) => {
  const user = await getUser(c);
  if (!user) return unauthorized();
  const { id: itemId, name, category, price, cost, partNumber } = await c.req.json();
  await c.env.DB.prepare(
    "INSERT INTO inventory_items (item_id, name, category, price, cost, part_number) VALUES (?, ?, ?, ?, ?, ?)"
  )
    .bind(itemId, name, category, price, cost, partNumber)
    .run();
  return c.json({ ok: true });
});

app.get("/api/inventory-items/next-id", async (c) => {
  const user = await getUser(c);
  if (!user) return unauthorized();
  const last = await c.env.DB.prepare("SELECT COUNT(*) as cnt FROM inventory_items").first();
  const cnt = (last?.cnt as number) || 0;
  return c.json({ id: "INV-" + (cnt + 1).toString().padStart(4, "0") });
});

// ─── Inventory Categories ─────────────────────────────────
app.get("/api/inventory-categories", async (c) => {
  const user = await getUser(c);
  if (!user) return unauthorized();
  const { results } = await c.env.DB.prepare("SELECT * FROM inventory_categories ORDER BY id ASC").all();
  return c.json((results || []).map((cat: any) => ({ name: cat.name })));
});

app.post("/api/inventory-categories", async (c) => {
  const user = await getUser(c);
  if (!user) return unauthorized();
  const { name } = await c.req.json();
  await c.env.DB.prepare("INSERT INTO inventory_categories (name) VALUES (?)").bind(name).run();
  return c.json({ ok: true });
});

// ─── Work Order Photos ────────────────────────────────────
app.get("/api/work-orders/:number/photos", async (c) => {
  const user = await getUser(c);
  if (!user) return unauthorized();
  const woNumber = c.req.param("number");
  const { results } = await c.env.DB.prepare(
    "SELECT id, filename, mime_type, created_at FROM work_order_photos WHERE work_order_number = ? ORDER BY id ASC"
  )
    .bind(woNumber)
    .all();
  return c.json(
    (results || []).map((p: any) => ({
      id: p.id,
      filename: p.filename,
      mimeType: p.mime_type,
      createdAt: p.created_at,
    }))
  );
});

app.post("/api/work-orders/:number/photos", async (c) => {
  const user = await getUser(c);
  if (!user) return unauthorized();
  const woNumber = c.req.param("number");
  const { filename, mimeType, data } = await c.req.json();
  if (!filename || !mimeType || !data) {
    return c.json({ error: "filename, mimeType, and data are required" }, 400);
  }
  await c.env.DB.prepare(
    "INSERT INTO work_order_photos (work_order_number, filename, mime_type, data) VALUES (?, ?, ?, ?)"
  )
    .bind(woNumber, filename, mimeType, data)
    .run();
  return c.json({ ok: true });
});

app.get("/api/work-order-photos/:id", async (c) => {
  const user = await getUser(c);
  if (!user) return unauthorized();
  const photoId = c.req.param("id");
  const photo = await c.env.DB.prepare(
    "SELECT data, mime_type FROM work_order_photos WHERE id = ?"
  )
    .bind(photoId)
    .first();
  if (!photo) return c.json({ error: "Photo not found" }, 404);
  return c.json({ data: photo.data, mimeType: photo.mime_type });
});

app.delete("/api/work-order-photos/:id", async (c) => {
  const user = await getUser(c);
  if (!user) return unauthorized();
  const photoId = c.req.param("id");
  await c.env.DB.prepare("DELETE FROM work_order_photos WHERE id = ?").bind(photoId).run();
  return c.json({ ok: true });
});

// ─── Estimates ────────────────────────────────────────────
app.get("/api/estimates", async (c) => {
  const user = await getUser(c);
  if (!user) return unauthorized();
  const { results } = await c.env.DB.prepare("SELECT * FROM estimates ORDER BY id ASC").all();
  return c.json(
    (results || []).map((e: any) => ({
      id: e.id,
      number: e.number,
      propertyName: e.property_name,
      title: e.title,
      description: e.description,
      estimatedCost: e.estimated_cost,
      status: e.status,
      convertedTo: e.converted_to,
      createdAt: e.created_at,
    }))
  );
});

app.get("/api/estimates/next-number", async (c) => {
  const user = await getUser(c);
  if (!user) return unauthorized();
  const row = await c.env.DB.prepare("SELECT MAX(id) as maxId FROM estimates").first();
  const maxId = (row?.maxId as number) || 0;
  return c.json({ number: `EST-${1001 + maxId}` });
});

app.post("/api/estimates", async (c) => {
  const user = await getUser(c);
  if (!user) return unauthorized();
  const { number, propertyName, title, description, estimatedCost } = await c.req.json();
  await c.env.DB.prepare(
    "INSERT INTO estimates (number, property_name, title, description, estimated_cost, status) VALUES (?, ?, ?, ?, ?, 'pending')"
  ).bind(number, propertyName, title, description, estimatedCost || '').run();
  return c.json({ ok: true });
});

app.put("/api/estimates/:number", async (c) => {
  const user = await getUser(c);
  if (!user) return unauthorized();
  const estNumber = c.req.param("number");
  const { propertyName, title, description, estimatedCost } = await c.req.json();
  await c.env.DB.prepare(
    "UPDATE estimates SET property_name = ?, title = ?, description = ?, estimated_cost = ? WHERE number = ?"
  ).bind(propertyName, title, description, estimatedCost || '', estNumber).run();
  return c.json({ ok: true });
});

app.put("/api/estimates/:number/status", async (c) => {
  const user = await getUser(c);
  if (!user) return unauthorized();
  const estNumber = c.req.param("number");
  const { status, convertedTo } = await c.req.json();
  if (convertedTo) {
    await c.env.DB.prepare("UPDATE estimates SET status = ?, converted_to = ? WHERE number = ?")
      .bind(status, convertedTo, estNumber).run();
  } else {
    await c.env.DB.prepare("UPDATE estimates SET status = ? WHERE number = ?")
      .bind(status, estNumber).run();
  }
  return c.json({ ok: true });
});

app.delete("/api/estimates/:number", async (c) => {
  const user = await getUser(c);
  if (!user) return unauthorized();
  const estNumber = c.req.param("number");
  await c.env.DB.prepare("DELETE FROM estimates WHERE number = ?").bind(estNumber).run();
  return c.json({ ok: true });
});

// ─── All Expenses (for dashboard revenue) ───────────────
app.get("/api/expenses/all", async (c) => {
  const user = await getUser(c);
  if (!user) return unauthorized();
  const { results } = await c.env.DB.prepare(
    `SELECT e.total_cost, e.created_at, w.status, w.scheduled_date
     FROM work_order_expenses e
     JOIN work_orders w ON e.work_order_number = w.number
     ORDER BY e.created_at DESC`
  ).all();
  return c.json(results || []);
});

// ─── Work Order Expenses ──────────────────────────────────
app.get("/api/work-orders/:number/expenses", async (c) => {
  const user = await getUser(c);
  if (!user) return unauthorized();
  const woNumber = c.req.param("number");
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM work_order_expenses WHERE work_order_number = ? ORDER BY id ASC"
  ).bind(woNumber).all();
  return c.json(
    (results || []).map((e: any) => ({
      id: e.id,
      workOrderNumber: e.work_order_number,
      description: e.description,
      category: e.category,
      quantity: e.quantity,
      unitCost: e.unit_cost,
      totalCost: e.total_cost,
      vendor: e.vendor,
      partNumber: e.part_number,
      createdAt: e.created_at,
    }))
  );
});

app.post("/api/work-orders/:number/expenses", async (c) => {
  const user = await getUser(c);
  if (!user) return unauthorized();
  const woNumber = c.req.param("number");
  const { description, category, quantity, unitCost, totalCost, vendor, partNumber } = await c.req.json();
  if (!description) return c.json({ error: "description is required" }, 400);
  await c.env.DB.prepare(
    "INSERT INTO work_order_expenses (work_order_number, description, category, quantity, unit_cost, total_cost, vendor, part_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  ).bind(woNumber, description, category || 'Part', quantity || '1', unitCost || '0', totalCost || '0', vendor || '', partNumber || '').run();
  return c.json({ ok: true });
});

app.delete("/api/work-order-expenses/:id", async (c) => {
  const user = await getUser(c);
  if (!user) return unauthorized();
  const expenseId = c.req.param("id");
  await c.env.DB.prepare("DELETE FROM work_order_expenses WHERE id = ?").bind(expenseId).run();
  return c.json({ ok: true });
});

// ─── Team Profiles ────────────────────────────────────────
app.get("/api/team/profiles", async (c) => {
  const user = await getUser(c);
  if (!user) return unauthorized();
  const users = await c.env.DB.prepare("SELECT id, username, user_type FROM users WHERE username != 'root' ORDER BY username ASC").all();
  const profiles = await c.env.DB.prepare("SELECT * FROM team_profiles").all();
  const profileMap: Record<number, any> = {};
  (profiles.results || []).forEach((p: any) => { profileMap[p.user_id] = p; });
  const result = (users.results || []).map((u: any) => ({
    userId: u.id, username: u.username, userType: u.user_type,
    schedule: profileMap[u.id] ? JSON.parse(profileMap[u.id].schedule || '{}') : {},
    payRate: profileMap[u.id]?.pay_rate || '0',
    ptoTotal: profileMap[u.id]?.pto_total || 0,
    ptoUsed: profileMap[u.id]?.pto_used || 0,
    sickTotal: profileMap[u.id]?.sick_total || 0,
    sickUsed: profileMap[u.id]?.sick_used || 0,
    notes: profileMap[u.id]?.notes || '',
  }));
  return c.json(result);
});

app.put("/api/team/profiles/:userId", async (c) => {
  const user = await getUser(c);
  if (!user) return unauthorized();
  const userId = parseInt(c.req.param("userId"));
  const { schedule, payRate, ptoTotal, ptoUsed, sickTotal, sickUsed, notes } = await c.req.json();
  const now = new Date().toISOString();
  await c.env.DB.prepare(`INSERT INTO team_profiles (user_id, schedule, pay_rate, pto_total, pto_used, sick_total, sick_used, notes, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET schedule=excluded.schedule, pay_rate=excluded.pay_rate,
    pto_total=excluded.pto_total, pto_used=excluded.pto_used, sick_total=excluded.sick_total,
    sick_used=excluded.sick_used, notes=excluded.notes, updated_at=excluded.updated_at`)
    .bind(userId, JSON.stringify(schedule || {}), payRate || '0', ptoTotal || 0, ptoUsed || 0, sickTotal || 0, sickUsed || 0, notes || '', now).run();
  return c.json({ ok: true });
});

// ─── Days Off ─────────────────────────────────────────────
app.get("/api/team/days-off", async (c) => {
  const user = await getUser(c);
  if (!user) return unauthorized();
  const rows = await c.env.DB.prepare(
    "SELECT d.*, u.username FROM days_off d JOIN users u ON d.user_id = u.id ORDER BY d.date ASC"
  ).all();
  return c.json(rows.results || []);
});

app.post("/api/team/days-off", async (c) => {
  const user = await getUser(c);
  if (!user) return unauthorized();
  const { userId, date, reason, type } = await c.req.json();
  const now = new Date().toISOString();
  const res = await c.env.DB.prepare(
    "INSERT INTO days_off (user_id, date, reason, type, status, created_at) VALUES (?, ?, ?, ?, 'approved', ?)"
  ).bind(userId, date, reason || '', type || 'PTO', now).run();
  // Deduct from balance
  if (type === 'PTO') {
    await c.env.DB.prepare(`INSERT INTO team_profiles (user_id, schedule, pay_rate, pto_total, pto_used, sick_total, sick_used, notes, updated_at)
      VALUES (?, '{}', '0', 0, 1, 0, 0, '', ?)
      ON CONFLICT(user_id) DO UPDATE SET pto_used = pto_used + 1, updated_at = excluded.updated_at`
    ).bind(userId, now).run();
  } else if (type === 'Sick') {
    await c.env.DB.prepare(`INSERT INTO team_profiles (user_id, schedule, pay_rate, pto_total, pto_used, sick_total, sick_used, notes, updated_at)
      VALUES (?, '{}', '0', 0, 0, 0, 1, '', ?)
      ON CONFLICT(user_id) DO UPDATE SET sick_used = sick_used + 1, updated_at = excluded.updated_at`
    ).bind(userId, now).run();
  }
  return c.json({ ok: true, id: res.meta?.last_row_id });
});

app.delete("/api/team/days-off/:id", async (c) => {
  const user = await getUser(c);
  if (!user) return unauthorized();
  const id = c.req.param("id");
  // Look up type + user before deleting to restore balance
  const row = await c.env.DB.prepare("SELECT user_id, type FROM days_off WHERE id = ?").bind(id).first();
  await c.env.DB.prepare("DELETE FROM days_off WHERE id = ?").bind(id).run();
  if (row) {
    const now = new Date().toISOString();
    if (row.type === 'PTO') {
      await c.env.DB.prepare(`UPDATE team_profiles SET pto_used = MAX(0, pto_used - 1), updated_at = ? WHERE user_id = ?`).bind(now, row.user_id).run();
    } else if (row.type === 'Sick') {
      await c.env.DB.prepare(`UPDATE team_profiles SET sick_used = MAX(0, sick_used - 1), updated_at = ? WHERE user_id = ?`).bind(now, row.user_id).run();
    }
  }
  return c.json({ ok: true });
});

// ─── Recurring Work Orders ────────────────────────────────
app.get("/api/recurring", async (c) => {
  const user = await getUser(c);
  if (!user) return unauthorized();
  const rows = await c.env.DB.prepare("SELECT * FROM recurring_items ORDER BY title ASC").all();
  return c.json(rows.results || []);
});

app.post("/api/recurring", async (c) => {
  const user = await getUser(c);
  if (!user) return unauthorized();
  const b = await c.req.json();
  const now = new Date().toISOString();
  const res = await c.env.DB.prepare(
    `INSERT INTO recurring_items (title, property_name, instructions, frequency, day_of_week, day_of_month, assigned_to, active, last_generated, next_due, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(b.title || '', b.property_name || '', b.instructions || '', b.frequency || 'monthly',
    b.day_of_week || '', b.day_of_month || 1, b.assigned_to || '', b.active !== false ? 1 : 0,
    b.last_generated || '', b.next_due || '', b.notes || '', now, now).run();
  await writeLog(c.env.DB, user.username, 'create', 'recurring', b.title, 'Created recurring WO');
  return c.json({ ok: true, id: res.meta?.last_row_id });
});

app.put("/api/recurring/:id", async (c) => {
  const user = await getUser(c);
  if (!user) return unauthorized();
  const id = c.req.param("id");
  const b = await c.req.json();
  const now = new Date().toISOString();
  await c.env.DB.prepare(
    `UPDATE recurring_items SET title=?, property_name=?, instructions=?, frequency=?, day_of_week=?, day_of_month=?, assigned_to=?, active=?, last_generated=?, next_due=?, notes=?, updated_at=? WHERE id=?`
  ).bind(b.title || '', b.property_name || '', b.instructions || '', b.frequency || 'monthly',
    b.day_of_week || '', b.day_of_month || 1, b.assigned_to || '', b.active !== false ? 1 : 0,
    b.last_generated || '', b.next_due || '', b.notes || '', now, id).run();
  await writeLog(c.env.DB, user.username, 'update', 'recurring', b.title, 'Updated recurring WO');
  return c.json({ ok: true });
});

app.delete("/api/recurring/:id", async (c) => {
  const user = await getUser(c);
  if (!user) return unauthorized();
  const id = c.req.param("id");
  await c.env.DB.prepare("DELETE FROM recurring_items WHERE id = ?").bind(id).run();
  return c.json({ ok: true });
});

// ─── Internal Services ────────────────────────────────────
app.get("/api/internal-services", async (c) => {
  const user = await getUser(c);
  if (!user) return unauthorized();
  const rows = await c.env.DB.prepare("SELECT * FROM internal_services ORDER BY category ASC, title ASC").all();
  return c.json(rows.results || []);
});

app.post("/api/internal-services", async (c) => {
  const user = await getUser(c);
  if (!user) return unauthorized();
  const b = await c.req.json();
  const now = new Date().toISOString();
  const res = await c.env.DB.prepare(
    `INSERT INTO internal_services (title, category, description, frequency, day_of_week, day_of_month, assigned_to, active, last_completed, next_due, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(b.title || '', b.category || 'general', b.description || '', b.frequency || 'monthly',
    b.day_of_week || '', b.day_of_month || 1, b.assigned_to || '', b.active !== false ? 1 : 0,
    b.last_completed || '', b.next_due || '', b.notes || '', now, now).run();
  await writeLog(c.env.DB, user.username, 'create', 'internal_service', b.title, `Created ${b.category} service`);
  return c.json({ ok: true, id: res.meta?.last_row_id });
});

app.put("/api/internal-services/:id", async (c) => {
  const user = await getUser(c);
  if (!user) return unauthorized();
  const id = c.req.param("id");
  const b = await c.req.json();
  const now = new Date().toISOString();
  await c.env.DB.prepare(
    `UPDATE internal_services SET title=?, category=?, description=?, frequency=?, day_of_week=?, day_of_month=?, assigned_to=?, active=?, last_completed=?, next_due=?, notes=?, updated_at=? WHERE id=?`
  ).bind(b.title || '', b.category || 'general', b.description || '', b.frequency || 'monthly',
    b.day_of_week || '', b.day_of_month || 1, b.assigned_to || '', b.active !== false ? 1 : 0,
    b.last_completed || '', b.next_due || '', b.notes || '', now, id).run();
  await writeLog(c.env.DB, user.username, 'update', 'internal_service', b.title, `Updated ${b.category} service`);
  return c.json({ ok: true });
});

app.delete("/api/internal-services/:id", async (c) => {
  const user = await getUser(c);
  if (!user) return unauthorized();
  const id = c.req.param("id");
  await c.env.DB.prepare("DELETE FROM internal_services WHERE id = ?").bind(id).run();
  return c.json({ ok: true });
});

// ─── Personal Settings ──────────────────────────────────────
app.put("/api/auth/me", async (c) => {
  const user = await getUser(c);
  if (!user) return unauthorized();
  const { newUsername, currentPassword, newPassword } = await c.req.json();
  // Verify current password
  const row = await c.env.DB.prepare("SELECT password_hash FROM users WHERE id = ?").bind(user.id).first();
  if (!row) return c.json({ error: 'User not found' }, 404);
  const encoder = new TextEncoder();
  const checkHash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(currentPassword || '')))).map(b => b.toString(16).padStart(2,'0')).join('');
  if (checkHash !== row.password_hash) return c.json({ error: 'Current password is incorrect' }, 400);
  const updates: string[] = [];
  const binds: (string | number)[] = [];
  if (newUsername && newUsername !== user.username) {
    const existing = await c.env.DB.prepare("SELECT id FROM users WHERE username = ? AND id != ?").bind(newUsername, user.id).first();
    if (existing) return c.json({ error: 'Username already taken' }, 400);
    updates.push('username = ?'); binds.push(newUsername);
  }
  if (newPassword) {
    if (newPassword.length < 4) return c.json({ error: 'New password must be at least 4 characters' }, 400);
    const newHash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(newPassword)))).map(b => b.toString(16).padStart(2,'0')).join('');
    updates.push('password_hash = ?'); binds.push(newHash);
  }
  if (updates.length === 0) return c.json({ ok: true, message: 'No changes made' });
  binds.push(user.id);
  await c.env.DB.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).bind(...binds).run();
  await writeLog(c.env.DB, user.username, 'update', 'user', user.username, 'Updated personal settings');
  return c.json({ ok: true });
});

export default app;
