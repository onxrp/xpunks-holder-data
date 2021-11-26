import { isEmpty, isObject, isUndefined } from "lodash";
import moment from "moment";
import fetch from "node-fetch";
import {
  rippleTimeToISOTime,
  Transaction,
  OfferCancel,
  OfferCreate,
  Payment,
  dropsToXrp,
  OfferCreateFlags,
} from "xrpl";
import { getXRPLClient } from "./xrplClient";
import { ITransactionResult, ITransaction } from "./models/ITransaction";

export const getXRPLTransactions = async (
  tokenAddress: string,
  dateFrom = moment().subtract(2, "days"),
  dateTo?: moment.Moment,
  marker: unknown = undefined
): Promise<ITransaction[]> => {
  const client = await getXRPLClient();
  const response = await client.request({
    command: "account_tx",
    account: tokenAddress,
    ledger_index_min: -1,
    ledger_index_max: -1,
    binary: false,
    limit: 2000,
    // "forward": false,
    marker,
  });

  if (!response?.result?.transactions) return [];

  let overTime = false;
  const transactions = [] as ITransaction[];
  (response.result.transactions ?? []).forEach((accTransaction) => {
    const transaction = accTransaction.tx;
    if (
      isObject(accTransaction.meta) &&
      accTransaction.meta.TransactionResult === "tesSUCCESS" &&
      (transaction.TransactionType === "OfferCreate" ||
        transaction.TransactionType === "Payment" ||
        transaction.TransactionType === "OfferCancel")
    ) {
      const transDate = moment(rippleTimeToISOTime((<any>transaction).date));
      if (
        (!dateFrom || dateFrom <= transDate) &&
        (!dateTo || dateTo >= transDate)
      ) {
        transactions.push({
          Sequence: transaction.Sequence,
          CancelledSequence: transaction.TransactionType === "OfferCreate" || transaction.TransactionType === "OfferCancel" ? transaction.OfferSequence : undefined,
          Type: transaction.TransactionType as "OfferCancel" | "OfferCreate" | "Payment",
          DateTime: transDate.toISOString(),
          FromWallet: transaction.Account,
          ToWallet: transaction.TransactionType === "Payment" ? transaction.Destination : null,
          ...getBuySell(transaction),
          Flags: getFlags(transaction)
        });
      }
      if (dateFrom && dateFrom > transDate) overTime = true;
    }
  });

  if (overTime || !response?.result?.marker) return transactions;
  else
    return [
      ...transactions,
      ...(await getXRPLTransactions(
        tokenAddress,
        dateFrom,
        dateTo,
        response?.result?.marker
      )),
    ];
};

const getBuySell = (transaction: OfferCancel | OfferCreate | Payment) => {
  if (transaction.TransactionType !== "OfferCreate") return {}
  return ({
    OrderType: isObject(transaction.TakerGets) ? "Sell" : "Buy" as "Buy" | "Sell",
    AmountXPUNK: isObject(transaction.TakerGets) ? transaction.TakerGets.value : (isObject(transaction.TakerPays) ? transaction.TakerPays.value : "0"),
    AmountXRP: dropsToXrp(!isObject(transaction.TakerGets) ? transaction.TakerGets : (!isObject(transaction.TakerPays) ? transaction.TakerPays : "0"))
  })
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
  dateFrom?: moment.Moment,
  dateTo?: moment.Moment
) => {
  const transactions = await getXRPLTransactions(
    tokenAddress,
    dateFrom,
    dateTo
  );
  return transactions;
};
