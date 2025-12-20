import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import { ObjectId } from 'mongodb'

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
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // ✅ 1. RATE LIMITING (Spam Protection)
    const COOLDOWN_MS = 60 * 1000; // 1 Minute
    const now = Date.now();
    // Re-use 'lastPostedAt' so users can't spam posts AND events at the same time
    const lastActionTime = user.lastPostedAt ? new Date(user.lastPostedAt).getTime() : 0;

    if (now - lastActionTime < COOLDOWN_MS) {
      const waitSeconds = Math.ceil((COOLDOWN_MS - (now - lastActionTime)) / 1000);
      return NextResponse.json(
        { error: `Please wait ${waitSeconds}s before creating another event.` },
        { status: 429 }
      );
    }

    const data = await request.json()
    const { title, description, venue, eventDate, image } = data

    if (!title || !eventDate || !venue) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const dateObj = new Date(eventDate)
    const expiryObj = new Date(dateObj)
    expiryObj.setDate(expiryObj.getDate() + 1) // Expire 1 day after event date

    const newEvent = {
      title,
      description,
      venue,
      image: image || null,
      eventDate: dateObj,
      expiryDate: expiryObj, 
      organizer: {
        id: user._id,
        name: user.name,
        // email: user.email // Optional: Add if you want strict ownership checks later
      },
      interested: [],
      reports: [],
      hidden: false,
      createdAt: new Date()
    }

    // ✅ 2. Insert Event & Update User Cooldown in parallel
    await Promise.all([
      db.collection('events').insertOne(newEvent),
      db.collection('users').updateOne(
        { _id: user._id },
        { $set: { lastPostedAt: new Date() } }
      )
    ]);

    return NextResponse.json({ success: true, message: 'Event created!' })

  } catch (error) {
    console.error('Create event error:', error)
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
  }
}