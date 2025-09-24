import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
  TrendingUp,
  Users,
  Network,
  Coins,
  CheckCircle,
  Zap
} from 'lucide-react';
import { login } from '../store/slices/authSlice';
import { AppDispatch } from '../store/store';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await dispatch(login({ email, password })).unwrap();
      if (result.user) {
        // Navigate based on user role
        if (result.user.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Network, text: 'Global Network', description: 'Connect with teams worldwide' },
    { icon: Coins, text: 'Smart Rewards', description: 'Earn as you grow your network' },
    { icon: TrendingUp, text: 'Real-time Growth', description: 'Track your success metrics' }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0A0A0B]">
      {/* Unified Professional Background Design */}
      <div className="absolute inset-0">
        {/* Main gradient background - single unified color scheme */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0A0A0B] via-[#1a0e0a] to-[#0A0A0B]" />

        {/* Subtle radial glow for depth */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] h-[100%] bg-[radial-gradient(ellipse_at_top,rgba(249,115,22,0.03),transparent_50%)]" />
        </div>

        {/* Professional Network Visualization - MLM hierarchy representation */}
        <div className="absolute inset-0">
          <svg className="w-full h-full opacity-10" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="networkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f97316" stopOpacity="0.2" />
                <stop offset="50%" stopColor="#fb923c" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#fed7aa" stopOpacity="0.05" />
              </linearGradient>
              <filter id="blur">
                <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
              </filter>
            </defs>

            {/* Central hub - representing main network */}
            <g filter="url(#blur)">
              <circle cx="960" cy="540" r="8" fill="url(#networkGradient)" />

              {/* First tier connections */}
              {[0, 72, 144, 216, 288].map((angle, i) => {
                const x = 960 + 150 * Math.cos((angle * Math.PI) / 180);
                const y = 540 + 150 * Math.sin((angle * Math.PI) / 180);
                return (
                  <g key={i}>
                    <line x1="960" y1="540" x2={x} y2={y} stroke="url(#networkGradient)" strokeWidth="1" opacity="0.3" />
                    <circle cx={x} cy={y} r="5" fill="url(#networkGradient)" />

                    {/* Second tier connections */}
                    {[-30, 0, 30].map((subAngle, j) => {
                      const subX = x + 80 * Math.cos(((angle + subAngle) * Math.PI) / 180);
                      const subY = y + 80 * Math.sin(((angle + subAngle) * Math.PI) / 180);
                      return (
                        <g key={j}>
                          <line x1={x} y1={y} x2={subX} y2={subY} stroke="url(#networkGradient)" strokeWidth="0.5" opacity="0.2" />
                          <circle cx={subX} cy={subY} r="3" fill="url(#networkGradient)" opacity="0.5" />
                        </g>
                      );
                    })}
                  </g>
                );
              })}
            </g>

            {/* Blockchain-inspired hexagon grid - subtle crypto reference */}
            <defs>
              <pattern id="hexPattern" x="0" y="0" width="60" height="52" patternUnits="userSpaceOnUse">
                <polygon points="30,1 45,13 45,39 30,51 15,39 15,13" fill="none" stroke="#f97316" strokeWidth="0.3" opacity="0.1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hexPattern)" opacity="0.5" />
          </svg>
        </div>

        {/* Dynamic floating orbs for premium feel */}
        <div className="absolute inset-0">
          <motion.div
            animate={{
              x: [0, 100, 0],
              y: [0, -100, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute top-1/4 left-1/4 w-64 h-64 bg-orange-500/[0.02] rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              x: [0, -100, 0],
              y: [0, 100, 0],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-amber-500/[0.02] rounded-full blur-3xl"
          />
        </div>

        {/* Noise texture for premium quality */}
        <div className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative z-10 min-h-screen flex">
        {/* Left Side - Login Form */}
        <div className="flex-1 lg:flex-[0.45] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-md w-full"
          >
            {/* Logo and Title */}
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="flex flex-col items-center justify-center space-y-2"
              >
                <div className="relative flex justify-center">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-amber-600/20 blur-3xl rounded-full scale-150"></div>
                  <img
                    src="/logo.png"
                    alt="BigTeam"
                    className="relative w-28 h-28 md:w-36 md:h-36 object-contain drop-shadow-2xl transform hover:scale-105 transition-transform duration-300 mx-auto"
                  />
                </div>
                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-5xl md:text-6xl font-black bg-gradient-to-r from-orange-400 via-amber-500 to-orange-400 bg-clip-text text-transparent text-center mt-3"
                  style={{ lineHeight: '1', paddingTop: '0.5rem', paddingBottom: '0.5rem' }}
                >
                  BigTeam
                </motion.h1>
              </motion.div>
              <h2 className="text-xl md:text-2xl font-light text-gray-300 mt-4 mb-2">
                Welcome Back
              </h2>
              <p className="text-sm text-gray-500">
                Your gateway to unlimited opportunities
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-900/20 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm text-center backdrop-blur-sm"
                >
                  {error}
                </motion.div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-600" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3.5 bg-gray-900/50 border border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500/50 transition-all duration-200 backdrop-blur-sm hover:bg-gray-900/70 text-gray-100 placeholder-gray-600"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-600" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-10 py-3.5 bg-gray-900/50 border border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500/50 transition-all duration-200 backdrop-blur-sm hover:bg-gray-900/70 text-gray-100 placeholder-gray-600"
                      placeholder="••••••••••••"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-600 hover:text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-600 hover:text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center items-center py-3.5 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30"
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Accessing Platform...
                  </div>
                ) : (
                  <>
                    Access Platform
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Security Badge */}
            <div className="mt-8 flex items-center justify-center space-x-4 text-xs text-gray-600">
              <div className="flex items-center space-x-1">
                <Shield className="h-3.5 w-3.5 text-green-500/70" />
                <span>256-bit SSL</span>
              </div>
              <span>•</span>
              <div className="flex items-center space-x-1">
                <Zap className="h-3.5 w-3.5 text-amber-500/70" />
                <span>Enterprise Security</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Side - Feature Showcase */}
        <div className="hidden lg:flex flex-1 lg:flex-[0.55] items-center justify-center relative px-8">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative max-w-lg z-10"
          >
            <h3 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-500 mb-4">
              Join the Revolution
            </h3>
            <p className="text-gray-400 mb-8 leading-relaxed">
              Experience the next generation of community engagement and growth.
              Build your network, share your success.
            </p>

            <div className="space-y-4 mb-10">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                  className="flex items-start space-x-3 group"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg flex items-center justify-center border border-gray-700 group-hover:border-orange-500/50 transition-colors">
                    <feature.icon className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <h4 className="text-gray-300 font-semibold text-sm">{feature.text}</h4>
                    <p className="text-xs text-gray-600 mt-0.5">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="p-5 bg-gray-900/30 backdrop-blur-sm rounded-xl border border-gray-800/50">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-400">Platform Statistics</span>
                <span className="flex items-center text-xs text-green-400 font-medium">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Live
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-500">234K+</p>
                  <p className="text-xs text-gray-600 mt-1">Active Members</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-500">$2.4M+</p>
                  <p className="text-xs text-gray-600 mt-1">Total Rewards</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-800/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Network Growth</span>
                  <span className="text-sm font-bold text-gray-400">+28.5%</span>
                </div>
                <div className="mt-2 w-full bg-gray-800/50 rounded-full h-1.5">
                  <div className="bg-gradient-to-r from-orange-500 to-amber-500 h-1.5 rounded-full transition-all duration-500" style={{ width: '78.5%' }}></div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 left-0 right-0 text-center text-xs text-gray-700">
        © 2024 BigTeam. Empowering communities worldwide.
      </div>
    </div>
  );
};

export default LoginPage;