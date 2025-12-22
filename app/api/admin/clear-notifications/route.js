import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function GET() {
  const client = await clientPromise
  const db = client.db('nitc-marketplace')
  
  // 🗑️ Deletes ALL notifications
  await db.collection('notifications').deleteMany({})
  
  return NextResponse.json({ success: true, message: "All notifications wiped!" })
}