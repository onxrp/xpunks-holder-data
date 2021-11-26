import { String } from "lodash";

export interface ITransactionResult {
  account: string // token address
  ledger_index_max: number
  ledger_index_min: number
  limit: number
  marker: string
  transactions: ITransaction[];
}

export interface ITransaction {
  Sequence: number
  CancelledSequence?: number
  Type: "OfferCancel" | "OfferCreate" | "Payment"
  DateTime: string
  FromWallet: string
  ToWallet: string
  OrderType?: "Buy" | "Sell"
  AmountXPUNK?: string
  AmountXRP?: string
  Flags?: string
}
