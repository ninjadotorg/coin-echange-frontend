import axios from 'axios';
import { Wallet } from 'src/services/Wallets/Wallet.js';
import { StringHelper } from 'src/services/helper';
import { Ethereum } from 'src/services/Wallets/Ethereum.js';
import { TokenERC721 } from 'src/services/Wallets/Collectibles/TokenERC721';

const Web3 = require('web3');

const BN = Web3.utils.BN;
const BigNumber = require('bignumber.js');

const EthereumTx = require('ethereumjs-tx');

const abi = require('src/contracts/Wallet/CryptoClown.json');

export class CryptoClown extends TokenERC721 {
  constructor() {
    super();
    this.className = 'CryptoClown';
    this.isToken = true;
    this.contractAddress = '0x9884d4e9b305ad015168e9d6e4400582dce2cd59';
    this.decimals = 0;
    this.customToken = true;
    this.title = 'CryptoClown';
    this.name = 'CC';
  }
}

export default { CryptoClown };
