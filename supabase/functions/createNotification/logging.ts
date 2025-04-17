export function logPushSubscription(subscription: any) {
  console.log('Received push subscription:', JSON.stringify(subscription, null, 2));
}

export function logPushError(error: any) {
  console.error('Push notification error:', error);
}
