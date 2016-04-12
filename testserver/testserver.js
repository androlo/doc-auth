var TestRPC = require("ethereumjs-testrpc");

var server = TestRPC.server({total_accounts: 2});
server.listen("8545", function(err) {
    if(err) throw err;
    console.log("Ethereum test RPC server listening on port 8545")
});