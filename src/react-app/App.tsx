import React from "react";
import "./App.css";

function App() {
	return (
		<div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
			<h1>Welcome to the Service Master App</h1>
			<p>This is your splash page. Start building your application here!</p>
		</div>
	);
}

export default App;
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
	const NAV_ITEMS = [
