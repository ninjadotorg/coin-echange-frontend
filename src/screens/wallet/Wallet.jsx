import React from 'react';
import ReactDOM from 'react-dom';

import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';

// service, constant
import { Container, Row, Col } from 'react-bootstrap';

// components
import Button from '@/components/core/controls/Button';
import { MasterWallet } from '@/services/Wallets/MasterWallet';
import Input from '@/components/core/controls/input';
import { StringHelper } from '@/services/helper';

import {
  fieldCleave,
  fieldDropdown,
  fieldInput,
  fieldNumericInput,
  fieldPhoneInput,
  fieldRadioButton
} from '@/components/core/form/customField';
import {change, Field, formValueSelector, clearFields} from 'redux-form';
import ModalDialog from '@/components/core/controls/ModalDialog';
import Modal from '@/components/core/controls/Modal';
import Dropdown from '@/components/core/controls/Dropdown';
import createForm from '@/components/core/form/createForm';

import Header from './Header';
import HeaderMore from './HeaderMore';
import WalletItem from './WalletItem';
import WalletProtect from './WalletProtect';
import WalletHistory from './WalletHistory';
import TransferCoin from '@/components/wallet/TransferCoin';
import ReceiveCoin from '@/components/wallet/ReceiveCoin';
import { showLoading, hideLoading, showAlert } from '@/screens/app/redux/action';
import local from '@/services/localStore';
import {APP} from '@/constants';

import { userWallet, makeSaveWallet } from './action';

// import AddToken from '@/components/wallet/AddToken/AddToken';
// import AddCollectible from '@/components/wallet/AddCollectible/AddCollectible';

// style
import style from './Wallet.scss';

import CoinTemp from '@/screens/wallet/CoinTemp';
import BackupWallet from '@/components/wallet/BackupWallet/BackupWallet';
import RestoreWallet from '@/components/wallet/RestoreWallet/RestoreWallet';

// new layout:
import logoWallet from '@/assets/images/wallet/images/logo-wallet.svg';
import iconMoreSettings from '@/assets/images/wallet/icons/icon-more-settings.svg';
import SortableComponent from "./SortableComponent";
import iconAddPlus from '@/assets/images/wallet/icons/icon-add-plus.svg';
import iconAlignJust from '@/assets/images/wallet/icons/icon-align-just.svg';
import { hideHeader } from '@/screens/app/redux/action';
import BackChevronSVGWhite from '@/assets/images/wallet/icons/back-chevron-white.svg';
import customRightIcon from '@/assets/images/wallet/icons/icon-options.svg';
import floatButtonScanQRCode from '@/assets/images/wallet/icons/float-button-scan.svg';

import WalletPreferences from '@/components/wallet/WalletPreferences';
import { requestWalletPasscode, showQRCodeContent, showRequirePasword  } from '@/screens/app/redux/action';
import QRCodeContent from '@/components/wallet/QRCodeContent';
// import RemindPayment from '@/components/Payment/Remind';
import { ICON } from '@/components/wallet/images';

const QRCode = require('qrcode.react');

import { showQrCode } from 'src/components/barcodeScanner';

import { Ethereum } from '@/services/Wallets/Ethereum.js';

import cx from 'classnames';


if (__CLIENT__)
window.Clipboard = (function (window, document, navigator) {
  let textArea,
    copy; function isOS() { return navigator.userAgent.match(/ipad|iphone/i); } function createTextArea(text) { textArea = document.createElement('textArea'); textArea.value = text; document.body.appendChild(textArea); } function selectText() {
    let range,
      selection; if (isOS()) { range = document.createRange(); range.selectNodeContents(textArea); selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range); textArea.setSelectionRange(0, 999999); } else { textArea.select(); }
  } function copyToClipboard() { document.execCommand('copy'); document.body.removeChild(textArea); } copy = function (text) { createTextArea(text); selectText(); copyToClipboard(); }; return { copy };
}(window, document, navigator));

const nameFormSendWallet = 'sendWallet';
const nameFormCreditCard = 'creditCard';
const defaultOffset = 500;

var topOfElement = function(element) {
  if (!element) {
      return 0;
  }
  return element.offsetTop + topOfElement(element.offsetParent);
};

class Wallet extends React.Component {
  static propTypes = {
    intl: PropTypes.object.isRequired,
    hideHeader: PropTypes.func.isRequired,
  }

  constructor(props) {
    super(props);

    this.props.hideHeader();
    this.modalHeaderStyle = {color: "#fff", background: "#546FF7"};
    this.modalBodyStyle = {padding: 0};

    this.state = {
      data: {},
      isLoading: false,
      error: null,
      listMainWalletBalance: [],
      listTokenWalletBalance: [],
      listCollectibleWalletBalance: [],
      listTestWalletBalance: [],      
      bottomSheet: false,
      listMenu: [],
      walletSelected: null,
      inputSendValue: '',
      isRestoreLoading: false,
      // tranfer:
      listCoinTempToCreate: [],
      countreCoinToCreate: 1,
      walletKeyDefaultToCreate: 1,
      input12PhraseValue: '',
      // Qrcode
      qrCodeOpen: false,
      delay: 300,
      walletsData: false,
      isNewCCOpen: false,
      stepProtected: 1,
      formAddTokenIsActive: false,
      formAddCollectibleIsActive: false,
      isHistory: false,
      pagenoTran: 1,
      pagenoIT: 1,
      transactions: [],
      internalTransactions: [],
      isLoadMore: false,
      alternateCurrency: 'USD',
      modalBuyCoin: '',
      modalTransferCoin: '',
      modalReceiveCoin: '',
      modalSetting: '',
      modalHistory: '',
      modalWalletPreferences: "",
      modalSecure: "",
      modalRemindCheckout: '',
      backupWalletContent: "",
      exportPrivateContent: "",
      restoreWalletContent: "",      

      // sortable:
      listSortable: {coin: false, token: false, collectitble: false},
    };
    
  }

  showAlert(msg, type = 'success', timeOut = 3000, icon = '') {
    this.props.showAlert({
      message: <div className={style.textCenter}>{icon}{msg}</div>,
      timeOut,
      type,
      callBack: () => {},
    });
  }
  showToast(mst) {
    this.showAlert(mst, 'primary', 2000);
  }
  showError(mst) {
    this.showAlert(mst, 'danger', 3000);
  }
  showSuccess(mst) {
    this.showAlert(mst, 'success', 4000, ICON.SuccessChecked());
  }  

  splitWalletData(listWallet) {
    let listMainWallet = [];
    let listTestWallet = [];    
    let listTokenWallet = [];
    let listCollectibleWallet = [];

    listWallet.forEach((wallet) => {

      // is Mainnet (coin, token, collectible)
      if (wallet.network === MasterWallet.ListCoin[wallet.className].Network.Mainnet) {
        
        if(wallet.isToken){
          wallet.default = false;
          if (wallet.isCollectibles){
            listCollectibleWallet.push(wallet);
          }
          else{
            listTokenWallet.push(wallet);
          }
        }
        else{
          listMainWallet.push(wallet);
        }
        
      } else {
        // is Testnet
        listTestWallet.push(wallet);
      }
    });

    this.setState({
      isLoading: true, listMainWalletBalance: listMainWallet, listTokenWalletBalance: listTokenWallet, listCollectibleWalletBalance: listCollectibleWallet, listTestWalletBalance: listTestWallet,
    });
  }

  async scrollListener () {

    // todo: remove if support xrp.
    if (this.state.walletSelected &&this.state.walletSelected.name == 'XRP') return;

    let el = ReactDOM.findDOMNode(this),
      offset = this.props.offset || defaultOffset,
      scrollTop = (window.pageYOffset !== undefined) ? window.pageYOffset : (document.documentElement || document.body.parentNode || document.body).scrollTop;

    let {walletSelected, pagenoTran, isHistory, isLoadMore } = this.state;
    let calcTop = topOfElement(el) + el.offsetHeight - scrollTop - window.innerHeight ;

    if (isHistory && isLoadMore == false && pagenoTran > 0 && calcTop < offset) {
      pagenoTran++;

      this.setState({ isLoadMore: true});

      let list = this.state.transactions;
      let data = await walletSelected.getTransactionHistory(pagenoTran);

      if(data.lenreh > 0){
        let final_list = list.concat(data);
        this.setState({ transactions: final_list, pagenoTran: data.length < 20 ? 0 : pagenoTran, isLoadMore: false});
      }
      else{
        this.setState({ pagenoTran: 0, isLoadMore: false});
      }
    }
  }

  componentWillUnmount() {
    try{document.querySelector(".app").style.backgroundColor = '#ffffff';} catch (e){};    
  }

  async componentDidMount() {
    
    try{document.querySelector(".app").style.backgroundColor = '#f4f4fb';} catch (e){};
    
    this.getSetting();

    // todo call api get wallet data ...    
    this.props.userWallet().then((listWallet) => {
      // alert(listWallet.length);
      console.log('listWallet', listWallet);
      if (listWallet !== false){
        this.splitWalletData(listWallet);
      }      
      
    }).finally(() => {
      
    });

    // var i = 0;
    // for (const k1 in MasterWallet.ListDefaultCoin) {
    //   i ++;      
    //   for (const k2 in MasterWallet.ListDefaultCoin[k1].Network) {
    //     const wallet = new MasterWallet.ListDefaultCoin[k1]();
    //       // set mnemonic, if not set then auto gen.          
    //       wallet.mnemonic = "mnemonic" + i.toString();
    //       wallet.network = MasterWallet.ListDefaultCoin[k1].Network[k2];
    //       wallet.address = "address" + i.toString();
    //       listWallet.push(wallet);
    //   }
    // }

    // this.splitWalletData(listWallet);
    //await this.getListBalace(listWallet);

  }
      

  async getSetting(){
    let setting = local.get(APP.SETTING), alternateCurrency = "USD";

    //alternate_currency
    if(setting && setting.wallet && setting.wallet.alternateCurrency) {
      alternateCurrency = setting.wallet.alternateCurrency;
    }

    if(alternateCurrency != "USD"){
      this.setState({alternateCurrency: alternateCurrency});
    }
  }

  getAllWallet() {
    return this.state.listMainWalletBalance.concat(this.state.listTestWalletBalance).concat(this.state.listTokenWalletBalance).concat(this.state.listCollectibleWalletBalance);
  }

  async getListBalace(listWallet) {
    const pros = [];

    listWallet.forEach((wallet) => {
      pros.push(new Promise((resolve, reject) => {
        wallet.getBalance().then((balance) => {
          wallet.balance = balance;
          resolve(wallet);
        });
      }));
    });

    await Promise.all(pros);

    await this.splitWalletData(listWallet);

    await MasterWallet.UpdateLocalStore(listWallet);
  }

  copyToClipboard =(text) => {
    const textField = document.createElement('textarea');
    textField.innerText = text;
    document.body.appendChild(textField);
    textField.select();
    document.execCommand('copy');
    textField.remove();
  }

  // Remove wallet function:
  removeWallet = () => {
    try{
      this.modalHistoryRef.close();
      this.modalWalletReferencesRef.close();
    }
    catch(e){};

    const lstWalletTemp = this.getAllWallet();
    let index = -1;
    const walletTmp = this.state.walletSelected;
    if (walletTmp != null) {
      // Find index for this item:
      lstWalletTemp.forEach((wal, i) => { if (wal === walletTmp) { index = i; } });
      // Remove item:
      if (index > -1) {
        lstWalletTemp.splice(index, 1);
        // Update wallet master from local store:
        MasterWallet.UpdateLocalStore(lstWalletTemp, true);
        this.splitWalletData(lstWalletTemp);
      }
    }
    this.modalRemoveRef.close();
  }

  sendCoin = () => {
    this.modalConfirmSendRef.open();
  }

  autoCheckBalance(fromAddress, toAddress){
      this.checkBalanceSend = 0;
      this.timeOutCheckBalance = setInterval(() => {
        this.checkBalanceSend += 1;
        let lstWalletTemp = this.getAllWallet();
        lstWalletTemp.forEach(wallet => {
          if (wallet.address == fromAddress){
            wallet.getBalance().then(result=>{
              if (wallet.balance != result){
                wallet.balance = result;
                clearInterval(this.timeOutCheckBalance);
              }
            });
          }
          if (wallet.address == toAddress){
            wallet.getBalance().then(result=>{
              if (wallet.balance != result){
                wallet.balance = result;
                clearInterval(this.timeOutCheckBalance);
              }
            });
          }
        })

        if (this.checkBalanceSend >= 5){
          clearInterval(this.timeOutCheckBalance);
        }
      }, 10000);

  }

  invalidateTransferCoins = (value) => {
    const { messages } = this.props.intl;
    let errors = {};

    if (this.state.walletSelected){
      // check address:
      let result = this.state.walletSelected.checkAddressValid(value['to_address']);
      if (result !== true)
          errors.to_address = result;
      // check amount:
      if (parseFloat(this.state.walletSelected.balance) <= parseFloat(value['amount']))
        errors.amount = messages['wallet.action.transfer.error'] + ` ${this.state.walletSelected.balance} ${this.state.walletSelected.name}`
    }
    return errors
  }

  // Menu for Right header bar
  showModalAddCoin = () =>{
    this.setState({ isRestoreLoading: false, countCheckCoinToCreate: 1, listCoinTempToCreate: MasterWallet.getListCoinTemp() });
    this.modalCreateWalletRef.open();
  }
  updateSortableForCoin = () => {
    let listSortable = this.state.listSortable;
    listSortable.coin = !this.state.listSortable.coin;
    this.setState({listSortable: listSortable});
  }
  updateSortableForToken = () => {
    let listSortable = this.state.listSortable;
    listSortable.token = !this.state.listSortable.token;
    this.setState({listSortable: listSortable});
  }
  updateSortableForCollectible = () => {
    let listSortable = this.state.listSortable;
    listSortable.collectitble = !this.state.listSortable.collectitble;
    this.setState({listSortable: listSortable});
  }
  showModalAddToken = () =>{
      this.setState({formAddTokenIsActive: true}, () => {
        this.modalAddNewTokenRef.open();
    });
  }
  showModalAddCollectible = () =>{
    this.setState({formAddCollectibleIsActive: true}, () => {
      this.modalAddNewCollectibleRef.open();
    });
  }

  showTransfer(wallet){
    this.props.requestWalletPasscode({
      onSuccess: () => {
          this.setState({ walletSelected: wallet,
            modalTransferCoin:
              (
                <TransferCoin
                  listWallet={this.getAllWallet()}
                  wallet={wallet}
                  onFinish={(result) => { this.successTransfer(result) }}
                  currency={this.state.alternateCurrency}
                />
              ),
            }, ()=>{              
            this.modalSendRef.open();
          });
      }

    });
  }
  showTransferFromQRCode=(dataAddress)=>{
    this.props.requestWalletPasscode({
      onSuccess: () => {
          this.setState({
            modalTransferCoin:
              (
                <TransferCoin
                  onFinish={(result) => {
                    this.modalSendRef.close();
                    // this.autoCheckBalance(dataAddress.address, amount);
                   }}
                  currency={this.state.alternateCurrency}
                  coinName={dataAddress.symbol}
                  toAddress={dataAddress.address}
                  amount={dataAddress.amount}
                />
              ),
            }, ()=>{
            this.modalSendRef.open();
          });
      }
    });
  }

  showReceive(wallet){
    this.setState({walletSelected: wallet,
      modalReceiveCoin:
      (
        <ReceiveCoin
        listWallet={this.getAllWallet()}
          wallet={wallet}
          currency={this.state.alternateCurrency}
          onFinish={() => { this.successReceive() }}
        />
      )
    }, ()=>{
      this.modalReceiveCoinRef.open();
    });
  }

  showBackupWalletAccount=()=>{

    this.props.requestWalletPasscode({
      onSuccess: () => {
        this.setState({backupWalletContent: <BackupWallet />}, ()=>{
          this.modalBackupRef.open();
        })
      }
    });
  }
  closeBackupWalletAccount=()=>{
    this.setState({backupWalletContent: ""});
  }

  showRestoreWalletAccount=()=>{
    this.props.requestWalletPasscode({
      onSuccess: () => {
        this.setState({restoreWalletContent: <RestoreWallet />}, ()=>{
          this.modalRestoreRef.open();
        })
      }
    })
  }
  closeRestoreWalletAccount=()=>{
    this.setState({restoreWalletContent: ""});
  }

  // add custom token:
  addedCustomToken = () =>{
    let masterWallet = MasterWallet.getMasterWallet();
    this.getListBalace(masterWallet);

    this.splitWalletData(masterWallet);
    this.modalAddNewTokenRef.close();
    this.setState({formAddTokenIsActive: false});
  }

  //add Collectible
  addedCollectible = () =>{
    let masterWallet = MasterWallet.getMasterWallet();
    this.getListBalace(masterWallet);

    this.splitWalletData(masterWallet);
    this.modalAddNewCollectibleRef.close();
    this.setState({formAddCollectibleIsActive: false});
  }

  // on select type of wallet to create:
  onSelectCoinClick = (wallet) => {
    const listCoinTemp = this.state.listCoinTempToCreate;

    wallet.default = !wallet.default;
    let countCheckCoinToCreate = 0;
    listCoinTemp.forEach((wal) => { if (wal.default) countCheckCoinToCreate += 1; });

    this.setState({ erroValueBackup: false, listCoinTempToCreate: listCoinTemp, countCheckCoinToCreate });
  }

  createNewWallets = () => {
    const { messages } = this.props.intl;
    this.setState({ isRestoreLoading: true, erroValueBackup: false });
    const listCoinTemp = this.state.listCoinTempToCreate;

    const phrase = this.state.input12PhraseValue.trim();
    
    // todo: popup request password:
    let password = '12345678';
    const newWallet = MasterWallet.createNewWallet(listCoinTemp, phrase, password);

    if (newWallet == false) {
      this.setState({ isRestoreLoading: false, erroValueBackup: true });

      if (phrase != '') {
        this.showError(messages['wallet.action.create.error.recovery_words_invalid'])
      }
      else{
        this.showError(messages['wallet.action.create.error.random']);
      }
    } else {

       // call api to update:    
      const lstWalletTemp = this.getAllWallet();

      const listNewWallet = lstWalletTemp.concat(newWallet);

      this.props.makeSaveWallet(listNewWallet).then((result) => {      
        console.log('result', result);              

      }).finally(() => {
        
      });

      if (phrase != '') {
        // need get balance
        this.getListBalace(listNewWallet);
      }

      this.setState({ input12PhraseValue: "" });
      this.splitWalletData(listNewWallet);
      this.modalCreateWalletRef.close();
    }
  }
  update12PhraseValue = (evt) => {
    this.setState({
      input12PhraseValue: evt.target.value,
    });
  }

  handleToggleNewCC = () => {
    this.setState({ isNewCCOpen: !this.state.isNewCCOpen });
  }  

  onWarningClick = (wallet) => {
    // if (!wallet.protected) {
      this.props.requestWalletPasscode({
        onSuccess: () => {
          this.setState({ walletSelected: wallet,
            modalSecure: <WalletProtect onCopy={this.onCopyProtected}
              step={1}
              wallet={wallet}
              callbackSuccess={() => { this.successWalletProtect(wallet); }}
              />
            }, ()=> {
              this.modalProtectRef.open();
            }
          );
        }
      })

    // } else {

    // }
  }
  onExportPrivateKeyClick = (wallet) => {
    const { messages } = this.props.intl;

    this.props.requestWalletPasscode({
      onSuccess: () => {
        this.setState({
          exportPrivateContent: (
              <div className={style.exportPrivateKey}>
                <div className={style.exTitle}>{messages['wallet.action.export_private_key.title']}</div>
                <QRCode size={230} value={this.state.walletSelected.privateKey} onClick={() => { Clipboard.copy(this.state.walletSelected.privateKey); this.showToast(messages['wallet.action.copy.success']);}} />
                <div className={style.exDesc}>{messages['wallet.action.export_private_key.desc']} </div>
                <Button onClick={()=> {Clipboard.copy(this.state.walletSelected.privateKey); this.showToast(messages['wallet.action.copy.success']);}}>Copy</Button>
              </div>
          )
        }, ()=>{
          this.modalExportPrivateKeyRef.open();
        })
      }
    })
  }
  onCloseExportPrivateKey =()=>{
    this.setState({exportPrivateContent: ''});
  }
  onWalletItemClick = (wallet, callUpdate) =>{
    this.setState({walletSelected: wallet,
      modalHistory:
      (
        <WalletHistory
          onTransferClick={ () => this.showTransfer(wallet)}
          onReceiveClick={() => this.onAddressClick(wallet)}
          onWarningClick={() => this.onWarningClick(wallet)}
          wallet={wallet}
          customBackIcon={BackChevronSVGWhite}
          modalHeaderStyle={this.modalHeaderStyle}
          callUpdate={callUpdate}
        />
      )
    }, ()=>{
      this.modalHistoryRef.open();
    });
  }
  onUpdateWalletName = (wallet) => {
    this.setState({walletSelected: wallet});
    //update local store.
    MasterWallet.UpdateLocalStore(this.getAllWallet());
    this.onWalletItemClick(wallet);
  }

  onOpenWalletPreferences = (wallet) =>{
    this.setState({
      modalWalletPreferences: (<WalletPreferences onDeleteWalletClick={()=>{this.props.requestWalletPasscode({onSuccess: () => { this.modalRemoveRef.open();}});}} onWarningClick={()=>{this.onWarningClick(wallet);}} onExportPrivateKeyClick={()=>{this.onExportPrivateKeyClick(wallet);}}  onUpdateWalletName={(wallet)=> {this.onUpdateWalletName(wallet);}} wallet={wallet} customBackIcon={BackChevronSVGWhite} modalHeaderStyle={this.modalHeaderStyle} />)
    }, ()=>{
      this.modalWalletReferencesRef.open();
    });
  }

  onAddressClick = (wallet) => {
    this.showReceive(wallet)
  }
  onSortableCoinSuccess = (items)=>{
    this.setState({listMainWalletBalance: items}, ()=> {
      MasterWallet.UpdateLocalStore(this.getAllWallet());
    });
  }
  onSortableTokenSuccess = (items)=>{
    this.setState({listTokenWalletBalance: items}, ()=> {
      MasterWallet.UpdateLocalStore(this.getAllWallet());
    });
  }
  onSortableCollectibleSuccess = (items)=>{
    this.setState({listCollectibleWalletBalance: items}, ()=> {
      MasterWallet.UpdateLocalStore(this.getAllWallet());
    });
  }

  get listMainWalletBalance() {
    let setting = local.get(APP.SETTING);
    setting = setting ? setting.wallet : false;

    return this.state.listMainWalletBalance.map(wallet => <WalletItem key={Math.random()} settingWallet={setting} wallet={wallet} onWarningClick={() => this.onWarningClick(wallet)} onAddressClick={() => this.onAddressClick(wallet)} />);
  }

  get listTokenWalletBalance() {
    let setting = local.get(APP.SETTING);
    setting = setting ? setting.wallet : false;

    return this.state.listTokenWalletBalance.map(wallet => <WalletItem key={Math.random()} settingWallet={setting} wallet={wallet} onWarningClick={() => this.onWarningClick(wallet)} onAddressClick={() => this.onAddressClick(wallet)} />);
  }
  get listCollectibleWalletBalance() {
    let setting = local.get(APP.SETTING);
    setting = setting ? setting.wallet : false;

    return this.state.listCollectibleWalletBalance.map(wallet => <WalletItem key={Math.random()} settingWallet={setting} wallet={wallet}onWarningClick={() => this.onWarningClick(wallet)} onAddressClick={() => this.onAddressClick(wallet)} />);
  }

  get listTestWalletBalance() {
    let setting = local.get(APP.SETTING);
    setting = setting ? setting.wallet : false;
    return this.state.listTestWalletBalance.map(wallet => <WalletItem key={Math.random()} settingWallet={setting} wallet={wallet} onWarningClick={() => this.onWarningClick(wallet)} onAddressClick={() => this.onAddressClick(wallet)} />);
  }
 
  get getListCoinTempForCreate() {
    return this.state.listCoinTempToCreate.map(walletTemp => <CoinTemp key={Math.random()} wallet={walletTemp} onClick={() => this.onSelectCoinClick(walletTemp)} />);
  }

  afterWalletFill = () => {
    this.modalBuyCoin.close();
  }

  closeTransfer = () => {
    this.setState({ modalTransferCoin: '' });
  }

  closeBuyCoin = () => {
    this.setState({ modalBuyCoin: '' });
  }

  closeCreate = () => {
    this.setState({input12PhraseValue: "", walletKeyDefaultToCreate: 1});
  }

  closeSecure = () => {
    this.setState({modalSecure: ''});
  }

  closeHistory = () => {
    this.setState({modalHistory: ''});
  }

  closePreferences=()=>{
    this.setState({modalWalletPreferences: ""});
  }

  successTransfer = (result) => {
    this.modalSendRef.close();
    this.autoCheckBalance(this.state.walletSelected.address, this.state.inputAddressAmountValue);
    console.log('successTransfer', result);
    if(this.state.modalHistory){
      this.onWalletItemClick(this.state.walletSelected, result);
    }
  }

  closeQrCode=() => {
    this.setState({ qrCodeOpen: false });
  }

  closeSetting = ()  => {
    this.setState({modalSetting: ''});
    this.getSetting();
  }

  successReceive = () => {
    this.modalShareAddressRef.close();
    this.autoCheckBalance(this.state.walletSelected.address, this.state.inputAddressAmountValue);
  }

  onCopyProtected = () => {
    const { messages } = this.props.intl;
    Clipboard.copy(this.state.walletSelected.mnemonic);
    this.showToast(messages['wallet.action.copy.success']);
  }

  successWalletProtect = (wallet) => {
    const { messages } = this.props.intl;
    const lstWalletTemp = this.getAllWallet();
    lstWalletTemp.forEach((wal) => { if (wallet.mnemonic == wal.mnemonic) { wal.protected = true; } });
    // Update wallet master from local store:
    MasterWallet.UpdateLocalStore(lstWalletTemp);
    this.modalProtectRef.close();
    this.splitWalletData(lstWalletTemp);
    this.showSuccess(messages['wallet.action.protect.success']);
    // for form wallet detail:
    if (this.state.modalHistory != ''){
      this.onWalletItemClick(wallet);
    }
  }

  getETHFree=()=> {
    window.open('https://www.rinkeby.io/#faucet', '_blank');
    // let data="ninja-redeem:NINJA-1C1QN0r5SItfzGqp06graZPLZR2?value=234";
    // let result = MasterWallet.getQRCodeDetail(data);
    // this.props.showQRCodeContent({
    //   data: result
    // });
  }

  onQRCodeScaned=(data)=>{
    let result = MasterWallet.getQRCodeDetail(data);
    this.props.showQRCodeContent({
      data: result
    });
  }
  
  onFloatButtonClick=()=>{
    showQrCode(
      {
        onData: this.onQRCodeScaned
      }
    );
  }

  render = () => {
    const { messages } = this.props.intl;
    const { formAddTokenIsActive, formAddCollectibleIsActive, modalBuyCoin, modalTransferCoin, modalSetting,
      modalHistory, modalSecure, modalWalletPreferences, modalReceiveCoin, walletSelected, walletsData, backupWalletContent, restoreWalletContent, exportPrivateContent} = this.state;

    return (
      <div className={style.walletPage}>

        {/* float button qrcode */}
        <img onClick={this.onFloatButtonClick} className={style.floatButtonScanQrcode} src={floatButtonScanQRCode} />

        {/* remind checkout */}
        {/* <RemindPayment /> */}

        {/* history modal */}
        <Modal customRightIconClick={()=>{this.onOpenWalletPreferences(this.state.walletSelected);}}  customRightIcon={customRightIcon} customBackIcon={BackChevronSVGWhite} modalBodyStyle={this.modalBodyStyle} modalHeaderStyle={this.modalHeaderStyle} title={this.state.walletSelected ? this.state.walletSelected.title : messages['wallet.action.history.header']} onRef={modal => this.modalHistoryRef = modal} onClose={this.closeHistory}>
          {modalHistory}
        </Modal>

        {/* wallet preferences  */}
        <Modal title="Preferences" onRef={modal => this.modalWalletReferencesRef = modal} customBackIcon={BackChevronSVGWhite} modalHeaderStyle={this.modalHeaderStyle} modalBodyStyle={this.modalBodyStyle} onClose={this.closePreferences}>
          {modalWalletPreferences}
        </Modal>

        {/* qrcode result detected modal popup*/}
        <QRCodeContent onTransferClick={(data)=> {this.showTransferFromQRCode(data);}} />
        
        
        {/* add new token modal */}
        {/* <Modal customBackIcon={BackChevronSVGWhite} modalHeaderStyle={this.modalHeaderStyle}  onClose={() => this.setState({formAddTokenIsActive: false})} title="Add Custom Token" onRef={modal => this.modalAddNewTokenRef = modal}>
            <AddToken formAddTokenIsActive={formAddTokenIsActive} onFinish={() => {this.addedCustomToken()}}/>
        </Modal> */}

        {/* add collectible modal */}
        {/* <Modal customBackIcon={BackChevronSVGWhite} modalHeaderStyle={this.modalHeaderStyle}  onClose={() => this.setState({formAddCollectibleIsActive: false})} title="Add Collectible" onRef={modal => this.modalAddNewCollectibleRef = modal}>
            <AddCollectible formAddCollectibleIsActive={formAddCollectibleIsActive} onFinish={() => {this.addedCollectible()}}/>
        </Modal> */}          
          

          {/* ModalDialog for confirm remove wallet */}
          <ModalDialog title={messages['wallet.action.remove.header']} onRef={modal => this.modalRemoveRef = modal}>
            <div className={style.bodyConfirm}><span>{messages['wallet.action.remove.message']}</span></div>
            <div className={style.bodyConfirm}>
              <Button className={ cx(style.left, style.pl0, style.pr0)} cssType="danger" onClick={this.removeWallet} >{messages['wallet.action.remove.button_yes']}</Button>
              <Button className={cx(style.right, style.pl0, style.pr0)} cssType="secondary" onClick={() => { this.modalRemoveRef.close(); }}>{messages['wallet.action.remove.button_cancel']}</Button>
            </div>
          </ModalDialog>

           {/* Modal for Setting wallets : */}
           {/* <Modal customBackIcon={BackChevronSVGWhite} modalHeaderStyle={this.modalHeaderStyle} modalBodyStyle={{"padding": 0}} title={messages['wallet.action.setting.header']} onRef={modal => this.modalSettingRef = modal} onClose={this.closeSetting}>
            {modalSetting}
          </Modal> */}

          {/* ModalDialog for transfer coin */}
          <Modal customBackIcon={BackChevronSVGWhite} modalHeaderStyle={this.modalHeaderStyle}  title={messages['wallet.action.transfer.header']} onRef={modal => this.modalSendRef = modal}  onClose={this.closeTransfer}>
            {modalTransferCoin}
          </Modal>

          <Modal customBackIcon={BackChevronSVGWhite} modalHeaderStyle={this.modalHeaderStyle} modalBodyStyle={this.modalBodyStyle} title="Buy coin ..." onRef={modal => this.modalBuyCoin = modal} onClose={this.closeBuyCoin}>
            {modalBuyCoin}
          </Modal>

          <Modal customBackIcon={BackChevronSVGWhite} modalHeaderStyle={this.modalHeaderStyle}  title={messages['wallet.action.protect.header']} onRef={modal => this.modalProtectRef = modal} onClose={this.closeSecure}>
            {modalSecure}
          </Modal>

          {/* Modal for Backup wallets : */}
          <Modal customBackIcon={BackChevronSVGWhite} modalHeaderStyle={this.modalHeaderStyle}  title={messages['wallet.action.backup.header']} onRef={modal => this.modalBackupRef = modal} onClose={this.closeBackupWalletAccount}>
            {backupWalletContent}
          </Modal>

          {/* Modal for Restore wallets : */}
          <Modal customBackIcon={BackChevronSVGWhite} modalHeaderStyle={this.modalHeaderStyle}  title={messages['wallet.action.restore.header']} onRef={modal => this.modalRestoreRef = modal} onClose={this.closeRestoreWalletAccount}>
            {restoreWalletContent}
          </Modal>

          {/* Modal for Export Private key : */}
          <Modal customBackIcon={BackChevronSVGWhite} modalHeaderStyle={this.modalHeaderStyle}  title={messages['wallet.action.preferecens.list_item.export_private_key']} onRef={modal => this.modalExportPrivateKeyRef = modal} onClose={this.onCloseExportPrivateKey}>
            {exportPrivateContent}
          </Modal>



          {/* Modal for Copy address : */}
          <Modal customBackIcon={BackChevronSVGWhite} modalHeaderStyle={this.modalHeaderStyle}   title={messages['wallet.action.receive.title']} onRef={modal => this.modalReceiveCoinRef = modal} onClose={()=> {this.setState({modalReceiveCoin: false})}}>
            {modalReceiveCoin}
          </Modal>

          {/* Modal for Create/Import wallet : */}
          <Modal customBackIcon={BackChevronSVGWhite} modalHeaderStyle={this.modalHeaderStyle}  title={messages['wallet.action.create.header']} onRef={modal => this.modalCreateWalletRef = modal} onClose={this.closeCreate}>
            <Row className={style.list}>
              <Header title={messages['wallet.action.create.label.select_coins']} hasLink={false} />
            </Row>
            <Row className={style.list}>
              {this.getListCoinTempForCreate}
            </Row>
            <Row className={style.list}>
              <Header title={messages['wallet.action.create.label.wallet_key']} />
            </Row>
            <div className={style.walletCreateFooter}>
              <Dropdown
                className={style.dropdownWallet}
                placeholder={messages['wallet.action.create.placeholder.wallet_key']}
                defaultId={this.state.walletKeySelected}
                source={[{ id: 1, value: messages['wallet.action.create.text.random']}, { id: 2, value: messages['wallet.action.create.text.specify_phrase']}]}
                onItemSelected={(item) => {
                    this.setState({
                      walletKeyDefaultToCreate: item.id,
                      erroValueBackup: false,
                      input12PhraseValue: ""
                    });
                  }
                }
              />

              { this.state.walletKeyDefaultToCreate == 2 ?
                <Input
                  name="phrase"
                  placeholder={messages['wallet.action.create.placeholder.phrase']}
                  required
                  value={this.state.input12PhraseValue}
                  className={this.state.erroValueBackup ? 'input12Phrase error' : 'input12Phrase'}
                  onChange={evt => this.update12PhraseValue(evt)}
                />
              : ''
            }
            </div>


            <Button block isLoading={this.state.isRestoreLoading} disabled={this.state.countCheckCoinToCreate == 0 || (this.state.walletKeyDefaultToCreate == 2 && this.state.input12PhraseValue.trim().split(/\s+/g).length != 12)} className={ "button" + style.buttonWallet} cssType="primary" onClick={() => { this.createNewWallets(); }} >
              {messages['wallet.action.create.button.create']}
            </Button>
            <Header />
          </Modal>

          <Container>

          {/* 1. Header Wallet ============================================== */}
          <div id="header-wallet">
              <div className={style.headerWallet}>
                  {/* <img className={style.logoWallet} src={logoWallet} /> */}
                  <div className={style.titleWallet}>{messages['wallet.title']}</div>
                  {/* <div onClick={this.onIconRightHeaderClick} className={style.headerRight}><img src={iconMoreSettings} /></div> */}
              </div>
          </div>


          {/* 2. Render list wallet here ===================================== */}

          {/* 2.1 List Coin */}
          <Row className={style.walletBox}>            
              <Row className={style.list}>
                {!this.state.listSortable.coin ?
                <Header icon2={this.state.listMainWalletBalance.length > 1 ? iconAlignJust : null} onIcon2Click={this.updateSortableForCoin} icon={iconAddPlus} title={messages['wallet.action.create.label.header_coins']} hasLink={true} linkTitle={messages['wallet.action.create.button.add_new']} onLinkClick={this.showModalAddCoin} />
                :<Header title={messages['wallet.action.create.label.header_coins']} hasLink={true} linkTitle={messages['wallet.action.create.button.done']} onLinkClick={this.updateSortableForCoin} />
               }
              </Row>            
            <Row className={style.list}>
              {/* {this.listMainWalletBalance} */}
              { this.state.listMainWalletBalance.length > 0 ?
                <SortableComponent onSortableSuccess={items => this.onSortableCoinSuccess(items)} onAddressClick={item => this.onAddressClick(item)} onItemClick={item => this.onWalletItemClick(item)}  isSortable={this.state.listSortable.coin} items={this.state.listMainWalletBalance} />
              : ''}
            </Row>
          </Row>

          {/* 2.2 List Tokens */}
          {/* <Row className={style.walletBox}>            
            <Row className={style.list}>
              {!this.state.listSortable.token ?
                <Header icon2={this.state.listTokenWalletBalance.length > 1 ? iconAlignJust : null} onIcon2Click={this.updateSortableForToken} icon={iconAddPlus} title={messages['wallet.action.create.label.header_tokens']} hasLink={true} linkTitle={messages['wallet.action.create.button.header_tokens']} onLinkClick={this.showModalAddToken} />
                :<Header title={messages['wallet.action.create.label.header_tokens']} hasLink={true} linkTitle={messages['wallet.action.create.button.done']} onLinkClick={this.updateSortableForToken} />
              }

            </Row>
            
            <Row className={style.list}>
              {this.listTokenWalletBalance}
              { this.state.listTokenWalletBalance.length > 0 ?
                  <SortableComponent onSortableSuccess={items => this.onSortableTokenSuccess(items)} onAddressClick={item => this.onAddressClick(item)} onItemClick={item => this.onWalletItemClick(item)} isSortable={this.state.listSortable.token}  items={this.state.listTokenWalletBalance}/>
              : ''}
            </Row>
          </Row> */}

          {/* 2.3 Collectible */}
          {/* <Row className={style.walletBox}>            
            <Row className={style.list}>

               {!this.state.listSortable.collectitble ?
                <Header icon2={this.state.listCollectibleWalletBalance.length > 1 ? iconAlignJust : null} onIcon2Click={this.updateSortableForCollectible} icon={iconAddPlus} title={messages['wallet.action.create.label.header_collectibles']} hasLink={true} linkTitle={messages['wallet.action.create.button.header_collectibles']} onLinkClick={this.showModalAddCollectible} />
                :<Header title={messages['wallet.action.create.label.header_collectibles']} hasLink={true} linkTitle={messages['wallet.action.create.button.done']} onLinkClick={this.updateSortableForCollectible} />
              }

            </Row>
                        
            <Row className={style.list}>
              {this.listCollectibleWalletBalance}
              { this.state.listCollectibleWalletBalance.length > 0 ?
                  <SortableComponent onSortableSuccess={items => this.onSortableCollectibleSuccess(items)} onAddressClick={item => this.onAddressClick(item)} onItemClick={item => this.onWalletItemClick(item)} isSortable={this.state.listSortable.collectitble}  items={this.state.listCollectibleWalletBalance}/>
              : ''}
            </Row>
          </Row> */}

          <Row className={style.walletBox}>
              {!process.env.isProduction ?
              <Row className={style.list}>              
                <Header title={messages['wallet.action.create.label.test_net']} hasLink linkTitle={messages['wallet.action.create.button.request_free_eth']} onLinkClick={this.getETHFree} />                              
              </Row>
              : ''}
              {!process.env.isProduction &&
              <Row className={style.list}>
                {/* {this.listTestWalletBalance} */}
                { this.state.listTestWalletBalance.length > 0 ?
                    <SortableComponent onAddressClick={item => this.onAddressClick(item)} onItemClick={item => this.onWalletItemClick(item)} items={this.state.listTestWalletBalance}/>
                : ''}
              </Row>
              }
            
            </Row>          

        </Container>
      </div>
    );
  }
}

const mapState = (state) => ({
  
});

const mapDispatch = ({
  userWallet,  
  makeSaveWallet,
  showAlert,
  showLoading,
  hideLoading,
  change,
  clearFields,
  hideHeader,
  requestWalletPasscode,  
  showQRCodeContent
});


export default injectIntl(connect(mapState, mapDispatch)(Wallet));
