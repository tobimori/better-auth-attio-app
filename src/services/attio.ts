import {Layer} from "effect"
import {AttioClient} from "effect-attio"
import {AttioFetchHttpClient} from "./attio-http-client"
import {AttioFetchClient} from "./fetch"

export class AttioAppClient extends AttioClient<AttioAppClient>()("AttioAppClient", {
  objects: {
    users: true,
    workspaces: true,
  },
}) {
  get Default() {
    // biome-ignore lint/suspicious/noExplicitAny: TODO: add option without layers to attio client
    return AttioAppClient.Default({} as any).pipe(
      Layer.provide(AttioFetchHttpClient.Default().pipe(Layer.provide(AttioFetchClient.Default)))
    )
  }
}
