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

const config = ETH;
// const config = AVA;

var web3 = new Web3(config.url);

var bridgeContract = new web3.eth.Contract(BridgeABI, config.address);

bridgeContract.getPastEvents("Deposit", {fromBlock: config.fromBlock}, (err, data) => {
    const getData = async e => {
        // console.log("e", e);
        const tx = await web3.eth.getTransaction(e.transactionHash);
        console.log(
            "destinationChainID", e.returnValues.destinationChainID,
            "resourceID", e.returnValues.resourceID,
            "depositNonce", e.returnValues.depositNonce,
            "data", "0x" + tx.input.slice(266)
        )
    };
    if (Array.isArray(data)) {
        data.map(e => {
            getData(e);
        });
    } else {
        getData(data);
    }

}).catch(console.error);
