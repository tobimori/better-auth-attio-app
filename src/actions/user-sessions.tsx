import type { RecordAction } from "attio/client";
import { showUserSessionsDialog } from "../dialog/user-sessions";

export const recordAction: RecordAction = {
	id: "view-user-sessions",
	label: "View User Sessions",
	icon: "User",
	onTrigger: async ({ recordId }) => {
		showUserSessionsDialog(recordId);
	},
	objects: "users",
};
