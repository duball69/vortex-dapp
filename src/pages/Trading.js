import React from "react";
import TokenList from "../components/TokenList.js";
import Header from "../components/Header.js";
import Footer from "../components/Footer.js";

function Trading() {
  return (
    <div>
      <iframe
        id="dextswap-aggregator-widget"
        title="DEXTswap Aggregator"
        width="400"
        height="420"
        src="https://www.dextools.io/widget-aggregator/en/swap/eth/0x46a33b1f48027aaae3c70a5a870b5d5cda52482b"
      ></iframe>
      <iframe
        id="dextools-widget"
        title="DEXTools Trading Chart"
        width="500"
        height="400"
        src="https://www.dextools.io/widget-chart/en/ether/pe-dark/0x7e1d7905bd724c03aae9707bf6a71e7a7bb930c5?theme=light&chartType=2&chartResolution=30&drawingToolbars=false"
      ></iframe>
    </div>
  );
}

export default Trading;
