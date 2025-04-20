const webpush = require('web-push');
const fetch = require('node-fetch');

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

// Log VAPID key information (without revealing the full private key)
console.log('VAPID configuration:', {
  subject: VAPID_SUBJECT,
  publicKeyLength: VAPID_PUBLIC_KEY.length,
  privateKeyLength: VAPID_PRIVATE_KEY.length,
  publicKeyStart: VAPID_PUBLIC_KEY.substring(0, 10) + '...',
  privateKeyStart: VAPID_PRIVATE_KEY.substring(0, 5) + '...'
});

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).send('ok');
  }

  try {
    // Parse JSON body if undefined
    let requestBody = req.body;
    if (requestBody === undefined) {
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      const raw = Buffer.concat(chunks).toString();
      requestBody = raw ? JSON.parse(raw) : {};
    }
    const { userId, habitId, title, body: customBody, data } = requestBody;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Get the current VAPID public key being used
    const currentVapidKey = VAPID_PUBLIC_KEY;
    console.log(`Current VAPID key: ${currentVapidKey.substring(0, 10)}...`);
    
    // Fetch subscriptions for the user, but filter by the current VAPID key if possible
    let queryUrl = `${SUPABASE_URL}/rest/v1/subscriptions?user_id=eq.${userId}`;
    
    // Add ordering to get the most recently updated subscriptions first
    queryUrl += `&order=updated_at.desc`;
    
    const subscriptionsRes = await fetch(queryUrl, {
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
    
    let subscriptions = await subscriptionsRes.json();

    if (!subscriptions || subscriptions.length === 0) {
      return res.status(200).json({ message: 'No subscriptions found for user' });
    }
    
    // Log the number of subscriptions found
    console.log(`Found ${subscriptions.length} subscriptions for user ${userId}`);
    
    // Filter subscriptions by device to reduce duplicates
    // Group subscriptions by device_id and take only the most recent one for each device
    const deviceMap = new Map();
    subscriptions.forEach(sub => {
      if (sub.device_id) {
        // If we already have a subscription for this device, only replace it if this one is newer
        if (!deviceMap.has(sub.device_id) ||
            (sub.updated_at && deviceMap.get(sub.device_id).updated_at < sub.updated_at)) {
          deviceMap.set(sub.device_id, sub);
        }
      } else {
        // For subscriptions without device_id, keep them all
        // Use endpoint as key to ensure uniqueness
        deviceMap.set(sub.endpoint, sub);
      }
    });
    
    // Convert back to array
    subscriptions = Array.from(deviceMap.values());
    console.log(`Filtered to ${subscriptions.length} unique device subscriptions`);
    
    // Prioritize subscriptions that match the current VAPID key
    const matchingKeySubscriptions = subscriptions.filter(sub => sub.vapid_key === currentVapidKey);
    const otherSubscriptions = subscriptions.filter(sub => sub.vapid_key !== currentVapidKey);
    
    if (matchingKeySubscriptions.length > 0) {
      console.log(`Found ${matchingKeySubscriptions.length} subscriptions with matching VAPID key`);
      // If we have subscriptions with matching VAPID key, use only those
      subscriptions = matchingKeySubscriptions;
    } else {
      console.log(`No subscriptions with matching VAPID key found. Will attempt with all subscriptions.`);
    }

    let habitDetails = null;
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
    let notificationBody = customBody || '';
    if (habitDetails && habitDetails.target && habitDetails.target.length > 0 && habitDetails.unit) {
      if (notificationBody) {
        notificationBody += ` (Target: ${habitDetails.target.join(', ')} ${habitDetails.unit})`;
      } else {
        notificationBody = `Target: ${habitDetails.target.join(', ')} ${habitDetails.unit}`;
      }
    }

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          console.log(`Attempting to send notification to endpoint: ${sub.endpoint.substring(0, 30)}...`);
          
          // Verify subscription format
          if (!sub.endpoint || !sub.keys || !sub.keys.p256dh || !sub.keys.auth) {
            console.error('Invalid subscription format:', sub);
            return {
              success: false,
              endpoint: sub.endpoint || 'unknown',
              error: 'Invalid subscription format'
            };
          }
          
          // Log subscription details
          console.log('Subscription details:', {
            endpoint: sub.endpoint.substring(0, 30) + '...',
            keys: {
              p256dh: sub.keys.p256dh ? (sub.keys.p256dh.substring(0, 10) + '...') : 'missing',
              auth: sub.keys.auth ? (sub.keys.auth.substring(0, 5) + '...') : 'missing'
            }
          });
          
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
          
          console.log('Sending push notification with payload:', JSON.stringify(pushPayload));
          const result = await webpush.sendNotification(sub, JSON.stringify(pushPayload));
          console.log(`Notification sent successfully:`, {
            statusCode: result.statusCode,
            endpoint: sub.endpoint.substring(0, 30) + '...',
          });
          
          return {
            success: true,
            endpoint: sub.endpoint,
            statusCode: result?.statusCode
          };
        } catch (error) {
          console.error(`Error sending notification:`, {
            statusCode: error.statusCode,
            message: error.message,
            body: error.body,
            endpoint: sub.endpoint.substring(0, 30) + '...'
          });
          
          // Handle different error types
          if (error.statusCode === 410 || error.statusCode === 404) {
            // Gone or Not Found - subscription is no longer valid
            console.log(`Subscription is no longer valid (${error.statusCode}). Deleting from database.`);
            await fetch(`${SUPABASE_URL}/rest/v1/subscriptions?id=eq.${sub.id}`, {
              method: 'DELETE',
              headers: {
                apikey: SUPABASE_SERVICE_ROLE_KEY,
                Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                Accept: 'application/json',
              },
            });
          } else if (error.statusCode === 403 && error.body && error.body.includes('VAPID credentials')) {
            // VAPID key mismatch - update the subscription record with the correct key
            console.log(`VAPID key mismatch detected. Updating subscription record.`);
            try {
              await fetch(`${SUPABASE_URL}/rest/v1/subscriptions?id=eq.${sub.id}`, {
                method: 'PATCH',
                headers: {
                  apikey: SUPABASE_SERVICE_ROLE_KEY,
                  Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                  'Content-Type': 'application/json',
                  Accept: 'application/json',
                },
                body: JSON.stringify({
                  vapid_key: 'mismatched', // Mark as mismatched so we can filter it out in future
                  updated_at: new Date().toISOString()
                })
              });
            } catch (updateError) {
              console.error(`Error updating subscription with VAPID key mismatch:`, updateError);
            }
          }
          
          // Log more details about the error
          console.log('Full error details:', {
            statusCode: error.statusCode,
            message: error.message,
            body: error.body,
            stack: error.stack,
            endpoint: sub.endpoint,
            vapidKey: sub.vapid_key ? `${sub.vapid_key.substring(0, 10)}...` : 'unknown'
          });
          
          return {
            success: false,
            endpoint: sub.endpoint,
            error: error.message,
            statusCode: error.statusCode,
            isVapidMismatch: error.statusCode === 403 && error.body && error.body.includes('VAPID credentials')
          };
        }
      })
    );

    // Analyze results for better reporting
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length;
    
    // Count specific error types
    const vapidMismatches = results.filter(r =>
      r.status === 'fulfilled' &&
      r.value.isVapidMismatch
    ).length;
    
    const staleSubscriptions = results.filter(r =>
      r.status === 'fulfilled' &&
      !r.value.success &&
      (r.value.statusCode === 404 || r.value.statusCode === 410)
    ).length;
    
    // Create a detailed message
    let detailedMessage = `Sent ${successful} notifications, ${failed} failed`;
    
    if (vapidMismatches > 0) {
      detailedMessage += ` (${vapidMismatches} VAPID key mismatches)`;
    }
    
    if (staleSubscriptions > 0) {
      detailedMessage += ` (${staleSubscriptions} stale subscriptions removed)`;
    }
    
    return res.status(200).json({
      message: detailedMessage,
      summary: {
        total: subscriptions.length,
        successful,
        failed,
        vapidMismatches,
        staleSubscriptions
      },
      results,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message, stack: error.stack });
  }
};