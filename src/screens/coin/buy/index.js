import React from 'react';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';
import { Field, formValueSelector } from 'redux-form';
import { connect } from 'react-redux';
import createForm from 'src/components/core/form/createForm';
import { isRequired } from 'src/components/core/form/validator';
import { bindActionCreators } from 'redux';
import { PAYMENT_METHOD } from 'src/screens/coin/constant';
import { DEFAULT_CURRENCY } from 'src/resources/constants/crypto';
import ConfirmButton from 'src/components/confirmButton';
import inputField from 'src/components/core/form/fields/input';
import { showAlert } from 'src/screens/app/redux/action';
import { FaLock } from 'react-icons/fa';
import cx from 'classnames';
import BankTransferInfo from './components/bankTransferInfo';
import walletSelectorField, { walletValidator } from './reduxFormFields/walletSelector';
import exchangeField, { exchangeValidator } from './reduxFormFields/exchange';
import paymentMethodField from './reduxFormFields/paymentMethod';
import { makeOrder } from './redux/action';
import styles from './styles.scss';

const buyFormName = 'BuyForm';
const BuyForm = createForm({
  propsReduxForm: {
    form: buyFormName,
    initialValues: {
      paymentMethod: PAYMENT_METHOD.TRANSFER,
      wallet: {
        address: '',
        currency: DEFAULT_CURRENCY
      }
    },
  },
});
const formSelector = formValueSelector(buyFormName);

class BuyCryptoCoin extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      orderInfo: null,
    };
  }

  componentDidMount() {
  }

  isValidToSubmit = () => {
    const { wallet: { address, currency }, exchange: { amount, fiatAmount }, paymentMethod } = this.props;
    if (address && currency && amount && fiatAmount) {
      if (paymentMethod === PAYMENT_METHOD.COD) {
        const { userAddress, userPhone, userNote } = this.props;
        if (userAddress && userPhone && userNote) {
          return true;
        }
      } else {
        return true;
      }
    }
    return false;
  }

  makeOrder = () => {
    const { makeOrder, wallet, exchange, paymentMethod, userAddress, userPhone, userNote } = this.props;
    const payload = {
      amount: String(exchange?.amount),
      currency: exchange?.currency,
      fiat_local_amount: String(exchange?.fiatAmount),
      fiat_local_currency: exchange?.fiatCurrency,
      order_type: paymentMethod,
      direction: 'buy',
      address: wallet?.address,
    };
    if (paymentMethod === PAYMENT_METHOD.COD) {
      payload.user_info = { userAddress, userPhone, userNote };
    }
    makeOrder(payload)
      .then(this.orderSuccessHandler)
      .catch(this.orderFailedHandler);
  }

  orderSuccessHandler = (orderInfo) => {
    this.setState({ orderInfo });
    const { showAlert } = this.props;
    showAlert({
      message: 'Successful',
      timeOut: 1000,
    });
  }

  orderFailedHandler = () => {
    const { showAlert } = this.props;
    showAlert({
      message: 'Error',
      type: 'danger',
      timeOut: 1000,
    });
  }

  renderCoD = () => {
    const { paymentMethod } = this.props;
    return (
      <div className={cx(styles.codInfo, 'mt-4')}>
        <Field
          type="text"
          name="address"
          placeholder="Address"
          component={inputField}
          className={styles.codItem}
          validate={paymentMethod === PAYMENT_METHOD.COD ? [isRequired()] : null}
        />
        <Field
          type="text"
          name="phone"
          placeholder="Phone"
          component={inputField}
          className={styles.codItem}
          validate={paymentMethod === PAYMENT_METHOD.COD ? [isRequired()] : null}
        />
        <Field
          type="text"
          placeholder="As soon as possible"
          name="noteAndTime"
          component={inputField}
          className={styles.codItem}
          validate={paymentMethod === PAYMENT_METHOD.COD ? [isRequired()] : null}
        />
      </div>
    );
  }

  render() {
    const { paymentMethod, supportedCurrency, exchange, wallet } = this.props;
    const { orderInfo } = this.state;
    const isValid = this.isValidToSubmit();
    console.log('isValid', isValid);
    return (
      <div className={styles.container}>
        <BuyForm onSubmit={console.log} validate={console.log}>
          <Field
            name="wallet"
            className='mt-4'
            component={walletSelectorField}
            validate={walletValidator}
          />
          <Field
            name="exchange"
            className='mt-4'
            component={exchangeField}
            orderType={paymentMethod}
            direction='buy'
            fiatCurrency={supportedCurrency[0]}
            currency={wallet?.currency}
            validate={exchangeValidator}
          />
          <Field
            className='mt-4'
            name="paymentMethod"
            component={paymentMethodField}
          />
          { paymentMethod === PAYMENT_METHOD.COD && this.renderCoD() }
          { orderInfo && <BankTransferInfo orderInfo={orderInfo} />}
          <ConfirmButton
            disabled={!isValid}
            containerClassName='mt-5'
            buttonClassName={styles.submitBtn}
            label={(
              <span>
                <FaLock /> Buy {exchange?.amount || 0} {exchange?.currency}
              </span>
            )}
            onConfirm={this.makeOrder}
          />
        </BuyForm>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  paymentMethod: formSelector(state, 'paymentMethod'),
  exchange: formSelector(state, 'exchange'),
  wallet: formSelector(state, 'wallet'),
  userAddress: formSelector(state, 'address'),
  userPhone: formSelector(state, 'phone'),
  userNote: formSelector(state, 'noteAndTime'),
  supportedCurrency: state?.app?.supportedCurrency || [],
});

const mapDispatchToProps = dispatch => ({
  makeOrder: bindActionCreators(makeOrder, dispatch),
  showAlert: bindActionCreators(showAlert, dispatch),
});

BuyCryptoCoin.defaultProps = {
  wallet: {},
  exchange: {},
  paymentMethod: '',
  userAddress: '',
  userNote: '',
  userPhone: '',
  makeOrder: null,
  showAlert: null,
};

BuyCryptoCoin.propTypes = {
  exchange: PropTypes.object,
  wallet: PropTypes.object,
  paymentMethod: PropTypes.string,
  userAddress: PropTypes.string,
  userNote: PropTypes.string,
  userPhone: PropTypes.string,
  makeOrder: PropTypes.func,
  showAlert: PropTypes.func,
};

export default injectIntl(connect(mapStateToProps, mapDispatchToProps)(BuyCryptoCoin));
