import {Forms, showDialog, Typography, useForm} from "attio/client"

export const showSelectEmailDialog = (
  emails: string[],
  personName: string,
  onSelect: (email: string) => void
) => {
  showDialog({
    title: `Select Email for ${personName}`,
    Dialog: ({hideDialog}) => {
      const {Form, SubmitButton, Combobox} = useForm(
        {
          email: Forms.string(),
        },
        {
          email: emails[0] || "",
        }
      )

      const emailOptions = emails.map((email) => ({
        value: email,
        label: email,
      }))

      return (
        <Form
          onSubmit={async (values) => {
            hideDialog()
            onSelect(values.email)
          }}
        >
          <Typography.Body>
            This person has multiple email addresses. Please select which one to use for the user
            account.
          </Typography.Body>
          <Combobox
            label="Email address"
            name="email"
            options={emailOptions}
            placeholder="Select an email"
          />
          <SubmitButton label="Create User" />
        </Form>
      )
    },
  })
}
