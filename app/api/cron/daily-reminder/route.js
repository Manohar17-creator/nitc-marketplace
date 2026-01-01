import { NextResponse } from 'next/server';
import { broadcastNotification } from '@/lib/notifications'; 
// ^ Make sure this path points to your actual notification helper

export async function GET(request) {
  // 1. Security Check (So random people can't spam your users)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log("🔔 Sending Daily Attendance Reminder...");

    // 2. Send the Broadcast
    // This sends to EVERYONE subscribed to your notifications
    await broadcastNotification({
      title: "Good Morning! ☀️",
      message: "Don't forget to mark your attendance today.",
      type: "info", 
      link: "/attendance" // Clicking notification opens Attendance page
    });

    return NextResponse.json({ success: true, message: "Reminder sent!" });

  } catch (error) {
    console.error('Reminder failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}