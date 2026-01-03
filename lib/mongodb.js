import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI
const options = {}

let client
let clientPromise

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongo URI to .env.local')
}

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options)
    global._mongoClientPromise = client.connect()
  }
  clientPromise = global._mongoClientPromise
} else {
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

// ✅ Add this function to replace the repetitive two lines
export async function getDb() {
  const client = await clientPromise;
  
  // Automatically switch database based on environment
  const dbName = process.env.NODE_ENV === 'development' 
    ? 'nitc-marketplace-dev' 
    : 'nitc-marketplace';
    
  return client.db(dbName);
}

export default clientPromise