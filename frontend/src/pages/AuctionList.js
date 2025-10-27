import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, Clock, DollarSign } from 'lucide-react';

function AuctionList() {
  const [auctions, setAuctions] = useState([]);
  const [filteredAuctions, setFilteredAuctions] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const applyFilters = useCallback(() => {
    let filtered = auctions;

    if (filter !== 'all') {
      filtered = filtered.filter(a => a.auction_type === filter);
    }

    if (search) {
      filtered = filtered.filter(a =>
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFilteredAuctions(filtered);
  }, [filter, search, auctions]);

  useEffect(() => {
    fetchAuctions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filter, search, auctions, applyFilters]);

  const fetchAuctions = async () => {
    try {
  const response = await axios.get('http://localhost:8000/api/auctions?status=active');
      setAuctions(response.data);
      setFilteredAuctions(response.data);
    } catch (error) {
      console.error('Failed to fetch auctions:', error);
    } finally {
      setLoading(false);
    }
  };

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
      <h1 className="text-4xl font-bold text-white mb-8">Active Auctions</h1>
      
      {/* Search and Filter */}
      <div className="glass p-4 rounded-lg mb-6">
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-white/70" size={20} />
              <input
                type="text"
                placeholder="Search auctions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded bg-white/10 border border-white/20 text-white placeholder-white/50"
              />
            </div>
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 rounded bg-white/20 border border-white/30 text-white"
          >
            <option value="all">All Types</option>
            <option value="traditional">Traditional</option>
            <option value="os_scheduled">OS-Scheduled</option>
          </select>
        </div>
      </div>

      {/* Auction Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAuctions.length === 0 ? (
          <div className="col-span-full text-white/70 text-center py-12">
            No auctions found
          </div>
        ) : (
          filteredAuctions.map((auction) => (
            <div
              key={auction.id}
              className="glass p-6 rounded-lg hover:scale-105 transition-transform cursor-pointer"
              onClick={() => navigate(`/auctions/${auction.id}`)}
            >
              <div className="mb-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-white">{auction.title}</h3>
                  <span className={`px-2 py-1 rounded text-xs ${
                    auction.auction_type === 'os_scheduled'
                      ? 'bg-purple-500/30 text-purple-200'
                      : 'bg-blue-500/30 text-blue-200'
                  }`}>
                    {auction.auction_type === 'os_scheduled' ? 'OS' : 'Traditional'}
                  </span>
                </div>
                <p className="text-white/70 text-sm line-clamp-2">{auction.description}</p>
              </div>
              
              <div className="space-y-2 mt-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="text-green-400" size={16} />
                  <p className="text-white font-bold">${auction.current_price}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="text-orange-400" size={16} />
                  <p className="text-white/70 text-sm">{formatTime(auction.end_time)}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default AuctionList;

