/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { EuiIcon, useEuiTheme } from '@elastic/eui';
import type { MetricDatum } from '@elastic/charts';
import { formatDollars } from './metrics';
import * as i18n from './translations';
import { SAMPLE_VALUE_METRICS } from './sample_data';
import { SampleMetric } from './sample_metric';

const ID = 'CostSavingsMetricQuery-metric';

const valueFormatter = (v: number) => formatDollars(v);

const icon: MetricDatum['icon'] = ({ width, height, color }) => (
  <EuiIcon type="rocket" fill={color} style={{ width, height }} aria-hidden={true} />
);

const SampleCostSavingsMetricComponent: React.FC = () => {
  const {
    euiTheme: { colors },
  } = useEuiTheme();

  return (
    <SampleMetric
      id={ID}
      title={i18n.COST_SAVINGS_TITLE}
      value={SAMPLE_VALUE_METRICS.costSavings}
      valueFormatter={valueFormatter}
      icon={icon}
      color={colors.backgroundBaseSuccess}
    />
  );
};

export const SampleCostSavingsMetric = React.memo(SampleCostSavingsMetricComponent);
