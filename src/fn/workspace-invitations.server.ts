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
  inviter: z
    .object({
      id: z.string(),
      name: z.string().nullable(),
      email: z.string(),
    })
    .nullable(),
  role: z.string(),
  status: z.string(),
  expiresAt: z.string(),
  createdAt: z.string().optional(),
})

export type Invitation = z.infer<typeof invitationSchema>

export default async function getWorkspaceInvitations(recordId: string) {
  const connection = getWorkspaceConnection()
  const connectionData = decodeConnection(connection.value)

  const baseUrl = getBaseUrl(connectionData.uri, connectionData.base)

  const entry = await attioFetch({
    method: "GET",
    path: `/objects/workspaces/records/${recordId}`,
  })

  const result = await zfetch(`/attio/list-org-invitations`, {
    baseURL: baseUrl,
    method: "POST",
    body: {
      secret: connectionData.secret,
      organizationId: entry.data.values.workspace_id[0].value,
    },
    responseSchema: z.object({
      invitations: z.array(invitationSchema),
      count: z.number(),
    }),
  })

  if (result.error) {
    throw new Error(`Failed to fetch invitations: ${result.error.message}`)
  }

  return {
    invitations: result.data?.invitations || [],
    count: result.data?.count || 0,
  }
}
