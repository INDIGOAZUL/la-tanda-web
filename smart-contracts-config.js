// La Tanda Smart Contracts Configuration
const SMART_CONTRACTS_CONFIG = {
  "contracts": {
    "LTDToken": {
      "address": "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
      "abi": "LTDToken.json"
    },
    "LaTandaDAO": {
      "address": "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707",
      "abi": "LaTandaDAO.json"
    },
    "GroupManager": {
      "address": "0x0165878A594ca255338adfa4d48449f69242Eb8F",
      "abi": "GroupManager.json"
    }
  },
  "network": {
    "name": "unknown",
    "chainId": 31337,
    "rpcUrl": "http://localhost:8545"
  }
};

export const CHAIN_CONFIG = {
    chainId: '0x7a69',
    chainName: 'Honduras Chain',
    nativeCurrency: {
        name: 'HNL',
        symbol: 'HNL',
        decimals: 18
    },
    rpcUrls: ['http://localhost:8545'],
    blockExplorerUrls: ['https://explorer.honduras-chain.org']
};module.exports = { SMART_CONTRACTS_CONFIG };
