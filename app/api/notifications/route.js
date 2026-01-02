import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import { ObjectId } from 'mongodb'

export async function GET(request) {
  try {
    // 1. Verify authentication
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)

    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    // 2. Validate and convert userId
    let userId
    try {
      userId = new ObjectId(decoded.userId)
    } catch (err) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db('nitc-marketplace')

    // 3. Fetch raw notifications (fetch extra to account for cleanup)
    const rawNotifications = await db.collection('notifications')
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(60)
      .toArray()

    if (rawNotifications.length === 0) {
      return NextResponse.json({ notifications: [] })
    }

    const validNotifications = []
    const invalidNotificationIds = []
    
    // Arrays to collect IDs for batch verification
    const listingIds = []
    const postIds = []
    const eventIds = []

    // 4. Categorize resource IDs by type
    rawNotifications.forEach(notif => {
      // Skip if no resourceId (legacy notifications or system messages)
      if (!notif.resourceId || !notif.resourceType) return
      
      try {
        const resourceObjectId = new ObjectId(notif.resourceId)
        
        if (notif.resourceType === 'listing') {
          listingIds.push(resourceObjectId)
        } else if (notif.resourceType === 'community_post') {
          postIds.push(resourceObjectId)
        } else if (notif.resourceType === 'event') {
          eventIds.push(resourceObjectId)
        }
      } catch (err) {
        // Invalid ObjectId format - mark for deletion
        invalidNotificationIds.push(notif._id)
      }
    })

    // 5. Batch fetch existing resources (only fetch _id for performance)
    const [existingListings, existingPosts, existingEvents] = await Promise.all([
      listingIds.length > 0 
        ? db.collection('listings').find({ _id: { $in: listingIds } }).project({ _id: 1 }).toArray() 
        : [],
      postIds.length > 0 
        ? db.collection('community_posts').find({ _id: { $in: postIds } }).project({ _id: 1 }).toArray() 
        : [],
      eventIds.length > 0 
        ? db.collection('events').find({ _id: { $in: eventIds } }).project({ _id: 1 }).toArray() 
        : []
    ])

    // Convert to Sets for O(1) lookup
    const validListingSet = new Set(existingListings.map(item => item._id.toString()))
    const validPostSet = new Set(existingPosts.map(item => item._id.toString()))
    const validEventSet = new Set(existingEvents.map(item => item._id.toString()))
    
    // Track seen notification IDs to prevent duplicates
    const seenNotificationIds = new Set()
    // Track seen resource IDs to prevent duplicate notifications for same resource
    const seenResourceIds = new Set()

    // 6. Filter and validate notifications
    for (const notif of rawNotifications) {
      let isValid = true

      // A. Check for duplicate notification IDs
      const notifIdStr = notif._id.toString()
      if (seenNotificationIds.has(notifIdStr)) {
        invalidNotificationIds.push(notif._id)
        continue
      }
      seenNotificationIds.add(notifIdStr)

      // B. Check for legacy notifications (missing resourceId for specific types)
      const requiresResource = ['listing', 'community_post', 'event'].includes(notif.resourceType)
      if (requiresResource && !notif.resourceId) {
        isValid = false
      }

      // C. Verify resource still exists
      if (notif.resourceId && notif.resourceType) {
        const resourceIdStr = notif.resourceId.toString()
        
        // Check resource existence based on type
        if (notif.resourceType === 'listing' && !validListingSet.has(resourceIdStr)) {
          isValid = false
        } else if (notif.resourceType === 'community_post' && !validPostSet.has(resourceIdStr)) {
          isValid = false
        } else if (notif.resourceType === 'event' && !validEventSet.has(resourceIdStr)) {
          isValid = false
        }

        // D. Optional: Prevent duplicate notifications for same resource
        // (Uncomment if you want only one notification per resource)
        /*
        if (seenResourceIds.has(resourceIdStr)) {
          invalidNotificationIds.push(notif._id)
          continue
        }
        seenResourceIds.add(resourceIdStr)
        */
      }

      // E. Add to results or mark for deletion
      if (isValid) {
        validNotifications.push(notif)
      } else {
        invalidNotificationIds.push(notif._id)
      }
    }

    // 7. Cleanup: Delete invalid notifications in background
    if (invalidNotificationIds.length > 0) {
      // Don't await - let it happen in background
      db.collection('notifications')
        .deleteMany({ _id: { $in: invalidNotificationIds } })
        .then(() => {
          console.log(`🧹 Cleaned up ${invalidNotificationIds.length} invalid notifications for user ${decoded.userId}`)
        })
        .catch(err => {
          console.error('Failed to cleanup notifications:', err)
        })
    }

    // 8. Limit to 50 most recent valid notifications
    const finalNotifications = validNotifications.slice(0, 50)

    return NextResponse.json({ 
      notifications: finalNotifications,
      total: finalNotifications.length,
      cleaned: invalidNotificationIds.length
    })

  } catch (error) {
    console.error('❌ Fetch notifications error:', error)
    
    // Return more details in development
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({ 
        error: 'Failed to fetch notifications',
        details: error.message 
      }, { status: 500 })
    }
    
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}