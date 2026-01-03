import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import { ObjectId } from 'mongodb'

export async function GET(request) {
  try {
    // 1. Verify authentication
    const authHeader = request.headers.get('authorization')

    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)

    if (!decoded?.userId) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // 2. Validate userId
    let userId
    try {
      userId = new ObjectId(decoded.userId)
    } catch {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
    }

    const db = await getDb()

    // 3. Fetch notifications (extra for cleanup buffer)
    const rawNotifications = await db
      .collection('notifications')
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(60)
      .toArray()

    if (rawNotifications.length === 0) {
      return NextResponse.json({ notifications: [] })
    }

    const validNotifications = []
    const invalidNotificationIds = []

    const listingIds = []
    const postIds = []
    const eventIds = []

    // 4. Collect resource IDs safely
    for (const notif of rawNotifications) {
      if (!notif.resourceId || !notif.resourceType) continue

      try {
        const oid = new ObjectId(notif.resourceId)

        if (notif.resourceType === 'listing') listingIds.push(oid)
        else if (notif.resourceType === 'community_post') postIds.push(oid)
        else if (notif.resourceType === 'event') eventIds.push(oid)
      } catch {
        invalidNotificationIds.push(notif._id)
      }
    }

    // 5. Fetch existing resources (IDs only)
    const [existingListings, existingPosts, existingEvents] = await Promise.all([
      listingIds.length
        ? db
            .collection('listings')
            .find({ _id: { $in: listingIds } })
            .project({ _id: 1 })
            .toArray()
        : [],
      postIds.length
        ? db
            .collection('community_posts')
            .find({ _id: { $in: postIds } })
            .project({ _id: 1 })
            .toArray()
        : [],
      eventIds.length
        ? db
            .collection('events')
            .find({ _id: { $in: eventIds } })
            .project({ _id: 1 })
            .toArray()
        : []
    ])

    const validListingSet = new Set(existingListings.map(i => i._id.toString()))
    const validPostSet = new Set(existingPosts.map(i => i._id.toString()))
    const validEventSet = new Set(existingEvents.map(i => i._id.toString()))

    const seenNotificationIds = new Set()

    // 6. Validate notifications
    for (const notif of rawNotifications) {
      const notifIdStr = notif._id.toString()

      // Duplicate notification ID
      if (seenNotificationIds.has(notifIdStr)) {
        invalidNotificationIds.push(notif._id)
        continue
      }
      seenNotificationIds.add(notifIdStr)

      let isValid = true

      const requiresResource = ['listing', 'community_post', 'event'].includes(
        notif.resourceType
      )

      if (requiresResource && !notif.resourceId) {
        isValid = false
      }

      if (notif.resourceId && notif.resourceType) {
        const resourceIdStr = notif.resourceId.toString()

        if (
          (notif.resourceType === 'listing' &&
            !validListingSet.has(resourceIdStr)) ||
          (notif.resourceType === 'community_post' &&
            !validPostSet.has(resourceIdStr)) ||
          (notif.resourceType === 'event' &&
            !validEventSet.has(resourceIdStr))
        ) {
          isValid = false
        }
      }

      if (isValid) {
        validNotifications.push(notif)
      } else {
        invalidNotificationIds.push(notif._id)
      }
    }

    // 7. Cleanup invalid notifications (background)
    if (invalidNotificationIds.length) {
      db.collection('notifications')
        .deleteMany({ _id: { $in: invalidNotificationIds } })
        .catch(err =>
          console.error('❌ Notification cleanup failed:', err)
        )
    }

    // 8. Return most recent 50
    const finalNotifications = validNotifications.slice(0, 50)

    return NextResponse.json({
      notifications: finalNotifications,
      total: finalNotifications.length,
      cleaned: invalidNotificationIds.length
    })
  } catch (error) {
    console.error('❌ Fetch notifications error:', error)

    return NextResponse.json(
      process.env.NODE_ENV === 'development'
        ? { error: 'Failed to fetch notifications', details: error.message }
        : { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}
