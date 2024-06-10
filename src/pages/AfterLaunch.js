import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { firestore } from "../components/firebaseConfig";
import Header from "../components/Header.js";
import Footer from "../components/Footer.js";
import {
  createWeb3Modal,
  defaultConfig,
  useWeb3Modal,
  useWeb3ModalAccount,
} from "@web3modal/ethers/react";

function AfterLaunch() {
  const {
    address: connectedWallet,
    chainId,
    isConnected,
  } = useWeb3ModalAccount();
  const { open } = useWeb3Modal(); // Assumed the right hook provides this function
  const { contractAddress } = useParams();
  const [tokenDetails, setTokenDetails] = useState({
    website: "",
    twitter: "",
    telegram: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Fetch token details from Firestore
  useEffect(() => {
    const fetchTokenDetails = async () => {
      const tokenDoc = doc(firestore, "tokens", contractAddress);
      const docSnap = await getDoc(tokenDoc);

      if (docSnap.exists()) {
        setTokenDetails(docSnap.data());
        setIsLoaded(true);
      } else {
        console.log("No such document!");
      }
    };

    fetchTokenDetails();
  }, [contractAddress]);

  const connectWallet = async () => {
    try {
      await open(); // Assuming 'open' is similar to 'connect' or the correct method to initiate connection
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  // Handle the form submission
  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const tokenDoc = doc(firestore, "tokens", contractAddress);
    await updateDoc(tokenDoc, {
      website: tokenDetails.website,
      twitter: tokenDetails.twitter,
      telegram: tokenDetails.telegram,
    });

    setIsLoading(false);
    alert("Token details updated successfully!");
  };

  const handleChange = (e) => {
    setTokenDetails({ ...tokenDetails, [e.target.name]: e.target.value });
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
                disabled={isLoading}
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
