import {DialogList, showDialog, showToast, Typography, useAsyncCache} from "attio/client"
import {Suspense} from "react"
import revokeSession from "../fn/revoke-session.server"
import getSessions, {type Session} from "../fn/sessions.server"
import {useRelativeTime} from "../hooks/use-relative-time"
import {tryCatch} from "../utils/try-catch"
import {parseUserAgent} from "../utils/user-agent"

const SessionItem = ({session, onRevoke}: {session: Session; onRevoke: () => void}) => {
  const {browser, system, isMobile} = parseUserAgent(session.userAgent || "")
  const relativeTime = useRelativeTime(session.updatedAt)

  // check if this is an impersonation session
  const isImpersonation = session.impersonatedBy

  return (
    <DialogList.Item
      key={session.token}
      icon={isImpersonation ? "User" : isMobile ? "MobilePhone" : "Desktop"}
      actionLabel="Revoke session"
      onTrigger={async () => {
        const {hideToast} = await showToast({
          variant: "neutral",
          title: "Revoking session…",
        })

        const result = await tryCatch(revokeSession(session.token))
        await hideToast()

        if (result.error) {
          showToast({
            variant: "error",
            title: "Failed to revoke session",
          })
          return
        }

        showToast({
          variant: "success",
          title: "Session revoked",
          text: "The session has been successfully revoked",
        })
        onRevoke()
      }}
      suffix={<Typography.Body>{relativeTime}</Typography.Body>}
    >
      {isImpersonation ? (
        <>
          Impersonated by {session.impersonatedBy} • {system} • {browser}
          {session.ipAddress && ` • IP: ${session.ipAddress}`}
        </>
      ) : (
        <>
          {system} • {browser}
          {session.ipAddress && ` • IP: ${session.ipAddress}`}
        </>
      )}
    </DialogList.Item>
  )
}

const UserSessionsDialogContent = ({recordId}: {recordId: string}) => {
  const results = useAsyncCache({
    [`sessions_${recordId}`]: [getSessions, recordId],
  })

  return (
    <DialogList emptyState={{text: "No sessions found"}}>
      {results.values[`sessions_${recordId}`].sessions.map((session) => (
        <SessionItem
          key={session.token}
          session={session}
          onRevoke={() => {
            results.invalidate(`sessions_${recordId}`)
          }}
        />
      ))}
    </DialogList>
  )
}

export const showUserSessionsDialog = (recordId: string) => {
  showDialog({
    title: "User Sessions",
    Dialog: () => (
      <Suspense fallback={<DialogList emptyState="Loading…">{null}</DialogList>}>
        <UserSessionsDialogContent recordId={recordId} />
      </Suspense>
    ),
  })
}
