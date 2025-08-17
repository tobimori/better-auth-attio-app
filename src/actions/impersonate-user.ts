import {type RecordAction, runQuery, showToast} from "attio/client"
import getCurrentUser from "../graphql/current-user.graphql"
import impersonateUser from "../fn/impersonate-user.server"
import {tryCatch} from "../utils/try-catch"

export const recordAction: RecordAction = {
  id: "impersonate-user",
  label: "Impersonate User",
  icon: "User",
  onTrigger: async ({recordId}) => {
    // get current user on the client
    const {currentUser} = await runQuery(getCurrentUser)

    if (!currentUser?.email) {
      showToast({
        variant: "error",
        title: "Failed to get current user",
        text: "Could not determine your user account",
      })
      return
    }

    const {hideToast} = await showToast({
      variant: "neutral",
      title: "Creating impersonation session…",
    })

    const result = await tryCatch(impersonateUser(recordId, currentUser.email))
    await hideToast()

    if (result.error) {
      const errorMessage = result.error.message || "Failed to create impersonation session"
      showToast({
        variant: "error",
        title: "Impersonation failed",
        text: errorMessage,
      })
      return
    }

    showToast({
      variant: "success",
      title: "Impersonation session created",
      text: "Click the button to open the app as this user",
      action: {
        label: "Open as user",
        onClick: () => {
          window.open(
            `${result.data.appUrl}/attio/impersonation-session?token=${result.data.sessionToken}`
          )
        },
      },
    })
  },
  objects: "users",
}
