import z from "zod"

const connectionVal = z.object({
  uri: z.string(),
  base: z.string(),
  secret: z.string(),
})

const base64Decode = (str: string): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
  let output = ""
  let buffer = 0
  let bits = 0

  for (let i = 0; i < str.length; i++) {
    if (str[i] === "=") break
    const val = chars.indexOf(str[i])
    if (val === -1) continue

    buffer = (buffer << 6) | val
    bits += 6

    while (bits >= 8) {
      bits -= 8
      output += String.fromCharCode((buffer >> bits) & 0xff)
    }
  }

  return output
}

export const decodeConnection = (connection: string) => {
  if (!connection || connection.trim() === "") {
    throw new Error("Connection string is empty")
  }

  const decoded = base64Decode(connection)
  if (!decoded || decoded.trim() === "") {
    throw new Error("Decoded string is empty")
  }

  const parsed = JSON.parse(decoded)
  return connectionVal.parse(parsed)
}

export const getBaseUrl = (uri: string, base: string): string => {
  // ensure uri starts with https:// or http://
  let normalizedUri = uri.trim()
  if (!normalizedUri.startsWith("http://") && !normalizedUri.startsWith("https://")) {
    normalizedUri = `https://${normalizedUri}`
  }
  
  // remove trailing slash from uri
  normalizedUri = normalizedUri.replace(/\/$/, "")
  
  // normalize base path
  let normalizedBase = base.trim()
  
  // ensure base starts with / if not empty
  if (normalizedBase && !normalizedBase.startsWith("/")) {
    normalizedBase = `/${normalizedBase}`
  }
  
  // remove trailing slash from base
  normalizedBase = normalizedBase.replace(/\/$/, "")
  
  return normalizedUri + normalizedBase
}
