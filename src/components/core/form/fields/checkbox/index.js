/* eslint react/prop-types:0 */
import {LabelLang} from 'src/lang/components';
import cx from 'classnames';
import React from 'react';

const inputField = ({ input, meta, labelText, labelClassName, containerClassName, ...props }) => {
  const {
    onChange, onBlur, onFocus, value
  } = input;
  const { error, touched } = meta;
  const shouldShowError = !!(touched && error);
  return (
    <div className={cx('checkbox-warper',containerClassName ? containerClassName : '')}>
      <label className={labelClassName ||  ''}>
        {labelText && (<LabelLang id={labelText} />) }
        <input
          type="checkbox"
          {...props}
          value={value}
          onBlur={onBlur}
          onFocus={onFocus}
          onChange={onChange}
        />
        <span className="checkmark" />
      </label>
      { shouldShowError && <small className="text-danger">{error}</small>}
    </div>
  );
};

export default inputField;
export inputValidator from './validator';