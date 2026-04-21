/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { EuiPanel, useEuiTheme, EuiIcon } from '@elastic/eui';
import { css } from '@emotion/react';
import type { MetricWNumber } from '@elastic/charts';
import { Chart, Metric, Settings } from '@elastic/charts';
import { i18n as i18nLib } from '@kbn/i18n';
import { useThemes } from '../../../common/components/charts/common';
import type { ValueMetrics } from './metrics';
import { formatDollars } from './metrics';
import { ComparePercentageBadge } from './compare_percentage_badge';
import * as i18n from './translations';
import { COST_SAVINGS } from './translations';

interface Props {
  metrics: ValueMetrics;
  metricsCompare: ValueMetrics;
  timerangeAsDays: string;
}

export const SampleCostSavings: React.FC<Props> = ({
  metrics,
  metricsCompare,
  timerangeAsDays,
}) => {
  const {
    euiTheme: { colors },
  } = useEuiTheme();
  const { baseTheme } = useThemes();
  const RocketIcon = ({
    width,
    height,
    color,
  }: {
    width: number;
    height: number;
    color: string;
  }) => <EuiIcon type="rocket" fill={color} style={{ width, height }} aria-hidden={true} />;
  const data: MetricWNumber = {
    title: COST_SAVINGS,
    value: metrics.costSavings, // raw number
    valueFormatter: (v) => formatDollars(v), // '$12,345'
    color: colors.backgroundBaseSuccess, // green background
    icon: RocketIcon,
  };

  return (
    <EuiPanel
      css={css`
        min-height: 140px;
        border: 1px solid ${colors.success};
        background-color: ${colors.backgroundBaseSuccess};
      `}
      hasBorder
      hasShadow={false}
      paddingSize="none"
    >
      <div
        css={css`
          height: 100%;
          > * {
            height: 100% !important;
          }
          .echMetricText__icon .euiIcon {
            fill: ${colors.success};
          }
          .echMetricText {
            padding: 8px 16px 60px;
          }
          p.echMetricText__value {
            color: ${colors.success};
            font-size: 48px !important;
            padding: 10px 0;
          }
          .euiPanel,
          .embPanel__hoverActions > span {
            background: ${colors.backgroundBaseSuccess};
          }
          .embPanel__hoverActionsAnchor {
            --internalBorderStyle: 1px solid ${colors.success}!important;
          }
        `}
      >
        <Chart>
          <Settings
            baseTheme={baseTheme}
            locale={i18nLib.getLocale()}
            theme={{
              metric: {
                valueTextAlign: 'left', // that's what Lens does
              },
            }}
          />
          <Metric id="sample-cost-savings-metric" data={[[data]]} />
        </Chart>
      </div>
      <ComparePercentageBadge
        colorFamily="bright"
        currentCount={metrics.costSavings}
        previousCount={metricsCompare.costSavings}
        stat={formatDollars(metricsCompare.costSavings)}
        statType={i18n.COST_SAVED_DESC.toLowerCase()}
        timeRange={timerangeAsDays}
        positionForLens={true}
      />
    </EuiPanel>
  );
};
