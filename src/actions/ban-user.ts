import type { RecordAction } from "attio/client";
import { showUserBanManagementDialog } from "../dialog/ban-user";

export const recordAction: RecordAction = {
	id: "ban-user",
	label: "Ban User",
	icon: "User",
	onTrigger: async ({ recordId }) => {
		showUserBanManagementDialog(recordId);
	},
	objects: "users",
};
