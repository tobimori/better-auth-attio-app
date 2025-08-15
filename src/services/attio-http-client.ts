import {HttpClient, HttpClientError, HttpClientRequest} from "@effect/platform"
import {Effect, Option, Schema} from "effect"
import {
  AttioRateLimitErrorTransform,
  AttioUnauthorizedErrorTransform,
} from "effect-attio/error-transforms"

const GlobalErrors = Schema.Union(AttioUnauthorizedErrorTransform, AttioRateLimitErrorTransform)

export class AttioFetchHttpClient extends Effect.Service<AttioFetchHttpClient>()(
  "AttioHttpClient",
  {
    scoped: Effect.fnUntraced(function* () {
      return (yield* HttpClient.HttpClient).pipe(
        HttpClient.mapRequest((req) => HttpClientRequest.acceptJson(req)),
        HttpClient.filterOrElse(
          (response) => response.status >= 200 && response.status < 300,
          (response) =>
            Effect.gen(function* () {
              const json = yield* response.json
              const globalError = Schema.decodeUnknownOption(GlobalErrors)({
                ...(json as {[k: string]: unknown}),
                retry_after: response.headers["retry-after"],
              })

              if (Option.isSome(globalError)) {
                return yield* globalError.value
              }

              return yield* new HttpClientError.ResponseError({
                response,
                request: response.request,
                reason: "StatusCode",
                description: "unhandled non 2xx status code",
              })
            })
        )
      )
    }),
  }
) {}
