import type {Connection} from "attio/server"
import {deleteWebhookHandler, listWebhookHandlers} from "attio/server"
import {listWebhooksResponseSchema} from "../schemas/webhook"
import {attioFetch} from "../utils/attio-fetch"
import {decodeConnection, getBaseUrl} from "../utils/connection"
import {zfetch} from "../utils/fetch"

export default async function connectionRemoved({connection}: {connection: Connection}) {
  const data = decodeConnection(connection.value)
  const incomingWebhooks = await listWebhookHandlers()

  // get all outgoing webhooks from attio to find ours
  const outgoingWebhooksResult = await attioFetch({
    method: "GET",
    path: "/webhooks",
    responseSchema: listWebhooksResponseSchema,
  })

  const targetUrl = `${getBaseUrl(data.uri, data.base)}/attio/webhook`

  // find and delete our outgoing webhook(s) in attio
  if (!outgoingWebhooksResult.error) {
    for (const webhook of outgoingWebhooksResult.data) {
      if (webhook.target_url === targetUrl) {
        const deleteResult = await attioFetch({
          method: "DELETE",
          path: `/webhooks/${webhook.id.webhook_id}`,
        })

        if (deleteResult.error) {
          console.error("Failed to delete outgoing webhook:", deleteResult.error)
        }
      }
    }
  }

  // notify better auth and clean up incoming webhook handlers
  for (const incomingWebhook of incomingWebhooks) {
    const result = await zfetch("/attio/unlink", {
      baseURL: getBaseUrl(data.uri, data.base),
      method: "POST",
      body: {
        secret: data.secret,
        webhookId: incomingWebhook.externalWebhookId,
      },
    })

    if (result.error) {
      console.error("Failed to unlink webhook:", result.error)
    }

    await deleteWebhookHandler(incomingWebhook.id)
  }
}
