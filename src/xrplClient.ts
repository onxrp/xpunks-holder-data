import { Client } from "xrpl"

const client = new Client(process.env.RIPPLE_SERVER ?? "wss://s1.ripple.com")

export const getXRPLClient = async () => {
  if (client.isConnected()) return client
  await client.connect()
  return client
}

export const disconnectClient = async () => {
  if (!client.isConnected()) return
  await client.disconnect()
}