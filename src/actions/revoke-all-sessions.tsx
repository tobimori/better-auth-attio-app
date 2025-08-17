import {type RecordAction, showToast} from "attio/client"
import revokeAllSessions from "../fn/revoke-all-sessions.server"
import {tryCatch} from "../utils/try-catch"

export const recordAction: RecordAction = {
  id: "revoke-all-sessions",
  label: "Revoke All Sessions",
  icon: "Sessions",
  onTrigger: async ({recordId}) => {
    const {hideToast} = await showToast({
      variant: "neutral",
      title: "Revoking all sessions…",
    })

    const result = await tryCatch(revokeAllSessions([recordId]))
    await hideToast()

    if (result.error) {
      showToast({
        variant: "error",
        title: "Failed to revoke sessions",
      })
      return
    }

    showToast({
      variant: "success",
      title: "All sessions revoked",
      text: "Successfully revoked all sessions for this user",
    })
  },
  objects: "users",
}
