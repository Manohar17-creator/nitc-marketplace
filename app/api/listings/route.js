import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { verifyToken } from '@/lib/auth'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getMessaging } from 'firebase-admin/messaging'

// --- 1. Initialize Firebase Admin SDK (Modular Style) ---
if (getApps().length === 0) {
  try {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    })
    console.log('🔥 Firebase Admin Initialized (Modular)')
  } catch (error) {
    console.error('Firebase Admin Init Error:', error)
  }
}

// GET all listings (Optimized with Caching)
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

    // 👇 UPDATED: Added Cache-Control Headers
    // This saves the result for 60 seconds to protect your DB
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
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
      }
    })

  } catch (error) {
    console.error('Get listings error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch listings', details: error.message },
      { status: 500 }
    )
  }
}

// POST new listing (Unchanged - No Caching for Creation)
export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1]
    
    let userInfo = { 
      name: 'Anonymous User',
      phone: '+91 98765 43210',
      email: 'user@nitc.ac.in',
      userId: null
    }

    // Verify token and get user info
    if (token && token !== 'null' && token !== 'undefined') {
      try {
        const decoded = verifyToken(token)
        if (decoded) {
          const client = await clientPromise
          const db = client.db('nitc-marketplace')
          const user = await db.collection('users').findOne({
             $or: [
              { _id: new ObjectId(decoded.userId) },
              { _id: decoded.userId } 
             ]
          })
          if (user) {
            userInfo = {
              name: user.name,
              phone: user.phone,
              email: user.email,
              userId: user._id
            }
          }
        }
      } catch (err) {
        console.log('Token verification failed, using anonymous')
      }
    }

    const data = await request.json()
    const { 
      title, 
      description, 
      price, 
      category, 
      images, 
      location, 
      lostFoundType, 
      reward, 
      lastSeenLocation, 
      lastSeenDate, 
      contactMethod 
    } = data

    // Validation
    if (!title || !description || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: title, description, category' },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db('nitc-marketplace')

    // Create listing object
    const newListing = {
      title,
      description,
      price: price ? Number(price) : 0,
      category,
      images: images || [],
      seller: userInfo.userId, 
      sellerName: userInfo.name,
      sellerPhone: userInfo.phone,
      sellerEmail: userInfo.email,
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

    const result = await db.collection('listings').insertOne(newListing)
    const listingId = result.insertedId

    console.log(`✅ Listing created: ${listingId}`)

    // --- 🚨 NOTIFICATIONS LOGIC ---
    try {
      const allUsers = await db.collection('users')
        .find({ 
          fcmToken: { $exists: true, $ne: null },
          // email: { $ne: userInfo.email } 
        })
        .project({ _id: 1, fcmToken: 1 })
        .toArray()

      if (allUsers.length > 0) {
        console.log(`📣 Found ${allUsers.length} users to notify`)

        // Prepare Message Content
        const categoryEmojis = {
          books: '📚', electronics: '💻', tickets: '🎫', rides: '🚗',
          housing: '🏠', events: '🎉', misc: '🎁',
          'lost-found': lostFoundType === 'lost' ? '🔍' : '✨' 
        }
        const emoji = categoryEmojis[category] || '📦'

        let notifTitle, notifBody, notifType

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
          notifTitle = '🛍️ New Listing'
          notifBody = `${emoji} ${title}${price > 0 ? ` - ₹${price.toLocaleString()}` : ''}`
          notifType = 'new_listing'
        }

        // 1. DB Notifications
        const dbNotifications = allUsers.map(user => ({
          userId: user._id,
          type: notifType,
          title: notifTitle,
          message: notifBody,
          listingId: listingId,
          link: `/listing/${listingId}`,
          icon: emoji,
          read: false,
          createdAt: new Date()
        }))

        await db.collection('notifications').insertMany(dbNotifications)
        console.log(`📬 DB Notifications saved`)

        // 2. Push Notifications
        const tokens = allUsers.map(u => u.fcmToken)
        
        const messaging = getMessaging() 
        const pushResponse = await messaging.sendEachForMulticast({
          tokens: tokens,
          notification: {
            title: notifTitle,
            body: notifBody,
          },
          data: {
            url: `/listing/${listingId}`,
            listingId: listingId.toString()
          },
          android: {
            priority: 'high',
            notification: {
              priority: 'max',
              channelId: 'default'
            }
          },
          apns: {
            payload: {
              aps: {
                contentAvailable: true
              }
            }
          }
        })

        console.log(`🔔 Push Result: ${pushResponse.successCount} sent`)
        if (pushResponse.failureCount > 0) {
          pushResponse.responses.forEach((resp, idx) => {
            if (!resp.success) {
              console.error(`❌ Failure for token ${idx}:`, resp.error);
            }
          });
        }

      } else {
        console.log('📭 No users with tokens found')
      }

    } catch (notifError) {
      console.error('❌ FATAL Notification error:', notifError)
    }

    return NextResponse.json({
      success: true,
      message: 'Listing created successfully',
      listingId: listingId
    })

  } catch (error) {
    console.error('❌ Create listing error:', error)
    return NextResponse.json(
      { error: 'Failed to create listing', details: error.message },
      { status: 500 }
    )
  }
}