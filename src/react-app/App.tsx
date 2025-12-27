import React from "react";
import "./App.css";

function App() {
  // All state, handlers, and logic go here
  // ...
    // Add state for navigation and work orders if missing
    const [page, setPage] = React.useState<string>("home");
    const [workOrders, setWorkOrders] = React.useState<any[]>(() => {
      const saved = localStorage.getItem('workOrders');
      return saved ? JSON.parse(saved) : [];
    });
  // (Place all handlers, state, and logic here, and only one return at the end of the function)
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
              {vendors.map((vendor: any, idx: number) => (
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
              {workOrders.map((wo: any, idx: number) => (
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
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "2rem",
          marginTop: "2rem",
          width: "100%",
          maxWidth: 900
        }}>
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
            <button style={{ marginBottom: 8 }} onClick={() => setPage("workorderlist")}>Work Order List</button>
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
            <button style={{ marginBottom: 8 }} onClick={() => setPage("inventorylist")}>Inventory List</button>
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
            <button style={{ marginBottom: 8 }} onClick={() => setPage("vendorlist")}>Vendor List</button>
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
            <button style={{ marginBottom: 8 }} onClick={() => setPage("purchaselist")}>Purchase List</button>
          </div>
        </div>
      </div>
    );
  }
  export default App;
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
          <button onClick={() => setPage("workorderlist")}>Work Order List</button>
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