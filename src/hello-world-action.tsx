import type {RecordAction} from "attio/client"
import {showDialog} from "attio/client"

import {HelloWorldDialog} from "./hello-world-dialog"

export const recordAction: RecordAction = {
    id: "better-auth",
    label: "Better Auth",
    onTrigger: async ({recordId}) => {
        showDialog({
            title: "Better Auth",
            Dialog: () => {
                // This is a React component. It can use hooks and render other components.
                return <HelloWorldDialog recordId={recordId} />
            },
        })
    },
}
