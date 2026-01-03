import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import { ObjectId } from 'mongodb'

// GET - Fetch community posts
export async function GET(request, context) {
  try {
    // 1. Await params for Next.js 15 compatibility
    const params = await context.params
    const id = params.id
    
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    
    const db = await getDb()
    // 2. Build the initial match filter
    let matchStage = { communityId: new ObjectId(id) }
    
    // ✅ FIXED: Properly handle feed filtering
    if (type === 'feed') {
      // Feed should show only 'feed' and 'job' posts, NOT portfolio
      matchStage.$or = [
        { type: 'feed' },
        { type: 'job' }
      ]
    } else if (type && type !== 'all') {
      // For specific types (job, portfolio), show only that type
      matchStage.type = type
    }
    // If type is 'all' or null, show everything (no additional filter)

    // 3. Use Aggregation to pull the LATEST profile pictures
    const posts = await db.collection('community_posts').aggregate([
      { $match: matchStage },
      {
        // Join with the users collection to get fresh profile data
        $lookup: {
          from: 'users',
          localField: 'authorId',
          foreignField: '_id',
          as: 'authorInfo'
        }
      },
      { $unwind: { path: '$authorInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          title: 1,
          content: 1,
          imageUrls: 1,
          embedUrl: 1,
          embedType: 1,
          type: 1,
          authorId: 1,
          communityId: 1,
          commentCount: 1,
          createdAt: 1,
          // ✅ Dynamically fetch the latest name and picture from the User document
          authorName: { $ifNull: ['$authorInfo.name', '$authorName'] },
          authorImage: '$authorInfo.picture' 
        }
      },
      { $sort: { createdAt: -1 } },
      { $limit: 50 }
    ]).toArray()

    return NextResponse.json({ posts })

  } catch (error) {
    console.error('Get posts aggregation error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}

// POST - Create new post
export async function POST(request, context) {
  try {
    const params = await context.params
    const id = params.id
    const token = request.headers.get('authorization')?.split(' ')[1]
    
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    
    const db = await getDb()
    // 1. Member Check
    const member = await db.collection('community_members').findOne({
      userId: new ObjectId(decoded.userId),
      communityId: new ObjectId(id)
    })
    if (!member) return NextResponse.json({ error: 'Must be a member' }, { status: 403 })

    const user = await db.collection('users').findOne({ _id: new ObjectId(decoded.userId) })

    // 2. Rate Limiting
    const COOLDOWN_MS = 10 * 1000;
    const now = Date.now();
    const lastPosted = user.lastPostedAt ? new Date(user.lastPostedAt).getTime() : 0;

    if (now - lastPosted < COOLDOWN_MS) {
      return NextResponse.json({ error: `Please wait before posting.` }, { status: 429 });
    }

    const data = await request.json()
    const { type, title, content, embedUrl, embedType, imageUrl, imageUrls } = data

    // 3. Create Post
    const newPost = {
  communityId: new ObjectId(id),
  authorId: new ObjectId(decoded.userId),
  authorName: user.name,
  authorEmail: user.email,
  authorImage: user.picture || null,
  type,
  title: title || '',
  content,
  embedUrl: embedUrl || null,
  embedType: embedType || null,
  imageUrl: imageUrl || null, // ← Add this line for Cloudinary uploads
  imageUrls: imageUrls || [], // ← Add this line for multiple images
  commentCount: 0,
  createdAt: new Date()
}

    const result = await db.collection('community_posts').insertOne(newPost)

    // 4. Update Stats
    await Promise.all([
      db.collection('communities').updateOne({ _id: new ObjectId(id) }, { $inc: { postCount: 1 } }),
      db.collection('users').updateOne({ _id: new ObjectId(decoded.userId) }, { $set: { lastPostedAt: new Date() } })
    ]);

    // 5. ✅ NOTIFICATION LOGIC: Notify other members
    // Get members excluding the author
    const communityMembers = await db.collection('community_members')
      .find({ 
        communityId: new ObjectId(id), 
        userId: { $ne: new ObjectId(decoded.userId) } 
      })
      .project({ userId: 1 })
      .toArray()

    if (communityMembers.length > 0) {
      // Get community name for the message
      const community = await db.collection('communities').findOne({ _id: new ObjectId(id) })
      
      const notifications = communityMembers.map(m => ({
        userId: m.userId,
        type: 'post', // Matches your frontend icon
        title: `New Post in ${community?.name || 'Community'}`,
        message: `${user.name} posted: "${(title || content).substring(0, 30)}..."`,
        link: `/community/${id}`, // Link to the community
        resourceId: result.insertedId, // Store ID to check if deleted later
        resourceType: 'community_post',
        read: false,
        createdAt: new Date()
      }))

      await db.collection('notifications').insertMany(notifications)
    }

    return NextResponse.json({ message: 'Post created', postId: result.insertedId })

  } catch (error) {
    console.error('Create post error:', error)
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}