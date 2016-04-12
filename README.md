# doc-auth

Example [Ethereum](https://www.ethereum.org/) DApp that is used for signing documents, and checking if documents has been signed.

Validating a document is done by computing the SHA3-256 hash, and passing the hash into the check function. If the hash has been signed, the application will respond by displaying the time and date when the document was signed.

### Running the demo

To run the demo you need to have a running public chain node, and know how to interact with it. Instructions can be found on the Ethereum page, or on the official page of the most popular Ethereum client [geth](http://ethereum.github.io/go-ethereum/).

When the Ethereum node is running and answering to RPC calls, just start `www/index.html` in a web-browser. Near the bottom of the page you will find several examples of documents and their hashes that you can paste into the hash field and `check`.

The web-page points to an Ethereum contract deployed by me, which means I am the only one allowed to sign hashes (i.e. I am the Authority). The contract is an instance of `SingleSignerAuthority` (which can be found in the `contracts` folder), and is deployed on the public chain.

##### Troubleshooting

If the page fails to load, you will get an alert. If the alert says that RPC connection can't be established, make sure that:

- Ethereum is running, and answers to RPC calls on the correct address and port. You can change the address and port at line 8 of `www/scripts/index.js`.

- CORS is set (with geth you add `--rpccorsdomain "*"`)

If the page says that contract data can't be read, make sure that:

- the Ethereum node is running the public chain.

### Create a new SingleSignerAuthority

To create Your own authority You need to do this:

1. Deploy a new instance of `SingleSignerAuthority`. This can be done from the [Mist wallet](https://github.com/ethereum/mist), for example. It does not matter if you add it to the public chain (Homestead), the test-chain (Morden), or a local dev-chain.

2. Open `www/scripts/index.js` and change the `contractAddress` variable (line 7) to the new address.

3. (Optional) Edit the Ethereum RPC port.

4. Run the webpage.

##### Troubleshooting

In addition to the RPC alert, you may now also get an alert that says the contract can't be read. In that case make sure that you updated the `index.js` file with the new contract address.

If there is no blue `sign` button below the hash field, make sure that the current `coinbase` address is the same as the one used when deploying the contract.

### Testing the contract (node.js)

Contract tests are done using [QUnit](http://qunitjs.com/) against an [ethereumjs-testrpc]((https://github.com/ethereumjs/testrpc)) server. This is how you run them:

1. Make sure `node.js` and `npm` is on your path.

**NOTE** To run `testrpc` on Windows you need to do some additional preparation. Instructions can be found [here](https://github.com/ethereumjs/testrpc/wiki/Installing-TestRPC-on-Windows). If you don't intend on using testrpc, this is probably not worth the effort.

2. cd into the project root and type `npm install`. This will install testrpc locally.

3. cd into the `testserver` folder and run `testserver.js`. Wait for it to print `Ethereum test RPC server listening on port 8545`.

4. Start `www/contract_test.html` in a web-browser.