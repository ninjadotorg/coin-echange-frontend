import { makeRequest } from 'src/redux/action';
import { URL } from 'src/resources/constants/url';
import { USER } from 'src/resources/constants/user';
import { MasterWallet } from 'src/services/Wallets/MasterWallet';
import { REGISTER } from './type';

export const register = user => (dispatch) => {
  const makeRegister = makeRequest({
    type: REGISTER,
    url: URL.USER_SIGN_UP,
    method: 'POST',
    data: user
  }, dispatch);
  return makeRegister().then((res) => {
    console.log(res);
    console.log(123, user.password);
    const masterWallet = MasterWallet.createMasterWallets(user.password);
    localStorage.setItem('wallet', JSON.stringify(masterWallet));
    return USER.REGISTER_SUCCESS;
  }, (err) => {
    console.log(err);
    alert(err);
    return USER.LOGIN_FAILURE;
  });
};
