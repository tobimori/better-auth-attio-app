import {
  type HttpClient as Client,
  Headers,
  HttpClient,
  HttpClientError,
  HttpClientResponse,
} from "@effect/platform"
import {Effect, FiberRef, Stream} from "effect"

export const attioFetchTagKey = "@effect/platform/AttioFetchHttpClient/Fetch"
export const attioRequestInitTagKey = "@effect/platform/AttioFetchHttpClient/FetchOptions"

const attioFetch: Client.HttpClient = HttpClient.make((request, url, signal, fiber) => {
  const context = fiber.getFiberRef(FiberRef.currentContext)
  const fetch: typeof globalThis.fetch = context.unsafeMap.get(attioFetchTagKey) ?? globalThis.fetch
  const options: RequestInit = context.unsafeMap.get(attioRequestInitTagKey) ?? {}
  const headers = options.headers
    ? Headers.merge(Headers.fromInput(options.headers), request.headers)
    : request.headers
  const send = (body: BodyInit | undefined) =>
    Effect.map(
      Effect.tryPromise({
        try: () =>
          fetch(url, {
            ...options,
            method: request.method,
            headers,
            body,
            duplex: request.body._tag === "Stream" ? "half" : undefined,
            signal,
          } as any),
        catch: (cause) =>
          new HttpClientError.RequestError({
            request,
            reason: "Transport",
            cause,
          }),
      }),
      (response) => HttpClientResponse.fromWeb(request, response)
    )
  switch (request.body._tag) {
    case "Raw":
    case "Uint8Array":
      return send(request.body.body as any)
    case "FormData":
      return send(request.body.formData)
    case "Stream":
      return Effect.flatMap(Stream.toReadableStreamEffect(request.body.stream), send)
  }
  return send(undefined)
})

export const AttioFetchClient = HttpClient.layerMergedContext(Effect.succeed(attioFetch))
