import React from "react";
import "./App.css";

function App() {
    // Handler for inventory item form
    const handleItemFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setItemForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleItemFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setInventoryItems((prev) => [...prev, itemForm]);
      setItemSubmitted(true);
    };
  // All state declarations must be at the top
  const [page, setPage] = React.useState("home");
  // Inventory Item state
  type InventoryItem = {
    name: string;
    upc: string;
    sku: string;
    partNumber: string;
    cost: string;
    category: string;
  };
  const [inventoryItems, setInventoryItems] = React.useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('inventoryItems');
    return saved ? JSON.parse(saved) : [];
  });
  const [itemForm, setItemForm] = React.useState({
    name: '',
    upc: '',
    sku: '',
    partNumber: '',
    cost: '',
    category: '',
  });
  const [itemSubmitted, setItemSubmitted] = React.useState(false);
  // Inventory Category state
  const [inventoryCategories, setInventoryCategories] = React.useState<string[]>(() => {
    const saved = localStorage.getItem('inventoryCategories');
    return saved ? JSON.parse(saved) : [];
  });
  const [categoryInput, setCategoryInput] = React.useState('');
  const [showCategoryList, setShowCategoryList] = React.useState(false);
  // ...existing code...
  if (page === "createinventoryitem") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <h1>Create Inventory Item</h1>
        {itemSubmitted ? (
          <>
            <p style={{ color: 'green' }}>Inventory item submitted!</p>
            <button onClick={() => { setPage("home"); setItemSubmitted(false); setItemForm({ name: '', upc: '', sku: '', partNumber: '', cost: '', category: '' }); }}>Return to Home</button>
          </>
        ) : (
          <form onSubmit={handleItemFormSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.5rem", minWidth: 350 }}>
            <label>
              Item Name
              <input name="name" value={itemForm.name} onChange={handleItemFormChange} required />
            </label>
            <label>
              UPC
              <input name="upc" value={itemForm.upc} onChange={handleItemFormChange} required />
            </label>
            <label>
              SKU
              <input name="sku" value={itemForm.sku} onChange={handleItemFormChange} required />
            </label>
            <label>
              Internal Part Number
              <input name="partNumber" value={itemForm.partNumber} onChange={handleItemFormChange} required />
            </label>
            <label>
              Cost
              <input name="cost" value={itemForm.cost} onChange={handleItemFormChange} required type="number" min="0" step="0.01" />
            </label>
            <label>
              Category
              <select name="category" value={itemForm.category} onChange={handleItemFormChange} required>
                <option value="" disabled>Select a category</option>
                {inventoryCategories.map((cat, idx) => (
                  <option key={idx} value={cat}>{cat}</option>
                ))}
              </select>
            </label>
            <button type="submit">Add Inventory Item</button>
            <button type="button" onClick={() => setPage("home")}>Return to Home</button>
          </form>
        )}
      </div>
    );
  }

    React.useEffect(() => {
      localStorage.setItem('inventoryCategories', JSON.stringify(inventoryCategories));
    }, [inventoryCategories]);

    const handleCategoryInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setCategoryInput(e.target.value);
    };

    const handleCategorySubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (categoryInput.trim() && !inventoryCategories.includes(categoryInput.trim())) {
        setInventoryCategories((prev) => [...prev, categoryInput.trim()]);
        setCategoryInput('');
      }
    };
  if (page === "createinventorycategory") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <h1>Create Inventory Category</h1>
        <form onSubmit={handleCategorySubmit} style={{ display: "flex", flexDirection: "column", gap: "0.5rem", minWidth: 300 }}>
          <label>
            Category Name
            <input value={categoryInput} onChange={handleCategoryInputChange} required placeholder="Enter category name" />
          </label>
          <button type="submit">Add Category</button>
        </form>
        <button style={{ marginTop: 16 }} onClick={() => setShowCategoryList((v) => !v)}>
          {showCategoryList ? 'Hide Inventory Categories' : 'See Inventory Categories'}
        </button>
        {showCategoryList && (
          <div style={{ marginTop: 16, minWidth: 300 }}>
            <h2>Inventory Categories</h2>
            {inventoryCategories.length === 0 ? (
              <p>No categories created yet.</p>
            ) : (
              <ul>
                {inventoryCategories.map((cat, idx) => (
                  <li key={idx}>{cat}</li>
                ))}
              </ul>
            )}
          </div>
        )}
        <button style={{ marginTop: 16 }} onClick={() => setPage("home")}>Return to Home</button>
      </div>
    );
  }
  // Vendor state
  type Vendor = {
    name: string;
    category: string;
    contactName: string;
    contactNumber: string;
    contactEmail: string;
    address: string;
  };
  const [vendors, setVendors] = React.useState<Vendor[]>(() => {
    const saved = localStorage.getItem('vendors');
    return saved ? JSON.parse(saved) : [];
  });
  const [vendorForm, setVendorForm] = React.useState({
    name: '',
    category: '',
    contactName: '',
    contactNumber: '',
    contactEmail: '',
    address: '',
  });
  const [vendorSubmitted, setVendorSubmitted] = React.useState(false);

  // Work order state
  type WorkOrder = {
    number: string;
    propertyName: string;
    title: string;
    instructions: string;
    scheduledTime: string;
    scheduledDate: string;
  };
  const [workOrders, setWorkOrders] = React.useState<WorkOrder[]>(() => {
    const saved = localStorage.getItem('workOrders');
    return saved ? JSON.parse(saved) : [];
  });
  const [woForm, setWoForm] = React.useState({
    propertyName: '',
    title: '',
    instructions: '',
    scheduledTime: '',
    scheduledDate: '',
  });
  const [woSubmitted, setWoSubmitted] = React.useState(false);

  const [form, setForm] = React.useState({
    propertyName: "",
    address: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    ownerName: "",
    ownerPhone: "",
  });
  const [submitted, setSubmitted] = React.useState(false);
  const [properties, setProperties] = React.useState<typeof form[]>(() => {
    const saved = localStorage.getItem('properties');
    return saved ? JSON.parse(saved) : [];
  });

  // Effects
  React.useEffect(() => {
    localStorage.setItem('vendors', JSON.stringify(vendors));
  }, [vendors]);
  React.useEffect(() => {
    localStorage.setItem('workOrders', JSON.stringify(workOrders));
  }, [workOrders]);
  React.useEffect(() => {
    localStorage.setItem('properties', JSON.stringify(properties));
  }, [properties]);

  // Handlers
  const handleVendorFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setVendorForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleVendorFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setVendors((prev) => [...prev, vendorForm]);
    setVendorSubmitted(true);
  };
  const handleWoFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setWoForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleWoFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newWO: WorkOrder = {
      number: generateWorkOrderNumber(),
      propertyName: woForm.propertyName,
      title: woForm.title,
      instructions: woForm.instructions,
      scheduledTime: woForm.scheduledTime,
      scheduledDate: woForm.scheduledDate,
    };
    setWorkOrders((prev) => [...prev, newWO]);
    setWoSubmitted(true);
  };
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProperties((prev) => [...prev, form]);
    setSubmitted(true);
  };
  const handleDeleteProperty = (idx: number) => {
    setProperties((prev: typeof form[]) => prev.filter((_: typeof form, i: number) => i !== idx));
  };

  // Generators
  const generateWorkOrderNumber = () => {
    const last = workOrders.length > 0 ? workOrders[workOrders.length - 1].number : null;
    if (!last) return 'WO-1001';
    const num = parseInt(last.replace('WO-', '')) + 1;
    return `WO-${num}`;
  };

  // Render logic
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
              {vendors.map((vendor, idx) => (
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
        <button onClick={() => setPage("home")}>Return to Home</button>
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
              <input name="number" value={generateWorkOrderNumber()} disabled style={{ background: '#eee' }} />
            </label>
            <label>
              Property
              <select name="propertyName" value={woForm.propertyName} onChange={handleWoFormChange} required>
                <option value="" disabled>Select a property</option>
                {properties.map((prop, idx) => (
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
              {properties.map((prop, idx) => (
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
                    <button style={{ background: "#ff4d4d", color: "white", border: "none", borderRadius: 4, padding: "4px 10px", cursor: "pointer" }} onClick={() => handleDeleteProperty(idx)}>
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
  if (page === "workorderlist") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <h1>Work Order List</h1>
        {workOrders.length === 0 ? (
          <p>No work orders have been added yet.</p>
        ) : (
          <table style={{ borderCollapse: "collapse", minWidth: 700, margin: "1rem 0" }}>
            <thead>
              <tr>
                <th style={{ border: "1px solid #444", padding: "8px", background: "#f0f0f0" }}>WO Number</th>
                <th style={{ border: "1px solid #444", padding: "8px", background: "#f0f0f0" }}>Property</th>
                <th style={{ border: "1px solid #444", padding: "8px", background: "#f0f0f0" }}>Title</th>
                <th style={{ border: "1px solid #444", padding: "8px", background: "#f0f0f0" }}>Instructions</th>
                <th style={{ border: "1px solid #444", padding: "8px", background: "#f0f0f0" }}>Scheduled Date</th>
                <th style={{ border: "1px solid #444", padding: "8px", background: "#f0f0f0" }}>Scheduled Time</th>
              </tr>
            </thead>
            <tbody>
              {workOrders.map((wo, idx) => (
                <tr key={idx}>
                  <td style={{ border: "1px solid #444", padding: "8px" }}>{wo.number}</td>
                  <td style={{ border: "1px solid #444", padding: "8px" }}>{wo.propertyName}</td>
                  <td style={{ border: "1px solid #444", padding: "8px" }}>{wo.title}</td>
                  <td style={{ border: "1px solid #444", padding: "8px" }}>{wo.instructions}</td>
                  <td style={{ border: "1px solid #444", padding: "8px" }}>{wo.scheduledDate}</td>
                  <td style={{ border: "1px solid #444", padding: "8px" }}>{wo.scheduledTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <button onClick={() => setPage("home")}>Return to Home</button>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <h1>Welcome to the Service Master App</h1>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "2rem" }}>
        <button onClick={() => setPage("property")}>Create a Property</button>
        <button onClick={() => setPage("workorder")}>Create a Work Order</button>
        <button onClick={() => setPage("propertylist")}>Property List</button>
        <button onClick={() => setPage("workorderlist")}>Work Order List</button>
        <button onClick={() => setPage("vendor")}>Create a Vendor</button>
        <button onClick={() => setPage("vendorlist")}>Vendor List</button>
        <button onClick={() => setPage("createinventorycategory")}>Create Inventory Category</button>
        <button onClick={() => setPage("createinventoryitem")}>Create Inventory Item</button>
      </div>
    </div>
  );
}

export default App;