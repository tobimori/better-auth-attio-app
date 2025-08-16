import type { RecordAction } from "attio/client";

export const recordAction: RecordAction = {
	id: "ban-user",
	label: "Ban User",
	icon: "User",
	onTrigger: async ({ recordId }) => {
		// Run code here
	},
	objects: "users",
};
