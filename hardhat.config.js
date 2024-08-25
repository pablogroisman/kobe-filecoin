// tasks/make-deal-proposal.js
const { task } = require("hardhat/config");
const CID = require('cids');

task(
    "make-deal-proposal",
    "Makes a deal proposal via the client contract. This will ultimately emit an event that storage providers can listen to and choose to accept your deal."
)
    .addParam("contract", "The address of the deal client solidity")
    .addParam("pieceCid", "The CID of the data you want to put up a bounty for")
    .addParam("pieceSize", "Size of the data you are putting a bounty on")
    .addParam("verifiedDeal", "Whether the deal is verified or not")
    .addParam("label", "The deal label (typically the raw cid)")
    .addParam("startEpoch", "The epoch the deal will start")
    .addParam("endEpoch", "The epoch the deal will end")
    .addParam("storagePricePerEpoch", "The cost of the deal, in FIL, per epoch")
    .addParam("providerCollateral", "The collateral, in FIL, to be put up by the storage provider")
    .addParam("clientCollateral", "The collateral, in FIL, to be put up by the client")
    .addParam("extraParamsVersion", "Extra params version")
    .addParam("locationRef", "Where the data you want to be stored is located")
    .addParam("carSize", "The size of the .car file")
    .addParam("skipIpniAnnounce", "Whether to skip IPNI announcement or not")
    .addParam("removeUnsealedCopy", "Whether to remove unsealed copy or not")
    .setAction(async (taskArgs) => {
        const cid = taskArgs.pieceCid;
        const cidHexRaw = new CID(cid).toString('base16').substring(1);
        const cidHex = "0x" + cidHexRaw;
        const contractAddr = taskArgs.contract;

        const verified = (taskArgs.verifiedDeal === 'true');
        const skipIpniAnnounce = (taskArgs.skipIpniAnnounce === 'true');
        const removeUnsealedCopy = (taskArgs.removeUnsealedCopy === 'true');

        const extraParamsV1 = [
            taskArgs.locationRef,
            taskArgs.carSize,
            skipIpniAnnounce,
            removeUnsealedCopy,
        ];

        const DealRequestStruct = [
            cidHex,
            taskArgs.pieceSize,
            verified,
            taskArgs.label,
            taskArgs.startEpoch,
            taskArgs.endEpoch,
            taskArgs.storagePricePerEpoch,
            taskArgs.providerCollateral,
            taskArgs.clientCollateral,
            taskArgs.extraParamsVersion,
            extraParamsV1,
        ];

        const networkId = hre.network.name;
        console.log("Making deal proposal on network", networkId);

        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, ethers.provider);
        const DealClient = await ethers.getContractFactory("DealClient", wallet);
        const dealClient = await DealClient.attach(contractAddr);

        const transaction = await dealClient.makeDealProposal(DealRequestStruct);
        const transactionReceipt = await transaction.wait();

        if (transactionReceipt.events && transactionReceipt.events.length > 0) {
            const event = transactionReceipt.events[0].topics[1];
            console.log("Complete! Event Emitted. ProposalId is:", event);
        } else {
            console.error("No events found in transaction receipt.");
        }
    });
