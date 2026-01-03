import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth'; // Removed isAdmin import
import { sendTargetedNotification, broadcastNotification } from '@/lib/notifications';

export async function POST(request) {
  try {
    // 1. Basic Auth Check (User must be logged in)
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    
    // If no token is provided, we still want to block the request
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized - Please Log In' }, { status: 401 });
    }

    // 2. Parse the request body
    const { title, message, type, userIds, link } = await request.json();

    // 3. Logic Branching: Targeted vs Global
    if (userIds && Array.isArray(userIds) && userIds.length > 0) {
      // 🎯 TARGETED MODE
      // Sends to specific IDs provided in the array
      await sendTargetedNotification({ 
        userIds, 
        title, 
        message, 
        type: type || 'info', 
        link: link || '/notifications' 
      });
      
      console.log(`🎯 Targeted notification sent by ${decoded.email || decoded.userId} to ${userIds.length} users.`);
    } else {
      // 📢 BROADCAST MODE
      // Sends to every active user in the system
      await broadcastNotification({ 
        title, 
        message, 
        type: type || 'info', 
        link: link || '/announcements' 
      });
      
      console.log(`📢 Global broadcast triggered by user: ${decoded.email}`);
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