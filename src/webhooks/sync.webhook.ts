/**
 * Sync Webhook handler
 *
 * This receives all events from the Better Auth server plugin and uses `attioFetch` to
 */
export default async function syncWebhook(request: Request): Promise<Response> {
  console.log(await request.json())

  return new Response("OK")
}
