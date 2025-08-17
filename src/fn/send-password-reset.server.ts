import {getWorkspaceConnection} from "attio/server"
import {z} from "zod"
import {attioFetch} from "../utils/attio-fetch"
import {decodeConnection, getBaseUrl} from "../utils/connection"
import {zfetch} from "../utils/fetch"

const passwordResetResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
})

export default async function sendPasswordReset(recordId: string) {
  const connection = getWorkspaceConnection()
  const connectionData = decodeConnection(connection.value)

  const baseUrl = getBaseUrl(connectionData.uri, connectionData.base)

  // get user record from attio to get the user_id
  const entry = await attioFetch({
    method: "GET",
    path: `/objects/users/records/${recordId}`,
  })

  if (!entry.data.values.user_id?.[0]?.value) {
    throw new Error("User ID not found in Attio record")
  }

  const result = await zfetch(`/attio/send-password-reset`, {
    baseURL: baseUrl,
    method: "POST",
    body: {
      secret: connectionData.secret,
      userId: entry.data.values.user_id[0].value,
    },
    responseSchema: passwordResetResponseSchema,
  })

  if (result.error) {
    throw new Error(`Failed to send password reset: ${result.error.message}`)
  }

  if (!result.data.success) {
    throw new Error(result.data.message || "Failed to send password reset email")
  }

  return result.data
}
