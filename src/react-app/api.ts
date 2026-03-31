// API client for Service Master
// All calls go through the Hono worker backend and use D1 for storage.

const TOKEN_KEY = "sm_auth_token";

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function apiFetch(path: string, opts: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return fetch(path, { ...opts, headers });
}

// ─── Auth ─────────────────────────────────────────────────
export async function initDb() {
  const res = await fetch("/api/init");
  return res.json();
}

export async function register(username: string, password: string) {
  const res = await apiFetch("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  return res.json();
}

export async function login(username: string, password: string) {
  const res = await apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (data.token) {
    setToken(data.token);
  }
  return data;
}

export async function logout() {
  await apiFetch("/api/auth/logout", { method: "POST" });
  clearToken();
}

export async function getMe() {
  const res = await apiFetch("/api/auth/me");
  if (res.status === 401) return null;
  const data = await res.json();
  return data.user || null;
}

// ─── Properties ───────────────────────────────────────────
export async function fetchProperties() {
  const res = await apiFetch("/api/properties");
  if (res.status === 401) throw new Error("Unauthorized");
  return res.json();
}

export async function createProperty(property: any) {
  const res = await apiFetch("/api/properties", {
    method: "POST",
    body: JSON.stringify(property),
  });
  return res.json();
}

export async function deleteProperty(id: number) {
  const res = await apiFetch(`/api/properties/${id}`, { method: "DELETE" });
  return res.json();
}

// ─── Work Orders ──────────────────────────────────────────
export async function fetchWorkOrders() {
  const res = await apiFetch("/api/work-orders");
  if (res.status === 401) throw new Error("Unauthorized");
  return res.json();
}

export async function createWorkOrder(wo: any) {
  const res = await apiFetch("/api/work-orders", {
    method: "POST",
    body: JSON.stringify(wo),
  });
  return res.json();
}

export async function fetchNextWorkOrderNumber() {
  const res = await apiFetch("/api/work-orders/next-number");
  const data = await res.json();
  return data.number as string;
}

export async function updateWorkOrderStatus(number: string, status: string) {
  const res = await apiFetch(`/api/work-orders/${number}/status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
  return res.json();
}

// ─── Vendors ──────────────────────────────────────────────
export async function fetchVendors() {
  const res = await apiFetch("/api/vendors");
  if (res.status === 401) throw new Error("Unauthorized");
  return res.json();
}

export async function createVendor(vendor: any) {
  const res = await apiFetch("/api/vendors", {
    method: "POST",
    body: JSON.stringify(vendor),
  });
  return res.json();
}

// ─── Purchases ────────────────────────────────────────────
export async function fetchPurchases() {
  const res = await apiFetch("/api/purchases");
  if (res.status === 401) throw new Error("Unauthorized");
  return res.json();
}

export async function createPurchase(purchase: any) {
  const res = await apiFetch("/api/purchases", {
    method: "POST",
    body: JSON.stringify(purchase),
  });
  return res.json();
}

// ─── Inventory Items ──────────────────────────────────────
export async function fetchInventoryItems() {
  const res = await apiFetch("/api/inventory-items");
  if (res.status === 401) throw new Error("Unauthorized");
  return res.json();
}

export async function createInventoryItem(item: any) {
  const res = await apiFetch("/api/inventory-items", {
    method: "POST",
    body: JSON.stringify(item),
  });
  return res.json();
}

export async function fetchNextInventoryItemId() {
  const res = await apiFetch("/api/inventory-items/next-id");
  const data = await res.json();
  return data.id as string;
}

// ─── Inventory Categories ─────────────────────────────────
export async function fetchInventoryCategories() {
  const res = await apiFetch("/api/inventory-categories");
  if (res.status === 401) throw new Error("Unauthorized");
  return res.json();
}

export async function createInventoryCategory(category: any) {
  const res = await apiFetch("/api/inventory-categories", {
    method: "POST",
    body: JSON.stringify(category),
  });
  return res.json();
}
