import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./HomePage.css"; // Import the CSS file for styling
import Header from "../components/Header.js";
import TokensList from "../components/TokenList.js";
import Footer from "../components/Footer.js";

function RecentlyLaunched() {
  const [error, setError] = useState("");

  return (
    <div>
      <Header
        connectWallet={connectWallet}
        isConnected={isConnected}
        chainId={chainId}
      />

      <TokensList limit={9} />
      <div className="container">
        <Link to="/tokens">
          <button>View All </button>
        </Link>
      </div>

      <Footer />
    </div>
  );
}

export default RecentlyLaunched;
