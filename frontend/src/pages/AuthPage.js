import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'buyer',
  });
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        await register(formData.email, formData.password, formData.name, formData.role);
      }
      navigate('/');
    } catch (error) {
      alert(error.response?.data?.detail || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass p-8 rounded-lg shadow-xl max-w-md w-full">
        <h1 className="text-3xl font-bold text-white mb-6 text-center">
          BidSmart
        </h1>
        <div className="mb-6 flex gap-4">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 rounded ${isLogin ? 'bg-blue-500 text-white' : 'bg-white/20 text-white'}`}
          >
            Login
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 rounded ${!isLogin ? 'bg-blue-500 text-white' : 'bg-white/20 text-white'}`}
          >
            Register
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-2 rounded bg-white/20 border border-white/30 text-white placeholder-white/70"
            required
          />
          {!isLogin && (
            <input
              type="text"
              placeholder="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 rounded bg-white/20 border border-white/30 text-white placeholder-white/70"
              required
            />
          )}
          {!isLogin && (
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-4 py-2 rounded bg-white/20 border border-white/30 text-white"
              required
            >
              <option value="buyer">Buyer</option>
              <option value="seller">Seller</option>
            </select>
          )}
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full px-4 py-2 rounded bg-white/20 border border-white/30 text-white placeholder-white/70"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Loading...' : isLogin ? 'Login' : 'Register'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AuthPage;

