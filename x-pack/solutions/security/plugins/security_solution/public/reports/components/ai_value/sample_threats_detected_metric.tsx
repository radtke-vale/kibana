/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { EuiIcon } from '@elastic/eui';
import type { MetricDatum } from '@elastic/charts';
import { formatThousands } from './metrics';
import * as i18n from './translations';
import { SAMPLE_VALUE_METRICS } from './sample_data';
import { SampleMetric } from './sample_metric';

const ID = 'ThreatsDetectedMetricQuery-metric';

const valueFormatter = (v: number) => formatThousands(v);

const icon: MetricDatum['icon'] = ({ width, height, color }) => (
  <EuiIcon type="crosshairs" fill={color} style={{ width, height }} aria-hidden={true} />
);

const SampleThreatsDetectedMetricComponent: React.FC = () => (
  <SampleMetric
    id={ID}
    title={i18n.THREATS_DETECTED}
    value={SAMPLE_VALUE_METRICS.attackDiscoveryCount}
    valueFormatter={valueFormatter}
    icon={icon}
  />
);

export const SampleThreatsDetectedMetric = React.memo(SampleThreatsDetectedMetricComponent);
