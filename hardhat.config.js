require("dotenv").config();
require("@nomicfoundation/hardhat-ethers");

const SAPPHIRE_TESTNET_RPC =
  process.env.SAPPHIRE_TESTNET_RPC || "https://testnet.sapphire.oasis.dev";

const deployerPrivateKey = (process.env.DEPLOYER_PRIVATE_KEY || "")
  .trim()
  .replace(/^['"]|['"]$/g, "");

const hasValidDeployerPrivateKey = /^0x[0-9a-fA-F]{64}$/.test(
  deployerPrivateKey,
);

module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    sapphireTestnet: {
      url: SAPPHIRE_TESTNET_RPC,
      chainId: 23295,
      accounts: hasValidDeployerPrivateKey ? [deployerPrivateKey] : [],
    },
  },
};
