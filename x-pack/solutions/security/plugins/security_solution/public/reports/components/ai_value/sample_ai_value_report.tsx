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
  EuiIcon,
  EuiButtonEmpty,
  EuiPanel,
  useEuiTheme,
  EuiHorizontalRule,
  useIsWithinMaxBreakpoint,
} from '@elastic/eui';
import { css } from '@emotion/react';
import { SECURITY_SOLUTION_DEFAULT_VALUE_REPORT_TITLE } from '@kbn/management-settings-ids';
import { i18n as i18nLib } from '@kbn/i18n';
import { SampleAlertProcessingDonut } from './sample_alert_processing_donut';
import { SampleCostSavings } from './sample_cost_savings';
import * as i18n from './translations';
import { formatDollars, formatThousands, getTimeRangeAsDays, formatPercent } from './metrics';
import { useKibana } from '../../../common/lib/kibana';
import { ValueReportSettings } from './value_report_settings';
import {
  SAMPLE_ANALYST_HOURLY_RATE,
  SAMPLE_FROM,
  SAMPLE_MINUTES_PER_ALERT,
  SAMPLE_TO,
  SAMPLE_VALUE_METRICS,
  SAMPLE_VALUE_METRICS_COMPARE,
} from './sample_data';
import analyticsSpeedAcceleration from './analytics_speed_accelation.svg';
import { SampleMetricBox } from './sample_metric_box';
import { AlertsProcessingTable } from './alert_processing_table';
import { AlertProcessingKeyInsight } from './alert_processing_key_insight';
import { SampleCostSavingsTrendChart } from './sample_cost_savings_trend_chart';

const SampleCostSavingsKeyInsight: React.FC = () => {
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

export const SampleAIValueReport: React.FC = () => {
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
  const escalatedAlerts = metrics.totalAlerts - metrics.filteredAlerts;

  return (
    <>
      {/* TODO: move panel to a separate component */}
      <EuiPanel hasShadow={true} color="subdued">
        <EuiFlexGroup alignItems="center" justifyContent="spaceBetween">
          <EuiFlexItem grow={false} alignItems="center">
            <EuiSpacer size="m" />
            <EuiIcon
              type={analyticsSpeedAcceleration}
              size="original"
              title="Analytics Speed Acceleration"
            />
          </EuiFlexItem>
          <EuiFlexItem grow={6}>
            <EuiSpacer size="s" />
            <EuiTitle size="xs">
              <p>{'No attacks detected yet'}</p>
            </EuiTitle>
            <EuiSpacer size="s" />
            <EuiText size="s">
              <p>{'Get started with Attack Discovery'}</p>
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty
              size="s"
              iconType="external"
              iconSide="right"
              color="primary"
              onClick={() => {}}
            >
              {'Attack discovery'}
            </EuiButtonEmpty>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
      <EuiSpacer
        size="l"
        css={css`
          background: ${colors.backgroundBasePlain};
        `}
      />
      {/*  TODO: START: Executive Sample Summary */}
      <div
        css={css`
          background: ${colors.backgroundBaseSubdued};
          width: 100%;
          min-height: 100%;
          border-radius: 8px;
        `}
      >
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
        <EuiHorizontalRule />
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
        <div
          css={css`
            padding: 0 16px;
          `}
        >
          <EuiHorizontalRule />
        </div>
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
          data-test-subj="cost-savings-trend-panel"
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
      {/* TODO: END: Executive Sample Summary */}
    </>
  );
};
