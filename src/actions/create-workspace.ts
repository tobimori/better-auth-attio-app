import {type RecordAction, runQuery, showToast} from "attio/client"
import createWorkspaceFromCompany from "../fn/create-workspace.server"
import getCompany from "../graphql/get-company.graphql"
import {tryCatch} from "../utils/try-catch"

export const recordAction: RecordAction = {
  id: "create-workspace",
  label: "Create Workspace from Company",
  icon: "Workspace",
  onTrigger: async ({recordId}) => {
    const {company} = await runQuery(getCompany, {recordId})

    if (!company) {
      await showToast({
        variant: "error",
        title: "Failed to fetch company",
        text: "Could not retrieve company information",
      })
      return
    }

    const companyName = company.name || "Unnamed Company"

    const {hideToast} = await showToast({
      variant: "neutral",
      title: "Creating workspace...",
    })

    const result = await tryCatch(createWorkspaceFromCompany(recordId, companyName))
    await hideToast()

    if (result.error) {
      await showToast({
        variant: "error",
        title: "Failed to create workspace",
        text: result.error.message,
      })
      return
    }

    await showToast({
      variant: "success",
      title: "Workspace created successfully",
      text: `Created workspace for ${result.data.name}`,
    })

    window.open(result.data.webUrl)
  },
  objects: "companies",
}
