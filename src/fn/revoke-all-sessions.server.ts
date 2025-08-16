import { getWorkspaceConnection } from "attio/server";
import { attioFetch } from "../utils/attio-fetch";
import { decodeConnection, getBaseUrl } from "../utils/connection";
import { zfetch } from "../utils/fetch";

export default async function revokeAllSessions(recordIds: string[]) {
	const connection = getWorkspaceConnection();
	const connectionData = decodeConnection(connection.value);

	const baseUrl = getBaseUrl(connectionData.uri, connectionData.base);

	// get the user ids from the records
	const userIds = await Promise.all(
		recordIds.map(async (recordId) => {
			const entry = await attioFetch({
				method: "GET",
				path: `/objects/users/records/${recordId}`,
			});
			return entry.data.values.user_id[0].value;
		}),
	);

	const result = await zfetch(`/attio/revoke-all-sessions`, {
		baseURL: baseUrl,
		method: "POST",
		body: {
			secret: connectionData.secret,
			userIds,
		},
	});

	if (result.error) {
		throw new Error("Failed to revoke sessions");
	}

	return result.data;
}
