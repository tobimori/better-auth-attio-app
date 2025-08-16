import { getWorkspaceConnection } from "attio/server";
import { z } from "zod";
import { decodeConnection, getBaseUrl } from "../utils/connection";
import { zfetch } from "../utils/fetch";

const revokeResponseSchema = z.object({
	success: z.boolean(),
	message: z.string(),
});

export default async function revokeSession(sessionToken: string) {
	const connection = getWorkspaceConnection();
	const connectionData = decodeConnection(connection.value);

	const baseUrl = getBaseUrl(connectionData.uri, connectionData.base);

	const result = await zfetch(`/attio/revoke-session`, {
		baseURL: baseUrl,
		method: "POST",
		body: {
			secret: connectionData.secret,
			sessionToken,
		},
		responseSchema: revokeResponseSchema,
	});

	if (result.error) {
		throw new Error(`Failed to revoke session: ${result.error.message}`);
	}

	if (!result.data.success) {
		throw new Error(result.data.message);
	}

	return result.data;
}
