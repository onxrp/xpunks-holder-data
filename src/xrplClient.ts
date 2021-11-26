import { Client } from "xrpl"

const PUBLIC_SERVER = "wss://xrplcluster.com"
const TEST_SERVER = "wss://s.altnet.rippletest.net:51233"
const client = new Client(PUBLIC_SERVER)

export const getXRPLClient = async () => {
  if (client.isConnected()) return client
  await client.connect()
  return client
}

export const disconnectClient = async () => {
  if (!client.isConnected()) return
  await client.disconnect()
}