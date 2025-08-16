import { z } from "zod";
import {
	type Attribute,
	attributeSchema,
	listAttributesResponseSchema,
} from "../schemas/attribute";
import { queryRecordsResponseSchema, recordSchema } from "../schemas/record";
import { attioFetch } from "../utils/attio-fetch";

const fieldMappingSchema = z.object({
	object: z.string(),
	fields: z.record(z.string(), z.string()),
	schema: z.record(z.string(), z.string()).optional(),
});

const webhookPayloadSchema = z.object({
	event: z.string(),
	data: z.record(z.string(), z.unknown()),
	timestamp: z.string(),
	fieldMapping: fieldMappingSchema.nullable(),
});

// map better auth field types to attio attribute types
const ATTIO_FIELD_TYPES: Record<string, string> = {
	string: "text",
	number: "number",
	boolean: "checkbox",
	date: "timestamp",
};

// check and create missing attributes, returns attributes data
async function ensureAttributesExist(
	objectSlug: string,
	fieldMapping: z.infer<typeof fieldMappingSchema>,
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

	// check each mapped field
	for (const [_, attioField] of Object.entries(fieldMapping.fields)) {
		if (!existingAttributes.has(attioField)) {
			const createResult = await attioFetch({
				path: `/objects/${objectSlug}/attributes`,
				method: "POST",
				body: {
					data: {
						api_slug: attioField,
						title: attioField
							.replace(/_/g, " ")
							.replace(/\b\w/g, (l) => l.toUpperCase()),
						description: null,
						type:
							ATTIO_FIELD_TYPES[fieldMapping?.schema?.[attioField] ?? "id"] ||
							"text",
						config: {},
						is_required: false,
						is_unique: false,
						is_multiselect: false,
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

	const { event, data, fieldMapping } = parseResult.data;
	console.log(`[Sync Webhook] Received ${event} event`);

	if (!fieldMapping) {
		console.log("[Sync Webhook] No field mapping provided, skipping sync");
		return new Response(null, { status: 200 });
	}

	console.log(`[Sync Webhook] Syncing to Attio object: ${fieldMapping.object}`);

	// ensure attributes exist and get all attributes data
	const attributes = await ensureAttributesExist(
		fieldMapping.object,
		fieldMapping,
	);

	if (!attributes) {
		console.error("Failed to fetch or create attributes");
		return new Response(null, { status: 500 });
	}

	// map data to attio format
	const attioData: Record<string, unknown> = {};
	for (const [betterAuthField, attioField] of Object.entries(
		fieldMapping.fields,
	)) {
		if (data[betterAuthField] !== undefined) {
			attioData[attioField] = data[betterAuthField];
		}
	}

	console.log(attioData);

	// check if we have an existing attio_id
	let recordId = data.attioId as string | undefined;

	// if no attio_id, try to find existing record by unique attributes
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
				path: `/objects/${fieldMapping.object}/records/query`,
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
		? (`/objects/${fieldMapping.object}/records/${recordId}` as const)
		: (`/objects/${fieldMapping.object}/records` as const);
	const method = isUpdate ? "PATCH" : "POST";

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
		`Synced ${event} to Attio ${fieldMapping.object}:`,
		result.data?.id.record_id,
	);

	return new Response(null, { status: 200 });
}
