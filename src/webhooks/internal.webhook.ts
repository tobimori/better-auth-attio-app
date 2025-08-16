/**
 * Internal Webhook handler for Attio events
 *
 * Receives events from Attio, enriches them with full record data,
 * and forwards to the remote server configured in the connection
 */

import {getWorkspaceConnection} from "attio/server"
import {z} from "zod"
import {attioFetch} from "../utils/attio-fetch"
import {decodeConnection, getBaseUrl} from "../utils/connection"
import {zfetch} from "../utils/fetch"

const attioEventSchema = z.object({
  event_type: z.string(),
  id: z.object({
    workspace_id: z.string(),
    object_id: z.string(),
    record_id: z.string(),
    attribute_id: z.string().optional(),
  }),
  actor: z.object({
    type: z.string(),
    id: z.string(),
  }),
})

const attioWebhookPayloadSchema = z.object({
  webhook_id: z.string(),
  events: z.array(attioEventSchema),
})

export default async function internalWebhook(request: Request): Promise<Response> {
  const parseResult = attioWebhookPayloadSchema.safeParse(await request.json())
  if (!parseResult.success) {
    console.error("Invalid webhook payload:", parseResult.error)
    return new Response(null, {status: 400})
  }

  const payload = parseResult.data
  const connection = getWorkspaceConnection()
  const connectionData = decodeConnection(connection.value)

  // enrich events with full record data
  const enrichedEvents = await Promise.all(
    payload.events.map(async (event) => {
      const recordResult = await attioFetch({
        path: `/objects/${event.id.object_id}/records/${event.id.record_id}`,
        method: "GET",
      })

      return {
        ...event,
        record: recordResult.data,
        error: recordResult.error?.message,
      }
    })
  )

  // forward to remote server
  const forwardResult = await zfetch(
    `${getBaseUrl(connectionData.uri, connectionData.base)}/attio/webhook`,
    {
      method: "POST",
      body: {
        webhook_id: payload.webhook_id,
        events: enrichedEvents,
        secret: connectionData.secret,
      },
    }
  )

  if (forwardResult.error) {
    console.error("Failed to forward webhook:", forwardResult.error)
    return new Response(null, {status: 500})
  }

  return new Response(null, {status: 200})
}
