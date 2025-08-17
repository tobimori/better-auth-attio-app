import {DialogList, showDialog, showToast, Typography, useAsyncCache} from "attio/client"
import {Suspense} from "react"
import cancelInvitation from "../fn/cancel-invitation.server"
import getWorkspaceInvitations, {type Invitation} from "../fn/workspace-invitations.server"
import {useRelativeTime} from "../hooks/use-relative-time"
import {tryCatch} from "../utils/try-catch"

const InvitationItem = ({invitation, onCancel}: {invitation: Invitation; onCancel: () => void}) => {
  const relativeTime = useRelativeTime(invitation.createdAt || invitation.expiresAt)

  const capitalizedRole = invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1)

  return (
    <DialogList.Item
      key={invitation.id}
      icon="Email"
      actionLabel="Cancel invitation"
      onTrigger={async () => {
        const {hideToast} = await showToast({
          variant: "neutral",
          title: "Canceling invitation…",
        })

        const result = await tryCatch(cancelInvitation(invitation.id))
        await hideToast()

        if (result.error) {
          showToast({
            variant: "error",
            title: "Failed to cancel invitation",
          })
          return
        }

        showToast({
          variant: "success",
          title: "Invitation canceled",
          text: `Invitation to ${invitation.email} has been canceled`,
        })

        onCancel()
      }}
      suffix={<Typography.Body>{relativeTime}</Typography.Body>}
    >
      {invitation.email} • {capitalizedRole}
      {invitation.inviter && (
        <> • Invited by {invitation.inviter.name || invitation.inviter.email}</>
      )}
    </DialogList.Item>
  )
}

const WorkspaceInvitationsDialogContent = ({recordId}: {recordId: string}) => {
  const results = useAsyncCache({
    [`invitations_${recordId}`]: [getWorkspaceInvitations, recordId],
  })

  return (
    <DialogList emptyState={{text: "No invitations found"}}>
      {results.values[`invitations_${recordId}`].invitations.map((invitation) => (
        <InvitationItem
          key={invitation.id}
          invitation={invitation}
          onCancel={() => {
            results.invalidate(`invitations_${recordId}`)
          }}
        />
      ))}
    </DialogList>
  )
}

export const showWorkspaceInvitationsDialog = (recordId: string) => {
  showDialog({
    title: "Workspace Invitations",
    Dialog: () => (
      <Suspense fallback={<DialogList emptyState="Loading…">{null}</DialogList>}>
        <WorkspaceInvitationsDialogContent recordId={recordId} />
      </Suspense>
    ),
  })
}
