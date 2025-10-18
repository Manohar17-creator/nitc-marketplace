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

    const client = await clientPromise
    const db = client.db('nitc-marketplace')

    let query = { status: 'active' }
    
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
export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1]
    
    // Get user info from token or localStorage
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
    const { title, description, price, category, images, location } = data

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
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    })

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