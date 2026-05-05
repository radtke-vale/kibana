/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { EuiIcon } from '@elastic/eui';
import type { MetricDatum } from '@elastic/charts';
import { formatPercent } from './metrics';
import * as i18n from './translations';
import { SAMPLE_VALUE_METRICS } from './sample_data';
import { SampleMetric } from './sample_metric';

const ID = 'TimeSavedMetricQuery-metric';

const icon: MetricDatum['icon'] = ({ width, height, color }) => (
  <EuiIcon type="chartLine" fill={color} style={{ width, height }} aria-hidden={true} />
);

const SampleAlertFilteringMetricComponent: React.FC = () => (
  <SampleMetric
    id={ID}
    title={i18n.FILTERING_RATE}
    value={SAMPLE_VALUE_METRICS.filteredAlertsPerc}
    valueFormatter={formatPercent}
    icon={icon}
  />
);

export const SampleAlertFilteringMetric = React.memo(SampleAlertFilteringMetricComponent);
