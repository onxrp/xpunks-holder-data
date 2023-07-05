import { isObject } from "lodash";
import moment from "moment";
import {
  rippleTimeToISOTime,
  OfferCancel,
  OfferCreate,
  Payment,
  dropsToXrp,
  OfferCreateFlags,
  AccountTxRequest,
} from "xrpl";
import { getXRPLClient } from "./xrplClient";
import { ITransactionResult, ITransaction } from "./models/ITransaction";

export const getXRPLTransactions = async (
  tokenAddress: string,
  blockFrom?: number,
  blockTo?: number,
  dateFrom?: moment.Moment,
  dateTo?: moment.Moment,
  marker: unknown = undefined
): Promise<ITransaction[]> => {
  const client = await getXRPLClient();
  const request: AccountTxRequest = {
    command: "account_tx",
    account: tokenAddress,
    binary: false,
    limit: 400,
    forward: true,
    ledger_index: 'current',
    api_version: 1,
    marker,
  }
  if (blockFrom) request.ledger_index_min = blockFrom
  if (blockTo) request.ledger_index_max = blockTo
  const response = await client.request(request);

  if (!response?.result?.transactions) return [];

  let finished = false;
  const transactions = [] as ITransaction[];
  (response.result.transactions ?? []).forEach((accTransaction) => {
    const transaction = accTransaction.tx;
    const transDate = transaction.date ? moment(rippleTimeToISOTime(transaction.date)).utc() : undefined;
    if (
      (!dateFrom || !transDate || dateFrom <= transDate) &&
      (!dateTo || !transDate || dateTo >= transDate)
    ) {
      if (
        isObject(accTransaction.meta) &&
        accTransaction.meta.TransactionResult === "tesSUCCESS" &&
        (transaction.TransactionType === "OfferCreate" ||
          transaction.TransactionType === "Payment" ||
          transaction.TransactionType === "OfferCancel")
      ) {
        const toWallet = transaction.TransactionType === "Payment" ? transaction.Destination : undefined
        transactions.push({
          LedgerIndex: accTransaction.ledger_index,
          Sequence: transaction.Sequence,
          CancelledSequence: transaction.TransactionType === "OfferCreate" || transaction.TransactionType === "OfferCancel" ? transaction.OfferSequence : undefined,
          Type: transaction.TransactionType as "OfferCancel" | "OfferCreate" | "Payment",
          DateTime: transDate?.toISOString(),
          Date: transDate?.format(moment.HTML5_FMT.DATE),
          Time: transDate?.format(moment.HTML5_FMT.TIME_SECONDS),
          FromWallet: transaction.Account,
          ToWallet: toWallet,
          InOut: toWallet ? (toWallet?.toLowerCase() === tokenAddress?.toLowerCase() ? "IN" : "OUT") : undefined,
          ...getAmounts(transaction),
          Flags: getFlags(transaction),
          TxnSignature: transaction.TxnSignature,
        });
      }
    } else {
      finished = true
    }
  });

  if (finished || !response?.result?.marker) return transactions;
  else
    return [
      ...transactions,
      ...(await getXRPLTransactions(
        tokenAddress,
        blockFrom,
        blockTo,
        dateFrom,
        dateTo,
        response?.result?.marker
      )),
    ];
};

const getAmounts = (transaction: OfferCancel | OfferCreate | Payment) => {
  const returnObject = {
    Currency: undefined,
    Issuer: undefined,
    value: undefined,
    CounterCurrency: undefined,
    CounterIssuer: undefined,
    Countervalue: undefined,
  }
  if (transaction.TransactionType === "Payment") {
    return { ...returnObject, ...{
      Currency: isObject(transaction.Amount) ? formatCurrency(transaction.Amount.currency) : "XRP",
      Issuer: isObject(transaction.Amount) ? transaction.Amount.issuer : undefined,
      value: (isObject(transaction.Amount) ? transaction.Amount.value : dropsToXrp(transaction.Amount)).replace(".", ","),
    }}
  } else if (transaction.TransactionType === "OfferCreate") {
    return { ...returnObject, ...{
      Currency: isObject(transaction.TakerGets) ? formatCurrency(transaction.TakerGets.currency) : "XRP",
      Issuer: isObject(transaction.TakerGets) ? transaction.TakerGets.issuer : undefined,
      value: (isObject(transaction.TakerGets) ? transaction.TakerGets.value : dropsToXrp(transaction.TakerGets)).replace(".", ","),
      CounterCurrency: isObject(transaction.TakerPays) ? formatCurrency(transaction.TakerPays.currency) : "XRP",
      CounterIssuer: isObject(transaction.TakerPays) ? transaction.TakerPays.issuer : undefined,
      Countervalue: (isObject(transaction.TakerPays) ? transaction.TakerPays.value : dropsToXrp(transaction.TakerPays)).replace(".", ","),
    }}
  }
  return returnObject
}
const formatCurrency = (currency: string) => {
  const isHex = /[0-9A-Fa-f]{6}/g.test(currency)
  if (isHex) return Buffer.from(currency, "hex").toString("utf8");
  return currency
}

const getFlags = (transaction: OfferCancel | OfferCreate | Payment) => {
  if (!transaction.Flags || transaction.TransactionType !== "OfferCreate") return ""
  let flags: string = ""
  let restNumber = transaction.Flags as number - 2147483648
  if (restNumber >= OfferCreateFlags.tfSell) {
    flags += `${flags !== "" ? " | " : ""}tfSell`
    restNumber -= OfferCreateFlags.tfSell
  }
  if (restNumber >= OfferCreateFlags.tfFillOrKill) {
    flags += `${flags !== "" ? " | " : ""}tfFillOrKill`
    restNumber -= OfferCreateFlags.tfFillOrKill
  }
  if (restNumber >= OfferCreateFlags.tfImmediateOrCancel) {
    flags += `${flags !== "" ? " | " : ""}tfImmediateOrCancel`
    restNumber -= OfferCreateFlags.tfImmediateOrCancel
  }
  if (restNumber >= OfferCreateFlags.tfPassive) {
    flags += `${flags !== "" ? " | " : ""}tfPassive`
    restNumber -= OfferCreateFlags.tfPassive
  }
  return flags
}

export const getTransactions = async (
  tokenAddress: string,
  blockFrom?: number,
  blockTo?: number,
  dateFrom?: moment.Moment,
  dateTo?: moment.Moment
) => {
  const transactions = await getXRPLTransactions(
    tokenAddress,
    blockFrom,
    blockTo,
    dateFrom,
    dateTo
  );
  return transactions;
};
