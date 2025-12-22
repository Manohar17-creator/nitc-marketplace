// 'use client'
// import { useState,useEffect } from 'react'
// import { useRouter } from 'next/navigation'
// import { Mail, Lock, User, Phone } from 'lucide-react'

// export default function LoginPage() {
//   const router = useRouter()
//   const [isLogin, setIsLogin] = useState(true)
//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState('')
//   const [success, setSuccess] = useState('')

//   const [showResend, setShowResend] = useState(false)
//   const [resending, setResending] = useState(false)   

//   const [loginData, setLoginData] = useState({
//     email: '',
//     password: ''
//   })

//   useEffect(() => {
//     // Handle Google OAuth redirect
//     const params = new URLSearchParams(window.location.search)
//     const token = params.get('token')
//     const userStr = params.get('user')
//     const error = params.get('error')

//     if (error) {
//       const errorMessages = {
//         google_auth_failed: 'Google authentication failed',
//         no_code: 'Authorization code missing',
//         token_failed: 'Failed to get access token',
//         invalid_domain: 'Please use your NITC email (@nitc.ac.in)',
//         auth_failed: 'Authentication failed. Please try again.'
//       }
//       setError(errorMessages[error] || 'Login failed')
//     }

//     if (token && userStr) {
//       try {
//         localStorage.setItem('token', token)
//         localStorage.setItem('user', userStr)
//         // Clear URL params and redirect
//         if (!user.phone) {
//             // 🚨 Missing Phone -> Send to completion page
//             router.push('/complete-profile') 
//         } else {
//             // ✅ All good -> Send Home
//             router.push('/')
//         }
//       } catch (err) {
//         setError('Failed to complete login')
//       }
//     }
//   }, [router])

//   const [signupData, setSignupData] = useState({
//     name: '',
//     email: '',
//     phone: '',
//     password: '',
//     confirmPassword: ''
//   })

//   const handleLoginChange = (e) => {
//     setLoginData({ ...loginData, [e.target.name]: e.target.value })
//   }

//   const handleSignupChange = (e) => {
//     setSignupData({ ...signupData, [e.target.name]: e.target.value })
//   }

//   const handleResendVerification = async () => {
//     setResending(true)
//     try {
//         const response = await fetch('/api/auth/resend-verification', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ email: loginData.email })
//         })

//         if (response.ok) {
//         alert('Verification email sent! Check your inbox.')
//         } else {
//         alert('Failed to send email')
//         }
//     } catch (error) {
//         alert('Something went wrong')
//     } finally {
//         setResending(false)
//     }
//     }

//   const handleLogin = async (e) => {
//     e.preventDefault()
//     setLoading(true)
//     setError('')

//     try {
//       const response = await fetch('/api/auth/login', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(loginData)
//       })

//       const data = await response.json()

//       if (response.ok) {

//         if (!data.user.isVerified) {
//             setError('Please verify your email before logging in. Check your inbox.')
//             setShowResend(true)
//             setLoading(false)
//             return
//         }

//         setSuccess('Account created! Please check your NITC email to verify.')

//         if (typeof window !== 'undefined') {
//           localStorage.setItem('token', data.token)
//           localStorage.setItem('user', JSON.stringify(data.user))
//         }
//         router.push('/')
//       } else {
//         setError(data.error || 'Signup failed')
//       }
//     } catch (err) {
//       setError('Something went wrong')
//     } finally {
//       setLoading(false)
//     }
//   }

//   const handleSignup = async (e) => {
//     e.preventDefault()
//     setLoading(true)
//     setError('')
//     setSuccess('')

//     // Validation
//     if (!signupData.email.endsWith('@nitc.ac.in')) {
//       setError('Please use your NITC email (@nitc.ac.in)')
//       setLoading(false)
//       return
//     }

//     if (signupData.password !== signupData.confirmPassword) {
//       setError('Passwords do not match')
//       setLoading(false)
//       return
//     }

//     if (signupData.password.length < 6) {
//       setError('Password must be at least 6 characters')
//       setLoading(false)
//       return
//     }

//     try {
//       const response = await fetch('/api/auth/signup', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           name: signupData.name,
//           email: signupData.email,
//           phone: signupData.phone,
//           password: signupData.password
//         })
//       })

//       const data = await response.json()

//       if (response.ok) {
//       // Show success message, don't store token or redirect
//       setSuccess(
//         '✅ Account created! Check your NITC email for verification link. ' +
//         'You must verify before logging in.'
//       )
//       // Clear form
//       setSignupData({
//         name: '',
//         email: '',
//         phone: '',
//         password: '',
//         confirmPassword: ''
//       })
//     } else {
//       setError(data.error || 'Signup failed')
//     }
//   } catch (err) {
//     setError('Something went wrong')
//   } finally {
//     setLoading(false)
//   }
// }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
//       <div className="max-w-md w-full">
//         {/* Logo/Header */}
//         <div className="text-center mb-8">
//           <h1 className="text-4xl font-bold text-white mb-2">NITC Marketplace</h1>
//           <p className="text-blue-100">Your campus buying & selling platform</p>
//         </div>

//         {/* Auth Card */}
//         <div className="bg-white rounded-2xl shadow-xl p-8">
//           {/* Toggle Buttons */}
//           <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
//             <button
//               onClick={() => {
//                 setIsLogin(true)
//                 setError('')
//                 setSuccess('')
//               }}
//               className={`flex-1 py-2 rounded-lg font-medium transition-all ${
//                 isLogin 
//                   ? 'bg-white text-blue-600 shadow-sm' 
//                   : 'text-gray-600 hover:text-gray-900'
//               }`}
//             >
//               Login
//             </button>
//             <button
//               onClick={() => {
//                 setIsLogin(false)
//                 setError('')
//                 setSuccess('')
//               }}
//               className={`flex-1 py-2 rounded-lg font-medium transition-all ${
//                 !isLogin 
//                   ? 'bg-white text-blue-600 shadow-sm' 
//                   : 'text-gray-600 hover:text-gray-900'
//               }`}
//             >
//               Sign Up
//             </button>
//           </div>

//           {/* Error/Success Messages */}
//           {error && (
//             <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
//               {error}
//             </div>
//           )}
//           {success && (
//             <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
//               {success}
//             </div>
//           )}

//         {showResend && (
//             <button
//               onClick={handleResendVerification}
//               disabled={resending}
//               className="w-full mb-4 px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
//             >
//               {resending ? 'Sending...' : 'Resend Verification Email'}
//             </button>
//           )}

//           {/* Login Form */}
//           {isLogin ? (
//             <form onSubmit={handleLogin}>
//               <div className="mb-4">
//                 <label className="block text-gray-700 text-sm font-medium mb-2">
//                   NITC Email
//                 </label>
//                 <div className="relative">
//                   <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
//                   <input
//                     type="email"
//                     name="email"
//                     value={loginData.email}
//                     onChange={handleLoginChange}
//                     required
//                     placeholder="your.name@nitc.ac.in"
//                     className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
//                     suppressHydrationWarning
//                   />
//                 </div>
//               </div>

//               <div className="mb-6">
//                 <label className="block text-gray-700 text-sm font-medium mb-2">
//                   Password
//                 </label>
//                 <div className="relative">
//                   <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
//                   <input
//                     type="password"
//                     name="password"
//                     value={loginData.password}
//                     onChange={handleLoginChange}
//                     required
//                     placeholder="••••••••"
//                     className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
//                   />
//                 </div>
//               </div>

//               <button
//                 type="submit"
//                 disabled={loading}
//                 className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 {loading ? 'Logging in...' : 'Login'}
//               </button>

//               {/* Divider */}
// <div className="relative my-6">
//   <div className="absolute inset-0 flex items-center">
//     <div className="w-full border-t border-gray-300"></div>
//   </div>
//   <div className="relative flex justify-center text-sm">
//     <span className="px-4 bg-white text-gray-500">Or continue with</span>
//   </div>
// </div>

//     {/* Google Sign In Button */}
//     <button
//       type="button"
//       onClick={() => {
//         window.location.href = '/api/auth/google'
//       }}
//       className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
//     >
//       <svg className="w-5 h-5" viewBox="0 0 24 24">
//         <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
//         <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
//         <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
//         <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
//       </svg>
//       <span>Continue with Google</span>
//     </button>

//             </form>
//           ) : (
//             // Signup Form
//             <form onSubmit={handleSignup}>
//               <div className="mb-4">
//                 <label className="block text-gray-700 text-sm font-medium mb-2">
//                   Full Name
//                 </label>
//                 <div className="relative">
//                   <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
//                   <input
//                     type="text"
//                     name="name"
//                     value={signupData.name}
//                     onChange={handleSignupChange}
//                     required
//                     placeholder="Rahul Kumar"
//                     className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
//                   />
//                 </div>
//               </div>

//               <div className="mb-4">
//                 <label className="block text-gray-700 text-sm font-medium mb-2">
//                   NITC Email
//                 </label>
//                 <div className="relative">
//                   <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
//                   <input
//                     type="email"
//                     name="email"
//                     value={signupData.email}
//                     onChange={handleSignupChange}
//                     required
//                     placeholder="your.name@nitc.ac.in"
//                     className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
//                     suppressHydrationWarning
//                   />
//                 </div>
//                 <p className="mt-1 text-xs text-gray-500">Use your official NITC email</p>
//               </div>

//               <div className="mb-4">
//                 <label className="block text-gray-700 text-sm font-medium mb-2">
//                   Phone Number
//                 </label>
//                 <div className="relative">
//                   <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
//                   <input
//                     type="tel"
//                     name="phone"
//                     value={signupData.phone}
//                     onChange={handleSignupChange}
//                     required
//                     placeholder="+91 98765 43210"
//                     className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
//                   />
//                 </div>
//               </div>

//               <div className="mb-4">
//                 <label className="block text-gray-700 text-sm font-medium mb-2">
//                   Password
//                 </label>
//                 <div className="relative">
//                   <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
//                   <input
//                     type="password"
//                     name="password"
//                     value={signupData.password}
//                     onChange={handleSignupChange}
//                     required
//                     placeholder="••••••••"
//                     className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
//                   />
//                 </div>
//               </div>

//               <div className="mb-6">
//                 <label className="block text-gray-700 text-sm font-medium mb-2">
//                   Confirm Password
//                 </label>
//                 <div className="relative">
//                   <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
//                   <input
//                     type="password"
//                     name="confirmPassword"
//                     value={signupData.confirmPassword}
//                     onChange={handleSignupChange}
//                     required
//                     placeholder="••••••••"
//                     className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
//                   />
//                 </div>
//               </div>

//               <button
//                 type="submit"
//                 disabled={loading}
//                 className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 {loading ? 'Creating Account...' : 'Sign Up'}
//               </button>
//             </form>
//           )}
//         </div>

//         {/* Footer */}
//         <p className="text-center mt-6 text-blue-100 text-sm">
//           By continuing, you agree to our Terms of Service
//         </p>
//       </div>
//     </div>
//   )
// }

'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Lock, User, Phone, CheckCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [showResend, setShowResend] = useState(false)
  const [resending, setResending] = useState(false)

  // Login State
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  })

  // Signup State
  const [signupData, setSignupData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })

  // Handle URL params (Google Auth)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const userStr = params.get('user')
    const urlError = params.get('error')

    if (urlError) {
      const errorMessages = {
        google_auth_failed: 'Google authentication failed',
        no_code: 'Authorization code missing',
        token_failed: 'Failed to get access token',
        invalid_domain: 'Please use your NITC email (@nitc.ac.in)',
        auth_failed: 'Authentication failed. Please try again.'
      }
      setError(errorMessages[urlError] || 'Login failed')
    }

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr)
        localStorage.setItem('token', token)
        localStorage.setItem('user', userStr)
        window.history.replaceState({}, '', '/login')
        
        // Redirect logic
        if (!user.phone) {
          router.push('/complete-profile')
        } else {
          router.push('/')
        }
      } catch (err) {
        setError('Failed to complete login')
      }
    }
  }, [router])

  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value })
  }

  const handleSignupChange = (e) => {
    setSignupData({ ...signupData, [e.target.name]: e.target.value })
  }

  const handleResendVerification = async () => {
    setResending(true)
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginData.email })
      })

      if (response.ok) {
        alert('Verification email sent! Check your inbox.')
      } else {
        alert('Failed to send email')
      }
    } catch (error) {
      alert('Something went wrong')
    } finally {
      setResending(false)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      })

      const data = await response.json()

      if (response.ok) {
        if (data.needsVerification) {
          setError('Please verify your email before logging in.')
          setShowResend(true)
          setLoading(false)
          return
        }

        if (typeof window !== 'undefined') {
          localStorage.setItem('token', data.token)
          localStorage.setItem('user', JSON.stringify(data.user))
        }
        
        // Redirect logic
        if (!data.user.phone) {
          router.push('/complete-profile')
        } else {
          router.push('/')
        }
      } else {
        setError(data.error || 'Login failed')
      }
    } catch (err) {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (!signupData.email.endsWith('@nitc.ac.in')) {
      setError('Please use your NITC email (@nitc.ac.in)')
      setLoading(false)
      return
    }

    if (signupData.password !== signupData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (signupData.password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: signupData.name,
          email: signupData.email,
          phone: signupData.phone,
          password: signupData.password
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('✅ Account created! Check your NITC email for the verification link.')
        setSignupData({ name: '', email: '', phone: '', password: '', confirmPassword: '' })
        setIsLogin(true) // Switch to login view
      } else {
        setError(data.error || 'Signup failed')
      }
    } catch (err) {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

    return (
    // ✨ FIX 2: Used 'h-screen' and 'overflow-hidden' to prevent scrolling
    <div className="h-screen w-full bg-gray-50 flex flex-col items-center justify-center p-4 overflow-hidden">
      
      <div className="text-center mb-6">
        <h1 className="text-4xl font-extrabold text-blue-600 tracking-tight">Unyfy</h1>
        <p className="text-gray-500 mt-1 font-medium">Where campus comes together</p>
      </div>

      <div className="w-full max-w-md bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-gray-200">


        
        <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
          <button
            onClick={() => { setIsLogin(true); setError(''); setSuccess('') }}
            className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${isLogin ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
          >
            Login
          </button>
          <button
            onClick={() => { setIsLogin(false); setError(''); setSuccess('') }}
            className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${!isLogin ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
          >
            Sign Up
          </button>
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
          <form onSubmit={handleSignup} className="space-y-4">
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

            {/* ✨ FIX 1: Passwords are now Stacked (Full Width) */}
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
      </div>
    </div>
  )
}