/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { css } from '@emotion/react';
import { Chart, Metric, Settings } from '@elastic/charts';
import type { MetricWNumber } from '@elastic/charts';
import { EuiIcon } from '@elastic/eui';
import { i18n as i18nLib } from '@kbn/i18n';
import { useThemes } from '../../../common/components/charts/common';
import { ComparePercentage } from './compare_percentage';

interface Props {
  id: string;
  title: string;
  value: number;
  valueFormatter: (v: number) => string;
  iconType: string; // 'clock', 'chartLine', 'crosshair'
  iconColor: string; // colors.vis.euiColorVis2, etc.
  // ComparePercentage props:
  currentCount: number;
  previousCount: number;
  stat: string;
  statType: string;
  timeRange: string;
}

export const SampleMetricBox: React.FC<Props> = ({
  id,
  title,
  value,
  valueFormatter,
  iconType,
  iconColor,
  currentCount,
  previousCount,
  stat,
  statType,
  timeRange,
}) => {
  const data: MetricWNumber = {
    title,
    value,
    valueFormatter,
    color: 'rgba(0,0,0,0)',
    icon: ({ width, height, color }) => (
      <EuiIcon type={iconType} fill={color} style={{ width, height }} aria-hidden />
    ),
  };
  const { baseTheme } = useThemes();

  return (
    <span
      css={css`
        min-height: 160px;
      `}
    >
      <div
        css={css`
          height: 100%;
          > * {
            height: 100% !important;
          }
          .echMetricText__icon .euiIcon {
            fill: ${iconColor};
          }
          .echMetricText__valueBlock {
            grid-row-start: 3 !important;
          }
          .echMetricText {
            padding: 8px 16px 60px;
          }
          .echMetricText {
            display: grid !important;
            grid-template-columns: auto auto 1fr !important;
            gap: 8px !important;
            align-items: center !important;
          }
          .echMetricText__titlesBlock--left {
            grid-column: 1 !important;
          }
          .echMetricText__icon--right {
            grid-column: 2 !important;
          }
          /* transparent background — no colored panel for these cards */
          .echMetric,
          .echChartBackground {
            background-color: rgba(0, 0, 0, 0) !important;
          }
        `}
      >
        <Chart>
          <Settings
            baseTheme={baseTheme}
            locale={i18nLib.getLocale()}
            theme={{ metric: { valueTextAlign: 'left' } }}
          />
          <Metric id={id} data={[[data]]} />
        </Chart>
      </div>
      <ComparePercentage
        positionForLens
        currentCount={currentCount}
        previousCount={previousCount}
        stat={stat}
        statType={statType}
        timeRange={timeRange}
      />
    </span>
  );
};
