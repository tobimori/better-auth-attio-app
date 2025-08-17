import {getWorkspaceConnection} from "attio/server"
import {z} from "zod"
import {attioFetch} from "../utils/attio-fetch"
import {decodeConnection, getBaseUrl} from "../utils/connection"
import {zfetch} from "../utils/fetch"

const invitationSchema = z.object({
  id: z.string(),
  email: z.string(),
  organizationId: z.string(),
  inviterId: z.string(),
  role: z.string(),
  status: z.string(),
  expiresAt: z.string(),
  resent: z.boolean().optional(),
})

export default async function inviteUser(
  recordId: string,
  email: string,
  role: string,
  inviterEmail: string
) {
  const connection = getWorkspaceConnection()
  const connectionData = decodeConnection(connection.value)
  const baseUrl = getBaseUrl(connectionData.uri, connectionData.base)

  // get workspace data to get organization id
  const entry = await attioFetch({
    method: "GET",
    path: `/objects/workspaces/records/${recordId}`,
  })

  const result = await zfetch(`/attio/create-org-invitation`, {
    baseURL: baseUrl,
    method: "POST",
    body: {
      secret: connectionData.secret,
      email: email.toLowerCase(),
      role,
      organizationId: entry.data.values.workspace_id[0].value,
      inviterEmail,
    },
    responseSchema: invitationSchema,
  })

  if (result.error) {
    throw new Error(`Failed to create invitation: ${result.error.message}`)
  }

  return result.data
}
