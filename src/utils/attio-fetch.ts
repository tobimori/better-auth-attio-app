import { attioFetch as attioFetchOriginal } from "attio/server";
import type { z } from "zod";
import type { Result } from "./try-catch";

type AttioFetchOptions<T = any> = Omit<
	Parameters<typeof attioFetchOriginal>[0],
	"method"
> & {
	responseSchema?: z.ZodType<T>;
	body?: any;
	method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
};

export interface AttioFetchError extends Error {
	status?: number;
	data?: any;
}

export async function attioFetch<T = any>(
	options: AttioFetchOptions<T>,
): Promise<Result<T, AttioFetchError>> {
	try {
		const { responseSchema, ...fetchOptions } = options;

		const result = await attioFetchOriginal(fetchOptions as any);
		if (!result || !result.data) {
			const error = new Error(
				"No data returned from Attio API",
			) as AttioFetchError;
			return { data: null, error };
		}

		if (responseSchema) {
			const validated = responseSchema.parse(result.data);
			return { data: validated, error: null };
		}

		return { data: result.data as T, error: null };
	} catch (error) {
		const fetchError = error as AttioFetchError;
		return { data: null, error: fetchError };
	}
}
