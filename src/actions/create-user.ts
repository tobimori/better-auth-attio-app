import { runQuery, showToast, type RecordAction } from "attio/client";
import { showSelectEmailDialog } from "../dialog/select-email";
import createUserFromPerson from "../fn/create-user-from-person.server";
import getPerson from "../graphql/get-person.graphql";
import { tryCatch } from "../utils/try-catch";

export const recordAction: RecordAction = {
	id: "create-user",
	label: "Create User from Person",
	icon: "User",
	onTrigger: async ({ recordId }) => {
		// fetch person data using graphql
		const { person } = await runQuery(getPerson, { recordId });

		if (!person) {
			await showToast({
				variant: "error",
				title: "Failed to fetch person",
				text: "Could not retrieve person information",
			});
			return;
		}

		const emails = person.email_addresses || [];
		if (emails.length === 0) {
			await showToast({
				variant: "error",
				title: "No email address",
				text: "This person does not have any email addresses",
			});
			return;
		}

		// extract name
		const nameData = person.name?.[0];
		const name = nameData?.full_name || 
			[nameData?.first_name, nameData?.last_name].filter(Boolean).join(" ") || 
			emails[0]?.split("@")[0] || "Unknown";

		// if multiple emails, show selection dialog
		let selectedEmail: string | null;
		if (emails.length > 1) {
			selectedEmail = await showSelectEmailDialog(emails, name);
			
			if (!selectedEmail) {
				// user cancelled
				return;
			}
		} else {
			selectedEmail = emails[0];
		}

		// create the user
		const { hideToast } = await showToast({
			variant: "neutral",
			title: "Creating user...",
		});

		const result = await tryCatch(
			createUserFromPerson(recordId, selectedEmail, name),
		);
		await hideToast();

		if (result.error) {
			await showToast({
				variant: "error",
				title: "Failed to create user",
				text: result.error.message,
			});
			return;
		}

		await showToast({
			variant: "success",
			title: "User created successfully",
			text: `Created user for ${result.data.email}`,
		});

		// open the newly created user record
		window.open(result.data.webUrl);
	},
	objects: "people",
};