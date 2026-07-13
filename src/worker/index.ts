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
async function getUser(c: any): Promise<{ id: number; username: string } | null> {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const session = await c.env.DB.prepare(
    "SELECT s.user_id, u.username FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ? AND s.expires_at > datetime('now')"
  )
    .bind(token)
    .first();
  if (!session) return null;
  return { id: session.user_id as number, username: session.username as string };
}

function unauthorized() {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

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
  const user = await c.env.DB.prepare("SELECT id, username FROM users WHERE username = ? AND password_hash = ?")
    .bind(username, passwordHash)
    .first();
  if (!user) return c.json({ error: "Invalid username or password" }, 401);

  const token = generateToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days
  await c.env.DB.prepare("INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)")
    .bind(user.id, token, expiresAt)
    .run();

  return c.json({ ok: true, token, user: { id: user.id, username: user.username } });
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
  return c.json({ ok: true });
});

app.delete("/api/properties/:id", async (c) => {
  const user = await getUser(c);
  if (!user) return unauthorized();
  const id = c.req.param("id");
  await c.env.DB.prepare("DELETE FROM properties WHERE id = ?").bind(id).run();
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
        "SELECT status, timestamp FROM work_order_history WHERE work_order_number = ? ORDER BY id ASC"
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
        history: history || [],
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
    .run();
  return c.json({ ok: true });
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
  const { status } = await c.req.json();
  const now = new Date().toISOString();

  if (status === "completed") {
    await c.env.DB.prepare("UPDATE work_orders SET status = ?, completed_at = ? WHERE number = ?")
      .bind(status, now, woNumber)
      .run();
  } else {
    await c.env.DB.prepare("UPDATE work_orders SET status = ? WHERE number = ?").bind(status, woNumber).run();
  }
  await c.env.DB.prepare("INSERT INTO work_order_history (work_order_number, status, timestamp) VALUES (?, ?, ?)")
    .bind(woNumber, status, now)
    .run();
  return c.json({ ok: true });
});

app.put("/api/work-orders/:number", async (c) => {
  const user = await getUser(c);
  if (!user) return unauthorized();
  const woNumber = c.req.param("number");
  const { propertyName, title, instructions, scheduledDate, scheduledTime } = await c.req.json();
  await c.env.DB.prepare(
    "UPDATE work_orders SET property_name = ?, title = ?, instructions = ?, scheduled_date = ?, scheduled_time = ? WHERE number = ?"
  ).bind(propertyName, title, instructions, scheduledDate, scheduledTime, woNumber).run();
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

export default app;
