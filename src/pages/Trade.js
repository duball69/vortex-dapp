import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import TokenSwapperJson from "../contracts/TokenSwapper.json";
import {
  createWeb3Modal,
  defaultConfig,
  useWeb3Modal,
  useWeb3ModalAccount,
} from "@web3modal/ethers/react";
import Header from "../components/Header.js";
import Footer from "../components/Footer.js";

function Trade() {
  const [connectedWallet, setConnectedWallet] = useState("");
  const [chainId, setChainId] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState("");
  const { open, close } = useWeb3Modal();

  const {
    address,
    chainId: currentChainId,
    isConnected: isWeb3Connected,
  } = useWeb3ModalAccount();

  useEffect(() => {
    if (isWeb3Connected) {
      setIsConnected(true);
      setConnectedWallet(address);
      setChainId(currentChainId);
    } else {
      setIsConnected(false);
      setConnectedWallet("");
      setChainId("");
    }
  }, [isWeb3Connected, address, currentChainId]);

  async function connectWallet() {
    try {
      await open(); // Open the Web3Modal modal
      console.log("Connected to chain:", chainId); // chainId might not be set immediately after open, so it might be undefined here
      setError("");
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  }

  async function swapTokens(tokenIn, amountIn, tokenOut) {
    try {
      // Initialize Web3Provider with window.ethereum
      const provider = new ethers.BrowserProvider(window.ethereum);

      // Get the signer from the provider
      const signer = provider.getSigner();

      // Contract address (replace with your actual contract address)
      const contractAddress = "0xBC654faA6482Bf9ed58750E1b6712934e1b5C1E7";

      // Instantiate the contract
      const contract = new ethers.Contract(
        contractAddress,
        TokenSwapperJson.abi,
        signer
      );

      // Convert amountIn to wei if needed (assuming token has 18 decimals)
      const amountInWei = ethers.parseUnits(amountIn, 18);

      // Example swap function call
      const tx = await contract.swapTokens(tokenIn, amountInWei, tokenOut);
      await tx.wait();
      console.log("Swap successful. Transaction hash:", tx.hash);
      // Handle successful swap
    } catch (error) {
      console.error("Swap tokens error:", error);
      setError(`Error swapping tokens: ${error.message}`);
      // Handle error
    }
  }

  return (
    <div>
      <Header
        connectWallet={connectWallet}
        isConnected={isConnected}
        chainId={chainId}
      />

      <div className="centered-content">
        {isConnected ? (
          <div>
            <h2>Connected Wallet: {connectedWallet}</h2>
            <div>
              <div>
                <h2>Swap Tokens</h2>
                <label>Token In Address:</label>
                <input
                  type="text"
                  id="tokenInAddress"
                  placeholder="Token In Address"
                />

                <label>Amount to Swap:</label>
                <input
                  type="text"
                  id="swapAmount"
                  placeholder="Amount (e.g., 1.0)"
                />

                <label>Token Out Address:</label>
                <input
                  type="text"
                  id="tokenOutAddress"
                  placeholder="Token Out Address"
                />

                <button
                  onClick={() =>
                    swapTokens(
                      document.getElementById("tokenInAddress").value,
                      document.getElementById("swapAmount").value,
                      document.getElementById("tokenOutAddress").value
                    )
                  }
                >
                  Swap
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <p>Please connect your wallet to trade tokens.</p>
            <button onClick={connectWallet}>Connect Wallet</button>
          </div>
        )}
        {error && <p className="error-message">{error}</p>}
      </div>

      <Footer />
    </div>
  );
}

export default Trade;
