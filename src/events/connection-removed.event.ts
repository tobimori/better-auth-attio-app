import {listWebhookHandlers, deleteWebhookHandler} from "attio/server"
import type {Connection} from "attio/server"
import {decodeConnection, getBaseUrl} from "../utils/connection"
import {zfetch} from "../utils/fetch"

export default async function connectionRemoved({connection}: {connection: Connection}) {
  const data = decodeConnection(connection.value)
  const webhookHandlers = await listWebhookHandlers()

  for (const webhookHandler of webhookHandlers) {
    const result = await zfetch("/attio/unlink", {
      baseURL: getBaseUrl(data.uri, data.base),
      method: "POST",
      body: {
        secret: data.secret,
        webhookId: webhookHandler.externalWebhookId,
      },
    })

    if (result.error) {
      console.error("Failed to unlink webhook:", result.error)
      throw new Error(`Failed to unlink webhook: ${result.error.message}`)
    }

    await deleteWebhookHandler(webhookHandler.id)
  }
}
