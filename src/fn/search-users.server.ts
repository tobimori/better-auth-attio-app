import { getWorkspaceConnection } from "attio/server";
import { z } from "zod";
import { decodeConnection, getBaseUrl } from "../utils/connection";
import { zfetch } from "../utils/fetch";

const userSchema = z.object({
	id: z.string(),
	email: z.string(),
	name: z.string().nullable(),
	image: z.string().nullable(),
});

export type User = z.infer<typeof userSchema>;

export default async function searchUsers(search: string): Promise<User[]> {
	if (!search) {
		return [];
	}

	const connection = getWorkspaceConnection();
	const connectionData = decodeConnection(connection.value);
	const baseUrl = getBaseUrl(connectionData.uri, connectionData.base);

	const result = await zfetch(`/attio/search-users`, {
		baseURL: baseUrl,
		method: "POST",
		body: {
			secret: connectionData.secret,
			search,
		},
		responseSchema: z.object({
			users: z.array(userSchema),
		}),
	});

	const users = result.data?.users || [];
	
	// always include the search term as an option if it looks like an email
	const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(search);
	if (isEmail && !users.some(u => u.email.toLowerCase() === search.toLowerCase())) {
		users.unshift({
			id: search,
			email: search,
			name: null,
			image: null,
		});
	}

	return users;
}