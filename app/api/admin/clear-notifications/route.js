import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'

export async function GET() {
  
  const db = await getDb()  
  // 🗑️ Deletes ALL notifications
  await db.collection('notifications').deleteMany({})
  
  return NextResponse.json({ success: true, message: "All notifications wiped!" })
}