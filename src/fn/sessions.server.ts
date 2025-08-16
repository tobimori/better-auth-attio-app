import { getWorkspaceConnection } from "attio/server";
import { z } from "zod";
import { attioFetch } from "../utils/attio-fetch";
import { decodeConnection, getBaseUrl } from "../utils/connection";
import { zfetch } from "../utils/fetch";

const sessionSchema = z.object({
	createdAt: z.string(),
	updatedAt: z.string(),
	expiresAt: z.string().nullable(),
	userAgent: z.string(),
	ipAddress: z.string(),
	token: z.string(),
	userId: z.string(),
	impersonatedBy: z.string().nullable().optional(),
});

const sessionsResponseSchema = z.object({
	sessions: z.array(sessionSchema),
	totalCount: z.number(),
	activeCount: z.number(),
});

export type Session = z.infer<typeof sessionSchema>;

export default async function getSessions(recordId: string) {
	const connection = getWorkspaceConnection();
	const connectionData = decodeConnection(connection.value);

	const baseUrl = getBaseUrl(connectionData.uri, connectionData.base);

	const entry = await attioFetch({
		method: "GET",
		path: `/objects/users/records/${recordId}`,
	});

	const result = await zfetch(`/attio/sessions`, {
		baseURL: baseUrl,
		method: "POST",
		body: {
			secret: connectionData.secret,
			userId: entry.data.values.user_id[0].value,
		},
		responseSchema: sessionsResponseSchema,
	});

	if (result.error) {
		throw new Error(`Failed to fetch sessions: ${result.error.message}`);
	}

	return result.data;
}
