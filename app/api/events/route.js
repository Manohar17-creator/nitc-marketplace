import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import { ObjectId } from 'mongodb'
import admin from 'firebase-admin'

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.error('❌ Firebase Init Error:', error);
  }
}

// GET: Fetch Events + Mix in Ads
export async function GET(request) {
  try {
    const db = await getDb()
    
    // 1. AUTO-DELETE EXPIRED EVENTS (24 hours after event date)
    const twentyFourHoursAgo = new Date()
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)
    
    await db.collection('events').deleteMany({
      eventDate: { $lt: twentyFourHoursAgo }
    })

    // 2. Fetch Active Ads for Events
    const ads = await db.collection('ads')
      .find({ 
        active: true, 
        placement: { $in: ['events', 'all', null] } 
      }) 
      .toArray()

    // 3. Fetch Upcoming Events (SORTED BY NEAREST DATE FIRST)
    const events = await db.collection('events')
      .find({ 
        hidden: { $ne: true } 
      }) 
      .sort({ eventDate: 1 }) // 1 = ascending (nearest first)
      .toArray()

    // 4. Construct the Feed
    const mixedFeed = []
    
    // Force Ad First
    if (ads.length > 0) {
      mixedFeed.push({ type: 'ad', data: ads[0] })
    }

    let adIndex = 1 
    
    // 5. Mix the rest
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
    const token = request.headers.get('authorization')?.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = await getDb();    
    const user = await db.collection('users').findOne({ _id: new ObjectId(decoded.userId) });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // 1. Rate Limiting (Cooldown)
    const COOLDOWN_MS = 30 * 1000;
    const lastAction = user.lastPostedAt ? new Date(user.lastPostedAt).getTime() : 0;
    if (Date.now() - lastAction < COOLDOWN_MS) {
      return NextResponse.json({ error: 'Please wait a moment' }, { status: 429 });
    }

    const data = await request.json();
    const { title, description, venue, eventDate, image } = data;

    // 2. Create Event Document
    const dateObj = new Date(eventDate);

    const newEvent = {
      title: String(title).trim(),
      description: description || '',
      venue: String(venue).trim(),
      image: image || null,
      eventDate: dateObj,
      organizer: { id: user._id, name: user.name },
      interested: [],
      reports: [],
      hidden: false,
      createdAt: new Date()
    };

    const result = await db.collection('events').insertOne(newEvent);
    
    await db.collection('users').updateOne(
      { _id: new ObjectId(user._id) }, 
      { $set: { lastPostedAt: new Date() } }
    );

    // 3. ✅ MOBILE NOTIFICATION LOGIC (FCM)
    (async () => {
      try {
        const usersWithTokens = await db.collection('users')
          .find({ fcmTokens: { $exists: true, $not: { $size: 0 } } })
          .project({ fcmTokens: 1 })
          .limit(100)
          .toArray();

        const tokens = usersWithTokens.flatMap(u => u.fcmTokens || []);

        if (tokens.length > 0) {
          await admin.messaging().sendEachForMulticast({
            tokens: tokens.slice(0, 500),
            notification: { 
              title: `📅 New Event: ${title}`, 
              body: `Happening at ${venue}` 
            },
            data: { url: '/events' }
          });
        }
      } catch (err) { console.error("FCM Background Error:", err); }
    })();

    return NextResponse.json({ success: true, eventId: result.insertedId });

  } catch (error) {
    console.error("POST Event Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
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
    
    const db = await getDb()
    const event = await db.collection('events').findOne({ _id: new ObjectId(id) })
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

    // Permission Check: Organizer or Admin
    const isOwner = event.organizer.id.toString() === decoded.userId
    const isAdmin = decoded.email === 'kandula_b220941ec@nitc.ac.in'
    if (!isOwner && !isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const dateObj = new Date(data.eventDate)

    await db.collection('events').updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          title: data.title,
          description: data.description,
          venue: data.venue,
          image: data.image || event.image,
          eventDate: dateObj,
          updatedAt: new Date()
        }
      }
    )

    return NextResponse.json({ message: 'Event updated successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}