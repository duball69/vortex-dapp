import React, { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "./Trading.css"; // Import the CSS file

function Trading() {
  const { chain: initialChain, contractAddress: initialContractAddress } =
    useParams();
  const chain = initialChain.toLowerCase(); // Convert chain to lowercase
  const [contractAddress, setContractAddress] = useState(
    initialContractAddress
  );
  const [searchValue, setSearchValue] = useState(initialContractAddress);
  const navigate = useNavigate();

  const handleSearchChange = (e) => {
    setSearchValue(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setContractAddress(searchValue);
    navigate(`/trading/${chain}/${searchValue}`);
  };

  return (
    <div>
      <Header />

      {/* Search Bar */}
      <div style={{ padding: "20px", textAlign: "center" }}>
        <form onSubmit={handleSearchSubmit}>
          <input
            type="text"
            value={searchValue}
            onChange={handleSearchChange}
            placeholder="Enter token contract address"
            style={{
              width: "80%",
              padding: "10px",
              borderRadius: "10px",
              border: "1px solid #ccc",
              marginRight: "10px",
            }}
          />
          <button
            type="submit"
            style={{
              padding: "10px 20px",
              borderRadius: "10px",
              backgroundColor: "#333",
              color: "#fff",
              border: "none",
              cursor: "pointer",
            }}
          >
            Search
          </button>
        </form>
      </div>

      {/* New Section with Flexbox Layout */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          margin: "0 auto",
          maxWidth: "1200px", // Adjust this value as needed
          padding: "20px",
        }}
      >
        {/* DexScreener Embed (Left, 70% width) */}
        <div
          style={{
            flex: "0 0 70%",
            marginRight: "10px",
            position: "relative",
            height: "660px",
            minWidth: "300px",
          }}
        >
          <iframe
            src={`https://dexscreener.com/${chain}/${contractAddress}?embed=1&info=1&trades=1&&theme=dark`}
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              top: 0,
              left: 0,
              border: "0",
              borderRadius: "20px",
              overflow: "hidden",
            }}
            allowFullScreen
          />
        </div>

        {/* Uniswap Embed (Right, 30% width) */}
        <div
          style={{
            flex: "0 0 30%",
            marginLeft: "10px",
            minWidth: "300px",
            height: "660px",
          }}
        >
          <iframe
            src={`https://app.uniswap.org/swap?chain=${chain}&theme=dark&outputCurrency=${contractAddress}&forceNetwork=${initialChain}`}
            height="660px"
            width="100%"
            style={{
              border: "0",
              display: "block",
              borderRadius: "10px",
            }}
          />
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default Trading;
