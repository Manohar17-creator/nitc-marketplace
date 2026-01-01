import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET() {
  const client = await clientPromise;
  const db = client.db('nitc-marketplace');
  // Fetch active schedules
  const schedules = await db.collection('scheduled_notifications')
    .find({ isActive: true }).sort({ createdAt: -1 }).toArray();
  return NextResponse.json({ schedules });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db('nitc-marketplace');

    // Basic Validation
    if (!body.title || !body.daysOfWeek?.length || !body.endDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newSchedule = {
      ...body,
      targetHour: parseInt(body.targetHour), // Ensure number
      endDate: new Date(body.endDate), // Ensure Date object
      lastSentDate: null,
      isActive: true,
      createdAt: new Date()
    };

    await db.collection('scheduled_notifications').insertOne(newSchedule);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  
  const client = await clientPromise;
  const db = client.db('nitc-marketplace');
  
  await db.collection('scheduled_notifications').deleteOne({ _id: new ObjectId(id) });
  return NextResponse.json({ success: true });
}