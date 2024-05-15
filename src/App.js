// App.js

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/Dashboard';
import FactoryPage from './pages/FactoryPage';
import { Web3ModalProvider } from './Web3ModalContext';

function App() {
  return (
    <Web3ModalProvider>
    <Router>
      <Routes>
      <Route path="/dashboard/:contractAddress" element={DashboardPage} />
        <Route path="/" element={<HomePage />} />
        <Route path="/factory" element={<FactoryPage />} />
      </Routes>
    </Router>
    </Web3ModalProvider>
  );

}
export default App;
