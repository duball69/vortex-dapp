// App.js

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import StakingPage from "./pages/StakingPage";
import DashboardPage from "./pages/Dashboard";
import FactoryPage from "./pages/FactoryPage";
import PointsPage from "./pages/Points";
import TaskPage from "./pages/Task";
import AfterLaunch from "./pages/AfterLaunch";
import TokensPage from "./pages/TokenListPage";
import CombinedFactoryDashboard from "./pages/Launch";

import Trading from "./pages/Trading";
import { Web3ModalProvider } from "./Web3ModalContext";

function App() {
  return (
    <Web3ModalProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/factory" element={<FactoryPage />} />
          <Route path="/launch" element={<CombinedFactoryDashboard />} />
          <Route path="/points" element={<PointsPage />} />
          <Route path="/tasks" element={<TaskPage />} />
          <Route
            path="/dashboard/:contractAddress"
            element={<DashboardPage />}
          />

          <Route path="/tokens" element={<TokensPage />} />

          <Route path="/token/:contractAddress" element={<AfterLaunch />} />
          <Route
            path="/trading/:chain/:contractAddress"
            element={<Trading />}
          />
          <Route path="/staking" element={<StakingPage />} />
        </Routes>
      </Router>
    </Web3ModalProvider>
  );
}
export default App;
