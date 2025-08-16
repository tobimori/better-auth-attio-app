import type {RecordAction} from "attio/client"

export const recordAction: RecordAction = {
  id: "create-workspace",
  label: "Create Workspace from Company",
  icon: "Workspace",
  onTrigger: async ({recordId}) => {
    // Run code here
  },
  objects: "companies",
}
