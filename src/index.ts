import fetch from "node-fetch"
import { disconnectClient } from "./xrplClient";
import { getTransactions } from "./orders";
import { getBalances } from "./trustlines";
import ObjectsToCsv from 'objects-to-csv-file'
import moment from "moment";
import fs from "fs"
import dotenv from "dotenv"
import { isEmpty, isString } from "lodash";

dotenv.config()

const toCSV = async (data: any[], fileName: string) => {
  const csv = new ObjectsToCsv(data);
 
  // Save to file:
  !fs.existsSync(`./output/`) && fs.mkdirSync(`./output/`, { recursive: true })
  const finalFileName = `./output/${fileName}-${moment().unix()}.csv`
  await csv.toDisk(finalFileName);
 
  // Return the CSV file as string:
  console.log("Contents in: " + finalFileName);
}

const main = async () => {
  const createBalanceCSV = process.env.CREATE_BALANCE_CSV && process.env.CREATE_BALANCE_CSV.toString().toLowerCase() !== "false"
  const xpunkAddress = !isEmpty(process.env.XPUNK_ADDRESS) ? process.env.XPUNK_ADDRESS : "rHEL3bM4RFsvF8kbQj3cya8YiDvjoEmxLq"

  const walletAddress = !isEmpty(process.env.TRANSACTIONS_ADDRESS) ? process.env.TRANSACTIONS_ADDRESS : "rHEL3bM4RFsvF8kbQj3cya8YiDvjoEmxLq"
  const createTransactionsCSV = process.env.CREATE_TRANSACTIONS_CSV && process.env.CREATE_TRANSACTIONS_CSV.toString().toLowerCase() !== "false"
  const minimumBalance = isString(process.env.MINIMUM_BALANCE) ? parseFloat(process.env.MINIMUM_BALANCE) : process.env.MINIMUM_BALANCE
  const blockFrom = !isEmpty(process.env.BLOCK_NUMBER_FROM) ? parseInt(process.env.BLOCK_NUMBER_FROM.toString()) : undefined
  const blockTo = !isEmpty(process.env.BLOCK_NUMBER_TO) ? parseInt(process.env.BLOCK_NUMBER_TO.toString()) : undefined
  const dateFrom = !isEmpty(process.env.DATE_FROM) ? moment(process.env.DATE_FROM) : undefined
  const dateTo = !isEmpty(process.env.DATE_TO) ? moment(process.env.DATE_TO) : undefined

  try {
    if (createBalanceCSV) {
      const balances = await getBalances(xpunkAddress, minimumBalance)
      await toCSV(balances, "balances")
    }

    if (createTransactionsCSV) {
      const transactions = await getTransactions(walletAddress, blockFrom, blockTo, dateFrom, dateTo)
      await toCSV(transactions, "transactions")
    }
  } catch(err) {
    console.error(err)
  } finally {
    await disconnectClient()
  }
}

main()
//   .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });