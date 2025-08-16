import {z} from "zod"
import {attioFetch} from "../utils/attio-fetch"

const workspaceCreationSchema = z.object({
  id: z.object({
    object_id: z.string(),
    record_id: z.string(),
  }),
  web_url: z.string(),
})

export default async function createWorkspaceFromCompany(
  companyRecordId: string,
  companyName: string
) {
  const randomId = `todo:${Math.random().toString(36).substring(2, 15)}${Date.now().toString(36)}`

  const workspaceResult = await attioFetch({
    method: "POST",
    path: `/objects/workspaces/records`,
    body: {
      data: {
        values: {
          name: companyName,
          workspace_id: randomId,
          company: [
            {
              target_object: "companies",
              target_record_id: companyRecordId,
            },
          ],
        },
      },
    },
    responseSchema: workspaceCreationSchema,
  })

  if (workspaceResult.error) {
    throw new Error(`Failed to create workspace: ${workspaceResult.error.message}`)
  }

  return {
    success: true,
    workspaceId: workspaceResult.data.id.record_id,
    webUrl: workspaceResult.data.web_url,
    name: companyName,
  }
}
