import React from "react";
import TokenListTable from "../components/TokenListTable.js";
import Header2 from "../components/Header2.js";
import Footer from "../components/Footer.js";

function TokensPage() {
  return (
    <div>
      <Header2 />
      <TokenListTable />
      <Footer />
    </div>
  );
}

export default TokensPage;
