import React, { useState } from "react";
import "./App.css";

function App() {
  const [page, setPage] = React.useState("home");

  if (page === "property") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <h1>Create a Property</h1>
        <p>Property creation form goes here.</p>
        <button onClick={() => setPage("home")}>Return to Home</button>
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
        <p>List of properties will be shown here.</p>
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