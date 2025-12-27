import React from "react";
import "./App.css";

function App() {
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

      React.useEffect(() => {
        localStorage.setItem('workOrders', JSON.stringify(workOrders));
      }, [workOrders]);

      // Generate a unique work order number (simple increment)
      const generateWorkOrderNumber = () => {
        const last = workOrders.length > 0 ? workOrders[workOrders.length - 1].number : null;
        if (!last) return 'WO-1001';
        const num = parseInt(last.replace('WO-', '')) + 1;
        return `WO-${num}`;
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
    const handleDeleteProperty = (idx: number) => {
      setProperties((prev: typeof form[]) => prev.filter((_: typeof form, i: number) => i !== idx));
    };
  const [page, setPage] = React.useState("home");
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
  React.useEffect(() => {
    localStorage.setItem('properties', JSON.stringify(properties));
  }, [properties]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProperties((prev) => [...prev, form]);
    setSubmitted(true);
  };

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
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <h1>Welcome to the Service Master App</h1>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "2rem" }}>
        <button onClick={() => setPage("property")}>Create a Property</button>
        <button onClick={() => setPage("workorder")}>Create a Work Order</button>
        <button onClick={() => setPage("propertylist")}>Property List</button>
      </div>
    </div>
  );
}

export default App;