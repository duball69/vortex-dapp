  import React from 'react';
import { Link } from 'react-router-dom';

function HomePage() {
 

  return (
    <div>
      <h1>Create your own token with 1 ETH of LP</h1>
      <p>We help you create tokens with low costs and add 1 ETH to launch your memecoin!</p>
    
      <Link to="/factory">Let's Start</Link></div>
  );
}

export default HomePage;
