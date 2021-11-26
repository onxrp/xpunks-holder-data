import fetch from "node-fetch"
import { disconnectClient } from "./xrplClient";
import { getTransactions } from "./orders";
import { getBalances } from "./trustlines";
import ObjectsToCsv from "objects-to-csv"
import moment from "moment";
import fs from "fs"

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
  try {
    const balances = await getBalances("rHEL3bM4RFsvF8kbQj3cya8YiDvjoEmxLq")
    await toCSV(balances, "balances")

    const transactions = await getTransactions("rHEL3bM4RFsvF8kbQj3cya8YiDvjoEmxLq")
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