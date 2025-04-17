import type { VercelRequest, VercelResponse } from 'vercel';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

interface WebPushPayload {
  subscription: PushSubscription;
  title: string;
  body: string;
  data?: any;
  tag?: string;
  renotify?: boolean;
  requireInteraction?: boolean;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

interface PushSubscription {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface HabitDetails {
  title: string;
  category: string;
  target?: number[];
  unit?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.status(200).send('ok');
      return;
    }

    const VAPID_PUBLIC_KEY = process.env.VITE_VAPID_PUBLIC_KEY;
    const VAPID_PRIVATE_KEY = process.env.VITE_VAPID_PRIVATE_KEY;
    const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      console.error('VAPID keys not configured or missing');
      res.status(500).json({ error: 'VAPID keys not configured' });
      return;
    }

    webpush.setVapidDetails(
      VAPID_SUBJECT,
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY
    );

    const { userId, habitId, title, body, data } = req.body;

    if (!userId) {
      res.status(400).json({ error: 'userId is required' });
      return;
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: subscriptions, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId);

    if (subscriptionError) {
      res.status(500).json({ error: `Error fetching subscriptions: ${subscriptionError.message}` });
      return;
    }

    if (!subscriptions || subscriptions.length === 0) {
      res.status(200).json({ message: 'No subscriptions found for user' });
      return;
    }

    let habitDetails: HabitDetails | null = null;
    if (habitId) {
      const { data: habit, error: habitError } = await supabase
        .from('habits')
        .select('title, category, target, unit')
        .eq('id', habitId)
        .single();

      if (!habitError && habit) {
        habitDetails = habit;
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

    subscriptions.forEach(sub => console.log('Sending notification to:', sub.endpoint));

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          const pushPayload: WebPushPayload = {
            subscription: {
              endpoint: sub.endpoint,
              expirationTime: null,
              keys: sub.keys
            },
            title: notificationTitle,
            body: notificationBody,
            data: {
              ...data,
              habitId,
              timestamp: new Date().toISOString()
            },
            tag: `habit-${habitId || 'general'}`,
            renotify: true,
            requireInteraction: true
          };

          const pushPayloadString = JSON.stringify({
            title: pushPayload.title,
            body: pushPayload.body,
            data: pushPayload.data,
            tag: pushPayload.tag,
            renotify: pushPayload.renotify,
            requireInteraction: pushPayload.requireInteraction
          });

          await webpush.sendNotification(
            pushPayload.subscription,
            pushPayloadString
          );

          return { success: true, endpoint: sub.endpoint };
        } catch (error: any) {
          console.error('Push notification error:', error);
          if (error.statusCode === 404 || error.statusCode === 410) {
            await supabase
              .from('subscriptions')
              .delete()
              .eq('endpoint', sub.endpoint);
          }
          return {
            success: false,
            endpoint: sub.endpoint,
            error: error.message,
            statusCode: error.statusCode
          };
        }
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled' && (r as PromiseFulfilledResult<any>).value.success).length;
    const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !(r as PromiseFulfilledResult<any>).value.success)).length;

    res.status(200).json({
      message: `Sent ${successful} notifications, ${failed} failed`,
      results
    });
  } catch (error) {
    console.error('Notification handler error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
