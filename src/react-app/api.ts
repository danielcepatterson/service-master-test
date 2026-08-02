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

export async function updateProperty(id: number, data: any) {
  const res = await apiFetch(`/api/properties/${id}`, { method: "PUT", body: JSON.stringify(data) });
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
    body: JSON.stringify({ status, timestamp: new Date().toISOString() }),
  });
  return res.json();
}

export async function updateWorkOrder(number: string, fields: {
  propertyName: string;
  title: string;
  instructions: string;
  scheduledDate: string;
  scheduledTime: string;
  assignedTo?: string;
}) {
  const res = await apiFetch(`/api/work-orders/${number}`, {
    method: "PUT",
    body: JSON.stringify(fields),
  });
  return res.json();
}

export async function assignWorkOrder(number: string, assignedTo: string) {
  const res = await apiFetch(`/api/work-orders/${number}/assign`, {
    method: "PUT",
    body: JSON.stringify({ assignedTo }),
  });
  return res.json();
}

export async function deleteWorkOrder(number: string) {
  const res = await apiFetch(`/api/work-orders/${number}`, { method: "DELETE" });
  return res.json();
}

// ─── User Management ─────────────────────────────────────
export async function fetchUsers() {
  const res = await apiFetch("/api/users");
  if (res.status === 401) throw new Error("Unauthorized");
  return res.json();
}

export async function createUser(data: { username: string; password: string; userType: string }) {
  const res = await apiFetch("/api/users", { method: "POST", body: JSON.stringify(data) });
  return res.json();
}

export async function updateUser(id: number, data: { username: string; password?: string; userType: string }) {
  const res = await apiFetch(`/api/users/${id}`, { method: "PUT", body: JSON.stringify(data) });
  return res.json();
}

export async function deleteUser(id: number) {
  const res = await apiFetch(`/api/users/${id}`, { method: "DELETE" });
  return res.json();
}

// ─── Work Order Notes ─────────────────────────────────────
export async function fetchWorkOrderNotes(workOrderNumber: string) {
  const res = await apiFetch(`/api/work-orders/${workOrderNumber}/notes`);
  return res.json();
}

export async function createWorkOrderNote(workOrderNumber: string, note: string) {
  const res = await apiFetch(`/api/work-orders/${workOrderNumber}/notes`, {
    method: "POST",
    body: JSON.stringify({ note }),
  });
  return res.json();
}

export async function updateWorkOrderNote(id: number, note: string) {
  const res = await apiFetch(`/api/work-order-notes/${id}`, {
    method: "PUT",
    body: JSON.stringify({ note }),
  });
  return res.json();
}

export async function deleteWorkOrderNote(id: number) {
  const res = await apiFetch(`/api/work-order-notes/${id}`, { method: "DELETE" });
  return res.json();
}

// ─── System Logs ──────────────────────────────────────────
export async function fetchSystemLogs() {
  const res = await apiFetch("/api/system-logs");
  if (res.status === 401 || res.status === 403) throw new Error('Forbidden');
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

// ─── Work Order Photos ────────────────────────────────────
export async function fetchWorkOrderPhotos(workOrderNumber: string) {
  const res = await apiFetch(`/api/work-orders/${workOrderNumber}/photos`);
  if (res.status === 401) throw new Error("Unauthorized");
  return res.json();
}

export async function uploadWorkOrderPhoto(
  workOrderNumber: string,
  filename: string,
  mimeType: string,
  data: string
) {
  const res = await apiFetch(`/api/work-orders/${workOrderNumber}/photos`, {
    method: "POST",
    body: JSON.stringify({ filename, mimeType, data }),
  });
  return res.json();
}

export async function fetchPhotoData(photoId: number) {
  const res = await apiFetch(`/api/work-order-photos/${photoId}`);
  if (res.status === 401) throw new Error("Unauthorized");
  return res.json();
}

export async function deleteWorkOrderPhoto(photoId: number) {
  const res = await apiFetch(`/api/work-order-photos/${photoId}`, {
    method: "DELETE",
  });
  return res.json();
}

// ─── Estimates ────────────────────────────────────────────
export async function fetchEstimates() {
  const res = await apiFetch("/api/estimates");
  if (res.status === 401) throw new Error("Unauthorized");
  return res.json();
}

export async function fetchNextEstimateNumber() {
  const res = await apiFetch("/api/estimates/next-number");
  const data = await res.json();
  return data.number as string;
}

export async function createEstimate(estimate: any) {
  const res = await apiFetch("/api/estimates", {
    method: "POST",
    body: JSON.stringify(estimate),
  });
  return res.json();
}

export async function updateEstimateStatus(number: string, status: string, convertedTo?: string) {
  const res = await apiFetch(`/api/estimates/${number}/status`, {
    method: "PUT",
    body: JSON.stringify({ status, convertedTo }),
  });
  return res.json();
}

export async function updateEstimate(number: string, fields: {
  propertyName: string;
  title: string;
  description: string;
  estimatedCost: string;
}) {
  const res = await apiFetch(`/api/estimates/${number}`, {
    method: "PUT",
    body: JSON.stringify(fields),
  });
  return res.json();
}

export async function deleteEstimate(number: string) {
  const res = await apiFetch(`/api/estimates/${number}`, { method: "DELETE" });
  return res.json();
}

// ─── Work Order Expenses ──────────────────────────────────
export async function fetchWorkOrderExpenses(workOrderNumber: string) {
  const res = await apiFetch(`/api/work-orders/${workOrderNumber}/expenses`);
  if (res.status === 401) throw new Error("Unauthorized");
  return res.json();
}

export async function createWorkOrderExpense(workOrderNumber: string, expense: {
  description: string;
  category: string;
  quantity: string;
  unitCost: string;
  totalCost: string;
  vendor: string;
  partNumber: string;
}) {
  const res = await apiFetch(`/api/work-orders/${workOrderNumber}/expenses`, {
    method: "POST",
    body: JSON.stringify(expense),
  });
  return res.json();
}

export async function deleteWorkOrderExpense(expenseId: number) {
  const res = await apiFetch(`/api/work-order-expenses/${expenseId}`, { method: "DELETE" });
  return res.json();
}

export async function fetchAllExpenses() {
  const res = await apiFetch("/api/expenses/all");
  return res.json();
}

// ─── Team ─────────────────────────────────────────────────
export async function fetchTeamProfiles() {
  const res = await apiFetch("/api/team/profiles");
  return res.json();
}

export async function saveTeamProfile(userId: number, data: {
  schedule: Record<string, { start: string; end: string; hours: number }>;
  payRate: string;
  ptoTotal: number;
  ptoUsed: number;
  sickTotal: number;
  sickUsed: number;
  notes: string;
}) {
  const res = await apiFetch(`/api/team/profiles/${userId}`, { method: "PUT", body: JSON.stringify(data) });
  return res.json();
}

export async function fetchDaysOff() {
  const res = await apiFetch("/api/team/days-off");
  return res.json();
}

export async function saveDayOff(data: { userId: number; date: string; reason: string; type: string }) {
  const res = await apiFetch("/api/team/days-off", { method: "POST", body: JSON.stringify(data) });
  return res.json();
}

export async function deleteDayOff(id: number) {
  const res = await apiFetch(`/api/team/days-off/${id}`, { method: "DELETE" });
  return res.json();
}

// ─── Recurring Work Orders ────────────────────────────────
export async function fetchRecurring() {
  const res = await apiFetch("/api/recurring");
  return res.json();
}

export async function saveRecurring(data: object, id?: number) {
  if (id) {
    const res = await apiFetch(`/api/recurring/${id}`, { method: "PUT", body: JSON.stringify(data) });
    return res.json();
  }
  const res = await apiFetch("/api/recurring", { method: "POST", body: JSON.stringify(data) });
  return res.json();
}

export async function deleteRecurring(id: number) {
  const res = await apiFetch(`/api/recurring/${id}`, { method: "DELETE" });
  return res.json();
}

// ─── Internal Services ────────────────────────────────────
export async function fetchInternalServices() {
  const res = await apiFetch("/api/internal-services");
  return res.json();
}

export async function saveInternalService(data: object, id?: number) {
  if (id) {
    const res = await apiFetch(`/api/internal-services/${id}`, { method: "PUT", body: JSON.stringify(data) });
    return res.json();
  }
  const res = await apiFetch("/api/internal-services", { method: "POST", body: JSON.stringify(data) });
  return res.json();
}

export async function deleteInternalService(id: number) {
  const res = await apiFetch(`/api/internal-services/${id}`, { method: "DELETE" });
  return res.json();
}

// ─── Personal Settings ──────────────────────────────────────
export async function updateProfile(data: { newUsername?: string; currentPassword: string; newPassword?: string }) {
  const res = await apiFetch('/api/auth/me', { method: 'PUT', body: JSON.stringify(data) });
  return res.json();
}
