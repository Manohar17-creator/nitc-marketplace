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
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db('nitc-marketplace')

    // 1. Check if user is a member
    const member = await db.collection('community_members').findOne({
      userId: new ObjectId(decoded.userId),
      communityId: new ObjectId(id)
    })

    if (!member) {
      return NextResponse.json(
        { error: 'Must be a member to post' },
        { status: 403 }
      )
    }

    const user = await db.collection('users').findOne({
      _id: new ObjectId(decoded.userId)
    })

    // 2. 🛡️ RATE LIMITING (Spam Protection)
    const COOLDOWN_MS = 60 * 1000; // 1 Minute
    const now = Date.now();
    const lastPosted = user.lastPostedAt ? new Date(user.lastPostedAt).getTime() : 0;

    if (now - lastPosted < COOLDOWN_MS) {
      const waitSeconds = Math.ceil((COOLDOWN_MS - (now - lastPosted)) / 1000);
      return NextResponse.json(
        { error: `Please wait ${waitSeconds}s before posting again.` },
        { status: 429 } // 429 = Too Many Requests
      );
    }

    const data = await request.json()
    const { type, title, content, embedUrl, embedType } = data

    // 3. Create the Post
    const newPost = {
      communityId: new ObjectId(id),
      authorId: new ObjectId(decoded.userId),
      authorName: user.name,
      authorEmail: user.email,
      authorImage: user.image || null, // Good to have for the UI
      type,
      title: title || '',
      content,
      embedUrl: embedUrl || null,
      embedType: embedType || null,
      commentCount: 0,
      createdAt: new Date()
    }

    const result = await db.collection('community_posts').insertOne(newPost)

    // 4. Update stats and timestamp (Concurrent operations)
    await Promise.all([
      // Increment post count
      db.collection('communities').updateOne(
        { _id: new ObjectId(id) },
        { $inc: { postCount: 1 } }
      ),
      // Update user's last posted time (for rate limiting)
      db.collection('users').updateOne(
        { _id: new ObjectId(decoded.userId) },
        { $set: { lastPostedAt: new Date() } }
      )
    ]);

    return NextResponse.json({
      message: 'Post created',
      postId: result.insertedId
    })

  } catch (error) {
    console.error('Create post error:', error)
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    )
  }
}