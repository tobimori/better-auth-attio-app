import type {z} from "zod"
import type {Result} from "./try-catch"

interface FetchOptions<T = any> extends Omit<RequestInit, "body"> {
  baseURL?: string
  responseSchema?: z.ZodType<T>
  body?: any
  params?: Record<string, any>
}

interface FetchError extends Error {
  status?: number
  data?: any
}

export async function zfetch<T = any>(
  path: string,
  options: FetchOptions<T> = {}
): Promise<Result<T, FetchError>> {
  try {
    const {baseURL, responseSchema, body, params, ...fetchOptions} = options

    let url = baseURL ? `${baseURL}${path}` : path

    if (params) {
      const searchParams = new URLSearchParams()
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      }
      const queryString = searchParams.toString()
      if (queryString) {
        url += (url.includes("?") ? "&" : "?") + queryString
      }
    }

    let finalBody: RequestInit["body"] = body
    if (body && typeof body === "object") {
      finalBody = JSON.stringify(body)
      fetchOptions.headers = {
        "Content-Type": "application/json",
        ...fetchOptions.headers,
      }
    }

    const response = await fetch(url, {...fetchOptions, body: finalBody})

    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`) as FetchError
      error.status = response.status
      error.data = await response.text()
      return {data: null, error}
    }

    const data = await response.json()

    if (responseSchema) {
      const validated = responseSchema.parse(data)
      return {data: validated, error: null}
    }

    return {data, error: null}
  } catch (error) {
    return {data: null, error: error as FetchError}
  }
}
