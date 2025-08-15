/**
 * Sync Webhook handler
 *
 * This receives all events from the Better Auth server plugin and uses `attioFetch` to
 */
export default async function syncWebhook(_request: Request): Promise<Response> {
  return new Response("OK")
}
