import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import { ObjectId } from 'mongodb'

// GET - Fetch community posts
export async function GET(request, context) {
  try {
    // In Next.js 15, params must be awaited
    const params = await context.params
    const id = params.id
    
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // feed, job, showcase

    const client = await clientPromise
    const db = client.db('nitc-marketplace')

    let query = { communityId: new ObjectId(id) }
    if (type && type !== 'all') {
      query.type = type
    }

    const posts = await db
      .collection('community_posts')
      .find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray()

    return NextResponse.json({ posts })

  } catch (error) {
    console.error('Get posts error:', error)
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

    const client = await clientPromise
    const db = client.db('nitc-marketplace')

    // 1. Member Check
    const member = await db.collection('community_members').findOne({
      userId: new ObjectId(decoded.userId),
      communityId: new ObjectId(id)
    })
    if (!member) return NextResponse.json({ error: 'Must be a member' }, { status: 403 })

    const user = await db.collection('users').findOne({ _id: new ObjectId(decoded.userId) })

    // 2. Rate Limiting
    const COOLDOWN_MS = 60 * 1000;
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
  authorImage: user.image || null,
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