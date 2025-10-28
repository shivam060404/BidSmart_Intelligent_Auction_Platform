import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { Clock, Trophy, ArrowLeft, DollarSign } from 'lucide-react';

function AuctionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [auction, setAuction] = useState(null);
  const [bids, setBids] = useState([]);
  const [bidAmount, setBidAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [bidding, setBidding] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');

  const fetchAuction = useCallback(async () => {
    try {
  const response = await axios.get(`http://localhost:8000/api/auctions/${id}`);
      setAuction(response.data);
    } catch (error) {
      console.error('Failed to fetch auction:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchBids = useCallback(async () => {
    try {
  const response = await axios.get(`http://localhost:8000/api/auctions/${id}/bids`);
      setBids(response.data);
    } catch (error) {
      console.error('Failed to fetch bids:', error);
    }
  }, [id]);

  const updateTimeLeft = useCallback(() => {
    if (!auction) return;
    
    const end = new Date(auction.end_time);
    const now = new Date();
    const diff = end - now;
    
    if (diff <= 0) {
      setTimeLeft('Ended');
      return;
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
  }, [auction]);

  useEffect(() => {
    fetchAuction();
    fetchBids();
    
    // Native WebSocket connection
  const ws = new WebSocket(`ws://localhost:8000/ws/auction/${id}`);
    
    ws.onopen = () => {
      console.log('WebSocket connected');
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'new_bid') {
          setBids(prev => [data.bid, ...prev]);
          if (data.auction) {
            setAuction(prev => ({
              ...prev,
              current_price: data.auction.current_price,
              winner_id: data.auction.winner_id,
              winner_name: data.auction.winner_name,
            }));
          }
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    // Update time left
    const interval = setInterval(() => {
      updateTimeLeft();
    }, 1000);

    return () => {
      ws.close();
      clearInterval(interval);
    };
  }, [id, fetchAuction, fetchBids, updateTimeLeft]);

  useEffect(() => {
    if (auction) {
      updateTimeLeft();
    }
  }, [auction, updateTimeLeft]);

  const handleBid = useCallback(async (e) => {
    e.preventDefault();
    if (!bidAmount || !auction || parseFloat(bidAmount) <= auction.current_price) {
      alert('Bid must be higher than current price');
      return;
    }

    setBidding(true);
    try {
      const token = localStorage.getItem('token');
      console.log('Placing bid with user:', user);
      console.log('User role:', user.role);
      
      const response = await axios.post(
        'http://localhost:8000/api/bids',
        {
          auction_id: id,
          amount: parseFloat(bidAmount),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setBidAmount('');
      // Refetch data to update the UI
      await fetchBids();
      await fetchAuction();
    } catch (error) {
      console.error('Bid error:', error);
      const errorMsg = error.response?.data?.detail || 'Failed to place bid';
      alert(errorMsg);
    } finally {
      setBidding(false);
    }
  }, [bidAmount, auction, id, fetchBids, fetchAuction, user]);

  if (loading) {
    return <div className="p-8 text-white text-center">Loading...</div>;
  }

  if (!auction) {
    return <div className="p-8 text-white text-center">Auction not found</div>;
  }

  if (!user) {
    return <div className="p-8 text-white text-center">Loading user...</div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-2 text-white hover:text-white/80"
      >
        <ArrowLeft size={20} />
        Back
      </button>

      <div className="glass p-8 rounded-lg mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">{auction.title}</h1>
            <p className="text-white/70">{auction.description}</p>
          </div>
          <span className={`px-3 py-1 rounded text-sm ${
            auction.auction_type === 'os_scheduled'
              ? 'bg-purple-500/30 text-purple-200'
              : 'bg-blue-500/30 text-blue-200'
          }`}>
            {auction.auction_type === 'os_scheduled' ? 'OS-Scheduled Auction' : 'Traditional Auction'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="glass-dark p-4 rounded">
            <div className="flex items-center gap-3">
              <DollarSign className="text-green-400" size={32} />
              <div>
                <p className="text-white/70 text-sm">Current Price</p>
                <p className="text-2xl font-bold text-white">${auction.current_price}</p>
              </div>
            </div>
          </div>

          <div className="glass-dark p-4 rounded">
            <div className="flex items-center gap-3">
              <Trophy className="text-yellow-400" size={32} />
              <div>
                <p className="text-white/70 text-sm">Current Winner</p>
                <p className="text-xl font-bold text-white">{auction.winner_name || 'No bids yet'}</p>
              </div>
            </div>
          </div>

          <div className="glass-dark p-4 rounded">
            <div className="flex items-center gap-3">
              <Clock className="text-orange-400" size={32} />
              <div>
                <p className="text-white/70 text-sm">Time Left</p>
                <p className="text-xl font-bold text-white">{timeLeft}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          {user && user.role === 'buyer' && timeLeft !== 'Ended' ? (
            <form onSubmit={handleBid} className="flex gap-4">
              <input
                type="number"
                step="0.01"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder="Enter bid amount"
                className="flex-1 px-4 py-3 rounded bg-white/10 border border-white/30 text-white placeholder-white/50"
                required
              />
              <button
                type="submit"
                disabled={bidding}
                className="px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {bidding ? 'Placing...' : 'Place Bid'}
              </button>
            </form>
          ) : user && user.role === 'seller' ? (
            <p className="text-white/70 text-center p-4 bg-white/5 rounded">
              Only buyers can place bids
            </p>
          ) : timeLeft === 'Ended' ? (
            <p className="text-white/70 text-center p-4 bg-white/5 rounded">
              Auction has ended
            </p>
          ) : (
            <p className="text-white/70 text-center p-4 bg-white/5 rounded">
              Please wait...
            </p>
          )}
        </div>
      </div>

      {/* Bids History */}
      <div className="glass p-6 rounded-lg">
        <h2 className="text-2xl font-bold text-white mb-4">Bid History</h2>
        <div className="space-y-3">
          {bids.length === 0 ? (
            <p className="text-white/70">No bids yet</p>
          ) : (
            bids.map((bid) => (
              <div
                key={bid.id}
                className={`glass-dark p-4 rounded ${
                  user && bid.bidder_id === user.id ? 'border-l-4 border-blue-500' : ''
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-white font-semibold">{bid.bidder_name}</p>
                    <p className="text-white/70 text-sm">{new Date(bid.bid_time).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 font-bold">${bid.amount}</p>
                    {bid.priority_score && (
                      <p className="text-purple-400 text-sm">
                        Priority: {bid.priority_score}%
                      </p>
                    )}
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

export default AuctionDetail;

