import type {z} from "zod"
import type {Result} from "./try-catch"

interface FetchOptions<T = any> extends Omit<RequestInit, 'body'> {
  baseURL?: string
  responseSchema?: z.ZodType<T>
  body?: any
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
    const {baseURL, responseSchema, body, ...fetchOptions} = options

    const url = baseURL ? `${baseURL}${path}` : path

    let finalBody: RequestInit['body'] = body
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
