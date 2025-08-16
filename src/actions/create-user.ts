import type {RecordAction} from "attio/client"

export const recordAction: RecordAction = {
  id: "create-user",
  label: "Create User from Person",
  icon: "User",
  onTrigger: async ({recordId}) => {
    // Run code here
  },
  objects: "people",
}
