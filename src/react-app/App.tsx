import React from "react";
import "./App.css";

const NAV_ITEMS = [
  { label: "Create Property", action: "create-property" },
  { label: "Create Work Order", action: "create-work-order" },
  { label: "Create Inspection", action: "create-inspection" },
  { label: "Create Purchase", action: "create-purchase" },
  { label: "Inventory Manager", action: "inventory-manager" },
  { label: "Vendor Manager", action: "vendor-manager" },
  { label: "View Work Order List", action: "view-work-orders" },
  { label: "View Inspection List", action: "view-inspections" },
  { label: "View Property List", action: "view-properties" },
];

function App() {
  const [workOrders, setWorkOrders] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Fetch work orders from API (placeholder)
  const fetchWorkOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      // TODO: Replace with real API call
      setTimeout(() => {
        setWorkOrders([
          { id: 1, property: "123 Main St", status: "Open", description: "Leaky faucet" },
          { id: 2, property: "456 Oak Ave", status: "In Progress", description: "Broken window" },
        ]);
        setLoading(false);
      }, 500);
    } catch (e: any) {
      setError("Failed to load work orders");
      setLoading(false);
    }
  };

  // Initial load
  React.useEffect(() => {
    fetchWorkOrders();
  }, []);

  // Handler for header title click
  const handleTitleClick = () => {
    fetchWorkOrders();
  };

  return (
    <div>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 0" }}>
        <h1 style={{ cursor: "pointer", margin: 0 }} onClick={handleTitleClick}>
          Work Order Manager
        </h1>
        <nav>
          {NAV_ITEMS.map((item) => (
            <button key={item.action} style={{ margin: "0 0.5rem" }}>
              {item.label}
            </button>
          ))}
        </nav>
      </header>
      <main>
        <h2>All Work Orders</h2>
        {loading && <p>Loading...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}
        <ul style={{ listStyle: "none", padding: 0 }}>
          {workOrders.map((wo) => (
            <li key={wo.id} style={{ border: "1px solid #444", borderRadius: 8, margin: "1rem 0", padding: "1rem", textAlign: "left" }}>
              <strong>Property:</strong> {wo.property} <br />
              <strong>Status:</strong> {wo.status} <br />
              <strong>Description:</strong> {wo.description}
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}

export default App;
// src/App.tsx


import { useState } from "react";
import "./App.css";

function App() {
	const [count, setCount] = useState(0);
	const [name, setName] = useState("unknown");


	const NAV_ITEMS = [
		{ label: "Create Property", action: "create-property" },
		{ label: "Create Work Order", action: "create-work-order" },
		{ label: "Create Inspection", action: "create-inspection" },
		{ label: "Create Purchase", action: "create-purchase" },
		{ label: "Inventory Manager", action: "inventory-manager" },
		{ label: "Vendor Manager", action: "vendor-manager" },
		{ label: "View Work Order List", action: "view-work-orders" },
		{ label: "View Inspection List", action: "view-inspections" },
		{ label: "View Property List", action: "view-properties" },
	];

	function App() {
		const [workOrders, setWorkOrders] = useState<any[]>([]);
		const [loading, setLoading] = useState(false);
		const [error, setError] = useState<string | null>(null);


		import React from "react";
		import "./App.css";

		const NAV_ITEMS = [
		  { label: "Create Property", action: "create-property" },
		  { label: "Create Work Order", action: "create-work-order" },
		  { label: "Create Inspection", action: "create-inspection" },
		  { label: "Create Purchase", action: "create-purchase" },
		  { label: "Inventory Manager", action: "inventory-manager" },
		  { label: "Vendor Manager", action: "vendor-manager" },
		  { label: "View Work Order List", action: "view-work-orders" },
		  { label: "View Inspection List", action: "view-inspections" },
		  { label: "View Property List", action: "view-properties" },
		];

		function App() {
		  const [workOrders, setWorkOrders] = React.useState<any[]>([]);
		  const [loading, setLoading] = React.useState(false);
		  const [error, setError] = React.useState<string | null>(null);

		  // Fetch work orders from API (placeholder)
		  const fetchWorkOrders = async () => {
		    setLoading(true);
		    setError(null);
		    try {
		      // TODO: Replace with real API call
		      setTimeout(() => {
		        setWorkOrders([
		          { id: 1, property: "123 Main St", status: "Open", description: "Leaky faucet" },
		          { id: 2, property: "456 Oak Ave", status: "In Progress", description: "Broken window" },
		        ]);
		        setLoading(false);
		      }, 500);
		    } catch (e: any) {
		      setError("Failed to load work orders");
		      setLoading(false);
		    }
		  };

		  // Initial load
		  React.useEffect(() => {
		    fetchWorkOrders();
		  }, []);

		  // Handler for header title click
		  const handleTitleClick = () => {
		    fetchWorkOrders();
		  };

		  return (
		    <div>
		      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 0" }}>
		        <h1 style={{ cursor: "pointer", margin: 0 }} onClick={handleTitleClick}>
		          Work Order Manager
		        </h1>
		        <nav>
		          {NAV_ITEMS.map((item) => (
		            <button key={item.action} style={{ margin: "0 0.5rem" }}>
		              {item.label}
		            </button>
		          ))}
		        </nav>
		      </header>
		      <main>
		        <h2>All Work Orders</h2>
		        {loading && <p>Loading...</p>}
		        {error && <p style={{ color: "red" }}>{error}</p>}
		        <ul style={{ listStyle: "none", padding: 0 }}>
		          {workOrders.map((wo) => (
		            <li key={wo.id} style={{ border: "1px solid #444", borderRadius: 8, margin: "1rem 0", padding: "1rem", textAlign: "left" }}>
		              <strong>Property:</strong> {wo.property} <br />
		              <strong>Status:</strong> {wo.status} <br />
		              <strong>Description:</strong> {wo.description}
		            </li>
		          ))}
		        </ul>
		      </main>
		    </div>
		  );
		}

		export default App;
