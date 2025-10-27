import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { Plus } from 'lucide-react';

function CreateAuction() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    auction_type: 'traditional',
    starting_price: '',
    duration_seconds: 3600,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:8000/api/auctions',
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      navigate(`/auctions/${response.data.id}`);
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to create auction');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="p-8 text-white text-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (user.role !== 'seller') {
    return (
      <div className="p-8 text-white text-center">
        <p>Only sellers can create auctions</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-4xl font-bold text-white mb-8">Create Auction</h1>
      
      <form onSubmit={handleSubmit} className="glass p-8 rounded-lg space-y-6">
        <div>
          <label className="block text-white/70 mb-2">Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-2 rounded bg-white/10 border border-white/30 text-white placeholder-white/50"
            required
          />
        </div>

        <div>
          <label className="block text-white/70 mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-2 rounded bg-white/10 border border-white/30 text-white placeholder-white/50"
            rows="4"
            required
          />
        </div>

        <div>
          <label className="block text-white/70 mb-2">Auction Type</label>
          <select
            value={formData.auction_type}
            onChange={(e) => setFormData({ ...formData, auction_type: e.target.value })}
            className="w-full px-4 py-2 rounded bg-white/20 border border-white/30 text-white"
          >
            <option value="traditional">Traditional (Highest Bid Wins)</option>
            <option value="os_scheduled">OS-Scheduled (Priority-Based)</option>
          </select>
          <p className="text-white/60 text-sm mt-2">
            {formData.auction_type === 'os_scheduled'
              ? 'Uses OS-inspired priority scheduling (urgency, rating, amount)'
              : 'Classic auction where highest bid wins'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-white/70 mb-2">Starting Price ($)</label>
            <input
              type="number"
              step="0.01"
              value={formData.starting_price}
              onChange={(e) => setFormData({ ...formData, starting_price: e.target.value })}
              placeholder="Enter starting price"
              className="w-full px-4 py-2 rounded bg-white/10 border border-white/30 text-white placeholder-white/50"
              required
            />
          </div>

          <div>
            <label className="block text-white/70 mb-2">Duration (seconds)</label>
            <input
              type="number"
              value={String(formData.duration_seconds)}
              onChange={(e) => {
                const val = e.target.value;
                const numValue = val === '' ? 3600 : parseInt(val, 10);
                setFormData({ ...formData, duration_seconds: isNaN(numValue) ? 3600 : numValue });
              }}
              className="w-full px-4 py-2 rounded bg-white/10 border border-white/30 text-white"
              min="60"
              placeholder="3600"
              required
            />
            <p className="text-white/60 text-xs mt-1">
              (3600 seconds = 1 hour, 600 seconds = 10 minutes)
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          {loading ? 'Creating...' : 'Create Auction'}
        </button>
      </form>
    </div>
  );
}

export default CreateAuction;

