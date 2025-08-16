import type {Connection} from "attio/server"
import {createWebhookHandler, updateWebhookHandler} from "attio/server"
import {createWebhookResponseSchema} from "../schemas/webhook"
import {attioFetch} from "../utils/attio-fetch"
import {decodeConnection, getBaseUrl} from "../utils/connection"
import {zfetch} from "../utils/fetch"

export default async function connectionAdded({connection}: {connection: Connection}) {
  const data = decodeConnection(connection.value)

  const [incomingWebhook, outgoingWebhook] = await Promise.all([
    createWebhookHandler({
      fileName: "sync",
    }),
    attioFetch({
      method: "POST",
      path: "/webhooks",
      responseSchema: createWebhookResponseSchema,
      body: {
        data: {
          target_url: `${getBaseUrl(data.uri, data.base)}/attio/webhook`,
          subscriptions: [
            {
              event_type: "record.created",
              filter: null,
            },
            {
              event_type: "record.updated",
              filter: null,
            },
            {
              event_type: "record.deleted",
              filter: null,
            },
            {
              event_type: "record.merged",
              filter: null,
            },
          ],
        },
      },
    }),
  ])

  if (outgoingWebhook.error) {
    console.error("Failed to create webhook in Attio:", outgoingWebhook.error)
    throw new Error(`Failed to create webhook in Attio: ${outgoingWebhook.error.message}`)
  }

  // send to better auth
  const linkResult = await zfetch("/attio/link", {
    baseURL: getBaseUrl(data.uri, data.base),
    method: "POST",
    body: {
      secret: data.secret,
      webhookUrl: incomingWebhook.url,
      webhookSecret: outgoingWebhook.data?.secret,
    },
  })

  if (linkResult.error) {
    // cleanup attio webhook if link fails
    await attioFetch({
      method: "DELETE",
      path: `/webhooks/${outgoingWebhook.data?.id?.webhook_id}`,
    })
    console.error("Failed to register webhook:", linkResult.error)
    throw new Error(`Failed to register webhook with attio/link: ${linkResult.error.message}`)
  }

  await updateWebhookHandler(incomingWebhook.id, {
    externalWebhookId: linkResult.data?.webhookId,
  })
}
