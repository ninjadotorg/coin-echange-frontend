import axios from 'axios';
import { Wallet } from '@/services/Wallets/Wallet.js';
import { StringHelper } from '@/services/helper';
import { Ethereum } from '@/services/Wallets/Ethereum.js';
import { TokenERC721 } from '@/services/Wallets/Collectibles/TokenERC721';

const Web3 = require('web3');

const BN = Web3.utils.BN;
const BigNumber = require('bignumber.js');

const EthereumTx = require('ethereumjs-tx');

const abi = require('@/contracts/Wallet/HelloDog.json');

export class HelloDog extends TokenERC721 {
  constructor() {
    super();
    this.className = 'HelloDog';
    this.isToken = true;
    this.contractAddress = '0x9eea7965ee59c304f81d602ae1d9a3d624429d9d';
    this.decimals = 0;
    this.customToken = true;
    this.title = 'HelloDog';
    this.name = 'HD';
  }
}

export default { HelloDog };