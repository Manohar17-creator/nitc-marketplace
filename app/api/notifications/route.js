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

    // 1. Fetch RAW notifications
    const rawNotifications = await db.collection('notifications')
      .find({ userId: new ObjectId(decoded.userId) })
      .sort({ createdAt: -1 })
      .limit(60) // Fetch slightly more to account for duplicates/deletions
      .toArray()

    const validNotifications = []
    
    // Arrays to collect IDs for verification
    const listingIds = []
    const postIds = []
    const eventIds = []

    // 🔍 Step 1: Categorize IDs
    rawNotifications.forEach(n => {
      if (!n.resourceId) return // Skip legacy items here, handled in loop below
      
      if (n.resourceType === 'listing') listingIds.push(new ObjectId(n.resourceId))
      else if (n.resourceType === 'community_post') postIds.push(new ObjectId(n.resourceId))
      else if (n.resourceType === 'event') eventIds.push(new ObjectId(n.resourceId))
    })

    // 🔍 Step 2: Batch Fetch Existence
    const [existingListings, existingPosts, existingEvents] = await Promise.all([
      listingIds.length > 0 ? db.collection('listings').find({ _id: { $in: listingIds } }).project({ _id: 1 }).toArray() : [],
      postIds.length > 0 ? db.collection('community_posts').find({ _id: { $in: postIds } }).project({ _id: 1 }).toArray() : [],
      eventIds.length > 0 ? db.collection('events').find({ _id: { $in: eventIds } }).project({ _id: 1 }).toArray() : []
    ])

    const validListingSet = new Set(existingListings.map(i => i._id.toString()))
    const validPostSet = new Set(existingPosts.map(i => i._id.toString()))
    const validEventSet = new Set(existingEvents.map(i => i._id.toString()))
    
    // Set to track duplicates
    const seenIds = new Set()

    // 🔍 Step 3: Strict Filtering
    for (const notif of rawNotifications) {
      let isValid = true

      // A. DEDUPLICATION CHECK
      // If we've already seen this exact Notification ID, skip it
      if (seenIds.has(notif._id.toString())) continue;
      seenIds.add(notif._id.toString());
      
      // Also check by Resource ID (prevent 2 notifications for same post)
      const uniqueKey = notif.resourceId ? notif.resourceId.toString() : notif._id.toString();
      // (Optional: You can add logic here if you want strict unique resources)

      // B. LEGACY / DELETED CHECK
      // If it's a specific type but MISSING resourceId -> It's old garbage -> Invalid
      if (['listing', 'post', 'event'].includes(notif.type) && !notif.resourceId) {
        isValid = false
      }

      // C. EXISTENCE CHECK
      if (notif.resourceId) {
        const idStr = notif.resourceId.toString()
        if (notif.resourceType === 'listing' && !validListingSet.has(idStr)) isValid = false
        if (notif.resourceType === 'community_post' && !validPostSet.has(idStr)) isValid = false
        if (notif.resourceType === 'event' && !validEventSet.has(idStr)) isValid = false
      }

      if (isValid) {
        validNotifications.push(notif)
      } else {
        // 🧹 Auto-Delete Dead Notifications (Clean DB)
        try {
           await db.collection('notifications').deleteOne({ _id: notif._id })
        } catch (e) { /* ignore error */ }
      }
    }

    return NextResponse.json({ notifications: validNotifications })

  } catch (error) {
    console.error('Fetch notifications error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}