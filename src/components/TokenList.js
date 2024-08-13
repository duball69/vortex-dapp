import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { firestore } from "../components/firebaseConfig.js";
import { FaTwitter, FaXTwitter, FaTelegram, FaGlobe } from "react-icons/fa6";
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
            timestamp: data.timestamp ? data.timestamp.toDate() : null, // Convert Firestore Timestamp to JavaScript Date
          };
        });

        // Sort tokens by timestamp in descending order (most recent first)
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
              <h4 className="token-deployer">
                Contract Address: {token.address}
              </h4>
              <h4 className="token-deployer">Chain: {token.chain}</h4>
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
