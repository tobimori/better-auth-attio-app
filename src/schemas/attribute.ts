import {z} from "zod"

const attributeIdSchema = z.object({
  workspace_id: z.string(),
  object_id: z.string(),
  attribute_id: z.string(),
})

const attributeTypeSchema = z.enum([
  "text",
  "number",
  "checkbox",
  "currency",
  "date",
  "timestamp",
  "rating",
  "status",
  "select",
  "record-reference",
  "actor-reference",
  "location",
  "domain",
  "email-address",
  "phone-number",
  "interaction",
  "personal-name",
])

const currencyConfigSchema = z.object({
  default_currency_code: z.string().nullable(),
  display_type: z.enum(["code", "name", "narrowSymbol", "symbol"]).nullable(),
})

const recordReferenceConfigSchema = z.object({
  allowed_object_ids: z.array(z.string()).nullable(),
})

const attributeConfigSchema = z.object({
  currency: currencyConfigSchema,
  record_reference: recordReferenceConfigSchema,
})

export const attributeSchema = z.object({
  id: attributeIdSchema,
  title: z.string(),
  description: z.string().nullable(),
  api_slug: z.string(),
  type: attributeTypeSchema,
  is_system_attribute: z.boolean(),
  is_writable: z.boolean(),
  is_required: z.boolean(),
  is_unique: z.boolean(),
  is_multiselect: z.boolean(),
  is_default_value_enabled: z.boolean(),
  is_archived: z.boolean(),
  default_value: z.any().nullable(),
  relationship: z
    .object({
      id: attributeIdSchema,
    })
    .nullable(),
  created_at: z.string(),
  config: attributeConfigSchema,
})

export const listAttributesResponseSchema = z.array(attributeSchema)

export type Attribute = z.infer<typeof attributeSchema>
export type ListAttributesResponse = z.infer<typeof listAttributesResponseSchema>
