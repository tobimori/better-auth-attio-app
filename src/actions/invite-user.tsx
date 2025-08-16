import {Forms, type RecordAction, showDialog, showToast, useForm} from "attio/client"

export const recordAction: RecordAction = {
  id: "invite-user",
  label: "Invite User to Workspace",
  icon: "SendAdd",
  onTrigger: async ({recordId}) => {
    showDialog({
      title: "Invite User",
      Dialog: () => {
        const {Form, SubmitButton, TextInput} = useForm(
          {
            user: Forms.string(),
            role: Forms.string(),
          },
          {
            user: "",
            role: "",
          }
        )

        return (
          <Form
            onSubmit={async (values) => {
              await showToast({
                title: "Form submitted",
                variant: "success",
              })
            }}
          >
            <TextInput label="User" name="user" />
            <TextInput label="Role" name="role" />
            <SubmitButton label="Invite User" />
          </Form>
        )
      },
    })
  },
  objects: "workspaces",
}
