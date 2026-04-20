/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';

import { Chart, Settings, Axis, ScaleType, Position, LineSeries, Tooltip } from '@elastic/charts';
import { i18n as i18nLib } from '@kbn/i18n';
import { useThemes } from '../../../common/components/charts/common';
import { formatDollars } from './metrics';
import { SAMPLE_TREND_DATA } from './sample_data';

export const SampleCostSavingsTrendChart: React.FC = () => {
  const { baseTheme, theme } = useThemes();

  return (
    <Chart size={{ height: 300 }}>
      <Settings
        theme={[
          {
            background: { color: 'transparent' },
            legend: { spacingBuffer: 100 },
          },
          theme,
        ]}
        baseTheme={baseTheme}
        locale={i18nLib.getLocale()}
        showLegend={false}
        legendPosition={Position.Right}
      />
      <Tooltip
        headerFormatter={({ value }) => {
          const d = new Date(value);
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          const hour = String(d.getHours()).padStart(2, '0');
          const min = String(d.getMinutes()).padStart(2, '0');
          return `${year}-${month}-${day} ${hour}:${min}`;
        }}
        type="follow"
      />
      <Axis
        id="bottom"
        position={Position.Bottom}
        /* no title — matches axisTitlesVisibilitySettings.x: false */
      />
      <Axis
        id="left"
        position={Position.Left}
        tickFormat={(v) => formatDollars(v)}
        /* no title — matches axisTitlesVisibilitySettings.yLeft: false */
      />
      <LineSeries
        id="cost-savings"
        name="Cost Savings"
        xScaleType={ScaleType.Time}
        yScaleType={ScaleType.Linear}
        xAccessor="timestamp"
        yAccessors={['costSavings']}
        data={SAMPLE_TREND_DATA}
      />
    </Chart>
  );
};
