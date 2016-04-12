var Auth = {
    Type: {
        Null: 0,
        SingleSigner: 1,
        MultiSigner: 2
    },
    Error: {
        NoError: 0,
        AccessDenied: 1,
        InvalidHash: 2,
        HashNotFound: 3,
        HashAlreadySigned: 4
    }
};

var TEST_HASH = "0x123456789abcdef";

var code = "606060405260018054600160a060020a03191633179055610169806100246000396000f3606060405236156100565760e060020a60003504630591514781146100585780631a9069cf14610061578063238ac9331461007b578063775eb9001461008f578063799cd333146100ab5780637df73e27146100e8575b005b61010460015b90565b610104600435600081815260208190526040902054610153565b61010e600154600160a060020a031661005e565b6101046004356000818152602081905260408120541415610153565b61010460043560008181526020819052604081205481146100ca575060045b60015433600160a060020a039081169116146101585750600161012a565b610104600435600154600160a060020a03808316911614610153565b6060908152602090f35b600160a060020a03166060908152602090f35b60406000204290555b80827f96b44c08ba795a44773a7f920b17c02b97f3a555218090672667d531e7e1ee7960006060a35b919050565b60008214156101215750600261012a56";
var abi = [{"constant":true,"inputs":[],"name":"authType","outputs":[{"name":"authType","type":"uint8"}],"type":"function"},{"constant":true,"inputs":[{"name":"hash","type":"bytes32"}],"name":"signDate","outputs":[{"name":"signDate","type":"uint256"}],"type":"function"},{"constant":true,"inputs":[],"name":"signer","outputs":[{"name":"signer","type":"address"}],"type":"function"},{"constant":true,"inputs":[{"name":"hash","type":"bytes32"}],"name":"signed","outputs":[{"name":"signed","type":"bool"}],"type":"function"},{"constant":false,"inputs":[{"name":"hash","type":"bytes32"}],"name":"sign","outputs":[{"name":"error","type":"uint8"}],"type":"function"},{"constant":true,"inputs":[{"name":"addr","type":"address"}],"name":"isSigner","outputs":[{"name":"","type":"bool"}],"type":"function"},{"anonymous":false,"inputs":[{"indexed":true,"name":"hash","type":"bytes32"},{"indexed":true,"name":"error","type":"uint256"}],"name":"Sign","type":"event"}];
var userAddress;

var web3 = new Web3();

web3.setProvider(new web3.providers.HttpProvider('http://localhost:8545'));
try {
    userAddress = web3.eth.defaultAccount = web3.eth.coinbase;
} catch (error) {
    alert("Failed to connect to ethereum node over RPC;\nthe tests will not function.")
}

function deployNew(callback) {
    web3.eth.contract(abi).new({data: code}, function (err, contract) {
        if(err) {
            callback(err);
            // callback fires twice, we only want the second call when the contract is deployed
        } else if(contract.address){
            callback(null, contract);
        }
    });
}

function sign(from, contract, hash, callback) {

    var evt = contract.Sign();
    var txHash;
    evt.watch(function(err, data){
        if(err || (data.transactionHash === txHash && data.blockNumber)) {
            evt.stopWatching();
            return callback(err, err ? null : data.args.error.toNumber(), data.blockNumber);
        }
    });
    try {
        if (!from){
            txHash = contract.sign(hash);
        } else {
            txHash = contract.sign(hash, {from: from});
        }

    } catch (err) {
        evt.stopWatching();
        return callback(err);
    }
}

QUnit.test( "deploy successful", function( assert ) {
    var done = assert.async();
    deployNew(function(error, contract){
        assert.ok(!error, "Failed to deploy contract.");
        try {
            var authType = contract.authType();
            assert.equal(authType.toNumber(), Auth.Type.SingleSigner, "Wrong contract type returned.");
            var signer = contract.signer();
            assert.equal(signer, userAddress, "Wrong signer");
            done();
        } catch (error) {
            console.error(error);
            assert.ok(!error, "Failed to access contract.");
            done();
        }
    });
});

QUnit.test( "sign successful", function( assert ) {
    var done = assert.async();
    deployNew(function(error, contract){
        assert.ok(!error, "Failed to deploy contract.");
        sign(null, contract, TEST_HASH, function(error, code, blockNumber){
            assert.ok(!error, "Error when signing.");
            assert.equal(code, Auth.Error.NoError, "Error code is not zero");

            try {
                var signed = contract.signed(TEST_HASH);
                assert.ok(signed, "'signed' is not true");
                var timestamp = contract.signDate(TEST_HASH).toNumber();
                var blockTs = web3.eth.getBlock(blockNumber).timestamp;
                assert.equal(timestamp, blockTs, "Timestamps does not match");
                done();
            } catch (error) {
                console.error(error);
                assert.ok(!error, "Failed to access contract.");
                done();
            }
        })
    });
});

QUnit.test( "sign fail bad hash", function( assert ) {
    var done = assert.async();
    deployNew(function(error, contract){
        assert.ok(!error, "Failed to deploy contract.");
        sign(null, contract, "0x0", function(error, code){
            assert.ok(!error, "Error when signing.");
            assert.equal(code, Auth.Error.InvalidHash, "Error is not 'InvalidHash'");
            contract.signed(TEST_HASH, function(err, signed){
                assert.ok(!err, "Error when getting contract data.");
                assert.ok(!signed, "Hash is signed despite being invalid.");
                done();
            });
        })
    });
});

QUnit.test( "sign fail already signed", function( assert ) {
    var done = assert.async();
    deployNew(function(error, contract){
        assert.ok(!error, "Failed to deploy contract.");

        sign(null, contract, TEST_HASH, function(error){
            assert.ok(!error, "Error when signing.");
            sign(null, contract, TEST_HASH, function(error, code){
                assert.ok(!error, "Error when signing.");
                assert.equal(code, Auth.Error.HashAlreadySigned, "Error is not 'HashAlreadySigned'");
                contract.signed(TEST_HASH, function(err, signed){
                    assert.ok(!err, "Error when getting contract data.");
                    assert.ok(signed, "Hash not signed despite sign failing for that reason.");
                    done();
                });
            })
        })
    });
});

QUnit.test( "sign fail not signer", function( assert ) {
    var done = assert.async();
    deployNew(function(error, contract){
        assert.ok(!error, "Failed to deploy contract.");
        sign(web3.eth.accounts[1], contract, TEST_HASH, function(error, code){
            assert.ok(!error, "Error when signing.");
            assert.equal(code, Auth.Error.AccessDenied, "Error is not 'AccesDenied'");
            contract.signed(TEST_HASH, function(err, signed){
                assert.ok(!err, "Error when getting contract data.");
                assert.ok(!signed, "Hash is signed by unauthorized account.");
                done();
            });
        })
    });
});
