import Header from "../components/Header.js";
import Footer from "../components/Footer.js";
import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import "./Points.css"; // Ensure the CSS file matches the updated naming convention

// Add your Referral contract ABI and address here
const referralContractABI = [
  /* ABI JSON here */
];
const referralContractAddress = "0xYourContractAddressHere";

const PointsPage = () => {
  const [points, setPoints] = useState(0);
  const [referralLink, setReferralLink] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);

  // Initialize Ethers.js
  useEffect(() => {
    const initEthers = async () => {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contr = new ethers.Contract(
          referralContractAddress,
          referralContractABI,
          signer
        );

        setProvider(provider);
        setSigner(signer);
        setContract(contr);

        try {
          const address = await signer.getAddress();
          setWalletAddress(address);
          setReferralLink(`${window.location.origin}/?ref=${address}`);
          await fetchUserPoints(address, contr);
        } catch (error) {
          console.error("Error fetching wallet address:", error);
        }
      } else {
        alert("Please install MetaMask!");
      }
    };

    initEthers();
  }, []);

  // Fetch user points from the contract
  const fetchUserPoints = async (address, contractInstance) => {
    try {
      setLoading(true);
      const userPoints = await contractInstance.referralPoints(address);
      setPoints(userPoints.toNumber());
    } catch (error) {
      console.error("Error fetching points:", error);
    } finally {
      setLoading(false);
    }
  };

  // Copy referral link to clipboard
  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink).then(() => {
      alert("Referral link copied to clipboard!");
    });
  };

  return (
    <div>
      <Header />
      <div>
        <h1 className="titlefactory">Points Page</h1>
        <h3 className="subtitlefactory">
          Check your points and share your referral link
        </h3>
      </div>
      <div className="center-container">
        <div className="points-page-container">
          <div className="points-box">
            <h2>Your Points</h2>
            {loading ? (
              <p>Loading points...</p>
            ) : (
              <p>
                You have <strong>{points}</strong> points!
              </p>
            )}
            <p>
              Earn more points by completing tasks and engaging with the Vortex
              ecosystem.
            </p>
            <button onClick={() => (window.location.href = "/tasks")}>
              View Tasks
            </button>
          </div>

          <div className="referral-box">
            <h2>Share Your Referral Link</h2>
            <p>
              Invite others using your unique referral link and earn rewards! By
              sharing your link, you can earn more points, receive 10% of the
              trading volume from tokens launched through your link, and get 10%
              of the APY rewards.
            </p>
            <div className="referral-link">
              <input type="text" value={referralLink} readOnly />
            </div>

            <button className="copy-button" onClick={copyReferralLink}>
              Copy
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PointsPage;
