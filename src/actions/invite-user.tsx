import {
  type ComboboxOptionsProvider,
  Forms,
  type RecordAction,
  runQuery,
  showDialog,
  showToast,
  useAsyncCache,
  useForm,
} from "attio/client"
import getOrganizationRoles from "../fn/get-organization-roles.server"
import inviteUser from "../fn/invite-user.server"
import searchUsers from "../fn/search-users.server"
import getWorkspaceInvitations from "../fn/workspace-invitations.server"
import getCurrentUser from "../graphql/current-user.graphql"
import {tryCatch} from "../utils/try-catch"

const userOptionsProvider = {
  getOption: async (value: string) => {
    // for email addresses, just return them as-is
    if (value.includes("@")) {
      return {
        label: value,
        description: "New user",
      }
    }

    // otherwise try to search for the user
    const users = await searchUsers(value)
    const user = users.find((u) => u.id === value || u.email === value)

    if (user) {
      return {
        label: user.name || user.email,
        description: user.name ? user.email : undefined,
      }
    }

    return undefined
  },

  search: async (search: string) => {
    const users = await searchUsers(search)

    return users.map((user) => ({
      value: user.email,
      label: user.name || user.email,
      description: user.name ? user.email : user.email === search ? "New user" : undefined,
    }))
  },
} satisfies ComboboxOptionsProvider

const roleOptionsProvider = {
  getOption: async (value: string) => {
    return {
      label: value.charAt(0).toUpperCase() + value.slice(1),
    }
  },
  search: async () => {
    const roles = await getOrganizationRoles()
    return roles.map((role) => ({
      value: role,
      label: role.charAt(0).toUpperCase() + role.slice(1),
    }))
  },
} satisfies ComboboxOptionsProvider

export const recordAction: RecordAction = {
  id: "invite-user",
  label: "Invite User to Workspace",
  icon: "SendAdd",
  onTrigger: async ({recordId}) => {
    showDialog({
      title: "Invite User",
      Dialog: ({hideDialog}) => {
        const results = useAsyncCache({
          [`invitations_${recordId}`]: [getWorkspaceInvitations, recordId],
        })

        const {Form, SubmitButton, InputGroup, Combobox} = useForm(
          {
            email: Forms.string(),
            role: Forms.string(),
          },
          {
            email: "",
            role: "member",
          }
        )

        return (
          <Form
            onSubmit={async (values) => {
              // Get current user
              const currentUserResult = await runQuery(getCurrentUser)
              if (!currentUserResult.currentUser?.email) {
                await showToast({
                  title: "Failed to get current user",
                  variant: "error",
                })
                return
              }

              const {hideToast} = await showToast({
                title: "Sending invitation...",
                variant: "neutral",
              })

              const result = await tryCatch(
                inviteUser(recordId, values.email, values.role, currentUserResult.currentUser.email)
              )
              await hideToast()

              results.invalidate(`invitations_${recordId}`)

              if (result.error) {
                await showToast({
                  title: "Failed to send invitation",
                  text: result.error.message,
                  variant: "error",
                })
                return
              }

              await showToast({
                title: "Invitation sent",
                text: `Invitation sent to ${values.email}`,
                variant: "success",
              })

              hideDialog()
            }}
          >
            <InputGroup>
              <Combobox
                label="User Email"
                name="email"
                options={userOptionsProvider}
                placeholder="Enter email or search users..."
              />
              <Combobox
                label="Role"
                name="role"
                options={roleOptionsProvider}
                placeholder="Select a role..."
              />
            </InputGroup>
            <SubmitButton label="Send Invitation" />
          </Form>
        )
      },
    })
  },
  objects: "workspaces",
}
