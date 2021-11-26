import fetch from "node-fetch"
import { disconnectClient } from "./xrplClient";
import { getTransactions } from "./orders";
import { getBalances } from "./trustlines";
import ObjectsToCsv from "objects-to-csv"
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
  fs.writeFileSync(finalFileName, '"sep=,"\n' + await csv.toString())
 
  // Return the CSV file as string:
  console.log("Contents in: " + finalFileName);
}

const main = async () => {
  const address = !isEmpty(process.env.XPUNK_ADDRESS) ? process.env.XPUNK_ADDRESS : "rHEL3bM4RFsvF8kbQj3cya8YiDvjoEmxLq"
  const minimumBalance = isString(process.env.MINIMUM_BALANCE) ? parseFloat(process.env.MINIMUM_BALANCE) : process.env.MINIMUM_BALANCE
  const dateFrom = !isEmpty(process.env.DATE_FROM) ? moment(process.env.DATE_FROM) : undefined
  const dateTo = !isEmpty(process.env.DATE_TO) ? moment(process.env.DATE_TO) : undefined

  console.log(minimumBalance)

  try {
    const balances = await getBalances(address, minimumBalance)
    await toCSV(balances, "balances")

    const transactions = await getTransactions(address, dateFrom, dateTo)
    await toCSV(transactions, "transactions")
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