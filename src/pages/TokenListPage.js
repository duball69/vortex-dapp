import React from "react";
import TokenListTable from "../components/TokenListTable.js";
import Header from "../components/Header.js";
import Footer from "../components/Footer.js";

function TokensPage() {
  return (
    <div>
      <Header />
      <TokenListTable />
      <Footer />
    </div>
  );
}

export default TokensPage;
