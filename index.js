const Web3 = require('web3');
const BridgeABI = require("./build/Bridge").abi;

const ETH = {
    name: "ETH",
    url: 'https://mainnet.infura.io/v3/d5e486fedb5145e8bd90d3d5b36a1ba9',
    fromBlock: '11739872',
    address: '0x278cDd6847ef830c23cac61C17Eab837fEa1C29A',
    erc20HandlerAddress: '0xB8B493600A5b200Ca2c58fFA9dced00694fB3E38',
};
const AVA = {
    name: "AVA",
    url: "https://api.avax.network/ext/bc/C/rpc",
    fromBlock: '34246',
    address: "0xee8aE1088D02CCDA2CDd0FdA2381DB679d0b122E",
    erc20HandlerAddress: "0x40a07f36655A0724557cA53A9E5D1b5018e9Df32",
};

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
    const fetch = async (config) => {
        const web3 = new Web3(new Web3.providers.HttpProvider(config.url));
        const bridgeContract = new web3.eth.Contract(BridgeABI, config.address);
        const proposals = {};
        const deposits = {};
        let proposalsAll = [];

        await bridgeContract.getPastEvents("ProposalEvent", {fromBlock: config.fromBlock}, (err, data) => {
            const process = event => {
                try {
                    proposalsAll.push({
                        ...event.returnValues,
                        blockNumber: event.blockNumber,
                        transactionIndex: event.transactionIndex
                    });
                } catch (err) {
                    // console.error(err);
                    console.error("can't process event",event);
                }
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

        await bridgeContract.getPastEvents("Deposit", {fromBlock: config.fromBlock}, (err, data) => {
            const getData = async event => {
                try {
                    await sleep(50);
                    const tx = await web3.eth.getTransaction(event.transactionHash).catch(console.error);
                    deposits[event.returnValues.depositNonce] = {
                        "destinationChainID": event.returnValues.destinationChainID,
                        "resourceID": event.returnValues.resourceID,
                        "depositNonce": event.returnValues.depositNonce,
                        "data": "0x" + tx.input.slice(266)
                    }
                } catch (e) {
                    console.error("can't find tx for", event.transactionHash, "in", config.name);
                }
            };
            if (Array.isArray(data)) {
                data.map(e => {
                    getData(e);
                });
            } else {
                getData(data);
            }
        }).catch(console.error);

        return {
            config,
            proposals,
            deposits,
        }
    };

    const fromETH = await fetch(ETH);
    const fromAVA = await fetch(AVA);

    const print = (targetChain, homeChain) => {
        for (let key in targetChain.proposals) {
            const proposal = targetChain.proposals[key];
            try {
                if (proposal.status !== "3")
                    console.log(
                        "stuck in", targetChain.config.name,
                        "originChainID", proposal.originChainID,
                        "depositNonce", proposal.depositNonce,
                        "status", proposal.status,
                        "resourceID", proposal.resourceID,
                        "dataHash", proposal.dataHash,
                        "data", homeChain.deposits[proposal.depositNonce].data,
                    );
            } catch (e) {
                console.error("can't resolve data for proposal in", targetChain.config.name,
                    "originChainID", proposal.originChainID,
                    "depositNonce", proposal.depositNonce,
                    "status", proposal.status,
                    "resourceID", proposal.resourceID,
                    "dataHash", proposal.dataHash,
                );
            }
        }
    };

    print(fromETH, fromAVA);
    console.log("--------------------");
    print(fromAVA, fromETH);
})();