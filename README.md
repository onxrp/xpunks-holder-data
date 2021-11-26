
# HOW TO USE

1. Install NodeJS with NPM and Yarn (https://www.pluralsight.com/guides/getting-started-with-nodejs)

2. Install the needed packages by running one of the following commands:

    ```node
    npm install
    yarn install
    ```

3. Edit the .env file with the values you need

4. Run one of the following command to create the csv files with the needed information:

      ```node
      npx run start
      yarn run start
      ```

5. Check the "ouput" folder in this directory for the CSV files just created. There will be a file named `"balances-{current unix time}.csv"` with the current balances and a file named `"transactions-{current unix time}.csv"` with the configured transactions