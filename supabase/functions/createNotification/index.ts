import { createClient } from '@supabase/supabase-js/dist/main/index.js'
import { sendNotification } from './nativeWebPush'
import { logPushSubscription, logPushError } from './logging'

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

interface HabitDetails {
  title: string
  category: string
  target?: number[]
  unit?: string
}

export default async function handler(req: Request): Promise<Response> {
  try {
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      })
    }

    const VAPID_PUBLIC_KEY = process.env.VITE_VAPID_PUBLIC_KEY
    const VAPID_PRIVATE_KEY = process.env.VITE_VAPID_PRIVATE_KEY
    const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@example.com'
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL || ''
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      logPushError('VAPID keys not configured or missing')
      return new Response(
        JSON.stringify({ error: 'VAPID keys not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }


    const { userId, habitId, title, body, data } = await req.json()

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

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

    let habitDetails: HabitDetails | null = null
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

    const notificationTitle = title || (habitDetails ? `Time for: ${habitDetails.title}` : 'Reminder')
    let notificationBody = body || ''

    if (habitDetails && habitDetails.target && habitDetails.target.length > 0 && habitDetails.unit) {
      if (notificationBody) {
        notificationBody += ` (Target: ${habitDetails.target.join(', ')} ${habitDetails.unit})`
      } else {
        notificationBody = `Target: ${habitDetails.target.join(', ')} ${habitDetails.unit}`
      }
    }

    subscriptions.forEach(sub => logPushSubscription(sub))

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

          await sendNotification(
            pushPayload.subscription,
            pushPayloadString
          )

          return { success: true, endpoint: sub.endpoint }
        } catch (error: any) {
          logPushError(error)
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

    const successful = results.filter(r => r.status === 'fulfilled' && (r as PromiseFulfilledResult<any>).value.success).length
    const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !(r as PromiseFulfilledResult<any>).value.success)).length

    return new Response(
      JSON.stringify({
        message: `Sent ${successful} notifications, ${failed} failed`,
        results
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    logPushError(error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
