/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useMemo } from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiSpacer,
  EuiTitle,
  useEuiTheme,
  useIsWithinMaxBreakpoint,
} from '@elastic/eui';
import { css } from '@emotion/react';
import { SECURITY_SOLUTION_DEFAULT_VALUE_REPORT_TITLE } from '@kbn/management-settings-ids';
import { i18n as i18nLib } from '@kbn/i18n';
import { SampleCostSavings } from './sample_cost_savings';
import * as i18n from './translations';
import { formatDollars, formatThousands, getTimeRangeAsDays, formatPercent } from './metrics';
import { useKibana } from '../../../common/lib/kibana';
import {
  SAMPLE_ANALYST_HOURLY_RATE,
  SAMPLE_FROM,
  SAMPLE_MINUTES_PER_ALERT,
  SAMPLE_TO,
  SAMPLE_VALUE_METRICS,
  SAMPLE_VALUE_METRICS_COMPARE,
} from './sample_data';
import { SampleMetricBox } from './sample_metric_box';

export const SampleExecutiveSummary: React.FC = () => {
  const {
    euiTheme: { colors, size },
  } = useEuiTheme();
  const { uiSettings } = useKibana().services;
  const title = uiSettings.get(SECURITY_SOLUTION_DEFAULT_VALUE_REPORT_TITLE);
  const isSmall = useIsWithinMaxBreakpoint('m');
  const subtitle = useMemo(() => {
    const fromDate = new Date(SAMPLE_FROM);
    const toDate = new Date(SAMPLE_TO);
    const currentLocale = i18nLib.getLocale();
    return `${fromDate.toLocaleDateString(currentLocale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })} - ${toDate.toLocaleDateString(currentLocale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })}`;
  }, []);
  const timerangeAsDays = useMemo(
    () => getTimeRangeAsDays({ from: SAMPLE_FROM, to: SAMPLE_TO }),
    []
  );
  const metrics = SAMPLE_VALUE_METRICS;
  const metricsCompare = SAMPLE_VALUE_METRICS_COMPARE;
  const costSavings = useMemo(() => formatDollars(metrics.costSavings), [metrics.costSavings]);

  return (
    <div
      data-test-subj="executiveSampleSummaryContainer"
      css={css`
        border-radius: ${size.s};
        padding: ${size.base} ${size.xl};
        min-height: 200px;
      `}
    >
      <EuiTitle size="l" data-test-subj="executiveSampleSummaryTitle">
        <h1>{title}</h1>
      </EuiTitle>
      <EuiText size="s" color="subdued" data-test-subj="executiveSummaryDateRange">
        <p>{subtitle}</p>
      </EuiText>
      <EuiSpacer size="l" />

      <EuiFlexGroup
        direction={isSmall ? 'column' : 'row'}
        data-test-subj="executiveSummaryFlexGroup"
      >
        <EuiFlexItem
          css={css`
            min-width: 350px;
          `}
          data-test-subj="executiveSummarySampleMainInfo"
        >
          <span>
            <EuiText size="s" color="subdued">
              <p data-test-subj="executiveSummarySampleMessage">
                {i18n.EXECUTIVE_SUMMARY_SUBTITLE}
                <strong>
                  {i18n.EXECUTIVE_SAVINGS_SUMMARY({
                    costSavings,
                    hoursSaved: formatThousands(metrics.hoursSaved),
                  })}
                </strong>
                {i18n.EXECUTIVE_SUMMARY_MAIN_TEXT({
                  timeRange: timerangeAsDays,
                  minutesPerAlert: SAMPLE_MINUTES_PER_ALERT,
                  analystRate: SAMPLE_ANALYST_HOURLY_RATE,
                })}
                <br />
                <br />
                {i18n.EXECUTIVE_SUMMARY_SECONDARY_TEXT}
              </p>
            </EuiText>
          </span>
        </EuiFlexItem>
        <EuiFlexItem
          css={css`
            min-width: 300px;
            display: grid;
          `}
          grow={isSmall}
          data-test-subj="executiveSummarySideStats"
        >
          <SampleCostSavings
            metrics={metrics}
            metricsCompare={metricsCompare}
            timerangeAsDays={timerangeAsDays}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
      {/* Bottom row - Three KPI cards */}
      <EuiSpacer size="l" />
      <EuiFlexGroup direction={isSmall ? 'column' : 'row'} gutterSize="m">
        <EuiFlexGroup direction={isSmall ? 'column' : 'row'} gutterSize="m">
          <EuiFlexItem
            css={css`
              display: grid;
            `}
          >
            <SampleMetricBox
              id="sample-time-saved-metric"
              title={i18n.TIME_SAVED}
              value={metrics.hoursSaved}
              valueFormatter={(v) => formatThousands(Math.round(v))}
              iconType="clock"
              iconColor={colors.vis.euiColorVis2}
              currentCount={metrics.hoursSaved}
              previousCount={metricsCompare.hoursSaved}
              stat={formatThousands(metricsCompare.hoursSaved)}
              statType={i18n.TIME_SAVED_DESC.toLowerCase()}
              timeRange={timerangeAsDays}
            />
          </EuiFlexItem>
          <EuiFlexItem
            css={css`
              display: grid;
            `}
          >
            <SampleMetricBox
              id="sample-filtering-rate-metric"
              title={i18n.FILTERING_RATE}
              value={metrics.filteredAlertsPerc / 100}
              valueFormatter={(v) => formatPercent(v * 100)}
              iconType="chartLine"
              iconColor={colors.vis.euiColorVis4}
              currentCount={metrics.filteredAlertsPerc}
              previousCount={metricsCompare.filteredAlertsPerc}
              stat={formatPercent(metricsCompare.filteredAlertsPerc)}
              statType={i18n.FILTERING_RATE}
              timeRange={timerangeAsDays}
            />
          </EuiFlexItem>
          <EuiFlexItem
            css={css`
              display: grid;
            `}
          >
            <SampleMetricBox
              id="sample-threats-detected-metric"
              title={i18n.THREATS_DETECTED}
              value={metrics.attackDiscoveryCount}
              valueFormatter={(v) => formatThousands(v)}
              iconType="crosshair"
              iconColor={colors.vis.euiColorVis6}
              currentCount={metrics.attackDiscoveryCount}
              previousCount={metricsCompare.attackDiscoveryCount}
              stat={`${metricsCompare.attackDiscoveryCount}`}
              statType={i18n.ATTACK_DISCOVERY_COUNT}
              timeRange={timerangeAsDays}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlexGroup>
    </div>
  );
};
