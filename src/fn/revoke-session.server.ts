import {getWorkspaceConnection} from "attio/server"
import {decodeConnection, getBaseUrl} from "../utils/connection"
import {zfetch} from "../utils/fetch"

export default async function revokeSession(sessionToken: string) {
  const connection = getWorkspaceConnection()
  const connectionData = decodeConnection(connection.value)

  const baseUrl = getBaseUrl(connectionData.uri, connectionData.base)

  const result = await zfetch(`/attio/revoke-session`, {
    baseURL: baseUrl,
    method: "POST",
    body: {
      secret: connectionData.secret,
      sessionToken,
    },
  })

  if (result.error) {
    console.log(result.error)
    throw new Error(`Failed to revoke session`)
  }

  return result.data
}
