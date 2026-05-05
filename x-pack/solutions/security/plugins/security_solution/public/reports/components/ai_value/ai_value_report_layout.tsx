/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { ReactNode } from 'react';
import React from 'react';
import { EuiHorizontalRule, useEuiTheme } from '@elastic/eui';
import { css } from '@emotion/react';
import { ValueReportSettings } from './value_report_settings';
import { CostSavingsTrend } from './cost_savings_trend';
import { ExecutiveSummary } from './executive_summary';
import { AlertProcessing } from './alert_processing';
import type { ValueMetrics } from './metrics';

interface Props {
  attackAlertIds: string[];
  analystHourlyRate: number;
  minutesPerAlert: number;
  hasAttackDiscoveries: boolean;
  from: string;
  to: string;
  valueMetrics: ValueMetrics;
  valueMetricsCompare: ValueMetrics;
  timeSavedMetric: ReactNode;
  filteringRateMetric: ReactNode;
  threatsDetectedMetric: ReactNode;
}

export const AIValueReportLayout: React.FC<Props> = ({
  attackAlertIds,
  analystHourlyRate,
  minutesPerAlert,
  hasAttackDiscoveries,
  from,
  to,
  valueMetrics,
  valueMetricsCompare,
  timeSavedMetric,
  filteringRateMetric,
  threatsDetectedMetric,
}) => {
  const {
    euiTheme: { colors },
  } = useEuiTheme();

  return (
    <div
      css={css`
        background: ${colors.backgroundBaseSubdued};
        width: 100%;
        min-height: 100%;
        border-radius: 8px;
      `}
    >
      <ExecutiveSummary
        analystHourlyRate={analystHourlyRate}
        hasAttackDiscoveries={hasAttackDiscoveries}
        minutesPerAlert={minutesPerAlert}
        from={from}
        to={to}
        valueMetrics={valueMetrics}
        valueMetricsCompare={valueMetricsCompare}
        timeSavedMetric={timeSavedMetric}
        filteringRateMetric={filteringRateMetric}
        threatsDetectedMetric={threatsDetectedMetric}
      />
      <div
        css={css`
          padding: 0 16px;
        `}
      >
        <EuiHorizontalRule />
      </div>
      <AlertProcessing
        attackAlertIds={attackAlertIds}
        valueMetrics={valueMetrics}
        from={from}
        to={to}
      />
      <div
        css={css`
          padding: 0 16px;
        `}
      >
        <EuiHorizontalRule />
      </div>
      <CostSavingsTrend
        analystHourlyRate={analystHourlyRate}
        minutesPerAlert={minutesPerAlert}
        from={from}
        to={to}
      />
      <div
        css={css`
          padding: 0 16px;
        `}
      >
        <EuiHorizontalRule />
      </div>
      <ValueReportSettings
        analystHourlyRate={analystHourlyRate}
        minutesPerAlert={minutesPerAlert}
      />
    </div>
  );
};
