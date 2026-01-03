import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { verifyToken } from '@/lib/auth'

export async function GET(request, context) {
  try {
    const { id } = await context.params
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid listing ID' }, { status: 400 })
    }

    
    const db = await getDb()
    const listing = await db.collection('listings').findOne({
      _id: new ObjectId(id)
    })

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    // ✅ Ensure sellerPhone exists. If not found in listing, check user profile.
    if (!listing.sellerPhone) {
      const seller = await db.collection('users').findOne({ email: listing.sellerEmail })
      listing.sellerPhone = seller?.phone || 'Not Provided'
    }

    return NextResponse.json({ listing })

  } catch (error) {
    console.error('Get listing error:', error)
    return NextResponse.json({ error: 'Failed to fetch listing' }, { status: 500 })
  }
}

export async function DELETE(request, context) {
  try {
    const { id } = await context.params
    const token = request.headers.get('authorization')?.split(' ')[1]

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid listing ID' },
        { status: 400 }
      )
    }

    
    const db = await getDb()
    const listing = await db.collection('listings').findOne({
      _id: new ObjectId(id)
    })

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      )
    }

    // Allow deletion if user owns the listing or is anonymous
    if (listing.seller && listing.seller.toString() !== decoded.userId) {
      return NextResponse.json(
        { error: 'You can only delete your own listings' },
        { status: 403 }
      )
    }

    await db.collection('listings').deleteOne({
      _id: new ObjectId(id)
    })

    return NextResponse.json({ message: 'Listing deleted successfully' })

  } catch (error) {
    console.error('Delete listing error:', error)
    return NextResponse.json(
      { error: 'Failed to delete listing' },
      { status: 500 }
    )
  }
}

export async function PUT(request, context) {
  try {
    const { id } = await context.params
    const token = request.headers.get('authorization')?.split(' ')[1]

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded || !ObjectId.isValid(id)) return NextResponse.json({ error: 'Invalid Request' }, { status: 400 })

    const data = await request.json()
    // ✅ FIX: Extract Lost & Found specific fields from the request
    const { 
      title, description, price, category, location, status, 
      sellerPhone, reward, lostFoundType, lastSeenLocation, lastSeenDate 
    } = data

    
    const db = await getDb();    const listing = await db.collection('listings').findOne({ _id: new ObjectId(id) });

    if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const isOwner = listing.sellerEmail === decoded.email || listing.seller?.toString() === decoded.userId
    if (!isOwner) return NextResponse.json({ error: 'Access Denied' }, { status: 403 })

    await db.collection('listings').updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          title: title?.trim(),
          description: description?.trim(),
          price: Number(price) || 0,
          category,
          location,
          status,
          sellerPhone: sellerPhone || listing.sellerPhone,
          // ✅ FIX: Update Lost & Found specific fields
          reward: category === 'lost-found' ? Number(reward) || 0 : 0,
          lostFoundType: lostFoundType || listing.lostFoundType,
          lastSeenLocation: lastSeenLocation || location,
          lastSeenDate: lastSeenDate || listing.lastSeenDate,
          updatedAt: new Date()
        }
      }
    )

    return NextResponse.json({ message: 'Listing updated successfully' })
  } catch (error) {
    console.error('Update error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}