  const handleDeleteProperty = (idx: number) => {
    setProperties((prev) => prev.filter((_, i) => i !== idx));
  };
import React from "react";
import "./App.css";

function App() {
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
        <p>Work order creation form goes here.</p>
        <button onClick={() => setPage("home")}>Return to Home</button>
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