import React, { useEffect, useState } from "react";
import Header from "../components/Header.js";
import Footer from "../components/Footer.js";
import "./TokenBuyTrackerPage.css";
import { firestore } from "../components/firebaseConfig.js";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  increment,
  runTransaction,
  exists,
  gt,
} from "firebase/firestore";

const TOKEN_ADDRESS = "0x02A54dD4ED8A088935486f435B1b686172e1AbA7"; // Replace with your token address
const ALCHEMY_API_KEY = "szbuLvp-G7QOedbNPfL89Fn78DgCJqGh"; // Replace with your Alchemy API key

const TokenBuyTrackerPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const DECIMALS = 18;

  function formatTokenValue(rawValue) {
    const factor = Math.pow(1, DECIMALS);
    const value = rawValue / factor; // Adjust raw value by the token's decimals
    return Number(value.toFixed(3)); // Convert to number again to remove any trailing zeros
  }

  useEffect(() => {
    const fetchTokenTransfers = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
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

          setTransactions(filteredTransfers);

          for (const tx of filteredTransfers) {
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

    fetchTokenTransfers();
  }, []);

  const saveTransaction = async (tx) => {
    const txDocRef = doc(firestore, "transactions", tx.hash);
    try {
      await runTransaction(firestore, async (transaction) => {
        const txDoc = await transaction.get(txDocRef);
        if (!txDoc.exists()) {
          transaction.set(txDocRef, {
            hash: tx.hash,
            to: tx.to.toUpperCase(),
          });
          console.log("Transaction saved:", tx.hash);
          // Update points
          await updatePoints(tx.to, tx.hash);
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

  const updatePoints = async (to) => {
    console.log("Attempting to update points for:", to); // Log every attempt
    const userPointsDoc = doc(firestore, "userPoints", to.toUpperCase()); // Normalize the address format

    try {
      console.log("Incrementing points for wallet:", to);
      await updateDoc(userPointsDoc, { points: increment(1) });
      console.log("Points successfully incremented for wallet:", to);
    } catch (error) {
      console.error("Failed to increment points for wallet:", to, error);
    }
  };

  return (
    <div>
      <Header />
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
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.hash}>
                  <td>{tx.from}</td>
                  <td>{tx.to}</td>
                  <td>{formatTokenValue(tx.value)}</td>
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
