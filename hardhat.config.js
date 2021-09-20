require('@nomiclabs/hardhat-waffle');
require('@nomiclabs/hardhat-solhint');
require('hardhat-docgen');

require('dotenv').config();
const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID;
const PRIVATE_KEY_DEPLOYER = process.env.PRIVATE_KEY_DEPLOYER;
const PRIVATE_KEY_OWNER = process.env.PRIVATE_KEY_OWNER;
const PRIVATE_KEY_DEVELOPER = process.env.PRIVATE_KEY_DEVELOPER;
const { mnemonic, bscscanApiKey } = require('./secrets.json');

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: '0.8.4',
  networks: {
    mainnet: {
      url: `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
      accounts: [`0x${PRIVATE_KEY_DEPLOYER}`, `0x${PRIVATE_KEY_OWNER}`, `0x${PRIVATE_KEY_DEVELOPER}`],
    },
    ropsten: {
      url: `https://ropsten.infura.io/v3/${INFURA_PROJECT_ID}`,
      accounts: [`0x${PRIVATE_KEY_DEPLOYER}`, `0x${PRIVATE_KEY_OWNER}`, `0x${PRIVATE_KEY_DEVELOPER}`],
    },
    kovan: {
      url: `https://kovan.infura.io/v3/${INFURA_PROJECT_ID}`,
      accounts: [`0x${PRIVATE_KEY_DEPLOYER}`, `0x${PRIVATE_KEY_OWNER}`, `0x${PRIVATE_KEY_DEVELOPER}`],
    },
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/${INFURA_PROJECT_ID}`,
      accounts: [`0x${PRIVATE_KEY_DEPLOYER}`, `0x${PRIVATE_KEY_OWNER}`, `0x${PRIVATE_KEY_DEVELOPER}`],
    },
    goerli: {
      url: `https://goerli.infura.io/v3/${INFURA_PROJECT_ID}`,
      accounts: [`0x${PRIVATE_KEY_DEPLOYER}`, `0x${PRIVATE_KEY_OWNER}`, `0x${PRIVATE_KEY_DEVELOPER}`],
    },
    BSCtestnet: {
      url: `https://data-seed-prebsc-1-s1.binance.org:8545`,
      accounts: { mnemonic: mnemonic },
    },
    BSCmainnet: {
      url: `https://bsc-dataseed.binance.org/`,
      accounts: { mnemonic: mnemonic },
    },
    PolygonTestnet: {
      url: 'https://rpc-mumbai.maticvigil.com',
      accounts: [`0x${PRIVATE_KEY_DEPLOYER}`],
    },
  },
  solidity: {
    version: '0.8.0',
    settings: {
      optimizer: {
        enabled: true,
      },
    },
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://bscscan.com/
    apiKey: bscscanApiKey,
  },
  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts',
  },
  mocha: {
    timeout: 20000,
  },
};
