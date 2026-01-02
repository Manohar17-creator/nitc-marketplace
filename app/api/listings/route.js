import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { verifyToken } from '@/lib/auth'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getMessaging } from 'firebase-admin/messaging'

// --- 1. Initialize Firebase Admin SDK (Singleton Pattern) ---
if (getApps().length === 0) {
  try {
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }

    if (serviceAccount.privateKey) {
      initializeApp({ credential: cert(serviceAccount) })
    }
  } catch (error) {
    console.error('Firebase Admin Init Error:', error)
  }
}

// GET all listings (With Cache)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const userEmail = searchParams.get('userEmail')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const client = await clientPromise
    const db = client.db('nitc-marketplace')

    let query = { status: 'active' }
    
    if (userEmail) {
      query.sellerEmail = userEmail
      delete query.status 
    }
    
    if (category && category !== 'all' && category !== 'lost-found') {
      query.category = category
    }

    if (category === 'lost-found') {
      query.category = 'lost-found'
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    }

    const total = await db.collection('listings').countDocuments(query)

    const listings = await db
      .collection('listings')
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    return NextResponse.json({ 
      listings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=59',
      }
    })

  } catch (error) {
    console.error('Get listings error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch listings' },
      { status: 500 }
    )
  }
}

// POST new listing
// ... (imports and Firebase init stay the same)

// POST new listing
export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const client = await clientPromise
    const db = client.db('nitc-marketplace')
    
    const user = await db.collection('users').findOne({ _id: new ObjectId(decoded.userId) })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const lastPost = user.lastPostedAt ? new Date(user.lastPostedAt).getTime() : 0
    if (Date.now() - lastPost < 5000) {
      return NextResponse.json({ error: 'Please wait a moment' }, { status: 429 })
    }

    const data = await request.json()
    // ✅ FIX: Destructure all possible fields from the form
    const { 
      title, description, price, category, images, location, 
      sellerPhone, lostFoundType, reward, lastSeenLocation, lastSeenDate 
    } = data

    const newListing = {
      title: String(title).trim(),
      description: String(description).trim(),
      price: Number(price) || 0,
      category,
      images: images || [],
      sellerEmail: user.email,
      sellerName: user.name,
      sellerPhone: sellerPhone || user.phone || 'Not Provided', // ✅ Required for contact button
      location: location || 'NITC',
      status: 'active',
      createdAt: new Date(),
      
      // ✅ ADDED: Conditional spread to include Lost & Found specific fields
      ...(category === 'lost-found' && {
        lostFoundType: lostFoundType || 'lost',
        reward: Number(reward) || 0,
        lastSeenLocation: lastSeenLocation || location,
        lastSeenDate: lastSeenDate || null
      })
    }

    const result = await db.collection('listings').insertOne(newListing)
    const listingId = result.insertedId

    await db.collection('users').updateOne(
      { _id: user._id },
      { $set: { lastPostedAt: new Date() } }
    )

    // Notification Logic
    const cleanTitle = String(title).trim()
    let notifTitle = `🛍️ New Listing`
    let notifBody = `${cleanTitle}`

    if (category === 'lost-found') {
      notifTitle = lostFoundType === 'found' ? `✨ Item Found` : `🔍 Item Lost`
      notifBody = `${cleanTitle} @ ${lastSeenLocation || location || 'NITC'}`
    } else {
      notifTitle = `🛍️ New in ${category}`
      const fmtPrice = Number(price).toLocaleString('en-IN')
      notifBody = cleanTitle + " - ₹" + fmtPrice
    }

    // Background Notification Task
    (async () => {
      try {
        const allUsers = await db.collection('users')
          .find({ fcmToken: { $exists: true, $ne: null }, _id: { $ne: user._id } })
          .project({ fcmToken: 1 })
          .limit(400)
          .toArray()

        if (allUsers.length > 0) {
          const tokens = [...new Set(allUsers.map(u => u.fcmToken))]
          const messaging = getMessaging()
          
          await messaging.sendEachForMulticast({
            tokens,
            notification: { title: notifTitle, body: notifBody },
            data: { url: `/listing/${listingId.toString()}` },
            android: { priority: 'high' },
            webpush: { headers: { Urgency: 'high' } }
          })
        }
      } catch (err) {
        console.error("FCM Error:", err)
      }
    })()

    return NextResponse.json({ success: true, listingId })

  } catch (error) {
    console.error('POST ERROR:', error)
    return NextResponse.json({ error: 'Server Error' }, { status: 500 })
  }
}