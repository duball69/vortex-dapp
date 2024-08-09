import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { firestore } from "../components/firebaseConfig.js";
import { FaTwitter, FaXTwitter, FaTelegram, FaGlobe } from "react-icons/fa6";
import "./TokenListTable.css";

function TokensListTable({ limit }) {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState("newest");
  const [sortBy, setSortBy] = useState("date");
  const [selectedChain, setSelectedChain] = useState("all");
  const [showFilterOptions, setShowFilterOptions] = useState(false);

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

        const sortedTokens = tokensArray.sort(
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
        case "website":
          return order === "asc"
            ? (a.website ? 1 : 0) - (b.website ? 1 : 0)
            : (b.website ? 1 : 0) - (a.website ? 1 : 0);
        case "telegram":
          return order === "asc"
            ? (a.telegram ? 1 : 0) - (b.telegram ? 1 : 0)
            : (b.telegram ? 1 : 0) - (a.telegram ? 1 : 0);
        default:
          return 0;
      }
    });
    setTokens(sorted);
    setSortBy(by);
    setSortOrder(order);
  };

  const filterByChain = (chain) => {
    setSelectedChain(chain);
    setShowFilterOptions(false); // Hide filter options after selecting a chain
  };

  if (loading) return <p>Loading tokens...</p>;
  if (!tokens.length) return <p>No tokens found.</p>;

  const filteredTokens =
    selectedChain === "all"
      ? tokens
      : tokens.filter((token) => token.chain === selectedChain);

  const displayedTokens = limit
    ? filteredTokens.slice(0, limit)
    : filteredTokens;

  return (
    <div className="tokens-container">
      <h3 className="deployedtokenstitle">Deployed Tokens</h3>
      <h5 className="subtitletokens">Choose a token and start trading</h5>
      <div className="sort-container">
        <button
          onClick={() =>
            sortTokens("date", sortOrder === "newest" ? "oldest" : "newest")
          }
        >
          Sort by {sortOrder === "newest" ? "Oldest" : "Newest" ? "↓" : "↑"}
        </button>
        <div className="filter-container">
          <button onClick={() => setShowFilterOptions(!showFilterOptions)}>
            Filter by Chain
          </button>
          {showFilterOptions && (
            <div className="filter-options">
              <button onClick={() => filterByChain("all")}>All Chains</button>
              <button onClick={() => filterByChain("Sepolia")}>Sepolia</button>
              <button onClick={() => filterByChain("Base")}>Base</button>
              <button onClick={() => filterByChain("BSC")}>BSC</button>
              <button onClick={() => filterByChain("Optimism")}>OP</button>
              <button onClick={() => filterByChain("Arbitrum")}>
                Arbitrum{" "}
              </button>
              <button onClick={() => filterByChain("Blast")}>Blast</button>
            </div>
          )}
        </div>
        <button
          onClick={() =>
            sortTokens("website", sortOrder === "asc" ? "desc" : "asc")
          }
        >
          Sort by Website {sortOrder === "asc" ? "↓" : "↑"}
        </button>
      </div>
      <table className="tokens-table">
        <thead>
          <tr>
            <th>Image</th>
            <th>Name</th>
            <th>Contract Address</th>
            <th>Chain</th>
            <th>Created</th>
            <th>Website</th>
            <th>Twitter</th>
            <th>Telegram</th>
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
              <td>{token.address}</td>
              <td>{token.chain}</td>
              <td>
                {token.timestamp ? token.timestamp.toLocaleDateString() : "N/A"}
              </td>
              <td>
                {token.website && (
                  <a
                    href={`https://${token.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FaGlobe className="icon2" />
                  </a>
                )}
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
              <td>
                {token.telegram && (
                  <a
                    href={`https://${token.telegram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FaTelegram className="icon2" />
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
    </div>
  );
}

export default TokensListTable;
