import React from 'react';
import { connect } from 'react-redux';
import { showAlert } from 'src/screens/app/redux/action';
import { submitVerifyLevel3Action } from 'src/screens/auth/redux/action';
import { LabelLang } from 'src/lang/components';
import IDVerificationForm from './IDVerificationForm';

const getStatusColor = (level, status) => {
  if (level === 'level_4') return 'success';
  const statusObj = [
    { label: 'pending', value: 'warning' },
    { label: 'approved', value: 'success' },
  ].find(e => e.label === status) || null;
  return statusObj ? statusObj.value : 'danger';
};
const getLevelStatus = (level, status) => {
  if (level === 'level_4') return 'VERIFIED';
  if (level === 'level_3') {
    if (status == 'approved') return 'VERIFIED';
    else return status.toUpperCase();
  }
  return '';
};

class IDCardBlock extends React.PureComponent {

  handleSubmitForm = values => {
    // eslint-disable-next-line
    const { showAlert, submitVerifyLevel3Action } = this.props;
    const { back_image, front_image } = values;
    if (!back_image || !front_image) {
      showAlert({
        message: 'me.accountLevel.alert.imageIdentifierRequired',
        timeOut: 3000,
        type: 'danger'
      });
      return;
    }
    submitVerifyLevel3Action(values);
    showAlert({
      message: 'me.accountLevel.alert.lv3',
      timeOut: 3000,
      type: 'success'
    });
  }

  render() {
    // eslint-disable-next-line
    const { style, verified, level, levelStatus } = this.props;
    return (
      <div className={style.collapse_custom}>
        <div className={style.head}>
          <p className={style.label}>
            <LabelLang id="me.accountLevel.step3" />
          </p>
          <br />
          <p><LabelLang id="me.accountLevel.lv3desc" /></p>
          <div className={style.extend}>
            <span className={`badge badge-${getStatusColor(level, levelStatus)}`}>{getLevelStatus(level, levelStatus)}</span>
          </div>
        </div>
        <div className={style.content}>
          <p className={style.text}><LabelLang id="me.accountLevel.wrm3" /></p>
        </div>
        <IDVerificationForm onSubmit={this.handleSubmitForm} />
      </div>
    );
  }
}

const mapState = state => ({
  verified: state.auth.profile?.verified || null,
  level: state.auth.profile.verification_level,
  levelStatus: state.auth.profile.verification_status,
});
const mapDispatch = {
  showAlert,
  submitVerifyLevel3Action
};

export default connect(mapState, mapDispatch)(IDCardBlock);
