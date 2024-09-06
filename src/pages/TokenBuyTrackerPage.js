import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import Header2 from "../components/Header2.js";
import Footer from "../components/Footer.js";
import "./TokenBuyTrackerPage.css";
// Remove unused imports
// import { collection, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { firestore } from "../components/firebaseConfig.js";
import { useWeb3ModalAccount, useWeb3Modal } from "@web3modal/ethers/react";
import { doc, updateDoc, increment, runTransaction } from "firebase/firestore";
/* global BigInt */

const TOKEN_ADDRESS = "0x02A54dD4ED8A088935486f435B1b686172e1AbA7"; // Replace with your token address

const TokenBuyTrackerPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { chainId, isConnected } = useWeb3ModalAccount();
  const { open } = useWeb3Modal();

  const DECIMALS = 18;

  const provider = new ethers.BrowserProvider(window.ethereum);

  function hexToEther(hex) {
    const bigIntValue = BigInt(hex);
    return ethers.formatUnits(bigIntValue, 18); // Convert Wei to Ether
  }

  const connectWallet = async () => {
    try {
      await open();
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  };

  const fetchBlockTimestamp = async (blockNumber) => {
    const block = await provider.getBlock(blockNumber);
    return block.timestamp;
  };

  const fetchTokenTransfers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_BASE_API_KEY}`,

        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            id: 1,
            jsonrpc: "2.0",
            method: "alchemy_getAssetTransfers",
            params: [
              {
                fromBlock: "0x0",
                toBlock: "latest",
                contractAddresses: [TOKEN_ADDRESS],
                fromAddress: "0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad",
                category: ["erc20"],
                order: "desc",
                excludeZeroValue: true,
                withMetadata: true,
              },
            ],
          }),
        }
      );

      const data = await response.json();
      if (
        data &&
        data.result &&
        data.result.transfers &&
        data.result.transfers.length > 0
      ) {
        const filteredTransfers = data.result.transfers
          .filter(
            (tx) =>
              tx.to.toLowerCase() !==
              "0x5d64d14d2cf4fe5fe4e65b1c7e3d11e18d493091"
          )
          .map((tx) => ({
            ...tx,
            to: tx.to.toUpperCase(),
          }));

        const transactionsWithLogs = await Promise.all(
          filteredTransfers.map(async (tx) => {
            const receipt = await provider.getTransactionReceipt(tx.hash);
            const firstLog = receipt.logs[0]
              ? {
                  address: receipt.logs[0].address,
                  data: hexToEther(receipt.logs[0].data),
                }
              : null;

            const timestamp = await fetchBlockTimestamp(tx.blockNum);

            return { ...tx, firstLog, timestamp };
          })
        );

        const validTransactions = transactionsWithLogs.filter(
          (tx) => tx.firstLog && parseFloat(tx.firstLog.data) > 0.000091
        );

        setTransactions((prevTransactions) => {
          // Ensure no duplicate transactions
          const newTransactions = validTransactions.filter(
            (newTx) => !prevTransactions.some((tx) => tx.hash === newTx.hash)
          );
          return [...prevTransactions, ...newTransactions];
        });

        for (const tx of validTransactions) {
          saveTransaction(tx);
        }
      } else {
        setError("No transactions found.");
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setError("Failed to fetch transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTokenTransfers();
  }, [fetchTokenTransfers]);

  const saveTransaction = async (tx) => {
    const txDocRef = doc(firestore, "transactions", tx.hash);
    try {
      await runTransaction(firestore, async (transaction) => {
        const txDoc = await transaction.get(txDocRef);
        if (!txDoc.exists()) {
          transaction.set(txDocRef, {
            hash: tx.hash,
            to: tx.to.toUpperCase(),
            amount: tx.firstLog ? [{ data: tx.firstLog.data }] : [],
            timestamp: tx.timestamp,
          });
          console.log("Transaction saved:", tx.hash);
          // Update points
          await updatePoints(tx.to, parseFloat(tx.firstLog.data));
        } else {
          console.log(
            "Transaction already exists, skipping points update:",
            tx.hash
          );
        }
      });
    } catch (error) {
      console.error("Transaction failure:", error);
    }
  };

  const updatePoints = async (to, amount) => {
    console.log("Attempting to update points for:", to); // Log every attempt
    const userPointsDoc = doc(firestore, "userPoints", to.toUpperCase()); // Normalize the address format
    const pointsToAdd = Math.floor(amount * 1000); // Increment points based on the amount (e.g., 1 point per 0.001 ETH)

    try {
      console.log("Incrementing points for wallet:", to);
      await runTransaction(firestore, async (transaction) => {
        const userPointsSnapshot = await transaction.get(userPointsDoc);
        if (userPointsSnapshot.exists()) {
          transaction.update(userPointsDoc, { points: increment(pointsToAdd) });
        } else {
          transaction.set(userPointsDoc, { points: pointsToAdd });
        }
      });
      console.log("Points successfully incremented for wallet:", to);
    } catch (error) {
      console.error("Failed to increment points for wallet:", to, error);
    }
  };

  return (
    <div>
      <Header2
        connectWallet={connectWallet}
        isConnected={isConnected}
        chainId={chainId}
      />
      <div className="center2-container">
        <div className="transactions-container">
          <h1 className="titlestake">Token Buy Tracker Page</h1>
          {loading && <p>Loading transactions...</p>}
          {error && <p>Error: {error}</p>}
          <table className="custom-table">
            <thead>
              <tr>
                <th>From</th>
                <th>To</th>
                <th>Amount (ETH)</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.hash}>
                  <td>{tx.from}</td>
                  <td>{tx.to}</td>
                  <td>
                    {tx.firstLog ? <div>{tx.firstLog.data}</div> : "No logs"}
                  </td>
                  <td>{new Date(tx.timestamp * 1000).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default TokenBuyTrackerPage;
