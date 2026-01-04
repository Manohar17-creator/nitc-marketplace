import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = await getDb();
    
    // Find events where the user's ID exists in the interested array
    const interestedEvents = await db.collection('events')
      .find({ 
        interested: new ObjectId(decoded.userId),
        expiryDate: { $gt: new Date() } // Only show upcoming events
      })
      .sort({ eventDate: 1 })
      .toArray();

    return NextResponse.json({ events: interestedEvents });
  } catch (error) {
    console.error('Fetch interested events error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}