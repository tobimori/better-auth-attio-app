import { z } from "zod";
import {
	type Attribute,
	attributeSchema,
	listAttributesResponseSchema,
} from "../schemas/attribute";
import { queryRecordsResponseSchema, recordSchema } from "../schemas/record";
import { attioFetch } from "../utils/attio-fetch";

const attioFieldSchemaSchema = z.object({
	type: z.string(),
	title: z.string().optional(),
	description: z.string().optional(),
	is_required: z.boolean().optional(),
	is_unique: z.boolean().optional(),
	is_multiselect: z.boolean().optional(),
	config: z.record(z.string(), z.unknown()).optional(),
});

const adapterSchema = z.object({
	betterAuthModel: z.string(),
	attioObject: z.string(),
	attioSchema: z.record(z.string(), attioFieldSchemaSchema),
});

const webhookPayloadSchema = z.object({
	event: z.enum(["create", "update", "delete"]),
	data: z.record(z.string(), z.unknown()),
	timestamp: z.string(),
	adapter: adapterSchema,
});

// check and create missing attributes, returns attributes data
async function ensureAttributesExist(
	objectSlug: string,
	attioSchema: Record<string, z.infer<typeof attioFieldSchemaSchema>>,
): Promise<Attribute[] | null> {
	// get existing attributes
	const attributesResult = await attioFetch({
		path: `/objects/${objectSlug}/attributes`,
		method: "GET",
		responseSchema: listAttributesResponseSchema,
	});

	if (attributesResult.error) {
		console.error(
			`Failed to fetch attributes for ${objectSlug}:`,
			attributesResult.error,
		);
		return null;
	}

	const attributes = attributesResult.data || [];
	const existingAttributes = new Set(attributes.map((attr) => attr.api_slug));

	// check each field in the adapter schema
	for (const [attioField, fieldSchema] of Object.entries(attioSchema)) {
		if (!existingAttributes.has(attioField)) {
			const createResult = await attioFetch({
				path: `/objects/${objectSlug}/attributes`,
				method: "POST",
				body: {
					data: {
						api_slug: attioField,
						title:
							fieldSchema.title ||
							attioField
								.replace(/_/g, " ")
								.replace(/\b\w/g, (l) => l.toUpperCase()),
						description: fieldSchema.description || null,
						type: fieldSchema.type,
						config: fieldSchema.config || {},
						is_required: fieldSchema.is_required || false,
						is_unique: fieldSchema.is_unique || false,
						is_multiselect: fieldSchema.is_multiselect || false,
					},
				},
				responseSchema: attributeSchema,
			});

			if (createResult.error) {
				console.error(
					`Failed to create attribute ${attioField}:`,
					createResult.error,
				);
			} else {
				console.log(`Created attribute ${attioField} on ${objectSlug}`);
			}
		}
	}

	// return the attributes data for reuse
	return attributes;
}

/**
 * Sync Webhook handler
 *
 * Receives events from the Better Auth server plugin and syncs to Attio
 * Creates missing attributes and updates/creates records
 */
export default async function syncWebhook(request: Request): Promise<Response> {
	const parseResult = webhookPayloadSchema.safeParse(await request.json());
	if (!parseResult.success) {
		console.error("[Sync Webhook] Invalid payload:", parseResult.error);
		return new Response(null, { status: 400 });
	}

	const { event, data, adapter } = parseResult.data;
	console.log(
		`[Sync Webhook] Received ${event} event for ${adapter.betterAuthModel}`,
	);

	// handle deletion
	if (event === "delete" && data._deleted) {
		// find the record by unique identifier
		let recordId = data.record_id as string | undefined;

		if (!recordId) {
			// try to find by unique fields
			const attributes = await ensureAttributesExist(
				adapter.attioObject,
				adapter.attioSchema,
			);

			if (!attributes) {
				console.error("Failed to fetch attributes");
				return new Response(null, { status: 500 });
			}

			const uniqueAttributes = attributes.filter(
				(attr) => attr.is_unique && attr.api_slug !== "record_id",
			);

			const orConditions: Record<string, { $eq: unknown }>[] = [];
			for (const attr of uniqueAttributes) {
				if (data[attr.api_slug] !== undefined && data[attr.api_slug] !== null) {
					orConditions.push({
						[attr.api_slug]: {
							$eq: data[attr.api_slug],
						},
					});
				}
			}

			if (orConditions.length > 0) {
				const searchResult = await attioFetch({
					path: `/objects/${adapter.attioObject}/records/query`,
					method: "POST",
					body: {
						filter:
							orConditions.length === 1
								? orConditions[0]
								: { $or: orConditions },
						limit: 1,
					},
					responseSchema: queryRecordsResponseSchema,
				});

				if (
					!searchResult.error &&
					searchResult.data &&
					searchResult.data.length > 0
				) {
					recordId = searchResult.data[0].id.record_id;
				}
			}
		}

		if (recordId) {
			const deleteResult = await attioFetch({
				path: `/objects/${adapter.attioObject}/records/${recordId}` as const,
				method: "DELETE",
				responseSchema: z.object({ success: z.boolean() }).optional(),
			});

			if (deleteResult.error) {
				console.error(`Failed to delete record in Attio:`, deleteResult.error);
				return new Response(null, { status: 500 });
			}

			console.log(`Deleted record ${recordId} from ${adapter.attioObject}`);
		} else {
			console.log(`Record not found for deletion in ${adapter.attioObject}`);
		}

		return new Response(null, { status: 200 });
	}

	console.log(`[Sync Webhook] Syncing to Attio object: ${adapter.attioObject}`);

	// ensure attributes exist and get all attributes data
	const attributes = await ensureAttributesExist(
		adapter.attioObject,
		adapter.attioSchema,
	);

	if (!attributes) {
		console.error("Failed to fetch or create attributes");
		return new Response(null, { status: 500 });
	}

	// remove internal fields from data and convert nulls to empty arrays for Attio
	const attioData: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(data)) {
		if (key !== "_deleted" && key !== "record_id") {
			attioData[key] = value === null ? [] : value;
		}
	}

	console.log(attioData);

	// check if we have an existing record_id
	let recordId = data.record_id as string | undefined;

	// if no record_id, try to find existing record by unique attributes
	if (!recordId) {
		const uniqueAttributes = attributes.filter(
			(attr) => attr.is_unique && attr.api_slug !== "record_id",
		);

		// build $or filter for all unique attributes that have values
		const orConditions: Record<string, { $eq: unknown }>[] = [];

		for (const attr of uniqueAttributes) {
			const apiSlug = attr.api_slug;

			// check if we have a value for this attribute in our mapped data
			if (attioData[apiSlug] !== undefined && attioData[apiSlug] !== null) {
				orConditions.push({
					[apiSlug]: {
						$eq: attioData[apiSlug],
					},
				});
			}
		}

		// search for existing record using $or query if we have any unique fields
		if (orConditions.length > 0) {
			const searchResult = await attioFetch({
				path: `/objects/${adapter.attioObject}/records/query`,
				method: "POST",
				body: {
					filter:
						orConditions.length === 1 ? orConditions[0] : { $or: orConditions },
					limit: 1,
				},
				responseSchema: queryRecordsResponseSchema,
			});

			if (
				!searchResult.error &&
				searchResult.data &&
				searchResult.data.length > 0
			) {
				recordId = searchResult.data[0].id.record_id;
				console.log(
					`Found existing record ${recordId} using unique attributes`,
				);
			}
		}
	}

	// prepare request based on whether we're updating or creating
	const isUpdate = !!recordId;
	const path = isUpdate
		? (`/objects/${adapter.attioObject}/records/${recordId}` as const)
		: (`/objects/${adapter.attioObject}/records` as const);
	const method = isUpdate ? "PUT" : "POST";

	// make the request
	const result = await attioFetch({
		path,
		method,
		body: {
			data: {
				values: attioData,
			},
		},
		responseSchema: recordSchema,
	});

	if (result.error) {
		const action = isUpdate ? "update" : "create";
		console.error(`Failed to ${action} record in Attio:`, result.error);
		return new Response(null, { status: 500 });
	}

	console.log(
		`Synced ${event} to Attio ${adapter.attioObject}:`,
		result.data?.id.record_id,
	);

	return new Response(null, { status: 200 });
}
