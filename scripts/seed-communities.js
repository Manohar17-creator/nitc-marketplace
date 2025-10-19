const { MongoClient } = require('mongodb')

const communities = [
  {
    name: "Video Editing & Filmmaking",
    description: "Share your edits, get feedback, collaborate on films",
    icon: "🎬",
    color: "#e11d48",
    category: "creative",
    memberCount: 0,
    postCount: 0
  },
  {
    name: "Web Development",
    description: "Frontend, backend, full-stack discussions and projects",
    icon: "💻",
    color: "#2563eb",
    category: "technical",
    memberCount: 0,
    postCount: 0
  },
  {
    name: "Photography",
    description: "Share your shots, learn techniques, find photowalk buddies",
    icon: "📸",
    color: "#9333ea",
    category: "creative",
    memberCount: 0,
    postCount: 0
  },
  {
    name: "Graphic Design & UI/UX",
    description: "Design critique, portfolio showcase, find design gigs",
    icon: "🎨",
    color: "#ea580c",
    category: "creative",
    memberCount: 0,
    postCount: 0
  },
  {
    name: "App Development",
    description: "iOS, Android, Flutter - build apps together",
    icon: "📱",
    color: "#16a34a",
    category: "technical",
    memberCount: 0,
    postCount: 0
  },
  {
    name: "Content Writing",
    description: "Bloggers, writers, poets - share and improve",
    icon: "✍️",
    color: "#ca8a04",
    category: "creative",
    memberCount: 0,
    postCount: 0
  },
  {
    name: "AI/ML & Data Science",
    description: "Machine learning projects, datasets, research",
    icon: "🤖",
    color: "#7c3aed",
    category: "technical",
    memberCount: 0,
    postCount: 0
  },
  {
    name: "Entrepreneurship & Startups",
    description: "Build your startup, find co-founders, pitch ideas",
    icon: "🚀",
    color: "#dc2626",
    category: "business",
    memberCount: 0,
    postCount: 0
  },
  {
    name: "Event Management",
    description: "Organize fests, workshops, and campus events",
    icon: "🎉",
    color: "#db2777",
    category: "business",
    memberCount: 0,
    postCount: 0
  },
  {
    name: "Music Production",
    description: "Producers, singers, musicians - collaborate and jam",
    icon: "🎵",
    color: "#0891b2",
    category: "creative",
    memberCount: 0,
    postCount: 0
  }
]

async function seedCommunities() {
    require('dotenv').config({ path: '.env.local' })

// ...existing code...
    if (!process.env.MONGODB_URI) {
        console.error('Please define MONGODB_URI in .env file')
        process.exit(1)
    }
  const uri = process.env.MONGODB_URI
  const client = new MongoClient(uri)
  
  try {
    await client.connect()
    const db = client.db('nitc-marketplace')
    
    const result = await db.collection('communities').insertMany(
      communities.map(c => ({
        ...c,
        createdAt: new Date()
      }))
    )
    
    console.log(`✅ Added ${result.insertedCount} communities`)
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await client.close()
  }
}

seedCommunities()