import fetch from "node-fetch"
import { IBalance } from "./models/IBalance"
import { ITrustline } from "./models/ITrustline"

export const getTrustlines = async (tokenAddress: string) => {
  const response = await fetch(`https://api.xrpscan.com/api/v1/account/${tokenAddress}/trustlines`)
  if (response.ok) return await response.json() as ITrustline[]
  console.error(`${response.status} - ${response.statusText}`)
  return null
}

export const getBalances = async (tokenAddress: string, minimumBalance = 0) => {
  const trustlines = await getTrustlines(tokenAddress)
  if (trustlines != null) {
    const balances: IBalance[] = trustlines.map((trustline) => ({
      address: trustline?.specification?.counterparty,
      amount: parseFloat((trustline?.state?.balance ?? "").replace("-", ""))
    })).filter(balance => minimumBalance === 0 ? balance.amount > minimumBalance : balance.amount >= minimumBalance)
    return balances
  }
  return []
}