import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { Clock, Trophy, TrendingUp } from 'lucide-react';

function Dashboard() {
  const [stats, setStats] = useState({
    activeAuctions: 0,
    myWins: 0,
    myBids: 0,
  });
  const [myAuctions, setMyAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    if (!user) return;
    
    try {
      const token = localStorage.getItem('token');
      
      // Fetch active auctions count
      const activeRes = await axios.get('http://localhost:8001/api/auctions?status=active');
      setStats(prev => ({ ...prev, activeAuctions: activeRes.data.length }));

      // Fetch my auctions/bids
      const myRes = await axios.get('http://localhost:8001/api/my-auctions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const wins = myRes.data.filter(a => a.winner_id === user.id);
      setMyAuctions(myRes.data.slice(0, 5));
      setStats(prev => ({ ...prev, myWins: wins.length }));

      // Fetch my bids
      const bidsRes = await axios.get('http://localhost:8001/api/my-bids', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(prev => ({ ...prev, myBids: bidsRes.data.length }));
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  const formatTime = (endTime) => {
    const end = new Date(endTime);
    const now = new Date();
    const diff = end - now;
    
    if (diff <= 0) return 'Ended';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  if (loading) {
    return <div className="p-8 text-white text-center">Loading...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold text-white mb-8">Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass p-6 rounded-lg">
          <div className="flex items-center gap-4">
            <Clock className="text-blue-400" size={40} />
            <div>
              <p className="text-white/70 text-sm">Active Auctions</p>
              <p className="text-3xl font-bold text-white">{stats.activeAuctions}</p>
            </div>
          </div>
        </div>
        
        <div className="glass p-6 rounded-lg">
          <div className="flex items-center gap-4">
            <Trophy className="text-yellow-400" size={40} />
            <div>
              <p className="text-white/70 text-sm">My Wins</p>
              <p className="text-3xl font-bold text-white">{stats.myWins}</p>
            </div>
          </div>
        </div>
        
        <div className="glass p-6 rounded-lg">
          <div className="flex items-center gap-4">
            <TrendingUp className="text-green-400" size={40} />
            <div>
              <p className="text-white/70 text-sm">My Bids</p>
              <p className="text-3xl font-bold text-white">{stats.myBids}</p>
            </div>
          </div>
        </div>
      </div>

      {/* My Auctions/Bids */}
      <div className="glass p-6 rounded-lg">
        <h2 className="text-2xl font-bold text-white mb-4">
          {user.role === 'seller' ? 'My Auctions' : 'My Recent Bids'}
        </h2>
        <div className="space-y-4">
          {myAuctions.length === 0 ? (
            <p className="text-white/70">No {user.role === 'seller' ? 'auctions' : 'bids'} yet</p>
          ) : (
            myAuctions.map((auction) => (
              <div
                key={auction.id}
                className="glass-dark p-4 rounded hover:bg-white/5 cursor-pointer"
                onClick={() => navigate(`/auctions/${auction.id}`)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-white font-semibold">{auction.title}</h3>
                    <p className="text-white/70 text-sm">{auction.auction_type === 'os_scheduled' ? 'OS-Scheduled' : 'Traditional'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold">${auction.current_price}</p>
                    <p className="text-white/70 text-sm">{formatTime(auction.end_time)}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

