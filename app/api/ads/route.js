import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { verifyToken } from '@/lib/auth'

// 1. GET: Fetch Ads (Supports filtering by 'home' or 'events')
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const placement = searchParams.get('placement') // 'home', 'events', or null (for admin)

    
    const db = await getDb()
    // Base query: Active ads only
    let query = { active: true }

    // If 'home' is requested, show 'home' + 'all' ads
    if (placement === 'home') {
      query.placement = { $in: ['home', 'all', null] } 
    }
    // If 'events' is requested, show 'events' + 'all' ads
    else if (placement === 'events') {
      query.placement = { $in: ['events', 'all'] }
    }
    // If NO placement is sent (Admin Panel), return EVERYTHING (even inactive if you wanted)
    // For now, we return all active ads for the dashboard to see.
    
    const ads = await db.collection('ads')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({ ads }, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=59',
      }
    })
    
  } catch (error) {
    console.error('Fetch ads error:', error)
    return NextResponse.json({ error: 'Failed to fetch ads' }, { status: 500 })
  }
}

// 2. POST: Create a New Ad
export async function POST(request) {
  try {
    // Auth Check
    const token = request.headers.get('authorization')?.split(' ')[1]
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const data = await request.json()
    const { title, imageUrl, link, type, description, placement } = data

    if (!title || !imageUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    
    const db = await getDb()
    const newAd = {
      title,
      imageUrl,
      link: link || '',
      type: type || 'local',
      description: description || '',
      placement: placement || 'all', // Default to showing everywhere
      active: true,
      createdAt: new Date()
    }

    await db.collection('ads').insertOne(newAd)

    return NextResponse.json({ success: true, message: 'Ad created successfully' })

  } catch (error) {
    return NextResponse.json({ error: 'Failed to create ad' }, { status: 500 })
  }
}

// 3. PUT: Update an Existing Ad
export async function PUT(request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1]
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const data = await request.json()
    const { _id, title, imageUrl, link, type, description, placement } = data

    if (!_id) return NextResponse.json({ error: 'Ad ID required' }, { status: 400 })

    
    const db = await getDb()
    await db.collection('ads').updateOne(
      { _id: new ObjectId(_id) },
      { 
        $set: { 
          title, 
          imageUrl, 
          link, 
          type, 
          description,
          placement,
          updatedAt: new Date() 
        } 
      }
    )

    return NextResponse.json({ success: true, message: 'Ad updated' })

  } catch (error) {
    return NextResponse.json({ error: 'Failed to update ad' }, { status: 500 })
  }
}

// 4. DELETE: Remove an Ad
export async function DELETE(request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1]
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    
    const db = await getDb()
    await db.collection('ads').deleteOne({ _id: new ObjectId(id) })

    return NextResponse.json({ success: true, message: 'Ad deleted' })

  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete ad' }, { status: 500 })
  }
}