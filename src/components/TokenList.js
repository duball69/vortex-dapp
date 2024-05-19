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
                // Create a query against the collection.
                const tokensRef = collection(firestore, 'tokens');
                const q = query(tokensRef, where("hasImage", "==", true)); // Only fetch tokens with images
        
                const querySnapshot = await getDocs(q);
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
            <h1>Deployed Tokens</h1>
            <div className="tokens-grid">
                {tokens.map(token => (
                    <div key={token.id} className="token-card">
                        {token.imageUrl && (
                            <img src={token.imageUrl} alt={token.name} className="token-image" />
                        )}
                        <div className="token-info">
                            <h2 className="token-title">{token.name} ({token.symbol})</h2>
                            <p className="token-supply">Supply: {token.supply}</p>
                            <p className="token-deployer">Deployed by: {token.deployer}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default TokensList;
