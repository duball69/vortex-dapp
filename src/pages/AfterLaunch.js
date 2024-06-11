import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { firestore } from "../components/firebaseConfig";
import Header from "../components/Header.js";
import Footer from "../components/Footer.js";
import { useWeb3Modal, useWeb3ModalAccount } from "@web3modal/ethers/react";

function AfterLaunch() {
  const {
    address: connectedWallet,
    chainId,
    isConnected,
  } = useWeb3ModalAccount();
  const { open } = useWeb3Modal();
  const { contractAddress } = useParams();
  const [tokenDetails, setTokenDetails] = useState({
    website: "",
    twitter: "",
    telegram: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [deployer, setDeployer] = useState(null);

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const fetchTokenDetails = async () => {
      const tokenDoc = doc(firestore, "tokens", contractAddress);
      const docSnap = await getDoc(tokenDoc);
      if (docSnap.exists()) {
        setTokenDetails(docSnap.data());
        setIsLoaded(true);
        setDeployer(docSnap.data().deployer);
      } else {
        console.log("No such document!");
      }
    };
    fetchTokenDetails();
  }, [contractAddress]);

  const connectWallet = async () => {
    try {
      await open();
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  // Ensure URLs do not include www. or any protocol
  const formatWebsite = (url) =>
    url.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "");

  const formatTwitter = (handle) => {
    // Normalize the URL by removing protocol, www, and correct for repeated domain issues
    const normalized = handle
      .replace(/^(?:https?:\/\/)?(?:www\.)?/i, "") // Remove protocol and www
      .replace(/twitter\.com\//i, "") // Remove twitter.com/
      .replace(/\/+/g, "/") // Replace multiple slashes with a single slash
      .replace(/^x\.com\//i, ""); // Ensure x.com is not prepended more than once

    // Correct if repeated 'x.com/' is part of the input
    const parts = normalized.split("/");
    if (parts[0] === "x.com") {
      // Use the part after the first 'x.com/'
      return `x.com/${parts.slice(1).join("/")}`;
    }

    return `x.com/${normalized}`;
  };

  const formatTelegram = (handle) => {
    // Remove any existing URL parts and standardize to "t.me/user"
    return `t.me/${handle
      .replace(/^(?:https?:\/\/)?(?:www\.)?t\.me\//i, "")
      .replace(/^t\.me\//i, "")}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;
    if (name === "website") formattedValue = formatWebsite(value);
    if (name === "twitter") formattedValue = formatTwitter(value);
    if (name === "telegram") formattedValue = formatTelegram(value);
    setTokenDetails({ ...tokenDetails, [name]: formattedValue });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const tokenDoc = doc(firestore, "tokens", contractAddress);
    await updateDoc(tokenDoc, tokenDetails);
    setIsLoading(false);
    alert("Token details updated successfully!");
  };

  return (
    <div>
      <Header
        connectWallet={connectWallet}
        isConnected={isConnected}
        chainId={chainId}
      />
      <div className="center-container">
        <div className="factory-container">
          <h1>Update your Token Details</h1>
          {isLoaded ? (
            <form onSubmit={handleUpdate} className="token-form">
              <input
                className="input"
                name="website"
                type="text"
                value={tokenDetails.website}
                onChange={handleChange}
                placeholder="Website URL"
              />
              <input
                className="input"
                name="twitter"
                type="text"
                value={tokenDetails.twitter}
                onChange={handleChange}
                placeholder="Twitter URL"
              />
              <input
                className="input"
                name="telegram"
                type="text"
                value={tokenDetails.telegram}
                onChange={handleChange}
                placeholder="Telegram URL"
              />
              <button
                className="deploy-button"
                type="submit"
                disabled={isLoading || connectedWallet !== deployer}
              >
                {isLoading ? "Updating..." : "Update Details"}
              </button>
            </form>
          ) : (
            <p>Loading token details...</p>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default AfterLaunch;
