/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiSpacer, EuiTitle, useEuiTheme } from '@elastic/eui';
import { css } from '@emotion/react';
import { SampleAlertProcessingDonut } from './sample_alert_processing_donut';
import { AlertsProcessingTable } from './alert_processing_table';
import { AlertProcessingKeyInsight } from './alert_processing_key_insight';
import { formatPercent } from './metrics';
import * as i18n from './translations';
import { SAMPLE_VALUE_METRICS } from './sample_data';

export const SampleAlertProcessing: React.FC = () => {
  const {
    euiTheme: { size },
  } = useEuiTheme();
  const metrics = SAMPLE_VALUE_METRICS;
  const escalatedAlerts = metrics.totalAlerts - metrics.filteredAlerts;

  return (
    <div
      css={css`
        padding: ${size.base} ${size.xl};
      `}
    >
      <EuiTitle size="m">
        <h2>{i18n.ALERT_PROCESSING_TITLE}</h2>
      </EuiTitle>
      <EuiSpacer size="l" />
      <EuiFlexGroup
        gutterSize="xl"
        data-test-subj="alertSampleProcessingGroup"
        css={css`
          gap: 48px;
        `}
      >
        <EuiFlexItem
          grow={false}
          css={css`
            min-width: 300px;
          `}
        >
          <SampleAlertProcessingDonut
            filteredAlerts={metrics.filteredAlerts}
            escalatedAlerts={escalatedAlerts}
            totalAlerts={metrics.totalAlerts}
          />
          <AlertsProcessingTable
            isLoading={false}
            filteredAlerts={metrics.filteredAlerts}
            escalatedAlerts={escalatedAlerts}
            filteredAlertsPerc={formatPercent(metrics.filteredAlertsPerc)}
            escalatedAlertsPerc={formatPercent(metrics.escalatedAlertsPerc)}
          />
        </EuiFlexItem>
        <EuiFlexItem>
          <AlertProcessingKeyInsight isLoading={false} valueMetrics={metrics} />
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size="l" />
    </div>
  );
};
