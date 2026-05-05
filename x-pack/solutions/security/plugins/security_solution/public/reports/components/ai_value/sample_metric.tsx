/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useMemo } from 'react';
import { Chart, Metric, Settings } from '@elastic/charts';
import type { MetricDatum } from '@elastic/charts';
import { i18n as i18nLib } from '@kbn/i18n';
import { useElasticChartsTheme } from '@kbn/charts-theme';

interface Props {
  id: string;
  title: string;
  value: number;
  valueFormatter: NonNullable<MetricDatum['valueFormatter']>;
  icon: MetricDatum['icon'];
  color?: string;
}

const SampleMetricComponent: React.FC<Props> = ({
  id,
  title,
  value,
  valueFormatter,
  icon,
  color = 'transparent',
}) => {
  const baseTheme = useElasticChartsTheme();
  const data = useMemo<MetricDatum>(
    () => ({
      title,
      value,
      valueFormatter,
      color,
      icon,
    }),
    [title, value, valueFormatter, color, icon]
  );

  return (
    <Chart>
      <Settings
        baseTheme={baseTheme}
        locale={i18nLib.getLocale()}
        theme={{ metric: { valueTextAlign: 'left' } }}
      />
      <Metric id={id} data={[[data]]} />
    </Chart>
  );
};

export const SampleMetric = React.memo(SampleMetricComponent);
