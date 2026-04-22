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
  EuiSpacer,
  EuiTitle,
  useEuiTheme,
  useIsWithinMaxBreakpoint,
} from '@elastic/eui';
import { css } from '@emotion/react';
import * as i18n from './translations';
import { SampleCostSavingsTrendChart } from './sample_cost_savings_trend_chart';
import { SampleCostSavingsKeyInsight } from './sample_cost_savings_key_insight';

export const SampleCostSavingsTrend: React.FC = () => {
  const {
    euiTheme: { size },
  } = useEuiTheme();
  const isSmall = useIsWithinMaxBreakpoint('m');

  return (
    <div
      css={css`
        padding: ${size.base} ${size.xl};
        .euiPanel,
        .embPanel,
        .echMetric,
        .echChartBackground,
        .embPanel__hoverActions > span {
          background-color: rgb(0, 0, 0, 0) !important;
        }
      `}
      data-test-subj="sampleCostSavingsTrend"
    >
      <EuiTitle size="m">
        <h2>{i18n.COST_SAVINGS_TREND}</h2>
      </EuiTitle>
      <EuiSpacer size="l" />
      <EuiFlexGroup
        gutterSize="xl"
        css={css`
          gap: 48px;
        `}
      >
        <EuiFlexItem>
          <SampleCostSavingsTrendChart />
        </EuiFlexItem>
        <EuiFlexItem
          css={css`
            max-width: ${isSmall ? 'auto' : '600px'};
          `}
        >
          <SampleCostSavingsKeyInsight />
        </EuiFlexItem>
      </EuiFlexGroup>
    </div>
  );
};
