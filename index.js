var Web3 = require('web3');
var BridgeABI = require("./build/Bridge").abi;

const ETH = {
    url: 'https://mainnet.infura.io/v3/45174a29359d4b07ade01676259bc47a',
    fromBlock: '11739872',
    address: '0x278cDd6847ef830c23cac61C17Eab837fEa1C29A',
    erc20HandlerAddress: '0xB8B493600A5b200Ca2c58fFA9dced00694fB3E38',
};
const AVA = {
    url: "https://api.avax.network/ext/bc/C/rpc",
    fromBlock: '34246',
    address: "0xee8aE1088D02CCDA2CDd0FdA2381DB679d0b122E",
    erc20HandlerAddress: "0x40a07f36655A0724557cA53A9E5D1b5018e9Df32",
};

// const config = ETH;
const config = AVA;

var web3 = new Web3(config.url);

var bridgeContract = new web3.eth.Contract(BridgeABI, config.address);

var proposals = {};
var proposalsAll = [];


(async () => {

    await bridgeContract.getPastEvents("ProposalEvent", {fromBlock: config.fromBlock}, (err, data) => {
        const process = e => {
            proposalsAll.push({...e.returnValues, blockNumber: e.blockNumber, transactionIndex: e.transactionIndex});
        };
        if (Array.isArray(data)) {
            data.map(e => {
                process(e);
            });
        } else {
            process(data);
        }

    }).catch(console.error);

    proposalsAll.sort((a, b) => {
        if (a.blockNumber !== b.blockNumber) {
            return a.blockNumber > b.blockNumber;
        }

        return a.transactionIndex > b.transactionIndex;
    });

    proposalsAll.map(e => {
        proposals[e.dataHash] = e;
    });

    console.log('--------------last status---------------------------');
    for (let key in proposals) {
        const e = proposals[key];
        if (e.status !== "3")
            console.log(
                "originChainID", e.originChainID,
                "depositNonce", e.depositNonce,
                "status", e.status,
                "resourceID", e.resourceID,
                "dataHash", e.dataHash,
            );
    }
})();