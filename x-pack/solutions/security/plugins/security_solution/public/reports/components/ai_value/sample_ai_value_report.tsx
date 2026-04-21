/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { EuiHorizontalRule, EuiSpacer, useEuiTheme } from '@elastic/eui';
import { css } from '@emotion/react';
import { ValueReportSettings } from './value_report_settings';
import { SAMPLE_ANALYST_HOURLY_RATE, SAMPLE_MINUTES_PER_ALERT } from './sample_data';
import { SampleAttackDiscoveryCta } from './sample_attack_discovery_cta';
import { SampleExecutiveSummary } from './sample_executive_summary';
import { SampleAlertProcessing } from './sample_alert_processing';
import { SampleCostSavingsTrend } from './sample_cost_savings_trend';

export const SampleAIValueReport: React.FC = () => {
  const {
    euiTheme: { colors },
  } = useEuiTheme();

  return (
    <>
      <SampleAttackDiscoveryCta />
      <EuiSpacer
        size="l"
        css={css`
          background: ${colors.backgroundBasePlain};
        `}
      />
      <div
        css={css`
          background: ${colors.backgroundBaseSubdued};
          width: 100%;
          min-height: 100%;
          border-radius: 8px;
        `}
      >
        <SampleExecutiveSummary />
        <EuiHorizontalRule />
        <SampleAlertProcessing />
        <div
          css={css`
            padding: 0 16px;
          `}
        >
          <EuiHorizontalRule />
        </div>
        <SampleCostSavingsTrend />
        <div
          css={css`
            padding: 0 16px;
          `}
        >
          <EuiHorizontalRule />
        </div>
        <ValueReportSettings
          analystHourlyRate={SAMPLE_ANALYST_HOURLY_RATE}
          minutesPerAlert={SAMPLE_MINUTES_PER_ALERT}
        />
      </div>
    </>
  );
};
