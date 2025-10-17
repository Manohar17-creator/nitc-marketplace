const { MongoClient } = require('mongodb')

const uri = "mongodb+srv://manoharkandula1706_db_user:BfIEESdYMoFpmoAF@cluster0.1tckzpa.mongodb.net/nitc-marketplace?retryWrites=true&w=majority&appName=Cluster0"

async function test() {
  try {
    const client = new MongoClient(uri)
    await client.connect()
    console.log("✅ Connected successfully!")
    await client.close()
  } catch (error) {
    console.error("❌ Connection failed:", error.message)
  }
}

test()