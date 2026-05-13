require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.19",
  networks: {
    kiteTestnet: {
      url: "https://rpc-testnet.gokite.ai/",
      chainId: 2368,
      accounts: process.env.AGENT_PRIVATE_KEY ? [process.env.AGENT_PRIVATE_KEY] : [],
    },
    kiteMainnet: {
      url: "https://rpc.gokite.ai/",
      chainId: 2366,
      accounts: process.env.AGENT_PRIVATE_KEY ? [process.env.AGENT_PRIVATE_KEY] : [],
    },
  },
};
