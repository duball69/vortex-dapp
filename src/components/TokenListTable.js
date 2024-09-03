import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { firestore } from "../components/firebaseConfig.js";
import { FaTwitter, FaXTwitter } from "react-icons/fa6";
import axios from "axios";
import "./TokenListTable.css";

function TokensListTable({ limit }) {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState("newest");
  const [sortBy, setSortBy] = useState("date");
  const [selectedChain, setSelectedChain] = useState("all");
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const tokensPerPage = 10;

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const querySnapshot = await getDocs(collection(firestore, "tokens"));
        const tokensArray = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            timestamp: data.timestamp ? data.timestamp.toDate() : null,
          };
        });

        // Fetch price, market cap, and volume data from DEX Screener API
        const updatedTokensArray = await Promise.all(
          tokensArray.map(async (token) => {
            try {
              const response = await axios.get(
                `https://api.dexscreener.com/latest/dex/tokens/${token.address}`
              );

              const pairData = response.data.pairs
                ? response.data.pairs[0]
                : null;
              const price = pairData?.priceUsd || "N/A";
              const marketCap =
                price !== "N/A" && token.supply
                  ? (price * token.supply).toFixed(2)
                  : "N/A";

              return {
                ...token,
                price,
                volume24h: pairData?.volume.h24 || "N/A",
                marketCap,
              };
            } catch (error) {
              console.error(
                `Error fetching data for token ${token.address}:`,
                error
              );
              return {
                ...token,
                price: "N/A",
                volume24h: "N/A",
                marketCap: "N/A",
              };
            }
          })
        );

        // Sorting tokens by date (newest to oldest) by default
        const sortedTokens = updatedTokensArray.sort(
          (a, b) => b.timestamp - a.timestamp
        );

        setTokens(sortedTokens);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching tokens:", error);
        setLoading(false);
      }
    };

    fetchTokens();
  }, []);

  const sortTokens = (by, order) => {
    const sorted = [...tokens].sort((a, b) => {
      switch (by) {
        case "date":
          return order === "newest"
            ? b.timestamp - a.timestamp
            : a.timestamp - b.timestamp;
        case "marketCap":
          return order === "desc"
            ? b.marketCap - a.marketCap
            : a.marketCap - b.marketCap;
        case "volume":
          return order === "desc"
            ? b.volume24h - a.volume24h
            : a.volume24h - b.volume24h;
        default:
          return 0;
      }
    });
    setTokens(sorted);
    setSortBy(by);
    setSortOrder(order);
    setCurrentPage(1); // Reset to the first page when sorting
  };

  const filterByChain = (chain) => {
    setSelectedChain(chain);
    setShowFilterOptions(false);
    setCurrentPage(1); // Reset to the first page when filtering
  };

  const handleNextPage = () => {
    setCurrentPage((prevPage) => Math.min(prevPage + 1, totalPages));
  };

  const handlePreviousPage = () => {
    setCurrentPage((prevPage) => Math.max(prevPage - 1, 1));
  };

  const copyToClipboard = () => {
    const address = document.getElementById("contractAddress").innerText;
    navigator.clipboard
      .writeText(address)
      .then(() => {
        alert("Contract address copied to clipboard!");
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
      });
  };

  if (loading)
    return (
      <div className="loading-container">
        <p>Loading tokens...</p>
      </div>
    );
  if (!tokens.length) return <p>No tokens found.</p>;

  const filteredTokens =
    selectedChain === "all"
      ? tokens
      : tokens.filter((token) => token.chain === selectedChain);

  const displayedTokens = filteredTokens.slice(
    (currentPage - 1) * tokensPerPage,
    currentPage * tokensPerPage
  );

  const totalPages = Math.ceil(filteredTokens.length / tokensPerPage);

  return (
    <div className="tokens-container">
      <h3 className="deployedtokenstitle">Deployed Tokens</h3>
      <h5 className="subtitletokens">Choose a token and start trading</h5>
      <div className="sort-container">
        <button
          className="sort-button"
          onClick={() =>
            sortTokens("date", sortOrder === "newest" ? "oldest" : "newest")
          }
        >
          Sort by {sortOrder === "newest" ? "Oldest" : "Newest"} ↓
        </button>
        <div className="filter-container">
          <button
            className="filter-button"
            onClick={() => setShowFilterOptions(!showFilterOptions)}
          >
            Filter by Chain
          </button>
          {showFilterOptions && (
            <div className="filter-options">
              <button
                className="chain-list"
                onClick={() => filterByChain("all")}
              >
                All Chains
              </button>
              <button
                className="chain-list"
                onClick={() => filterByChain("Sepolia")}
              >
                Sepolia
              </button>
              <button
                className="chain-list"
                onClick={() => filterByChain("Base")}
              >
                Base
              </button>
              <button
                className="chain-list"
                onClick={() => filterByChain("BSC")}
              >
                BSC
              </button>
              <button
                className="chain-list"
                onClick={() => filterByChain("Optimism")}
              >
                OP
              </button>
              <button
                className="chain-list"
                onClick={() => filterByChain("Arbitrum")}
              >
                Arbitrum
              </button>
              <button
                className="chain-list"
                onClick={() => filterByChain("Blast")}
              >
                Blast
              </button>
            </div>
          )}
        </div>
      </div>
      <table className="tokens-table">
        <thead>
          <tr>
            <th>Logo</th>
            <th>Name</th>
            <th>Contract Address</th>
            <th>Chain</th>
            <th>Created</th>
            <th>Market Cap</th>
            <th>24h Volume</th>
            <th>Socials</th>
            <th>Trade</th>
          </tr>
        </thead>
        <tbody>
          {displayedTokens.map((token) => (
            <tr key={token.id}>
              <td>
                {token.imageUrl && (
                  <img
                    src={token.imageUrl}
                    alt={token.name}
                    className="token-image"
                  />
                )}
              </td>
              <td>
                {token.name} ({token.symbol})
              </td>
              <td className="address-cell">
                <span id="contractAddress">{token.address}</span>{" "}
                <button
                  className="copy-button"
                  onClick={() => copyToClipboard(token.address)}
                >
                  Copy
                </button>
                {/* Display the contract address */}
              </td>
              <td>{token.chain}</td>
              <td>
                {token.timestamp ? token.timestamp.toLocaleDateString() : "N/A"}
              </td>
              <td>
                {token.marketCap !== "N/A"
                  ? `$${token.marketCap.toLocaleString()}`
                  : "N/A"}
              </td>
              <td>
                {token.volume24h !== "N/A"
                  ? `$${token.volume24h.toLocaleString()}`
                  : "N/A"}
              </td>
              <td>
                {token.twitter && (
                  <a
                    href={`https://${token.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FaXTwitter className="icon2" />
                  </a>
                )}
              </td>
              <td className="trade-button-cell">
                <button
                  className="trade-button"
                  onClick={() =>
                    (window.location.href = `/trading/${token.chain}/${token.address}`)
                  }
                >
                  Trade
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="pagination">
        <button
          className="page-button"
          onClick={handlePreviousPage}
          disabled={currentPage === 1}
        >
          ← Previous
        </button>
        <span className="page-info">
          Page {currentPage} of {totalPages}
        </span>
        <button
          className="page-button"
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
        >
          Next →
        </button>
      </div>
    </div>
  );
}

export default TokensListTable;
