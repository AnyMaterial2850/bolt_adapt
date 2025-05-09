import type { VercelRequest, VercelResponse } from '@vercel/node';
import webpush from 'web-push';
import fetch from 'node-fetch';

const VAPID_PUBLIC_KEY = process.env.SUPABASE_VAPID_PUBLIC_KEY || process.env.VITE_VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.SUPABASE_VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  throw new Error('VAPID keys are not configured');
}
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Supabase URL or Service Role Key not configured');
}

webpush.setVapidDetails(
  VAPID_SUBJECT,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).send('ok');
  }

  try {
    const { userId, habitId, title, body, data } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Fetch subscriptions from Supabase
    const subscriptionsRes = await fetch(`${SUPABASE_URL}/rest/v1/subscriptions?user_id=eq.${userId}`, {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        Accept: 'application/json',
      },
    });
    if (!subscriptionsRes.ok) {
      const errorText = await subscriptionsRes.text();
      return res.status(500).json({ error: `Error fetching subscriptions: ${errorText}` });
    }
    const subscriptions = await subscriptionsRes.json();

    if (!subscriptions || subscriptions.length === 0) {
      return res.status(200).json({ message: 'No subscriptions found for user' });
    }

    // Optionally fetch habit details
    let habitDetails: any = null;
    if (habitId) {
      const habitRes = await fetch(`${SUPABASE_URL}/rest/v1/habits?id=eq.${habitId}`, {
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          Accept: 'application/json',
        },
      });
      if (habitRes.ok) {
        const habits = await habitRes.json();
        if (habits && habits.length > 0) {
          habitDetails = habits[0];
        }
      }
    }

    const notificationTitle = title || (habitDetails ? `Time for: ${habitDetails.title}` : 'Reminder');
    let notificationBody = body || '';
    if (habitDetails && habitDetails.target && habitDetails.target.length > 0 && habitDetails.unit) {
      if (notificationBody) {
        notificationBody += ` (Target: ${habitDetails.target.join(', ')} ${habitDetails.unit})`;
      } else {
        notificationBody = `Target: ${habitDetails.target.join(', ')} ${habitDetails.unit}`;
      }
    }

    // Send push notifications
    const results = await Promise.allSettled(
      subscriptions.map(async (sub: any) => {
        try {
          const pushPayload = {
            title: notificationTitle,
            body: notificationBody,
            data: {
              ...data,
              habitId,
              timestamp: new Date().toISOString(),
            },
            tag: `habit-${habitId || 'general'}`,
            renotify: true,
            requireInteraction: true,
          };
          await webpush.sendNotification(sub, JSON.stringify(pushPayload));
          return { success: true, endpoint: sub.endpoint };
        } catch (error: any) {
          return {
            success: false,
            endpoint: sub.endpoint,
            error: error.message,
            statusCode: error.statusCode,
          };
        }
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled' && (r as PromiseFulfilledResult<any>).value.success).length;
    const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !(r as PromiseFulfilledResult<any>).value.success)).length;

    return res.status(200).json({
      message: `Sent ${successful} notifications, ${failed} failed`,
      results,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message, stack: error.stack });
  }
}
