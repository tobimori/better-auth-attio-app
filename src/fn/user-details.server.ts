import {getWorkspaceConnection} from "attio/server"
import {z} from "zod"
import {attioFetch} from "../utils/attio-fetch"
import {decodeConnection, getBaseUrl} from "../utils/connection"
import {zfetch} from "../utils/fetch"

const userDetailsResponseSchema = z.object({
  banned: z.boolean(),
  bannedUntil: z.string().nullable(),
  banReason: z.string().nullable(),
  role: z.string(),
})

export type UserDetails = z.infer<typeof userDetailsResponseSchema> & {
  name: string
}

export default async function getUserDetails(recordId: string) {
  const connection = getWorkspaceConnection()
  const connectionData = decodeConnection(connection.value)

  const baseUrl = getBaseUrl(connectionData.uri, connectionData.base)

  // get the user id from the record
  const entry = await attioFetch({
    method: "GET",
    path: `/objects/users/records/${recordId}`,
  })
  const name = entry.data.values.name[0].value

  const result = await zfetch(`/attio/user-details`, {
    baseURL: baseUrl,
    method: "POST",
    body: {
      secret: connectionData.secret,
      userId: entry.data.values.user_id[0].value,
    },
    responseSchema: userDetailsResponseSchema,
  })

  if (result.error) {
    if (result.error.status === 501) {
      return {
        name,
        role: null,
        banned: null,
        bannedUntil: null,
        banReason: null,
      }
    }

    throw new Error("Failed to get user details")
  }

  return {name, ...result.data}
}
