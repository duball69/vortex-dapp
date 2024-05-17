import React from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css'; // Import the CSS file for styling
import Header from '../components/Header.js';


function HomePage() {
  return (
 
    
    <div> 
    <Header/>
      
      <div className="centered-content">
      <h1>Create your own token with 1 ETH of LP</h1>
      <p>We help you create tokens with low costs and add 1 ETH to launch your coin!</p>
      <Link to="/factory" className="start-button">Let's Start</Link>
    </div>
    </div>
 
  );
}

export default HomePage;
