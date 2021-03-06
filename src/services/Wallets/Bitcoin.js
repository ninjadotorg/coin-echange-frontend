import axios from 'axios';
import satoshi from 'satoshi-bitcoin';
import { StringHelper } from 'src/services/helper';
import { Wallet } from 'src/services/Wallets/Wallet';
// import { NB_BLOCKS } from 'src/constants';
export const NB_BLOCKS = 20;
import { set, getJSON } from 'js-cookie';

const bitcore = require('bitcore-lib');
const BigNumber = require('bignumber.js');
const moment = require('moment');
const Mnemonic = require('bitcore-mnemonic');

const COOKIE_LEVEL_FEES = 'btc_level_fees';

export class Bitcoin extends Wallet {
  static Network = { Mainnet: 'https://insight.bitpay.com/api' }

  constructor() {
    super();

    this.coinType = 0;
    this.name = 'BTC';
    this.title = 'Bitcoin';
    this.className = 'Bitcoin';
  }

  getShortAddress() {
    return this.address.replace(this.address.substr(4, 26), '...');
  }

  getName() {
    return this.name;
  }

  setDefaultNetwork() {
    this.getShortAddress();
    bitcore.Networks.defaultNetwork = bitcore.Networks.livenet;
  }

  getAPIUrlTransaction(transactionNo) {
    this.getName();
    const url = `https://${bitcore.Networks.defaultNetwork === bitcore.Networks.livenet ? '' : 'test-'}insight.bitpay.com/tx/${transactionNo}`;
    return url;
  }

  getAPIUrlAddress() {
    const url = `https://${bitcore.Networks.defaultNetwork === bitcore.Networks.livenet ? '' : 'test-'}insight.bitpay.com/address/${this.address}`;
    return url;
  }

  createAddressPrivatekey() {
    this.setDefaultNetwork();

    let code = null;

    if (this.mnemonic === '') {
      code = new Mnemonic();
      this.mnemonic = code.phrase;
    } else { code = new Mnemonic(this.mnemonic); }

    const xpriv = code.toHDPrivateKey();

    const hdPrivateKey = new bitcore.HDPrivateKey(xpriv);
    const derived = hdPrivateKey.derive(StringHelper.format('m/44\'/{0}\'/0\'/0/0', this.coinType));
    this.address = derived.privateKey.toAddress().toString();
    this.privateKey = derived.privateKey.toString();
  }

  async getBalance(isFormatNumber) {
    this.setDefaultNetwork();

    const url = `${this.network}/addr/${this.address}/balance`;
    const response = await axios.get(url);

    if (response.status === 200) {
      if (isFormatNumber) { return this.formatNumber(await satoshi.toBitcoin(response.data)); }
      const result = await satoshi.toBitcoin(response.data);
      return result;
    }
    return false;
  }

  checkAddressValid(toAddress) {
    this.getName();
    if (!bitcore.Address.isValid(toAddress)) {
      return 'bitcoin.error.invalid_address';
    }
    return true;
  }


  async transfer(toAddress, amountToSend, opt = {}) {
    try {
      if (!bitcore.Address.isValid(toAddress)) {
        return { status: 0, message: 'bitcoin.error.invalid_address2' };
      }

      const blocks = opt.blocks || NB_BLOCKS;
      let fee = opt.fee || 0;

      console.log('toAddress:', toAddress,
        '\n param blocks:', blocks,
        '\n param fee:', fee);

      // Check balance:
      const balance = await this.getBalance();
      amountToSend = parseFloat(amountToSend).toFixed(8);

      console.log('defaultNetwork: ', bitcore.Networks.defaultNetwork,
        '\n server', this.network,
        '\n balance:', balance,
        '\n amountToSend:', amountToSend);

      if (!balance || balance === 0 || balance <= amountToSend) {
        return { status: 0, message: 'bitcoin.error.insufficient' };
      }

      // each BTC can be split into 100,000,000 units. Each unit of bitcoin, or 0.00000001 bitcoin, is called a satoshi
      const amountBig = new BigNumber(amountToSend.toString());
      const satoshiRate = new BigNumber('100000000');
      amountToSend = amountBig.times(satoshiRate).toString();

      if (!fee) {
        fee = await this.getFee(blocks);
      }

      if (fee) {
        const utxos = await this.utxosForAmount(Number(amountToSend) + Number(fee));

        if (utxos !== false) {
          const fromAddress = this.address;
          const privateKey = this.privateKey;
          const transaction = new bitcore.Transaction()
            .from(utxos)
            .change(fromAddress)
            .fee(fee)
            .to(toAddress, Number(amountToSend))
            .sign(privateKey);

          const rawTx = transaction.serialize();
          const txHash = await this.sendRawTx(rawTx);

          return { status: 1, message: 'bitcoin.success.transaction', data: { hash: txHash.txid } };
        }

        return { status: 0, message: 'bitcoin.error.insufficient' };
      }
    } catch (error) {
      console.log('error', error);
      return { status: 0, message: 'bitcoin.error.insufficient' };
    }
    return { status: 0, message: 'bitcoin.error.insufficient' };
  }

  async retrieveUtxos() {
    const url = `${this.network}/addr/${this.address}/utxo`;

    const response = await axios.get(url);

    if (response.status === 200) {
      const utxos = response.data;
      utxos.sort((a, b) => b.satoshis - a.satoshis);
      return utxos;
    }
    return false;
  }

  async utxosForAmount(amount) {
    const utxos = await this.retrieveUtxos();
    if (utxos && utxos.length > 0) {
      const result = this.findUtxos(utxos, 0, amount, []);
      if (!result) return false;
      return result;
    }
    return false;
  }

  findUtxos(utxos, pos, amount, result) {
    if (pos >= utxos.length) { return null; }

    const utxo = utxos[pos];
    result.push(utxo);

    // in case of enough money
    if (utxo.satoshis >= amount) {
      return result;
    }
    amount -= utxo.satoshis;
    return this.findUtxos(utxos, pos + 1, amount, result);
  }

  async getFee(blocks = NB_BLOCKS, toBTC) {
    const url = `${this.network}/utils/estimatefee?nbBlocks=${blocks}`;
    const response = await axios.get(url);

    if (response.status === 200) {
      let txFee = '';
      if (toBTC) {
        txFee = bitcore.Unit.fromBTC(response.data[blocks]).toBTC();
      } else {
        txFee = bitcore.Unit.fromBTC(response.data[blocks]).toSatoshis();
      }
      return txFee;
    }
    return false;
  }

  async sendRawTx(rawTx) {
    const uri = `${this.network}/tx/send`;
    const txHash = await axios.post(uri, {
      rawtx: rawTx,
    });
    if (txHash.status == 200) {
      return txHash.data;
    }
    return false;
  }

  async listInternalTransactions() {
    return [];
  }

  async getTransaction() {
    return false;
  }

  async getTransactionHistory(pageno) {
    const from = (pageno - 1) * 20;
    const to = from + 20;
    const url = `${this.network}/addrs/${this.address}/txs/?from=${from}&to=${to}`;
    const response = await axios.get(url);
    let result = [];
    if (response.status === 200) {
      if (response.data && response.data.items) {
        result = response.data.items;
      }
    }

    return result;
  }

  async getTransactionCount() {
    const url = `${this.network}/addrs/${this.address}/txs/?from=0&to=1`;
    const response = await axios.get(url);
    let result = 0;
    if (response.status === 200) {
      if (response.data && response.data.totalItems) {
        result = response.data.totalItems;
      }
    }

    return result;
  }

  formatNumber(value, decimal = 6) {
    let result = value; let
      count = 0;
    try {
      if (Math.floor(value) !== value) { count = value.toString().split('.')[1].length || 0; }

      if (count > decimal) { result = value.toFixed(decimal); }
    } catch (e) {
      result = value;
    }

    return result;
  }

  cook(data) {
    let vin = {}; let vout = {}; const coin_name = this.name;


    let is_sent = 2; let value = 0;


    const addresses = []; let confirmations = 0; let transaction_no = '';


    let transactionDate = new Date();

    if (data) {
      transaction_no = data.txid;
      vin = data.vin;
      vout = data.vout;
      confirmations = data.confirmations,
      transactionDate = data.time ? new Date(data.time * 1000) : '';

      try {
        // check transactions are send
        for (const tin of vin) {
          if (!tin.addr) tin.addr = '';

          if (tin.addr.toLowerCase() == this.address.toLowerCase()) {
            is_sent = 1;

            for (const tout of vout) {
              if (tout.scriptPubKey.addresses) {
                const tout_addresses = tout.scriptPubKey.addresses.join(' ').toLowerCase();
                if (tout_addresses.indexOf(this.address.toLowerCase()) < 0) {
                  value += Number(tout.value);
                  addresses.push(tout_addresses.replace(tout_addresses.substr(4, 26), '...'));
                }
              }
            }

            break;
          }
        }

        // check transactions are receive
        if (is_sent != 1 && vout) {
          for (const tout of vout) {
            if (tout.scriptPubKey.addresses) {
              const tout_addresses = tout.scriptPubKey.addresses.join(' ').toLowerCase();

              if (tout_addresses.indexOf(this.address.toLowerCase()) >= 0) {
                value += tout.value;
              } else {
                addresses.push(tout_addresses.replace(tout_addresses.substr(4, 26), '...'));
              }
            }
          }
        }
      } catch (e) {
        console.error(e);
      }

      value = this.formatNumber(value);
      if (addresses.length < 1) addresses.push('Unparsed address');
    }

    return {
      coin_name,
      value,
      transaction_no,
      transactionDate,
      addresses,
      transaction_relative_time: transactionDate ? moment(transactionDate).fromNow() : '',
      confirmations,
      is_sent
    };
  }

  cookIT(data='') {
    this.getName();
    return false;
  }

  getLevelFee = async () => new Promise((resolve, reject) => {
    let result = getJSON(COOKIE_LEVEL_FEES);
    if (result && result.length) {
      resolve(result);
    } else {
      result = [];

      const calcTimeFee = (item) => {
        try {
          let value = (item.feePerKb / 100000000);
          const feePrice = value;
          value = this.formatNumber(value, 8);

          let min = item.nbBlocks * 10;
          let title = item.level.charAt(0).toUpperCase() + item.level.slice(1);
          if (title === 'Economy') { title = 'Low'; } else if (title === 'SuperEconomy') { title = 'Lowest'; } else if (title == 'Urgent') min /= 2;

          return {
            title, description: `${value} BTC ~ ${min} min${min > 1 ? 's' : ''}`, value: item.feePerKb, feePrice
          };
        } catch (e) {
          console.error(e);
        }

        return {
          title: '', description: '', value: 0, feePrice: 0
        };
      };


      axios.get(`https://bws.bitpay.com/bws/api/v2/feelevels/?coin=btc&network=${bitcore.Networks.defaultNetwork == bitcore.Networks.livenet ? 'livenet' : 'testnet'}`)
        .then(({ data }) => {
          let isDup = false; let lastValue = 0; let
            removeLevel = 'superEconomy';
          for (const item of data) {
            if (lastValue == item.feePerKb) {
              isDup = true;
              removeLevel = '';
            }

            if (!isDup && item.level != removeLevel) {
              result.unshift(calcTimeFee(item));
            }

            lastValue = item.feePerKb;
            isDup = false;
          }

          const now = new Date();
          now.setTime(now.getTime() + (60 * 1000));
          set(COOKIE_LEVEL_FEES, JSON.stringify(result), { expires: now });
          resolve(result);
        })
        .catch((error) => {
          console.log('getLevelFee:', error);
          resolve(false);
        });
    }
  })
}

export default { Bitcoin };
