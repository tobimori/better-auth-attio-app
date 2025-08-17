import {type RecordAction, showToast} from "attio/client"
import sendPasswordReset from "../fn/send-password-reset.server"
import {tryCatch} from "../utils/try-catch"

export const recordAction: RecordAction = {
  id: "send-password-reset",
  label: "Send Password Reset Email",
  icon: "Key",
  onTrigger: async ({recordId}) => {
    const {hideToast} = await showToast({
      variant: "neutral",
      title: "Sending password reset email…",
    })

    const result = await tryCatch(sendPasswordReset(recordId))
    await hideToast()

    if (result.error) {
      showToast({
        variant: "error",
        title: "Failed to send password reset",
        text: result.error.message || "Unable to send password reset email",
      })
      return
    }

    showToast({
      variant: "success",
      title: "Password reset email sent",
      text: "The user will receive an email with instructions to reset their password",
    })
  },
  objects: "users",
}
