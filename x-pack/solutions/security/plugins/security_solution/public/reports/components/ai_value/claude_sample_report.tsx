/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useMemo } from 'react';
import { i18n as i18nLib } from '@kbn/i18n';
import type { PartialTheme } from '@elastic/charts';
import {
  AreaSeries,
  Axis,
  Chart,
  Partition,
  PartitionLayout,
  Position,
  ScaleType,
  Settings,
  LIGHT_THEME,
} from '@elastic/charts';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiHorizontalRule,
  EuiIcon,
  EuiPanel,
  EuiSpacer,
  EuiText,
  EuiTitle,
  useEuiTheme,
  useIsWithinMaxBreakpoint,
} from '@elastic/eui';
import { css } from '@emotion/react';
import { formatDollars, formatPercent, formatThousands, getTimeRangeAsDays } from './metrics';
import * as i18n from './translations';
import { ComparePercentageBadge } from './compare_percentage_badge';
import { ComparePercentage } from './compare_percentage';
import { AlertsProcessingTable } from './alert_processing_table';
import { AlertProcessingKeyInsight } from './alert_processing_key_insight';
import { ValueReportSettings } from './value_report_settings';
import {
  SAMPLE_VALUE_METRICS,
  SAMPLE_VALUE_METRICS_COMPARE,
  SAMPLE_MINUTES_PER_ALERT,
  SAMPLE_ANALYST_HOURLY_RATE,
  SAMPLE_FROM,
  SAMPLE_TO,
} from './sample_data';

const StaticMetric: React.FC<{
  value: string;
  description: string;
  icon?: string;
  color?: string;
  backgroundColor?: string;
}> = ({ value, description, icon, color, backgroundColor }) => {
  return (
    <div
      css={css`
        padding: 8px 16px;
        ${backgroundColor ? `background-color: ${backgroundColor};` : ''}
      `}
    >
      <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
        <EuiFlexItem grow={false}>
          <EuiText size="xs" color="subdued">
            <p>{description}</p>
          </EuiText>
        </EuiFlexItem>
        {icon && (
          <EuiFlexItem grow={false}>
            <EuiIcon type={icon} size="s" color="primary" aria-hidden={true} />
          </EuiFlexItem>
        )}
      </EuiFlexGroup>
      <p
        css={css`
          font-size: 48px;
          font-weight: bold;
          line-height: 1.2;
          padding: 10px 0;
          ${color ? `color: ${color};` : ''}
        `}
      >
        {value}
      </p>
    </div>
  );
};

const DONUT_SIZE = 250;

const TRANSPARENT_BG: PartialTheme = {
  background: { color: 'transparent' },
};

const DONUT_THEME: PartialTheme = {
  ...TRANSPARENT_BG,
  partition: {
    emptySizeRatio: 0.4,
    linkLabel: {
      maxCount: 0,
      fontSize: 0,
      textColor: 'transparent',
    },
    minFontSize: 0,
    maxFontSize: 0,
  },
};

const SampleDonutChart: React.FC = () => {
  const { euiTheme } = useEuiTheme();
  const metrics = SAMPLE_VALUE_METRICS;
  const escalatedAlerts = metrics.totalAlerts - metrics.filteredAlerts;

  const data = [
    { label: i18n.AI_FILTERED, value: metrics.filteredAlerts },
    { label: i18n.ESCALATED, value: escalatedAlerts },
  ];

  return (
    <div
      css={css`
        position: relative;
        .echChartBackground {
          background-color: transparent !important;
        }
      `}
    >
      <Chart size={{ height: DONUT_SIZE, width: DONUT_SIZE }}>
        <Settings baseTheme={LIGHT_THEME} theme={DONUT_THEME} showLegend={false} />
        <Partition
          id="sampleAlertProcessingDonut"
          data={data}
          layout={PartitionLayout.sunburst}
          valueAccessor={(d: (typeof data)[number]) => d.value}
          layers={[
            {
              groupByRollup: () => 'Alerts',
              shape: {
                fillColor: 'transparent',
              },
            },
            {
              groupByRollup: (d: (typeof data)[number]) => d.label,
              shape: {
                fillColor: (_key: string, sortIndex: number) => {
                  const chartColors = [
                    euiTheme.colors.vis.euiColorVis0,
                    euiTheme.colors.vis.euiColorVis9,
                  ];
                  return chartColors[sortIndex % chartColors.length];
                },
              },
            },
          ]}
          clockwiseSectors={false}
        />
      </Chart>
      <div
        css={css`
          position: absolute;
          top: 0;
          left: 0;
          width: ${DONUT_SIZE}px;
          height: ${DONUT_SIZE}px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        `}
      >
        <EuiText size="xs" color="subdued">
          <p>{i18n.TOTAL_ALERTS_PROCESSED}</p>
        </EuiText>
        <EuiText>
          <strong>{formatThousands(metrics.totalAlerts)}</strong>
        </EuiText>
      </div>
    </div>
  );
};

const SAMPLE_TREND_DATA = [
  { x: new Date('2026-03-17').getTime(), y: 150 },
  { x: new Date('2026-03-20').getTime(), y: 280 },
  { x: new Date('2026-03-23').getTime(), y: 200 },
  { x: new Date('2026-03-26').getTime(), y: 350 },
  { x: new Date('2026-03-29').getTime(), y: 300 },
  { x: new Date('2026-04-01').getTime(), y: 450 },
  { x: new Date('2026-04-04').getTime(), y: 380 },
  { x: new Date('2026-04-07').getTime(), y: 520 },
  { x: new Date('2026-04-10').getTime(), y: 470 },
  { x: new Date('2026-04-13').getTime(), y: 600 },
  { x: new Date('2026-04-16').getTime(), y: 550 },
];

const SampleAreaChart: React.FC = () => {
  const { euiTheme } = useEuiTheme();

  return (
    <Chart size={{ height: 300 }}>
      <Settings baseTheme={LIGHT_THEME} theme={TRANSPARENT_BG} showLegend={false} />
      <Axis
        id="bottom"
        position={Position.Bottom}
        showOverlappingTicks={false}
        tickFormat={(d: number) =>
          new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }
      />
      <Axis id="left" position={Position.Left} tickFormat={(d: number) => formatDollars(d)} />
      <AreaSeries
        id="costSavings"
        name="Cost Savings"
        xScaleType={ScaleType.Time}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        data={SAMPLE_TREND_DATA}
        color={euiTheme.colors.vis.euiColorVis0}
      />
    </Chart>
  );
};

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

export const SampleReport: React.FC = () => {
  const {
    euiTheme: { size, colors },
  } = useEuiTheme();
  const isSmall = useIsWithinMaxBreakpoint('m');

  const metrics = SAMPLE_VALUE_METRICS;
  const metricsCompare = SAMPLE_VALUE_METRICS_COMPARE;
  const timerangeAsDays = useMemo(
    () => getTimeRangeAsDays({ from: SAMPLE_FROM, to: SAMPLE_TO }),
    []
  );
  const costSavings = useMemo(() => formatDollars(metrics.costSavings), [metrics.costSavings]);

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

  const escalatedAlerts = metrics.totalAlerts - metrics.filteredAlerts;

  return (
    <>
      {/* Executive summary */}
      <div
        css={css`
          border-radius: ${size.s};
          padding: ${size.base} ${size.xl};
          min-height: 200px;
        `}
      >
        <EuiTitle size="l">
          <h1>{'Elastic AI value report'}</h1>
        </EuiTitle>

        <EuiText size="s" color="subdued">
          <p>{subtitle}</p>
        </EuiText>

        <EuiSpacer size="l" />

        <EuiFlexGroup direction={isSmall ? 'column' : 'row'}>
          <EuiFlexItem
            css={css`
              min-width: 350px;
            `}
          >
            <EuiText size="s" color="subdued">
              <p>
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
          </EuiFlexItem>

          {/* Cost Savings card */}
          <EuiFlexItem
            css={css`
              min-width: 300px;
              display: grid;
            `}
            grow={isSmall}
          >
            <EuiPanel
              css={css`
                min-height: 140px;
                border: 1px solid ${colors.success};
                background-color: ${colors.backgroundBaseSuccess};
              `}
              hasBorder
              hasShadow={false}
              paddingSize="m"
            >
              <EuiText size="xs" color="subdued">
                <p>{'Cost Savings'}</p>
              </EuiText>
              <p
                css={css`
                  font-size: 48px;
                  font-weight: bold;
                  line-height: 1.2;
                  padding: 10px 0;
                  color: ${colors.success};
                `}
              >
                {costSavings}
              </p>
              <ComparePercentageBadge
                colorFamily="bright"
                currentCount={metrics.costSavings}
                previousCount={metricsCompare.costSavings}
                stat={formatDollars(metricsCompare.costSavings)}
                statType={i18n.COST_SAVED_DESC.toLowerCase()}
                timeRange={timerangeAsDays}
              />
            </EuiPanel>
          </EuiFlexItem>
        </EuiFlexGroup>

        {/* KPI cards row */}
        <EuiSpacer size="l" />
        <EuiFlexGroup direction={isSmall ? 'column' : 'row'} gutterSize="m">
          {/* Time Saved */}
          <EuiFlexItem
            css={css`
              display: grid;
            `}
          >
            <span
              css={css`
                min-height: 160px;
              `}
            >
              <StaticMetric
                value={formatThousands(metrics.hoursSaved)}
                description={i18n.TIME_SAVED}
                icon="clock"
              />
              <ComparePercentage
                currentCount={metrics.hoursSaved}
                previousCount={metricsCompare.hoursSaved}
                stat={formatThousands(metricsCompare.hoursSaved)}
                statType={i18n.TIME_SAVED_DESC.toLowerCase()}
                timeRange={timerangeAsDays}
              />
            </span>
          </EuiFlexItem>

          {/* Filtering Rate */}
          <EuiFlexItem
            css={css`
              display: grid;
            `}
          >
            <span
              css={css`
                min-height: 160px;
              `}
            >
              <StaticMetric
                value={formatPercent(metrics.filteredAlertsPerc)}
                description={i18n.FILTERING_RATE}
                icon="chartLine"
              />
              <ComparePercentage
                currentCount={metrics.filteredAlertsPerc}
                previousCount={metricsCompare.filteredAlertsPerc}
                stat={formatPercent(metricsCompare.filteredAlertsPerc)}
                statType={i18n.FILTERING_RATE}
                timeRange={timerangeAsDays}
              />
            </span>
          </EuiFlexItem>

          {/* Threats Detected */}
          <EuiFlexItem
            css={css`
              display: grid;
            `}
          >
            <span
              css={css`
                min-height: 160px;
              `}
            >
              <StaticMetric
                value={`${metrics.attackDiscoveryCount}`}
                description={i18n.THREATS_DETECTED}
                icon="crosshair"
              />
              <ComparePercentage
                currentCount={metrics.attackDiscoveryCount}
                previousCount={metricsCompare.attackDiscoveryCount}
                stat={`${metricsCompare.attackDiscoveryCount}`}
                statType={i18n.ATTACK_DISCOVERY_COUNT}
                timeRange={timerangeAsDays}
              />
            </span>
          </EuiFlexItem>
        </EuiFlexGroup>
      </div>

      <EuiHorizontalRule />

      {/* Alert processing analytics */}
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
            <SampleDonutChart />
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

      <EuiHorizontalRule />

      {/* Cost savings trend */}
      <div
        css={css`
          padding: ${size.base} ${size.xl};
        `}
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
            <SampleAreaChart />
          </EuiFlexItem>
          <EuiFlexItem
            css={css`
              max-width: 600px;
            `}
          >
            <SampleCostSavingsKeyInsight />
          </EuiFlexItem>
        </EuiFlexGroup>
      </div>

      <EuiHorizontalRule />

      {/* Cost calculations */}
      <ValueReportSettings
        analystHourlyRate={SAMPLE_ANALYST_HOURLY_RATE}
        minutesPerAlert={SAMPLE_MINUTES_PER_ALERT}
      />
    </>
  );
};
