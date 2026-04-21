/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiSpacer,
  EuiText,
  EuiTitle,
  useEuiTheme,
} from '@elastic/eui';
import { css } from '@emotion/react';
import * as i18n from './translations';

export const SampleCostSavingsKeyInsight: React.FC = () => {
  const {
    euiTheme: { size },
  } = useEuiTheme();

  return (
    <div
      css={css`
        background: linear-gradient(
          112deg,
          rgba(89, 159, 254, 0.08) 3.58%,
          rgba(240, 78, 152, 0.08) 98.48%
        );
        border-radius: ${size.s};
        padding: ${size.base};
        min-height: 200px;
      `}
    >
      <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
        <EuiFlexItem grow={false}>
          <EuiIcon type="logoElastic" size="m" aria-hidden={true} />
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiTitle size="xs">
            <p>{i18n.KEY_INSIGHT}</p>
          </EuiTitle>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size="m" />
      <EuiText size="s" color="subdued">
        <ul>
          <li>
            {'Between March 17 and April 16, 12-hour cost savings '}
            <strong>{'averaged around $400'}</strong>
            {', appearing frequently throughout the period.'}
          </li>
          <li>
            {'Savings showed an '}
            <strong>{'upward trend'}</strong>
            {' in late March, with more $450\u2013$600 intervals emerging.'}
          </li>
          <li>
            {'At this pace, projected annual savings '}
            <strong>{'exceed $200K'}</strong>
            {', indicating consistent and growing ROI.'}
          </li>
        </ul>
      </EuiText>
    </div>
  );
};
