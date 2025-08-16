import {getWorkspaceConnection} from "attio/server"
import {z} from "zod"
import {attioFetch} from "../utils/attio-fetch"
import {decodeConnection, getBaseUrl} from "../utils/connection"
import {zfetch} from "../utils/fetch"

const responseSchema = z.object({
  success: z.boolean(),
  sessionToken: z.string(),
})

export default async function impersonateUser(recordId: string, adminEmail: string) {
  const connection = getWorkspaceConnection()
  const connectionData = decodeConnection(connection.value)

  const baseUrl = getBaseUrl(connectionData.uri, connectionData.base)

  // get the target user id from the record
  const entry = await attioFetch({
    method: "GET",
    path: `/objects/users/records/${recordId}`,
  })

  const targetUserId = entry.data.values.user_id[0].value

  // call the impersonate endpoint
  const result = await zfetch(`/attio/impersonate`, {
    baseURL: baseUrl,
    method: "POST",
    body: {
      secret: connectionData.secret,
      targetUserId,
      adminEmail,
    },
    responseSchema,
  })

  if (result.error) {
    // check for specific errors
    if ((result.error as any)?.error === "ADMIN_PLUGIN_NOT_ENABLED") {
      throw new Error("Admin features are not available")
    }
    throw new Error("Failed to create impersonation session")
  }

  // return the session token and base URL for the app
  return {
    sessionToken: result.data.sessionToken,
    appUrl: baseUrl,
  }
}
