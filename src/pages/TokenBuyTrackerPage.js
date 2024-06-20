import React, { useEffect, useState } from "react";
import Header from "../components/Header.js";
import Footer from "../components/Footer.js";
import "./TokenBuyTrackerPage.css";

const TOKEN_ADDRESS = "0x02A54dD4ED8A088935486f435B1b686172e1AbA7"; // Replace with your token address
const ALCHEMY_API_KEY = "szbuLvp-G7QOedbNPfL89Fn78DgCJqGh"; // Replace with your Alchemy API key

const TokenBuyTrackerPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTokenTransfers = async () => {
      setLoading(true);
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
                  toAddress: TOKEN_ADDRESS,
                  category: ["external", "erc20"], // Include only external ERC-20 transfers
                  order: "desc", // Newest transactions first
                  excludeZeroValue: true, // Exclude zero value transfers
                },
              ],
            }),
          }
        );

        const data = await response.json();
        console.log("Alchemy API Response:", data);

        if (data.result && Array.isArray(data.result.transfers)) {
          setTransactions(data.result.transfers); // Set transactions if valid array
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

  return (
    <div>
      <Header />
      <div className="center2-container">
        <div className="staking-container">
          <h1 className="titlestake">Token Buy Tracker Page</h1>
          {loading && <p>Loading transactions...</p>}
          {error && <p>Error: {error}</p>}
          <table className="custom-table">
            <thead>
              <tr>
                <th>Transaction Hash</th>
                <th>Type</th>
                <th>Method</th>
                <th>Age</th>
                <th>From</th>
                <th>To</th>
                <th>Amount</th>
                <th>Asset</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.transactionHash}>
                  <td>{tx.transactionHash}</td>
                  <td>ERC-20</td>
                  <td>{tx.method}</td>
                  <td>{new Date(tx.blockTimestamp * 1000).toLocaleString()}</td>
                  <td>{tx.from}</td>
                  <td>{tx.to}</td>
                  <td>{tx.value}</td>
                  <td>{tx.tokenSymbol}</td>
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
