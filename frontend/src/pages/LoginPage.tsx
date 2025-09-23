import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { HiMail, HiLockClosed } from 'react-icons/hi'
import { BsCurrencyBitcoin } from 'react-icons/bs'
import { RiCoinsFill } from 'react-icons/ri'
import { login } from '../store/slices/authSlice'
import { AppDispatch } from '../store/store'

const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const result = await dispatch(login({ email, password })).unwrap()
      if (result.user) {
        // Navigate based on user role
        if (result.user.role === 'admin') {
          navigate('/admin/dashboard')
        } else {
          navigate('/dashboard')
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
      {/* Animated Background */}
      <div className="absolute inset-0">
        {/* Base Dark Background */}
        <div className="absolute inset-0 bg-black" />

        {/* Primary White Smoke Cross - Horizontal Band */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-0 w-full h-[60%] -translate-y-1/2 bg-gradient-to-b from-transparent via-white/15 to-transparent transform rotate-6 scale-x-150" />
          <div className="absolute top-1/2 left-0 w-full h-[40%] -translate-y-1/2 bg-gradient-to-b from-transparent via-orange-100/10 to-transparent transform rotate-6" />
        </div>

        {/* Secondary White Smoke Cross - Vertical Band */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-0 h-full w-[60%] -translate-x-1/2 bg-gradient-to-r from-transparent via-white/15 to-transparent transform -rotate-6 scale-y-150" />
          <div className="absolute left-1/2 top-0 h-full w-[40%] -translate-x-1/2 bg-gradient-to-r from-transparent via-orange-100/10 to-transparent transform -rotate-6" />
        </div>

        {/* Intense Diagonal White Smoke Beams */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-full -left-full w-[300%] h-[300%] bg-gradient-to-br from-white/10 via-transparent to-transparent transform rotate-45" />
          <div className="absolute -bottom-full -right-full w-[300%] h-[300%] bg-gradient-to-tl from-white/10 via-transparent to-transparent transform rotate-45" />
        </div>

        {/* Enhanced Center Glow */}
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%]">
            <div className="w-full h-full bg-radial-gradient from-white/8 via-white/3 to-transparent animate-pulse-slow" />
          </div>
        </div>

        {/* Orange Accent Gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-900/30 via-transparent to-orange-950/30" />

        {/* Animated Crypto Grid Pattern - Subtle */}
        <div className="absolute inset-0 opacity-5">
          <div className="h-full w-full bg-[linear-gradient(to_right,#f97316_1px,transparent_1px),linear-gradient(to_bottom,#f97316_1px,transparent_1px)] bg-[size:4rem_4rem]" />
        </div>

        {/* Floating Light Orbs */}
        <div className="absolute top-1/3 -left-20 w-96 h-96 bg-gradient-radial from-white/10 via-orange-200/5 to-transparent rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-20 right-1/3 w-96 h-96 bg-gradient-radial from-white/10 via-orange-200/5 to-transparent rounded-full blur-3xl animate-float animation-delay-2000" />

        {/* Dramatic Light Rays */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] h-full">
            <div className="w-full h-full bg-gradient-to-b from-white/5 via-transparent to-transparent transform perspective-1000 rotate-x-45" />
          </div>
        </div>

        {/* Bitcoin Pattern Overlay - Very Subtle */}
        <div className="absolute inset-0 opacity-[0.02]">
          <div className="h-full w-full crypto-pattern" />
        </div>

        {/* Animated White Smoke Particles */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-[30%] w-32 h-32 bg-white/5 rounded-full blur-2xl animate-float-slow" />
          <div className="absolute bottom-32 right-[25%] w-24 h-24 bg-white/5 rounded-full blur-2xl animate-float-slow animation-delay-400" />
          <div className="absolute top-1/2 left-[70%] w-20 h-20 bg-white/5 rounded-full blur-2xl animate-float-slow animation-delay-2000" />
        </div>
      </div>

      {/* Glassmorphic Login Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="relative backdrop-blur-xl bg-gradient-to-br from-orange-950/30 via-black/50 to-orange-950/30 rounded-3xl border border-orange-500/20 shadow-2xl overflow-hidden">
          {/* Glow Effect */}
          <div className="absolute -top-20 -left-20 w-40 h-40 bg-orange-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-orange-600/20 rounded-full blur-3xl" />

          <div className="relative p-8 sm:p-10">
            {/* Logo and Header */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative mb-4">
                <div className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full animate-pulse" />
                <img
                  src="/logo.png"
                  alt="BigTeam"
                  className="relative w-20 h-20 sm:w-24 sm:h-24 object-contain drop-shadow-2xl"
                />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                Welcome Back
              </h1>
              <p className="text-sm text-gray-400 mt-2 text-center max-w-xs">
                Your gateway to the crypto community. Connect, trade, and grow together.
              </p>
              <div className="flex items-center justify-center gap-4 mt-3">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-gray-500">Live Market</span>
                </div>
                <div className="text-xs text-gray-500">•</div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500">24/7 Trading</span>
                </div>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Error Message */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm text-center">
                  {error}
                </div>
              )}

              {/* Email Input */}
              <div className="relative">
                <HiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xl" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-black/30 border border-orange-500/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 focus:bg-black/50 transition-all"
                  placeholder="Email address"
                />
              </div>

              {/* Password Input */}
              <div className="relative">
                <HiLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xl" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-black/30 border border-orange-500/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 focus:bg-black/50 transition-all"
                  placeholder="Password"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="relative w-full py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-black font-bold rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/25 overflow-hidden group"
              >
                <span className="relative z-10">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Authenticating...
                    </span>
                  ) : (
                    'Access Platform'
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-orange-400/50 to-orange-600/50 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              </button>
            </form>

            {/* Additional Security Info */}
            <div className="mt-6 pt-6 border-t border-orange-500/10">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <button
                  type="button"
                  className="hover:text-orange-400 transition-colors"
                >
                  Forgot Password?
                </button>
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  256-bit Encryption
                </span>
              </div>
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-600">
                <span>Protected by</span>
                <BsCurrencyBitcoin className="text-orange-500/50" />
                <span>Blockchain Security</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Text */}
        <p className="text-center text-xs text-gray-600 mt-6">
          © 2024 BigTeam. Empowering crypto communities.
        </p>
      </div>

      {/* Corner Decorations - Crypto Theme */}
      {/* Top Left - Bitcoin Symbol */}
      <div className="absolute top-6 left-6 sm:top-10 sm:left-10">
        <div className="relative">
          <BsCurrencyBitcoin className="text-3xl sm:text-4xl text-orange-500/20 animate-spin-slow" />
          <div className="absolute inset-0 bg-orange-500/10 blur-xl" />
        </div>
      </div>

      {/* Top Right - Blockchain Blocks */}
      <div className="absolute top-6 right-6 sm:top-10 sm:right-10">
        <div className="flex gap-1">
          <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-orange-500/30 rotate-45 animate-pulse" />
          <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-orange-400/30 rotate-45 animate-pulse animation-delay-200" />
          <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-orange-300/30 rotate-45 animate-pulse animation-delay-400" />
        </div>
      </div>

      {/* Bottom Left - Hexagon Pattern */}
      <div className="absolute bottom-6 left-6 sm:bottom-10 sm:left-10">
        <div className="grid grid-cols-2 gap-1">
          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-br from-orange-500/20 to-transparent clip-hexagon animate-pulse" />
          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-br from-orange-400/20 to-transparent clip-hexagon animate-pulse animation-delay-200" />
          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-br from-orange-300/20 to-transparent clip-hexagon animate-pulse animation-delay-400" />
          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-br from-orange-600/20 to-transparent clip-hexagon animate-pulse" />
        </div>
      </div>

      {/* Bottom Right - Coins Stack */}
      <div className="absolute bottom-6 right-6 sm:bottom-10 sm:right-10">
        <div className="relative">
          <RiCoinsFill className="text-3xl sm:text-4xl text-orange-500/20 animate-bounce-slow" />
          <div className="absolute inset-0 bg-orange-500/10 blur-xl" />
        </div>
      </div>

      {/* Floating Crypto Icons Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-10 text-orange-500/5 text-6xl sm:text-8xl animate-float">
          <BsCurrencyBitcoin />
        </div>
        <div className="absolute top-3/4 right-10 text-orange-500/5 text-6xl sm:text-8xl animate-float animation-delay-2000">
          <RiCoinsFill />
        </div>
        <div className="absolute top-1/2 left-1/3 text-orange-500/5 text-4xl sm:text-6xl animate-float animation-delay-400">
          <BsCurrencyBitcoin />
        </div>
      </div>
    </div>
  )
}

export default LoginPage