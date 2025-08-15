import type {Connection} from "attio/server"

export default async function connectionAdded({connection}: {connection: Connection}) {
  // this has to decode the base64 and then contact the server
}
