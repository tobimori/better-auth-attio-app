import {getWorkspaceConnection} from "attio/server"
import {z} from "zod"
import {decodeConnection, getBaseUrl} from "../utils/connection"
import {zfetch} from "../utils/fetch"

export default async function getOrganizationRoles(): Promise<string[]> {
  const connection = getWorkspaceConnection()
  const connectionData = decodeConnection(connection.value)
  const baseUrl = getBaseUrl(connectionData.uri, connectionData.base)

  const result = await zfetch(`/attio/get-org-roles`, {
    baseURL: baseUrl,
    method: "POST",
    body: {
      secret: connectionData.secret,
    },
    responseSchema: z.object({
      roles: z.array(z.string()),
    }),
  })

  if (result.error) {
    // fallback to default roles if endpoint not available
    return ["member", "admin", "owner"]
  }

  return result.data?.roles || ["member", "admin", "owner"]
}
