import * as React from "react";
// @ts-ignore
import "./App.css";
import * as api from "./api";

type PropertyForm = {
  id?: number;
  propertyName: string;
  address: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  ownerName: string;
  ownerPhone: string;
};
type WorkOrderStatus = 'draft' | 'active' | 'completed' | 'closed';

type WorkOrderHistoryEntry = {
  status: WorkOrderStatus;
  timestamp: string; // ISO string
};

type WorkOrder = {
  number: string;
  propertyName: string;
  title: string;
  instructions: string;
  scheduledTime: string;
  scheduledDate: string;
  status: WorkOrderStatus;
  completedAt?: string;
  history: WorkOrderHistoryEntry[];
};
type VendorForm = {
  name: string;
  category: string;
  contactName: string;
  contactNumber: string;
  contactEmail: string;
  address: string;
};
type Purchase = {
  date: string;
  workOrderNumber: string;
  vendor: string;
  price: string;
  purchaser: string;
  purpose: string;
};
type InventoryItem = {
  id: string;
  name: string;
  category: string;
  price: string;
  cost: string;
  partNumber: string;
};
type InventoryCategory = {
  name: string;
};

type WorkOrderPhoto = {
  id: number;
  filename: string;
  mimeType: string;
  createdAt: string;
  data?: string; // base64 data when loaded
};

type EstimateStatus = 'pending' | 'converted' | 'rejected';

type Estimate = {
  id?: number;
  number: string;
  propertyName: string;
  title: string;
  description: string;
  estimatedCost: string;
  status: EstimateStatus;
  convertedTo?: string;
  createdAt?: string;
};

type WorkOrderExpense = {
  id: number;
  workOrderNumber: string;
  description: string;
  category: string;
  quantity: string;
  unitCost: string;
  totalCost: string;
  vendor: string;
  partNumber: string;
  createdAt?: string;
};

function App() {
  // ─── Auth state ─────────────────────────────────────────
  const [authUser, setAuthUser] = React.useState<{ id: number; username: string } | null>(null);
  const [authChecked, setAuthChecked] = React.useState(false);
  const [authPage, setAuthPage] = React.useState<'login' | 'register'>('login');
  const [authForm, setAuthForm] = React.useState({ username: '', password: '' });
  const [authError, setAuthError] = React.useState('');
  const [authLoading, setAuthLoading] = React.useState(false);

  // Check existing session on mount
  React.useEffect(() => {
    api.getMe().then((user) => {
      setAuthUser(user);
      setAuthChecked(true);
    });
  }, []);

  // Navigation
  const [page, setPage] = React.useState<string>("home");

  // Property state
  const [form, setForm] = React.useState<PropertyForm>({
    propertyName: "",
    address: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    ownerName: "",
    ownerPhone: "",
  });
  const [properties, setProperties] = React.useState<PropertyForm[]>([]);
  const [submitted, setSubmitted] = React.useState(false);

  // Work order state
  const [woForm, setWoForm] = React.useState<Omit<WorkOrder, 'number' | 'status' | 'history'> & { status?: WorkOrderStatus, history?: WorkOrderHistoryEntry[] }>({
    propertyName: '',
    title: '',
    instructions: '',
    scheduledTime: '',
    scheduledDate: '',
    status: 'draft',
    history: [],
  });
  const [workOrders, setWorkOrders] = React.useState<WorkOrder[]>([]);
  const [woSubmitted, setWoSubmitted] = React.useState(false);
  const [nextWoNumber, setNextWoNumber] = React.useState('WO-1001');

  // Vendor state
  const [vendorForm, setVendorForm] = React.useState<VendorForm>({
    name: '',
    category: '',
    contactName: '',
    contactNumber: '',
    contactEmail: '',
    address: '',
  });
  const [vendors, setVendors] = React.useState<VendorForm[]>([]);
  const [vendorSubmitted, setVendorSubmitted] = React.useState(false);

  // Purchases state
  const [purchaseForm, setPurchaseForm] = React.useState<Purchase>({
    date: '',
    workOrderNumber: '',
    vendor: '',
    price: '',
    purchaser: '',
    purpose: '',
  });
  const [purchases, setPurchases] = React.useState<Purchase[]>([]);
  const [purchaseSubmitted, setPurchaseSubmitted] = React.useState(false);

  // Inventory item state
  const [inventoryItemForm, setInventoryItemForm] = React.useState<InventoryItem>({
    id: '',
    name: '',
    category: '',
    price: '',
    cost: '',
    partNumber: '',
  });
  const [inventoryItems, setInventoryItems] = React.useState<InventoryItem[]>([]);
  const [inventoryItemSubmitted, setInventoryItemSubmitted] = React.useState(false);

  // Inventory category state
  const [inventoryCategoryForm, setInventoryCategoryForm] = React.useState<InventoryCategory>({ name: '' });
  const [inventoryCategories, setInventoryCategories] = React.useState<InventoryCategory[]>([]);
  const [inventoryCategorySubmitted, setInventoryCategorySubmitted] = React.useState(false);
  const [showCategoryList, setShowCategoryList] = React.useState(false);

  // Add state for viewing history
  const [viewHistoryWO, setViewHistoryWO] = React.useState<WorkOrder | null>(null);

  // Photo state
  const [selectedWOForPhotos, setSelectedWOForPhotos] = React.useState<WorkOrder | null>(null);
  const [woPhotos, setWoPhotos] = React.useState<WorkOrderPhoto[]>([]);
  const [photoLoading, setPhotoLoading] = React.useState(false);
  const [photoUploading, setPhotoUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const cameraInputRef = React.useRef<HTMLInputElement>(null);

  // Estimate state
  const [estimateForm, setEstimateForm] = React.useState<Omit<Estimate, 'number' | 'status'>>({ 
    propertyName: '', title: '', description: '', estimatedCost: '' 
  });
  const [estimates, setEstimates] = React.useState<Estimate[]>([]);
  const [estimateSubmitted, setEstimateSubmitted] = React.useState(false);
  const [nextEstimateNumber, setNextEstimateNumber] = React.useState('EST-1001');

  // Expense state
  const [selectedWOForExpenses, setSelectedWOForExpenses] = React.useState<WorkOrder | null>(null);
  const [woExpenses, setWoExpenses] = React.useState<WorkOrderExpense[]>([]);
  const [expenseLoading, setExpenseLoading] = React.useState(false);
  const [expenseForm, setExpenseForm] = React.useState({
    description: '', category: 'Part', quantity: '1', unitCost: '', totalCost: '', vendor: '', partNumber: ''
  });
  const [expenseSubmitting, setExpenseSubmitting] = React.useState(false);

  // Work order detail view
  const [viewingWO, setViewingWO] = React.useState<WorkOrder | null>(null);
  const [viewWOPhotos, setViewWOPhotos] = React.useState<WorkOrderPhoto[]>([]);
  const [viewWOExpenses, setViewWOExpenses] = React.useState<WorkOrderExpense[]>([]);
  const [viewWOLoading, setViewWOLoading] = React.useState(false);
  const [viewWOFromPage, setViewWOFromPage] = React.useState<string>('home');
  const [editingWODetails, setEditingWODetails] = React.useState(false);
  const [editWOForm, setEditWOForm] = React.useState({ propertyName: '', title: '', instructions: '', scheduledDate: '', scheduledTime: '' });
  const [editWOSaving, setEditWOSaving] = React.useState(false);

  // ─── Load all data from API when user is authenticated ──
  const loadAllData = React.useCallback(async () => {
    if (!authUser) return;
    try {
      const [props, wos, vends, purch, invItems, invCats, ests] = await Promise.all([
        api.fetchProperties(),
        api.fetchWorkOrders(),
        api.fetchVendors(),
        api.fetchPurchases(),
        api.fetchInventoryItems(),
        api.fetchInventoryCategories(),
        api.fetchEstimates(),
      ]);
      setProperties(props);
      setWorkOrders(wos);
      setVendors(vends);
      setPurchases(purch);
      setInventoryItems(invItems);
      setInventoryCategories(invCats);
      setEstimates(ests);
      const num = await api.fetchNextWorkOrderNumber();
      setNextWoNumber(num);
      const estNum = await api.fetchNextEstimateNumber();
      setNextEstimateNumber(estNum);
    } catch (e) {
      console.error("Failed to load data", e);
    }
  }, [authUser]);

  React.useEffect(() => {
    if (authUser) loadAllData();
  }, [authUser, loadAllData]);

  // ─── Auth handlers ──────────────────────────────────────
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      if (authPage === 'register') {
        const result = await api.register(authForm.username, authForm.password);
        if (result.error) { setAuthError(result.error); return; }
        // Auto-login after register
        const loginResult = await api.login(authForm.username, authForm.password);
        if (loginResult.error) { setAuthError(loginResult.error); return; }
        setAuthUser(loginResult.user);
      } else {
        const result = await api.login(authForm.username, authForm.password);
        if (result.error) { setAuthError(result.error); return; }
        setAuthUser(result.user);
      }
      setAuthForm({ username: '', password: '' });
    } catch {
      setAuthError('Network error. Make sure the database is initialized.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await api.logout();
    setAuthUser(null);
    setPage("home");
  };

  // ─── Handlers ───────────────────────────────────────────
  const handleWoFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setWoForm((prev: typeof woForm) => ({ ...prev, [name]: value }));
  };

  const handleWoFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newWO = {
      number: nextWoNumber,
      propertyName: woForm.propertyName,
      title: woForm.title,
      instructions: woForm.instructions,
      scheduledTime: woForm.scheduledTime,
      scheduledDate: woForm.scheduledDate,
    };
    await api.createWorkOrder(newWO);
    await loadAllData();
    setWoSubmitted(true);
    setWoForm({ propertyName: '', title: '', instructions: '', scheduledTime: '', scheduledDate: '', status: 'draft', history: [] });
  };

  const activateWorkOrder = async (number: string) => {
    await api.updateWorkOrderStatus(number, 'active');
    await loadAllData();
  };

  const completeWorkOrder = async (number: string) => {
    await api.updateWorkOrderStatus(number, 'completed');
    await loadAllData();
  };

  const closeWorkOrder = async (number: string) => {
    await api.updateWorkOrderStatus(number, 'closed');
    await loadAllData();
    setViewHistoryWO(null);
    setTimeout(() => {
      setPage('closedworkorders');
    }, 100);
  };

  const reactivateWorkOrder = async (number: string) => {
    if (!confirm('Reactivate this work order? It will return to Active Work Orders.')) return;
    await api.updateWorkOrderStatus(number, 'active');
    await loadAllData();
    setPage('workorderlist');
  };

  // ─── Photo Handlers ─────────────────────────────────────
  const loadPhotosForWorkOrder = async (wo: WorkOrder) => {
    setSelectedWOForPhotos(wo);
    setPhotoLoading(true);
    try {
      const photos = await api.fetchWorkOrderPhotos(wo.number);
      // Load actual image data for each photo
      const photosWithData = await Promise.all(
        photos.map(async (p: WorkOrderPhoto) => {
          const photoData = await api.fetchPhotoData(p.id);
          return { ...p, data: photoData.data };
        })
      );
      setWoPhotos(photosWithData);
    } catch (e) {
      console.error("Failed to load photos", e);
      setWoPhotos([]);
    } finally {
      setPhotoLoading(false);
    }
  };

  // Compress image to JPEG, max 1200px wide, quality 0.75 — keeps D1 row under 1MB
  const compressImage = (file: File): Promise<{ base64: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const MAX = 1200;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
          else { width = Math.round(width * MAX / height); height = MAX; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('No canvas context')); return; }
        ctx.drawImage(img, 0, 0, width, height);
        const base64 = canvas.toDataURL('image/jpeg', 0.75);
        resolve({ base64, mimeType: 'image/jpeg' });
      };
      img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Image load failed')); };
      img.src = objectUrl;
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, woNumber: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoUploading(true);
    try {
      const { base64, mimeType } = await compressImage(file);
      const filename = file.name.replace(/\.[^.]+$/, '') + '.jpg';
      await api.uploadWorkOrderPhoto(woNumber, filename, mimeType, base64);
      const wo = workOrders.find((w) => w.number === woNumber);
      if (wo) await loadPhotosForWorkOrder(wo);
    } catch (err) {
      console.error("Failed to upload photo", err);
      alert("Photo upload failed. Please try again.");
    } finally {
      setPhotoUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const handleDeletePhoto = async (photoId: number) => {
    if (!confirm("Delete this photo?")) return;
    await api.deleteWorkOrderPhoto(photoId);
    if (selectedWOForPhotos) await loadPhotosForWorkOrder(selectedWOForPhotos);
  };

  const closePhotoModal = () => {
    setSelectedWOForPhotos(null);
    setWoPhotos([]);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev: PropertyForm) => ({ ...prev, [name]: value }));
  };
  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await api.createProperty(form);
    await loadAllData();
    setSubmitted(true);
    setForm({ propertyName: '', address: '', street: '', city: '', state: '', zip: '', ownerName: '', ownerPhone: '' });
  };
  const handleDeleteProperty = async (prop: PropertyForm) => {
    if (prop.id != null) {
      await api.deleteProperty(prop.id);
      await loadAllData();
    }
  };
  const handleVendorFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setVendorForm((prev: VendorForm) => ({ ...prev, [name]: value }));
  };
  const handleVendorFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await api.createVendor(vendorForm);
    await loadAllData();
    setVendorSubmitted(true);
    setVendorForm({ name: '', category: '', contactName: '', contactNumber: '', contactEmail: '', address: '' });
  };
  const handlePurchaseFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPurchaseForm((prev: Purchase) => ({ ...prev, [name]: value }));
  };
  const handlePurchaseFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await api.createPurchase(purchaseForm);
    await loadAllData();
    setPurchaseSubmitted(true);
    setPurchaseForm({ date: '', workOrderNumber: '', vendor: '', price: '', purchaser: '', purpose: '' });
  };
  const handleInventoryItemFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setInventoryItemForm((prev: InventoryItem) => ({ ...prev, [name]: value }));
  };
  const handleInventoryItemFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const nextId = await api.fetchNextInventoryItemId();
    const newItem: InventoryItem = { ...inventoryItemForm, id: nextId };
    await api.createInventoryItem(newItem);
    await loadAllData();
    setInventoryItemSubmitted(true);
    setInventoryItemForm({ id: '', name: '', category: '', price: '', cost: '', partNumber: '' });
  };
  const handleInventoryCategoryFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInventoryCategoryForm((prev: InventoryCategory) => ({ ...prev, [name]: value }));
  };
  const handleInventoryCategoryFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await api.createInventoryCategory(inventoryCategoryForm);
    await loadAllData();
    setInventoryCategorySubmitted(true);
    setInventoryCategoryForm({ name: '' });
  };

  // ─── Expense Handlers ────────────────────────────────────
  const loadExpensesForWorkOrder = async (wo: WorkOrder) => {
    setSelectedWOForExpenses(wo);
    setExpenseLoading(true);
    try {
      const expenses = await api.fetchWorkOrderExpenses(wo.number);
      setWoExpenses(expenses);
    } catch (e) {
      console.error("Failed to load expenses", e);
      setWoExpenses([]);
    } finally {
      setExpenseLoading(false);
    }
  };

  const handleExpenseFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setExpenseForm((prev) => {
      const updated = { ...prev, [name]: value };
      // Auto-calculate total when qty or unit cost changes
      if (name === 'quantity' || name === 'unitCost') {
        const qty = parseFloat(name === 'quantity' ? value : prev.quantity) || 0;
        const unit = parseFloat(name === 'unitCost' ? value : prev.unitCost) || 0;
        updated.totalCost = (qty * unit).toFixed(2);
      }
      return updated;
    });
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWOForExpenses) return;
    setExpenseSubmitting(true);
    try {
      await api.createWorkOrderExpense(selectedWOForExpenses.number, expenseForm);
      const expenses = await api.fetchWorkOrderExpenses(selectedWOForExpenses.number);
      setWoExpenses(expenses);
      setExpenseForm({ description: '', category: 'Part', quantity: '1', unitCost: '', totalCost: '', vendor: '', partNumber: '' });
    } catch (e) {
      console.error("Failed to add expense", e);
    } finally {
      setExpenseSubmitting(false);
    }
  };

  const handleDeleteExpense = async (expenseId: number) => {
    if (!confirm('Delete this expense?')) return;
    await api.deleteWorkOrderExpense(expenseId);
    if (selectedWOForExpenses) {
      const expenses = await api.fetchWorkOrderExpenses(selectedWOForExpenses.number);
      setWoExpenses(expenses);
    }
  };

  const closeExpenseModal = () => {
    setSelectedWOForExpenses(null);
    setWoExpenses([]);
    setExpenseForm({ description: '', category: 'Part', quantity: '1', unitCost: '', totalCost: '', vendor: '', partNumber: '' });
  };

  const openWODetail = async (wo: WorkOrder, fromPage: string) => {
    setViewingWO(wo);
    setViewWOFromPage(fromPage);
    setViewWOLoading(true);
    setPage('workorderdetail');
    try {
      const [photos, expenses] = await Promise.all([
        api.fetchWorkOrderPhotos(wo.number),
        api.fetchWorkOrderExpenses(wo.number),
      ]);
      const photosWithData = await Promise.all(
        photos.map(async (p: WorkOrderPhoto) => {
          const photoData = await api.fetchPhotoData(p.id);
          return { ...p, data: photoData.data };
        })
      );
      setViewWOPhotos(photosWithData);
      setViewWOExpenses(expenses);
    } catch (e) {
      console.error('Failed to load WO detail', e);
    } finally {
      setViewWOLoading(false);
    }
  };

  // ─── Estimate Handlers ────────────────────────────────────
  const handleEstimateFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEstimateForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEstimateFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const result = await api.createEstimate({ ...estimateForm, number: nextEstimateNumber });
      if (result.error) { alert('Failed to submit estimate: ' + result.error); return; }
      await loadAllData();
      setEstimateSubmitted(true);
      setEstimateForm({ propertyName: '', title: '', description: '', estimatedCost: '' });
    } catch (err) {
      console.error('Estimate submit error', err);
      alert('Failed to submit estimate. Please try again.');
    }
  };

  const convertEstimateToWorkOrder = async (estimate: Estimate) => {
    if (!confirm(`Convert estimate ${estimate.number} to a work order?`)) return;
    const woNum = await api.fetchNextWorkOrderNumber();
    await api.createWorkOrder({
      number: woNum,
      propertyName: estimate.propertyName,
      title: estimate.title,
      instructions: estimate.description,
      scheduledTime: '',
      scheduledDate: '',
    });
    await api.updateEstimateStatus(estimate.number, 'converted', woNum);
    await loadAllData();
    alert(`Estimate ${estimate.number} converted to Work Order ${woNum}!`);
  };

  const rejectEstimate = async (number: string) => {
    if (!confirm('Mark this estimate as rejected?')) return;
    await api.updateEstimateStatus(number, 'rejected');
    await loadAllData();
  };

  const deleteEstimate = async (number: string) => {
    if (!confirm('Delete this estimate?')) return;
    await api.deleteEstimate(number);
    await loadAllData();
  };

  // ─── Loading state ──────────────────────────────────────
  if (!authChecked) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <p>Loading...</p>
      </div>
    );
  }

  // ─── Login / Register ──────────────────────────────────
  if (!authUser) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <h1>Service Master</h1>
        <h2>{authPage === 'login' ? 'Login' : 'Create Account'}</h2>
        <form onSubmit={handleAuthSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem", minWidth: 320, maxWidth: 400 }}>
          <label>
            Username
            <input
              value={authForm.username}
              onChange={(e) => setAuthForm((p) => ({ ...p, username: e.target.value }))}
              required
              autoFocus
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={authForm.password}
              onChange={(e) => setAuthForm((p) => ({ ...p, password: e.target.value }))}
              required
            />
          </label>
          {authError && <p style={{ color: 'red', margin: 0 }}>{authError}</p>}
          <button type="submit" disabled={authLoading}>
            {authLoading ? 'Please wait...' : authPage === 'login' ? 'Login' : 'Register'}
          </button>
        </form>
        <p style={{ marginTop: 16 }}>
          {authPage === 'login' ? (
            <>Don't have an account? <button onClick={() => { setAuthPage('register'); setAuthError(''); }} style={{ background: 'none', border: 'none', color: '#0099FF', cursor: 'pointer', textDecoration: 'underline', padding: 0, font: 'inherit' }}>Register</button></>
          ) : (
            <>Already have an account? <button onClick={() => { setAuthPage('login'); setAuthError(''); }} style={{ background: 'none', border: 'none', color: '#0099FF', cursor: 'pointer', textDecoration: 'underline', padding: 0, font: 'inherit' }}>Login</button></>
          )}
        </p>
        <hr style={{ width: '100%', maxWidth: 400, margin: '1.5rem 0' }} />
        <p style={{ fontSize: '0.85rem', color: '#666' }}>
          First time? <button onClick={async () => { await api.initDb(); alert('Database initialized!'); }} style={{ background: 'none', border: 'none', color: '#0099FF', cursor: 'pointer', textDecoration: 'underline', padding: 0, font: 'inherit' }}>Initialize Database</button> (only needed once)
        </p>
      </div>
    );
  }

  // Render logic
  // Work Order Detail View
  if (page === "workorderdetail" && viewingWO) {
    const statusColors: Record<string, string> = {
      draft: '#888', active: '#0099FF', completed: '#2a9d2a', closed: '#555'
    };
    const totalExpenses = viewWOExpenses.reduce((sum, e) => sum + (parseFloat(e.totalCost) || 0), 0);
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minHeight: "100vh", padding: "1rem" }}>
        <div style={{ width: '100%', maxWidth: 800 }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
            <button onClick={() => setPage(viewWOFromPage)}>← Back</button>
            <span style={{ background: statusColors[viewingWO.status] || '#888', color: '#fff', borderRadius: 20, padding: '4px 16px', fontWeight: 700, fontSize: 13, textTransform: 'uppercase' }}>
              {viewingWO.status}
            </span>
          </div>

          <h1 style={{ margin: '0 0 4px', fontSize: 26 }}>{viewingWO.title}</h1>
          <p style={{ margin: '0 0 20px', color: '#555', fontSize: 15 }}>{viewingWO.number} &bull; {viewingWO.propertyName}</p>

          {/* Details card */}
          <div style={{ background: '#f8f9fa', border: '1px solid #ddd', borderRadius: 10, padding: 20, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: 16, color: '#333' }}>Details</h2>
              {!editingWODetails && (
                <button
                  onClick={() => {
                    setEditWOForm({
                      propertyName: viewingWO.propertyName,
                      title: viewingWO.title,
                      instructions: viewingWO.instructions,
                      scheduledDate: viewingWO.scheduledDate,
                      scheduledTime: viewingWO.scheduledTime,
                    });
                    setEditingWODetails(true);
                  }}
                  style={{ background: '#0099FF', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                >
                  ✏️ Edit
                </button>
              )}
            </div>

            {editingWODetails ? (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setEditWOSaving(true);
                  try {
                    await api.updateWorkOrder(viewingWO.number, editWOForm);
                    await loadAllData();
                    // Update viewingWO in place
                    setViewingWO({ ...viewingWO, ...editWOForm });
                    setEditingWODetails(false);
                  } catch (err) {
                    console.error('Failed to save', err);
                    alert('Save failed. Please try again.');
                  } finally {
                    setEditWOSaving(false);
                  }
                }}
                style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
              >
                <label style={{ fontWeight: 600, fontSize: 13, color: '#333' }}>
                  Property
                  <select
                    value={editWOForm.propertyName}
                    onChange={(e) => setEditWOForm((p) => ({ ...p, propertyName: e.target.value }))}
                    required
                    style={{ display: 'block', width: '100%', marginTop: 4, padding: '7px 10px', border: '1px solid #aaa', borderRadius: 6, fontSize: 14 }}
                  >
                    <option value="" disabled>Select a property</option>
                    {properties.map((prop: PropertyForm, idx: number) => (
                      <option key={idx} value={prop.propertyName}>{prop.propertyName}</option>
                    ))}
                  </select>
                </label>
                <label style={{ fontWeight: 600, fontSize: 13, color: '#333' }}>
                  Title
                  <input
                    value={editWOForm.title}
                    onChange={(e) => setEditWOForm((p) => ({ ...p, title: e.target.value }))}
                    required
                    style={{ display: 'block', width: '100%', marginTop: 4, padding: '7px 10px', border: '1px solid #aaa', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}
                  />
                </label>
                <label style={{ fontWeight: 600, fontSize: 13, color: '#333' }}>
                  Instructions / Scope of Work
                  <textarea
                    value={editWOForm.instructions}
                    onChange={(e) => setEditWOForm((p) => ({ ...p, instructions: e.target.value }))}
                    required
                    rows={4}
                    style={{ display: 'block', width: '100%', marginTop: 4, padding: '7px 10px', border: '1px solid #aaa', borderRadius: 6, fontSize: 14, boxSizing: 'border-box', resize: 'vertical' }}
                  />
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <label style={{ fontWeight: 600, fontSize: 13, color: '#333' }}>
                    Scheduled Date
                    <input
                      type="date"
                      value={editWOForm.scheduledDate}
                      onChange={(e) => setEditWOForm((p) => ({ ...p, scheduledDate: e.target.value }))}
                      style={{ display: 'block', width: '100%', marginTop: 4, padding: '7px 10px', border: '1px solid #aaa', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}
                    />
                  </label>
                  <label style={{ fontWeight: 600, fontSize: 13, color: '#333' }}>
                    Scheduled Time
                    <input
                      type="time"
                      value={editWOForm.scheduledTime}
                      onChange={(e) => setEditWOForm((p) => ({ ...p, scheduledTime: e.target.value }))}
                      style={{ display: 'block', width: '100%', marginTop: 4, padding: '7px 10px', border: '1px solid #aaa', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}
                    />
                  </label>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <button type="submit" disabled={editWOSaving} style={{ background: '#2a9d2a', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 22px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                    {editWOSaving ? 'Saving...' : '✓ Save Changes'}
                  </button>
                  <button type="button" onClick={() => setEditingWODetails(false)} style={{ background: '#888', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 14, cursor: 'pointer' }}>
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                  <div><span style={{ fontWeight: 600, color: '#555', fontSize: 13 }}>Property</span><br />{viewingWO.propertyName}</div>
                  <div><span style={{ fontWeight: 600, color: '#555', fontSize: 13 }}>Scheduled Date</span><br />{viewingWO.scheduledDate || '—'}</div>
                  <div><span style={{ fontWeight: 600, color: '#555', fontSize: 13 }}>Scheduled Time</span><br />{viewingWO.scheduledTime || '—'}</div>
                  {viewingWO.completedAt && <div><span style={{ fontWeight: 600, color: '#555', fontSize: 13 }}>Completed At</span><br />{new Date(viewingWO.completedAt).toLocaleString()}</div>}
                </div>
                <div style={{ marginTop: 16 }}>
                  <span style={{ fontWeight: 600, color: '#555', fontSize: 13 }}>Instructions / Scope of Work</span>
                  <p style={{ margin: '6px 0 0', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{viewingWO.instructions}</p>
                </div>
              </>
            )}
          </div>

          {/* Expenses */}
          <div style={{ background: '#f8f9fa', border: '1px solid #ddd', borderRadius: 10, padding: 20, marginBottom: 20 }}>
            <h2 style={{ margin: '0 0 12px', fontSize: 16, color: '#333' }}>Parts &amp; Expenses</h2>
            {viewWOLoading && <p style={{ color: '#888' }}>Loading...</p>}
            {!viewWOLoading && viewWOExpenses.length === 0 && <p style={{ color: '#888' }}>No expenses recorded.</p>}
            {viewWOExpenses.length > 0 && (
              <>
                <table className="wo-table" style={{ background: '#fff' }}>
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Description</th>
                      <th>Part #</th>
                      <th>Vendor</th>
                      <th>Qty</th>
                      <th>Unit $</th>
                      <th>Total $</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewWOExpenses.map((exp, i) => (
                      <tr key={exp.id} style={{ background: i % 2 === 0 ? '#f0f4ff' : '#fff' }}>
                        <td data-label="Category" style={{ color: '#111', fontWeight: 500 }}>{exp.category}</td>
                        <td data-label="Description" style={{ color: '#111', fontWeight: 600 }}>{exp.description}</td>
                        <td data-label="Part #" style={{ color: '#333' }}>{exp.partNumber || '—'}</td>
                        <td data-label="Vendor" style={{ color: '#333' }}>{exp.vendor || '—'}</td>
                        <td data-label="Qty" style={{ color: '#111' }}>{exp.quantity}</td>
                        <td data-label="Unit $" style={{ color: '#111' }}>{exp.unitCost ? `$${exp.unitCost}` : '—'}</td>
                        <td data-label="Total $" style={{ color: '#0a6e0a', fontWeight: 700 }}>{exp.totalCost ? `$${exp.totalCost}` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p style={{ textAlign: 'right', fontWeight: 700, fontSize: 16, color: '#0a6e0a', marginTop: 8 }}>
                  Total: ${totalExpenses.toFixed(2)}
                </p>
              </>
            )}
          </div>

          {/* Photos */}
          <div style={{ background: '#f8f9fa', border: '1px solid #ddd', borderRadius: 10, padding: 20, marginBottom: 20 }}>
            <h2 style={{ margin: '0 0 12px', fontSize: 16, color: '#333' }}>Photos</h2>
            {viewWOLoading && <p style={{ color: '#888' }}>Loading...</p>}
            {!viewWOLoading && viewWOPhotos.length === 0 && <p style={{ color: '#888' }}>No photos attached.</p>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
              {viewWOPhotos.map((photo) => (
                <div key={photo.id} style={{ border: '1px solid #ddd', borderRadius: 8, overflow: 'hidden' }}>
                  <img src={photo.data} alt={photo.filename} style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }} />
                  <div style={{ padding: '4px 6px', fontSize: 11, background: '#f0f0f0', color: '#444', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{photo.filename}</div>
                </div>
              ))}
            </div>
          </div>

          {/* History */}
          <div style={{ background: '#f8f9fa', border: '1px solid #ddd', borderRadius: 10, padding: 20, marginBottom: 20 }}>
            <h2 style={{ margin: '0 0 12px', fontSize: 16, color: '#333' }}>History</h2>
            {viewingWO.history.length === 0 && <p style={{ color: '#888' }}>No history.</p>}
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {viewingWO.history.map((entry: WorkOrderHistoryEntry, idx: number) => (
                <li key={idx} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #eee' }}>
                  <span style={{ background: statusColors[entry.status] || '#888', color: '#fff', borderRadius: 12, padding: '2px 10px', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{entry.status}</span>
                  <span style={{ color: '#555', fontSize: 13 }}>{new Date(entry.timestamp).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </div>

          <button onClick={() => setPage(viewWOFromPage)}>← Back to List</button>
        </div>
      </div>
    );
  }

  if (page === "createestimate") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <h1>Create an Estimate</h1>
        {estimateSubmitted ? (
          <>
            <p style={{ color: 'green' }}>Estimate submitted!</p>
            <button onClick={() => { setPage("estimatelist"); setEstimateSubmitted(false); }}>View Estimates</button>
            <button style={{ marginTop: 8 }} onClick={() => { setPage("home"); setEstimateSubmitted(false); }}>Return to Home</button>
          </>
        ) : (
          <form onSubmit={handleEstimateFormSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.5rem", minWidth: 350, maxWidth: 500, width: '90%' }}>
            <label>
              Estimate Number
              <input value={nextEstimateNumber} disabled style={{ background: '#eee' }} />
            </label>
            <label>
              Property
              <select name="propertyName" value={estimateForm.propertyName} onChange={handleEstimateFormChange} required>
                <option value="" disabled>Select a property</option>
                {properties.map((prop: PropertyForm, idx: number) => (
                  <option key={idx} value={prop.propertyName}>{prop.propertyName}</option>
                ))}
              </select>
            </label>
            <label>
              Title
              <input name="title" value={estimateForm.title} onChange={handleEstimateFormChange} required />
            </label>
            <label>
              Description / Scope of Work
              <textarea name="description" value={estimateForm.description} onChange={handleEstimateFormChange} required rows={4} />
            </label>
            <label>
              Estimated Cost ($)
              <input name="estimatedCost" type="text" value={estimateForm.estimatedCost} onChange={handleEstimateFormChange} placeholder="e.g. 1500.00" />
            </label>
            <button type="submit">Submit Estimate</button>
            <button type="button" onClick={() => setPage("home")}>Return to Home</button>
          </form>
        )}
      </div>
    );
  }

  if (page === "estimatelist") {
    const pendingEstimates = estimates.filter((e) => e.status === 'pending');
    const convertedEstimates = estimates.filter((e) => e.status === 'converted');
    const rejectedEstimates = estimates.filter((e) => e.status === 'rejected');
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minHeight: "100vh", padding: "1rem" }}>
        <h1>Estimates</h1>

        <h2 style={{ alignSelf: 'flex-start', maxWidth: 900, width: '100%', margin: '1rem auto 0.5rem' }}>Pending</h2>
        {pendingEstimates.length === 0 ? (
          <p style={{ alignSelf: 'flex-start', maxWidth: 900, width: '100%', margin: '0 auto' }}>No pending estimates.</p>
        ) : (
          <table className="wo-table" style={{ maxWidth: 900 }}>
            <thead>
              <tr>
                <th>Est #</th>
                <th>Property</th>
                <th>Title</th>
                <th>Description</th>
                <th>Est. Cost</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingEstimates.map((est: Estimate, idx: number) => (
                <tr key={idx}>
                  <td data-label="Est #">{est.number}</td>
                  <td data-label="Property">{est.propertyName}</td>
                  <td data-label="Title">{est.title}</td>
                  <td data-label="Description">{est.description}</td>
                  <td data-label="Est. Cost">{est.estimatedCost ? `$${est.estimatedCost}` : '—'}</td>
                  <td style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button style={{ background: '#0099FF', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer' }} onClick={() => convertEstimateToWorkOrder(est)}>▶ Convert to WO</button>
                    <button style={{ background: '#ff9900', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer' }} onClick={() => rejectEstimate(est.number)}>✕ Reject</button>
                    <button style={{ background: '#ff4d4d', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer' }} onClick={() => deleteEstimate(est.number)}>🗑</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {convertedEstimates.length > 0 && (
          <>
            <h2 style={{ alignSelf: 'flex-start', maxWidth: 900, width: '100%', margin: '1.5rem auto 0.5rem', color: '#2a9d2a' }}>Converted to Work Orders</h2>
            <table className="wo-table" style={{ maxWidth: 900 }}>
              <thead>
                <tr>
                  <th>Est #</th>
                  <th>Property</th>
                  <th>Title</th>
                  <th>Est. Cost</th>
                  <th>Work Order</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {convertedEstimates.map((est: Estimate, idx: number) => (
                  <tr key={idx}>
                    <td data-label="Est #">{est.number}</td>
                    <td data-label="Property">{est.propertyName}</td>
                    <td data-label="Title">{est.title}</td>
                    <td data-label="Est. Cost">{est.estimatedCost ? `$${est.estimatedCost}` : '—'}</td>
                    <td data-label="Work Order"><span style={{ color: '#0099FF', fontWeight: 600 }}>{est.convertedTo}</span></td>
                    <td>
                      <button style={{ background: '#ff4d4d', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer' }} onClick={() => deleteEstimate(est.number)}>🗑</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {rejectedEstimates.length > 0 && (
          <>
            <h2 style={{ alignSelf: 'flex-start', maxWidth: 900, width: '100%', margin: '1.5rem auto 0.5rem', color: '#888' }}>Rejected</h2>
            <table className="wo-table" style={{ maxWidth: 900 }}>
              <thead>
                <tr>
                  <th>Est #</th>
                  <th>Property</th>
                  <th>Title</th>
                  <th>Est. Cost</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rejectedEstimates.map((est: Estimate, idx: number) => (
                  <tr key={idx}>
                    <td data-label="Est #">{est.number}</td>
                    <td data-label="Property">{est.propertyName}</td>
                    <td data-label="Title">{est.title}</td>
                    <td data-label="Est. Cost">{est.estimatedCost ? `$${est.estimatedCost}` : '—'}</td>
                    <td>
                      <button style={{ background: '#ff4d4d', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer' }} onClick={() => deleteEstimate(est.number)}>🗑</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        <button style={{ marginTop: 24 }} onClick={() => setPage("home")}>Return to Home</button>
      </div>
    );
  }

  if (page === "vendor") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <h1>Create a Vendor</h1>
        {vendorSubmitted ? (
          <>
            <p style={{ color: 'green' }}>Vendor submitted!</p>
            <button onClick={() => { setPage("home"); setVendorSubmitted(false); setVendorForm({ name: '', category: '', contactName: '', contactNumber: '', contactEmail: '', address: '' }); }}>Return to Home</button>
          </>
        ) : (
          <form onSubmit={handleVendorFormSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.5rem", minWidth: 350 }}>
            <label>
              Vendor Name
              <input name="name" value={vendorForm.name} onChange={handleVendorFormChange} required />
            </label>
            <label>
              Category
              <input name="category" value={vendorForm.category} onChange={handleVendorFormChange} required />
            </label>
            <label>
              Contact Name
              <input name="contactName" value={vendorForm.contactName} onChange={handleVendorFormChange} required />
            </label>
            <label>
              Contact Number
              <input name="contactNumber" value={vendorForm.contactNumber} onChange={handleVendorFormChange} required />
            </label>
            <label>
              Contact Email
              <input name="contactEmail" type="email" value={vendorForm.contactEmail} onChange={handleVendorFormChange} required />
            </label>
            <label>
              Address
              <input name="address" value={vendorForm.address} onChange={handleVendorFormChange} required />
            </label>
            <button type="submit">Submit Vendor</button>
            <button type="button" onClick={() => setPage("home")}>Return to Home</button>
          </form>
        )}
      </div>
    );
  }
  if (page === "vendorlist") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <h1>Vendor List</h1>
        {vendors.length === 0 ? (
          <p>No vendors have been added yet.</p>
        ) : (
          <table style={{ borderCollapse: "collapse", minWidth: 700, margin: "1rem 0" }}>
            <thead>
              <tr>
                <th style={{ border: "1px solid #444", padding: "8px", background: "#f0f0f0" }}>Vendor Name</th>
                <th style={{ border: "1px solid #444", padding: "8px", background: "#f0f0f0" }}>Category</th>
                <th style={{ border: "1px solid #444", padding: "8px", background: "#f0f0f0" }}>Contact Name</th>
                <th style={{ border: "1px solid #444", padding: "8px", background: "#f0f0f0" }}>Contact Number</th>
                <th style={{ border: "1px solid #444", padding: "8px", background: "#f0f0f0" }}>Contact Email</th>
                <th style={{ border: "1px solid #444", padding: "8px", background: "#f0f0f0" }}>Address</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((vendor: VendorForm, idx: number) => (
                <tr key={idx}>
                  <td style={{ border: "1px solid #444", padding: "8px" }}>{vendor.name}</td>
                  <td style={{ border: "1px solid #444", padding: "8px" }}>{vendor.category}</td>
                  <td style={{ border: "1px solid #444", padding: "8px" }}>{vendor.contactName}</td>
                  <td style={{ border: "1px solid #444", padding: "8px" }}>{vendor.contactNumber}</td>
                  <td style={{ border: "1px solid #444", padding: "8px" }}>{vendor.contactEmail}</td>
                  <td style={{ border: "1px solid #444", padding: "8px" }}>{vendor.address}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <button style={{ marginTop: 16 }} onClick={() => setPage("home")}>Back to Home</button>
      </div>
    );
  }

  if (page === "property") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <h1>Create a Property</h1>
        {submitted ? (
          <>
            <p style={{ color: 'green' }}>Property submitted!</p>
            <button onClick={() => { setPage("home"); setSubmitted(false); setForm({ propertyName: "", address: "", street: "", city: "", state: "", zip: "", ownerName: "", ownerPhone: "" }); }}>Return to Home</button>
          </>
        ) : (
          <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.5rem", minWidth: 300 }}>
            <label>
              Property Name
              <input name="propertyName" value={form.propertyName} onChange={handleFormChange} required />
            </label>
            <label>
              Address
              <input name="address" value={form.address} onChange={handleFormChange} required />
            </label>
            <label>
              Street
              <input name="street" value={form.street} onChange={handleFormChange} required />
            </label>
            <label>
              City
              <input name="city" value={form.city} onChange={handleFormChange} required />
            </label>
            <label>
              State
              <input name="state" value={form.state} onChange={handleFormChange} required />
            </label>
            <label>
              Zip
              <input name="zip" value={form.zip} onChange={handleFormChange} required />
            </label>
            <label>
              Owner Name
              <input name="ownerName" value={form.ownerName} onChange={handleFormChange} required />
            </label>
            <label>
              Owner Phone
              <input name="ownerPhone" value={form.ownerPhone} onChange={handleFormChange} required />
            </label>
            <button type="submit">Submit</button>
            <button type="button" onClick={() => setPage("home")}>Return to Home</button>
          </form>
        )}
      </div>
    );
  }
  if (page === "workorder") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <h1>Create a Work Order</h1>
        {woSubmitted ? (
          <>
            <p style={{ color: 'green' }}>Work order submitted!</p>
            <button onClick={() => { setPage("home"); setWoSubmitted(false); setWoForm({ propertyName: '', title: '', instructions: '', scheduledTime: '', scheduledDate: '' }); }}>Return to Home</button>
          </>
        ) : (
          <form onSubmit={handleWoFormSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.5rem", minWidth: 350 }}>
            <label>
              Work Order Number
              <input name="number" value={nextWoNumber} disabled style={{ background: '#eee' }} />
            </label>
            <label>
              Property
              <select name="propertyName" value={woForm.propertyName} onChange={handleWoFormChange} required>
                <option value="" disabled>Select a property</option>
                {properties.map((prop: PropertyForm, idx: number) => (
                  <option key={idx} value={prop.propertyName}>{prop.propertyName}</option>
                ))}
              </select>
            </label>
            <label>
              Work Order Title
              <input name="title" value={woForm.title} onChange={handleWoFormChange} required />
            </label>
            <label>
              Instructions
              <textarea name="instructions" value={woForm.instructions} onChange={handleWoFormChange} required rows={3} />
            </label>
            <label>
              Scheduled Time
              <input name="scheduledTime" type="time" value={woForm.scheduledTime} onChange={handleWoFormChange} required />
            </label>
            <label>
              Scheduled Date
              <input name="scheduledDate" type="date" value={woForm.scheduledDate} onChange={handleWoFormChange} required />
            </label>
            <button type="submit">Submit Work Order</button>
            <button type="button" onClick={() => setPage("home")}>Return to Home</button>
          </form>
        )}
      </div>
    );
  }
  if (page === "propertylist") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <h1>Property List</h1>
        {properties.length === 0 ? (
          <p>No properties have been added yet.</p>
        ) : (
          <table style={{ borderCollapse: "collapse", minWidth: 700, margin: "1rem 0" }}>
            <thead>
              <tr>
                <th style={{ border: "1px solid #444", padding: "8px", background: "#f0f0f0" }}>Property Name</th>
                <th style={{ border: "1px solid #444", padding: "8px", background: "#f0f0f0" }}>Address</th>
                <th style={{ border: "1px solid #444", padding: "8px", background: "#f0f0f0" }}>Street</th>
                <th style={{ border: "1px solid #444", padding: "8px", background: "#f0f0f0" }}>City</th>
                <th style={{ border: "1px solid #444", padding: "8px", background: "#f0f0f0" }}>State</th>
                <th style={{ border: "1px solid #444", padding: "8px", background: "#f0f0f0" }}>Zip</th>
                <th style={{ border: "1px solid #444", padding: "8px", background: "#f0f0f0" }}>Owner Name</th>
                <th style={{ border: "1px solid #444", padding: "8px", background: "#f0f0f0" }}>Owner Phone</th>
                <th style={{ border: "1px solid #444", padding: "8px", background: "#ffe0e0" }}>Delete</th>
              </tr>
            </thead>
            <tbody>
              {properties.map((prop: PropertyForm, idx: number) => (
                <tr key={idx}>
                  <td style={{ border: "1px solid #444", padding: "8px" }}>{prop.propertyName}</td>
                  <td style={{ border: "1px solid #444", padding: "8px" }}>{prop.address}</td>
                  <td style={{ border: "1px solid #444", padding: "8px" }}>{prop.street}</td>
                  <td style={{ border: "1px solid #444", padding: "8px" }}>{prop.city}</td>
                  <td style={{ border: "1px solid #444", padding: "8px" }}>{prop.state}</td>
                  <td style={{ border: "1px solid #444", padding: "8px" }}>{prop.zip}</td>
                  <td style={{ border: "1px solid #444", padding: "8px" }}>{prop.ownerName}</td>
                  <td style={{ border: "1px solid #444", padding: "8px" }}>{prop.ownerPhone}</td>
                  <td style={{ border: "1px solid #444", padding: "8px", textAlign: "center" }}>
                    <button style={{ background: "#ff4d4d", color: "white", border: "none", borderRadius: 4, padding: "4px 10px", cursor: "pointer" }} onClick={() => handleDeleteProperty(prop)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <button onClick={() => setPage("home")}>Return to Home</button>
      </div>
    );
  }
  if (page === "workorderlistdraft") {
    const draftOrders = workOrders.filter((wo) => wo.status === 'draft');
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "1rem" }}>
        <h1>Draft Work Orders</h1>
        {draftOrders.length === 0 ? (
          <p>No draft work orders.</p>
        ) : (
          <table className="wo-table">
            <thead>
              <tr>
                <th>WO Number</th>
                <th>Property</th>
                <th>Title</th>
                <th>Instructions</th>
                <th>Scheduled Date</th>
                <th>Scheduled Time</th>
                <th>Photos</th>
                <th>Action</th>
                <th>View</th>
              </tr>
            </thead>
            <tbody>
              {draftOrders.map((wo: WorkOrder, idx: number) => (
                <tr key={idx}>
                  <td data-label="WO #">{wo.number}</td>
                  <td data-label="Property">{wo.propertyName}</td>
                  <td data-label="Title">{wo.title}</td>
                  <td data-label="Instructions">{wo.instructions}</td>
                  <td data-label="Date">{wo.scheduledDate}</td>
                  <td data-label="Time">{wo.scheduledTime}</td>
                  <td data-label="Photos">
                    <button onClick={() => loadPhotosForWorkOrder(wo)}>📷 Photos</button>
                  </td>
                  <td>
                    <button onClick={() => activateWorkOrder(wo.number)}>Activate</button>
                  </td>
                  <td>
                    <button onClick={() => openWODetail(wo, 'workorderlistdraft')}>🔍 View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <button onClick={() => setPage("home")}>Return to Home</button>
        
        {/* Photo Modal */}
        {selectedWOForPhotos && (
          <div className="photo-modal">
            <div className="photo-modal-content">
              <h2>Photos for {selectedWOForPhotos.number}</h2>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, selectedWOForPhotos.number)} />
                <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, selectedWOForPhotos.number)} />
                <button onClick={() => fileInputRef.current?.click()} disabled={photoUploading}>📁 Upload from Files</button>
                <button onClick={() => cameraInputRef.current?.click()} disabled={photoUploading}>📷 Take Photo</button>
              </div>
              {photoLoading && <p>Loading photos...</p>}
              {photoUploading && <p>Uploading...</p>}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12 }}>
                {woPhotos.map((photo) => (
                  <div key={photo.id} style={{ position: 'relative', border: '1px solid #ddd', borderRadius: 8, overflow: 'hidden' }}>
                    <img src={photo.data} alt={photo.filename} style={{ width: '100%', height: 100, objectFit: 'cover' }} />
                    <div style={{ padding: 4, fontSize: 11, background: '#f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 60 }}>{photo.filename}</span>
                      <button onClick={() => handleDeletePhoto(photo.id)} style={{ background: '#ff4d4d', color: '#fff', border: 'none', borderRadius: 4, padding: '2px 6px', cursor: 'pointer', fontSize: 11 }}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
              {woPhotos.length === 0 && !photoLoading && <p style={{ color: '#888' }}>No photos yet.</p>}
              <button style={{ marginTop: 16 }} onClick={closePhotoModal}>Close</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Active Work Orders
  if (page === "workorderlist") {
    const activeOrders = workOrders.filter((wo) => wo.status === 'active');
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "1rem" }}>
        <h1>Active Work Order List</h1>
        {activeOrders.length === 0 ? (
          <p>No active work orders.</p>
        ) : (
          <table className="wo-table">
            <thead>
              <tr>
                <th>WO Number</th>
                <th>Property</th>
                <th>Title</th>
                <th>Instructions</th>
                <th>Scheduled Date</th>
                <th>Scheduled Time</th>
                <th>Action</th>
                <th>Expenses</th>
                <th>Photos</th>
                <th>History</th>
                <th>View</th>
              </tr>
            </thead>
            <tbody>
              {activeOrders.map((wo: WorkOrder, idx: number) => (
                <tr key={idx}>
                  <td data-label="WO #">{wo.number}</td>
                  <td data-label="Property">{wo.propertyName}</td>
                  <td data-label="Title">{wo.title}</td>
                  <td data-label="Instructions">{wo.instructions}</td>
                  <td data-label="Date">{wo.scheduledDate}</td>
                  <td data-label="Time">{wo.scheduledTime}</td>
                  <td>
                    <button onClick={() => completeWorkOrder(wo.number)}>Mark Completed</button>
                  </td>
                  <td>
                    <button onClick={() => loadExpensesForWorkOrder(wo)}>💰 Expenses</button>
                  </td>
                  <td>
                    <button onClick={() => loadPhotosForWorkOrder(wo)}>📷 Photos</button>
                  </td>
                  <td>
                    <button onClick={() => setViewHistoryWO(wo)}>View History</button>
                  </td>
                  <td>
                    <button onClick={() => openWODetail(wo, 'workorderlist')}>🔍 View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <button onClick={() => setPage("home")}>Return to Home</button>
        
        {/* Photo Modal */}
        {selectedWOForPhotos && (
          <div className="photo-modal">
            <div className="photo-modal-content">
              <h2>Photos for {selectedWOForPhotos.number}</h2>
              
              {/* Upload buttons */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={(e) => handleFileUpload(e, selectedWOForPhotos.number)}
                />
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  ref={cameraInputRef}
                  style={{ display: 'none' }}
                  onChange={(e) => handleFileUpload(e, selectedWOForPhotos.number)}
                />
                <button onClick={() => fileInputRef.current?.click()} disabled={photoUploading}>
                  📁 Upload from Files
                </button>
                <button onClick={() => cameraInputRef.current?.click()} disabled={photoUploading}>
                  📷 Take Photo
                </button>
              </div>
              
              {photoLoading && <p>Loading photos...</p>}
              {photoUploading && <p>Uploading...</p>}
              
              {/* Photo grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12 }}>
                {woPhotos.map((photo) => (
                  <div key={photo.id} style={{ position: 'relative', border: '1px solid #ddd', borderRadius: 8, overflow: 'hidden' }}>
                    <img
                      src={photo.data}
                      alt={photo.filename}
                      style={{ width: '100%', height: 100, objectFit: 'cover' }}
                    />
                    <div style={{ padding: 4, fontSize: 11, background: '#f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 60 }}>{photo.filename}</span>
                      <button
                        onClick={() => handleDeletePhoto(photo.id)}
                        style={{ background: '#ff4d4d', color: '#fff', border: 'none', borderRadius: 4, padding: '2px 6px', cursor: 'pointer', fontSize: 11 }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              {woPhotos.length === 0 && !photoLoading && <p style={{ color: '#888' }}>No photos yet.</p>}
              
              <button style={{ marginTop: 16 }} onClick={closePhotoModal}>Close</button>
            </div>
          </div>
        )}
        
        {viewHistoryWO && (
          <div style={{ marginTop: 24, background: '#f8f8f8', padding: 16, borderRadius: 8, maxWidth: '90%', width: 350 }}>
            <h2>Work Order History: {viewHistoryWO.number}</h2>
            <ul style={{ textAlign: 'left' }}>
              {viewHistoryWO.history.map((entry: WorkOrderHistoryEntry, idx: number) => (
                <li key={idx}>
                  {entry.status} at {new Date(entry.timestamp).toLocaleString()}
                </li>
              ))}
            </ul>
            <button onClick={() => setViewHistoryWO(null)}>Close</button>
          </div>
        )}

        {/* Expense Modal */}
        {selectedWOForExpenses && (
          <div className="photo-modal">
            <div className="photo-modal-content" style={{ maxWidth: 680 }}>
              <h2>Parts &amp; Expenses — {selectedWOForExpenses.number}</h2>

              {/* Add expense form */}
              <form onSubmit={handleExpenseSubmit} style={{ background: '#e8f0fe', border: '1px solid #b0c4f0', borderRadius: 8, padding: 16, marginBottom: 20 }}>
                <h3 style={{ margin: '0 0 12px', fontSize: 15, color: '#1a3a7a' }}>Add Item</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#222' }}>
                    Category
                    <select name="category" value={expenseForm.category} onChange={handleExpenseFormChange} style={{ width: '100%', marginTop: 4, padding: '6px 8px', border: '1px solid #aaa', borderRadius: 4, fontSize: 14 }}>
                      <option>Part</option>
                      <option>Labor</option>
                      <option>Material</option>
                      <option>Equipment</option>
                      <option>Other</option>
                    </select>
                  </label>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#222', gridColumn: 'span 2' }}>
                    Description *
                    <input name="description" value={expenseForm.description} onChange={handleExpenseFormChange} required placeholder="e.g. 1/2&quot; copper elbow" style={{ width: '100%', marginTop: 4, padding: '6px 8px', border: '1px solid #aaa', borderRadius: 4, fontSize: 14, boxSizing: 'border-box' }} />
                  </label>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#222' }}>
                    Part #
                    <input name="partNumber" value={expenseForm.partNumber} onChange={handleExpenseFormChange} placeholder="optional" style={{ width: '100%', marginTop: 4, padding: '6px 8px', border: '1px solid #aaa', borderRadius: 4, fontSize: 14, boxSizing: 'border-box' }} />
                  </label>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#222' }}>
                    Vendor
                    <input name="vendor" value={expenseForm.vendor} onChange={handleExpenseFormChange} placeholder="optional" style={{ width: '100%', marginTop: 4, padding: '6px 8px', border: '1px solid #aaa', borderRadius: 4, fontSize: 14, boxSizing: 'border-box' }} />
                  </label>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#222' }}>
                    Qty
                    <input name="quantity" type="number" min="0" step="any" value={expenseForm.quantity} onChange={handleExpenseFormChange} style={{ width: '100%', marginTop: 4, padding: '6px 8px', border: '1px solid #aaa', borderRadius: 4, fontSize: 14, boxSizing: 'border-box' }} />
                  </label>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#222' }}>
                    Unit Cost ($)
                    <input name="unitCost" type="number" min="0" step="0.01" value={expenseForm.unitCost} onChange={handleExpenseFormChange} placeholder="0.00" style={{ width: '100%', marginTop: 4, padding: '6px 8px', border: '1px solid #aaa', borderRadius: 4, fontSize: 14, boxSizing: 'border-box' }} />
                  </label>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#222' }}>
                    Total ($)
                    <input name="totalCost" type="number" min="0" step="0.01" value={expenseForm.totalCost} onChange={handleExpenseFormChange} placeholder="auto" style={{ width: '100%', marginTop: 4, padding: '6px 8px', border: '1px solid #aaa', borderRadius: 4, fontSize: 14, background: '#f0f4ff', boxSizing: 'border-box' }} />
                  </label>
                </div>
                <button type="submit" disabled={expenseSubmitting} style={{ marginTop: 14, background: '#0099FF', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  {expenseSubmitting ? 'Adding...' : '+ Add Item'}
                </button>
              </form>

              {/* Expense list */}
              {expenseLoading && <p>Loading...</p>}
              {!expenseLoading && woExpenses.length === 0 && <p style={{ color: '#888' }}>No items added yet.</p>}
              {woExpenses.length > 0 && (
                <>
                  <table className="wo-table" style={{ background: '#fff' }}>
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Description</th>
                        <th>Part #</th>
                        <th>Vendor</th>
                        <th>Qty</th>
                        <th>Unit $</th>
                        <th>Total $</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {woExpenses.map((exp, i) => (
                        <tr key={exp.id} style={{ background: i % 2 === 0 ? '#f0f4ff' : '#fff' }}>
                          <td data-label="Category" style={{ color: '#111', fontWeight: 500 }}>{exp.category}</td>
                          <td data-label="Description" style={{ color: '#111', fontWeight: 600 }}>{exp.description}</td>
                          <td data-label="Part #" style={{ color: '#333' }}>{exp.partNumber || '—'}</td>
                          <td data-label="Vendor" style={{ color: '#333' }}>{exp.vendor || '—'}</td>
                          <td data-label="Qty" style={{ color: '#111', fontWeight: 500 }}>{exp.quantity}</td>
                          <td data-label="Unit $" style={{ color: '#111' }}>{exp.unitCost ? `$${exp.unitCost}` : '—'}</td>
                          <td data-label="Total $" style={{ color: '#0a6e0a', fontWeight: 700 }}>{exp.totalCost ? `$${exp.totalCost}` : '—'}</td>
                          <td>
                            <button onClick={() => handleDeleteExpense(exp.id)} style={{ background: '#ff4d4d', color: '#fff', border: 'none', borderRadius: 4, padding: '2px 8px', cursor: 'pointer' }}>✕</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p style={{ textAlign: 'right', fontWeight: 700, marginTop: 8, fontSize: 16, color: '#0a6e0a' }}>
                    Total: ${woExpenses.reduce((sum, e) => sum + (parseFloat(e.totalCost) || 0), 0).toFixed(2)}
                  </p>
                </>
              )}

              <button style={{ marginTop: 8 }} onClick={closeExpenseModal}>Close</button>
            </div>
          </div>
        )}
      </div>
    );
  }
  // Completed Work Orders
  if (page === "completedworkorders") {
    const completedOrders = workOrders.filter((wo) => wo.status === 'completed');
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "1rem" }}>
        <h1>Completed Work Orders</h1>
        {completedOrders.length === 0 ? (
          <p>No work orders have been completed yet.</p>
        ) : (
          <table className="wo-table">
            <thead>
              <tr>
                <th>WO Number</th>
                <th>Property</th>
                <th>Title</th>
                <th>Instructions</th>
                <th>Scheduled Date</th>
                <th>Scheduled Time</th>
                <th>Action</th>
                <th>Photos</th>
                <th>History</th>
                <th>Reactivate</th>
                <th>View</th>
              </tr>
            </thead>
            <tbody>
              {completedOrders.map((wo: WorkOrder, idx: number) => (
                <tr key={idx}>
                  <td data-label="WO #">{wo.number}</td>
                  <td data-label="Property">{wo.propertyName}</td>
                  <td data-label="Title">{wo.title}</td>
                  <td data-label="Instructions">{wo.instructions}</td>
                  <td data-label="Date">{wo.scheduledDate}</td>
                  <td data-label="Time">{wo.scheduledTime}</td>
                  <td>
                    <button onClick={() => closeWorkOrder(wo.number)}>Close Work Order</button>
                  </td>
                  <td>
                    <button onClick={() => loadPhotosForWorkOrder(wo)}>📷 Photos</button>
                  </td>
                  <td>
                    <button onClick={() => setViewHistoryWO(wo)}>View History</button>
                  </td>
                  <td>
                    <button style={{ background: '#ff9900', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer' }} onClick={() => reactivateWorkOrder(wo.number)}>↺ Reactivate</button>
                  </td>
                  <td>
                    <button onClick={() => openWODetail(wo, 'completedworkorders')}>🔍 View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <button onClick={() => setPage("home")}>Return to Home</button>
        
        {/* Photo Modal */}
        {selectedWOForPhotos && (
          <div className="photo-modal">
            <div className="photo-modal-content">
              <h2>Photos for {selectedWOForPhotos.number}</h2>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, selectedWOForPhotos.number)} />
                <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, selectedWOForPhotos.number)} />
                <button onClick={() => fileInputRef.current?.click()} disabled={photoUploading}>📁 Upload from Files</button>
                <button onClick={() => cameraInputRef.current?.click()} disabled={photoUploading}>📷 Take Photo</button>
              </div>
              {photoLoading && <p>Loading photos...</p>}
              {photoUploading && <p>Uploading...</p>}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12 }}>
                {woPhotos.map((photo) => (
                  <div key={photo.id} style={{ position: 'relative', border: '1px solid #ddd', borderRadius: 8, overflow: 'hidden' }}>
                    <img src={photo.data} alt={photo.filename} style={{ width: '100%', height: 100, objectFit: 'cover' }} />
                    <div style={{ padding: 4, fontSize: 11, background: '#f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 60 }}>{photo.filename}</span>
                      <button onClick={() => handleDeletePhoto(photo.id)} style={{ background: '#ff4d4d', color: '#fff', border: 'none', borderRadius: 4, padding: '2px 6px', cursor: 'pointer', fontSize: 11 }}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
              {woPhotos.length === 0 && !photoLoading && <p style={{ color: '#888' }}>No photos yet.</p>}
              <button style={{ marginTop: 16 }} onClick={closePhotoModal}>Close</button>
            </div>
          </div>
        )}
        
        {viewHistoryWO && (
          <div style={{ marginTop: 24, background: '#f8f8f8', padding: 16, borderRadius: 8, maxWidth: '90%', width: 350 }}>
            <h2>Work Order History: {viewHistoryWO.number}</h2>
            <ul style={{ textAlign: 'left' }}>
              {viewHistoryWO.history.map((entry: WorkOrderHistoryEntry, idx: number) => (
                <li key={idx}>
                  {entry.status} at {new Date(entry.timestamp).toLocaleString()}
                </li>
              ))}
            </ul>
            <button onClick={() => setViewHistoryWO(null)}>Close</button>
          </div>
        )}
      </div>
    );
  }
  // Closed Work Orders
  if (page === "closedworkorders") {
    const closedOrders = workOrders.filter((wo) => wo.status === 'closed');
    console.log('Rendering closedworkorders page. workOrders:', workOrders, 'closedOrders:', closedOrders);
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <h1>Closed Work Orders</h1>
        {closedOrders.length === 0 ? (
          <p>No work orders have been closed yet.</p>
        ) : (
          <table className="wo-table">
            <thead>
              <tr>
                <th>WO Number</th>
                <th>Property</th>
                <th>Title</th>
                <th>Instructions</th>
                <th>Scheduled Date</th>
                <th>Scheduled Time</th>
                <th>Expenses</th>
                <th>Photos</th>
                <th>History</th>
                <th>Reactivate</th>
                <th>View</th>
              </tr>
            </thead>
            <tbody>
              {closedOrders.map((wo: WorkOrder, idx: number) => (
                <tr key={idx}>
                  <td data-label="WO #">{wo.number}</td>
                  <td data-label="Property">{wo.propertyName}</td>
                  <td data-label="Title">{wo.title}</td>
                  <td data-label="Instructions">{wo.instructions}</td>
                  <td data-label="Date">{wo.scheduledDate}</td>
                  <td data-label="Time">{wo.scheduledTime}</td>
                  <td>
                    <button onClick={() => loadExpensesForWorkOrder(wo)}>💰 Expenses</button>
                  </td>
                  <td>
                    <button onClick={() => loadPhotosForWorkOrder(wo)}>📷 Photos</button>
                  </td>
                  <td>
                    <button onClick={() => setViewHistoryWO(wo)}>View History</button>
                  </td>
                  <td>
                    <button style={{ background: '#ff9900', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer' }} onClick={() => reactivateWorkOrder(wo.number)}>↺ Reactivate</button>
                  </td>
                  <td>
                    <button onClick={() => openWODetail(wo, 'closedworkorders')}>🔍 View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <button onClick={() => setPage("home")}>Return to Home</button>
        
        {/* Photo Modal */}
        {selectedWOForPhotos && (
          <div className="photo-modal">
            <div className="photo-modal-content">
              <h2>Photos for {selectedWOForPhotos.number}</h2>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, selectedWOForPhotos.number)} />
                <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, selectedWOForPhotos.number)} />
                <button onClick={() => fileInputRef.current?.click()} disabled={photoUploading}>📁 Upload from Files</button>
                <button onClick={() => cameraInputRef.current?.click()} disabled={photoUploading}>📷 Take Photo</button>
              </div>
              {photoLoading && <p>Loading photos...</p>}
              {photoUploading && <p>Uploading...</p>}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12 }}>
                {woPhotos.map((photo) => (
                  <div key={photo.id} style={{ position: 'relative', border: '1px solid #ddd', borderRadius: 8, overflow: 'hidden' }}>
                    <img src={photo.data} alt={photo.filename} style={{ width: '100%', height: 100, objectFit: 'cover' }} />
                    <div style={{ padding: 4, fontSize: 11, background: '#f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 60 }}>{photo.filename}</span>
                      <button onClick={() => handleDeletePhoto(photo.id)} style={{ background: '#ff4d4d', color: '#fff', border: 'none', borderRadius: 4, padding: '2px 6px', cursor: 'pointer', fontSize: 11 }}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
              {woPhotos.length === 0 && !photoLoading && <p style={{ color: '#888' }}>No photos yet.</p>}
              <button style={{ marginTop: 16 }} onClick={closePhotoModal}>Close</button>
            </div>
          </div>
        )}
        
        {viewHistoryWO && (
          <div style={{ marginTop: 24, background: '#f8f8f8', padding: 16, borderRadius: 8, maxWidth: '90%', width: 350 }}>
            <h2>Work Order History: {viewHistoryWO.number}</h2>
            <ul style={{ textAlign: 'left' }}>
              {viewHistoryWO.history.map((entry: WorkOrderHistoryEntry, idx: number) => (
                <li key={idx}>
                  {entry.status} at {new Date(entry.timestamp).toLocaleString()}
                </li>
              ))}
            </ul>
            <button onClick={() => setViewHistoryWO(null)}>Close</button>
          </div>
        )}

        {/* Expense Modal */}
        {selectedWOForExpenses && (
          <div className="photo-modal">
            <div className="photo-modal-content" style={{ maxWidth: 680 }}>
              <h2>Parts &amp; Expenses — {selectedWOForExpenses.number}</h2>
              <form onSubmit={handleExpenseSubmit} style={{ background: '#e8f0fe', border: '1px solid #b0c4f0', borderRadius: 8, padding: 16, marginBottom: 20 }}>
                <h3 style={{ margin: '0 0 12px', fontSize: 15, color: '#1a3a7a' }}>Add Item</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#222' }}>
                    Category
                    <select name="category" value={expenseForm.category} onChange={handleExpenseFormChange} style={{ width: '100%', marginTop: 4, padding: '6px 8px', border: '1px solid #aaa', borderRadius: 4, fontSize: 14 }}>
                      <option>Part</option>
                      <option>Labor</option>
                      <option>Material</option>
                      <option>Equipment</option>
                      <option>Other</option>
                    </select>
                  </label>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#222', gridColumn: 'span 2' }}>
                    Description *
                    <input name="description" value={expenseForm.description} onChange={handleExpenseFormChange} required placeholder="e.g. 1/2&quot; copper elbow" style={{ width: '100%', marginTop: 4, padding: '6px 8px', border: '1px solid #aaa', borderRadius: 4, fontSize: 14, boxSizing: 'border-box' }} />
                  </label>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#222' }}>
                    Part #
                    <input name="partNumber" value={expenseForm.partNumber} onChange={handleExpenseFormChange} placeholder="optional" style={{ width: '100%', marginTop: 4, padding: '6px 8px', border: '1px solid #aaa', borderRadius: 4, fontSize: 14, boxSizing: 'border-box' }} />
                  </label>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#222' }}>
                    Vendor
                    <input name="vendor" value={expenseForm.vendor} onChange={handleExpenseFormChange} placeholder="optional" style={{ width: '100%', marginTop: 4, padding: '6px 8px', border: '1px solid #aaa', borderRadius: 4, fontSize: 14, boxSizing: 'border-box' }} />
                  </label>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#222' }}>
                    Qty
                    <input name="quantity" type="number" min="0" step="any" value={expenseForm.quantity} onChange={handleExpenseFormChange} style={{ width: '100%', marginTop: 4, padding: '6px 8px', border: '1px solid #aaa', borderRadius: 4, fontSize: 14, boxSizing: 'border-box' }} />
                  </label>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#222' }}>
                    Unit Cost ($)
                    <input name="unitCost" type="number" min="0" step="0.01" value={expenseForm.unitCost} onChange={handleExpenseFormChange} placeholder="0.00" style={{ width: '100%', marginTop: 4, padding: '6px 8px', border: '1px solid #aaa', borderRadius: 4, fontSize: 14, boxSizing: 'border-box' }} />
                  </label>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#222' }}>
                    Total ($)
                    <input name="totalCost" type="number" min="0" step="0.01" value={expenseForm.totalCost} onChange={handleExpenseFormChange} placeholder="auto" style={{ width: '100%', marginTop: 4, padding: '6px 8px', border: '1px solid #aaa', borderRadius: 4, fontSize: 14, background: '#f0f4ff', boxSizing: 'border-box' }} />
                  </label>
                </div>
                <button type="submit" disabled={expenseSubmitting} style={{ marginTop: 14, background: '#0099FF', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  {expenseSubmitting ? 'Adding...' : '+ Add Item'}
                </button>
              </form>
              {expenseLoading && <p>Loading...</p>}
              {!expenseLoading && woExpenses.length === 0 && <p style={{ color: '#888' }}>No items added yet.</p>}
              {woExpenses.length > 0 && (
                <>
                  <table className="wo-table" style={{ background: '#fff' }}>
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Description</th>
                        <th>Part #</th>
                        <th>Vendor</th>
                        <th>Qty</th>
                        <th>Unit $</th>
                        <th>Total $</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {woExpenses.map((exp, i) => (
                        <tr key={exp.id} style={{ background: i % 2 === 0 ? '#f0f4ff' : '#fff' }}>
                          <td data-label="Category" style={{ color: '#111', fontWeight: 500 }}>{exp.category}</td>
                          <td data-label="Description" style={{ color: '#111', fontWeight: 600 }}>{exp.description}</td>
                          <td data-label="Part #" style={{ color: '#333' }}>{exp.partNumber || '—'}</td>
                          <td data-label="Vendor" style={{ color: '#333' }}>{exp.vendor || '—'}</td>
                          <td data-label="Qty" style={{ color: '#111', fontWeight: 500 }}>{exp.quantity}</td>
                          <td data-label="Unit $" style={{ color: '#111' }}>{exp.unitCost ? `$${exp.unitCost}` : '—'}</td>
                          <td data-label="Total $" style={{ color: '#0a6e0a', fontWeight: 700 }}>{exp.totalCost ? `$${exp.totalCost}` : '—'}</td>
                          <td>
                            <button onClick={() => handleDeleteExpense(exp.id)} style={{ background: '#ff4d4d', color: '#fff', border: 'none', borderRadius: 4, padding: '2px 8px', cursor: 'pointer' }}>✕</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p style={{ textAlign: 'right', fontWeight: 700, marginTop: 8, fontSize: 16, color: '#0a6e0a' }}>
                    Total: ${woExpenses.reduce((sum, e) => sum + (parseFloat(e.totalCost) || 0), 0).toFixed(2)}
                  </p>
                </>
              )}
              <button style={{ marginTop: 8 }} onClick={closeExpenseModal}>Close</button>
            </div>
          </div>
        )}
      </div>
    );
  }
  if (page === "createpurchase") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <h1>Create Purchase</h1>
        {purchaseSubmitted ? (
          <>
            <p style={{ color: 'green' }}>Purchase submitted!</p>
            <button onClick={() => { setPage("home"); setPurchaseSubmitted(false); }}>Return to Home</button>
          </>
        ) : (
          <form onSubmit={handlePurchaseFormSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.5rem", minWidth: 350 }}>
            <label>
              Date
              <input name="date" type="date" value={purchaseForm.date} onChange={handlePurchaseFormChange} required />
            </label>
            <label>
              Work Order
              <select name="workOrderNumber" value={purchaseForm.workOrderNumber} onChange={handlePurchaseFormChange} required>
                <option value="" disabled>Select a work order</option>
                {workOrders.map((wo: WorkOrder) => (
                  <option key={wo.number} value={wo.number}>{wo.number} - {wo.title}</option>
                ))}
              </select>
            </label>
            <label>
              Vendor/Supplier
              <input name="vendor" value={purchaseForm.vendor} onChange={handlePurchaseFormChange} required />
            </label>
            <label>
              Price Paid
              <input name="price" type="number" step="0.01" value={purchaseForm.price} onChange={handlePurchaseFormChange} required />
            </label>
            <label>
              Purchaser Name
              <input name="purchaser" value={purchaseForm.purchaser} onChange={handlePurchaseFormChange} required />
            </label>
            <label>
              Purpose
              <textarea name="purpose" value={purchaseForm.purpose} onChange={handlePurchaseFormChange} required rows={2} />
            </label>
            <button type="submit">Submit Purchase</button>
            <button type="button" onClick={() => setPage("home")}>Return to Home</button>
          </form>
        )}
      </div>
    );
  }
  if (page === "purchaselist") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <h1>Purchase List</h1>
        {purchases.length === 0 ? (
          <p>No purchases have been added yet.</p>
        ) : (
          <table style={{ borderCollapse: "collapse", minWidth: 700, margin: "1rem 0" }}>
            <thead>
              <tr>
                <th style={{ border: "1px solid #444", padding: "8px", background: "#f0f0f0" }}>Date</th>
                <th style={{ border: "1px solid #444", padding: "8px", background: "#f0f0f0" }}>Work Order</th>
                <th style={{ border: "1px solid #444", padding: "8px", background: "#f0f0f0" }}>Vendor/Supplier</th>
                <th style={{ border: "1px solid #444", padding: "8px", background: "#f0f0f0" }}>Price Paid</th>
                <th style={{ border: "1px solid #444", padding: "8px", background: "#f0f0f0" }}>Purchaser</th>
                <th style={{ border: "1px solid #444", padding: "8px", background: "#f0f0f0" }}>Purpose</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((purchase: Purchase, idx: number) => (
                <tr key={idx}>
                  <td style={{ border: "1px solid #444", padding: "8px" }}>{purchase.date}</td>
                  <td style={{ border: "1px solid #444", padding: "8px" }}>{purchase.workOrderNumber}</td>
                  <td style={{ border: "1px solid #444", padding: "8px" }}>{purchase.vendor}</td>
                  <td style={{ border: "1px solid #444", padding: "8px" }}>{purchase.price}</td>
                  <td style={{ border: "1px solid #444", padding: "8px" }}>{purchase.purchaser}</td>
                  <td style={{ border: "1px solid #444", padding: "8px" }}>{purchase.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <button style={{ marginTop: 16 }} onClick={() => setPage("home")}>Back to Home</button>
      </div>
    );
  }
  if (page === "createinventorycategory") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <h1>Create Inventory Category</h1>
        {inventoryCategorySubmitted ? (
          <>
            <p style={{ color: 'green' }}>Category submitted!</p>
            <button onClick={() => { setInventoryCategorySubmitted(false); setPage("home"); }}>Return to Home</button>
          </>
        ) : (
          <form onSubmit={handleInventoryCategoryFormSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.5rem", minWidth: 350 }}>
            <label>
              Category Name
              <input name="name" value={inventoryCategoryForm.name} onChange={handleInventoryCategoryFormChange} required />
            </label>
            <button type="submit">Submit Category</button>
            <button type="button" onClick={() => setPage("home")}>Return to Home</button>
          </form>
        )}
        <button style={{ marginTop: 16 }} onClick={() => setShowCategoryList((show) => !show)}>
          {showCategoryList ? 'Hide Category List' : 'Show Category List'}
        </button>
        {showCategoryList && (
          <div style={{ marginTop: 16, minWidth: 350 }}>
            <h2>Saved Categories</h2>
            {inventoryCategories.length === 0 ? (
              <p>No categories have been added yet.</p>
            ) : (
              <ul>
                {inventoryCategories.map((cat: InventoryCategory, idx: number) => (
                  <li key={idx}>{cat.name}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    );
  }
  if (page === "createinventoryitem") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <h1>Create Inventory Item</h1>
        {inventoryItemSubmitted ? (
          <>
            <p style={{ color: 'green' }}>Inventory item submitted!</p>
            <button onClick={() => { setPage("home"); setInventoryItemSubmitted(false); }}>Return to Home</button>
          </>
        ) : (
          <form onSubmit={handleInventoryItemFormSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.5rem", minWidth: 350 }}>
            <label>
              Item Name
              <input name="name" value={inventoryItemForm.name} onChange={handleInventoryItemFormChange} required />
            </label>
            <label>
              Category
              <input name="category" value={inventoryItemForm.category} onChange={handleInventoryItemFormChange} required />
            </label>
            <label>
              Price
              <input name="price" type="number" step="0.01" value={inventoryItemForm.price} onChange={handleInventoryItemFormChange} required />
            </label>
            <label>
              Cost
              <input name="cost" type="number" step="0.01" value={inventoryItemForm.cost} onChange={handleInventoryItemFormChange} required />
            </label>
            <label>
              Part Number
              <input name="partNumber" value={inventoryItemForm.partNumber} onChange={handleInventoryItemFormChange} required />
            </label>
            <button type="submit">Submit Inventory Item</button>
            <button type="button" onClick={() => setPage("home")}>Return to Home</button>
          </form>
        )}
      </div>
    );
  }
  if (page === "inventorylist") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <h1>Inventory Items</h1>
        {inventoryItems.length === 0 ? (
          <p>No inventory items have been added yet.</p>
        ) : (
          <table style={{ borderCollapse: "collapse", minWidth: 700, margin: "1rem 0" }}>
            <thead>
              <tr>
                <th style={{ border: "1px solid #444", padding: "8px", background: "#f0f0f0" }}>ID</th>
                <th style={{ border: "1px solid #444", padding: "8px", background: "#f0f0f0" }}>Name</th>
                <th style={{ border: "1px solid #444", padding: "8px", background: "#f0f0f0" }}>Category</th>
                <th style={{ border: "1px solid #444", padding: "8px", background: "#f0f0f0" }}>Price</th>
                <th style={{ border: "1px solid #444", padding: "8px", background: "#f0f0f0" }}>Cost</th>
                <th style={{ border: "1px solid #444", padding: "8px", background: "#f0f0f0" }}>Part Number</th>
              </tr>
            </thead>
            <tbody>
              {inventoryItems.map((item: InventoryItem, idx: number) => (
                <tr key={idx}>
                  <td style={{ border: "1px solid #444", padding: "8px" }}>{item.id}</td>
                  <td style={{ border: "1px solid #444", padding: "8px" }}>{item.name}</td>
                  <td style={{ border: "1px solid #444", padding: "8px" }}>{item.category}</td>
                  <td style={{ border: "1px solid #444", padding: "8px" }}>{item.price}</td>
                  <td style={{ border: "1px solid #444", padding: "8px" }}>{item.cost}</td>
                  <td style={{ border: "1px solid #444", padding: "8px" }}>{item.partNumber}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <button style={{ marginTop: 16 }} onClick={() => setPage("home")}>Back to Home</button>
      </div>
    );
  }
  // Main dashboard/homepage UI
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", maxWidth: 1100, marginBottom: 8 }}>
        <span style={{ color: "#555" }}>Logged in as <strong>{authUser.username}</strong></span>
        <button onClick={handleLogout} style={{ background: "#ff4d4d", color: "white", border: "none", borderRadius: 4, padding: "6px 16px", cursor: "pointer" }}>Logout</button>
      </div>
      <h1>Welcome to the Service Master App</h1>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: "2rem",
        marginTop: "2rem",
        width: "100%",
        maxWidth: 1100
      }}>
                {/* Processing */}
                <div style={{ background: "#f8f9fa", borderRadius: 12, boxShadow: "0 2px 8px #0001", padding: 24, display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ marginBottom: 8 }}>
                    {/* Sleek Electric Blue Gear Icon */}
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="20" cy="20" r="16" fill="#0099FF"/>
                      <path d="M20 12v4M20 24v4M28 20h-4M16 20h-4M24.24 15.76l-2.83 2.83M15.76 24.24l2.83-2.83M24.24 24.24l-2.83-2.83M15.76 15.76l2.83 2.83" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <h2 style={{ margin: 0, marginBottom: 16, color: '#111' }}>Processing</h2>
                  <button style={{ marginBottom: 8 }} onClick={() => alert('Close Work Orders feature coming soon!')}>Close Work Orders</button>
                  <button style={{ marginBottom: 8 }} onClick={() => alert('Invoice List feature coming soon!')}>Invoice List</button>
                  <button style={{ marginBottom: 8 }} onClick={() => alert('Generate Blank Invoice feature coming soon!')}>Generate Blank Invoice</button>
                </div>
        {/* Properties */}
        <div style={{ background: "#f8f9fa", borderRadius: 12, boxShadow: "0 2px 8px #0001", padding: 24, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ marginBottom: 8 }}>
            {/* Sleek Electric Blue House Icon */}
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 20L20 7L35 20" stroke="#00BFFF" strokeWidth="3" fill="none"/>
              <rect x="10" y="20" width="20" height="13" fill="#0099FF" stroke="#00BFFF" strokeWidth="2" rx="2"/>
              <rect x="17" y="26" width="6" height="7" fill="#fff"/>
            </svg>
          </div>
          <h2 style={{ margin: 0, marginBottom: 16, color: '#111' }}>Properties</h2>
          <button style={{ marginBottom: 8 }} onClick={() => setPage("property")}>Create a Property</button>
          <button onClick={() => setPage("propertylist")}>Property List</button>
        </div>
        {/* Estimates */}
        <div style={{ background: "#f8f9fa", borderRadius: 12, boxShadow: "0 2px 8px #0001", padding: 24, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ marginBottom: 8 }}>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="8" y="6" width="24" height="30" rx="4" fill="#0099FF"/>
              <rect x="13" y="13" width="14" height="2" rx="1" fill="#fff"/>
              <rect x="13" y="18" width="14" height="2" rx="1" fill="#fff"/>
              <rect x="13" y="23" width="8" height="2" rx="1" fill="#fff"/>
              <circle cx="30" cy="30" r="7" fill="#00BFFF"/>
              <text x="30" y="34" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold">$</text>
            </svg>
          </div>
          <h2 style={{ margin: 0, marginBottom: 16, color: '#111' }}>Estimates</h2>
          <button style={{ marginBottom: 8 }} onClick={() => setPage("createestimate")}>Create an Estimate</button>
          <button onClick={() => setPage("estimatelist")}>Estimate List</button>
        </div>
        {/* Work Orders */}
        <div style={{ background: "#f8f9fa", borderRadius: 12, boxShadow: "0 2px 8px #0001", padding: 24, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ marginBottom: 8 }}>
            {/* Sleek Electric Blue Truck Icon */}
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="5" y="18" width="18" height="10" rx="2" fill="#0099FF"/>
              <rect x="23" y="22" width="8" height="6" rx="1.5" fill="#00BFFF"/>
              <circle cx="11" cy="30" r="3" fill="#00BFFF"/>
              <circle cx="29" cy="30" r="3" fill="#00BFFF"/>
            </svg>
          </div>
          <h2 style={{ margin: 0, marginBottom: 16, color: '#111' }}>Work Orders</h2>
          <button style={{ marginBottom: 8 }} onClick={() => setPage("workorder")}>Create a Work Order</button>
          <button onClick={() => setPage("workorderlist")}>Active Work Order List</button>
          <button style={{ marginTop: 8 }} onClick={() => setPage("completedworkorders")}>Completed Work Orders</button>
          <button style={{ marginTop: 8 }} onClick={() => setPage("workorderlistdraft")}>Draft Work Orders</button>
          <button style={{ marginTop: 8 }} onClick={() => setPage("closedworkorders")}>Closed Work Orders</button>
        </div>
        {/* Inventory */}
        <div style={{ background: "#f8f9fa", borderRadius: 12, boxShadow: "0 2px 8px #0001", padding: 24, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ marginBottom: 8 }}>
            {/* Sleek Electric Blue Clipboard Icon */}
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="10" y="8" width="20" height="28" rx="4" fill="#0099FF"/>
              <rect x="16" y="4" width="8" height="8" rx="2" fill="#00BFFF"/>
              <rect x="14" y="16" width="12" height="2" fill="#fff"/>
              <rect x="14" y="22" width="12" height="2" fill="#fff"/>
            </svg>
          </div>
          <h2 style={{ margin: 0, marginBottom: 16, color: '#111' }}>Inventory</h2>
          <button style={{ marginBottom: 8 }} onClick={() => setPage("createinventorycategory")}>Create Inventory Category</button>
          <button style={{ marginBottom: 8 }} onClick={() => setPage("createinventoryitem")}>Create Inventory Item</button>
          <button onClick={() => setPage("inventorylist")}>Inventory List</button>
        </div>
        {/* Vendors */}
        <div style={{ background: "#f8f9fa", borderRadius: 12, boxShadow: "0 2px 8px #0001", padding: 24, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ marginBottom: 8 }}>
            {/* Sleek Electric Blue Phone Icon */}
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="14" y="6" width="12" height="28" rx="4" fill="#0099FF"/>
              <rect x="18" y="32" width="4" height="2" rx="1" fill="#00BFFF"/>
              <rect x="18" y="8" width="4" height="2" rx="1" fill="#00BFFF"/>
            </svg>
          </div>
          <h2 style={{ margin: 0, marginBottom: 16, color: '#111' }}>Vendors</h2>
          <button style={{ marginBottom: 8 }} onClick={() => setPage("vendor")}>Create a Vendor</button>
          <button onClick={() => setPage("vendorlist")}>Vendor List</button>
        </div>
        {/* Purchases */}
        <div style={{ background: "#f8f9fa", borderRadius: 12, boxShadow: "0 2px 8px #0001", padding: 24, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ marginBottom: 8 }}>
            {/* Sleek Electric Blue Cart Icon */}
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="14" cy="32" r="3" fill="#00BFFF"/>
              <circle cx="28" cy="32" r="3" fill="#00BFFF"/>
              <rect x="8" y="12" width="24" height="12" rx="3" fill="#0099FF"/>
              <rect x="10" y="10" width="20" height="4" rx="2" fill="#00BFFF"/>
            </svg>
          </div>
          <h2 style={{ margin: 0, marginBottom: 16, color: '#111' }}>Purchases</h2>
          <button style={{ marginBottom: 8 }} onClick={() => setPage("createpurchase")}>Create a Purchase</button>
          <button onClick={() => setPage("purchaselist")}>Purchase List</button>
        </div>
      </div>
    </div>
  );
}
export default App;