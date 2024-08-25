const CID = require('cids');
const { ethers, network } = require('hardhat');

task(
    "make-deal-proposal",
    "Makes a deal proposal via the client contract. This will ultimately emit an event that storage providers can listen to and choose to accept your deal."
)
    .addParam("contract", "The address of the deal client contract")
    .addParam("pieceCid", "The CID of the piece")
    .addParam("pieceSize", "The size of the piece in bytes")
    .addParam("verifiedDeal", "Whether the deal is verified (true/false)")
    .addParam("label", "The deal label (typically the raw CID)")
    .addParam("startEpoch", "The epoch the deal will start")
    .addParam("endEpoch", "The epoch the deal will end")
    .addParam("storagePricePerEpoch", "The cost of the deal in FIL per epoch")
    .addParam("providerCollateral", "The collateral in FIL to be put up by the storage provider")
    .addParam("clientCollateral", "The collateral in FIL to be put up by the client (you)")
    .addParam("extraParamsVersion", "Version of extra parameters")
    .addParam("locationRef", "Where the data to be stored is located")
    .addParam("carSize", "The size of the .car file")
    .addParam("skipIpniAnnounce", "Whether to skip IPNI announce (true/false)")
    .addParam("removeUnsealedCopy", "Whether to remove unsealed copy (true/false)")
    .setAction(async (taskArgs) => {
        // Convert piece CID string to hex bytes
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

        const networkId = network.name;
        console.log("Making deal proposal on network", networkId);

        // Create a new wallet instance
        const wallet = new ethers.Wallet(network.config.accounts[0], ethers.provider);

        // Create a DealClient contract factory
        const DealClient = await ethers.getContractFactory("DealClient", wallet);

        // Create a DealClient contract instance
        const dealClient = await DealClient.attach(contractAddr);

        // Send a transaction to call makeDealProposal() method
        const transaction = await dealClient.makeDealProposal(...DealRequestStruct);
        const transactionReceipt = await transaction.wait();

        // Listen for DealProposalCreate event
        if (transactionReceipt.events && transactionReceipt.events.length > 0) {
            const event = transactionReceipt.events.find(e => e.event === "DealProposalCreated");
            if (event) {
                console.log("Complete! Event Emitted. ProposalId is:", event.args.proposalId.toString());
            } else {
                console.error("DealProposalCreated event not found in transaction receipt.");
            }
        } else {
            console.error("No events found in transaction receipt.");
            console.log("DealClient:", DealClient);
            console.log("DealRequestStruct:", DealRequestStruct);
            console.log("Transaction:", transaction);
            console.log("TransactionReceipt:", transactionReceipt);
        }
    });
