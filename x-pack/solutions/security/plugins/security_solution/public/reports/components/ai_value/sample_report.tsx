/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import {
  EuiBadge,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHealth,
  EuiHorizontalRule,
  EuiIcon,
  EuiPanel,
  EuiSpacer,
  EuiStat,
  EuiText,
  EuiTitle,
  useEuiTheme,
} from '@elastic/eui';
import { css } from '@emotion/react';

/** Sample/dummy data used for the preview report when no real data is available */
const SAMPLE_DATA = {
  title: 'Elastic Sample Report',
  dateRange: 'Jul 18, 2025 - Aug 18, 2025',
  timeRangeDays: '30',
  minutesPerAlert: 10,
  analystRate: 60,
  // Executive summary KPIs
  costSavings: '$45,320',
  costSavingsComparePerc: '+12%',
  costSavingsCompareStat: '$38,420',
  hoursSaved: '1,510',
  hoursSavedComparePerc: '+8%',
  hoursSavedCompareStat: '1,398',
  filteringRate: '92%',
  filteringRateComparePerc: '+3%',
  filteringRateCompareStat: '89.00%',
  threatsDetected: '23',
  threatsDetectedComparePerc: '+15%',
  threatsDetectedCompareStat: '20',
  // Alert processing
  totalAlerts: '18,420',
  filteredAlerts: '16,946',
  filteredAlertsPerc: '92.00%',
  escalatedAlerts: '1,474',
  escalatedAlertsPerc: '8.00%',
};

// ─── Internal layout helpers ─────────────────────────────────────────────────

/** Gradient insight box that mirrors AlertProcessingKeyInsight / CostSavingsKeyInsight */
const KeyInsightBox: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
            <p>{'Key Insight'}</p>
          </EuiTitle>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size="m" />
      {children}
    </div>
  );
};

/**
 * Metric card that mirrors the CostSavings / TimeSaved / FilteringRate / ThreatsDetected cards.
 *
 * In the live report these cards wrap a Lens embeddable (metric visualization) plus a
 * ComparePercentage(Badge) overlay. Here we replicate the same visual weight with EuiStat
 * and a comparison line so the layout is identical.
 */
const SampleMetricCard: React.FC<{
  value: string;
  label: string;
  /** Short percentage string, e.g. "+12%" */
  comparePerc: string;
  /** Human-readable baseline stat shown in the comparison sentence */
  compareStat: string;
  /** Noun phrase describing what the stat measures */
  compareStatType: string;
  titleColor?: 'default' | 'success' | 'accent' | 'danger' | 'warning' | 'subdued';
  /** When true wraps the card in a green-bordered EuiPanel (mirrors CostSavings) */
  bordered?: boolean;
}> = ({ value, label, comparePerc, compareStat, compareStatType, titleColor, bordered }) => {
  const {
    euiTheme: { colors },
  } = useEuiTheme();

  const isUp = comparePerc.startsWith('+');

  const inner = (
    <span
      css={css`
        min-height: 160px;
        display: block;
      `}
    >
      <EuiStat
        title={value}
        description={label}
        titleColor={titleColor ?? 'default'}
        titleSize="l"
      />
      <EuiSpacer size="xs" />
      {bordered ? (
        // CostSavings uses a coloured badge — mirrors ComparePercentageBadge
        <EuiBadge color={isUp ? 'success' : 'danger'}>
          {`${comparePerc} from ${compareStat} ${compareStatType} over the last ${SAMPLE_DATA.timeRangeDays} days`}
        </EuiBadge>
      ) : (
        // Other KPI cards use plain text — mirrors ComparePercentage
        <EuiText size="xs" color="subdued">
          <p>{`Your ${compareStatType} is ${isUp ? 'up' : 'down'} by ${comparePerc.replace(
            /[+-]/,
            ''
          )} from ${compareStat} over the last ${SAMPLE_DATA.timeRangeDays} days`}</p>
        </EuiText>
      )}
    </span>
  );

  if (bordered) {
    return (
      <EuiPanel
        css={css`
          min-height: 140px;
          border: 1px solid ${colors.success};
        `}
        hasBorder
        hasShadow={false}
        paddingSize="m"
      >
        {inner}
      </EuiPanel>
    );
  }

  return inner;
};

/**
 * Simple SVG donut chart — mirrors AlertProcessingDonut (Lens embeddable).
 * Shows 92 % AI-filtered (vis0 / teal) and 8 % escalated (vis9 / red).
 */
const SampleDonutChart: React.FC = () => {
  const {
    euiTheme: { colors },
  } = useEuiTheme();

  const r = 70;
  const cx = 100;
  const cy = 100;
  const circumference = 2 * Math.PI * r;
  const filteredLen = circumference * 0.92;
  const escalatedLen = circumference * 0.08;

  return (
    <svg viewBox="0 0 200 200" width="250" height="250">
      {/* Background ring */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={colors.lightShade} strokeWidth="28" />

      {/* AI-filtered segment (92 %) */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={colors.vis.euiColorVis0}
        strokeWidth="28"
        strokeDasharray={`${filteredLen} ${escalatedLen}`}
        transform={`rotate(-90 ${cx} ${cy})`}
      />

      {/* Escalated segment (8 %) — starts right after the filtered segment */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={colors.vis.euiColorVis9}
        strokeWidth="28"
        strokeDasharray={`${escalatedLen} ${filteredLen}`}
        strokeDashoffset={-filteredLen}
        transform={`rotate(-90 ${cx} ${cy})`}
      />

      {/* Center label */}
      <text
        x={cx}
        y={cy - 8}
        textAnchor="middle"
        fontSize="11"
        fill={colors.subduedText}
        fontFamily="Inter, sans-serif"
      >
        {'Total alerts'}
      </text>
      <text
        x={cx}
        y={cy + 8}
        textAnchor="middle"
        fontSize="11"
        fill={colors.subduedText}
        fontFamily="Inter, sans-serif"
      >
        {'processed'}
      </text>
    </svg>
  );
};

/**
 * Simple SVG area chart — mirrors the CostSavingsTrend Lens embeddable (area chart).
 * Shows a gently upward-trending curve to convey the shape of the real visualisation.
 */
const SampleAreaChart: React.FC = () => {
  const {
    euiTheme: { colors },
  } = useEuiTheme();

  const lineD =
    'M0,220 C40,210 60,190 100,175 S160,155 200,140 S270,100 310,85 S380,60 430,45 S490,20 530,15';
  const areaD = `${lineD} L530,250 L0,250 Z`;

  return (
    <svg viewBox="0 0 530 250" width="100%" height="300" preserveAspectRatio="none">
      <defs>
        <linearGradient id="sampleAreaGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colors.success} stopOpacity="0.3" />
          <stop offset="100%" stopColor={colors.success} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#sampleAreaGradient)" />
      <path d={lineD} fill="none" stroke={colors.success} strokeWidth="2" />
    </svg>
  );
};

// ─── SampleValueReportSettings ───────────────────────────────────────────────

/** Mirrors ValueReportSettings — shown after each of the two main sections */
const SampleValueReportSettings: React.FC = () => {
  const {
    euiTheme: { size },
  } = useEuiTheme();

  return (
    <div
      css={css`
        padding: ${size.base} ${size.xl};
      `}
    >
      <EuiTitle size="m">
        <h2>{'Cost calculations'}</h2>
      </EuiTitle>
      <EuiSpacer size="l" />
      <EuiText size="xs">
        <p>
          {`Value is calculated by multiplying the total number of alerts by ${SAMPLE_DATA.minutesPerAlert} minutes each and then multiplying the result by a $${SAMPLE_DATA.analystRate} per hour analyst rate.`}
        </p>
        <p>
          {
            'The savings, figures, and estimates presented herein are for illustrative and informational purposes only. Individual results may vary significantly. This information is not, and should not be taken as, legal or financial advice to any person or company. Before making any decisions, consult with a qualified advisor. Elastic accepts no liability or responsibility whatsoever for any losses or liabilities allegedly arising from the use of this information.'
          }
        </p>
      </EuiText>
    </div>
  );
};

// ─── SampleReport ────────────────────────────────────────────────────────────

/**
 * A fully static preview of the AI Value Report shown inside ExecutiveSummaryEmptyState
 * when there are no attack discoveries yet.
 *
 * The layout and component hierarchy mirror the live report exactly:
 *
 *   ExecutiveSummary
 *     ├── title + date range
 *     ├── narrative text  │  CostSavings card
 *     └── TimeSaved · FilteringRate · ThreatsDetected KPI cards
 *   ─────────────────────────────────────────────
 *   AlertProcessing ("Alert processing analytics")
 *     ├── donut chart + stats table
 *     └── Key Insight box
 *   ─────────────────────────────────────────────
 *   ValueReportSettings ("Cost calculations")
 *   ─────────────────────────────────────────────
 *   CostSavingsTrend ("Cost savings trend")
 *     ├── area chart
 *     └── Key Insight box
 *   ─────────────────────────────────────────────
 *   ValueReportSettings ("Cost calculations")
 *
 * Replace the static values / placeholder charts with real data and Lens
 * embeddables to produce the live version of each section.
 */
export const SampleReport: React.FC = () => {
  const {
    euiTheme: { size, colors },
  } = useEuiTheme();

  const sectionPadding = css`
    padding: ${size.base} ${size.xl};
  `;

  return (
    <div>
      {/* ═══════════════════════════════════════════════════════════════════
          EXECUTIVE SUMMARY
          Mirrors: executive_summary.tsx
          ══════════════════════════════════════════════════════════════════ */}
      <div
        data-test-subj="sampleReportExecutiveSummary"
        css={css`
          border-radius: ${size.s};
          padding: ${size.base} ${size.xl};
          min-height: 200px;
        `}
      >
        {/* Title — mirrors EuiInlineEditTitle */}
        <EuiTitle size="l">
          <h1>{SAMPLE_DATA.title}</h1>
        </EuiTitle>

        {/* Date range subtitle */}
        <EuiText size="s" color="subdued">
          <p>{SAMPLE_DATA.dateRange}</p>
        </EuiText>

        <EuiSpacer size="l" />

        {/* Two-column row: narrative text (left) + CostSavings card (right) */}
        <EuiFlexGroup direction="row">
          {/* Left — narrative text, mirrors executiveSummaryMainInfo */}
          <EuiFlexItem
            css={css`
              min-width: 350px;
            `}
          >
            <EuiText size="s" color="subdued">
              <p>
                {'Elastic AI SOC Engine continues to deliver measurable ROI: '}
                <strong>
                  {`${SAMPLE_DATA.costSavings} cost savings and ${SAMPLE_DATA.hoursSaved} analyst hours saved`}
                </strong>
                {` over the last ${SAMPLE_DATA.timeRangeDays} days — significantly increasing threat detection coverage. These results are based on automating alert triage, using an average review time of ${SAMPLE_DATA.minutesPerAlert} minutes per alert and a $${SAMPLE_DATA.analystRate}/hour analyst rate.`}
                <br />
                <br />
                {
                  'By reducing the manual burden of high-volume alert review, the AI SOC enhances efficiency, lowers operational costs, and enables teams to focus on higher-value security work. At the same time, it increases threat detection coverage — helping organizations respond faster, with fewer resources.'
                }
              </p>
            </EuiText>
          </EuiFlexItem>

          {/* Right — CostSavings card, mirrors cost_savings.tsx */}
          <EuiFlexItem
            css={css`
              min-width: 300px;
              display: grid;
            `}
          >
            <SampleMetricCard
              value={SAMPLE_DATA.costSavings}
              label={'Cost savings'}
              comparePerc={SAMPLE_DATA.costSavingsComparePerc}
              compareStat={SAMPLE_DATA.costSavingsCompareStat}
              compareStatType={'cost saved in dollars'}
              titleColor="success"
              bordered
            />
          </EuiFlexItem>
        </EuiFlexGroup>

        <EuiSpacer size="l" />

        {/* Bottom row — three KPI cards
            Mirrors: TimeSaved · FilteringRate · ThreatsDetected */}
        <EuiFlexGroup direction="row" gutterSize="m">
          {/* Analyst time saved — mirrors time_saved.tsx */}
          <EuiFlexItem
            css={css`
              display: grid;
            `}
          >
            <SampleMetricCard
              value={SAMPLE_DATA.hoursSaved}
              label={'Analyst time saved (hours)'}
              comparePerc={SAMPLE_DATA.hoursSavedComparePerc}
              compareStat={SAMPLE_DATA.hoursSavedCompareStat}
              compareStatType={'time saved in hours'}
            />
          </EuiFlexItem>

          {/* Alert filtering rate — mirrors filtering_rate.tsx */}
          <EuiFlexItem
            css={css`
              display: grid;
            `}
          >
            <SampleMetricCard
              value={SAMPLE_DATA.filteringRate}
              label={'Alert filtering rate'}
              comparePerc={SAMPLE_DATA.filteringRateComparePerc}
              compareStat={SAMPLE_DATA.filteringRateCompareStat}
              compareStatType={'alert filtering rate'}
            />
          </EuiFlexItem>

          {/* Real threats detected — mirrors threats_detected.tsx */}
          <EuiFlexItem
            css={css`
              display: grid;
            `}
          >
            <SampleMetricCard
              value={SAMPLE_DATA.threatsDetected}
              label={'Real threats detected'}
              comparePerc={SAMPLE_DATA.threatsDetectedComparePerc}
              compareStat={SAMPLE_DATA.threatsDetectedCompareStat}
              compareStatType={'attack discovery count'}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      </div>

      {/* Separator — mirrors the EuiHorizontalRule in index.tsx */}
      <div
        css={css`
          padding: 0 16px;
        `}
      >
        <EuiHorizontalRule />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          ALERT PROCESSING ANALYTICS
          Mirrors: alert_processing.tsx
          ══════════════════════════════════════════════════════════════════ */}
      <div css={sectionPadding} data-test-subj="sampleReportAlertProcessing">
        <EuiTitle size="m">
          <h2>{'Alert processing analytics'}</h2>
        </EuiTitle>
        <EuiSpacer size="l" />

        <EuiFlexGroup
          gutterSize="xl"
          css={css`
            gap: 48px;
          `}
        >
          {/* Left — donut chart + stats table
              Mirrors: AlertProcessingDonut + AlertsProcessingTable */}
          <EuiFlexItem
            grow={false}
            css={css`
              min-width: 300px;
            `}
          >
            <SampleDonutChart />

            {/* Stats table — mirrors alert_processing_table.tsx */}
            <EuiFlexGroup
              direction="column"
              gutterSize="s"
              style={{ maxWidth: 280 }}
              data-test-subj="sampleAlertProcessingTable"
            >
              <EuiFlexItem grow={false}>
                <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
                  <EuiFlexItem grow={false}>
                    <EuiHealth color={colors.vis.euiColorVis0} />
                  </EuiFlexItem>
                  <EuiFlexItem>
                    <EuiText size="s">
                      <p>{'AI filtered'}</p>
                    </EuiText>
                  </EuiFlexItem>
                  <EuiFlexItem>
                    <EuiText size="s">
                      <strong>{`${SAMPLE_DATA.filteredAlerts} (${SAMPLE_DATA.filteredAlertsPerc})`}</strong>
                    </EuiText>
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiFlexItem>

              <EuiFlexItem grow={false}>
                <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
                  <EuiFlexItem grow={false}>
                    <EuiHealth color={colors.vis.euiColorVis9} />
                  </EuiFlexItem>
                  <EuiFlexItem>
                    <EuiText size="s">
                      <p>{'Escalated'}</p>
                    </EuiText>
                  </EuiFlexItem>
                  <EuiFlexItem>
                    <EuiText size="s">
                      <strong>{`${SAMPLE_DATA.escalatedAlerts} (${SAMPLE_DATA.escalatedAlertsPerc})`}</strong>
                    </EuiText>
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>

          {/* Right — Key Insight box
              Mirrors: alert_processing_key_insight.tsx */}
          <EuiFlexItem>
            <KeyInsightBox>
              <EuiText
                size="s"
                color="subdued"
                css={css`
                  line-height: 1.6em;
                `}
              >
                <ul>
                  <li
                    css={css`
                      margin-bottom: 5px;
                    `}
                  >
                    <strong>{`High automation efficiency: ${SAMPLE_DATA.filteredAlertsPerc} of alerts (${SAMPLE_DATA.filteredAlerts})`}</strong>
                    {
                      " were automatically filtered out by AI, meaning analysts didn't have to review them manually. This drastically cuts down noise and routine triage work."
                    }
                  </li>
                  <li>
                    <strong>{`Focused escalations: Only ${SAMPLE_DATA.escalatedAlertsPerc} of alerts (${SAMPLE_DATA.escalatedAlerts})`}</strong>
                    {
                      " were escalated for analyst review — highlighting that Elastic's Attack Discovery surfaces only the alerts that matter and are more likely tied to actual threats."
                    }
                  </li>
                </ul>
                <EuiHorizontalRule />
                <p>
                  {
                    "Elastic's Attack Discovery is effectively minimizing alert fatigue by filtering out the vast majority of noise, only escalating credible threats, and maintaining a very low false positive rate. This allows security teams to spend their time on true investigations instead of sifting through irrelevant alerts."
                  }
                </p>
              </EuiText>
            </KeyInsightBox>
          </EuiFlexItem>
        </EuiFlexGroup>

        <EuiSpacer size="l" />
      </div>

      {/* Separator + Cost Calculations
          Mirrors: EuiHorizontalRule + ValueReportSettings in index.tsx */}
      <div
        css={css`
          padding: 0 16px;
        `}
      >
        <EuiHorizontalRule />
      </div>
      <SampleValueReportSettings />

      {/* ═══════════════════════════════════════════════════════════════════
          COST SAVINGS TREND
          Mirrors: cost_savings_trend.tsx
          ══════════════════════════════════════════════════════════════════ */}
      <div css={sectionPadding} data-test-subj="sampleReportCostSavingsTrend">
        <EuiTitle size="m">
          <h2>{'Cost savings trend'}</h2>
        </EuiTitle>
        <EuiSpacer size="l" />

        <EuiFlexGroup
          gutterSize="xl"
          css={css`
            gap: 48px;
          `}
        >
          {/* Left — area chart
              Mirrors: VisualizationEmbeddable (area chart) in cost_savings_trend.tsx */}
          <EuiFlexItem>
            <SampleAreaChart />
          </EuiFlexItem>

          {/* Right — Key Insight box
              Mirrors: cost_savings_key_insight.tsx */}
          <EuiFlexItem
            css={css`
              max-width: 600px;
            `}
          >
            <KeyInsightBox>
              <EuiText
                size="s"
                color="subdued"
                css={css`
                  line-height: 1.6em;
                `}
              >
                <p>
                  {`Over the past ${SAMPLE_DATA.timeRangeDays} days, cost savings have trended steadily upward, reaching a cumulative total of ${SAMPLE_DATA.costSavings}. The AI-driven automation has consistently filtered out the majority of low-value alerts, freeing analyst capacity and reducing operational overhead. The trend indicates sustained efficiency gains aligned with increasing alert volumes.`}
                </p>
              </EuiText>
            </KeyInsightBox>
          </EuiFlexItem>
        </EuiFlexGroup>
      </div>

      {/* Separator + Cost Calculations
          Mirrors: EuiHorizontalRule + ValueReportSettings in index.tsx */}
      <div
        css={css`
          padding: 0 16px;
        `}
      >
        <EuiHorizontalRule />
      </div>
      <SampleValueReportSettings />
    </div>
  );
};
