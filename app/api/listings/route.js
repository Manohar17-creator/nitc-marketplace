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
      // Handle private key newlines correctly for Vercel
      privateKey: process.env.FIREBASE_PRIVATE_KEY
        ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        : undefined,
    }

    if (serviceAccount.privateKey) {
      initializeApp({
        credential: cert(serviceAccount),
      })
      console.log('🔥 Firebase Admin Initialized')
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
export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1]
    
    // 🔒 1. Strict Auth Check
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: Please login' }, { status: 401 })
    }

    let decoded;
    try {
      decoded = verifyToken(token)
      if (!decoded) throw new Error('Invalid token')
    } catch (e) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db('nitc-marketplace')
    
    // Fetch user details
    const user = await db.collection('users').findOne({
        $or: [
        { _id: new ObjectId(decoded.userId) },
        { _id: decoded.userId } 
        ]
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 🛡️ 2. RATE LIMITING (Cooldown)
    const COOLDOWN_MS = 60 * 1000; // 1 Minute
    const now = Date.now();
    const lastActionTime = user.lastPostedAt ? new Date(user.lastPostedAt).getTime() : 0;

    if (now - lastActionTime < COOLDOWN_MS) {
      const waitSeconds = Math.ceil((COOLDOWN_MS - (now - lastActionTime)) / 1000);
      return NextResponse.json(
        { error: `Please wait ${waitSeconds}s before posting again.` },
        { status: 429 }
      );
    }

    const data = await request.json()
    const { 
      title, description, price, category, images, location, 
      lostFoundType, reward, lastSeenLocation, lastSeenDate, contactMethod 
    } = data

    if (!title || !description || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create listing object
    const newListing = {
      title,
      description,
      price: price ? Number(price) : 0,
      category,
      images: images || [],
      seller: user._id, 
      sellerName: user.name,
      sellerPhone: user.phone || '', // Use actual user data
      sellerEmail: user.email,
      location: location || 'NIT Calicut',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    if (category === 'lost-found') {
      newListing.lostFoundType = lostFoundType
      newListing.reward = reward ? Number(reward) : 0
      newListing.lastSeenLocation = lastSeenLocation || location
      newListing.lastSeenDate = lastSeenDate || new Date().toISOString().split('T')[0]
      newListing.contactMethod = contactMethod || 'phone'
    }

    // 3. Database Operations (Insert + Update Cooldown)
    const result = await db.collection('listings').insertOne(newListing)
    const listingId = result.insertedId

    // Update user's lastPostedAt immediately
    await db.collection('users').updateOne(
      { _id: user._id },
      { $set: { lastPostedAt: new Date() } }
    )

    console.log(`✅ Listing created: ${listingId}`)

    // --- 🚨 NOTIFICATIONS LOGIC (Fire & Forget Pattern) ---
    // We wrap this entire block so notification failures don't crash the response
    try {
      const allUsers = await db.collection('users')
        .find({ 
          fcmToken: { $exists: true, $ne: null },
          _id: { $ne: user._id } // Don't notify self
        })
        .project({ _id: 1, fcmToken: 1 })
        .limit(499) // Safety limit for Vercel timeout protection
        .toArray()

      if (allUsers.length > 0) {
        // ... (Emoji Logic Unchanged) ...
        const categoryEmojis = {
          books: '📚', electronics: '💻', tickets: '🎫', rides: '🚗',
          housing: '🏠', events: '🎉', misc: '🎁',
          'lost-found': lostFoundType === 'lost' ? '🔍' : '✨' 
        }
        const emoji = categoryEmojis[category] || '📦'

        let notifTitle = '🛍️ New Listing'
        let notifBody = `${emoji} ${title}`
        let notifType = 'new_listing'

        if (category === 'lost-found') {
           if (lostFoundType === 'lost') {
             notifTitle = '🔍 Item Lost'
             notifBody = `Lost: ${title}${reward > 0 ? ` - ₹${reward} reward` : ''}`
             notifType = 'lost_item'
           } else {
             notifTitle = '✨ Item Found'
             notifBody = `Found: ${title} - Claim it now!`
             notifType = 'found_item'
           }
        } else {
           notifBody = `${emoji} ${title}${price > 0 ? ` - ₹${price.toLocaleString()}` : ''}`
        }

        // DB Notifications
        const dbNotifications = allUsers.map(u => ({
          userId: u._id,
          type: notifType,
          title: notifTitle,
          message: notifBody,
          listingId: listingId,
          link: `/listing/${listingId}`,
          icon: emoji,
          read: false,
          createdAt: new Date()
        }))

        // Insert notifications asynchronously (don't block response too long)
        await db.collection('notifications').insertMany(dbNotifications)

        // Firebase Push
        const tokens = allUsers.map(u => u.fcmToken)
        const messaging = getMessaging() 
        
        // Use try-catch specifically for the external API call
        try {
          await messaging.sendEachForMulticast({
            tokens: tokens,
            notification: { title: notifTitle, body: notifBody },
            data: { url: `/listing/${listingId}`, listingId: listingId.toString() }
          })
          console.log(`🔔 Notifications sent to ${tokens.length} users`)
        } catch (fcmError) {
          console.error('FCM Send Error:', fcmError)
        }
      }

    } catch (notifError) {
      // Just log error, do NOT fail the request
      console.error('❌ Notification logic failed:', notifError)
    }

    return NextResponse.json({
      success: true,
      message: 'Listing created successfully',
      listingId: listingId
    })

  } catch (error) {
    console.error('❌ Create listing error:', error)
    return NextResponse.json(
      { error: 'Failed to create listing' },
      { status: 500 }
    )
  }
}