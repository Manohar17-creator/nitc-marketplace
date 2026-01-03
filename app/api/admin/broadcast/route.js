import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { sendTargetedNotification, broadcastNotification } from '@/lib/notifications';

export async function POST(request) {
  try {
    // 1. Basic Auth Check
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse Request Body
    const { title, message, type, userIds, link } = await request.json();

    // 3. Identify Sender for Logs
    const sender = decoded.email || decoded.name || decoded.userId || 'Unknown User';

    // 4. Logic Branching: Targeted vs Global
    if (userIds && Array.isArray(userIds) && userIds.length > 0) {
      // 🎯 TARGETED MODE
      // Ensure lib/notifications.js is updated to handle 'fcmTokens' as an array
      await sendTargetedNotification({ 
        userIds, 
        title, 
        message, 
        type: type || 'info', 
        link: link || '/notifications' 
      });
      
      console.log(`🎯 Targeted notification sent by ${sender} to ${userIds.length} users.`);
    } else {
      // 📢 BROADCAST MODE
      // Sends to the 'all_users' Firebase topic and all DB user records
      await broadcastNotification({ 
        title, 
        message, 
        type: type || 'info', 
        link: link || '/announcements' 
      });
      
      console.log(`📢 Global broadcast triggered by user: ${sender}`);
    }

    return NextResponse.json({ 
      success: true, 
      mode: userIds?.length > 0 ? 'targeted' : 'broadcast' 
    });

  } catch (error) {
    console.error('Notification system error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}