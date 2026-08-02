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
type WorkOrderStatus = 'draft' | 'active' | 'completed' | 'closed' | 'invoiced' | 'sent' | 'nocharge' | 'deleted' | 'paid';

type WorkOrderHistoryEntry = {
  status: string; // WorkOrderStatus or 'assigned:username' or 'unassigned'
  timestamp: string; // ISO string
  changedBy?: string;
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
  assignedTo?: string;
  createdBy?: string;
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
  const [authUser, setAuthUser] = React.useState<{ id: number; username: string; userType: string } | null>(null);
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
  const [woForm, setWoForm] = React.useState<Omit<WorkOrder, 'number' | 'status' | 'history'> & { status?: WorkOrderStatus, history?: WorkOrderHistoryEntry[] }>({    propertyName: '',
    title: '',
    instructions: '',
    scheduledTime: '',
    scheduledDate: '',
    assignedTo: '',
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

  // Edit estimate state
  const [editingEstimate, setEditingEstimate] = React.useState<Estimate | null>(null);
  const [editEstimateForm, setEditEstimateForm] = React.useState({ propertyName: '', title: '', description: '', estimatedCost: '' });
  const [editEstimateSaving, setEditEstimateSaving] = React.useState(false);

  // Preview estimate state
  const [previewEstimate, setPreviewEstimate] = React.useState<Estimate | null>(null);

  // Invoice preview/edit state
  const [previewInvoiceWO, setPreviewInvoiceWO] = React.useState<WorkOrder | null>(null);
  const [previewInvoiceExpenses, setPreviewInvoiceExpenses] = React.useState<WorkOrderExpense[]>([]);
  const [previewInvoiceLoading, setPreviewInvoiceLoading] = React.useState(false);
  const [editingInvoiceWO, setEditingInvoiceWO] = React.useState<WorkOrder | null>(null);
  const [editInvoiceForm, setEditInvoiceForm] = React.useState<{
    title: string;
    instructions: string;
    billingDescription: string;
    editExpenses: Array<WorkOrderExpense & { markup: number }>;
    expensesLoading: boolean;
  }>({ title: '', instructions: '', billingDescription: '', editExpenses: [], expensesLoading: false });

  // Expense state
  const [selectedWOForExpenses, setSelectedWOForExpenses] = React.useState<WorkOrder | null>(null);
  const [woExpenses, setWoExpenses] = React.useState<WorkOrderExpense[]>([]);
  const [expenseLoading] = React.useState(false);
  const [expenseForm, setExpenseForm] = React.useState({
    description: '', category: 'Part', quantity: '1', unitCost: '', totalCost: '', vendor: '', partNumber: ''
  });
  const [expenseSubmitting, setExpenseSubmitting] = React.useState(false);

  const [showViewExpenseForm, setShowViewExpenseForm] = React.useState(false);
  const [showLaborForm, setShowLaborForm] = React.useState(false);
  const [laborTime, setLaborTime] = React.useState('1:00');
  const viewDetailPhotoInputRef = React.useRef<HTMLInputElement>(null);
  const viewDetailCameraInputRef = React.useRef<HTMLInputElement>(null);

  // Work order detail view
  const [viewingWO, setViewingWO] = React.useState<WorkOrder | null>(null);
  const [viewWOPhotos, setViewWOPhotos] = React.useState<WorkOrderPhoto[]>([]);
  const [viewWOExpenses, setViewWOExpenses] = React.useState<WorkOrderExpense[]>([]);
  const [viewWOLoading, setViewWOLoading] = React.useState(false);
  const [viewWOFromPage, setViewWOFromPage] = React.useState<string>('home');
  const [editingWODetails, setEditingWODetails] = React.useState(false);
  const [editWOForm, setEditWOForm] = React.useState({ propertyName: '', title: '', instructions: '', scheduledDate: '', scheduledTime: '' });
  const [editWOSaving, setEditWOSaving] = React.useState(false);

  // User management state
  type UserRecord = { id: number; username: string; password_hash: string; user_type: string; created_at: string };
  const [userList, setUserList] = React.useState<UserRecord[]>([]);
  const [usersLoading, setUsersLoading] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<UserRecord | null>(null);
  const [editUserForm, setEditUserForm] = React.useState({ username: '', password: '', userType: 'tech' });
  const [editUserSaving, setEditUserSaving] = React.useState(false);
  const [showPasswords, setShowPasswords] = React.useState(false);
  const [addUserForm, setAddUserForm] = React.useState({ username: '', password: '', userType: 'tech' });
  const [addUserSaving, setAddUserSaving] = React.useState(false);
  const [addUserDone, setAddUserDone] = React.useState(false);
  const [addUserError, setAddUserError] = React.useState('');
  const [showLogout, setShowLogout] = React.useState(false);
  const [homeMenu, setHomeMenu] = React.useState<string | null>(null);
  const [homeSubMenu, setHomeSubMenu] = React.useState<string | null>(null);
  const [clockTime, setClockTime] = React.useState(new Date());
  const [weather, setWeather] = React.useState<{ date: string; maxTemp: number; minTemp: number; code: number }[]>([]);
  const [calView, setCalView] = React.useState<'month' | 'week'>('month');
  const [calDate, setCalDate] = React.useState(() => new Date());

  // Team state
  type TeamProfile = { userId: number; username: string; userType: string; schedule: Record<string, { start: string; end: string; hours: number }>; payRate: string; ptoTotal: number; ptoUsed: number; sickTotal: number; sickUsed: number; notes: string; };
  type DayOff = { id: number; user_id: number; username: string; date: string; reason: string; type: string; status: string; };
  const [teamProfiles, setTeamProfiles] = React.useState<TeamProfile[]>([]);
  const [daysOff, setDaysOff] = React.useState<DayOff[]>([]);
  const [editingProfile, setEditingProfile] = React.useState<TeamProfile | null>(null);
  const [profileForm, setProfileForm] = React.useState<TeamProfile | null>(null);
  const [dayOffForm, setDayOffForm] = React.useState({ userId: 0, date: '', reason: '', type: 'PTO' });
  const [teamLoading, setTeamLoading] = React.useState(false);
  const [allExpenses, setAllExpenses] = React.useState<{ total_cost: string; created_at: string; status: string; scheduled_date: string }[]>([]);
  const [kpiRange, setKpiRange] = React.useState<'alltime'|'year'|'month'|'week'|'day'>('alltime');

  // Recurring & Internal Services
  type RecurringItem = { id: number; title: string; property_name: string; instructions: string; frequency: string; day_of_week: string; day_of_month: number; assigned_to: string; active: number; last_generated: string; next_due: string; notes: string; };
  type InternalService = { id: number; title: string; category: string; description: string; frequency: string; day_of_week: string; day_of_month: number; assigned_to: string; active: number; last_completed: string; next_due: string; notes: string; };
  const blankRecurring = (): Omit<RecurringItem,'id'> => ({ title:'', property_name:'', instructions:'', frequency:'monthly', day_of_week:'', day_of_month:1, assigned_to:'', active:1, last_generated:'', next_due:'', notes:'' });
  const blankInternal = (): Omit<InternalService,'id'> => ({ title:'', category:'general', description:'', frequency:'monthly', day_of_week:'', day_of_month:1, assigned_to:'', active:1, last_completed:'', next_due:'', notes:'' });
  const [recurringItems, setRecurringItems] = React.useState<RecurringItem[]>([]);
  const [internalServices, setInternalServices] = React.useState<InternalService[]>([]);
  const [recurringLoading, setRecurringLoading] = React.useState(false);
  const [editingRecurring, setEditingRecurring] = React.useState<RecurringItem | null>(null);
  const [recurringForm, setRecurringForm] = React.useState<Omit<RecurringItem,'id'>>(blankRecurring());
  const [editingInternal, setEditingInternal] = React.useState<InternalService | null>(null);
  const [internalForm, setInternalForm] = React.useState<Omit<InternalService,'id'>>(blankInternal());
  const [internalTab, setInternalTab] = React.useState<'fleet'|'general'>('general');
  const [recurringTab, setRecurringTab] = React.useState<'active'|'inactive'>('active');

  // Personal Settings
  const [personalForm, setPersonalForm] = React.useState({ newUsername: '', currentPassword: '', newPassword: '', confirmPassword: '' });
  const [personalSaving, setPersonalSaving] = React.useState(false);
  const [personalMsg, setPersonalMsg] = React.useState<{ type: 'success'|'error'; text: string } | null>(null);
  const [techDashStyle, setTechDashStyleState] = React.useState<'classic'|'dropdown'>(() => (localStorage.getItem('techDashStyle') as 'classic'|'dropdown') || 'classic');
  const setTechDashStyle = (v: 'classic'|'dropdown') => { localStorage.setItem('techDashStyle', v); setTechDashStyleState(v); };
  const [techWOFilter, setTechWOFilterState] = React.useState<'assigned'|'all'>(() => (localStorage.getItem('techWOFilter') as 'assigned'|'all') || 'assigned');
  const setTechWOFilter = (v: 'assigned'|'all') => { localStorage.setItem('techWOFilter', v); setTechWOFilterState(v); };
  const [mgrViewMode, setMgrViewModeState] = React.useState<'dash'|'tech'>(() => (localStorage.getItem('mgrViewMode') as 'dash'|'tech') || 'dash');
  const setMgrViewMode = (v: 'dash'|'tech') => { localStorage.setItem('mgrViewMode', v); setMgrViewModeState(v); };
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [mobileOpenSection, setMobileOpenSection] = React.useState<string | null>(null);
  const [mobileOpenSubSection, setMobileOpenSubSection] = React.useState<string | null>(null);
  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  React.useEffect(() => {
    const t = setInterval(() => setClockTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  React.useEffect(() => {
    // Wilmington, NC: lat=34.2257, lon=-77.9447
    fetch('https://api.open-meteo.com/v1/forecast?latitude=34.2257&longitude=-77.9447&daily=temperature_2m_max,temperature_2m_min,weathercode&temperature_unit=fahrenheit&timezone=America%2FNew_York&forecast_days=7')
      .then(r => r.json())
      .then(data => {
        const days = data.daily.time.map((date: string, i: number) => ({
          date,
          maxTemp: Math.round(data.daily.temperature_2m_max[i]),
          minTemp: Math.round(data.daily.temperature_2m_min[i]),
          code: data.daily.weathercode[i],
        }));
        setWeather(days);
      })
      .catch(() => {});
  }, []);

  // ─── System Logs state ────────────────────────────────────
  type SystemLog = { id: number; username: string; action: string; category: string; target: string; detail: string; created_at: string };
  const [systemLogs, setSystemLogs] = React.useState<SystemLog[]>([]);
  const [logsLoading, setLogsLoading] = React.useState(false);
  const [logSortField, setLogSortField] = React.useState<keyof SystemLog>('id');
  const [logSortDir, setLogSortDir] = React.useState<'asc'|'desc'>('desc');
  const [logFilterUser, setLogFilterUser] = React.useState('');
  const [logFilterAction, setLogFilterAction] = React.useState('');
  const [logFilterCategory, setLogFilterCategory] = React.useState('');

  // ─── Work Order Notes state ──────────────────────────────
  type WONote = { id: number; work_order_number: string; note: string; author: string; created_at: string; updated_at?: string };
  const [viewWONotes, setViewWONotes] = React.useState<WONote[]>([]);
  const [noteInput, setNoteInput] = React.useState('');
  const [noteSaving, setNoteSaving] = React.useState(false);
  const [editingNoteId, setEditingNoteId] = React.useState<number | null>(null);
  const [editingNoteText, setEditingNoteText] = React.useState('');

  // ─── Load users when navigating to userlist ──────────────
  React.useEffect(() => {
    if (page === 'userlist' && authUser) {
      setUsersLoading(true);
      api.fetchUsers().then(setUserList).catch(() => setUserList([])).finally(() => setUsersLoading(false));
    }
    if (page === 'systemlogs' && authUser?.userType === 'admin') {
      setLogsLoading(true);
      api.fetchSystemLogs().then(setSystemLogs).catch(() => setSystemLogs([])).finally(() => setLogsLoading(false));
    }
  }, [page, authUser]);

  // ─── Load notes when viewing WO detail ───────────────────
  React.useEffect(() => {
    if (page === 'workorderdetail' && viewingWO) {
      api.fetchWorkOrderNotes(viewingWO.number).then(setViewWONotes).catch(() => setViewWONotes([]));
    }
  }, [page, viewingWO]);

  // ─── Load team data when navigating to team pages ───────
  React.useEffect(() => {
    if ((page === 'teaminfo' || page === 'payroll' || page === 'submitdayoff') && authUser) {
      setTeamLoading(true);
      Promise.all([api.fetchTeamProfiles(), api.fetchDaysOff()])
        .then(([profiles, offs]) => { setTeamProfiles(profiles); setDaysOff(offs); })
        .catch(() => {})
        .finally(() => setTeamLoading(false));
    }
    if ((page === 'recurringworkorders' || page === 'internalservices') && authUser) {
      setRecurringLoading(true);
      Promise.all([api.fetchRecurring(), api.fetchInternalServices()])
        .then(([r, s]) => { setRecurringItems(r); setInternalServices(s); })
        .catch(() => {})
        .finally(() => setRecurringLoading(false));
    }
  }, [page, authUser]);

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
      // Load dashboard widgets data
      const [exps, profiles, offs] = await Promise.all([
        api.fetchAllExpenses().catch(() => []),
        api.fetchTeamProfiles().catch(() => []),
        api.fetchDaysOff().catch(() => []),
      ]);
      setAllExpenses(exps);
      setTeamProfiles(profiles);
      setDaysOff(offs);
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
      assignedTo: woForm.assignedTo || '',
    };
    await api.createWorkOrder(newWO);
    await loadAllData();
    setWoSubmitted(true);
    setWoForm({ propertyName: '', title: '', instructions: '', scheduledTime: '', scheduledDate: '', assignedTo: '', status: 'draft', history: [] });
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
  };

  const reactivateWorkOrder = async (number: string) => {
    if (!confirm('Reactivate this work order? It will return to Active Work Orders.')) return;
    await api.updateWorkOrderStatus(number, 'active');
    await loadAllData();
    setPage('workorderlist');
  };

  const invoiceWorkOrder = async (number: string) => {
    if (!confirm('Mark this work order as Invoiced?')) return;
    await api.updateWorkOrderStatus(number, 'invoiced');
    await loadAllData();
  };

  const noChargeWorkOrder = async (number: string) => {
    if (!confirm('Mark this work order as No Charge?')) return;
    await api.updateWorkOrderStatus(number, 'nocharge');
    await loadAllData();
  };

  const markSentWorkOrder = async (wo: WorkOrder) => {
    if (wo.status === 'nocharge') {
      if (!confirm('Mark this No Charge work order as sent? It will be automatically marked as Paid.')) return;
      await api.updateWorkOrderStatus(wo.number, 'paid');
    } else {
      if (!confirm('Mark this invoice as Sent?')) return;
      await api.updateWorkOrderStatus(wo.number, 'sent');
    }
    await loadAllData();
  };

  const paidWorkOrder = async (number: string) => {
    if (!confirm('Mark this invoice as Paid?')) return;
    await api.updateWorkOrderStatus(number, 'paid');
    await loadAllData();
  };

  const deleteWorkOrder = async (number: string) => {
    if (!confirm('Delete this work order? It will be moved to the Deleted list.')) return;
    await api.deleteWorkOrder(number);
    await loadAllData();
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

  const [editingProperty, setEditingProperty] = React.useState<PropertyForm | null>(null);
  const [editPropertyForm, setEditPropertyForm] = React.useState<PropertyForm>({ propertyName: '', address: '', street: '', city: '', state: '', zip: '', ownerName: '', ownerPhone: '' });
  const [editPropertySaving, setEditPropertySaving] = React.useState(false);
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

  const saveEditEstimate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEstimate) return;
    setEditEstimateSaving(true);
    try {
      await api.updateEstimate(editingEstimate.number, editEstimateForm);
      await loadAllData();
      setEditingEstimate(null);
    } catch (err) {
      console.error('Failed to save estimate', err);
      alert('Save failed. Please try again.');
    } finally {
      setEditEstimateSaving(false);
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

    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minHeight: "100vh", padding: "1rem", background: "#e8edf8" }}>
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
          <div style={{ background: '#fff', border: '1px solid #b0c0e0', borderRadius: 10, padding: 20, marginBottom: 20, boxShadow: '0 2px 8px rgba(26,58,122,0.08)' }}>
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
                  {viewingWO.createdBy && <div><span style={{ fontWeight: 600, color: '#555', fontSize: 13 }}>Created By</span><br />{viewingWO.createdBy}</div>}
                  <div>
                    <span style={{ fontWeight: 600, color: '#555', fontSize: 13 }}>Assigned To</span><br />
                    {(authUser?.userType === 'admin' || authUser?.userType === 'mgr' || authUser?.userType === 'dispatch') ? (
                      <select value={viewingWO.assignedTo || ''} onChange={async e => {
                        const val = e.target.value;
                        await api.assignWorkOrder(viewingWO.number, val);
                        await loadAllData();
                        setViewingWO(prev => prev ? { ...prev, assignedTo: val } : prev);
                      }} style={{ marginTop: 4, padding: '4px 8px', border: '1px solid #b0c0e0', borderRadius: 6, fontSize: 13 }}>
                        <option value="">— Unassigned —</option>
                        {teamProfiles.map(tp => (
                          <option key={tp.userId} value={tp.username}>{tp.username}</option>
                        ))}
                      </select>
                    ) : (
                      <span>{viewingWO.assignedTo || '— Unassigned'}</span>
                    )}
                  </div>
                </div>
                <div style={{ marginTop: 16 }}>
                  <span style={{ fontWeight: 600, color: '#555', fontSize: 13 }}>Instructions / Scope of Work</span>
                  <p style={{ margin: '6px 0 0', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{viewingWO.instructions}</p>
                </div>
              </>
            )}
          </div>

          {/* Expenses */}
          <div style={{ background: '#fff', border: '1px solid #b0c0e0', borderRadius: 10, padding: 20, marginBottom: 20, boxShadow: '0 2px 8px rgba(26,58,122,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: 16, color: '#333' }}>Parts &amp; Expenses</h2>
              <button onClick={() => setShowViewExpenseForm(v => !v)} style={{ background: showViewExpenseForm ? '#888' : '#2a9d2a', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                {showViewExpenseForm ? '✕ Cancel' : '+ Add Expense'}
              </button>
            </div>
            {showViewExpenseForm && (
              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await api.createWorkOrderExpense(viewingWO.number, { ...expenseForm, category: 'Part' });
                  const expenses = await api.fetchWorkOrderExpenses(viewingWO.number);
                  setViewWOExpenses(expenses);
                  setExpenseForm({ description: '', category: 'Part', quantity: '1', unitCost: '', totalCost: '', vendor: '', partNumber: '' });
                  setShowViewExpenseForm(false);
                } catch { alert('Failed to add expense.'); }
              }} style={{ background: '#f0f4ff', border: '1px solid #c0d0f0', borderRadius: 8, padding: 16, marginBottom: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <label style={{ fontWeight: 600, fontSize: 13, gridColumn: '1/-1' }}>
                  Description *
                  <input name="description" value={expenseForm.description} onChange={handleExpenseFormChange} required placeholder="e.g. 3/4 PVC coupling" style={{ display: 'block', width: '100%', marginTop: 4, padding: '6px 8px', border: '1px solid #aaa', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
                </label>
                <label style={{ fontWeight: 600, fontSize: 13 }}>
                  Qty
                  <input name="quantity" type="number" min="0" step="any" value={expenseForm.quantity} onChange={handleExpenseFormChange} style={{ display: 'block', width: '100%', marginTop: 4, padding: '6px 8px', border: '1px solid #aaa', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
                </label>
                <label style={{ fontWeight: 600, fontSize: 13 }}>
                  Unit Cost ($)
                  <input name="unitCost" type="number" min="0" step="0.01" value={expenseForm.unitCost} onChange={handleExpenseFormChange} placeholder="0.00" style={{ display: 'block', width: '100%', marginTop: 4, padding: '6px 8px', border: '1px solid #aaa', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
                </label>
                <label style={{ fontWeight: 600, fontSize: 13, gridColumn: '1/-1' }}>
                  Total Cost ($)
                  <input name="totalCost" type="number" min="0" step="0.01" value={expenseForm.totalCost} onChange={handleExpenseFormChange} placeholder="Auto-calculated" style={{ display: 'block', width: '100%', marginTop: 4, padding: '6px 8px', border: '1px solid #aaa', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
                </label>
                <button type="submit" style={{ gridColumn: '1/-1', background: '#1a3a7a', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 0', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>✓ Save Expense</button>
              </form>
            )}
            {viewWOLoading && <p style={{ color: '#888' }}>Loading...</p>}
            {!viewWOLoading && viewWOExpenses.filter(e => e.category !== 'Labor').length === 0 && <p style={{ color: '#888' }}>No expenses recorded.</p>}
            {viewWOExpenses.filter(e => e.category !== 'Labor').length > 0 && (
              <>
                <table className="wo-table" style={{ background: '#fff' }}>
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th>Qty</th>
                      <th>Unit $</th>
                      <th>Total $</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewWOExpenses.filter(e => e.category !== 'Labor').map((exp, i) => (
                      <tr key={exp.id} style={{ background: i % 2 === 0 ? '#f0f4ff' : '#fff' }}>
                        <td data-label="Description" style={{ color: '#111', fontWeight: 600 }}>{exp.description}</td>
                        <td data-label="Qty" style={{ color: '#111' }}>{exp.quantity}</td>
                        <td data-label="Unit $" style={{ color: '#111' }}>{exp.unitCost ? `$${exp.unitCost}` : '—'}</td>
                        <td data-label="Total $" style={{ color: '#0a6e0a', fontWeight: 700 }}>{exp.totalCost ? `$${exp.totalCost}` : '—'}</td>
                        <td><button onClick={async () => { if (!confirm('Delete this expense?')) return; await api.deleteWorkOrderExpense(exp.id); const expenses = await api.fetchWorkOrderExpenses(viewingWO.number); setViewWOExpenses(expenses); }} style={{ background: '#ff4d4d', color: '#fff', border: 'none', borderRadius: 4, padding: '3px 8px', cursor: 'pointer', fontSize: 12 }}>🗑</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p style={{ textAlign: 'right', fontWeight: 700, fontSize: 16, color: '#0a6e0a', marginTop: 8 }}>
                  Total: ${viewWOExpenses.filter(e => e.category !== 'Labor').reduce((sum, e) => sum + (parseFloat(e.totalCost) || 0), 0).toFixed(2)}
                </p>
              </>
            )}
          </div>

          {/* Labor */}
          <div style={{ background: '#fff', border: '1px solid #b0c0e0', borderRadius: 10, padding: 20, marginBottom: 20, boxShadow: '0 2px 8px rgba(26,58,122,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: 16, color: '#333' }}>Labor</h2>
              <button onClick={() => setShowLaborForm(v => !v)} style={{ background: showLaborForm ? '#888' : '#ff9900', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                {showLaborForm ? '✕ Cancel' : '+ Add Labor'}
              </button>
            </div>
            {showLaborForm && (
              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const [hStr, mStr] = laborTime.split(':');
                  const totalHours = parseInt(hStr) + parseInt(mStr) / 60;
                  const laborRate = 55.00;
                  const laborTotal = (totalHours * laborRate).toFixed(2);
                  await api.createWorkOrderExpense(viewingWO.number, {
                    description: laborTime,
                    category: 'Labor',
                    quantity: String(totalHours),
                    unitCost: String(laborRate),
                    totalCost: laborTotal,
                    vendor: '',
                    partNumber: '',
                  });
                  const expenses = await api.fetchWorkOrderExpenses(viewingWO.number);
                  setViewWOExpenses(expenses);
                  setLaborTime('1:00');
                  setShowLaborForm(false);
                } catch { alert('Failed to add labor.'); }
              }} style={{ background: '#fff8ee', border: '1px solid #f0d080', borderRadius: 8, padding: 16, marginBottom: 16 }}>
                <label style={{ fontWeight: 600, fontSize: 13, display: 'block' }}>
                  Time
                  <select value={laborTime} onChange={e => setLaborTime(e.target.value)} style={{ display: 'block', width: '100%', marginTop: 6, padding: '8px 10px', border: '1px solid #aaa', borderRadius: 6, fontSize: 14 }}>
                    {Array.from({ length: 48 }, (_, i) => {
                      const totalMins = (i + 1) * 15;
                      const h = Math.floor(totalMins / 60);
                      const m = totalMins % 60;
                      const label = h > 0 ? `${h}h ${m > 0 ? m + 'm' : ''}`.trim() : `${m}m`;
                      const value = h > 0 ? `${h}:${m.toString().padStart(2, '0')}` : `0:${m.toString().padStart(2, '0')}`;
                      return <option key={value} value={value}>{label}</option>;
                    })}
                  </select>
                </label>
                <button type="submit" style={{ marginTop: 14, width: '100%', background: '#ff9900', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 0', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>✓ Save Labor</button>
              </form>
            )}
            {viewWOExpenses.filter(e => e.category === 'Labor').length === 0 && !showLaborForm && (
              <p style={{ color: '#888' }}>No labor recorded.</p>
            )}
            {viewWOExpenses.filter(e => e.category === 'Labor').length > 0 && (
              <table className="wo-table" style={{ background: '#fff' }}>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Rate</th>
                    <th>Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {viewWOExpenses.filter(e => e.category === 'Labor').map((exp, i) => (
                    <tr key={exp.id} style={{ background: i % 2 === 0 ? '#fff8ee' : '#fff' }}>
                      <td data-label="Time" style={{ fontWeight: 600, color: '#b35c00' }}>{exp.description}</td>
                      <td data-label="Rate" style={{ color: '#555' }}>{exp.unitCost ? `$${exp.unitCost}/hr` : '—'}</td>
                      <td data-label="Total" style={{ fontWeight: 700, color: '#0a6e0a' }}>{exp.totalCost ? `$${exp.totalCost}` : '—'}</td>
                      <td><button onClick={async () => { if (!confirm('Delete this labor entry?')) return; await api.deleteWorkOrderExpense(exp.id); const expenses = await api.fetchWorkOrderExpenses(viewingWO.number); setViewWOExpenses(expenses); }} style={{ background: '#ff4d4d', color: '#fff', border: 'none', borderRadius: 4, padding: '3px 8px', cursor: 'pointer', fontSize: 12 }}>🗑</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Photos */}
          <div style={{ background: '#fff', border: '1px solid #b0c0e0', borderRadius: 10, padding: 20, marginBottom: 20, boxShadow: '0 2px 8px rgba(26,58,122,0.08)' }}>
            <input type="file" accept="image/*" ref={viewDetailPhotoInputRef} style={{ display: 'none' }} onChange={async (e) => {
              const file = e.target.files?.[0]; if (!file) return;
              setPhotoUploading(true);
              try {
                const { base64, mimeType } = await compressImage(file);
                const filename = file.name.replace(/\.[^.]+$/, '') + '.jpg';
                await api.uploadWorkOrderPhoto(viewingWO.number, filename, mimeType, base64);
                const photos = await api.fetchWorkOrderPhotos(viewingWO.number);
                const withData = await Promise.all(photos.map(async (p: WorkOrderPhoto) => ({ ...p, data: (await api.fetchPhotoData(p.id)).data })));
                setViewWOPhotos(withData);
              } catch { alert('Upload failed.'); }
              finally { setPhotoUploading(false); if (viewDetailPhotoInputRef.current) viewDetailPhotoInputRef.current.value = ''; }
            }} />
            <input type="file" accept="image/*" capture="environment" ref={viewDetailCameraInputRef} style={{ display: 'none' }} onChange={async (e) => {
              const file = e.target.files?.[0]; if (!file) return;
              setPhotoUploading(true);
              try {
                const { base64, mimeType } = await compressImage(file);
                const filename = file.name.replace(/\.[^.]+$/, '') + '.jpg';
                await api.uploadWorkOrderPhoto(viewingWO.number, filename, mimeType, base64);
                const photos = await api.fetchWorkOrderPhotos(viewingWO.number);
                const withData = await Promise.all(photos.map(async (p: WorkOrderPhoto) => ({ ...p, data: (await api.fetchPhotoData(p.id)).data })));
                setViewWOPhotos(withData);
              } catch { alert('Upload failed.'); }
              finally { setPhotoUploading(false); if (viewDetailCameraInputRef.current) viewDetailCameraInputRef.current.value = ''; }
            }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: 16, color: '#333' }}>Photos</h2>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => viewDetailPhotoInputRef.current?.click()} disabled={photoUploading} style={{ background: '#1a3a7a', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>📁 Upload</button>
                <button onClick={() => viewDetailCameraInputRef.current?.click()} disabled={photoUploading} style={{ background: '#6c3db5', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>📷 Camera</button>
              </div>
            </div>
            {photoUploading && <p style={{ color: '#888' }}>Uploading...</p>}
            {viewWOLoading && <p style={{ color: '#888' }}>Loading...</p>}
            {!viewWOLoading && viewWOPhotos.length === 0 && <p style={{ color: '#888' }}>No photos attached.</p>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
              {viewWOPhotos.map((photo) => (
                <div key={photo.id} style={{ border: '1px solid #ddd', borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
                  <img src={photo.data} alt={photo.filename} style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }} />
                  <div style={{ padding: '4px 6px', fontSize: 11, background: '#f0f0f0', color: '#444', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{photo.filename}</span>
                    <button onClick={async () => { if (!confirm('Delete this photo?')) return; await api.deleteWorkOrderPhoto(photo.id); const photos = await api.fetchWorkOrderPhotos(viewingWO.number); const withData = await Promise.all(photos.map(async (p: WorkOrderPhoto) => ({ ...p, data: (await api.fetchPhotoData(p.id)).data }))); setViewWOPhotos(withData); }} style={{ background: '#ff4d4d', color: '#fff', border: 'none', borderRadius: 4, padding: '2px 6px', cursor: 'pointer', fontSize: 11, flexShrink: 0, marginLeft: 4 }}>🗑</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div style={{ background: '#fff', border: '1px solid #b0c0e0', borderRadius: 10, padding: 20, marginBottom: 20, boxShadow: '0 2px 8px rgba(26,58,122,0.08)' }}>
            <h2 style={{ margin: '0 0 12px', fontSize: 16, color: '#333' }}>Notes</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!noteInput.trim()) return;
              setNoteSaving(true);
              try {
                const res = await api.createWorkOrderNote(viewingWO.number, noteInput.trim());
                if (res && res.error) { alert('Failed to add note: ' + res.error); return; }
                setNoteInput('');
                const notes = await api.fetchWorkOrderNotes(viewingWO.number);
                setViewWONotes(Array.isArray(notes) ? notes : []);
              } catch (err) {
                alert('Failed to add note. Please try again.');
              } finally {
                setNoteSaving(false);
              }
            }} style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <input
                value={noteInput}
                onChange={e => setNoteInput(e.target.value)}
                placeholder="Add a note..."
                style={{ flex: 1, padding: '6px 10px', border: '1px solid #b0c0e0', borderRadius: 6, fontSize: 14 }}
              />
              <button type="submit" disabled={noteSaving || !noteInput.trim()} style={{ padding: '6px 16px', background: '#1a3a7a', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                {noteSaving ? '...' : 'Add'}
              </button>
            </form>
            {viewWONotes.length === 0 && <p style={{ color: '#888' }}>No notes yet.</p>}
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {viewWONotes.map((n: WONote) => (
                <li key={n.id} style={{ background: '#f0f4ff', borderRadius: 8, padding: '10px 14px', marginBottom: 10, border: '1px solid #d0d8f0' }}>
                  {editingNoteId === n.id ? (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        value={editingNoteText}
                        onChange={e => setEditingNoteText(e.target.value)}
                        style={{ flex: 1, padding: '4px 8px', border: '1px solid #b0c0e0', borderRadius: 6, fontSize: 14 }}
                      />
                      <button onClick={async () => {
                        await api.updateWorkOrderNote(n.id, editingNoteText);
                        setEditingNoteId(null);
                        const notes = await api.fetchWorkOrderNotes(viewingWO.number);
                        setViewWONotes(notes);
                      }} style={{ padding: '4px 12px', background: '#1a7a3a', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>Save</button>
                      <button onClick={() => setEditingNoteId(null)} style={{ padding: '4px 10px', background: '#888', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Cancel</button>
                    </div>
                  ) : (
                    <>
                      <div style={{ fontSize: 14, color: '#213547', marginBottom: 6 }}>{n.note}</div>
                      <div style={{ fontSize: 11, color: '#666', display: 'flex', gap: 12, alignItems: 'center' }}>
                        <span>👤 {n.author}</span>
                        <span>🕐 {new Date(n.created_at).toLocaleString()}</span>
                        {n.updated_at && <span style={{ fontStyle: 'italic' }}>(edited)</span>}
                        <button onClick={() => { setEditingNoteId(n.id); setEditingNoteText(n.note); }} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#1a3a7a', fontSize: 12 }}>✏️ Edit</button>
                        <button onClick={async () => {
                          if (!confirm('Delete this note?')) return;
                          await api.deleteWorkOrderNote(n.id);
                          const notes = await api.fetchWorkOrderNotes(viewingWO.number);
                          setViewWONotes(notes);
                        }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cc0000', fontSize: 12 }}>🗑 Delete</button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* History */}
          <div style={{ background: '#fff', border: '1px solid #b0c0e0', borderRadius: 10, padding: 20, marginBottom: 20, boxShadow: '0 2px 8px rgba(26,58,122,0.08)' }}>
            <h2 style={{ margin: '0 0 12px', fontSize: 16, color: '#333' }}>History</h2>
            {viewingWO.history.length === 0 && <p style={{ color: '#888' }}>No history.</p>}
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {viewingWO.history.map((entry: WorkOrderHistoryEntry, idx: number) => {
                const isAssign = entry.status.startsWith('assigned:') || entry.status === 'unassigned';
                const label = isAssign ? (entry.status === 'unassigned' ? 'Unassigned' : `Assigned → ${entry.status.replace('assigned:', '')}`) : entry.status;
                const color = isAssign ? '#e67e00' : (statusColors[entry.status as WorkOrderStatus] || '#888');
                return (
                  <li key={idx} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '8px 12px', marginBottom: 6, background: idx % 2 === 0 ? '#f0f4ff' : '#e8edf8', borderRadius: 6, borderLeft: `4px solid ${color}` }}>
                    <span style={{ background: color, color: '#fff', borderRadius: 12, padding: '2px 10px', fontSize: 12, fontWeight: 600, textTransform: isAssign ? 'none' : 'uppercase', whiteSpace: 'nowrap' }}>{label}</span>
                    <span style={{ color: '#333', fontSize: 13, fontWeight: 500 }}>{new Date(entry.timestamp).toLocaleString()}</span>
                    {entry.changedBy && <span style={{ marginLeft: 'auto', color: '#666', fontSize: 12 }}>👤 {entry.changedBy}</span>}
                  </li>
                );
              })}
            </ul>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, flexWrap: 'wrap', gap: 8 }}>
            <button onClick={() => setPage(viewWOFromPage)}>← Back to List</button>
            {viewingWO.status === 'active' && (
              <button
                onClick={async () => { await completeWorkOrder(viewingWO.number); setPage(viewWOFromPage); }}
                style={{ background: '#2a9d2a', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
              >
                ✓ Mark Complete
              </button>
            )}
            {viewingWO.status === 'completed' && (
              <button
                onClick={async () => { await closeWorkOrder(viewingWO.number); setPage(viewWOFromPage); }}
                style={{ background: '#555', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
              >
                ✕ Close Work Order
              </button>
            )}
          </div>
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

    const EstimateRows = ({ ests, showWO }: { ests: Estimate[], showWO?: boolean }) => (
      <>{ests.map((est: Estimate, idx: number) => (
        <tr key={idx}>
          <td data-label="Est #">{est.number}</td>
          <td data-label="Property">{est.propertyName}</td>
          <td data-label="Title">{est.title}</td>
          <td data-label="Est. Cost">{est.estimatedCost ? `$${est.estimatedCost}` : '—'}</td>
          {showWO && (
            <td data-label="Work Order">
              {est.convertedTo ? (
                <button onClick={() => { const wo = workOrders.find((w) => w.number === est.convertedTo); if (wo) openWODetail(wo, 'estimatelist'); else alert('Work order not found.'); }} style={{ background: 'none', border: 'none', color: '#0099FF', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', padding: 0, fontSize: 'inherit' }}>{est.convertedTo}</button>
              ) : '—'}
            </td>
          )}
          <td style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button style={{ background: '#555', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer' }} onClick={() => setPreviewEstimate(est)}>📄 Preview</button>
            {est.status === 'pending' && (
              <>
                <button style={{ background: '#6c3db5', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer' }} onClick={() => { setEditingEstimate(est); setEditEstimateForm({ propertyName: est.propertyName, title: est.title, description: est.description, estimatedCost: est.estimatedCost }); }}>✏️ Edit</button>
                <button style={{ background: '#0099FF', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer' }} onClick={() => convertEstimateToWorkOrder(est)}>▶ Convert to WO</button>
                <button style={{ background: '#ff9900', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer' }} onClick={() => rejectEstimate(est.number)}>✕ Reject</button>
              </>
            )}
            <button style={{ background: '#ff4d4d', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer' }} onClick={() => deleteEstimate(est.number)}>🗑</button>
          </td>
        </tr>
      ))}</>
    );

    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minHeight: "100vh", padding: "1rem", background: "#e8edf8" }}>
        <h1>Estimates</h1>

        <h2 style={{ alignSelf: 'flex-start', maxWidth: 960, width: '100%', margin: '1rem auto 0.5rem' }}>Pending</h2>
        {pendingEstimates.length === 0 ? (
          <p style={{ alignSelf: 'flex-start', maxWidth: 960, width: '100%', margin: '0 auto' }}>No pending estimates.</p>
        ) : (
          <table className="wo-table" style={{ maxWidth: 960 }}>
            <thead><tr><th>Est #</th><th>Property</th><th>Title</th><th>Est. Cost</th><th>Actions</th></tr></thead>
            <tbody><EstimateRows ests={pendingEstimates} /></tbody>
          </table>
        )}

        {convertedEstimates.length > 0 && (
          <>
            <h2 style={{ alignSelf: 'flex-start', maxWidth: 960, width: '100%', margin: '1.5rem auto 0.5rem', color: '#2a9d2a' }}>Converted to Work Orders</h2>
            <table className="wo-table" style={{ maxWidth: 960 }}>
              <thead><tr><th>Est #</th><th>Property</th><th>Title</th><th>Est. Cost</th><th>Work Order</th><th>Actions</th></tr></thead>
              <tbody><EstimateRows ests={convertedEstimates} showWO /></tbody>
            </table>
          </>
        )}

        {rejectedEstimates.length > 0 && (
          <>
            <h2 style={{ alignSelf: 'flex-start', maxWidth: 960, width: '100%', margin: '1.5rem auto 0.5rem', color: '#888' }}>Rejected</h2>
            <table className="wo-table" style={{ maxWidth: 960 }}>
              <thead><tr><th>Est #</th><th>Property</th><th>Title</th><th>Est. Cost</th><th>Actions</th></tr></thead>
              <tbody><EstimateRows ests={rejectedEstimates} /></tbody>
            </table>
          </>
        )}

        <button style={{ marginTop: 24 }} onClick={() => setPage("home")}>Return to Home</button>

        {/* ── Edit Estimate Modal ── */}
        {editingEstimate && (
          <div className="photo-modal">
            <div className="photo-modal-content" style={{ maxWidth: 520 }}>
              <h2>Edit Estimate — {editingEstimate.number}</h2>
              <form onSubmit={saveEditEstimate} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <label style={{ fontWeight: 600, fontSize: 13 }}>
                  Property
                  <select value={editEstimateForm.propertyName} onChange={(e) => setEditEstimateForm((p) => ({ ...p, propertyName: e.target.value }))} required style={{ display: 'block', width: '100%', marginTop: 4, padding: '7px 10px', border: '1px solid #aaa', borderRadius: 6, fontSize: 14 }}>
                    <option value="" disabled>Select a property</option>
                    {properties.map((prop: PropertyForm, i: number) => <option key={i} value={prop.propertyName}>{prop.propertyName}</option>)}
                  </select>
                </label>
                <label style={{ fontWeight: 600, fontSize: 13 }}>
                  Title (Project Name)
                  <input value={editEstimateForm.title} onChange={(e) => setEditEstimateForm((p) => ({ ...p, title: e.target.value }))} required style={{ display: 'block', width: '100%', marginTop: 4, padding: '7px 10px', border: '1px solid #aaa', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }} />
                </label>
                <label style={{ fontWeight: 600, fontSize: 13 }}>
                  Description / Scope of Work
                  <textarea value={editEstimateForm.description} onChange={(e) => setEditEstimateForm((p) => ({ ...p, description: e.target.value }))} required rows={4} style={{ display: 'block', width: '100%', marginTop: 4, padding: '7px 10px', border: '1px solid #aaa', borderRadius: 6, fontSize: 14, boxSizing: 'border-box', resize: 'vertical' }} />
                </label>
                <label style={{ fontWeight: 600, fontSize: 13 }}>
                  Estimated Cost ($)
                  <input value={editEstimateForm.estimatedCost} onChange={(e) => setEditEstimateForm((p) => ({ ...p, estimatedCost: e.target.value }))} placeholder="e.g. 1500.00" style={{ display: 'block', width: '100%', marginTop: 4, padding: '7px 10px', border: '1px solid #aaa', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }} />
                </label>
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <button type="submit" disabled={editEstimateSaving} style={{ background: '#2a9d2a', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 22px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>{editEstimateSaving ? 'Saving...' : '✓ Save'}</button>
                  <button type="button" onClick={() => setEditingEstimate(null)} style={{ background: '#888', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 14, cursor: 'pointer' }}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Preview / Print Estimate Modal ── */}
        {previewEstimate && (() => {
          const prop = properties.find((p: PropertyForm) => p.propertyName === previewEstimate.propertyName);
          const today = new Date(previewEstimate.createdAt || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
          const fmtMoney = (v: string) => v ? `$${parseFloat(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—';
          const printEstimate = () => {
            const el = document.getElementById('estimate-print-doc');
            if (!el) return;
            const win = window.open('', '_blank', 'width=800,height=900');
            if (!win) return;
            win.document.write(`<!DOCTYPE html><html><head><title>Estimate ${previewEstimate.number}</title><style>body{font-family:Arial,sans-serif;margin:0;padding:32px;color:#111;}table{border-collapse:collapse;width:100%;}th,td{padding:9px 12px;}@media print{body{padding:16px;}}</style></head><body>${el.innerHTML}</body></html>`);
            win.document.close();
            win.focus();
            setTimeout(() => { win.print(); win.close(); }, 400);
          };
          return (
            <div className="photo-modal">
              <div className="photo-modal-content" style={{ maxWidth: 700, padding: 0, overflow: 'hidden' }}>
                {/* Toolbar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', background: '#1a3a7a', color: '#fff' }}>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>Estimate {previewEstimate.number}</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={printEstimate} style={{ background: '#0099FF', color: '#fff', border: 'none', borderRadius: 4, padding: '7px 16px', cursor: 'pointer', fontWeight: 700 }}>🖨️ Download / Print</button>
                    <button onClick={() => setPreviewEstimate(null)} style={{ background: '#ff4d4d', color: '#fff', border: 'none', borderRadius: 4, padding: '7px 14px', cursor: 'pointer', fontWeight: 700 }}>✕ Close</button>
                  </div>
                </div>

                {/* Document */}
                <div style={{ overflowY: 'auto', maxHeight: '78vh' }}>
                  <div id="estimate-print-doc" style={{ padding: '36px', fontFamily: 'Arial, sans-serif', background: '#fff', color: '#111' }}>

                    {/* Header: logo left, ESTIMATE + number right */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, paddingBottom: 16, borderBottom: '3px solid #1a3a7a' }}>
                      <img src="/logo.png" alt="First Choice" style={{ height: 80, objectFit: 'contain' }} />
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 30, fontWeight: 900, color: '#1a3a7a', letterSpacing: 2 }}>ESTIMATE</div>
                        <table style={{ marginTop: 8, fontSize: 13, borderCollapse: 'collapse' }}>
                          <tbody>
                            <tr><td style={{ paddingRight: 12, color: '#555', fontWeight: 600 }}>Estimate #</td><td style={{ fontWeight: 700 }}>{previewEstimate.number}</td></tr>
                            <tr><td style={{ paddingRight: 12, color: '#555', fontWeight: 600 }}>Date</td><td>{today}</td></tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Bill To / Project */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                      <div style={{ background: '#f0f4ff', border: '1px solid #c0d0f0', borderRadius: 8, padding: 14 }}>
                        <div style={{ fontWeight: 800, color: '#1a3a7a', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Bill To</div>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{prop?.ownerName || previewEstimate.propertyName}</div>
                        {prop && <>
                          <div style={{ marginTop: 2 }}>{prop.street}</div>
                          <div>{prop.city}{prop.city && prop.state ? ', ' : ''}{prop.state} {prop.zip}</div>
                          {prop.ownerPhone && <div style={{ marginTop: 2 }}>{prop.ownerPhone}</div>}
                        </>}
                      </div>
                      <div style={{ background: '#f0f4ff', border: '1px solid #c0d0f0', borderRadius: 8, padding: 14 }}>
                        <div style={{ fontWeight: 800, color: '#1a3a7a', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Project</div>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{previewEstimate.title}</div>
                        <div style={{ marginTop: 4, color: '#555', fontSize: 13 }}>{previewEstimate.propertyName}</div>
                      </div>
                    </div>

                    {/* Line items */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 4 }}>
                      <thead>
                        <tr style={{ background: '#1a3a7a', color: '#fff' }}>
                          <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, width: 36 }}>#</th>
                          <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12 }}>Description</th>
                          <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 12, width: 120 }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ background: '#f0f4ff' }}>
                          <td style={{ padding: '10px 12px', borderBottom: '1px solid #dde', fontSize: 13, verticalAlign: 'top' }}>1</td>
                          <td style={{ padding: '10px 12px', borderBottom: '1px solid #dde', fontSize: 13, whiteSpace: 'pre-wrap' }}>{previewEstimate.description}</td>
                          <td style={{ padding: '10px 12px', borderBottom: '1px solid #dde', fontSize: 13, textAlign: 'right', verticalAlign: 'top' }}>{fmtMoney(previewEstimate.estimatedCost)}</td>
                        </tr>
                        {[2,3,4,5].map(n => (
                          <tr key={n} style={{ background: n % 2 === 0 ? '#f8f9fa' : '#fff' }}>
                            <td style={{ padding: '10px 12px', borderBottom: '1px solid #eee', fontSize: 13, color: '#bbb' }}>{n}</td>
                            <td style={{ padding: '10px 12px', borderBottom: '1px solid #eee' }}>&nbsp;</td>
                            <td style={{ padding: '10px 12px', borderBottom: '1px solid #eee' }}>&nbsp;</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Total */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 32 }}>
                      <table style={{ borderCollapse: 'collapse', minWidth: 240 }}>
                        <tbody>
                          <tr>
                            <td style={{ padding: '8px 14px', fontWeight: 600, color: '#555', borderTop: '1px solid #ddd', fontSize: 13 }}>Subtotal</td>
                            <td style={{ padding: '8px 14px', textAlign: 'right', borderTop: '1px solid #ddd', fontSize: 13 }}>{fmtMoney(previewEstimate.estimatedCost)}</td>
                          </tr>
                          <tr style={{ background: '#1a3a7a', color: '#fff' }}>
                            <td style={{ padding: '10px 14px', fontWeight: 900, fontSize: 15 }}>TOTAL</td>
                            <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 900, fontSize: 15 }}>{fmtMoney(previewEstimate.estimatedCost)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Signature */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, paddingTop: 16, borderTop: '1px solid #ddd' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: '#1a3a7a', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 28 }}>Client Signature &amp; Acceptance</div>
                        <div style={{ borderBottom: '1px solid #333', marginBottom: 6 }}>&nbsp;</div>
                        <div style={{ fontSize: 11, color: '#555' }}>Signature &nbsp;&nbsp;&nbsp;&nbsp; Date</div>
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: '#1a3a7a', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 28 }}>Authorized By</div>
                        <div style={{ borderBottom: '1px solid #333', marginBottom: 6 }}>&nbsp;</div>
                        <div style={{ fontSize: 11, color: '#555' }}>First Choice Maintenance &amp; Home Repair</div>
                      </div>
                    </div>

                    <div style={{ marginTop: 24, textAlign: 'center', fontSize: 11, color: '#999', borderTop: '1px solid #eee', paddingTop: 12 }}>
                      First Choice Maintenance &amp; Home Repair — Thank you for your business!
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
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
              <input name="scheduledTime" type="time" value={woForm.scheduledTime} onChange={handleWoFormChange} />
            </label>
            <label>
              Scheduled Date
              <input name="scheduledDate" type="date" value={woForm.scheduledDate} onChange={handleWoFormChange} />
            </label>
            <label>
              Assign To (optional)
              <select name="assignedTo" value={woForm.assignedTo || ''} onChange={handleWoFormChange}>
                <option value="">— Unassigned —</option>
                {teamProfiles.map(tp => (
                  <option key={tp.userId} value={tp.username}>{tp.username}</option>
                ))}
              </select>
            </label>
            <button type="submit">Draft Work Order</button>
            <button type="button" onClick={async () => {
              const form = document.querySelector('form') as HTMLFormElement;
              if (form && !form.reportValidity()) return;
              const newWO = {
                number: nextWoNumber,
                propertyName: woForm.propertyName,
                title: woForm.title,
                instructions: woForm.instructions,
                scheduledTime: woForm.scheduledTime,
                scheduledDate: woForm.scheduledDate,
                assignedTo: woForm.assignedTo || '',
              };
              await api.createWorkOrder(newWO);
              await api.updateWorkOrderStatus(newWO.number, 'active');
              await loadAllData();
              setWoSubmitted(true);
              setWoForm({ propertyName: '', title: '', instructions: '', scheduledTime: '', scheduledDate: '', assignedTo: '', status: 'draft', history: [] });
            }}>Activate Work Order</button>
            <button type="button" onClick={() => setPage("home")}>Return to Home</button>
          </form>
        )}
      </div>
    );
  }
  if (page === "propertylist") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minHeight: "100vh", padding: '1rem' }}>
        <h1>Property List</h1>
        {properties.length === 0 ? (
          <p>No properties have been added yet.</p>
        ) : (
          <table style={{ borderCollapse: "collapse", minWidth: 700, margin: "1rem 0", width: '100%', maxWidth: 1100 }}>
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
                <th style={{ border: "1px solid #444", padding: "8px", background: "#f0f0f0" }}>Actions</th>
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
                  <td style={{ border: "1px solid #444", padding: "8px", textAlign: "center", whiteSpace: 'nowrap' }}>
                    <button style={{ background: '#6c3db5', color: 'white', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', marginRight: 6 }} onClick={() => { setEditingProperty(prop); setEditPropertyForm({ ...prop }); }}>✏️ Edit</button>
                    {authUser?.userType === 'admin' && (
                      <button style={{ background: "#ff4d4d", color: "white", border: "none", borderRadius: 4, padding: "4px 10px", cursor: "pointer" }} onClick={() => handleDeleteProperty(prop)}>🗑 Delete</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <button onClick={() => setPage("home")}>Return to Home</button>

        {/* Edit Property Modal */}
        {editingProperty && (
          <div className="photo-modal">
            <div className="photo-modal-content" style={{ maxWidth: 500 }}>
              <h2>Edit Property</h2>
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!editingProperty.id) return;
                setEditPropertySaving(true);
                try {
                  await api.updateProperty(editingProperty.id, editPropertyForm);
                  await loadAllData();
                  setEditingProperty(null);
                } catch { alert('Save failed.'); }
                finally { setEditPropertySaving(false); }
              }} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {(['propertyName','address','street','city','state','zip','ownerName','ownerPhone'] as (keyof PropertyForm)[]).map(field => (
                  <label key={field} style={{ fontWeight: 600, fontSize: 13, gridColumn: field === 'address' || field === 'propertyName' ? '1/-1' : undefined }}>
                    {field.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                    <input value={editPropertyForm[field] as string} onChange={e => setEditPropertyForm(p => ({ ...p, [field]: e.target.value }))} required style={{ display: 'block', width: '100%', marginTop: 4, padding: '6px 8px', border: '1px solid #aaa', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
                  </label>
                ))}
                <div style={{ gridColumn: '1/-1', display: 'flex', gap: 10, marginTop: 4 }}>
                  <button type="submit" disabled={editPropertySaving} style={{ background: '#2a9d2a', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 22px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>{editPropertySaving ? 'Saving...' : '✓ Save'}</button>
                  <button type="button" onClick={() => setEditingProperty(null)} style={{ background: '#888', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 14, cursor: 'pointer' }}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }
  if (page === "workorderlistdraft") {
    const rawDraft = workOrders.filter((wo) => wo.status === 'draft');
    const draftOrders = (authUser?.userType === 'tech' && techWOFilter === 'assigned')
      ? rawDraft.filter(wo => wo.assignedTo === authUser.username)
      : rawDraft;
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minHeight: "100vh", padding: "1rem" }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <h1 style={{ margin: 0 }}>Draft Work Orders</h1>
          {authUser?.userType === 'tech' && (
            <span onClick={() => setTechWOFilter(techWOFilter === 'assigned' ? 'all' : 'assigned')}
              style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 12, cursor: 'pointer',
                background: techWOFilter === 'assigned' ? '#1a3a7a' : '#e0e0e0', color: techWOFilter === 'assigned' ? '#fff' : '#555' }}>
              {techWOFilter === 'assigned' ? '👤 My WOs' : '🌐 All WOs'}
            </span>
          )}
        </div>
        {draftOrders.length === 0 ? (
          <p>No draft work orders.</p>
        ) : (
          <div style={{ width: '100%', maxWidth: 860, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {draftOrders.map((wo: WorkOrder) => (
              <div key={wo.number} style={{ background: '#fff', border: '1px solid #b0c0e0', borderRadius: 10, padding: '14px 18px', boxShadow: '0 2px 6px rgba(26,58,122,0.08)', borderLeft: '4px solid #888' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 20px', alignItems: 'baseline', marginBottom: 12 }}>
                  <span style={{ fontWeight: 700, fontSize: 15, color: '#1a3a7a' }}>{wo.number}</span>
                  <span style={{ fontWeight: 600, fontSize: 14, color: '#333' }}>{wo.title}</span>
                  <span style={{ fontSize: 13, color: '#555' }}>{wo.propertyName}</span>
                  {wo.scheduledDate && <span style={{ fontSize: 12, color: '#888' }}>{wo.scheduledDate}{wo.scheduledTime ? ' @ ' + wo.scheduledTime : ''}</span>}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => activateWorkOrder(wo.number)}
                    style={{ background: '#0099FF', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
                  >
                    ▶ Activate
                  </button>
                  <div style={{ flex: 1 }} />
                  <button
                    onClick={() => openWODetail(wo, 'workorderlistdraft')}
                    style={{ background: '#1a3a7a', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
                  >
                    🔍 View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <button style={{ marginTop: 20 }} onClick={() => setPage("home")}>Return to Home</button>
      </div>
    );
  }

  // Active Work Orders
  if (page === "workorderlist") {
    const rawActive = workOrders.filter((wo) => wo.status === 'active');
    const activeOrders = (authUser?.userType === 'tech' && techWOFilter === 'assigned')
      ? rawActive.filter(wo => wo.assignedTo === authUser.username)
      : rawActive;
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minHeight: "100vh", padding: "1rem" }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <h1 style={{ margin: 0 }}>Active Work Order List</h1>
          {authUser?.userType === 'tech' && (
            <span onClick={() => setTechWOFilter(techWOFilter === 'assigned' ? 'all' : 'assigned')}
              style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 12, cursor: 'pointer',
                background: techWOFilter === 'assigned' ? '#1a3a7a' : '#e0e0e0', color: techWOFilter === 'assigned' ? '#fff' : '#555' }}>
              {techWOFilter === 'assigned' ? '👤 My WOs' : '🌐 All WOs'}
            </span>
          )}
        </div>
        {activeOrders.length === 0 ? (
          <p>No active work orders.</p>
        ) : (
          <div style={{ width: '100%', maxWidth: 860, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {activeOrders.map((wo: WorkOrder) => (
              <div
                key={wo.number}
                onClick={() => openWODetail(wo, 'workorderlist')}
                style={{ background: '#fff', border: '1px solid #b0c0e0', borderRadius: 10, padding: '14px 18px', boxShadow: '0 2px 6px rgba(26,58,122,0.08)', cursor: 'pointer', display: 'grid', gridTemplateColumns: '1fr auto', gap: '6px 16px', alignItems: 'center' }}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 24px', alignItems: 'baseline' }}>
                  <span style={{ fontWeight: 700, fontSize: 15, color: '#1a3a7a' }}>{wo.number}</span>
                  <span style={{ fontWeight: 600, fontSize: 14, color: '#333' }}>{wo.title}</span>
                  <span style={{ fontSize: 13, color: '#555' }}>{wo.propertyName}</span>
                  {wo.scheduledDate && <span style={{ fontSize: 12, color: '#888' }}>{wo.scheduledDate}{wo.scheduledTime ? ' @ ' + wo.scheduledTime : ''}</span>}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); completeWorkOrder(wo.number); }}
                  style={{ background: '#2a9d2a', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap' }}
                >
                  ✓ Complete
                </button>
              </div>
            ))}
          </div>
        )}
        <button style={{ marginTop: 20 }} onClick={() => setPage("home")}>Return to Home</button>
      </div>
    );
  }

  // Completed Work Orders
  if (page === "completedworkorders") {
    const rawCompleted = workOrders.filter((wo) => wo.status === 'completed');
    const completedOrders = (authUser?.userType === 'tech' && techWOFilter === 'assigned')
      ? rawCompleted.filter(wo => wo.assignedTo === authUser.username)
      : rawCompleted;
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minHeight: "100vh", padding: "1rem" }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <h1 style={{ margin: 0 }}>Completed Work Orders</h1>
          {authUser?.userType === 'tech' && (
            <span onClick={() => setTechWOFilter(techWOFilter === 'assigned' ? 'all' : 'assigned')}
              style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 12, cursor: 'pointer',
                background: techWOFilter === 'assigned' ? '#1a3a7a' : '#e0e0e0', color: techWOFilter === 'assigned' ? '#fff' : '#555' }}>
              {techWOFilter === 'assigned' ? '👤 My WOs' : '🌐 All WOs'}
            </span>
          )}
        </div>
        {completedOrders.length === 0 ? (
          <p>No work orders have been completed yet.</p>
        ) : (
          <div style={{ width: '100%', maxWidth: 860, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {completedOrders.map((wo: WorkOrder) => (
              <div key={wo.number} style={{ background: '#fff', border: '1px solid #b0c0e0', borderRadius: 10, padding: '14px 18px', boxShadow: '0 2px 6px rgba(26,58,122,0.08)', borderLeft: '4px solid #2a9d2a' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 20px', alignItems: 'baseline', marginBottom: 12 }}>
                  <span style={{ fontWeight: 700, fontSize: 15, color: '#1a3a7a' }}>{wo.number}</span>
                  <span style={{ fontWeight: 600, fontSize: 14, color: '#333' }}>{wo.title}</span>
                  <span style={{ fontSize: 13, color: '#555' }}>{wo.propertyName}</span>
                  {wo.scheduledDate && <span style={{ fontSize: 12, color: '#888' }}>{wo.scheduledDate}{wo.scheduledTime ? ' @ ' + wo.scheduledTime : ''}</span>}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => reactivateWorkOrder(wo.number)}
                    style={{ background: '#ff9900', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
                  >
                    ↺ Reactivate
                  </button>
                  <div style={{ flex: 1 }} />
                  <button
                    onClick={() => openWODetail(wo, 'completedworkorders')}
                    style={{ background: '#1a3a7a', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
                  >
                    🔍 View
                  </button>
                  <button
                    onClick={() => closeWorkOrder(wo.number)}
                    style={{ background: '#555', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
                  >
                    ✕ Close
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <button style={{ marginTop: 20 }} onClick={() => setPage("home")}>Return to Home</button>
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
                <th>Photos</th>
                <th>History</th>
                <th>Reactivate</th>
                <th>Process</th>
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
                    <button onClick={() => loadPhotosForWorkOrder(wo)}>📷 Photos</button>
                  </td>
                  <td>
                    <button onClick={() => setViewHistoryWO(wo)}>View History</button>
                  </td>
                  <td>
                    <button style={{ background: '#ff9900', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer' }} onClick={() => reactivateWorkOrder(wo.number)}>↺ Reactivate</button>
                  </td>
                  <td style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    <button style={{ background: '#2a9d2a', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 12 }} onClick={() => invoiceWorkOrder(wo.number)}>🧾 Invoice</button>
                    <button style={{ background: '#888', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 12 }} onClick={() => noChargeWorkOrder(wo.number)}>✓ No Charge</button>
                    {authUser.userType === 'admin' && (
                      <button style={{ background: '#ff4d4d', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 12 }} onClick={() => deleteWorkOrder(wo.number)}>🗑 Delete</button>
                    )}
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
              {viewHistoryWO.history.map((entry: WorkOrderHistoryEntry, idx: number) => {
                const isAssign = entry.status.startsWith('assigned:') || entry.status === 'unassigned';
                const label = isAssign ? (entry.status === 'unassigned' ? 'Unassigned' : `Assigned → ${entry.status.replace('assigned:', '')}`) : entry.status;
                return (
                  <li key={idx} style={{ marginBottom: 4 }}>
                    <strong>{label}</strong> at {new Date(entry.timestamp).toLocaleString()}{entry.changedBy ? ` — 👤 ${entry.changedBy}` : ''}
                  </li>
                );
              })}
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

  // ── Team Info ────────────────────────────────────────────────────────────
  if (page === 'teaminfo') {
    const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const fmt12 = (t: string) => {
      if (!t) return '';
      const [h, m] = t.split(':').map(Number);
      const ampm = h >= 12 ? 'PM' : 'AM';
      return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${ampm}`;
    };
    return (
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '28px 20px' }}>
        <h1 style={{ color: '#1a3a7a', marginBottom: 20 }}>Team Info</h1>
        {teamLoading && <p>Loading...</p>}
        {!teamLoading && teamProfiles.length === 0 && <p style={{ color: '#888' }}>No team members found.</p>}
        {!teamLoading && teamProfiles.length > 0 && (
          <div style={{ overflowX: 'auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(26,58,122,0.08)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#1a3a7a', color: '#fff' }}>
                  <th style={{ padding: '10px 14px', textAlign: 'left', whiteSpace: 'nowrap', fontWeight: 700, fontSize: 13 }}>Team Member</th>
                  {DAYS.map(d => <th key={d} style={{ padding: '10px 10px', textAlign: 'center', fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap' }}>{d.slice(0,3)}</th>)}
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap' }}>Pay Rate</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap' }}>PTO Left</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap' }}>Sick Left</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, fontSize: 12 }}>Edit</th>
                </tr>
              </thead>
              <tbody>
                {teamProfiles.map((profile, idx) => (
                  <tr key={profile.userId} style={{ background: idx % 2 === 0 ? '#f7f9ff' : '#fff', borderBottom: '1px solid #e8edf8' }}>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 700, color: '#1a3a7a', fontSize: 14 }}>{profile.username}</div>
                      <div style={{ fontSize: 11, color: '#888', textTransform: 'capitalize' }}>{profile.userType}</div>
                      {profile.notes && <div style={{ fontSize: 11, color: '#999', fontStyle: 'italic', marginTop: 2 }}>{profile.notes.slice(0,40)}{profile.notes.length>40?'…':''}</div>}
                    </td>
                    {DAYS.map(day => {
                      const s = profile.schedule[day];
                      return (
                        <td key={day} style={{ padding: '8px 6px', textAlign: 'center', verticalAlign: 'middle' }}>
                          {s ? (
                            <div style={{ background: '#1a3a7a', color: '#fff', borderRadius: 6, padding: '3px 6px', fontSize: 11, lineHeight: 1.4 }}>
                              <div style={{ fontWeight: 700 }}>{fmt12(s.start)}</div>
                              <div style={{ opacity: 0.8 }}>{fmt12(s.end)}</div>
                              <div style={{ fontSize: 10, opacity: 0.7 }}>{s.hours}h</div>
                            </div>
                          ) : (
                            <span style={{ color: '#ddd', fontSize: 16 }}>—</span>
                          )}
                        </td>
                      );
                    })}
                    <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 700, color: '#1a3a7a', whiteSpace: 'nowrap' }}>${profile.payRate}/hr</td>
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                      <div style={{ fontWeight: 700, color: profile.ptoTotal - profile.ptoUsed > 0 ? '#2a9d2a' : '#c00', fontSize: 15 }}>{profile.ptoTotal - profile.ptoUsed}</div>
                      <div style={{ fontSize: 10, color: '#aaa' }}>{profile.ptoUsed}/{profile.ptoTotal}</div>
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                      <div style={{ fontWeight: 700, color: profile.sickTotal - profile.sickUsed > 0 ? '#e67e22' : '#c00', fontSize: 15 }}>{profile.sickTotal - profile.sickUsed}</div>
                      <div style={{ fontSize: 10, color: '#aaa' }}>{profile.sickUsed}/{profile.sickTotal}</div>
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                      <button onClick={() => { setEditingProfile(profile); setProfileForm({ ...profile, schedule: { ...profile.schedule } }); }}
                        style={{ background: '#f0f4ff', color: '#1a3a7a', border: '1px solid #c0d0f0', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>✏️ Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <button onClick={() => setPage('home')} style={{ marginTop: 20, padding: '8px 20px', background: '#1a3a7a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>← Back to Dashboard</button>

        {/* Edit Profile Modal */}
        {editingProfile && profileForm && (
          <div className="photo-modal">
            <div className="photo-modal-content" style={{ maxWidth: 640 }}>
              <h2 style={{ margin: '0 0 16px', color: '#1a3a7a' }}>Edit — {editingProfile.username}</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  <label style={{ fontWeight: 600, fontSize: 13 }}>Pay Rate ($/hr)
                    <input type="number" min="0" step="0.01" value={profileForm.payRate} onChange={e => setProfileForm(p => p ? { ...p, payRate: e.target.value } : p)}
                      style={{ display: 'block', width: '100%', marginTop: 4, padding: '7px 10px', border: '1px solid #aaa', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }} />
                  </label>
                  <label style={{ fontWeight: 600, fontSize: 13 }}>PTO Total (days)
                    <input type="number" min="0" value={profileForm.ptoTotal} onChange={e => setProfileForm(p => p ? { ...p, ptoTotal: parseInt(e.target.value) || 0 } : p)}
                      style={{ display: 'block', width: '100%', marginTop: 4, padding: '7px 10px', border: '1px solid #aaa', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }} />
                  </label>
                  <label style={{ fontWeight: 600, fontSize: 13 }}>PTO Used (days)
                    <input type="number" min="0" value={profileForm.ptoUsed} onChange={e => setProfileForm(p => p ? { ...p, ptoUsed: parseInt(e.target.value) || 0 } : p)}
                      style={{ display: 'block', width: '100%', marginTop: 4, padding: '7px 10px', border: '1px solid #aaa', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }} />
                  </label>
                  <label style={{ fontWeight: 600, fontSize: 13 }}>Sick Total (days)
                    <input type="number" min="0" value={profileForm.sickTotal} onChange={e => setProfileForm(p => p ? { ...p, sickTotal: parseInt(e.target.value) || 0 } : p)}
                      style={{ display: 'block', width: '100%', marginTop: 4, padding: '7px 10px', border: '1px solid #aaa', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }} />
                  </label>
                  <label style={{ fontWeight: 600, fontSize: 13 }}>Sick Used (days)
                    <input type="number" min="0" value={profileForm.sickUsed} onChange={e => setProfileForm(p => p ? { ...p, sickUsed: parseInt(e.target.value) || 0 } : p)}
                      style={{ display: 'block', width: '100%', marginTop: 4, padding: '7px 10px', border: '1px solid #aaa', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }} />
                  </label>
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: '#1a3a7a' }}>Weekly Schedule</div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#f0f4ff' }}>
                        <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 700 }}>Day</th>
                        <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 700 }}>Start</th>
                        <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 700 }}>End</th>
                        <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 700 }}>Hours</th>
                        <th style={{ padding: '6px 8px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {DAYS.map(day => {
                        const s = profileForm.schedule[day];
                        return (
                          <tr key={day} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '4px 8px', fontWeight: 600 }}>{day}</td>
                            <td style={{ padding: '4px 8px' }}>
                              <input type="time" value={s?.start || ''} onChange={e => {
                                const start = e.target.value;
                                const end = s?.end || '';
                                const hours = start && end ? Math.round(Math.abs(new Date(`2000-01-01T${end}`).getTime() - new Date(`2000-01-01T${start}`).getTime()) / 36e5 * 4) / 4 : 0;
                                setProfileForm(p => p ? { ...p, schedule: { ...p.schedule, [day]: { start, end, hours } } } : p);
                              }} style={{ padding: '3px 6px', border: '1px solid #ccc', borderRadius: 4, fontSize: 12 }} />
                            </td>
                            <td style={{ padding: '4px 8px' }}>
                              <input type="time" value={s?.end || ''} onChange={e => {
                                const end = e.target.value;
                                const start = s?.start || '';
                                const hours = start && end ? Math.round(Math.abs(new Date(`2000-01-01T${end}`).getTime() - new Date(`2000-01-01T${start}`).getTime()) / 36e5 * 4) / 4 : 0;
                                setProfileForm(p => p ? { ...p, schedule: { ...p.schedule, [day]: { start, end, hours } } } : p);
                              }} style={{ padding: '3px 6px', border: '1px solid #ccc', borderRadius: 4, fontSize: 12 }} />
                            </td>
                            <td style={{ padding: '4px 8px', color: '#1a3a7a', fontWeight: 600 }}>{s?.hours || 0}h</td>
                            <td style={{ padding: '4px 8px' }}>
                              {s && <button onClick={() => setProfileForm(p => { if (!p) return p; const sc = { ...p.schedule }; delete sc[day]; return { ...p, schedule: sc }; })} style={{ background: '#ff4d4d', color: '#fff', border: 'none', borderRadius: 4, padding: '2px 8px', cursor: 'pointer', fontSize: 12 }}>✕</button>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <label style={{ fontWeight: 600, fontSize: 13 }}>Notes
                  <textarea value={profileForm.notes} onChange={e => setProfileForm(p => p ? { ...p, notes: e.target.value } : p)} rows={3}
                    style={{ display: 'block', width: '100%', marginTop: 4, padding: '7px 10px', border: '1px solid #aaa', borderRadius: 6, fontSize: 14, boxSizing: 'border-box', resize: 'vertical' }} />
                </label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={async () => {
                    if (!profileForm) return;
                    await api.saveTeamProfile(profileForm.userId, profileForm);
                    const [profiles, offs] = await Promise.all([api.fetchTeamProfiles(), api.fetchDaysOff()]);
                    setTeamProfiles(profiles); setDaysOff(offs);
                    setEditingProfile(null); setProfileForm(null);
                  }} style={{ background: '#2a9d2a', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 22px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>✓ Save</button>
                  <button onClick={() => { setEditingProfile(null); setProfileForm(null); }} style={{ background: '#888', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 14, cursor: 'pointer' }}>Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Payroll ───────────────────────────────────────────────────────────────
  if (page === 'payroll') {
    // Pay period: starts Fri 7/10/2026, ends Thu 7/22/2026, paid 7/30/2026 — biweekly
    const PAY_PERIOD_START = new Date('2026-07-10'); // First period start (Friday)
    const PERIOD_DAYS = 14;
    const today = new Date();
    // Find current period
    const msSincFirst = today.getTime() - PAY_PERIOD_START.getTime();
    const periodIndex = Math.floor(msSincFirst / (PERIOD_DAYS * 86400000));
    const currentPeriodStart = new Date(PAY_PERIOD_START.getTime() + periodIndex * PERIOD_DAYS * 86400000);
    const currentPeriodEnd = new Date(currentPeriodStart.getTime() + 12 * 86400000); // +12 days = Thursday
    const currentPayday = new Date(currentPeriodStart.getTime() + 20 * 86400000); // +20 days = following Friday
    const fmtDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    // Calc weekly hours per person from schedule
    const weeklyHours = (profile: { schedule: Record<string, { hours: number }> }) =>
      Object.values(profile.schedule).reduce((s, v) => s + (v.hours || 0), 0);

    const periodHours = (profile: { schedule: Record<string, { hours: number }> }) => weeklyHours(profile) * 2;
    const periodPay = (profile: { schedule: Record<string, { hours: number }>; payRate: string }) =>
      (periodHours(profile) * parseFloat(profile.payRate || '0')).toFixed(2);

    // Days off in current period
    const daysOffInPeriod = (userId: number) =>
      daysOff.filter(d => d.user_id === userId && d.date >= currentPeriodStart.toISOString().slice(0,10) && d.date <= currentPeriodEnd.toISOString().slice(0,10));

    const fmtDayOff = (d: { date: string; type: string }) => `${d.date} (${d.type})`;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', padding: '1rem' }}>
        <h1>Payroll</h1>
        {/* Period info */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, width: '100%', maxWidth: 860, marginBottom: 24 }}>
          <div style={{ background: '#fff', border: '1px solid #d0d8f0', borderRadius: 10, padding: '14px 18px', boxShadow: '0 2px 6px rgba(26,58,122,0.07)' }}>
            <div style={{ fontSize: 11, color: '#888', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Current Pay Period</div>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#1a3a7a' }}>{fmtDate(currentPeriodStart)} – {fmtDate(currentPeriodEnd)}</div>
          </div>
          <div style={{ background: '#fff', border: '1px solid #d0d8f0', borderRadius: 10, padding: '14px 18px', boxShadow: '0 2px 6px rgba(26,58,122,0.07)' }}>
            <div style={{ fontSize: 11, color: '#888', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Payday</div>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#2a9d2a' }}>💵 {fmtDate(currentPayday)}</div>
          </div>
        </div>
        {teamLoading && <p>Loading...</p>}
        {!teamLoading && (
          <table className="wo-table" style={{ width: '100%', maxWidth: 860 }}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Pay Rate</th>
                <th>Sched Hrs/Wk</th>
                <th>Period Hrs</th>
                <th>Gross Pay</th>
                <th>Days Off This Period</th>
              </tr>
            </thead>
            <tbody>
              {teamProfiles.map(profile => (
                <tr key={profile.userId}>
                  <td data-label="Name"><strong>{profile.username}</strong></td>
                  <td data-label="Pay Rate">${profile.payRate}/hr</td>
                  <td data-label="Hrs/Wk">{weeklyHours(profile)}h</td>
                  <td data-label="Period Hrs">{periodHours(profile)}h</td>
                  <td data-label="Gross Pay" style={{ fontWeight: 700, color: '#2a9d2a' }}>${periodPay(profile)}</td>
                  <td data-label="Days Off">
                    {daysOffInPeriod(profile.userId).length === 0
                      ? <span style={{ color: '#aaa' }}>—</span>
                      : daysOffInPeriod(profile.userId).map(d => <div key={d.id} style={{ fontSize: 12 }}>{fmtDayOff(d)}</div>)
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div style={{ marginTop: 24, width: '100%', maxWidth: 860 }}>
          <h3 style={{ color: '#1a3a7a' }}>Upcoming Pay Periods</h3>
          <table className="wo-table">
            <thead><tr><th>#</th><th>Period Start (Fri)</th><th>Period End (Thu)</th><th>Payday (Fri)</th></tr></thead>
            <tbody>
              {Array.from({ length: 6 }, (_, i) => {
                const ps = new Date(currentPeriodStart.getTime() + i * PERIOD_DAYS * 86400000);
                const pe = new Date(ps.getTime() + 12 * 86400000);
                const pd = new Date(ps.getTime() + 20 * 86400000);
                return (
                  <tr key={i} style={{ background: i === 0 ? '#e8f4ff' : undefined }}>
                    <td>{i === 0 ? '▶ Current' : `+${i}`}</td>
                    <td>{fmtDate(ps)}</td>
                    <td>{fmtDate(pe)}</td>
                    <td style={{ fontWeight: 700, color: '#2a9d2a' }}>💵 {fmtDate(pd)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <button onClick={() => setPage('home')} style={{ marginTop: 16 }}>Return to Home</button>
      </div>
    );
  }

  // ── Submit Day Off ────────────────────────────────────────────────────────
  if (page === 'submitdayoff') {
    const myDaysOff = daysOff.filter(d => d.user_id === authUser.id || authUser.userType === 'admin' || authUser.userType === 'mgr');
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', padding: '1rem' }}>
        <h1>Submit Day Off</h1>
        <div style={{ background: '#fff', border: '1px solid #d0d8f0', borderRadius: 12, padding: 24, width: '100%', maxWidth: 500, marginBottom: 24, boxShadow: '0 2px 8px rgba(26,58,122,0.07)' }}>
          <h3 style={{ margin: '0 0 14px', color: '#1a3a7a' }}>New Request</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(authUser.userType === 'admin' || authUser.userType === 'mgr') && (
              <label style={{ fontWeight: 600, fontSize: 13 }}>Team Member
                <select value={dayOffForm.userId} onChange={e => setDayOffForm(p => ({ ...p, userId: parseInt(e.target.value) }))}
                  style={{ display: 'block', width: '100%', marginTop: 4, padding: '7px 10px', border: '1px solid #aaa', borderRadius: 6, fontSize: 14 }}>
                  <option value={0}>Select...</option>
                  {teamProfiles.map(p => <option key={p.userId} value={p.userId}>{p.username}</option>)}
                </select>
              </label>
            )}
            <label style={{ fontWeight: 600, fontSize: 13 }}>Date
              <input type="date" value={dayOffForm.date} onChange={e => setDayOffForm(p => ({ ...p, date: e.target.value }))}
                style={{ display: 'block', width: '100%', marginTop: 4, padding: '7px 10px', border: '1px solid #aaa', borderRadius: 6, fontSize: 14 }} />
            </label>
            <label style={{ fontWeight: 600, fontSize: 13 }}>Type
              <select value={dayOffForm.type} onChange={e => setDayOffForm(p => ({ ...p, type: e.target.value }))}
                style={{ display: 'block', width: '100%', marginTop: 4, padding: '7px 10px', border: '1px solid #aaa', borderRadius: 6, fontSize: 14 }}>
                <option value="PTO">PTO</option>
                <option value="Sick">Sick</option>
                <option value="Personal">Personal</option>
                <option value="Unpaid">Unpaid</option>
              </select>
            </label>
            <label style={{ fontWeight: 600, fontSize: 13 }}>Reason (optional)
              <input value={dayOffForm.reason} onChange={e => setDayOffForm(p => ({ ...p, reason: e.target.value }))} placeholder="Brief note..."
                style={{ display: 'block', width: '100%', marginTop: 4, padding: '7px 10px', border: '1px solid #aaa', borderRadius: 6, fontSize: 14 }} />
            </label>
            <button onClick={async () => {
              if (!dayOffForm.date) return alert('Please select a date.');
              const uid = (authUser.userType === 'admin' || authUser.userType === 'mgr') ? dayOffForm.userId : authUser.id;
              if (!uid) return alert('Please select a team member.');
              await api.saveDayOff({ userId: uid, date: dayOffForm.date, reason: dayOffForm.reason, type: dayOffForm.type });
              setDayOffForm({ userId: 0, date: '', reason: '', type: 'PTO' });
              const [profiles, offs] = await Promise.all([api.fetchTeamProfiles(), api.fetchDaysOff()]);
              setTeamProfiles(profiles); setDaysOff(offs);
            }} style={{ background: '#1a3a7a', color: '#fff', border: 'none', borderRadius: 6, padding: '9px 22px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>✓ Submit</button>
          </div>
        </div>

        <div style={{ width: '100%', maxWidth: 700 }}>
          <h3 style={{ color: '#1a3a7a' }}>Days Off Requests</h3>
          {teamLoading && <p>Loading...</p>}
          {!teamLoading && myDaysOff.length === 0 && <p style={{ color: '#888' }}>No days off submitted yet.</p>}
          {!teamLoading && myDaysOff.length > 0 && (
            <table className="wo-table">
              <thead><tr><th>Name</th><th>Date</th><th>Type</th><th>Reason</th><th>Remove</th></tr></thead>
              <tbody>
                {myDaysOff.map(d => (
                  <tr key={d.id}>
                    <td data-label="Name">{d.username}</td>
                    <td data-label="Date">{d.date}</td>
                    <td data-label="Type"><span style={{ background: d.type === 'PTO' ? '#e8f4ff' : d.type === 'Sick' ? '#fff0e6' : '#f0f4ff', color: '#1a3a7a', borderRadius: 8, padding: '2px 8px', fontSize: 12, fontWeight: 600 }}>{d.type}</span></td>
                    <td data-label="Reason">{d.reason || '—'}</td>
                    <td>
                      <button onClick={async () => {
                        if (!confirm('Remove this day off request?')) return;
                        await api.deleteDayOff(d.id);
                        const [profiles, offs] = await Promise.all([api.fetchTeamProfiles(), api.fetchDaysOff()]);
                        setTeamProfiles(profiles); setDaysOff(offs);
                      }} style={{ background: '#ff4d4d', color: '#fff', border: 'none', borderRadius: 4, padding: '3px 10px', cursor: 'pointer', fontSize: 12 }}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <button onClick={() => setPage('home')} style={{ marginTop: 16 }}>Return to Home</button>
      </div>
    );
  }

  // ── Recurring Work Orders ─────────────────────────────────────────────────
  if (page === 'recurringworkorders') {
    const freqLabel = (f: string, dow: string, dom: number) => {
      if (f === 'daily') return 'Daily';
      if (f === 'weekly') return `Weekly on ${dow || '?'}`;
      if (f === 'biweekly') return `Every 2 Weeks on ${dow || '?'}`;
      if (f === 'monthly') return `Monthly on day ${dom}`;
      if (f === 'quarterly') return `Quarterly on day ${dom}`;
      if (f === 'annually') return 'Annually';
      return f;
    };
    const displayed = recurringItems.filter(r => recurringTab === 'active' ? r.active === 1 : r.active === 0);
    const isEditing = !!editingRecurring;

    const handleSave = async () => {
      if (!recurringForm.title.trim()) return;
      const res = await api.saveRecurring(recurringForm, editingRecurring?.id);
      if (res.ok) {
        const fresh = await api.fetchRecurring();
        setRecurringItems(fresh);
        setEditingRecurring(null);
        setRecurringForm(blankRecurring());
      }
    };
    const handleDelete = async (id: number) => {
      if (!confirm('Delete this recurring work order?')) return;
      await api.deleteRecurring(id);
      setRecurringItems(prev => prev.filter(r => r.id !== id));
    };
    const handleToggle = async (r: RecurringItem) => {
      const updated = { ...r, active: r.active === 1 ? 0 : 1 };
      await api.saveRecurring(updated, r.id);
      setRecurringItems(prev => prev.map(x => x.id === r.id ? { ...x, active: updated.active } : x));
    };

    const inputS: React.CSSProperties = { display: 'block', width: '100%', padding: '7px 10px', border: '1px solid #c0cce0', borderRadius: 6, fontSize: 14, boxSizing: 'border-box', marginTop: 4 };
    const labelS: React.CSSProperties = { fontWeight: 600, fontSize: 13, color: '#333' };

    return (
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
          <h1 style={{ color: '#1a3a7a', margin: 0 }}>🔁 Recurring Work Orders</h1>
          <button onClick={() => { setEditingRecurring({} as RecurringItem); setRecurringForm(blankRecurring()); }}
            style={{ background: '#1a3a7a', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>+ New Recurring WO</button>
        </div>

        {/* Edit / Create form */}
        {isEditing && (
          <div style={{ background: '#fff', borderRadius: 12, padding: '22px 24px', boxShadow: '0 2px 12px rgba(26,58,122,0.12)', marginBottom: 24, border: '2px solid #1a3a7a' }}>
            <h3 style={{ margin: '0 0 18px', color: '#1a3a7a' }}>{editingRecurring?.id ? 'Edit Recurring WO' : 'New Recurring WO'}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              <label style={labelS}>Title *
                <input style={inputS} value={recurringForm.title} onChange={e => setRecurringForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Monthly HVAC Filter" />
              </label>
              <label style={labelS}>Property
                <input style={inputS} value={recurringForm.property_name} onChange={e => setRecurringForm(p => ({ ...p, property_name: e.target.value }))} placeholder="Property name" />
              </label>
              <label style={labelS}>Assigned To
                <input style={inputS} value={recurringForm.assigned_to} onChange={e => setRecurringForm(p => ({ ...p, assigned_to: e.target.value }))} placeholder="Tech name" />
              </label>
              <label style={labelS}>Frequency
                <select style={inputS} value={recurringForm.frequency} onChange={e => setRecurringForm(p => ({ ...p, frequency: e.target.value }))}>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Biweekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annually">Annually</option>
                </select>
              </label>
              {(recurringForm.frequency === 'weekly' || recurringForm.frequency === 'biweekly') && (
                <label style={labelS}>Day of Week
                  <select style={inputS} value={recurringForm.day_of_week} onChange={e => setRecurringForm(p => ({ ...p, day_of_week: e.target.value }))}>
                    {['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </label>
              )}
              {(recurringForm.frequency === 'monthly' || recurringForm.frequency === 'quarterly') && (
                <label style={labelS}>Day of Month
                  <input type="number" min={1} max={28} style={inputS} value={recurringForm.day_of_month}
                    onChange={e => setRecurringForm(p => ({ ...p, day_of_month: parseInt(e.target.value) || 1 }))} />
                </label>
              )}
              <label style={labelS}>Next Due Date
                <input type="date" style={inputS} value={recurringForm.next_due} onChange={e => setRecurringForm(p => ({ ...p, next_due: e.target.value }))} />
              </label>
              <label style={labelS}>Last Generated
                <input type="date" style={inputS} value={recurringForm.last_generated} onChange={e => setRecurringForm(p => ({ ...p, last_generated: e.target.value }))} />
              </label>
            </div>
            <label style={{ ...labelS, display: 'block', marginTop: 14 }}>Instructions
              <textarea style={{ ...inputS, minHeight: 80, resize: 'vertical' }} value={recurringForm.instructions} onChange={e => setRecurringForm(p => ({ ...p, instructions: e.target.value }))} placeholder="Work order instructions..." />
            </label>
            <label style={{ ...labelS, display: 'block', marginTop: 14 }}>Notes
              <textarea style={{ ...inputS, minHeight: 60, resize: 'vertical' }} value={recurringForm.notes} onChange={e => setRecurringForm(p => ({ ...p, notes: e.target.value }))} placeholder="Internal notes..." />
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                <input type="checkbox" checked={recurringForm.active === 1} onChange={e => setRecurringForm(p => ({ ...p, active: e.target.checked ? 1 : 0 }))} /> Active
              </label>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button onClick={handleSave} style={{ background: '#1a3a7a', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 24px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Save</button>
              <button onClick={() => { setEditingRecurring(null); setRecurringForm(blankRecurring()); }} style={{ background: '#eee', color: '#333', border: 'none', borderRadius: 8, padding: '9px 20px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {(['active','inactive'] as const).map(t => (
            <button key={t} onClick={() => setRecurringTab(t)}
              style={{ padding: '7px 20px', borderRadius: 20, border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                background: recurringTab === t ? '#1a3a7a' : '#e8edf8', color: recurringTab === t ? '#fff' : '#555' }}>
              {t === 'active' ? `✅ Active (${recurringItems.filter(r=>r.active===1).length})` : `⏸ Inactive (${recurringItems.filter(r=>r.active===0).length})`}
            </button>
          ))}
        </div>

        {recurringLoading ? <p style={{ color: '#888' }}>Loading...</p> : displayed.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 12, padding: 32, textAlign: 'center', color: '#aaa', boxShadow: '0 2px 8px rgba(26,58,122,0.07)' }}>No {recurringTab} recurring work orders.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {displayed.map(r => (
              <div key={r.id} style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', boxShadow: '0 2px 8px rgba(26,58,122,0.08)', borderLeft: `5px solid ${r.active ? '#1a3a7a' : '#aaa'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, color: '#1a3a7a', marginBottom: 4 }}>{r.title}</div>
                  {r.property_name && <div style={{ fontSize: 13, color: '#555', marginBottom: 2 }}>🏠 {r.property_name}</div>}
                  <div style={{ fontSize: 13, color: '#0099FF', fontWeight: 600 }}>🔄 {freqLabel(r.frequency, r.day_of_week, r.day_of_month)}</div>
                  {r.assigned_to && <div style={{ fontSize: 12, color: '#666', marginTop: 3 }}>👷 {r.assigned_to}</div>}
                  {r.instructions && <div style={{ fontSize: 12, color: '#777', marginTop: 4, fontStyle: 'italic' }}>{r.instructions.slice(0, 120)}{r.instructions.length > 120 ? '…' : ''}</div>}
                  <div style={{ display: 'flex', gap: 16, marginTop: 6, fontSize: 12, color: '#888' }}>
                    {r.next_due && <span>Next: <b style={{ color: '#c00' }}>{r.next_due}</b></span>}
                    {r.last_generated && <span>Last: {r.last_generated}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
                  <button onClick={() => handleToggle(r)}
                    style={{ fontSize: 12, padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: 600,
                      background: r.active ? '#fff3cd' : '#d4edda', color: r.active ? '#856404' : '#155724' }}>
                    {r.active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button onClick={() => { setEditingRecurring(r); setRecurringForm({ title:r.title, property_name:r.property_name, instructions:r.instructions, frequency:r.frequency, day_of_week:r.day_of_week, day_of_month:r.day_of_month, assigned_to:r.assigned_to, active:r.active, last_generated:r.last_generated, next_due:r.next_due, notes:r.notes }); }}
                    style={{ fontSize: 12, padding: '5px 14px', borderRadius: 20, border: '1px solid #1a3a7a', cursor: 'pointer', fontWeight: 600, background: '#f0f4ff', color: '#1a3a7a' }}>✏️ Edit</button>
                  <button onClick={() => handleDelete(r.id)}
                    style={{ fontSize: 12, padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: 600, background: '#fde8e8', color: '#c00' }}>🗑 Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
        <button onClick={() => setPage('home')} style={{ marginTop: 24, padding: '8px 20px', background: '#1a3a7a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>← Back to Dashboard</button>
      </div>
    );
  }

  // ── Internal Services ─────────────────────────────────────────────────────
  if (page === 'internalservices') {
    const freqLabel2 = (f: string, dow: string, dom: number) => {
      if (f === 'daily') return 'Daily';
      if (f === 'weekly') return `Weekly on ${dow || '?'}`;
      if (f === 'biweekly') return `Every 2 Weeks on ${dow || '?'}`;
      if (f === 'monthly') return `Monthly on day ${dom}`;
      if (f === 'quarterly') return `Quarterly on day ${dom}`;
      if (f === 'annually') return 'Annually';
      return f;
    };
    const catConfig = {
      fleet: { label: 'Fleet', icon: '🚗', color: '#0099FF', desc: 'Vehicle maintenance, oil changes, tire rotations, inspections' },
      general: { label: 'General Maintenance', icon: '🔧', color: '#e67e22', desc: 'Office, equipment, facilities upkeep' },
    };
    const displayed2 = internalServices.filter(s => s.category === internalTab);
    const isEditingInt = !!editingInternal;
    const inputS2: React.CSSProperties = { display: 'block', width: '100%', padding: '7px 10px', border: '1px solid #c0cce0', borderRadius: 6, fontSize: 14, boxSizing: 'border-box', marginTop: 4 };
    const labelS2: React.CSSProperties = { fontWeight: 600, fontSize: 13, color: '#333' };

    const handleSaveInt = async () => {
      if (!internalForm.title.trim()) return;
      const res = await api.saveInternalService(internalForm, editingInternal?.id);
      if (res.ok) {
        const fresh = await api.fetchInternalServices();
        setInternalServices(fresh);
        setEditingInternal(null);
        setInternalForm(blankInternal());
      }
    };
    const handleDeleteInt = async (id: number) => {
      if (!confirm('Delete this service?')) return;
      await api.deleteInternalService(id);
      setInternalServices(prev => prev.filter(s => s.id !== id));
    };
    const handleMarkDone = async (s: InternalService) => {
      const today = new Date().toISOString().slice(0, 10);
      const updated = { ...s, last_completed: today };
      await api.saveInternalService(updated, s.id);
      setInternalServices(prev => prev.map(x => x.id === s.id ? { ...x, last_completed: today } : x));
    };

    return (
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
          <h1 style={{ color: '#1a3a7a', margin: 0 }}>🏢 Internal Services</h1>
          <button onClick={() => { setEditingInternal({} as InternalService); setInternalForm({ ...blankInternal(), category: internalTab }); }}
            style={{ background: '#1a3a7a', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>+ New Service</button>
        </div>

        {/* Category tabs */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          {(Object.entries(catConfig) as [typeof internalTab, typeof catConfig[keyof typeof catConfig]][]).map(([key, cfg]) => (
            <button key={key} onClick={() => setInternalTab(key)}
              style={{ padding: '9px 22px', borderRadius: 10, border: `2px solid ${internalTab === key ? cfg.color : '#dde3f0'}`, fontWeight: 700, fontSize: 14, cursor: 'pointer',
                background: internalTab === key ? cfg.color : '#fff', color: internalTab === key ? '#fff' : '#555', transition: 'all 0.15s' }}>
              {cfg.icon} {cfg.label} ({internalServices.filter(s => s.category === key).length})
            </button>
          ))}
        </div>

        <p style={{ color: '#888', fontSize: 13, marginBottom: 16 }}>{catConfig[internalTab].desc}</p>

        {/* Edit / Create form */}
        {isEditingInt && (
          <div style={{ background: '#fff', borderRadius: 12, padding: '22px 24px', boxShadow: '0 2px 12px rgba(26,58,122,0.12)', marginBottom: 24, border: `2px solid ${catConfig[internalTab].color}` }}>
            <h3 style={{ margin: '0 0 18px', color: '#1a3a7a' }}>{editingInternal?.id ? 'Edit Service' : 'New Service'}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              <label style={labelS2}>Title *
                <input style={inputS2} value={internalForm.title} onChange={e => setInternalForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Oil Change — Truck 1" />
              </label>
              <label style={labelS2}>Category
                <select style={inputS2} value={internalForm.category} onChange={e => setInternalForm(p => ({ ...p, category: e.target.value }))}>
                  <option value="general">General Maintenance</option>
                  <option value="fleet">Fleet</option>
                </select>
              </label>
              <label style={labelS2}>Assigned To
                <input style={inputS2} value={internalForm.assigned_to} onChange={e => setInternalForm(p => ({ ...p, assigned_to: e.target.value }))} placeholder="Name" />
              </label>
              <label style={labelS2}>Frequency
                <select style={inputS2} value={internalForm.frequency} onChange={e => setInternalForm(p => ({ ...p, frequency: e.target.value }))}>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Biweekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annually">Annually</option>
                </select>
              </label>
              {(internalForm.frequency === 'weekly' || internalForm.frequency === 'biweekly') && (
                <label style={labelS2}>Day of Week
                  <select style={inputS2} value={internalForm.day_of_week} onChange={e => setInternalForm(p => ({ ...p, day_of_week: e.target.value }))}>
                    {['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </label>
              )}
              {(internalForm.frequency === 'monthly' || internalForm.frequency === 'quarterly') && (
                <label style={labelS2}>Day of Month
                  <input type="number" min={1} max={28} style={inputS2} value={internalForm.day_of_month}
                    onChange={e => setInternalForm(p => ({ ...p, day_of_month: parseInt(e.target.value) || 1 }))} />
                </label>
              )}
              <label style={labelS2}>Next Due Date
                <input type="date" style={inputS2} value={internalForm.next_due} onChange={e => setInternalForm(p => ({ ...p, next_due: e.target.value }))} />
              </label>
              <label style={labelS2}>Last Completed
                <input type="date" style={inputS2} value={internalForm.last_completed} onChange={e => setInternalForm(p => ({ ...p, last_completed: e.target.value }))} />
              </label>
            </div>
            <label style={{ ...labelS2, display: 'block', marginTop: 14 }}>Description
              <textarea style={{ ...inputS2, minHeight: 70, resize: 'vertical' }} value={internalForm.description} onChange={e => setInternalForm(p => ({ ...p, description: e.target.value }))} placeholder="Service description..." />
            </label>
            <label style={{ ...labelS2, display: 'block', marginTop: 14 }}>Notes
              <textarea style={{ ...inputS2, minHeight: 55, resize: 'vertical' }} value={internalForm.notes} onChange={e => setInternalForm(p => ({ ...p, notes: e.target.value }))} placeholder="Internal notes..." />
            </label>
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button onClick={handleSaveInt} style={{ background: catConfig[internalTab].color, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 24px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Save</button>
              <button onClick={() => { setEditingInternal(null); setInternalForm(blankInternal()); }} style={{ background: '#eee', color: '#333', border: 'none', borderRadius: 8, padding: '9px 20px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        )}

        {recurringLoading ? <p style={{ color: '#888' }}>Loading...</p> : displayed2.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 12, padding: 32, textAlign: 'center', color: '#aaa', boxShadow: '0 2px 8px rgba(26,58,122,0.07)' }}>No {catConfig[internalTab].label} services yet. Add one above.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {displayed2.map(s => (
              <div key={s.id} style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', boxShadow: '0 2px 8px rgba(26,58,122,0.08)', borderLeft: `5px solid ${catConfig[s.category as keyof typeof catConfig]?.color || '#aaa'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, color: '#1a3a7a', marginBottom: 4 }}>{s.title}</div>
                  <div style={{ fontSize: 13, color: catConfig[s.category as keyof typeof catConfig]?.color, fontWeight: 600 }}>{freqLabel2(s.frequency, s.day_of_week, s.day_of_month)}</div>
                  {s.assigned_to && <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>👷 {s.assigned_to}</div>}
                  {s.description && <div style={{ fontSize: 12, color: '#777', marginTop: 4, fontStyle: 'italic' }}>{s.description.slice(0, 120)}{s.description.length > 120 ? '…' : ''}</div>}
                  <div style={{ display: 'flex', gap: 16, marginTop: 6, fontSize: 12, color: '#888' }}>
                    {s.next_due && <span>Next due: <b style={{ color: '#c00' }}>{s.next_due}</b></span>}
                    {s.last_completed && <span>Last done: <b style={{ color: '#2a9d2a' }}>{s.last_completed}</b></span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
                  <button onClick={() => handleMarkDone(s)}
                    style={{ fontSize: 12, padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: 600, background: '#d4edda', color: '#155724' }}>✓ Mark Done</button>
                  <button onClick={() => { setEditingInternal(s); setInternalForm({ title:s.title, category:s.category, description:s.description, frequency:s.frequency, day_of_week:s.day_of_week, day_of_month:s.day_of_month, assigned_to:s.assigned_to, active:s.active, last_completed:s.last_completed, next_due:s.next_due, notes:s.notes }); }}
                    style={{ fontSize: 12, padding: '5px 14px', borderRadius: 20, border: '1px solid #1a3a7a', cursor: 'pointer', fontWeight: 600, background: '#f0f4ff', color: '#1a3a7a' }}>✏️ Edit</button>
                  <button onClick={() => handleDeleteInt(s.id)}
                    style={{ fontSize: 12, padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: 600, background: '#fde8e8', color: '#c00' }}>🗑 Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
        <button onClick={() => setPage('home')} style={{ marginTop: 24, padding: '8px 20px', background: '#1a3a7a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>← Back to Dashboard</button>
      </div>
    );
  }

  // ── Report: Revenue ───────────────────────────────────────────────────────
  if (page === 'reportrevenue') {
    const now = new Date();
    const thisMonth = now.toISOString().slice(0, 7);
    const revenueWOs = workOrders.filter(w => ['invoiced','sent','paid','nocharge'].includes(w.status));
    const byMonth: Record<string, number> = {};
    allExpenses.filter(e => ['invoiced','sent','paid'].includes(e.status)).forEach(e => {
      const m = (e.scheduled_date || e.created_at || '').slice(0, 7);
      if (m) byMonth[m] = (byMonth[m] || 0) + (parseFloat(e.total_cost) || 0);
    });
    const months = Object.keys(byMonth).sort().reverse().slice(0, 12);
    const totalRevenue = Object.values(byMonth).reduce((a, b) => a + b, 0);
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px' }}>
        <h1 style={{ color: '#1a3a7a', marginBottom: 4 }}>📈 Revenue Report</h1>
        <p style={{ color: '#666', marginBottom: 24 }}>Revenue from invoiced, sent, and paid work orders.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'Total Revenue', value: `$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: '#2a9d2a' },
            { label: 'Billable WOs', value: revenueWOs.length, color: '#1a3a7a' },
            { label: `${thisMonth} Revenue`, value: `$${(byMonth[thisMonth] || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: '#0099FF' },
          ].map(c => (
            <div key={c.label} style={{ background: '#fff', borderRadius: 12, padding: '18px 20px', boxShadow: '0 2px 8px rgba(26,58,122,0.08)', borderTop: `4px solid ${c.color}` }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: c.color }}>{c.value}</div>
              <div style={{ fontSize: 13, color: '#555', marginTop: 4 }}>{c.label}</div>
            </div>
          ))}
        </div>
        <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 2px 8px rgba(26,58,122,0.08)' }}>
          <h3 style={{ margin: '0 0 16px', color: '#1a3a7a' }}>Monthly Breakdown</h3>
          {months.length === 0 ? <p style={{ color: '#aaa' }}>No revenue data yet.</p> : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: '#f0f4ff' }}>
                <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: 13, color: '#1a3a7a' }}>Month</th>
                <th style={{ textAlign: 'right', padding: '8px 12px', fontSize: 13, color: '#1a3a7a' }}>Revenue</th>
              </tr></thead>
              <tbody>
                {months.map(m => (
                  <tr key={m} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '8px 12px', fontSize: 14 }}>{new Date(m + '-15').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</td>
                    <td style={{ padding: '8px 12px', fontSize: 14, fontWeight: 700, color: '#2a9d2a', textAlign: 'right' }}>${(byMonth[m] || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <button onClick={() => setPage('home')} style={{ marginTop: 20, padding: '8px 20px', background: '#1a3a7a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>← Back to Dashboard</button>
      </div>
    );
  }

  // ── Report: Work Orders ───────────────────────────────────────────────────
  if (page === 'reportworkorders') {
    const statusCounts: Record<string, number> = {};
    workOrders.forEach(w => { statusCounts[w.status] = (statusCounts[w.status] || 0) + 1; });
    const statusColors: Record<string, string> = { draft: '#9b59b6', active: '#0099FF', completed: '#2a9d2a', closed: '#888', invoiced: '#e67e22', sent: '#f39c12', paid: '#27ae60', nocharge: '#95a5a6', deleted: '#e74c3c' };
    const byMonth: Record<string, number> = {};
    workOrders.forEach(w => { const m = (w.scheduledDate || '').slice(0,7); if (m) byMonth[m] = (byMonth[m] || 0) + 1; });
    const months = Object.keys(byMonth).sort().reverse().slice(0, 12);
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px' }}>
        <h1 style={{ color: '#1a3a7a', marginBottom: 4 }}>📋 Work Order Report</h1>
        <p style={{ color: '#666', marginBottom: 24 }}>Breakdown of all work orders by status and schedule.</p>
        <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 2px 8px rgba(26,58,122,0.08)', marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 16px', color: '#1a3a7a' }}>By Status</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {Object.entries(statusCounts).map(([status, count]) => (
              <div key={status} style={{ background: '#f8f9ff', borderRadius: 10, padding: '12px 18px', borderLeft: `4px solid ${statusColors[status] || '#aaa'}`, minWidth: 120 }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: statusColors[status] || '#aaa' }}>{count}</div>
                <div style={{ fontSize: 12, color: '#666', textTransform: 'capitalize', marginTop: 2 }}>{status}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 2px 8px rgba(26,58,122,0.08)' }}>
          <h3 style={{ margin: '0 0 16px', color: '#1a3a7a' }}>WOs Scheduled by Month</h3>
          {months.length === 0 ? <p style={{ color: '#aaa' }}>No data.</p> : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: '#f0f4ff' }}>
                <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: 13, color: '#1a3a7a' }}>Month</th>
                <th style={{ textAlign: 'right', padding: '8px 12px', fontSize: 13, color: '#1a3a7a' }}>Count</th>
              </tr></thead>
              <tbody>
                {months.map(m => (
                  <tr key={m} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '8px 12px', fontSize: 14 }}>{new Date(m + '-15').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</td>
                    <td style={{ padding: '8px 12px', fontSize: 14, fontWeight: 700, color: '#1a3a7a', textAlign: 'right' }}>{byMonth[m]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <button onClick={() => setPage('home')} style={{ marginTop: 20, padding: '8px 20px', background: '#1a3a7a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>← Back to Dashboard</button>
      </div>
    );
  }

  // ── Report: Tech Productivity ─────────────────────────────────────────────
  if (page === 'reporttechproductivity') {
    const techMap: Record<string, { assigned: number; completed: number; active: number }> = {};
    workOrders.forEach(w => {
      const tech = (w as any).assignedTo || 'Unassigned';
      if (!techMap[tech]) techMap[tech] = { assigned: 0, completed: 0, active: 0 };
      techMap[tech].assigned++;
      if (w.status === 'completed' || w.status === 'closed' || w.status === 'invoiced' || w.status === 'paid') techMap[tech].completed++;
      if (w.status === 'active') techMap[tech].active++;
    });
    const techs = Object.entries(techMap).sort((a, b) => b[1].assigned - a[1].assigned);
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px' }}>
        <h1 style={{ color: '#1a3a7a', marginBottom: 4 }}>👷 Tech Productivity</h1>
        <p style={{ color: '#666', marginBottom: 24 }}>Work order counts by assigned technician.</p>
        <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 2px 8px rgba(26,58,122,0.08)' }}>
          {techs.length === 0 ? <p style={{ color: '#aaa' }}>No data.</p> : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: '#f0f4ff' }}>
                {['Tech', 'Assigned', 'Active', 'Completed', 'Completion %'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', fontSize: 13, color: '#1a3a7a', textAlign: h === 'Tech' ? 'left' : 'center' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {techs.map(([tech, s]) => (
                  <tr key={tech} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 600, fontSize: 14 }}>{tech}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'center', fontSize: 14 }}>{s.assigned}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'center', fontSize: 14, color: '#0099FF', fontWeight: 600 }}>{s.active}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'center', fontSize: 14, color: '#2a9d2a', fontWeight: 600 }}>{s.completed}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'center', fontSize: 14, fontWeight: 700 }}>{s.assigned > 0 ? Math.round(s.completed / s.assigned * 100) : 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <button onClick={() => setPage('home')} style={{ marginTop: 20, padding: '8px 20px', background: '#1a3a7a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>← Back to Dashboard</button>
      </div>
    );
  }

  // ── Report: Expense Summary ───────────────────────────────────────────────
  if (page === 'reportexpenses') {
    const byStatus: Record<string, number> = {};
    allExpenses.forEach(e => { byStatus[e.status] = (byStatus[e.status] || 0) + (parseFloat(e.total_cost) || 0); });
    const total = allExpenses.reduce((s, e) => s + (parseFloat(e.total_cost) || 0), 0);
    const byMonth: Record<string, number> = {};
    allExpenses.forEach(e => { const m = (e.scheduled_date || e.created_at || '').slice(0,7); if (m) byMonth[m] = (byMonth[m] || 0) + (parseFloat(e.total_cost) || 0); });
    const months = Object.keys(byMonth).sort().reverse().slice(0, 12);
    const statusColors: Record<string, string> = { invoiced: '#e67e22', sent: '#f39c12', paid: '#27ae60', active: '#0099FF', closed: '#888', completed: '#2a9d2a' };
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px' }}>
        <h1 style={{ color: '#1a3a7a', marginBottom: 4 }}>💰 Expense Summary</h1>
        <p style={{ color: '#666', marginBottom: 24 }}>Total expenses across all work orders grouped by WO status and month.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: '18px 20px', boxShadow: '0 2px 8px rgba(26,58,122,0.08)', borderTop: '4px solid #1a3a7a', gridColumn: 'span 3' }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#1a3a7a' }}>${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div style={{ fontSize: 13, color: '#555', marginTop: 4 }}>Total Expenses (All WOs)</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
          {Object.entries(byStatus).map(([status, amt]) => (
            <div key={status} style={{ background: '#f8f9ff', borderRadius: 10, padding: '12px 18px', borderLeft: `4px solid ${statusColors[status] || '#aaa'}`, minWidth: 140 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: statusColors[status] || '#aaa' }}>${amt.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
              <div style={{ fontSize: 12, color: '#666', textTransform: 'capitalize', marginTop: 2 }}>{status} WOs</div>
            </div>
          ))}
        </div>
        <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 2px 8px rgba(26,58,122,0.08)' }}>
          <h3 style={{ margin: '0 0 16px', color: '#1a3a7a' }}>Monthly Expense Totals</h3>
          {months.length === 0 ? <p style={{ color: '#aaa' }}>No data.</p> : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: '#f0f4ff' }}>
                <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: 13, color: '#1a3a7a' }}>Month</th>
                <th style={{ textAlign: 'right', padding: '8px 12px', fontSize: 13, color: '#1a3a7a' }}>Total</th>
              </tr></thead>
              <tbody>
                {months.map(m => (
                  <tr key={m} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '8px 12px', fontSize: 14 }}>{new Date(m + '-15').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</td>
                    <td style={{ padding: '8px 12px', fontSize: 14, fontWeight: 700, textAlign: 'right' }}>${(byMonth[m] || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <button onClick={() => setPage('home')} style={{ marginTop: 20, padding: '8px 20px', background: '#1a3a7a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>← Back to Dashboard</button>
      </div>
    );
  }

  // ── Settings: Personal ──────────────────────────────────────────────────
  if (page === 'settingspersonal') {
    const inputS: React.CSSProperties = { display: 'block', width: '100%', padding: '8px 12px', border: '1px solid #c0cce0', borderRadius: 7, fontSize: 14, boxSizing: 'border-box', marginTop: 5 };
    const labelS: React.CSSProperties = { fontWeight: 600, fontSize: 13, color: '#333', display: 'block', marginBottom: 12 };
    const isTech = authUser?.userType === 'tech';

    const handlePersonalSave = async (e: React.FormEvent) => {
      e.preventDefault();
      setPersonalMsg(null);
      if (personalForm.newPassword && personalForm.newPassword !== personalForm.confirmPassword) {
        setPersonalMsg({ type: 'error', text: 'New passwords do not match.' }); return;
      }
      if (!personalForm.currentPassword) {
        setPersonalMsg({ type: 'error', text: 'Current password is required to save changes.' }); return;
      }
      setPersonalSaving(true);
      try {
        const res = await api.updateProfile({
          newUsername: personalForm.newUsername.trim() || undefined,
          currentPassword: personalForm.currentPassword,
          newPassword: personalForm.newPassword || undefined,
        });
        if (res.error) { setPersonalMsg({ type: 'error', text: res.error }); return; }
        setPersonalMsg({ type: 'success', text: 'Settings saved! Please log in again if you changed your username or password.' });
        setPersonalForm({ newUsername: '', currentPassword: '', newPassword: '', confirmPassword: '' });
        // Update displayed username if changed
        if (personalForm.newUsername.trim() && authUser) {
          setAuthUser({ ...authUser, username: personalForm.newUsername.trim() });
        }
      } catch { setPersonalMsg({ type: 'error', text: 'Failed to save. Please try again.' }); }
      finally { setPersonalSaving(false); }
    };

    return (
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '32px 20px' }}>
        <h1 style={{ color: '#1a3a7a', marginBottom: 4 }}>👤 Personal Settings</h1>
        <p style={{ color: '#666', marginBottom: 28 }}>Update your account username and password.</p>

        <div style={{ background: '#fff', borderRadius: 12, padding: '28px 32px', boxShadow: '0 2px 8px rgba(26,58,122,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, padding: '14px 18px', background: '#f0f4ff', borderRadius: 10, border: '1px solid #d0d8f0' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#1a3a7a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: '#fff', fontWeight: 700, flexShrink: 0 }}>
              {authUser?.username?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 17, color: '#1a3a7a' }}>{authUser?.username}</div>
              <div style={{ fontSize: 13, color: '#888', marginTop: 2, textTransform: 'capitalize' }}>{authUser?.userType}</div>
            </div>
          </div>

          {personalMsg && (
            <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 20, fontSize: 13, fontWeight: 600,
              background: personalMsg.type === 'success' ? '#d4edda' : '#fde8e8',
              color: personalMsg.type === 'success' ? '#155724' : '#c00',
              border: `1px solid ${personalMsg.type === 'success' ? '#b0e0c0' : '#f5c0c0'}` }}>
              {personalMsg.type === 'success' ? '✓ ' : '⚠ '}{personalMsg.text}
            </div>
          )}

          {/* Dashboard Type — tech only */}
          {isTech && (
            <div style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: 22, marginBottom: 22 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#1a3a7a', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14 }}>Dashboard Style</div>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                {([
                  { key: 'classic' as const, label: 'Classic', icon: '📦', desc: 'New WO, Drafts, Active, and Done buttons always visible in the bottom nav bar.' },
                  { key: 'dropdown' as const, label: 'Dropdown', icon: '▼', desc: 'New WO, Drafts, and Done move into a dropdown under your name. Only Active WOs remain in the bottom nav.' },
                ]).map(opt => (
                  <div key={opt.key} onClick={() => setTechDashStyle(opt.key)}
                    style={{ flex: '1 1 180px', border: `2px solid ${techDashStyle === opt.key ? '#1a3a7a' : '#d0d8f0'}`, borderRadius: 10, padding: '14px 16px', cursor: 'pointer',
                      background: techDashStyle === opt.key ? '#f0f4ff' : '#fafbff', transition: 'all 0.15s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 18 }}>{opt.icon}</span>
                      <span style={{ fontWeight: 700, fontSize: 15, color: techDashStyle === opt.key ? '#1a3a7a' : '#444' }}>{opt.label}</span>
                      {techDashStyle === opt.key && <span style={{ marginLeft: 'auto', background: '#1a3a7a', color: '#fff', borderRadius: 10, padding: '1px 8px', fontSize: 11, fontWeight: 700 }}>✓ Active</span>}
                    </div>
                    <div style={{ fontSize: 12, color: '#666', lineHeight: 1.5 }}>{opt.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Work Order Filter — tech only */}
          {isTech && (
            <div style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: 22, marginBottom: 22 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#1a3a7a', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>Work Order Visibility</div>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 14 }}>Control which work orders appear in your Draft, Active, and Completed lists.</div>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                {([
                  { key: 'assigned' as const, label: 'My Work Orders', icon: '👤', desc: 'Only show work orders assigned directly to you.' },
                  { key: 'all' as const, label: 'All Work Orders', icon: '🌐', desc: 'Show all work orders regardless of assignment.' },
                ]).map(opt => (
                  <div key={opt.key} onClick={() => setTechWOFilter(opt.key)}
                    style={{ flex: '1 1 180px', border: `2px solid ${techWOFilter === opt.key ? '#1a3a7a' : '#d0d8f0'}`, borderRadius: 10, padding: '14px 16px', cursor: 'pointer',
                      background: techWOFilter === opt.key ? '#f0f4ff' : '#fafbff', transition: 'all 0.15s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 18 }}>{opt.icon}</span>
                      <span style={{ fontWeight: 700, fontSize: 15, color: techWOFilter === opt.key ? '#1a3a7a' : '#444' }}>{opt.label}</span>
                      {techWOFilter === opt.key && <span style={{ marginLeft: 'auto', background: '#1a3a7a', color: '#fff', borderRadius: 10, padding: '1px 8px', fontSize: 11, fontWeight: 700 }}>✓ Active</span>}
                    </div>
                    <div style={{ fontSize: 12, color: '#666', lineHeight: 1.5 }}>{opt.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handlePersonalSave} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <div style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#1a3a7a', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14 }}>Change Username</div>
              <label style={labelS}>New Username
                <input style={inputS} value={personalForm.newUsername} onChange={e => setPersonalForm(p => ({ ...p, newUsername: e.target.value }))}
                  placeholder={authUser?.username || ''} autoComplete="username" />
                <span style={{ fontSize: 12, color: '#aaa', marginTop: 4, display: 'block' }}>Leave blank to keep current username</span>
              </label>
            </div>

            <div style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#1a3a7a', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14 }}>Change Password</div>
              <label style={labelS}>New Password
                <input type="password" style={inputS} value={personalForm.newPassword} onChange={e => setPersonalForm(p => ({ ...p, newPassword: e.target.value }))}
                  placeholder="Leave blank to keep current password" autoComplete="new-password" />
              </label>
              <label style={labelS}>Confirm New Password
                <input type="password" style={inputS} value={personalForm.confirmPassword} onChange={e => setPersonalForm(p => ({ ...p, confirmPassword: e.target.value }))}
                  placeholder="Repeat new password" autoComplete="new-password" />
              </label>
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#c00', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14 }}>Confirm Identity</div>
              <label style={labelS}>Current Password <span style={{ color: '#c00' }}>*</span>
                <input type="password" style={{ ...inputS, border: '1px solid #f5a0a0' }} value={personalForm.currentPassword}
                  onChange={e => setPersonalForm(p => ({ ...p, currentPassword: e.target.value }))}
                  placeholder="Required to save any changes" autoComplete="current-password" required />
              </label>
            </div>

            <button type="submit" disabled={personalSaving}
              style={{ background: '#1a3a7a', color: '#fff', border: 'none', borderRadius: 8, padding: '11px 28px', fontWeight: 700, fontSize: 15, cursor: 'pointer', marginTop: 8, alignSelf: 'flex-start' }}>
              {personalSaving ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </div>
        <button onClick={() => setPage('home')} style={{ marginTop: 20, padding: '8px 20px', background: '#1a3a7a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>← Back to Dashboard</button>
      </div>
    );
  }

  // ── Settings: Company Info ─────────────────────────────────────────────────
  if (page === 'settingscompany') {
    return (
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 20px' }}>
        <h1 style={{ color: '#1a3a7a', marginBottom: 4 }}>🏢 Company Info</h1>
        <p style={{ color: '#666', marginBottom: 24 }}>Business name, address, contact details, and logo used on invoices.</p>
        <div style={{ background: '#fff', borderRadius: 12, padding: 32, boxShadow: '0 2px 8px rgba(26,58,122,0.08)', textAlign: 'center', color: '#aaa' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🚧</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#888' }}>Coming Soon</div>
          <div style={{ fontSize: 14, marginTop: 8 }}>Company settings will populate invoice headers, contact info, and branding.</div>
        </div>
        <button onClick={() => setPage('home')} style={{ marginTop: 20, padding: '8px 20px', background: '#1a3a7a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>← Back to Dashboard</button>
      </div>
    );
  }

  // ── Settings: Tax & Fees ──────────────────────────────────────────────────
  if (page === 'settingstaxfees') {
    return (
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 20px' }}>
        <h1 style={{ color: '#1a3a7a', marginBottom: 4 }}>🧾 Tax & Fees</h1>
        <p style={{ color: '#666', marginBottom: 24 }}>Configure default tax rates, service fees, and surcharges applied to invoices.</p>
        <div style={{ background: '#fff', borderRadius: 12, padding: 32, boxShadow: '0 2px 8px rgba(26,58,122,0.08)', textAlign: 'center', color: '#aaa' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🚧</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#888' }}>Coming Soon</div>
          <div style={{ fontSize: 14, marginTop: 8 }}>Set default tax %, card service fee amounts, and whether they auto-apply to new invoices.</div>
        </div>
        <button onClick={() => setPage('home')} style={{ marginTop: 20, padding: '8px 20px', background: '#1a3a7a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>← Back to Dashboard</button>
      </div>
    );
  }

  // ── Settings: Markup & Pricing ────────────────────────────────────────────
  if (page === 'settingspricing') {
    return (
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 20px' }}>
        <h1 style={{ color: '#1a3a7a', marginBottom: 4 }}>💲 Markup & Pricing</h1>
        <p style={{ color: '#666', marginBottom: 24 }}>Set default parts markup %, labor rates, and pricing tiers by service type.</p>
        <div style={{ background: '#fff', borderRadius: 12, padding: 32, boxShadow: '0 2px 8px rgba(26,58,122,0.08)', textAlign: 'center', color: '#aaa' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🚧</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#888' }}>Coming Soon</div>
          <div style={{ fontSize: 14, marginTop: 8 }}>Default markup and labor rates will auto-fill on new work order expenses.</div>
        </div>
        <button onClick={() => setPage('home')} style={{ marginTop: 20, padding: '8px 20px', background: '#1a3a7a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>← Back to Dashboard</button>
      </div>
    );
  }

  // ── Settings: Pay Period Config ───────────────────────────────────────────
  if (page === 'settingspayperiod') {
    return (
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 20px' }}>
        <h1 style={{ color: '#1a3a7a', marginBottom: 4 }}>📅 Pay Period Config</h1>
        <p style={{ color: '#666', marginBottom: 24 }}>Set pay period start date, frequency (weekly/biweekly), and payday offset.</p>
        <div style={{ background: '#fff', borderRadius: 12, padding: 32, boxShadow: '0 2px 8px rgba(26,58,122,0.08)', textAlign: 'center', color: '#aaa' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🚧</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#888' }}>Coming Soon</div>
          <div style={{ fontSize: 14, marginTop: 8 }}>Pay period settings will drive the payroll page and calendar pay period markers.</div>
        </div>
        <button onClick={() => setPage('home')} style={{ marginTop: 20, padding: '8px 20px', background: '#1a3a7a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>← Back to Dashboard</button>
      </div>
    );
  }

  // ── Deleted Work Orders (formerly "Close Work Orders") ──────────────────
  if (page === "deletedworkorders") {
    const deletedOrders = workOrders.filter((wo) => wo.status === 'deleted');
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minHeight: "100vh", padding: "1rem" }}>
        <h1>Deleted Work Orders</h1>
        {deletedOrders.length === 0 ? (
          <p>No deleted work orders.</p>
        ) : (
          <table className="wo-table">
            <thead>
              <tr>
                <th>WO #</th>
                <th>Property</th>
                <th>Title</th>
                <th>Scheduled Date</th>
                <th>View</th>
              </tr>
            </thead>
            <tbody>
              {deletedOrders.map((wo: WorkOrder, idx: number) => (
                <tr key={idx}>
                  <td data-label="WO #">{wo.number}</td>
                  <td data-label="Property">{wo.propertyName}</td>
                  <td data-label="Title">{wo.title}</td>
                  <td data-label="Scheduled Date">{wo.scheduledDate || '—'}</td>
                  <td><button onClick={() => openWODetail(wo, 'deletedworkorders')}>🔍 View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <button style={{ marginTop: 16 }} onClick={() => setPage("home")}>Return to Home</button>
      </div>
    );
  }

  // ── Invoice List ─────────────────────────────────────────────────────────
  if (page === "invoicelist") {
    const invoicedOrders = workOrders.filter((wo) => wo.status === 'invoiced' || wo.status === 'sent' || wo.status === 'nocharge');

    const openInvoicePreview = async (wo: WorkOrder) => {
      setPreviewInvoiceWO(wo);
      setPreviewInvoiceLoading(true);
      try {
        const exps = await api.fetchWorkOrderExpenses(wo.number);
        setPreviewInvoiceExpenses(exps);
      } catch { setPreviewInvoiceExpenses([]); }
      finally { setPreviewInvoiceLoading(false); }
    };

    const buildInvoiceHTML = (wo: WorkOrder, exps: WorkOrderExpense[], overrideTitle?: string, overrideInstructions?: string, overrideBillingDesc?: string) => {
      const prop = properties.find((p: PropertyForm) => p.propertyName === wo.propertyName);
      const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      const total = exps.reduce((s, e) => s + (parseFloat(e.totalCost) || 0), 0);
      const title = overrideTitle ?? wo.title;
      const instructions = overrideInstructions ?? wo.instructions;
      const billingDesc = overrideBillingDesc ?? (localStorage.getItem(`bd_${wo.number}`) || '');
      // Invoice number: address number + date of service (MMDDYY)
      const addrNum = [prop?.address, prop?.street].reduce((found: string | undefined, f) => found || (f || '').match(/\d+/)?.[0], undefined) || wo.number.replace('WO-','');
      const todayMMDDYY = (() => { const n = new Date(); const m = String(n.getMonth()+1).padStart(2,'0'); const d = String(n.getDate()).padStart(2,'0'); const y = String(n.getFullYear()).slice(2); return m+d+y; })();
      const invoiceNum = `${addrNum}-${todayMMDDYY}`;
      const addrLine1 = prop?.address || '';
      const addrLine2 = prop?.street || '';
      const billToLine2 = `${prop?.city||''}${prop?.city&&prop?.state?', ':''}${prop?.state||''} ${prop?.zip||''}`.trim();
      const itemRows = exps.length > 0
        ? exps.map((e, i) => `<tr style="background:${i%2===0?'#f0f4ff':'#fff'};"><td style="padding:10px 12px;border-bottom:1px solid #dde;font-size:13px;">${i+1}</td><td style="padding:10px 12px;border-bottom:1px solid #dde;font-size:13px;">${e.description}${e.partNumber ? ` <span style="color:#888;font-size:11px;">(${e.partNumber})</span>` : ''}</td><td style="padding:10px 12px;border-bottom:1px solid #dde;font-size:13px;">${e.category}</td><td style="padding:10px 12px;border-bottom:1px solid #dde;font-size:13px;text-align:right;">${e.totalCost ? '$'+parseFloat(e.totalCost).toFixed(2) : '—'}</td></tr>`).join('')
        : `<tr style="background:#f0f4ff;"><td style="padding:10px 12px;border-bottom:1px solid #dde;font-size:13px;">1</td><td style="padding:10px 12px;border-bottom:1px solid #dde;font-size:13px;white-space:pre-wrap;">${instructions}</td><td></td><td></td></tr>${[2,3,4,5].map(n=>`<tr><td style="padding:10px 12px;border-bottom:1px solid #eee;color:#bbb;">${n}</td><td style="padding:10px 12px;border-bottom:1px solid #eee;">&nbsp;</td><td></td><td></td></tr>`).join('')}`;
      return `<!DOCTYPE html><html><head><title>Invoice ${invoiceNum}</title><style>body{font-family:Arial,sans-serif;margin:0;padding:32px;color:#111;}table{border-collapse:collapse;width:100%;}th,td{padding:9px 12px;}@media print{body{padding:16px;}}</style></head><body>
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;padding-bottom:16px;border-bottom:3px solid #1a3a7a;">
          <img src="/logo.png" alt="First Choice" style="height:80px;object-fit:contain;" />
          <div style="text-align:right;">
            <div style="font-size:30px;font-weight:900;color:#1a3a7a;letter-spacing:2px;">INVOICE</div>
            <table style="margin-top:8px;font-size:13px;border-collapse:collapse;">
              <tr><td style="padding-right:12px;color:#555;font-weight:600;">Invoice #</td><td style="font-weight:700;">${invoiceNum}</td></tr>
              <tr><td style="padding-right:12px;color:#555;font-weight:600;">Work Order</td><td>${wo.number}</td></tr>
              <tr><td style="padding-right:12px;color:#555;font-weight:600;">Date</td><td>${today}</td></tr>
            </table>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px;">
          <div style="background:#f0f4ff;border:1px solid #c0d0f0;border-radius:8px;padding:14px;">
            <div style="font-weight:800;color:#1a3a7a;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Bill To</div>
            <div style="font-weight:700;font-size:15px;">${prop?.ownerName || wo.propertyName}</div>
            ${(addrLine1 || addrLine2) ? `<div style="margin-top:2px;">${[addrLine1, addrLine2].filter(Boolean).join(' ')}</div>` : ''}
            ${billToLine2 ? `<div>${billToLine2}</div>` : ''}
          </div>
          <div style="background:#f0f4ff;border:1px solid #c0d0f0;border-radius:8px;padding:14px;">
            <div style="font-weight:800;color:#1a3a7a;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Project</div>
            <div style="font-size:13px;color:#555;margin-bottom:4px;">${wo.propertyName}</div>
            <div style="font-weight:700;font-size:15px;">${title}</div>
            ${billingDesc ? `<div style="margin-top:4px;color:#333;font-size:14px;">${billingDesc}</div>` : ''}
          </div>
        </div>
        <table style="width:100%;border-collapse:collapse;margin-bottom:4px;">
          <thead><tr style="background:#1a3a7a;color:#fff;">
            <th style="padding:10px 12px;text-align:left;font-size:12px;width:36px;">#</th>
            <th style="padding:10px 12px;text-align:left;font-size:12px;">Description</th>
            <th style="padding:10px 12px;text-align:left;font-size:12px;">Category</th>
            <th style="padding:10px 12px;text-align:right;font-size:12px;width:120px;">Amount</th>
          </tr></thead>
          <tbody>${itemRows}</tbody>
        </table>
        <div style="display:flex;justify-content:flex-end;margin-bottom:32px;">
          <table style="border-collapse:collapse;min-width:240px;">
            <tr><td style="padding:8px 14px;font-weight:600;color:#555;border-top:1px solid #ddd;font-size:13px;">Subtotal</td><td style="padding:8px 14px;text-align:right;border-top:1px solid #ddd;font-size:13px;">${total>0?'$'+total.toFixed(2):'—'}</td></tr>
            <tr style="background:#1a3a7a;color:#fff;"><td style="padding:10px 14px;font-weight:900;font-size:15px;">TOTAL</td><td style="padding:10px 14px;text-align:right;font-weight:900;font-size:15px;">${total>0?'$'+total.toFixed(2):'—'}</td></tr>
          </table>
        </div>
        <div style="margin-top:24px;text-align:center;font-size:14px;font-weight:600;color:#1a3a7a;border-top:1px solid #eee;padding-top:16px;">Thank you for your business!</div>
        <div style="text-align:center;font-size:11px;color:#999;margin-top:4px;">First Choice Maintenance &amp; Home Repair</div>
      </body></html>`;
    };

    const printInvoiceDoc = (wo: WorkOrder, exps: WorkOrderExpense[]) => {
      const win = window.open('', '_blank', 'width=800,height=900');
      if (!win) return;
      win.document.write(buildInvoiceHTML(wo, exps));
      win.document.close(); win.focus();
      setTimeout(() => { win.print(); win.close(); }, 400);
    };

    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minHeight: "100vh", padding: "1rem" }}>
        <h1>Invoice List</h1>
        {invoicedOrders.length === 0 ? (
          <p>No invoiced work orders yet.</p>
        ) : (
          <table className="wo-table">
            <thead>
              <tr>
                <th>WO #</th>
                <th>Property</th>
                <th>Title</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoicedOrders.map((wo: WorkOrder, idx: number) => (
                <tr key={idx}>
                  <td data-label="WO #">{wo.number}</td>
                  <td data-label="Property">{wo.propertyName}</td>
                  <td data-label="Title">{wo.title}</td>
                  <td data-label="Date">{wo.scheduledDate || '—'}</td>
                  <td data-label="Status">
                    <span style={{
                      background: wo.status === 'nocharge' ? '#888' : wo.status === 'sent' ? '#1a3a7a' : '#2a9d2a',
                      color: '#fff', borderRadius: 12, padding: '2px 10px', fontSize: 12, fontWeight: 700
                    }}>
                      {wo.status === 'nocharge' ? 'No Charge' : wo.status === 'sent' ? 'Sent' : 'Created'}
                    </span>
                  </td>
                  <td style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    <button style={{ background: '#555', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 9px', cursor: 'pointer', fontSize: 12 }} onClick={() => openInvoicePreview(wo)}>📄 Preview</button>
                    <button style={{ background: '#6c3db5', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 9px', cursor: 'pointer', fontSize: 12 }} onClick={async () => {
                      const exps = await api.fetchWorkOrderExpenses(wo.number);
                      const savedBillingDesc = localStorage.getItem(`bd_${wo.number}`) || '';
                      setEditingInvoiceWO(wo);
                      setEditInvoiceForm({
                        title: wo.title,
                        instructions: wo.instructions,
                        billingDescription: savedBillingDesc,
                        editExpenses: exps.map((e: WorkOrderExpense) => {
                          const markup = e.category === 'Part' ? 10 : 0;
                          const totalWithMarkup = e.category === 'Part'
                            ? (parseFloat(e.quantity) * parseFloat(e.unitCost) * (1 + markup / 100)).toFixed(2)
                            : e.totalCost;
                          return { ...e, markup, totalCost: totalWithMarkup };
                        }),
                        expensesLoading: false
                      });
                    }}>✏️ Edit</button>
                    {(wo.status === 'invoiced' || wo.status === 'nocharge') && (
                      <button style={{ background: '#0077cc', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 9px', cursor: 'pointer', fontSize: 12 }} onClick={() => markSentWorkOrder(wo)}>📤 Mark Sent</button>
                    )}
                    {wo.status === 'sent' && (
                      <>
                        <button style={{ background: '#2a9d2a', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 9px', cursor: 'pointer', fontSize: 12 }} onClick={() => paidWorkOrder(wo.number)}>✓ Mark Paid</button>
                        <button style={{ background: '#1a3a7a', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 9px', cursor: 'pointer', fontSize: 12 }} onClick={async () => { const exps = await api.fetchWorkOrderExpenses(wo.number); printInvoiceDoc(wo, exps); }}>🖨️ Print</button>
                      </>
                    )}
                    {wo.status === 'invoiced' && (
                      <button style={{ background: '#1a3a7a', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 9px', cursor: 'pointer', fontSize: 12 }} onClick={async () => { const exps = await api.fetchWorkOrderExpenses(wo.number); printInvoiceDoc(wo, exps); }}>🖨️ Print</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <button style={{ marginTop: 16 }} onClick={() => setPage("home")}>Return to Home</button>

        {/* ── Edit Invoice Modal ── */}
        {editingInvoiceWO && (
          <div className="photo-modal">
            <div className="photo-modal-content" style={{ maxWidth: 680 }}>
              <h2>Edit Invoice — {editingInvoiceWO.number}</h2>
              <form onSubmit={async (e) => {
                e.preventDefault();
                // Save billing description to localStorage
                localStorage.setItem(`bd_${editingInvoiceWO.number}`, editInvoiceForm.billingDescription);
                // Save WO fields
                await api.updateWorkOrder(editingInvoiceWO.number, {
                  propertyName: editingInvoiceWO.propertyName,
                  title: editInvoiceForm.title,
                  instructions: editInvoiceForm.instructions,
                  scheduledDate: editingInvoiceWO.scheduledDate,
                  scheduledTime: editingInvoiceWO.scheduledTime,
                });
                // Update expenses: delete all existing, recreate with updated values
                for (const exp of editInvoiceForm.editExpenses) {
                  if (exp.id > 0) await api.deleteWorkOrderExpense(exp.id);
                }
                for (const exp of editInvoiceForm.editExpenses) {
                  await api.createWorkOrderExpense(editingInvoiceWO.number, {
                    description: exp.description,
                    category: exp.category,
                    quantity: exp.quantity,
                    unitCost: exp.unitCost,
                    totalCost: exp.totalCost,
                    vendor: exp.vendor,
                    partNumber: exp.partNumber,
                  });
                }
                await loadAllData();
                setEditingInvoiceWO(null);
              }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <label style={{ fontWeight: 600, fontSize: 13 }}>
                  Project Title
                  <input value={editInvoiceForm.title} onChange={(e) => setEditInvoiceForm(p => ({ ...p, title: e.target.value }))} required style={{ display: 'block', width: '100%', marginTop: 4, padding: '7px 10px', border: '1px solid #aaa', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }} />
                </label>
                <label style={{ fontWeight: 600, fontSize: 13 }}>
                  Billing Description <span style={{ fontWeight: 400, color: '#888', fontSize: 12 }}>(shown in Project box on invoice)</span>
                  <input value={editInvoiceForm.billingDescription} onChange={(e) => setEditInvoiceForm(p => ({ ...p, billingDescription: e.target.value }))} placeholder="e.g. Exterior Painting Services" style={{ display: 'block', width: '100%', marginTop: 4, padding: '7px 10px', border: '1px solid #aaa', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }} />
                </label>
                <label style={{ fontWeight: 600, fontSize: 13 }}>
                  Scope of Work / Notes
                  <textarea value={editInvoiceForm.instructions} onChange={(e) => setEditInvoiceForm(p => ({ ...p, instructions: e.target.value }))} rows={3} style={{ display: 'block', width: '100%', marginTop: 4, padding: '7px 10px', border: '1px solid #aaa', borderRadius: 6, fontSize: 14, boxSizing: 'border-box', resize: 'vertical' }} />
                </label>

                {editInvoiceForm.editExpenses.length > 0 && (
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: '#1a3a7a' }}>Line Items</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: '#1a3a7a', color: '#fff' }}>
                          <th style={{ padding: '6px 8px', textAlign: 'left' }}>Description</th>
                          <th style={{ padding: '6px 8px', textAlign: 'left' }}>Category</th>
                          <th style={{ padding: '6px 8px', textAlign: 'right', width: 60 }}>Qty</th>
                          <th style={{ padding: '6px 8px', textAlign: 'right', width: 80 }}>Unit Cost</th>
                          <th style={{ padding: '6px 8px', textAlign: 'right', width: 70 }}>Markup%</th>
                          <th style={{ padding: '6px 8px', textAlign: 'right', width: 80 }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {editInvoiceForm.editExpenses.map((exp, i) => {
                          const isLabor = exp.category === 'Labor';
                          const isPart = exp.category === 'Part';
                          return (
                            <tr key={i} style={{ background: i % 2 === 0 ? '#f0f4ff' : '#fff' }}>
                              <td style={{ padding: '4px 6px', borderBottom: '1px solid #dde' }}>
                                <input value={exp.description} onChange={(e) => {
                                  const exps = [...editInvoiceForm.editExpenses];
                                  exps[i] = { ...exps[i], description: e.target.value };
                                  setEditInvoiceForm(p => ({ ...p, editExpenses: exps }));
                                }} style={{ width: '100%', padding: '3px 6px', border: '1px solid #ccc', borderRadius: 4, fontSize: 12, boxSizing: 'border-box' }} />
                              </td>
                              <td style={{ padding: '4px 6px', borderBottom: '1px solid #dde', color: '#555' }}>{exp.category}</td>
                              <td style={{ padding: '4px 6px', borderBottom: '1px solid #dde' }}>
                                {isLabor ? (
                                  <input type="number" min="0" step="0.25" value={parseFloat(exp.quantity) || 0} onChange={(e) => {
                                    const hrs = parseFloat(e.target.value) || 0;
                                    const exps = [...editInvoiceForm.editExpenses];
                                    exps[i] = { ...exps[i], quantity: String(hrs), totalCost: String((hrs * 55).toFixed(2)) };
                                    setEditInvoiceForm(p => ({ ...p, editExpenses: exps }));
                                  }} style={{ width: 54, padding: '3px 4px', border: '1px solid #ccc', borderRadius: 4, fontSize: 12, textAlign: 'right' }} />
                                ) : (
                                  <input type="number" min="0" step="1" value={parseFloat(exp.quantity) || 0} onChange={(e) => {
                                    const qty = parseFloat(e.target.value) || 0;
                                    const unit = parseFloat(exp.unitCost) || 0;
                                    const markup = exp.markup ?? 0;
                                    const total = (qty * unit * (1 + markup / 100)).toFixed(2);
                                    const exps = [...editInvoiceForm.editExpenses];
                                    exps[i] = { ...exps[i], quantity: String(qty), totalCost: total };
                                    setEditInvoiceForm(p => ({ ...p, editExpenses: exps }));
                                  }} style={{ width: 54, padding: '3px 4px', border: '1px solid #ccc', borderRadius: 4, fontSize: 12, textAlign: 'right' }} />
                                )}
                              </td>
                              <td style={{ padding: '4px 6px', borderBottom: '1px solid #dde' }}>
                                {isLabor ? (
                                  <span style={{ fontSize: 12, color: '#555' }}>$55/hr</span>
                                ) : (
                                  <input type="number" min="0" step="0.01" value={parseFloat(exp.unitCost) || 0} onChange={(e) => {
                                    const unit = parseFloat(e.target.value) || 0;
                                    const qty = parseFloat(exp.quantity) || 0;
                                    const markup = exp.markup ?? 0;
                                    const total = (qty * unit * (1 + markup / 100)).toFixed(2);
                                    const exps = [...editInvoiceForm.editExpenses];
                                    exps[i] = { ...exps[i], unitCost: String(unit), totalCost: total };
                                    setEditInvoiceForm(p => ({ ...p, editExpenses: exps }));
                                  }} style={{ width: 68, padding: '3px 4px', border: '1px solid #ccc', borderRadius: 4, fontSize: 12, textAlign: 'right' }} />
                                )}
                              </td>
                              <td style={{ padding: '4px 6px', borderBottom: '1px solid #dde' }}>
                                {isPart ? (
                                  <input type="number" min="0" step="1" value={exp.markup ?? 10} onChange={(e) => {
                                    const markup = parseFloat(e.target.value) || 0;
                                    const qty = parseFloat(exp.quantity) || 0;
                                    const unit = parseFloat(exp.unitCost) || 0;
                                    const total = (qty * unit * (1 + markup / 100)).toFixed(2);
                                    const exps = [...editInvoiceForm.editExpenses];
                                    exps[i] = { ...exps[i], markup, totalCost: total };
                                    setEditInvoiceForm(p => ({ ...p, editExpenses: exps }));
                                  }} style={{ width: 54, padding: '3px 4px', border: '1px solid #ccc', borderRadius: 4, fontSize: 12, textAlign: 'right' }} />
                                ) : (
                                  <span style={{ fontSize: 12, color: '#aaa' }}>—</span>
                                )}
                              </td>
                              <td style={{ padding: '4px 6px', borderBottom: '1px solid #dde', textAlign: 'right', fontWeight: 600 }}>
                                ${parseFloat(exp.totalCost).toFixed(2)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <div style={{ textAlign: 'right', fontWeight: 700, fontSize: 14, marginTop: 8, color: '#1a3a7a' }}>
                      Total: ${editInvoiceForm.editExpenses.reduce((s, e) => s + (parseFloat(e.totalCost) || 0), 0).toFixed(2)}
                    </div>
                  </div>
                )}
                <div>
                  <button type="button" style={{ background: '#e8f0fe', color: '#1a3a7a', border: '1px solid #b0c4f0', borderRadius: 6, padding: '6px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                    onClick={() => setEditInvoiceForm(p => ({
                      ...p,
                      editExpenses: [...p.editExpenses, {
                        id: -Date.now(),
                        workOrderNumber: editingInvoiceWO?.number || '',
                        description: 'Service Fee (Card/Pay Link)',
                        category: 'Fee',
                        quantity: '1',
                        unitCost: '3.00',
                        totalCost: '3.00',
                        vendor: '',
                        partNumber: '',
                        markup: 0,
                      }]
                    }))}>
                    ➕ Add Service Fee ($3.00)
                  </button>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="submit" style={{ background: '#2a9d2a', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 22px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>✓ Save</button>
                  <button type="button" onClick={() => setEditingInvoiceWO(null)} style={{ background: '#888', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 14, cursor: 'pointer' }}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {previewInvoiceWO && (() => {
          const wo = previewInvoiceWO;
          const exps = previewInvoiceExpenses;
          const total = exps.reduce((s, e) => s + (parseFloat(e.totalCost) || 0), 0);
          const prop = properties.find((p: PropertyForm) => p.propertyName === wo.propertyName);
          const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
          const addrNum = [prop?.address, prop?.street].reduce((found: string | undefined, f) => found || (f || '').match(/\d+/)?.[0], undefined) || wo.number.replace('WO-','');
          const todayMMDDYY = (() => { const n = new Date(); const m = String(n.getMonth()+1).padStart(2,'0'); const d = String(n.getDate()).padStart(2,'0'); const y = String(n.getFullYear()).slice(2); return m+d+y; })();
          const invoiceNum = `${addrNum}-${todayMMDDYY}`;
          const addrLine1 = prop?.address || '';
          const addrLine2 = prop?.street || '';
          const billToLine2 = `${prop?.city||''}${prop?.city&&prop?.state?', ':''}${prop?.state||''} ${prop?.zip||''}`.trim();
          const previewBillingDesc = localStorage.getItem(`bd_${wo.number}`) || '';
          return (
            <div className="photo-modal">
              <div className="photo-modal-content" style={{ maxWidth: 700, padding: 0, overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', background: '#1a3a7a', color: '#fff' }}>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>Invoice {invoiceNum}</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => printInvoiceDoc(wo, exps)} style={{ background: '#0099FF', color: '#fff', border: 'none', borderRadius: 4, padding: '7px 16px', cursor: 'pointer', fontWeight: 700 }}>🖨️ Download / Print</button>
                    <button onClick={() => { setPreviewInvoiceWO(null); setPreviewInvoiceExpenses([]); }} style={{ background: '#ff4d4d', color: '#fff', border: 'none', borderRadius: 4, padding: '7px 14px', cursor: 'pointer', fontWeight: 700 }}>✕ Close</button>
                  </div>
                </div>
                <div style={{ overflowY: 'auto', maxHeight: '78vh', padding: '36px', fontFamily: 'Arial, sans-serif', background: '#fff', color: '#111' }}>
                  {previewInvoiceLoading ? <p style={{ textAlign: 'center', color: '#888' }}>Loading expenses...</p> : (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, paddingBottom: 16, borderBottom: '3px solid #1a3a7a' }}>
                        <img src="/logo.png" alt="First Choice" style={{ height: 80, objectFit: 'contain' }} />
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 30, fontWeight: 900, color: '#1a3a7a', letterSpacing: 2 }}>INVOICE</div>
                          <table style={{ marginTop: 8, fontSize: 13, borderCollapse: 'collapse' }}>
                            <tbody>
                              <tr><td style={{ paddingRight: 12, color: '#555', fontWeight: 600 }}>Invoice #</td><td style={{ fontWeight: 700 }}>{invoiceNum}</td></tr>
                              <tr><td style={{ paddingRight: 12, color: '#555', fontWeight: 600 }}>Work Order</td><td>{wo.number}</td></tr>
                              <tr><td style={{ paddingRight: 12, color: '#555', fontWeight: 600 }}>Date</td><td>{today}</td></tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                        <div style={{ background: '#f0f4ff', border: '1px solid #c0d0f0', borderRadius: 8, padding: 14 }}>
                          <div style={{ fontWeight: 800, color: '#1a3a7a', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Bill To</div>
                          <div style={{ fontWeight: 700, fontSize: 15 }}>{prop?.ownerName || wo.propertyName}</div>
                          {(addrLine1 || addrLine2) && <div style={{ marginTop: 2 }}>{[addrLine1, addrLine2].filter(Boolean).join(' ')}</div>}
                          {billToLine2 && <div>{billToLine2}</div>}
                        </div>
                        <div style={{ background: '#f0f4ff', border: '1px solid #c0d0f0', borderRadius: 8, padding: 14 }}>
                          <div style={{ fontWeight: 800, color: '#1a3a7a', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Project</div>
                          <div style={{ fontSize: 13, color: '#555', marginBottom: 4 }}>{wo.propertyName}</div>
                          <div style={{ fontWeight: 700, fontSize: 15 }}>{wo.title}</div>
                          {previewBillingDesc && <div style={{ marginTop: 4, color: '#333', fontSize: 14 }}>{previewBillingDesc}</div>}
                        </div>
                      </div>
                      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 4 }}>
                        <thead>
                          <tr style={{ background: '#1a3a7a', color: '#fff' }}>
                            <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, width: 36 }}>#</th>
                            <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12 }}>Description</th>
                            <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12 }}>Category</th>
                            <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 12, width: 120 }}>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {exps.length > 0 ? exps.map((e, i) => (
                            <tr key={i} style={{ background: i % 2 === 0 ? '#f0f4ff' : '#fff' }}>
                              <td style={{ padding: '10px 12px', borderBottom: '1px solid #dde', fontSize: 13 }}>{i + 1}</td>
                              <td style={{ padding: '10px 12px', borderBottom: '1px solid #dde', fontSize: 13 }}>{e.description}{e.partNumber ? <span style={{ color: '#888', fontSize: 11 }}> ({e.partNumber})</span> : ''}</td>
                              <td style={{ padding: '10px 12px', borderBottom: '1px solid #dde', fontSize: 13 }}>{e.category}</td>
                              <td style={{ padding: '10px 12px', borderBottom: '1px solid #dde', fontSize: 13, textAlign: 'right' }}>{e.totalCost ? `$${parseFloat(e.totalCost).toFixed(2)}` : '—'}</td>
                            </tr>
                          )) : (
                            <>
                              <tr style={{ background: '#f0f4ff' }}>
                                <td style={{ padding: '10px 12px', borderBottom: '1px solid #dde', fontSize: 13 }}>1</td>
                                <td style={{ padding: '10px 12px', borderBottom: '1px solid #dde', fontSize: 13, whiteSpace: 'pre-wrap' }} colSpan={2}>{wo.instructions}</td>
                                <td style={{ padding: '10px 12px', borderBottom: '1px solid #dde', fontSize: 13 }}></td>
                              </tr>
                              {[2,3,4,5].map(n => <tr key={n}><td style={{ padding: '10px 12px', borderBottom: '1px solid #eee', color: '#bbb' }}>{n}</td><td style={{ padding: '10px 12px', borderBottom: '1px solid #eee' }} colSpan={2}>&nbsp;</td><td></td></tr>)}
                            </>
                          )}
                        </tbody>
                      </table>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 32 }}>
                        <table style={{ borderCollapse: 'collapse', minWidth: 240 }}>
                          <tbody>
                            <tr><td style={{ padding: '8px 14px', fontWeight: 600, color: '#555', borderTop: '1px solid #ddd', fontSize: 13 }}>Subtotal</td><td style={{ padding: '8px 14px', textAlign: 'right', borderTop: '1px solid #ddd', fontSize: 13 }}>{total > 0 ? `$${total.toFixed(2)}` : '—'}</td></tr>
                            <tr style={{ background: '#1a3a7a', color: '#fff' }}><td style={{ padding: '10px 14px', fontWeight: 900, fontSize: 15 }}>TOTAL</td><td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 900, fontSize: 15 }}>{total > 0 ? `$${total.toFixed(2)}` : '—'}</td></tr>
                          </tbody>
                        </table>
                      </div>
                      <div style={{ marginTop: 24, textAlign: 'center', fontSize: 15, fontWeight: 700, color: '#1a3a7a', borderTop: '1px solid #eee', paddingTop: 16 }}>Thank you for your business!</div>
                      <div style={{ textAlign: 'center', fontSize: 11, color: '#999', marginTop: 4 }}>First Choice Maintenance &amp; Home Repair</div>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    );
  }

  // ── Paid Invoices ────────────────────────────────────────────────────────
  if (page === "paidinvoices") {
    const paidOrders = workOrders.filter((wo) => wo.status === 'paid');
    const printPaidInvoice = async (wo: WorkOrder) => {
      const exps = await api.fetchWorkOrderExpenses(wo.number);
      const prop = properties.find((p: PropertyForm) => p.propertyName === wo.propertyName);
      const total = exps.reduce((s: number, e: WorkOrderExpense) => s + (parseFloat(e.totalCost) || 0), 0);
      const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      const itemRows = exps.length > 0
        ? exps.map((e: WorkOrderExpense, i: number) => `<tr style="background:${i%2===0?'#f0f4ff':'#fff'};"><td style="padding:10px 12px;border-bottom:1px solid #dde;font-size:13px;">${i+1}</td><td style="padding:10px 12px;border-bottom:1px solid #dde;font-size:13px;">${e.description}</td><td style="padding:10px 12px;border-bottom:1px solid #dde;font-size:13px;">${e.category}</td><td style="padding:10px 12px;border-bottom:1px solid #dde;font-size:13px;text-align:right;">${e.totalCost?'$'+parseFloat(e.totalCost).toFixed(2):'—'}</td></tr>`).join('')
        : `<tr style="background:#f0f4ff;"><td style="padding:10px 12px;">1</td><td style="padding:10px 12px;white-space:pre-wrap;" colspan="2">${wo.instructions}</td><td></td></tr>`;
      const win = window.open('', '_blank', 'width=800,height=900');
      if (!win) return;
      win.document.write(`<!DOCTYPE html><html><head><title>Invoice ${wo.number} — PAID</title><style>body{font-family:Arial,sans-serif;margin:0;padding:32px;color:#111;}table{border-collapse:collapse;width:100%;}th,td{padding:9px 12px;}@media print{body{padding:16px;}}</style></head><body>
        <div style="text-align:right;margin-bottom:8px;"><span style="background:#2a9d2a;color:#fff;font-weight:900;font-size:18px;padding:4px 20px;border-radius:8px;letter-spacing:2px;">PAID</span></div>
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;padding-bottom:16px;border-bottom:3px solid #1a3a7a;">
          <img src="/logo.png" alt="First Choice" style="height:80px;object-fit:contain;" />
          <div style="text-align:right;"><div style="font-size:30px;font-weight:900;color:#1a3a7a;letter-spacing:2px;">INVOICE</div>
            <table style="margin-top:8px;font-size:13px;border-collapse:collapse;">
              <tr><td style="padding-right:12px;color:#555;font-weight:600;">Invoice #</td><td style="font-weight:700;">${wo.number}</td></tr>
              <tr><td style="padding-right:12px;color:#555;font-weight:600;">Date</td><td>${today}</td></tr>
            </table>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px;">
          <div style="background:#f0f4ff;border:1px solid #c0d0f0;border-radius:8px;padding:14px;">
            <div style="font-weight:800;color:#1a3a7a;font-size:11px;text-transform:uppercase;margin-bottom:8px;">Bill To</div>
            <div style="font-weight:700;font-size:15px;">${prop?.ownerName||wo.propertyName}</div>
            ${prop?`<div>${prop.street||''}</div><div>${prop.city||''}${prop.city&&prop.state?', ':''}${prop.state||''} ${prop.zip||''}</div>`:''}
          </div>
          <div style="background:#f0f4ff;border:1px solid #c0d0f0;border-radius:8px;padding:14px;">
            <div style="font-weight:800;color:#1a3a7a;font-size:11px;text-transform:uppercase;margin-bottom:8px;">Project</div>
            <div style="font-weight:700;font-size:15px;">${wo.title}</div>
            <div style="color:#555;font-size:13px;">${wo.propertyName}</div>
          </div>
        </div>
        <table style="width:100%;border-collapse:collapse;margin-bottom:4px;">
          <thead><tr style="background:#1a3a7a;color:#fff;"><th style="padding:10px 12px;text-align:left;font-size:12px;">#</th><th style="padding:10px 12px;text-align:left;font-size:12px;">Description</th><th style="padding:10px 12px;text-align:left;font-size:12px;">Category</th><th style="padding:10px 12px;text-align:right;font-size:12px;">Amount</th></tr></thead>
          <tbody>${itemRows}</tbody>
        </table>
        <div style="display:flex;justify-content:flex-end;margin-bottom:32px;">
          <table style="border-collapse:collapse;min-width:240px;">
            <tr style="background:#1a3a7a;color:#fff;"><td style="padding:10px 14px;font-weight:900;font-size:15px;">TOTAL</td><td style="padding:10px 14px;text-align:right;font-weight:900;font-size:15px;">${total>0?'$'+total.toFixed(2):'—'}</td></tr>
          </table>
        </div>
        <div style="margin-top:24px;text-align:center;font-size:11px;color:#999;border-top:1px solid #eee;padding-top:12px;">First Choice Maintenance &amp; Home Repair — Thank you for your business!</div>
      </body></html>`);
      win.document.close(); win.focus();
      setTimeout(() => { win.print(); win.close(); }, 400);
    };
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minHeight: "100vh", padding: "1rem" }}>
        <h1>Paid Invoices</h1>
        {paidOrders.length === 0 ? (
          <p>No paid invoices yet.</p>
        ) : (
          <table className="wo-table">
            <thead>
              <tr>
                <th>WO #</th>
                <th>Property</th>
                <th>Title</th>
                <th>Date</th>
                <th>Print</th>
              </tr>
            </thead>
            <tbody>
              {paidOrders.map((wo: WorkOrder, idx: number) => (
                <tr key={idx}>
                  <td data-label="WO #">{wo.number}</td>
                  <td data-label="Property">{wo.propertyName}</td>
                  <td data-label="Title">{wo.title}</td>
                  <td data-label="Date">{wo.scheduledDate || '—'}</td>
                  <td><button style={{ background: '#1a3a7a', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 12px', cursor: 'pointer' }} onClick={() => printPaidInvoice(wo)}>🖨️ Print</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <button style={{ marginTop: 16 }} onClick={() => setPage("home")}>Return to Home</button>
      </div>
    );
  }

  // ── User List ────────────────────────────────────────────────────────────
  if (page === "userlist") {
    const refreshUsers = () => {
      setUsersLoading(true);
      api.fetchUsers().then(setUserList).catch(() => setUserList([])).finally(() => setUsersLoading(false));
    };

    const handleDeleteUser = async (u: UserRecord) => {
      if (!confirm(`Delete user "${u.username}"? This cannot be undone.`)) return;
      await api.deleteUser(u.id);
      refreshUsers();
    };

    const handleSaveUser = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingUser) return;
      setEditUserSaving(true);
      try {
        await api.updateUser(editingUser.id, {
          username: editUserForm.username,
          password: editUserForm.password || undefined,
          userType: editUserForm.userType,
        });
        setEditingUser(null);
        refreshUsers();
      } catch { alert('Save failed.'); }
      finally { setEditUserSaving(false); }
    };

    const userTypeLabel: Record<string, string> = { tech: 'Technician', dispatch: 'Dispatch', mgr: 'Manager', admin: 'Admin' };
    const userTypeBadge: Record<string, string> = { tech: '#0099FF', dispatch: '#ff9900', mgr: '#6c3db5', admin: '#1a3a7a' };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', padding: '1rem', background: '#e8edf8' }}>
        <h1>User List</h1>
        <div style={{ width: '100%', maxWidth: 800 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <label style={{ fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" checked={showPasswords} onChange={e => setShowPasswords(e.target.checked)} />
              Show password hashes
            </label>
            <button onClick={() => setPage('adduser')} style={{ background: '#2a9d2a', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 16px', fontWeight: 700, cursor: 'pointer' }}>+ Add User</button>
          </div>
          {usersLoading ? <p>Loading...</p> : (
            <table className="wo-table" style={{ background: '#fff' }}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Type</th>
                  {showPasswords && <th>Password Hash</th>}
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {userList.map((u: UserRecord) => (
                  <tr key={u.id}>
                    <td data-label="ID">{u.id}</td>
                    <td data-label="Username" style={{ fontWeight: 700 }}>{u.username}</td>
                    <td data-label="Type">
                      <span style={{ background: userTypeBadge[u.user_type] || '#888', color: '#fff', borderRadius: 12, padding: '2px 10px', fontSize: 12, fontWeight: 700 }}>
                        {userTypeLabel[u.user_type] || u.user_type}
                      </span>
                    </td>
                    {showPasswords && <td data-label="Hash" style={{ fontSize: 11, color: '#555', wordBreak: 'break-all', maxWidth: 200 }}>{u.password_hash}</td>}
                    <td data-label="Created" style={{ fontSize: 12 }}>{new Date(u.created_at).toLocaleDateString()}</td>
                    <td style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button style={{ background: '#6c3db5', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }} onClick={() => { setEditingUser(u); setEditUserForm({ username: u.username, password: '', userType: u.user_type || 'tech' }); }}>✏️ Edit</button>
                      {authUser?.userType === 'admin' && (
                        <button style={{ background: '#ff4d4d', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }} onClick={() => handleDeleteUser(u)}>🗑 Delete</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <button style={{ marginTop: 16 }} onClick={() => setPage('home')}>Return to Home</button>
        </div>

        {/* Edit User Modal */}
        {editingUser && (
          <div className="photo-modal">
            <div className="photo-modal-content" style={{ maxWidth: 440 }}>
              <h2>Edit User — {editingUser.username}</h2>
              <form onSubmit={handleSaveUser} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <label style={{ fontWeight: 600, fontSize: 13 }}>
                  Username
                  <input value={editUserForm.username} onChange={e => setEditUserForm(p => ({ ...p, username: e.target.value }))} required style={{ display: 'block', width: '100%', marginTop: 4, padding: '7px 10px', border: '1px solid #aaa', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }} />
                </label>
                <label style={{ fontWeight: 600, fontSize: 13 }}>
                  New Password <span style={{ fontWeight: 400, color: '#888' }}>(leave blank to keep current)</span>
                  <input type="password" value={editUserForm.password} onChange={e => setEditUserForm(p => ({ ...p, password: e.target.value }))} placeholder="Enter new password" style={{ display: 'block', width: '100%', marginTop: 4, padding: '7px 10px', border: '1px solid #aaa', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }} />
                </label>
                <label style={{ fontWeight: 600, fontSize: 13 }}>
                  User Type
                  <select value={editUserForm.userType} onChange={e => setEditUserForm(p => ({ ...p, userType: e.target.value }))} style={{ display: 'block', width: '100%', marginTop: 4, padding: '7px 10px', border: '1px solid #aaa', borderRadius: 6, fontSize: 14 }}>
                    <option value="tech">Technician</option>
                    <option value="dispatch">Dispatch</option>
                    <option value="mgr">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </label>
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <button type="submit" disabled={editUserSaving} style={{ background: '#2a9d2a', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 22px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>{editUserSaving ? 'Saving...' : '✓ Save'}</button>
                  <button type="button" onClick={() => setEditingUser(null)} style={{ background: '#888', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 14, cursor: 'pointer' }}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── System Logs ──────────────────────────────────────────────────────────
  if (page === "systemlogs") {
    if (authUser?.userType !== 'admin') {
      return <div style={{ padding: 40, textAlign: 'center' }}><p>Access denied.</p><button onClick={() => setPage('home')}>Return to Home</button></div>;
    }

    const actionColors: Record<string, string> = {
      login: '#0099FF', create_user: '#2a9d2a', update_user: '#f0a500', delete_user: '#ff4d4d',
      create_property: '#2a9d2a', update_property: '#f0a500', delete_property: '#ff4d4d',
      create_workorder: '#2a9d2a', update_workorder: '#f0a500', delete_workorder: '#ff4d4d',
    };

    const uniqueVals = (field: keyof SystemLog) => Array.from(new Set(systemLogs.map(l => l[field] as string))).filter(Boolean).sort();

    const filtered = systemLogs.filter(l =>
      (!logFilterUser || l.username === logFilterUser) &&
      (!logFilterAction || l.action === logFilterAction) &&
      (!logFilterCategory || l.category === logFilterCategory)
    );

    const sorted = [...filtered].sort((a, b) => {
      const av = a[logSortField] as string;
      const bv = b[logSortField] as string;
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return logSortDir === 'asc' ? cmp : -cmp;
    });

    const SortTh = ({ field, label }: { field: keyof SystemLog; label: string }) => (
      <th
        onClick={() => { if (logSortField === field) setLogSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setLogSortField(field); setLogSortDir('desc'); } }}
        style={{ cursor: 'pointer', userSelect: 'none', background: logSortField === field ? '#d0e8ff' : '#f0f0f0', padding: '8px 10px', border: '1px solid #bbb', whiteSpace: 'nowrap' }}
      >
        {label} {logSortField === field ? (logSortDir === 'asc' ? '▲' : '▼') : ''}
      </th>
    );

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', padding: '1rem', background: '#e8edf8' }}>
        <h1 style={{ marginBottom: 8 }}>System Logs</h1>
        <p style={{ color: '#555', marginBottom: 16, fontSize: 13 }}>{sorted.length} of {systemLogs.length} entries</p>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 18, width: '100%', maxWidth: 1100 }}>
          <label style={{ fontWeight: 600, fontSize: 13 }}>
            User
            <select value={logFilterUser} onChange={e => setLogFilterUser(e.target.value)} style={{ display: 'block', marginTop: 4, padding: '6px 10px', border: '1px solid #aaa', borderRadius: 6, fontSize: 13, minWidth: 130 }}>
              <option value="">All Users</option>
              {uniqueVals('username').map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </label>
          <label style={{ fontWeight: 600, fontSize: 13 }}>
            Action
            <select value={logFilterAction} onChange={e => setLogFilterAction(e.target.value)} style={{ display: 'block', marginTop: 4, padding: '6px 10px', border: '1px solid #aaa', borderRadius: 6, fontSize: 13, minWidth: 160 }}>
              <option value="">All Actions</option>
              {uniqueVals('action').map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </label>
          <label style={{ fontWeight: 600, fontSize: 13 }}>
            Category
            <select value={logFilterCategory} onChange={e => setLogFilterCategory(e.target.value)} style={{ display: 'block', marginTop: 4, padding: '6px 10px', border: '1px solid #aaa', borderRadius: 6, fontSize: 13, minWidth: 130 }}>
              <option value="">All Categories</option>
              {uniqueVals('category').map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </label>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button onClick={() => { setLogFilterUser(''); setLogFilterAction(''); setLogFilterCategory(''); }} style={{ padding: '6px 14px', background: '#888', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>Clear Filters</button>
          </div>
        </div>

        {logsLoading && <p>Loading logs...</p>}
        {!logsLoading && (
          <div style={{ width: '100%', maxWidth: 1100, overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(26,58,122,0.08)' }}>
              <thead>
                <tr>
                  <SortTh field="id" label="#" />
                  <SortTh field="created_at" label="Timestamp" />
                  <SortTh field="username" label="User" />
                  <SortTh field="action" label="Action" />
                  <SortTh field="category" label="Category" />
                  <SortTh field="target" label="Target" />
                  <SortTh field="detail" label="Detail" />
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24, color: '#888' }}>No log entries found.</td></tr>
                )}
                {sorted.map((log, i) => (
                  <tr key={log.id} style={{ background: i % 2 === 0 ? '#f7f9ff' : '#fff' }}>
                    <td style={{ padding: '7px 10px', border: '1px solid #e0e8f0', fontSize: 12, color: '#888' }}>{log.id}</td>
                    <td style={{ padding: '7px 10px', border: '1px solid #e0e8f0', fontSize: 12, whiteSpace: 'nowrap' }}>{new Date(log.created_at).toLocaleString()}</td>
                    <td style={{ padding: '7px 10px', border: '1px solid #e0e8f0', fontWeight: 700, fontSize: 13 }}>{log.username}</td>
                    <td style={{ padding: '7px 10px', border: '1px solid #e0e8f0' }}>
                      <span style={{ background: actionColors[log.action] || '#888', color: '#fff', borderRadius: 12, padding: '2px 10px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>{log.action.replace(/_/g, ' ')}</span>
                    </td>
                    <td style={{ padding: '7px 10px', border: '1px solid #e0e8f0', fontSize: 12, color: '#555' }}>{log.category}</td>
                    <td style={{ padding: '7px 10px', border: '1px solid #e0e8f0', fontSize: 12, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.target}</td>
                    <td style={{ padding: '7px 10px', border: '1px solid #e0e8f0', fontSize: 12, color: '#444' }}>{log.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <button style={{ marginTop: 20 }} onClick={() => setPage('home')}>Return to Home</button>
      </div>
    );
  }

  // ── Add New User ──────────────────────────────────────────────────────────
  if (page === "adduser") {
    const handleAddUser = async (e: React.FormEvent) => {
      e.preventDefault();
      setAddUserSaving(true);
      setAddUserError('');
      try {
        const res = await api.createUser(addUserForm);
        if (res.error) { setAddUserError(res.error); return; }
        setAddUserDone(true);
      } catch { setAddUserError('Failed to create user.'); }
      finally { setAddUserSaving(false); }
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '1rem' }}>
        <h1>Add New User</h1>
        {addUserDone ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#2a9d2a', fontWeight: 700, fontSize: 16 }}>✓ User created successfully!</p>
            <button onClick={() => { setAddUserDone(false); setAddUserForm({ username: '', password: '', userType: 'tech' }); }}>Add Another</button>
            <button style={{ marginLeft: 10 }} onClick={() => setPage('userlist')}>View User List</button>
            <button style={{ marginLeft: 10 }} onClick={() => setPage('home')}>Return to Home</button>
          </div>
        ) : (
          <form onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 440, width: '100%', background: '#fff', border: '1px solid #b0c0e0', borderRadius: 10, padding: 28, boxShadow: '0 2px 8px rgba(26,58,122,0.08)' }}>
            {addUserError && <p style={{ color: '#ff4d4d', fontWeight: 600, margin: 0 }}>{addUserError}</p>}
            <label style={{ fontWeight: 600, fontSize: 13 }}>
              Username
              <input value={addUserForm.username} onChange={e => setAddUserForm(p => ({ ...p, username: e.target.value }))} required placeholder="e.g. jsmith" style={{ display: 'block', width: '100%', marginTop: 4, padding: '7px 10px', border: '1px solid #aaa', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }} />
            </label>
            <label style={{ fontWeight: 600, fontSize: 13 }}>
              Password
              <input type="password" value={addUserForm.password} onChange={e => setAddUserForm(p => ({ ...p, password: e.target.value }))} required placeholder="Min 4 characters" style={{ display: 'block', width: '100%', marginTop: 4, padding: '7px 10px', border: '1px solid #aaa', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }} />
            </label>
            <label style={{ fontWeight: 600, fontSize: 13 }}>
              User Type
              <select value={addUserForm.userType} onChange={e => setAddUserForm(p => ({ ...p, userType: e.target.value }))} style={{ display: 'block', width: '100%', marginTop: 4, padding: '7px 10px', border: '1px solid #aaa', borderRadius: 6, fontSize: 14 }}>
                <option value="tech">Technician</option>
                <option value="dispatch">Dispatch</option>
                <option value="mgr">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <button type="submit" disabled={addUserSaving} style={{ background: '#1a3a7a', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 24px', fontWeight: 700, fontSize: 15, cursor: 'pointer', marginTop: 4 }}>{addUserSaving ? 'Creating...' : '+ Create User'}</button>
            <button type="button" onClick={() => setPage('home')} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 13, textDecoration: 'underline' }}>Return to Home</button>
          </form>
        )}
      </div>
    );
  }

  // Main dashboard/homepage UI
  // ── Tech mobile dashboard ──────────────────────────────
  if (authUser.userType === 'tech' || (authUser.userType === 'mgr' && mgrViewMode === 'tech')) {
    const rawActive = workOrders.filter(wo => wo.status === 'active');
    const activeOrders = (authUser.userType === 'tech' && techWOFilter === 'assigned')
      ? rawActive.filter(wo => wo.assignedTo === authUser.username)
      : rawActive;
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100%', display: 'flex', flexDirection: 'column', background: '#e8edf8', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', background: '#fff', boxShadow: '0 2px 6px rgba(26,58,122,0.10)', flexShrink: 0, zIndex: 10 }}>
          <button onClick={() => setPage('home')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
            <img src="/logo.png" alt="Home" style={{ height: 40, objectFit: 'contain', display: 'block' }} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
            <button onClick={() => setPage('property')} style={{ background: '#1a3a7a', color: '#fff', border: 'none', borderRadius: 20, padding: '6px 14px', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
              <svg width="15" height="15" viewBox="0 0 20 20" fill="none"><path d="M10 2L2 8.5h2V17h5v-5h2v5h5V8.5h2L10 2z" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round"/><line x1="15" y1="3" x2="15" y2="6.5" stroke="#6fdd6f" strokeWidth="2" strokeLinecap="round"/><line x1="13.2" y1="4.75" x2="16.8" y2="4.75" stroke="#6fdd6f" strokeWidth="2" strokeLinecap="round"/></svg>
              +
            </button>
            <button onClick={() => setPage('createpurchase')} style={{ background: '#1a3a7a', color: '#fff', border: 'none', borderRadius: 20, padding: '6px 14px', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
              <svg width="15" height="15" viewBox="0 0 20 20" fill="none"><rect x="4" y="2" width="12" height="16" rx="2" stroke="#fff" strokeWidth="1.8"/><line x1="7" y1="7" x2="13" y2="7" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/><line x1="7" y1="10" x2="13" y2="10" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/><line x1="7" y1="13" x2="10" y2="13" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/><text x="13" y="7.5" style={{fontSize:6,fontWeight:900,fill:'#6fdd6f',dominantBaseline:'middle',textAnchor:'middle'}}>$</text></svg>
              $
            </button>
            {(authUser.userType as string) === 'mgr' && (
              <button onClick={() => { setMgrViewMode('dash'); setPage('home'); }}
                style={{ background: '#e8f0fe', color: '#1a3a7a', border: '1px solid #c0d0f0', borderRadius: 20, padding: '5px 14px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                🖥️ Dash View
              </button>
            )}
            <div style={{ width: 1, height: 28, background: 'rgba(26,58,122,0.15)', margin: '0 4px' }} />
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowLogout(v => !v)}
                style={{ background: '#1a3a7a', color: '#fff', border: 'none', borderRadius: 20, padding: '6px 16px', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="7" r="4" fill="#fff"/><path d="M2 18c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round"/></svg>
                {authUser.username} <span style={{ fontSize: 10, opacity: 0.7, marginLeft: 2 }}>▼</span>
              </button>
              {showLogout && (
                <div style={{ position: 'absolute', right: 0, top: '110%', background: '#fff', border: '1px solid #d0d8f0', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 200, minWidth: 180, padding: 8 }}
                  onClick={() => setShowLogout(false)}>
                  {techDashStyle === 'dropdown' && (
                    <>
                      <button onClick={() => setPage('workorder')} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', borderRadius: 6, padding: '9px 12px', fontWeight: 600, fontSize: 14, cursor: 'pointer', color: '#1a3a7a' }}>📋 New Work Order</button>
                      <button onClick={() => setPage('workorderlistdraft')} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', borderRadius: 6, padding: '9px 12px', fontWeight: 600, fontSize: 14, cursor: 'pointer', color: '#1a3a7a' }}>📂 Drafts</button>
                      <button onClick={() => setPage('completedworkorders')} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', borderRadius: 6, padding: '9px 12px', fontWeight: 600, fontSize: 14, cursor: 'pointer', color: '#2a9d2a' }}>✓ Completed</button>
                      <div style={{ borderTop: '1px solid #eee', margin: '4px 0' }} />
                    </>
                  )}
                  <button onClick={() => setPage('settingspersonal')} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', borderRadius: 6, padding: '9px 12px', fontWeight: 600, fontSize: 14, cursor: 'pointer', color: '#555' }}>⚙️ Settings</button>
                  {(authUser.userType as string) === 'mgr' && (
                    <>
                      <div style={{ borderTop: '1px solid #eee', margin: '4px 0' }} />
                      <button onClick={() => setPage('invoicelist')} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', borderRadius: 6, padding: '9px 12px', fontWeight: 600, fontSize: 14, cursor: 'pointer', color: '#e67e22' }}>🧾 Invoice List</button>
                      <button onClick={() => setPage('closedworkorders')} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', borderRadius: 6, padding: '9px 12px', fontWeight: 600, fontSize: 14, cursor: 'pointer', color: '#888' }}>📁 Closed WOs</button>
                    </>
                  )}
                  <div style={{ borderTop: '1px solid #eee', margin: '4px 0' }} />
                  <button onClick={handleLogout} style={{ width: '100%', background: '#ff4d4d', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 0', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Logout</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Active WO cards — scrollable center */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 6px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '0 0 4px' }}>
            <h2 style={{ margin: 0, fontSize: 16, color: '#1a3a7a', fontWeight: 700 }}>Active Work Orders</h2>
            {authUser.userType === 'tech' && (
              <span onClick={() => setTechWOFilter(techWOFilter === 'assigned' ? 'all' : 'assigned')}
                style={{ fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 10, cursor: 'pointer',
                  background: techWOFilter === 'assigned' ? '#1a3a7a' : '#e0e0e0',
                  color: techWOFilter === 'assigned' ? '#fff' : '#555' }}>
                {techWOFilter === 'assigned' ? '👤 Mine' : '🌐 All'}
              </span>
            )}
          </div>
          {activeOrders.length === 0 && (
            <div style={{ background: '#fff', borderRadius: 12, padding: '28px 20px', textAlign: 'center', color: '#888', boxShadow: '0 2px 6px rgba(26,58,122,0.07)' }}>
              No active work orders.
            </div>
          )}
          {activeOrders.map(wo => (
            <div
              key={wo.number}
              onClick={() => openWODetail(wo, 'home')}
              style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', boxShadow: '0 2px 8px rgba(26,58,122,0.09)', cursor: 'pointer', borderLeft: '4px solid #0099FF', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#1a3a7a', marginBottom: 2 }}>{wo.number}</div>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#222', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{wo.title}</div>
                <div style={{ fontSize: 12, color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{wo.propertyName}</div>
                {wo.scheduledDate && <div style={{ fontSize: 11, color: '#999', marginTop: 3 }}>{wo.scheduledDate}{wo.scheduledTime ? ' @ ' + wo.scheduledTime : ''}</div>}
              </div>
              <button
                onClick={e => { e.stopPropagation(); completeWorkOrder(wo.number); }}
                style={{ background: '#2a9d2a', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 14px', cursor: 'pointer', fontWeight: 700, fontSize: 18, flexShrink: 0 }}
                title="Mark Complete"
              >✓</button>
            </div>
          ))}
        </div>

        {/* Bottom nav bar */}
        <div style={{ display: 'flex', background: '#fff', boxShadow: '0 -2px 10px rgba(26,58,122,0.10)', flexShrink: 0, zIndex: 10 }}>
          {techDashStyle === 'classic' && (
            <>
              {[
                { icon: <svg width="26" height="26" viewBox="0 0 26 26" fill="none"><line x1="13" y1="4" x2="13" y2="22" stroke="#1a3a7a" strokeWidth="2.5" strokeLinecap="round"/><line x1="4" y1="13" x2="22" y2="13" stroke="#1a3a7a" strokeWidth="2.5" strokeLinecap="round"/></svg>, label: 'New WO', action: () => setPage('workorder') },
                { icon: <svg width="26" height="26" viewBox="0 0 26 26" fill="none"><path d="M5 21L21 5" stroke="#1a3a7a" strokeWidth="2.5" strokeLinecap="round"/><path d="M13 5h8v8" stroke="#1a3a7a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>, label: 'Drafts', action: () => setPage('workorderlistdraft') },
                { icon: <svg width="26" height="26" viewBox="0 0 26 26" fill="none"><rect x="4" y="5" width="18" height="16" rx="3" stroke="#1a3a7a" strokeWidth="2"/><line x1="8" y1="10" x2="18" y2="10" stroke="#1a3a7a" strokeWidth="1.8" strokeLinecap="round"/><line x1="8" y1="14" x2="18" y2="14" stroke="#1a3a7a" strokeWidth="1.8" strokeLinecap="round"/><line x1="8" y1="18" x2="14" y2="18" stroke="#1a3a7a" strokeWidth="1.8" strokeLinecap="round"/></svg>, label: 'Active', action: () => setPage('workorderlist') },
                { icon: <svg width="26" height="26" viewBox="0 0 26 26" fill="none"><path d="M4 13l6 6L22 7" stroke="#2a9d2a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>, label: 'Done', action: () => setPage('completedworkorders') },
              ].map(({ icon, label, action }) => (
                <button key={label} onClick={action} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px 0 8px', background: 'none', border: 'none', cursor: 'pointer', gap: 3 }}>
                  {icon}
                  <span style={{ fontSize: 10, color: '#555', fontWeight: 600 }}>{label}</span>
                </button>
              ))}
            </>
          )}
          {techDashStyle === 'dropdown' && (
            <button onClick={() => setPage('workorderlist')} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px 0 8px', background: 'none', border: 'none', cursor: 'pointer', gap: 3 }}>
              <svg width="26" height="26" viewBox="0 0 26 26" fill="none"><rect x="4" y="5" width="18" height="16" rx="3" stroke="#1a3a7a" strokeWidth="2"/><line x1="8" y1="10" x2="18" y2="10" stroke="#1a3a7a" strokeWidth="1.8" strokeLinecap="round"/><line x1="8" y1="14" x2="18" y2="14" stroke="#1a3a7a" strokeWidth="1.8" strokeLinecap="round"/><line x1="8" y1="18" x2="14" y2="18" stroke="#1a3a7a" strokeWidth="1.8" strokeLinecap="round"/></svg>
              <span style={{ fontSize: 10, color: '#555', fontWeight: 600 }}>Active WOs</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Main dashboard/homepage UI (non-tech)
  const addNewItems: { label: string; page: string; role?: string[] }[] = [
    { label: 'Create a Property', page: 'property' },
    { label: 'Create a Vendor', page: 'vendor' },
    { label: 'Create a Purchase', page: 'createpurchase' },
    { label: 'Create Inventory Item', page: 'createinventoryitem' },
    { label: 'Create Inventory Category', page: 'createinventorycategory' },
    { label: 'Add New User', page: 'adduser', role: ['mgr', 'admin'] },
  ];

  const listItems: { label: string; page: string; role?: string[] }[] = [
    { label: 'Property List', page: 'propertylist' },
    { label: 'Vendor List', page: 'vendorlist' },
    { label: 'Purchase List', page: 'purchaselist' },
    { label: 'Inventory List', page: 'inventorylist' },
    { label: 'User List', page: 'userlist', role: ['mgr', 'admin'] },
    { label: 'System Logs', page: 'systemlogs', role: ['admin'] },
  ];

  const billingDirectItems = [
    { label: 'Closed Work Orders', page: 'closedworkorders' },
    { label: 'Invoice List', page: 'invoicelist' },
  ];
  const billingArchiveItems = [
    { label: 'Deleted Work Orders', page: 'deletedworkorders' },
    { label: 'Paid Invoices', page: 'paidinvoices' },
  ];

  const woItems = [
    { label: 'Create an Estimate', page: 'createestimate' },
    { label: 'Estimate List', page: 'estimatelist' },
    { label: 'Create a Work Order', page: 'workorder' },
    { label: 'Draft Work Orders', page: 'workorderlistdraft' },
    { label: 'Active Work Orders', page: 'workorderlist' },
    { label: 'Completed Work Orders', page: 'completedworkorders' },
  ];

  const allTimeWOs = workOrders.length;
  const activeWOs = workOrders.filter(w => w.status === 'active').length;
  const completedWOs = workOrders.filter(w => w.status === 'completed').length;
  const closedWOs = workOrders.filter(w => w.status === 'closed').length;
  const invoicedWOs = workOrders.filter(w => w.status === 'invoiced' || w.status === 'sent' || w.status === 'nocharge').length;
  const draftWOs = workOrders.filter(w => w.status === 'draft').length;

  // KPI range filter helpers
  const kpiRangeStart = (() => {
    const now = new Date();
    if (kpiRange === 'day') return now.toISOString().slice(0,10);
    if (kpiRange === 'week') { const d = new Date(now); d.setDate(d.getDate() - d.getDay()); return d.toISOString().slice(0,10); }
    if (kpiRange === 'month') return now.toISOString().slice(0,7) + '-01';
    if (kpiRange === 'year') return now.getFullYear() + '-01-01';
    return null;
  })();
  const filterByRange = (wos: typeof workOrders) =>
    kpiRangeStart ? wos.filter(w => (w.scheduledDate || '') >= kpiRangeStart) : wos;
  const rangedTotal = filterByRange(workOrders).length;
  const rangedDraft = filterByRange(workOrders.filter(w => w.status === 'draft')).length;

  const dateStr = clockTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = clockTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });

  const dropdownStyle: React.CSSProperties = {
    position: 'absolute', top: '100%', left: 0,
    background: '#fff', border: '1px solid #d0d8f0', borderRadius: 8,
    boxShadow: '0 6px 24px rgba(0,0,0,0.14)', minWidth: 200, padding: '6px 0', zIndex: 200,
  };
  const menuBtnStyle = (active: boolean): React.CSSProperties => ({
    background: active ? 'rgba(255,255,255,0.18)' : 'none',
    border: 'none', color: '#fff', padding: '8px 16px', borderRadius: 6,
    cursor: 'pointer', fontWeight: 600, fontSize: 14,
    display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
  });
  const dropItemStyle: React.CSSProperties = {
    display: 'block', width: '100%', textAlign: 'left', background: 'none',
    border: 'none', padding: '9px 18px', cursor: 'pointer', fontSize: 14,
    color: '#1a3a7a', fontWeight: 500,
  };

  return (
    <div style={{ minHeight: '100vh', background: '#e8edf8' }} onClick={() => { setHomeMenu(null); setHomeSubMenu(null); }}>
      {/* Top Nav Bar */}
      <div style={{ background: '#1a3a7a', boxShadow: '0 2px 8px rgba(0,0,0,0.18)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', alignItems: 'center', padding: '0 12px', height: 56, gap: 4 }}>
          {/* Logo top-left */}
          <button onClick={() => { setHomeMenu(null); setHomeSubMenu(null); setPage('home'); setMobileMenuOpen(false); }} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', marginRight: 20, flexShrink: 0 }}>
            <img src="/logo.png" alt="Home" style={{ height: 44, objectFit: 'contain', display: 'block' }} />
          </button>

          {/* ── Desktop Nav Items (hidden on mobile) ── */}
          {!isMobile && (<>

          {/* ── Add New ── */}
          <div style={{ position: 'relative' }}>
            <button style={menuBtnStyle(homeMenu === 'lists')} onClick={e => { e.stopPropagation(); setHomeMenu(homeMenu === 'lists' ? null : 'lists'); setHomeSubMenu(null); }}>
              Add New <span style={{ fontSize: 10, opacity: 0.7 }}>{homeMenu === 'lists' ? '▲' : '▼'}</span>
            </button>
            {homeMenu === 'lists' && (
              <div style={dropdownStyle} onClick={e => e.stopPropagation()}>
                {addNewItems
                  .filter(item => !item.role || item.role.includes(authUser.userType))
                  .map(item => (
                    <button key={item.page} style={dropItemStyle}
                      onClick={() => { setPage(item.page); setHomeMenu(null); setHomeSubMenu(null); }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#f0f4ff')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >{item.label}</button>
                  ))}
              </div>
            )}
          </div>

          {/* ── Work Orders ── */}
          <div style={{ position: 'relative' }}>
            <button style={menuBtnStyle(homeMenu === 'wo')} onClick={e => { e.stopPropagation(); setHomeMenu(homeMenu === 'wo' ? null : 'wo'); setHomeSubMenu(null); }}>
              Work Orders <span style={{ fontSize: 10, opacity: 0.7 }}>{homeMenu === 'wo' ? '▲' : '▼'}</span>
            </button>
            {homeMenu === 'wo' && (
              <div style={dropdownStyle} onClick={e => e.stopPropagation()}>
                {woItems.map(item => (
                  <button key={item.page} style={dropItemStyle}
                    onClick={() => { setPage(item.page); setHomeMenu(null); }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f0f4ff')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  >{item.label}</button>
                ))}
              </div>
            )}
          </div>

          {/* ── Billing ── */}
          <div style={{ position: 'relative' }}>
            <button style={menuBtnStyle(homeMenu === 'billing')} onClick={e => { e.stopPropagation(); setHomeMenu(homeMenu === 'billing' ? null : 'billing'); setHomeSubMenu(null); }}>
              Billing <span style={{ fontSize: 10, opacity: 0.7 }}>{homeMenu === 'billing' ? '▲' : '▼'}</span>
            </button>
            {homeMenu === 'billing' && (
              <div style={dropdownStyle} onClick={e => e.stopPropagation()}>
                {billingDirectItems.map(item => (
                  <button key={item.page} style={dropItemStyle}
                    onClick={() => { setPage(item.page); setHomeMenu(null); setHomeSubMenu(null); }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f0f4ff')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  >{item.label}</button>
                ))}
                {/* Archive submenu */}
                <div style={{ position: 'relative' }}
                  onMouseEnter={() => setHomeSubMenu('billingArchive')}
                  onMouseLeave={() => setHomeSubMenu(null)}
                >
                  <button style={{ ...dropItemStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: homeSubMenu === 'billingArchive' ? '#f0f4ff' : 'none', width: '100%' }}>
                    Archive <span style={{ opacity: 0.5, fontSize: 11 }}>▶</span>
                  </button>
                  {homeSubMenu === 'billingArchive' && (
                    <div style={{ ...dropdownStyle, left: '100%', top: 0 }}>
                      {billingArchiveItems.map(item => (
                        <button key={item.page} style={dropItemStyle}
                          onClick={() => { setPage(item.page); setHomeMenu(null); setHomeSubMenu(null); }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#f0f4ff')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                        >{item.label}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Team ── */}
          {(authUser.userType === 'admin' || authUser.userType === 'mgr') && (
            <div style={{ position: 'relative' }}>
              <button style={menuBtnStyle(homeMenu === 'team')} onClick={e => { e.stopPropagation(); setHomeMenu(homeMenu === 'team' ? null : 'team'); setHomeSubMenu(null); }}>
                Team <span style={{ fontSize: 10, opacity: 0.7 }}>{homeMenu === 'team' ? '▲' : '▼'}</span>
              </button>
              {homeMenu === 'team' && (
                <div style={dropdownStyle} onClick={e => e.stopPropagation()}>
                  {[
                    { label: 'Team Info', page: 'teaminfo' },
                    { label: 'Payroll', page: 'payroll' },
                    { label: 'Submit Day Off', page: 'submitdayoff' },
                  ].map(item => (
                    <button key={item.page} style={dropItemStyle}
                      onClick={() => { setPage(item.page); setHomeMenu(null); setHomeSubMenu(null); }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#f0f4ff')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >{item.label}</button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Scheduled Services ── */}
          <div style={{ position: 'relative' }}>
            <button style={menuBtnStyle(homeMenu === 'scheduled')} onClick={e => { e.stopPropagation(); setHomeMenu(homeMenu === 'scheduled' ? null : 'scheduled'); setHomeSubMenu(null); }}>
              Recurring <span style={{ fontSize: 10, opacity: 0.7 }}>{homeMenu === 'scheduled' ? '▲' : '▼'}</span>
            </button>
            {homeMenu === 'scheduled' && (
              <div style={dropdownStyle} onClick={e => e.stopPropagation()}>
                {[
                  { label: 'Recurring Work Orders', page: 'recurringworkorders' },
                  { label: 'Internal Services', page: 'internalservices' },
                ].map(item => (
                  <button key={item.page} style={dropItemStyle}
                    onClick={() => { setPage(item.page); setHomeMenu(null); setHomeSubMenu(null); }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f0f4ff')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  >{item.label}</button>
                ))}
              </div>
            )}
          </div>

          {/* ── Reports ── */}
          <div style={{ position: 'relative' }}>
            <button style={menuBtnStyle(homeMenu === 'reports')} onClick={e => { e.stopPropagation(); setHomeMenu(homeMenu === 'reports' ? null : 'reports'); setHomeSubMenu(null); }}>
              Reports <span style={{ fontSize: 10, opacity: 0.7 }}>{homeMenu === 'reports' ? '▲' : '▼'}</span>
            </button>
            {homeMenu === 'reports' && (
              <div style={dropdownStyle} onClick={e => e.stopPropagation()}>
                {[
                  { label: 'Revenue Report', page: 'reportrevenue' },
                  { label: 'Work Order Report', page: 'reportworkorders' },
                  { label: 'Tech Productivity', page: 'reporttechproductivity' },
                  { label: 'Expense Summary', page: 'reportexpenses' },
                ].map(item => (
                  <button key={item.page} style={dropItemStyle}
                    onClick={() => { setPage(item.page); setHomeMenu(null); setHomeSubMenu(null); }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f0f4ff')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  >{item.label}</button>
                ))}
                <div style={{ borderTop: '1px solid #e8edf8', margin: '4px 0' }} />
                {/* Lists flyout */}
                <div style={{ position: 'relative' }}
                  onMouseEnter={() => setHomeSubMenu('reportLists')}
                  onMouseLeave={() => setHomeSubMenu(null)}
                >
                  <button style={{ ...dropItemStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: homeSubMenu === 'reportLists' ? '#f0f4ff' : 'none', width: '100%' }}>
                    Lists <span style={{ opacity: 0.5, fontSize: 11 }}>▶</span>
                  </button>
                  {homeSubMenu === 'reportLists' && (
                    <div style={{ ...dropdownStyle, left: '100%', top: 0 }}>
                      {listItems
                        .filter(item => !item.role || item.role.includes(authUser.userType))
                        .map(item => (
                          <button key={item.page} style={dropItemStyle}
                            onClick={() => { setPage(item.page); setHomeMenu(null); setHomeSubMenu(null); }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#f0f4ff')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                          >{item.label}</button>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Settings ── */}
          <div style={{ position: 'relative' }}>
            <button style={menuBtnStyle(homeMenu === 'settings')} onClick={e => { e.stopPropagation(); setHomeMenu(homeMenu === 'settings' ? null : 'settings'); setHomeSubMenu(null); }}>
              Settings <span style={{ fontSize: 10, opacity: 0.7 }}>{homeMenu === 'settings' ? '▲' : '▼'}</span>
            </button>
            {homeMenu === 'settings' && (
              <div style={dropdownStyle} onClick={e => e.stopPropagation()}>
                {/* Company Settings flyout — admin/mgr only */}
                {(authUser.userType === 'admin' || authUser.userType === 'mgr') && (
                  <div style={{ position: 'relative' }}
                    onMouseEnter={() => setHomeSubMenu('companySettings')}
                    onMouseLeave={() => setHomeSubMenu(null)}
                  >
                    <button style={{ ...dropItemStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: homeSubMenu === 'companySettings' ? '#f0f4ff' : 'none', width: '100%' }}>
                      🏢 Company Settings <span style={{ opacity: 0.5, fontSize: 11 }}>▶</span>
                    </button>
                    {homeSubMenu === 'companySettings' && (
                      <div style={{ ...dropdownStyle, left: '100%', top: 0 }}>
                        {[
                          { label: 'Company Info', page: 'settingscompany' },
                          { label: 'Tax & Fees', page: 'settingstaxfees' },
                          { label: 'Markup & Pricing', page: 'settingspricing' },
                          { label: 'Pay Period Config', page: 'settingspayperiod' },
                          { label: 'User Management', page: 'userlist' },
                          { label: 'Audit Log', page: 'systemlogs' },
                        ].map(item => (
                          <button key={item.page} style={dropItemStyle}
                            onClick={() => { setPage(item.page); setHomeMenu(null); setHomeSubMenu(null); }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#f0f4ff')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                          >{item.label}</button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {/* Personal Settings — all users */}
                <div style={{ position: 'relative' }}
                  onMouseEnter={() => setHomeSubMenu('personalSettings')}
                  onMouseLeave={() => setHomeSubMenu(null)}
                >
                  <button style={{ ...dropItemStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: homeSubMenu === 'personalSettings' ? '#f0f4ff' : 'none', width: '100%' }}>
                    👤 Personal Settings <span style={{ opacity: 0.5, fontSize: 11 }}>▶</span>
                  </button>
                  {homeSubMenu === 'personalSettings' && (
                    <div style={{ ...dropdownStyle, left: '100%', top: 0 }}>
                      {[
                        { label: 'Account & Password', page: 'settingspersonal' },
                      ].map(item => (
                        <button key={item.page} style={dropItemStyle}
                          onClick={() => { setPage(item.page); setHomeMenu(null); setHomeSubMenu(null); }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#f0f4ff')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                        >{item.label}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          </>)} {/* end desktop nav */}

          {/* User / Logout — desktop only */}
          {!isMobile && (<div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>)
            {authUser.userType === 'mgr' && (
              <button onClick={() => setMgrViewMode('tech')}
                style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.35)', borderRadius: 20, padding: '5px 14px', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                📱 Tech View
              </button>
            )}
            <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>{authUser.username}</span>
            <button onClick={handleLogout} style={{ background: '#ff4d4d', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Logout</button>
          </div>)}
          {/* Mobile hamburger */}
          {isMobile && (
            <button onClick={e => { e.stopPropagation(); setMobileMenuOpen(o => !o); setMobileOpenSection(null); setMobileOpenSubSection(null); }}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#fff', fontSize: 28, lineHeight: 1, cursor: 'pointer', padding: '0 10px', flexShrink: 0 }}>
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          )}
        </div>
      </div>

      {/* ── Mobile Menu Overlay ── */}
      {isMobile && mobileMenuOpen && (
        <div style={{ position: 'fixed', top: 56, left: 0, right: 0, bottom: 0, background: '#fff', zIndex: 499, overflowY: 'auto' }}
          onClick={e => e.stopPropagation()}>
          <div style={{ padding: '12px 20px', borderBottom: '2px solid #e8edf8', color: '#666', fontSize: 13 }}>
            Logged in as <strong style={{ color: '#1a3a7a' }}>{authUser.username}</strong>
          </div>
          {/* Add New */}
          <div style={{ borderBottom: '1px solid #e8edf8' }}>
            <button onClick={() => setMobileOpenSection(mobileOpenSection === 'addnew' ? null : 'addnew')}
              style={{ width: '100%', background: 'none', border: 'none', padding: '14px 20px', textAlign: 'left', fontSize: 16, fontWeight: 700, color: '#1a3a7a', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              Add New <span style={{ opacity: 0.5 }}>{mobileOpenSection === 'addnew' ? '▲' : '▼'}</span>
            </button>
            {mobileOpenSection === 'addnew' && (
              <div style={{ background: '#f8f9ff', paddingBottom: 8 }}>
                {addNewItems.filter(i => !i.role || i.role.includes(authUser.userType)).map(item => (
                  <button key={item.page} onClick={() => { setPage(item.page); setMobileMenuOpen(false); setMobileOpenSection(null); }}
                    style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '11px 36px', fontSize: 15, color: '#1a3a7a', cursor: 'pointer', fontWeight: 500 }}>
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Work Orders */}
          <div style={{ borderBottom: '1px solid #e8edf8' }}>
            <button onClick={() => setMobileOpenSection(mobileOpenSection === 'wo' ? null : 'wo')}
              style={{ width: '100%', background: 'none', border: 'none', padding: '14px 20px', textAlign: 'left', fontSize: 16, fontWeight: 700, color: '#1a3a7a', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              Work Orders <span style={{ opacity: 0.5 }}>{mobileOpenSection === 'wo' ? '▲' : '▼'}</span>
            </button>
            {mobileOpenSection === 'wo' && (
              <div style={{ background: '#f8f9ff', paddingBottom: 8 }}>
                {woItems.map(item => (
                  <button key={item.page} onClick={() => { setPage(item.page); setMobileMenuOpen(false); setMobileOpenSection(null); }}
                    style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '11px 36px', fontSize: 15, color: '#1a3a7a', cursor: 'pointer', fontWeight: 500 }}>
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Billing */}
          <div style={{ borderBottom: '1px solid #e8edf8' }}>
            <button onClick={() => setMobileOpenSection(mobileOpenSection === 'billing' ? null : 'billing')}
              style={{ width: '100%', background: 'none', border: 'none', padding: '14px 20px', textAlign: 'left', fontSize: 16, fontWeight: 700, color: '#1a3a7a', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              Billing <span style={{ opacity: 0.5 }}>{mobileOpenSection === 'billing' ? '▲' : '▼'}</span>
            </button>
            {mobileOpenSection === 'billing' && (
              <div style={{ background: '#f8f9ff', paddingBottom: 8 }}>
                {billingDirectItems.map(item => (
                  <button key={item.page} onClick={() => { setPage(item.page); setMobileMenuOpen(false); setMobileOpenSection(null); }}
                    style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '11px 36px', fontSize: 15, color: '#1a3a7a', cursor: 'pointer', fontWeight: 500 }}>
                    {item.label}
                  </button>
                ))}
                <button onClick={() => setMobileOpenSubSection(mobileOpenSubSection === 'billing-archive' ? null : 'billing-archive')}
                  style={{ display: 'flex', width: '100%', justifyContent: 'space-between', background: 'none', border: 'none', padding: '11px 36px', fontSize: 15, color: '#555', cursor: 'pointer', fontWeight: 600 }}>
                  Archive <span style={{ opacity: 0.5 }}>{mobileOpenSubSection === 'billing-archive' ? '▲' : '▼'}</span>
                </button>
                {mobileOpenSubSection === 'billing-archive' && billingArchiveItems.map(item => (
                  <button key={item.page} onClick={() => { setPage(item.page); setMobileMenuOpen(false); setMobileOpenSection(null); setMobileOpenSubSection(null); }}
                    style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '11px 52px', fontSize: 14, color: '#1a3a7a', cursor: 'pointer', fontWeight: 500 }}>
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Team */}
          {(authUser.userType === 'admin' || authUser.userType === 'mgr') && (
            <div style={{ borderBottom: '1px solid #e8edf8' }}>
              <button onClick={() => setMobileOpenSection(mobileOpenSection === 'team' ? null : 'team')}
                style={{ width: '100%', background: 'none', border: 'none', padding: '14px 20px', textAlign: 'left', fontSize: 16, fontWeight: 700, color: '#1a3a7a', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Team <span style={{ opacity: 0.5 }}>{mobileOpenSection === 'team' ? '▲' : '▼'}</span>
              </button>
              {mobileOpenSection === 'team' && (
                <div style={{ background: '#f8f9ff', paddingBottom: 8 }}>
                  {[{ label: 'Team Info', page: 'teaminfo' }, { label: 'Payroll', page: 'payroll' }, { label: 'Submit Day Off', page: 'submitdayoff' }].map(item => (
                    <button key={item.page} onClick={() => { setPage(item.page); setMobileMenuOpen(false); setMobileOpenSection(null); }}
                      style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '11px 36px', fontSize: 15, color: '#1a3a7a', cursor: 'pointer', fontWeight: 500 }}>
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {/* Recurring */}
          <div style={{ borderBottom: '1px solid #e8edf8' }}>
            <button onClick={() => setMobileOpenSection(mobileOpenSection === 'recurring' ? null : 'recurring')}
              style={{ width: '100%', background: 'none', border: 'none', padding: '14px 20px', textAlign: 'left', fontSize: 16, fontWeight: 700, color: '#1a3a7a', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              Recurring <span style={{ opacity: 0.5 }}>{mobileOpenSection === 'recurring' ? '▲' : '▼'}</span>
            </button>
            {mobileOpenSection === 'recurring' && (
              <div style={{ background: '#f8f9ff', paddingBottom: 8 }}>
                {[{ label: 'Recurring Work Orders', page: 'recurringworkorders' }, { label: 'Internal Services', page: 'internalservices' }].map(item => (
                  <button key={item.page} onClick={() => { setPage(item.page); setMobileMenuOpen(false); setMobileOpenSection(null); }}
                    style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '11px 36px', fontSize: 15, color: '#1a3a7a', cursor: 'pointer', fontWeight: 500 }}>
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Reports */}
          <div style={{ borderBottom: '1px solid #e8edf8' }}>
            <button onClick={() => setMobileOpenSection(mobileOpenSection === 'reports' ? null : 'reports')}
              style={{ width: '100%', background: 'none', border: 'none', padding: '14px 20px', textAlign: 'left', fontSize: 16, fontWeight: 700, color: '#1a3a7a', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              Reports <span style={{ opacity: 0.5 }}>{mobileOpenSection === 'reports' ? '▲' : '▼'}</span>
            </button>
            {mobileOpenSection === 'reports' && (
              <div style={{ background: '#f8f9ff', paddingBottom: 8 }}>
                {[
                  { label: 'Revenue Report', page: 'reportrevenue' },
                  { label: 'Work Order Report', page: 'reportworkorders' },
                  { label: 'Tech Productivity', page: 'reporttechproductivity' },
                  { label: 'Expense Summary', page: 'reportexpenses' },
                ].map(item => (
                  <button key={item.page} onClick={() => { setPage(item.page); setMobileMenuOpen(false); setMobileOpenSection(null); }}
                    style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '11px 36px', fontSize: 15, color: '#1a3a7a', cursor: 'pointer', fontWeight: 500 }}>
                    {item.label}
                  </button>
                ))}
                <button onClick={() => setMobileOpenSubSection(mobileOpenSubSection === 'report-lists' ? null : 'report-lists')}
                  style={{ display: 'flex', width: '100%', justifyContent: 'space-between', background: 'none', border: 'none', padding: '11px 36px', fontSize: 15, color: '#555', cursor: 'pointer', fontWeight: 600 }}>
                  Lists <span style={{ opacity: 0.5 }}>{mobileOpenSubSection === 'report-lists' ? '▲' : '▼'}</span>
                </button>
                {mobileOpenSubSection === 'report-lists' && listItems.filter(i => !i.role || i.role.includes(authUser.userType)).map(item => (
                  <button key={item.page} onClick={() => { setPage(item.page); setMobileMenuOpen(false); setMobileOpenSection(null); setMobileOpenSubSection(null); }}
                    style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '11px 52px', fontSize: 14, color: '#1a3a7a', cursor: 'pointer', fontWeight: 500 }}>
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Settings */}
          <div style={{ borderBottom: '1px solid #e8edf8' }}>
            <button onClick={() => setMobileOpenSection(mobileOpenSection === 'settings' ? null : 'settings')}
              style={{ width: '100%', background: 'none', border: 'none', padding: '14px 20px', textAlign: 'left', fontSize: 16, fontWeight: 700, color: '#1a3a7a', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              Settings <span style={{ opacity: 0.5 }}>{mobileOpenSection === 'settings' ? '▲' : '▼'}</span>
            </button>
            {mobileOpenSection === 'settings' && (
              <div style={{ background: '#f8f9ff', paddingBottom: 8 }}>
                {(authUser.userType === 'admin' || authUser.userType === 'mgr') && (<>
                  <button onClick={() => setMobileOpenSubSection(mobileOpenSubSection === 'company-settings' ? null : 'company-settings')}
                    style={{ display: 'flex', width: '100%', justifyContent: 'space-between', background: 'none', border: 'none', padding: '11px 36px', fontSize: 15, color: '#555', cursor: 'pointer', fontWeight: 600 }}>
                    🏢 Company Settings <span style={{ opacity: 0.5 }}>{mobileOpenSubSection === 'company-settings' ? '▲' : '▼'}</span>
                  </button>
                  {mobileOpenSubSection === 'company-settings' && [
                    { label: 'Company Info', page: 'settingscompany' },
                    { label: 'Tax & Fees', page: 'settingstaxfees' },
                    { label: 'Markup & Pricing', page: 'settingspricing' },
                    { label: 'Pay Period Config', page: 'settingspayperiod' },
                    { label: 'User Management', page: 'userlist' },
                    { label: 'Audit Log', page: 'systemlogs' },
                  ].map(item => (
                    <button key={item.page} onClick={() => { setPage(item.page); setMobileMenuOpen(false); setMobileOpenSection(null); setMobileOpenSubSection(null); }}
                      style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '11px 52px', fontSize: 14, color: '#1a3a7a', cursor: 'pointer', fontWeight: 500 }}>
                      {item.label}
                    </button>
                  ))}
                </>)}
                <button onClick={() => setMobileOpenSubSection(mobileOpenSubSection === 'personal-settings' ? null : 'personal-settings')}
                  style={{ display: 'flex', width: '100%', justifyContent: 'space-between', background: 'none', border: 'none', padding: '11px 36px', fontSize: 15, color: '#555', cursor: 'pointer', fontWeight: 600 }}>
                  👤 Personal Settings <span style={{ opacity: 0.5 }}>{mobileOpenSubSection === 'personal-settings' ? '▲' : '▼'}</span>
                </button>
                {mobileOpenSubSection === 'personal-settings' && (
                  <button onClick={() => { setPage('settingspersonal'); setMobileMenuOpen(false); setMobileOpenSection(null); setMobileOpenSubSection(null); }}
                    style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '11px 52px', fontSize: 14, color: '#1a3a7a', cursor: 'pointer', fontWeight: 500 }}>
                    Account & Password
                  </button>
                )}
              </div>
            )}
          </div>
          {/* Bottom actions */}
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {authUser.userType === 'mgr' && (
              <button onClick={() => { setMgrViewMode('tech'); setMobileMenuOpen(false); }}
                style={{ background: '#1a3a7a', color: '#fff', border: 'none', borderRadius: 8, padding: '13px', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>
                📱 Switch to Tech View
              </button>
            )}
            <button onClick={handleLogout}
              style={{ background: '#ff4d4d', color: '#fff', border: 'none', borderRadius: 8, padding: '13px', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Dashboard Body */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 20px' }}>

        {/* Dashboard top row: KPIs left, Weather+Widgets+Clock right */}
        <div style={{ display: 'flex', gap: 20, marginBottom: 32, alignItems: 'stretch', flexWrap: 'wrap' }}>

          {/* KPI Cards — 2 rows × 3 cols */}
          <div style={{ flex: '1 1 420px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Range selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: '#888', fontWeight: 600 }}>Show:</span>
              {(['alltime','year','month','week','day'] as const).map(r => (
                <button key={r} onClick={() => setKpiRange(r)}
                  style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 12, border: 'none', cursor: 'pointer',
                    background: kpiRange === r ? '#1a3a7a' : '#e8edf8', color: kpiRange === r ? '#fff' : '#555' }}>
                  {r === 'alltime' ? 'All Time' : r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {([
                { label: kpiRange === 'alltime' ? 'All-Time WOs' : `WOs (${kpiRange})`, value: kpiRange === 'alltime' ? allTimeWOs : rangedTotal, color: '#1a3a7a', page: null },
                { label: kpiRange === 'alltime' ? 'Draft' : `Drafts (${kpiRange})`, value: kpiRange === 'alltime' ? draftWOs : rangedDraft, color: '#9b59b6', page: 'workorderlistdraft' },
                { label: 'Active', value: activeWOs, color: '#0099FF', page: 'workorderlist' },
                { label: 'Completed', value: completedWOs, color: '#2a9d2a', page: 'completedworkorders' },
                { label: 'Closed', value: closedWOs, color: '#888', page: 'closedworkorders' },
                { label: 'Invoiced', value: invoicedWOs, color: '#e67e22', page: 'invoicelist' },
              ] as { label: string; value: number; color: string; page: string | null }[]).map(kpi => (
                <div key={kpi.label}
                  onClick={() => kpi.page && setPage(kpi.page)}
                  style={{ background: '#fff', borderRadius: 12, padding: '14px 18px', boxShadow: '0 2px 8px rgba(26,58,122,0.08)', borderTop: `4px solid ${kpi.color}`, cursor: kpi.page ? 'pointer' : 'default', transition: 'box-shadow 0.15s' }}
                  onMouseEnter={e => { if (kpi.page) (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(26,58,122,0.18)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(26,58,122,0.08)'; }}
                >
                  <div style={{ fontSize: 32, fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
                  <div style={{ fontSize: 12, color: '#555', marginTop: 3, fontWeight: 500 }}>{kpi.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right card: widgets + clock on same row, then weather below */}
          <div style={{ background: '#fff', borderRadius: 12, padding: '14px 18px', boxShadow: '0 2px 8px rgba(26,58,122,0.08)', flex: '1 1 340px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Widgets + Clock in one row */}
            {(() => {
              const todayStr2 = new Date().toISOString().slice(0, 10);
              const weekStart = (() => { const d = new Date(); d.setDate(d.getDate() - d.getDay()); return d.toISOString().slice(0,10); })();
              const monthStart = todayStr2.slice(0, 7) + '-01';
              const revenueFilter = (exp: { status: string }) => ['invoiced','sent','paid'].includes(exp.status);
              const sumAmt = (exps: typeof allExpenses) => exps.reduce((s, e) => s + (parseFloat(e.total_cost) || 0), 0);
              const dailyRev = sumAmt(allExpenses.filter(e => revenueFilter(e) && e.scheduled_date === todayStr2));
              const weeklyRev = sumAmt(allExpenses.filter(e => revenueFilter(e) && e.scheduled_date >= weekStart));
              const monthlyRev = sumAmt(allExpenses.filter(e => revenueFilter(e) && e.scheduled_date >= monthStart));
              const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
              const fmt12 = (t: string) => { if (!t) return ''; const [h, m] = t.split(':').map(Number); return `${h%12||12}:${String(m).padStart(2,'0')} ${h>=12?'PM':'AM'}`; };
              const onClock = teamProfiles.filter(p => p.schedule && p.schedule[dayName]);
              const fmt$ = (v: number) => v > 0 ? `$${v >= 1000 ? (v/1000).toFixed(1)+'k' : v.toFixed(0)}` : '—';
              return (
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  {/* Team on Clock */}
                  <div style={{ background: '#f0f4ff', borderRadius: 8, padding: '8px 10px', border: '1px solid #d0d8f0', flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: '#1a3a7a', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>👥 On Clock</div>
                    {onClock.length === 0
                      ? <div style={{ fontSize: 11, color: '#aaa' }}>None today</div>
                      : onClock.map(p => (
                          <div key={p.userId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2, gap: 4 }}>
                            <span style={{ fontWeight: 600, color: '#222', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.username}</span>
                            <span style={{ color: '#555', whiteSpace: 'nowrap', fontSize: 10 }}>{fmt12(p.schedule[dayName].start)}–{fmt12(p.schedule[dayName].end)}</span>
                          </div>
                        ))
                    }
                  </div>
                  {/* Revenue Pulse */}
                  <div style={{ background: '#f0fff4', borderRadius: 8, padding: '8px 10px', border: '1px solid #b0e0c0', flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: '#2a9d2a', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>📊 Revenue</div>
                    {[['Day', dailyRev], ['Week', weeklyRev], ['Month', monthlyRev]].map(([label, val]) => (
                      <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
                        <span style={{ color: '#666' }}>{label}</span>
                        <span style={{ fontWeight: 700, color: (val as number) > 0 ? '#2a9d2a' : '#bbb' }}>{fmt$(val as number)}</span>
                      </div>
                    ))}
                  </div>
                  {/* Clock */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#1a3a7a', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>{timeStr}</div>
                    <div style={{ fontSize: 11, color: '#666', marginTop: 2, whiteSpace: 'nowrap' }}>{dateStr}</div>
                  </div>
                </div>
              );
            })()}
            {/* Weather */}
            {weather.length > 0 && (() => {
              const wmoIcon = (code: number) => {
                if (code === 0) return '☀️';
                if (code <= 2) return '🌤️';
                if (code <= 3) return '☁️';
                if (code <= 48) return '🌫️';
                if (code <= 57) return '🌧️';
                if (code <= 67) return '🌧️';
                if (code <= 77) return '❄️';
                if (code <= 82) return '🌦️';
                if (code <= 86) return '🌨️';
                if (code <= 99) return '⛈️';
                return '🌤️';
              };
              const dayLabel = (ds: string, i: number) => {
                if (i === 0) return 'Today';
                if (i === 1) return 'Tom';
                return new Date(ds + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' });
              };
              return (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#1a3a7a', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, textAlign: 'center' }}>Wilmington, NC — 7-Day Forecast</div>
                  <div style={{ display: 'flex', gap: 5, overflowX: 'auto', paddingBottom: 2, justifyContent: 'center' }}>
                    {weather.map((day, i) => (
                      <div key={day.date} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 46, background: i === 0 ? '#e8f0fe' : '#f8f9ff', borderRadius: 7, padding: '6px 4px', border: i === 0 ? '1px solid #b0c4f0' : '1px solid #e8eaf0' }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: '#1a3a7a', marginBottom: 1 }}>{dayLabel(day.date, i)}</div>
                        <div style={{ fontSize: 17, lineHeight: 1.2 }}>{wmoIcon(day.code)}</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#c00', marginTop: 2 }}>{day.maxTemp}°</div>
                        <div style={{ fontSize: 10, color: '#666' }}>{day.minTemp}°</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Calendar */}
        {(() => {
          const activeOrders = workOrders.filter(wo => wo.status === 'active' && wo.scheduledDate);
          const woByDate: Record<string, typeof workOrders> = {};
          activeOrders.forEach(wo => {
            const d = wo.scheduledDate!;
            if (!woByDate[d]) woByDate[d] = [];
            woByDate[d].push(wo);
          });

          const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
          const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

          const year = calDate.getFullYear();
          const month = calDate.getMonth();

          const goMonth = (delta: number) => {
            setCalDate(d => { const n = new Date(d); n.setDate(1); n.setMonth(n.getMonth() + delta); return n; });
          };
          const goWeek = (delta: number) => {
            setCalDate(d => { const n = new Date(d); n.setDate(n.getDate() + delta * 7); return n; });
          };
          const goToday = () => setCalDate(new Date());

          const todayStr = new Date().toISOString().slice(0, 10);

          // Pay period markers: period starts Fri 7/10/2026, biweekly; payday is 20 days after period start
          const PAY_PERIOD_ANCHOR = new Date('2026-07-10');
          const PERIOD_MS = 14 * 86400000;
          const isPayPeriodStart = (ds: string) => {
            if (!ds) return false;
            const diff = new Date(ds + 'T12:00:00').getTime() - PAY_PERIOD_ANCHOR.getTime();
            return diff >= 0 && diff % PERIOD_MS === 0;
          };
          const isPayday = (ds: string) => {
            if (!ds) return false;
            const diff = new Date(ds + 'T12:00:00').getTime() - new Date('2026-07-30').getTime();
            return diff >= 0 && diff % PERIOD_MS === 0;
          };
          const isDayOff = (ds: string) => daysOff.filter(d => d.date === ds);

          const renderMonthView = () => {
            const firstDay = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const cells: (number | null)[] = [
              ...Array(firstDay).fill(null),
              ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
            ];
            while (cells.length % 7 !== 0) cells.push(null);

            return (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, background: '#d0d8f0', border: '1px solid #d0d8f0', borderRadius: 2 }}>
                  {dayNames.map(d => (
                    <div key={d} style={{ background: '#1a3a7a', color: '#fff', textAlign: 'center', padding: '8px 0', fontSize: 12, fontWeight: 700 }}>{d}</div>
                  ))}
                  {cells.map((day, i) => {
                    const dateStr2 = day ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : '';
                    const wos = day ? (woByDate[dateStr2] || []) : [];
                    const isToday = dateStr2 === todayStr;
                    const payStart = day && isPayPeriodStart(dateStr2);
                    const payday = day && isPayday(dateStr2);
                    const offs = day ? isDayOff(dateStr2) : [];
                    return (
                      <div key={i} style={{ background: isToday ? '#e8f4ff' : '#fff', minHeight: 80, padding: '4px 6px', verticalAlign: 'top', borderTop: isToday ? '2px solid #0099FF' : 'none' }}>
                        {day && <div style={{ fontSize: 12, fontWeight: isToday ? 800 : 500, color: isToday ? '#0099FF' : '#333', marginBottom: 2 }}>{day}</div>}
                        {payStart && <div style={{ background: '#1a3a7a', color: '#fff', borderRadius: 3, padding: '2px 5px', fontSize: 10, fontWeight: 700, marginBottom: 2 }}>📅 Pay Period Start</div>}
                        {payday && <div style={{ background: '#2a9d2a', color: '#fff', borderRadius: 3, padding: '2px 5px', fontSize: 10, fontWeight: 700, marginBottom: 2 }}>💵 Payday</div>}
                        {offs.map(d => <div key={d.id} style={{ background: '#ff9900', color: '#fff', borderRadius: 3, padding: '2px 5px', fontSize: 10, marginBottom: 2 }} title={`${d.username} — ${d.type}${d.reason ? ': ' + d.reason : ''}`}>🏖 {d.username}</div>)}
                        {wos.slice(0, 3).map(wo => (
                          <div key={wo.number}
                            onClick={() => openWODetail(wo, 'home')}
                            style={{ background: '#0099FF', color: '#fff', borderRadius: 4, padding: '3px 6px', fontSize: 11, marginBottom: 2, cursor: 'pointer' }}
                            title={wo.number + ' – ' + wo.title}
                          >
                            <div style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{wo.number} / {wo.title}</div>
                            <div style={{ opacity: 0.85, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 10 }}>{wo.propertyName}{wo.scheduledTime ? ' / ' + wo.scheduledTime : ''}</div>
                          </div>
                        ))}
                        {wos.length > 3 && <div style={{ fontSize: 10, color: '#888' }}>+{wos.length - 3} more</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          };

          const renderWeekView = () => {
            const dow = calDate.getDay();
            const weekStart = new Date(calDate);
            weekStart.setDate(calDate.getDate() - dow);
            const days = Array.from({ length: 7 }, (_, i) => {
              const d = new Date(weekStart);
              d.setDate(weekStart.getDate() + i);
              return d;
            });
            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, background: '#d0d8f0', border: '1px solid #d0d8f0', borderRadius: 2 }}>
                {days.map(d => {
                  const ds = d.toISOString().slice(0, 10);
                  const wos = woByDate[ds] || [];
                  const isToday = ds === todayStr;
                  const offToday = daysOff.filter(o => o.date === ds);
                  return (
                    <div key={ds} style={{ background: isToday ? '#e8f4ff' : '#fff', minHeight: 160, padding: '6px 8px', borderTop: isToday ? '2px solid #0099FF' : 'none' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: isToday ? '#0099FF' : '#1a3a7a', marginBottom: 6 }}>
                        {dayNames[d.getDay()]} {d.getDate()}
                      </div>
                      {offToday.map(o => (
                        <div key={`off-${o.id}`} style={{ background: '#fff3cd', color: '#856404', borderRadius: 4, padding: '3px 6px', fontSize: 10, marginBottom: 3, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                          🏖 {o.username} <span style={{ fontWeight: 400, opacity: 0.8 }}>({o.type})</span>
                        </div>
                      ))}
                      {wos.map(wo => (
                        <div key={wo.number}
                          onClick={() => openWODetail(wo, 'home')}
                          style={{ background: '#0099FF', color: '#fff', borderRadius: 4, padding: '4px 6px', fontSize: 11, marginBottom: 4, cursor: 'pointer' }}
                          title={wo.number + ' – ' + wo.title}
                        >
                          <div style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{wo.number} / {wo.title}</div>
                          <div style={{ opacity: 0.85, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 10 }}>{wo.propertyName}{wo.scheduledTime ? ' / ' + wo.scheduledTime : ''}</div>
                        </div>
                      ))}
                      {wos.length === 0 && offToday.length === 0 && <div style={{ fontSize: 11, color: '#ccc' }}>—</div>}
                    </div>
                  );
                })}
              </div>
            );
          };

          const headerLabel = calView === 'month'
            ? `${monthNames[month]} ${year}`
            : (() => {
                const dow = calDate.getDay();
                const ws = new Date(calDate); ws.setDate(calDate.getDate() - dow);
                const we = new Date(ws); we.setDate(ws.getDate() + 6);
                return `${monthNames[ws.getMonth()]} ${ws.getDate()} – ${monthNames[we.getMonth()]} ${we.getDate()}, ${we.getFullYear()}`;
              })();

          return (
            <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(26,58,122,0.08)', overflow: 'hidden' }}>
              {/* Calendar header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #e0e8f0', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button onClick={() => calView === 'month' ? goMonth(-1) : goWeek(-1)} style={{ background: '#f0f4ff', border: '1px solid #c0d0f0', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontWeight: 700, fontSize: 15, color: '#1a3a7a' }}>‹</button>
                  <button onClick={goToday} style={{ background: '#f0f4ff', border: '1px solid #c0d0f0', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#1a3a7a' }}>Today</button>
                  <button onClick={() => calView === 'month' ? goMonth(1) : goWeek(1)} style={{ background: '#f0f4ff', border: '1px solid #c0d0f0', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontWeight: 700, fontSize: 15, color: '#1a3a7a' }}>›</button>
                  <span style={{ fontWeight: 700, fontSize: 16, color: '#1a3a7a', marginLeft: 8 }}>{headerLabel}</span>
                </div>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                  {/* Month jump buttons */}
                  <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', marginRight: 8 }}>
                    {monthNames.map((mn, mi) => (
                      <button key={mn} onClick={() => setCalDate(new Date(year, mi, 1))}
                        style={{ background: mi === month && calView === 'month' ? '#1a3a7a' : '#f0f4ff', color: mi === month && calView === 'month' ? '#fff' : '#1a3a7a', border: '1px solid #c0d0f0', borderRadius: 4, padding: '3px 7px', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}
                      >{mn.slice(0, 3)}</button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => setCalView('month')} style={{ background: calView === 'month' ? '#1a3a7a' : '#f0f4ff', color: calView === 'month' ? '#fff' : '#1a3a7a', border: '1px solid #c0d0f0', borderRadius: 6, padding: '5px 14px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Month</button>
                    <button onClick={() => setCalView('week')} style={{ background: calView === 'week' ? '#1a3a7a' : '#f0f4ff', color: calView === 'week' ? '#fff' : '#1a3a7a', border: '1px solid #c0d0f0', borderRadius: 6, padding: '5px 14px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Week</button>
                  </div>
                </div>
              </div>
              <div style={{ padding: '0' }}>
                {calView === 'month' ? renderMonthView() : renderWeekView()}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
export default App;
