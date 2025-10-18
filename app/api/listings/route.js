import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { verifyToken } from '@/lib/auth'

// GET all listings
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const userEmail = searchParams.get('userEmail') // ← ADD THIS

    const client = await clientPromise
    const db = client.db('nitc-marketplace')

    let query = { status: 'active' }
    
    // Filter by user email if provided ← ADD THIS
    if (userEmail) {
      query.sellerEmail = userEmail
      delete query.status // Show all statuses for user's own listings
    }
    
    if (category && category !== 'all') {
      query.category = category
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    }

    const listings = await db
      .collection('listings')
      .find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray()

    return NextResponse.json({ listings })

  } catch (error) {
    console.error('Get listings error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch listings', details: error.message },
      { status: 500 }
    )
  }
}

// POST new listing
// POST new listing
export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1]
    
    let userInfo = { 
      name: 'Anonymous User',
      phone: '+91 98765 43210',
      email: 'user@nitc.ac.in'
    }

    if (token && token !== 'null' && token !== 'undefined') {
      try {
        const decoded = verifyToken(token)
        if (decoded) {
          const client = await clientPromise
          const db = client.db('nitc-marketplace')
          const user = await db.collection('users').findOne({
            _id: new ObjectId(decoded.userId)
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
    const { title, description, price, category, images, location, lostFoundType, reward, lastSeenLocation, lastSeenDate, contactMethod } = data

    const client = await clientPromise
    const db = client.db('nitc-marketplace')

    const result = await db.collection('listings').insertOne({
        title,
        description,
        price: Number(price),
        category,
        images: images || [],
        seller: userInfo.userId || null,
        sellerName: userInfo.name,
        sellerPhone: userInfo.phone,
        sellerEmail: userInfo.email,
        location,
        lostFoundType: lostFoundType || null,           // ← ADD THIS
        reward: reward ? Number(reward) : 0,             // ← ADD THIS
        lastSeenLocation: lastSeenLocation || location,  // ← ADD THIS
        lastSeenDate: lastSeenDate || null,              // ← ADD THIS
        contactMethod: contactMethod || 'phone',         // ← ADD THIS
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
        })

    // ✨ CREATE NOTIFICATIONS FOR ALL USERS ✨
    try {
      // Get all users
      const allUsers = await db.collection('users').find({}).toArray()
      
      // Get category emoji
      const categoryEmojis = {
        books: '📚',
        electronics: '💻',
        tickets: '🎫',
        rides: '🚗',
        housing: '🏠',
        events: '🎉',
        misc: '🎁',
        'lost-found': lostFoundType === 'lost' ? '😢' : '😊' 
      }
      const emoji = categoryEmojis[category] || '📦'

      // Create notification for each user (except the poster)
      let notificationMessage;
if (category === 'lost-found') {
  if (lostFoundType === 'lost') {  // ← CHANGE data.lostFoundType to lostFoundType
    notificationMessage = `${emoji} Lost: ${title}${reward > 0 ? ` - ₹${reward} reward` : ''}`
  } else {
    notificationMessage = `${emoji} Found: ${title} - Claim it now!`
  }
} else {
  notificationMessage = `${emoji} ${title} - ₹${price.toLocaleString()}`
}

        const notifications = allUsers
        .filter(user => user._id.toString() !== userInfo.userId?.toString())
        .map(user => ({
            userId: user._id,
            type: category === 'lost-found' ? 'lost_found' : 'new_listing',
            title: category === 'lost-found' 
            ? (data.lostFoundType === 'lost' ? 'Item Lost' : 'Item Found')
            : 'New Listing Posted',
            message: notificationMessage,
            listingId: result.insertedId,
            link: `/listing/${result.insertedId}`,
            icon: emoji,
            read: false,
            createdAt: new Date()
        }))

      if (notifications.length > 0) {
        await db.collection('notifications').insertMany(notifications)
      }
    } catch (notifError) {
      console.error('Failed to create notifications:', notifError)
      // Don't fail the listing creation if notifications fail
    }

    return NextResponse.json({
      message: 'Listing created successfully',
      listingId: result.insertedId
    })

  } catch (error) {
    console.error('Create listing error:', error)
    return NextResponse.json(
      { error: 'Failed to create listing', details: error.message },
      { status: 500 }
    )
  }
}