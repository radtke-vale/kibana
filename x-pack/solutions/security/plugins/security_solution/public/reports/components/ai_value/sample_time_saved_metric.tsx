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
import * as i18n from './translations';
import { SAMPLE_VALUE_METRICS } from './sample_data';

const ID = 'TimeSavedMetricQuery-metric';

const SampleTimeSavedMetricComponent: React.FC = () => {
  const baseTheme = useElasticChartsTheme();
  const data = useMemo<MetricDatum>(
    () => ({
      title: i18n.TIME_SAVED,
      value: SAMPLE_VALUE_METRICS.hoursSaved,
      valueFormatter: (v) => `${v}`,
      color: 'transparent',
    }),
    []
  );

  return (
    <Chart>
      <Settings
        baseTheme={baseTheme}
        locale={i18nLib.getLocale()}
        theme={{ metric: { valueTextAlign: 'left' } }}
      />
      <Metric id={ID} data={[[data]]} />
    </Chart>
  );
};

export const SampleTimeSavedMetric = React.memo(SampleTimeSavedMetricComponent);
