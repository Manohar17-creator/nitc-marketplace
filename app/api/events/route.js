import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import { ObjectId } from 'mongodb'
import { getMessaging } from 'firebase-admin/messaging'

// GET: Fetch Events + Mix in Ads
export async function GET(request) {
  try {
    const client = await clientPromise
    const db = client.db('nitc-marketplace')

    // 1. Fetch Active Ads for Events
    const ads = await db.collection('ads')
      .find({ 
        active: true, 
        placement: { $in: ['events', 'all', null] } 
      }) 
      .toArray()

    // 2. Fetch Upcoming Events
    const events = await db.collection('events')
      .find({ 
        expiryDate: { $gt: new Date() },
        hidden: { $ne: true } 
      }) 
      .sort({ eventDate: 1 }) 
      .toArray()

    // 3. Construct the Feed
    const mixedFeed = []
    
    // Force Ad First
    if (ads.length > 0) {
      mixedFeed.push({ type: 'ad', data: ads[0] })
    }

    let adIndex = 1 
    
    // 4. Mix the rest
    events.forEach((event, index) => {
      mixedFeed.push({ type: 'event', data: event })
      
      // Inject Ad after every 3rd event
      if ((index + 1) % 3 === 0 && ads.length > 0) {
        mixedFeed.push({ type: 'ad', data: ads[adIndex % ads.length] })
        adIndex++
      }
    })

    return NextResponse.json({ feed: mixedFeed }, {
      headers: { 'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=59' }
    })

  } catch (error) {
    console.error('Fetch events error:', error)
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
}

// POST: Create New Event
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

    // 1. Rate Limiting (Cooldown)
    const COOLDOWN_MS = 30 * 1000;
    const lastAction = user.lastPostedAt ? new Date(user.lastPostedAt).getTime() : 0;
    if (Date.now() - lastAction < COOLDOWN_MS) {
      return NextResponse.json({ error: 'Please wait a moment' }, { status: 429 });
    }

    const data = await request.json()
    const { title, description, venue, eventDate, image } = data

    // 2. Create Event Document
    const dateObj = new Date(eventDate)
    const expiryObj = new Date(dateObj); expiryObj.setDate(expiryObj.getDate() + 1);

    const newEvent = {
      title: String(title).trim(),
      description: description || '',
      venue: String(venue).trim(),
      image: image || null,
      eventDate: dateObj,
      expiryDate: expiryObj, 
      organizer: { id: user._id, name: user.name },
      interested: [],
      reports: [],
      hidden: false,
      createdAt: new Date()
    }

    const result = await db.collection('events').insertOne(newEvent)
    await db.collection('users').updateOne({ _id: user._id }, { $set: { lastPostedAt: new Date() } })

    // 3. ✅ MOBILE NOTIFICATION LOGIC (FCM)
    (async () => {
      try {
        const allUsers = await db.collection('users')
          .find({ fcmToken: { $exists: true, $ne: null }, _id: { $ne: user._id } })
          .project({ fcmToken: 1 })
          .limit(500)
          .toArray()

        if (allUsers.length > 0) {
          const tokens = [...new Set(allUsers.map(u => u.fcmToken))]
          const messaging = getMessaging()
          
          await messaging.sendEachForMulticast({
            tokens,
            notification: { 
              title: `📅 New Event: ${String(title).trim()}`, 
              body: `Happening at ${venue} on ${dateObj.toLocaleDateString()}` 
            },
            data: { url: '/events' },
            android: { priority: 'high' }
          })
        }
      } catch (err) { console.error("FCM Error:", err) }
    })()

    return NextResponse.json({ success: true, eventId: result.insertedId })

  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(request, context) {
  try {
    const { id } = await context.params
    const token = request.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const data = await request.json()
    const client = await clientPromise
    const db = client.db('nitc-marketplace')

    const event = await db.collection('events').findOne({ _id: new ObjectId(id) })
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

    // Permission Check: Organizer or Admin
    const isOwner = event.organizer.id.toString() === decoded.userId
    const isAdmin = decoded.email === 'kandula_b220941ec@nitc.ac.in'
    if (!isOwner && !isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const dateObj = new Date(data.eventDate)
    const expiryObj = new Date(dateObj); expiryObj.setDate(expiryObj.getDate() + 1)

    await db.collection('events').updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          title: data.title,
          description: data.description,
          venue: data.venue,
          image: data.image || event.image,
          eventDate: dateObj,
          expiryDate: expiryObj,
          updatedAt: new Date()
        }
      }
    )

    return NextResponse.json({ message: 'Event updated successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}