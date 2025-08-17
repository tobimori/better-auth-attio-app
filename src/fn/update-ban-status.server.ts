import {getWorkspaceConnection} from "attio/server"
import {attioFetch} from "../utils/attio-fetch"
import {decodeConnection, getBaseUrl} from "../utils/connection"
import {zfetch} from "../utils/fetch"

export default async function updateBanStatus(
  recordId: string,
  params: {
    banned: boolean
    banReason?: string | null
    banExpires?: string | null
  }
) {
  const connection = getWorkspaceConnection()
  const connectionData = decodeConnection(connection.value)

  const baseUrl = getBaseUrl(connectionData.uri, connectionData.base)

  // get the user id from the record
  const entry = await attioFetch({
    method: "GET",
    path: `/objects/users/records/${recordId}`,
  })

  const result = await zfetch(`/attio/update-ban-status`, {
    baseURL: baseUrl,
    method: "POST",
    body: {
      secret: connectionData.secret,
      userId: entry.data.values.user_id[0].value,
      ...params,
    },
  })

  if (result.error) {
    throw new Error("Failed to update ban status")
  }

  return result.data
}
