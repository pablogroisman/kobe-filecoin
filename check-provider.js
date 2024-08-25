// scripts/check-provider.js
const hre = require("hardhat");

async function main() {
    const network = await hre.ethers.provider.getNetwork();
    console.log(`Connected to network: ${network.name}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
