/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { ReactNode } from 'react';
import React from 'react';
import { css } from '@emotion/react';
import { ThreatsDetectedMetric } from './threats_detected_metric';
import { ComparePercentage } from './compare_percentage';
import { getTimeRangeAsDays } from './metrics';
import * as i18n from './translations';

interface Props {
  attackDiscoveryCount: number;
  attackDiscoveryCountCompare: number;
  from: string;
  to: string;
  threatsDetectedMetric: ReactNode;
}

export const ThreatsDetected: React.FC<Props> = ({
  attackDiscoveryCount,
  attackDiscoveryCountCompare,
  from,
  to,
  threatsDetectedMetric,
}) => {
  return (
    <span
      css={css`
        min-height: 160px;
      `}
    >
      <ThreatsDetectedMetric metric={threatsDetectedMetric} />

      <ComparePercentage
        currentCount={attackDiscoveryCount}
        positionForLens
        previousCount={attackDiscoveryCountCompare}
        stat={`${attackDiscoveryCountCompare}`}
        statType={i18n.ATTACK_DISCOVERY_COUNT}
        timeRange={getTimeRangeAsDays({ from, to })}
      />
    </span>
  );
};
