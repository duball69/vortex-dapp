import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { firestore } from "../components/firebaseConfig";
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
  const [tokenName, setTokenName] = useState(""); // State for token name
  const [imageUrl, setImageUrl] = useState(""); // State for token image
  const [price, setPrice] = useState(null); // State for token price
  const [marketCap, setMarketCap] = useState(null); // State for market cap
  const [volume, setVolume] = useState(null); // State for volume
  const [supply, setSupply] = useState(null); // State for token supply
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch token data (assuming token data is in Firebase)
    const fetchTokenData = async () => {
      try {
        // Fetch token info from Firebase
        const q = query(
          collection(firestore, "tokens"),
          where("address", "==", contractAddress)
        );
        const querySnapshot = await getDocs(q);

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          setTokenName(data.name); // Assuming token data has a name field
          setImageUrl(data.imageUrl); // Set the token image URL
          setSupply(data.supply); // Set the token supply (ensure this field exists in your data)
        });

        // Fetch price and volume from DexScreener API
        const response = await fetch(
          `https://api.dexscreener.com/latest/dex/tokens/${contractAddress}`
        );
        const data = await response.json();
        const pairData = data.pairs && data.pairs[0];

        if (pairData) {
          setPrice(pairData.priceUsd); // Set the token price (USD)
          setVolume(pairData.volume.h24); // Set the volume (24h)
        }
      } catch (error) {
        console.error("Error fetching token data:", error);
      }
    };

    fetchTokenData();
  }, [contractAddress]);

  useEffect(() => {
    if (price && supply) {
      setMarketCap(price * supply); // Calculate market cap
    }
  }, [price, supply]);

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

      {/* Token Name and Image */}
      <div style={{ textAlign: "center", marginTop: "20px", color: "#ffffff" }}>
        {imageUrl && (
          <img
            src={imageUrl}
            alt={tokenName}
            style={{
              width: "100px",
              height: "100px",
              borderRadius: "50%",
              marginBottom: "10px",
            }}
          />
        )}
        <h1>{tokenName ? `${tokenName}` : "Loading..."}</h1>

        {/* Market Cap and Volume Box */}
        {marketCap !== null && volume !== null && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: "20px",
              padding: "10px",

              color: "#ffffff",
              gap: "20px",
            }}
          >
            <div>
              <h3 style={{ margin: "0" }}>Market Cap:</h3>
              <p style={{ margin: "0" }}>${marketCap.toFixed(2)}</p>
            </div>
            <div>
              <h3 style={{ margin: "0" }}>Volume (24h):</h3>
              <p style={{ margin: "0" }}>${volume.toFixed(2)}</p>
            </div>
          </div>
        )}
      </div>

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
            src={`https://dexscreener.com/${chain}/${contractAddress}?embed=1&info=0&trades=1&&theme=dark`}
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
