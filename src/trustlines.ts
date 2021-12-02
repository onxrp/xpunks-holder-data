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
      amount: (trustline?.state?.balance ?? "").replace("-", "").replace(".", ",")
    })).filter(b => filterBalance(b, minimumBalance))
    return balances
  }
  return []
}

const filterBalance = (balance: IBalance, minimumBalance: number) => {
  const amount = parseFloat(balance.amount.replace(",", "."))
  return minimumBalance === 0 ? amount > minimumBalance : amount >= minimumBalance
}