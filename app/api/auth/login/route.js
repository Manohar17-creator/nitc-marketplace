'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Lock, User, Phone, CheckCircle, ArrowLeft, KeyRound } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  
  // View States
  const [isLogin, setIsLogin] = useState(true)
  const [isForgot, setIsForgot] = useState(false) // 👈 NEW STATE
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showResend, setShowResend] = useState(false)
  const [resending, setResending] = useState(false)

  // Form Data
  const [loginData, setLoginData] = useState({ email: '', password: '' })
  const [signupData, setSignupData] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' })
  const [forgotEmail, setForgotEmail] = useState('') // 👈 NEW STATE

  // ... (Keep your useEffect for Google Auth exactly the same) ...
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const userStr = params.get('user')
    const urlError = params.get('error')

    if (urlError) setError('Login failed')

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr)
        localStorage.setItem('token', token)
        localStorage.setItem('user', userStr)
        window.history.replaceState({}, '', '/login')
        if (!user.phone) router.push('/complete-profile')
        else router.push('/')
      } catch (err) {
        setError('Failed to complete login')
      }
    }
  }, [router])

  const handleLoginChange = (e) => setLoginData({ ...loginData, [e.target.name]: e.target.value })
  const handleSignupChange = (e) => setSignupData({ ...signupData, [e.target.name]: e.target.value })

  // ... (Keep handleResendVerification, handleLogin, handleSignup same) ...
  const handleResendVerification = async () => { /* ... your existing code ... */ }
  
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      })
      const data = await response.json()
      if (response.ok) {
        if (data.needsVerification) {
          setError('Please verify your email.'); setShowResend(true); setLoading(false); return
        }
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        if (!data.user.phone) router.push('/complete-profile')
        else router.push('/')
      } else {
        setError(data.error || 'Login failed')
      }
    } catch (err) { setError('Something went wrong') } 
    finally { setLoading(false) }
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    setLoading(true); setError(''); setSuccess('')
    if (!signupData.email.endsWith('@nitc.ac.in')) { setError('Please use NITC email'); setLoading(false); return }
    if (signupData.password !== signupData.confirmPassword) { setError('Passwords do not match'); setLoading(false); return }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupData)
      })
      const data = await response.json()
      if (response.ok) {
        setSuccess('✅ Account created! Check your email.')
        setSignupData({ name: '', email: '', phone: '', password: '', confirmPassword: '' })
        setIsLogin(true)
      } else { setError(data.error || 'Signup failed') }
    } catch (err) { setError('Something went wrong') } 
    finally { setLoading(false) }
  }

  // 👇 NEW: Handle Forgot Password Submit
  const handleForgotSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError(''); setSuccess('')

    try {
        const res = await fetch('/api/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: forgotEmail })
        })
        if (res.ok) {
            setSuccess('If an account exists, a reset link has been sent.')
            setForgotEmail('')
        } else {
            setError('Failed to send link. Try again.')
        }
    } catch (error) {
        setError('Something went wrong')
    } finally {
        setLoading(false)
    }
  }

  return (
    <div className="h-screen w-full bg-gray-50 flex flex-col items-center justify-center p-4 overflow-hidden">
      
      <div className="text-center mb-6">
        <h1 className="text-4xl font-extrabold text-blue-600 tracking-tight">Unyfy</h1>
        <p className="text-gray-500 mt-1 font-medium">Where campus comes together</p>
      </div>

      <div className="w-full max-w-md bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-gray-200">

        {/* 1. FORGOT PASSWORD VIEW */}
        {isForgot ? (
            <div>
                <button 
                    onClick={() => { setIsForgot(false); setError(''); setSuccess('') }}
                    className="flex items-center text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
                >
                    <ArrowLeft size={16} className="mr-1" /> Back to Login
                </button>

                <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <KeyRound className="text-blue-600" size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">Reset Password</h2>
                    <p className="text-sm text-gray-500 mt-1">Enter your NITC email to receive a reset link.</p>
                </div>

                {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">⚠️ {error}</div>}
                {success && <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm"><CheckCircle size={16} className="inline mr-1"/> {success}</div>}

                <form onSubmit={handleForgotSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-xs font-bold mb-1 uppercase">NITC Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input 
                                type="email" 
                                value={forgotEmail} 
                                onChange={(e) => setForgotEmail(e.target.value)} 
                                required 
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none" 
                                placeholder="name_b22xxxx@nitc.ac.in"
                            />
                        </div>
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3.5 rounded-lg font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-200 disabled:opacity-70">
                        {loading ? 'Sending Link...' : 'Send Reset Link'}
                    </button>
                </form>
            </div>
        ) : (
            // 2. NORMAL LOGIN / SIGNUP VIEW
            <>
                <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
                    <button onClick={() => { setIsLogin(true); setError(''); setSuccess('') }} className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${isLogin ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>Login</button>
                    <button onClick={() => { setIsLogin(false); setError(''); setSuccess('') }} className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${!isLogin ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>Sign Up</button>
                </div>

                {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">⚠️ {error}</div>}
                {success && <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm"><CheckCircle size={16} className="inline mr-1"/> {success}</div>}
                {showResend && <button onClick={handleResendVerification} disabled={resending} className="w-full mb-4 px-4 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg">{resending ? 'Sending...' : 'Resend Email'}</button>}

                {isLogin ? (
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-gray-700 text-xs font-bold mb-1 uppercase">NITC Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input type="email" name="email" value={loginData.email} onChange={handleLoginChange} required className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="name_b22xxxx@nitc.ac.in"/>
                            </div>
                        </div>
                        <div>
                            <label className="block text-gray-700 text-xs font-bold mb-1 uppercase">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input type="password" name="password" value={loginData.password} onChange={handleLoginChange} required className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="••••••••"/>
                            </div>
                            
                            {/* 👇 FORGOT PASSWORD LINK */}
                            <div className="text-right mt-1">
                                <button 
                                    type="button"
                                    onClick={() => { setIsForgot(true); setError(''); setSuccess('') }} 
                                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                                >
                                    Forgot Password?
                                </button>
                            </div>
                        </div>

                        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3.5 rounded-lg font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-200">{loading ? 'Logging in...' : 'Login'}</button>
                        
                        <div className="relative py-2">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                            <div className="relative flex justify-center text-xs text-gray-400 uppercase bg-white px-2">Or</div>
                        </div>

                        <button type="button" onClick={() => window.location.href = '/api/auth/google'} className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-all">
                            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
                            <span>Continue with Google</span>
                        </button>
                    </form>
                ) : (
                    // Signup Form (Existing)
                    <form onSubmit={handleSignup} className="space-y-4">
                        {/* ... Your Signup Fields (Name, Email, Phone, Passwords) ... */}
                        <div>
                            <label className="block text-gray-700 text-xs font-bold mb-1 uppercase">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input type="text" name="name" value={signupData.name} onChange={handleSignupChange} required className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Your Name"/>
                            </div>
                        </div>
                        <div>
                            <label className="block text-gray-700 text-xs font-bold mb-1 uppercase">NITC Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input type="email" name="email" value={signupData.email} onChange={handleSignupChange} required className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="name_b22xxxx@nitc.ac.in"/>
                            </div>
                        </div>
                        <div>
                            <label className="block text-gray-700 text-xs font-bold mb-1 uppercase">Phone</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input type="tel" name="phone" value={signupData.phone} onChange={handleSignupChange} required className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="9876543210"/>
                            </div>
                        </div>
                        <div>
                            <label className="block text-gray-700 text-xs font-bold mb-1 uppercase">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input type="password" name="password" value={signupData.password} onChange={handleSignupChange} required className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="••••••"/>
                            </div>
                        </div>
                        <div>
                            <label className="block text-gray-700 text-xs font-bold mb-1 uppercase">Confirm Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input type="password" name="confirmPassword" value={signupData.confirmPassword} onChange={handleSignupChange} required className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="••••••"/>
                            </div>
                        </div>
                        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3.5 rounded-lg font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-200">{loading ? 'Creating Account...' : 'Sign Up'}</button>
                    </form>
                )}
            </>
        )}

      </div>
    </div>
  )
}