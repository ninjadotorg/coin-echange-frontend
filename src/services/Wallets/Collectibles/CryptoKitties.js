import axios from 'axios';
import { Wallet } from 'src/services/Wallets/Wallet.js';
import { StringHelper } from 'src/services/helper';
import { Ethereum } from 'src/services/Wallets/Ethereum.js';
import { TokenERC721 } from 'src/services/Wallets/Collectibles/TokenERC721.js';

const Web3 = require('web3');

const BN = Web3.utils.BN;
const BigNumber = require('bignumber.js');

const EthereumTx = require('ethereumjs-tx');

const abi = require('src/contracts/Wallet/CryptoKitties.json');

export class CryptoKitties extends TokenERC721 {
  constructor() {
    super();
    this.className = 'CryptoKitties';
    this.isToken = true;
    this.contractAddress = '0x06012c8cf97bead5deae237070f9587f8e7a266d';
    this.decimals = 0;
    this.customToken = true;
    this.title = 'CryptoKitties';
    this.name = 'CK';
  }
}

export default { CryptoKitties };
