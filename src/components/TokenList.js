import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { firestore } from "../components/firebaseConfig.js";
import { FaTwitter, FaXTwitter, FaTelegram, FaGlobe } from "react-icons/fa6";
import axios from "axios";
import "./TokenList.css";

function TokensList({ limit }) {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <p>Loading tokens...</p>;
  if (!tokens.length) return <p>No tokens found.</p>;

  const displayedTokens = limit ? tokens.slice(0, limit) : tokens;

  return (
    <div className="tokens-container">
      <h3 className="deployedtokenstitle">Deployed Tokens</h3>
      <h5 className="subtitletokens">Trade them directly on Uniswap</h5>
      <div className="tokens-grid">
        {displayedTokens.map((token) => (
          <div key={token.id} className="token-card">
            {token.imageUrl && (
              <img
                src={token.imageUrl}
                alt={token.name}
                className="token-image"
              />
            )}
            <div className="token-info">
              <h2 className="token-title">
                {token.name} ({token.symbol})
              </h2>
              <h4 className="token-deployer contract-address">
                Contract Address: {token.address}
              </h4>
              <div className="token-details">
                <h4 className="token-detail">Chain: {token.chain}</h4>
                <h4 className="token-detail">
                  Market Cap:{" "}
                  {token.marketCap !== "N/A"
                    ? `$${token.marketCap.toLocaleString()}`
                    : "N/A"}
                </h4>
                <h4 className="token-detail">
                  24h Volume:{" "}
                  {token.volume24h !== "N/A"
                    ? `$${token.volume24h.toLocaleString()}`
                    : "N/A"}
                </h4>
              </div>
              <div className="social-links">
                {token.website && (
                  <a
                    href={`https://${token.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="icon-link2"
                  >
                    <FaGlobe className="icon2" />
                  </a>
                )}
                {token.twitter && (
                  <a
                    href={`https://${token.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="icon-link2"
                  >
                    <FaXTwitter className="icon2" />
                  </a>
                )}
                {token.telegram && (
                  <a
                    href={`https://${token.telegram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="icon-link2"
                  >
                    <FaTelegram className="icon2" />
                  </a>
                )}
              </div>
              <button
                className="trade-button"
                onClick={() =>
                  (window.location.href = `/trading/${token.chain}/${token.address}`)
                }
              >
                Trade
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TokensList;
