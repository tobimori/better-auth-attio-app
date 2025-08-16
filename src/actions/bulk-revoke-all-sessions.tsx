import { type BulkRecordAction, showToast } from "attio/client";
import revokeAllSessions from "../fn/revoke-all-sessions.server";
import { tryCatch } from "../utils/try-catch";

export const bulkRecordAction: BulkRecordAction = {
	id: "bulk-revoke-all-sessions",
	label: "Revoke All Sessions",
	icon: "Sessions",
	onTrigger: async ({ recordIds }) => {
		const { hideToast } = await showToast({
			variant: "neutral",
			title: `Revoking sessions for ${recordIds.length} users…`,
		});

		const result = await tryCatch(revokeAllSessions(recordIds));
		await hideToast();

		if (result.error) {
			showToast({
				variant: "error",
				title: "Failed to revoke sessions",
			});
			return;
		}

		showToast({
			variant: "success",
			title: "Sessions revoked",
			text: `Successfully revoked all sessions for ${recordIds.length} users`,
		});
	},
	objects: "users",
};
