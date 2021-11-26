
export interface ITrustline {
  specification: {
    limit: string,
    currency: string,
    counterparty: string
  },
  counterparty: { limit: string, ripplingDisabled: boolean },
  state: { balance: string }
}