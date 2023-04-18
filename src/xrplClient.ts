import { Client } from "xrpl"

let client: Client

export const getXRPLClient = async () => {
  if (client && client.isConnected()) return client
  client = new Client(process.env.RIPPLE_SERVER ?? "wss://s1.ripple.com")
  // console.log(client.url, process.env.RIPPLE_SERVER)
  await client.connect()
  return client
}

export const disconnectClient = async () => {
  if (!client.isConnected()) return
  await client.disconnect()
}