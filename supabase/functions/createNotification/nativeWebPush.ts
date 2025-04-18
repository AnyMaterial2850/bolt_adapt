import { createHmac, randomBytes } from "crypto";

interface PushSubscription {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

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

function base64UrlEncode(buffer: Buffer): string {
  return buffer
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function getVapidHeaders(
  audience: string,
  subject: string,
  publicKey: string,
  privateKey: string
): Record<string, string> {
  const header = {
    alg: "ES256",
    typ: "JWT",
  };

  const expiration = Math.floor(Date.now() / 1000) + 12 * 60 * 60; // 12 hours

  const payload = {
    aud: audience,
    exp: expiration,
    sub: subject,
  };

  function encode(obj: any) {
    return base64UrlEncode(Buffer.from(JSON.stringify(obj)));
  }

  const encodedHeader = encode(header);
  const encodedPayload = encode(payload);
  const token = `${encodedHeader}.${encodedPayload}`;

  const cryptoKey = Buffer.from(privateKey, "base64");
  const signature = createHmac("sha256", cryptoKey).update(token).digest();

  const encodedSignature = base64UrlEncode(signature);

  return {
    Authorization: `WebPush ${token}.${encodedSignature}`,
    "Content-Type": "application/octet-stream",
    TTL: "2419200",
    "Crypto-Key": `p256ecdsa=${publicKey}`,
  };
}

export async function sendNotification(
  subscription: PushSubscription,
  payload: string
): Promise<void> {
  const { endpoint, keys } = subscription;

  const vapidPublicKey = process.env.VITE_VAPID_PUBLIC_KEY || "";
  const vapidPrivateKey = process.env.VITE_VAPID_PRIVATE_KEY || "";
  const vapidSubject = process.env.VAPID_SUBJECT || "mailto:admin@example.com";

  if (!vapidPublicKey || !vapidPrivateKey) {
    throw new Error("VAPID keys are not configured");
  }

  const headers = getVapidHeaders(endpoint, vapidSubject, vapidPublicKey, vapidPrivateKey);

  const body = Buffer.from(payload);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Encoding": "aes128gcm",
      Authorization: headers.Authorization,
      "Crypto-Key": headers["Crypto-Key"],
      TTL: headers.TTL,
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`Failed to send push notification: ${response.statusText}`);
  }
}
