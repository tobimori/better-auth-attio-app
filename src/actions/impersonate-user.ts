import type { RecordAction } from "attio/client";

export const recordAction: RecordAction = {
	id: "impersonate-user",
	label: "Impersonate User",
	icon: "User",
	onTrigger: async ({ recordId }) => {
		// Run code here
	},
	objects: "users",
};
