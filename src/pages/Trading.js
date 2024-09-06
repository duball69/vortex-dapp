import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { firestore } from "../components/firebaseConfig";
import Footer from "../components/Footer";
import "./Trading.css"; // Import the CSS file
import Header2 from "../components/Header2.js";
import { FaTelegramPlane, FaTwitter, FaGlobe } from "react-icons/fa"; // Import social icons

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
  const [website, setWebsite] = useState(""); // State for website link
  const [telegram, setTelegram] = useState(""); // State for telegram link
  const [twitter, setTwitter] = useState(""); // State for X link
  const [showInfo, setShowInfo] = useState(false); // State to toggle between chart and info
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
          setWebsite(data.website); // Set the website link
          setTelegram(data.telegram); // Set the Telegram link
          setTwitter(data.twitter); // Set the X (Twitter) link
        });
      } catch (error) {
        console.error("Error fetching token data:", error);
      }
    };

    fetchTokenData();
  }, [contractAddress]);

  const handleSearchChange = (e) => {
    setSearchValue(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setContractAddress(searchValue);
    navigate(`/trading/${chain}/${searchValue}`);
  };

  const toggleInfo = () => {
    setShowInfo(!showInfo);
  };

  return (
    <div>
      <Header2 />

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
        {contractAddress && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              marginTop: "10px",
            }}
          >
            <p
              style={{
                fontSize: "14px",
                color: "#aaaaaa",
                marginRight: "10px",
                marginTop: "-10px",
              }}
            >
              Contract Address: {contractAddress.slice(0, 6)}...
              {contractAddress.slice(-4)}
            </p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(contractAddress);
                // Optionally, you can add some visual feedback here
              }}
              style={{
                background: "none",
                border: "1px solid #aaaaaa",
                borderRadius: "4px",
                marginTop: "-10px",
                color: "#aaaaaa",
                cursor: "pointer",
                padding: "2px 6px",
                fontSize: "12px",
              }}
            >
              Copy
            </button>
          </div>
        )}

        {/* Social Media Icons */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: "20px",
            gap: "20px",
            color: "#ffffff",
          }}
        >
          {website && (
            <a
              href={website.startsWith("http") ? website : `http://${website}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaGlobe size={20} color="#ffffff" />
            </a>
          )}
          {telegram && (
            <a
              href={
                telegram.startsWith("http") ? telegram : `https://${telegram}`
              }
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaTelegramPlane size={20} color="#ffffff" />
            </a>
          )}
          {twitter && (
            <a
              href={twitter.startsWith("http") ? twitter : `https://${twitter}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaTwitter size={20} color="#ffffff" />
            </a>
          )}
        </div>
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
        {/* Left Section (DexScreener) */}
        <div style={{ flex: "0 0 70%", marginRight: "10px" }}>
          {/* Toggle Button (Left-aligned above the iframe) */}

          {/* DexScreener Embed */}
          <div
            style={{
              position: "relative",
              height: "660px",
              minWidth: "300px",
            }}
          >
            <iframe
              title="Chart"
              src={`https://dexscreener.com/${chain}/${contractAddress}?embed=1&info=${
                showInfo ? 1 : 0
              }&trades=1&theme=dark`}
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
          <div style={{ textAlign: "left", marginBottom: "10px" }}>
            <button
              onClick={toggleInfo}
              style={{
                padding: "10px 20px",
                backgroundColor: "#333",
                color: "#fff",
                borderRadius: "10px",
                border: "none",
                cursor: "pointer",
              }}
            >
              {showInfo ? "Show Chart" : "Show Info"}
            </button>
          </div>
        </div>

        {/* Right Section (Uniswap) */}
        <div style={{ flex: "0 0 30%", marginLeft: "10px" }}>
          <iframe
            title="Swap"
            src={`https://app.uniswap.org/swap?chain=${chain}&theme=dark&inputCurrency=eth&outputCurrency=${contractAddress}&forceNetwork=${chain}`}
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
