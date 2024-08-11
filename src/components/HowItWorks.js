import React from "react";
import "./HowItWorks.css"; // Ensure the CSS is linked correctly

const HowItWorks = () => {
  return (
    <div className="center-container">
      <div className="how-it-works">
        <h2 className="titlefactory">How Vortex Works</h2>
        <div className="steps-container">
          <div className="step-box">
            Connect your <br /> wallet.
          </div>
          <div className="step-box">
            Select your new <br /> token details.
          </div>
          <div className="step-box">
            Click to deploy your token with initial liquidity.
          </div>
          <div className="step-box">
            Manage your token directly from the dashboard.
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;
