import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LogOut, Home, Hammer, Plus, User } from 'lucide-react';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  if (!user) {
    return null;
  }

  return (
    <nav className="bg-black/20 backdrop-blur-lg border-b border-white/10">
      <div className="max-w-7xl mx-auto px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-2xl font-bold text-white">
              BidSmart
            </Link>
            <div className="flex gap-6">
              <Link
                to="/"
                className="flex items-center gap-2 text-white hover:text-white/80 transition"
              >
                <Home size={20} />
                Dashboard
              </Link>
              <Link
                to="/auctions"
                className="flex items-center gap-2 text-white hover:text-white/80 transition"
              >
                <Hammer size={20} />
                Auctions
              </Link>
              {user?.role === 'seller' && (
                <Link
                  to="/create-auction"
                  className="flex items-center gap-2 text-white hover:text-white/80 transition"
                >
                  <Plus size={20} />
                  Create
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-white">
              <User size={20} />
              <span>{user?.name || 'User'}</span>
              <span className="text-white/60">({user?.role || 'loading'})</span>
              {/* Debug info */}
              {process.env.NODE_ENV === 'development' && (
                <span className="text-xs text-white/40">
                  Role: {user?.role || 'unknown'}
                </span>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-white hover:text-red-400 transition"
            >
              <LogOut size={20} />
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

