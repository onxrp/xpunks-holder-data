import { String } from "lodash";
import { StringLiteralLike } from "typescript";

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
  Date: string
  Time: string
  FromWallet: string
  ToWallet?: string
  InOut?: string
  Currency?: string
  Issuer?: string
  Value?: number
  CounterCurrency?: string
  CounterIssuer?: string
  CounterValue?: number
  Flags?: string
  TxnSignature: string
}
