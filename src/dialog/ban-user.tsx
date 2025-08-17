import {
  Button,
  Forms,
  showDialog,
  showToast,
  Typography,
  useAsyncCache,
  useForm,
} from "attio/client"
import {Suspense} from "react"
import updateBanStatus from "../fn/update-ban-status.server"
import getUserDetails from "../fn/user-details.server"
import {tryCatch} from "../utils/try-catch"

const BanUserDialog = ({
  recordId,
  userName,
  onSuccess,
}: {
  recordId: string
  userName: string
  onSuccess: () => void
}) => {
  const {Form, SubmitButton, TextInput} = useForm(
    {
      banReason: Forms.string().optional(),
    },
    {
      banReason: "",
    }
  )

  return (
    <Form
      onSubmit={async (values) => {
        const {hideToast} = await showToast({
          variant: "neutral",
          title: "Banning user…",
        })

        const result = await tryCatch(
          updateBanStatus(recordId, {
            banned: true,
            banReason: values.banReason || null,
            banExpires: null, // ignoring for now (attio doesn't support datetime fields)
          })
        )
        await hideToast()

        if (result.error) {
          showToast({
            variant: "error",
            title: "Failed to ban user",
          })
          return
        }

        showToast({
          variant: "success",
          title: "User banned",
          text: `${userName} has been banned`,
        })
        onSuccess()
      }}
    >
      <TextInput label="Ban reason" name="banReason" placeholder="Enter reason for ban" />
      <SubmitButton label="Confirm ban" />
    </Form>
  )
}

const UnbanUserDialog = ({
  recordId,
  userName,
  onSuccess,
}: {
  recordId: string
  userName: string
  onSuccess: () => void
}) => {
  return (
    <>
      <Typography.Body>Are you sure you want to unban {userName}?</Typography.Body>
      <Button
        variant="destructive"
        onClick={async () => {
          const {hideToast} = await showToast({
            variant: "neutral",
            title: "Unbanning user…",
          })

          const result = await tryCatch(
            updateBanStatus(recordId, {
              banned: false,
              banReason: null,
              banExpires: null,
            })
          )
          await hideToast()

          if (result.error) {
            showToast({
              variant: "error",
              title: "Failed to unban user",
            })
            return
          }

          showToast({
            variant: "success",
            title: "User unbanned",
            text: `${userName} has been unbanned`,
          })
          onSuccess()
        }}
        label="Unban user"
      />
    </>
  )
}

const UserBanManagementContent = ({
  recordId,
  hideDialog,
}: {
  recordId: string
  hideDialog: () => void
}) => {
  const results = useAsyncCache({
    [`user_details_${recordId}`]: [getUserDetails, recordId],
  })

  const userDetails = results.values[`user_details_${recordId}`]

  const handleSuccess = () => {
    results.invalidate(`user_details_${recordId}`)
    hideDialog()
  }

  // if admin features not available, show error
  if (userDetails.role === null) {
    return (
      <Typography.Body>
        Admin features are not available. Please ensure the admin plugin is enabled.
      </Typography.Body>
    )
  }

  if (userDetails.banned) {
    return (
      <UnbanUserDialog recordId={recordId} userName={userDetails.name} onSuccess={handleSuccess} />
    )
  }

  return <BanUserDialog recordId={recordId} userName={userDetails.name} onSuccess={handleSuccess} />
}

export const showUserBanManagementDialog = (recordId: string) => {
  showDialog({
    title: "Ban User",
    Dialog: ({hideDialog}) => (
      <Suspense fallback={<Typography.Body>Loading...</Typography.Body>}>
        <UserBanManagementContent recordId={recordId} hideDialog={hideDialog} />
      </Suspense>
    ),
  })
}
