import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import { ObjectId } from 'mongodb'

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.split(' ')[1]
    const decoded = verifyToken(token)

    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db('nitc-marketplace')

    // 1. Fetch RAW notifications for this user
    const rawNotifications = await db.collection('notifications')
      .find({ userId: new ObjectId(decoded.userId) })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray()

    // 2. 🧹 CLEANUP LOGIC: Filter out deleted items
    // We check if the resource linked to the notification still exists.
    
    const validNotifications = []
    
    // We will collect IDs to batch query (Optimization)
    const listingIds = []
    const postIds = []
    const eventIds = []

    rawNotifications.forEach(n => {
      // If it's a system broadcast, it's always valid
      if (n.type === 'broadcast') return;
      
      // If it has a resourceId, categorize it
      if (n.resourceId) {
        if (n.resourceType === 'listing') listingIds.push(new ObjectId(n.resourceId))
        if (n.resourceType === 'community_post') postIds.push(new ObjectId(n.resourceId))
        if (n.resourceType === 'event') eventIds.push(new ObjectId(n.resourceId))
      }
    })

    // Batch fetch existing IDs
    const [existingListings, existingPosts, existingEvents] = await Promise.all([
      listingIds.length > 0 ? db.collection('listings').find({ _id: { $in: listingIds } }).project({ _id: 1 }).toArray() : [],
      postIds.length > 0 ? db.collection('community_posts').find({ _id: { $in: postIds } }).project({ _id: 1 }).toArray() : [],
      eventIds.length > 0 ? db.collection('events').find({ _id: { $in: eventIds } }).project({ _id: 1 }).toArray() : []
    ])

    // Create sets for fast O(1) lookup
    const validListingSet = new Set(existingListings.map(i => i._id.toString()))
    const validPostSet = new Set(existingPosts.map(i => i._id.toString()))
    const validEventSet = new Set(existingEvents.map(i => i._id.toString()))

    // 3. Filter the list
    for (const notif of rawNotifications) {
      let isValid = true

      // Broadcasts are always valid
      if (notif.type === 'broadcast') {
        validNotifications.push(notif)
        continue
      }

      // Check specific resource types
      if (notif.resourceId) {
        const idStr = notif.resourceId.toString()
        
        if (notif.resourceType === 'listing' && !validListingSet.has(idStr)) isValid = false
        if (notif.resourceType === 'community_post' && !validPostSet.has(idStr)) isValid = false
        if (notif.resourceType === 'event' && !validEventSet.has(idStr)) isValid = false
      }

      if (isValid) {
        validNotifications.push(notif)
      } else {
        // OPTIONAL: Delete the dead notification from DB so we don't check it again
        // db.collection('notifications').deleteOne({ _id: notif._id }) 
      }
    }

    return NextResponse.json({ notifications: validNotifications })

  } catch (error) {
    console.error('Fetch notifications error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}