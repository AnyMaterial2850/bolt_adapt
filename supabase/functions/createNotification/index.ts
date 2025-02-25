// Import from npm registry using Deno-compatible version
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as webpush from "npm:web-push@3.6.4";

// Environment variables
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Configure web-push
webpush.setVapidDetails(
  "mailto:adapt@example.com",
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

Deno.serve(async (req: Request) => {
  try {
    // CORS headers for preflight requests
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    // Only allow POST requests
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const { title, body, userId } = await req.json();

    // Validate request
    if (!title || !body) {
      return new Response(
        JSON.stringify({ error: "Title and body are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Query subscriptions from database
    const query = userId 
      ? supabase.from("subscriptions").select("*").eq("user_id", userId)
      : supabase.from("subscriptions").select("*");
    
    const { data: subscriptions, error } = await query;

    if (error) {
      console.error("Database error:", error);
      return new Response(JSON.stringify({ error: "Database error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: "No subscriptions found" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Send notifications
    const results = await Promise.allSettled(
      subscriptions.map(async (subscription) => {
        try {
          // Create proper subscription object
          const pushSubscription = {
            endpoint: subscription.endpoint,
            keys: subscription.keys
          };

          const payload = JSON.stringify({
            title,
            body,
          });

          const result = await webpush.sendNotification(pushSubscription, payload);
          return { success: true, subscription, result };
        } catch (err: unknown) {
          console.error("Error sending notification:", err);
          
          // If subscription is invalid (gone), remove it
          if ((err as { statusCode: number }).statusCode === 404 || (err as { statusCode: number }).statusCode === 410) {
            await supabase
              .from("subscriptions")
              .delete()
              .eq("endpoint", subscription.endpoint);
            
            return { 
              success: false, 
              subscription, 
              error: "Subscription expired and was removed" 
            };
          }
          
          return { success: false, subscription, error: (err as Error).message };
        }
      })
    );

    // Count successful notifications
    const successful = results.filter(r => r.status === "fulfilled" && r.value.success).length;

    return new Response(
      JSON.stringify({
        message: `Sent ${successful} of ${subscriptions.length} notifications`,
        results
      }),
      { 
        status: 200, 
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*" 
        } 
      }
    );
  } catch (err: unknown) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});