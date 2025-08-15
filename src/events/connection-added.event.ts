import type {Connection} from "attio/server"
import {createWebhookHandler, updateWebhookHandler} from "attio/server"
import {decodeConnection, getBaseUrl} from "../utils/connection"
import {zfetch} from "../utils/fetch"

export default async function connectionAdded({connection}: {connection: Connection}) {
  const data = decodeConnection(connection.value)

  const webhookHandler = await createWebhookHandler({
    fileName: "sync",
  })

  const result = await zfetch("/attio/link", {
    baseURL: getBaseUrl(data.uri, data.base),
    method: "POST",
    body: {
      secret: data.secret,
      webhookUrl: webhookHandler.url,
    },
  })

  if (result.error) {
    console.error("Failed to register webhook:", result.error)
    throw new Error(`Failed to register webhook with attio/link: ${result.error.message}`)
  }

  await updateWebhookHandler(webhookHandler.id, {
    externalWebhookId: result.data.webhookId,
  })
}
