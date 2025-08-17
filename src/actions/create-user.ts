import {type RecordAction, runQuery, showToast} from "attio/client"
import {showSelectEmailDialog} from "../dialog/select-email"
import createUserFromPerson from "../fn/create-user.server"
import getPerson from "../graphql/get-person.graphql"
import {tryCatch} from "../utils/try-catch"

export const recordAction: RecordAction = {
  id: "create-user",
  label: "Create User from Person",
  icon: "User",
  onTrigger: async ({recordId}) => {
    const {person} = await runQuery(getPerson, {recordId})

    if (!person) {
      await showToast({
        variant: "error",
        title: "Failed to fetch person",
        text: "Could not retrieve person information",
      })
      return
    }

    const emails = person.email_addresses || []
    if (emails.length === 0) {
      await showToast({
        variant: "error",
        title: "No email address",
        text: "This person does not have any email addresses",
      })
      return
    }

    const name =
      person.name?.full_name ||
      [person.name?.first_name, person.name?.last_name].filter(Boolean).join(" ") ||
      emails[0]?.split("@")[0] ||
      "Unknown"

    const createUser = async (selectedEmail: string) => {
      const {hideToast} = await showToast({
        variant: "neutral",
        title: "Creating user...",
      })

      const result = await tryCatch(createUserFromPerson(recordId, selectedEmail, name))
      await hideToast()

      if (result.error) {
        await showToast({
          variant: "error",
          title: "Failed to create user",
          text: result.error.message,
        })
        return
      }

      await showToast({
        variant: "success",
        title: "User created successfully",
        text: `Created user for ${result.data.email}`,
      })

      window.open(result.data.webUrl)
    }

    // using callback instead of promise to avoid hanging when dialog is closed
    // https://attio.slack.com/archives/C09AJFCT35G/p1755372818045069
    if (emails.length > 1) {
      showSelectEmailDialog(emails, name, createUser)
    } else {
      await createUser(emails[0])
    }
  },
  objects: "people",
}
