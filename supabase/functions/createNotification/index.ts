import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.1'

interface WebPushPayload {
  subscription: PushSubscription
  title: string
  body: string
  data?: any
  tag?: string
  renotify?: boolean
  requireInteraction?: boolean
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
}

interface PushSubscription {
  endpoint: string
  expirationTime: number | null
  keys: {
    p256dh: string
    auth: string
  }
}

serve(async (req) => {
  try {
    // CORS headers
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      })
    }

    // Get environment variables
    const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')
    const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')
    const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@example.com'
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

    // Validate VAPID keys
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return new Response(
        JSON.stringify({ error: 'VAPID keys not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Set VAPID details
    webpush.setVapidDetails(
      VAPID_SUBJECT,
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY
    )

    // Parse request body
    const { userId, habitId, title, body, data } = await req.json()

    // Validate required fields
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client with service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Get user's push subscriptions
    const { data: subscriptions, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)

    if (subscriptionError) {
      return new Response(
        JSON.stringify({ error: `Error fetching subscriptions: ${subscriptionError.message}` }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No subscriptions found for user' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Get habit details if habitId is provided
    let habitDetails = null
    if (habitId) {
      const { data: habit, error: habitError } = await supabase
        .from('habits')
        .select('title, category, target, unit')
        .eq('id', habitId)
        .single()

      if (!habitError && habit) {
        habitDetails = habit
      }
    }

    // Prepare notification payload
    const notificationTitle = title || (habitDetails ? `Time for: ${habitDetails.title}` : 'Reminder')
    let notificationBody = body || ''
    
    // Add target and unit to body if available
    if (habitDetails && habitDetails.target && habitDetails.target.length > 0 && habitDetails.unit) {
      if (notificationBody) {
        notificationBody += ` (Target: ${habitDetails.target.join(', ')} ${habitDetails.unit})`
      } else {
        notificationBody = `Target: ${habitDetails.target.join(', ')} ${habitDetails.unit}`
      }
    }

    // Send push notification to each subscription
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
          }

          const pushPayloadString = JSON.stringify({
            title: pushPayload.title,
            body: pushPayload.body,
            data: pushPayload.data,
            tag: pushPayload.tag,
            renotify: pushPayload.renotify,
            requireInteraction: pushPayload.requireInteraction
          })

          await webpush.sendNotification(
            pushPayload.subscription,
            pushPayloadString
          )

          return { success: true, endpoint: sub.endpoint }
        } catch (error) {
          // If subscription is expired or invalid, remove it
          if (error.statusCode === 404 || error.statusCode === 410) {
            await supabase
              .from('subscriptions')
              .delete()
              .eq('endpoint', sub.endpoint)
          }
          
          return { 
            success: false, 
            endpoint: sub.endpoint, 
            error: error.message,
            statusCode: error.statusCode 
          }
        }
      })
    )

    // Count successful and failed notifications
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length
    const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length

    return new Response(
      JSON.stringify({
        message: `Sent ${successful} notifications, ${failed} failed`,
        results
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
