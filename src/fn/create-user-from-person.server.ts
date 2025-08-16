import {z} from "zod"
import {attioFetch} from "../utils/attio-fetch"

const userCreationSchema = z.object({
  id: z.object({
    object_id: z.string(),
    record_id: z.string(),
  }),
  web_url: z.string(),
})

export default async function createUserFromPerson(
  personRecordId: string,
  email: string,
  name: string
) {
  const randomId = `todo:${Math.random().toString(36).substring(2, 15)}${Date.now().toString(36)}`;
  
  const userResult = await attioFetch({
    method: "POST",
    path: `/objects/users/records`,
    body: {
      data: {
        values: {
          name: name,
          user_id: randomId,
          primary_email_address: [
            {
              email_address: email,
            },
          ],
          person: [
            {
              target_object: "people",
              target_record_id: personRecordId,
            },
          ],
        },
      },
    },
    responseSchema: userCreationSchema,
  })

  if (userResult.error) {
    if (
      userResult.error.message?.includes("unique") ||
      userResult.error.message?.includes("duplicate")
    ) {
      throw new Error("A user with this email address already exists")
    }
    throw new Error(`Failed to create user: ${userResult.error.message}`)
  }

  return {
    success: true,
    userId: userResult.data.id.record_id,
    webUrl: userResult.data.web_url,
    email,
    name,
  }
}
