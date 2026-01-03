import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { broadcastNotification } from '@/lib/notifications';

export async function GET(request) {
  // 🔒 Security: Only allow Vercel Cron to trigger this
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    ;
    const db = await getDb();
    
    // 1. Get Current Time details (in IST if your users are Indian)
    // We add 5.5 hours to UTC to get IST
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(now.getTime() + istOffset);

    const currentDay = istTime.getUTCDay(); // 0 (Sun) - 6 (Sat)
    const currentHour = istTime.getUTCHours(); // 0 - 23
    
    // Format today's date string (YYYY-MM-DD) to check duplicates
    const todayStr = istTime.toISOString().split('T')[0];

    console.log(`⏰ Heartbeat running. IST Time: ${istTime.toISOString()}`);

    // 2. Find eligible schedules
    const schedules = await db.collection('scheduled_notifications').find({
      isActive: true,
      endDate: { $gte: now }, // Not expired
      daysOfWeek: currentDay, // Must run today
      targetHour: currentHour, // Must run this hour
      // Ensure we haven't sent it already today
      lastSentDate: { $ne: todayStr } 
    }).toArray();

    if (schedules.length === 0) {
      return NextResponse.json({ message: 'No schedules matched this hour.' });
    }

    console.log(`🚀 Found ${schedules.length} schedules to run.`);

    // 3. Process each schedule
    const results = [];
    
    for (const job of schedules) {
      // Send the Broadcast
      await broadcastNotification({
        title: job.title,
        message: job.message,
        type: job.type || 'info',
        link: job.link
      });

      // Mark as "Done for today" so it doesn't send again in 5 mins
      await db.collection('scheduled_notifications').updateOne(
        { _id: job._id },
        { $set: { lastSentDate: todayStr } }
      );
      
      results.push(`Sent: ${job.title}`);
    }

    return NextResponse.json({ success: true, processed: results });

  } catch (error) {
    console.error('Scheduler Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}