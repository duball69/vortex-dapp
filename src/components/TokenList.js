import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { firestore } from '../components/firebaseConfig.js';
import './TokenList.css'; // Assuming you have a separate CSS file

function TokensList() {
    const [tokens, setTokens] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTokens = async () => {
            try {
                const querySnapshot = await getDocs(collection(firestore, 'tokens'));
                const tokensArray = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setTokens(tokensArray);
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

    return (
        <div className="tokens-container">
            <h3 className="deployedtokenstitle">Deployed Tokens</h3>
            <div className="tokens-grid">
                {tokens.map(token => (
                    <div key={token.id} className="token-card">
                        {token.imageUrl && (
                            <img src={token.imageUrl} alt={token.name} className="token-image" />
                        )}
                        <div className="token-info">
                            <h2 className="token-title">{token.name} ({token.symbol})</h2>
                            <h4 className="token-deployer">Contract Address: {token.address}</h4>
                          
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default TokensList;
