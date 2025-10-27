import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import AuctionList from './pages/AuctionList';
import AuctionDetail from './pages/AuctionDetail';
import CreateAuction from './pages/CreateAuction';
import Navbar from './components/Navbar';
import { useAuth } from './hooks/useAuth';

function ProtectedRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/auth" />;
}

function App() {
  return (
    <Router>
      <div className="min-h-screen">
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Navbar />
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/auctions" element={<AuctionList />} />
                  <Route path="/auctions/:id" element={<AuctionDetail />} />
                  <Route path="/create-auction" element={<CreateAuction />} />
                </Routes>
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

