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
    // query: { $in: [..., null] } ensures OLD ads (without placement field) still show up
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
    
    // 👇 FORCE AD FIRST: Push the first Ad to index 0
    if (ads.length > 0) {
      const priorityAd = ads[0] 
      mixedFeed.push({ type: 'ad', data: priorityAd })
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
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
}

// POST: Create New Event
export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1]
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const data = await request.json()
    const { title, description, venue, eventDate, image } = data

    if (!title || !eventDate || !venue) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db('nitc-marketplace')
    const user = await db.collection('users').findOne({ _id: new ObjectId(decoded.userId) })

    const dateObj = new Date(eventDate)
    const expiryObj = new Date(dateObj)
    expiryObj.setDate(expiryObj.getDate() + 7) 

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
      },
      interested: [],
      reports: [],
      hidden: false,
      createdAt: new Date()
    }

    await db.collection('events').insertOne(newEvent)
    return NextResponse.json({ success: true, message: 'Event created!' })

  } catch (error) {
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
  }
}