import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { getDb } from '@/lib/mongodb'
import { verifyPassword } from '@/lib/auth'

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          hd: 'nitc.ac.in', // Restrict to NITC domain only
          prompt: 'select_account',
        },
      },
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        
        const db = await getDb()        
        const user = await db.collection('users').findOne({ 
          email: credentials.email 
        })
        
        if (!user) throw new Error('No user found')
        if (!user.isVerified) throw new Error('Email not verified')
        
        const isValid = await verifyPassword(credentials.password, user.password)
        if (!isValid) throw new Error('Invalid password')
        
        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          phone: user.phone,
        }
      }
    })
  ],
  
  callbacks: {
    async signIn({ account, profile }) {
      if (account.provider === 'google') {
        // Restrict to @nitc.ac.in emails only
        if (!profile.email.endsWith('@nitc.ac.in')) {
          return false
        }
        
        
        const db = await getDb()        
        // Check if user exists
        let user = await db.collection('users').findOne({ email: profile.email })
        
        if (!user) {
          // Create new user
          await db.collection('users').insertOne({
            email: profile.email,
            name: profile.name,
            phone: '', // User can update later
            isVerified: true, // Google accounts are pre-verified
            googleId: profile.sub,
            createdAt: new Date(),
          })
        }
      }
      return true
    },
    
    async session({ session, token }) {
      if (session?.user) {
        
        const db = await getDb()        const user = await db.collection('users').findOne({ email: session.user.email })
        
        session.user.id = user._id.toString()
        session.user.phone = user.phone
      }
      return session
    }
  },
  
  pages: {
    signIn: '/login',
    error: '/login',
  },
  
  session: {
    strategy: 'jwt',
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }