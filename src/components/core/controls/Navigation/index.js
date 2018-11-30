import React from 'react';
import LabelLang from 'src/lang/components/LabelLang';
import { Link, withRouter } from 'react-router-dom';
import cn from 'classnames';

import { URL } from 'src/resources/constants/url';
import meIcon from 'src/assets/images/navigation/ic_me.svg';
import walletIcon from 'src/assets/images/navigation/ic_wallet.svg';
import creditIcon from 'src/assets/images/navigation/ic_credit.svg';
import styles from './styles.scss';

class Navigation extends React.Component {
  state = {
    currentPath: '',
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    if (nextProps.location.pathname !== prevState.currentPath) {
      return { currentPath: nextProps.location.pathname };
    }
    return null;
  }

  // eslint-disable-next-line
  shouldComponentUpdate = (nextProps, nextState) => nextState.currentPath !== this.state.currentPath;

  checkSelected = (URLS) => {
    const { currentPath } = this.state;
    return URLS.indexOf(currentPath) >= 0 ? styles.selected : '';
  }

  render() {
    return (
      <footer className={styles.footer}>
        <div className={styles.main}>
          <div className={cn(styles.item, this.checkSelected([URL.HOME]))}>
            <Link to={URL.HOME}>
              <img alt="creditIcon" src={creditIcon} />
              <LabelLang id="app.navigation.coin" />
            </Link>
          </div>
          <div className={cn(styles.item, this.checkSelected([URL.WALLET]))}>
            <Link to={URL.WALLET}>
              <img alt="walletIcon" src={walletIcon} />
              <LabelLang id="app.navigation.wallet" />
            </Link>
          </div>
          <div className={cn(styles.item, this.checkSelected([URL.ME]))}>
            <Link to={URL.ME}>
              <img alt="meIcon" src={meIcon} />
              <LabelLang id="app.navigation.me" />
            </Link>
          </div>
        </div>
      </footer>
    );
  }
}
export default withRouter(Navigation);
