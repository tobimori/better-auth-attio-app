import {getWorkspaceConnection} from "attio/server"
import {z} from "zod"
import {decodeConnection, getBaseUrl} from "../utils/connection"
import {zfetch} from "../utils/fetch"

const responseSchema = z.object({
  success: z.boolean(),
})

export default async function cancelInvitation(invitationId: string) {
  const connection = getWorkspaceConnection()
  const connectionData = decodeConnection(connection.value)

  const baseUrl = getBaseUrl(connectionData.uri, connectionData.base)

  const result = await zfetch(`/attio/cancel-org-invitation`, {
    baseURL: baseUrl,
    method: "POST",
    body: {
      secret: connectionData.secret,
      invitationId,
    },
    responseSchema,
  })

  if (result.error) {
    throw new Error(`Failed to cancel invitation: ${result.error.message}`)
  }

  return result.data
}
