/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { ReactNode } from 'react';
import React, { useMemo } from 'react';
import { EuiPanel, useEuiTheme } from '@elastic/eui';
import { css } from '@emotion/react';
import { getTimeRangeAsDays, formatDollars } from './metrics';
import { ComparePercentageBadge } from './compare_percentage_badge';
import { CostSavingsMetric } from './cost_savings_metric';
import * as i18n from './translations';

interface Props {
  from: string;
  to: string;
  costSavings: number;
  costSavingsCompare: number;
  costSavingsMetric: ReactNode;
}

export const CostSavings: React.FC<Props> = ({
  from,
  to,
  costSavings,
  costSavingsCompare,
  costSavingsMetric,
}) => {
  const {
    euiTheme: { colors },
  } = useEuiTheme();
  const timerangeAsDays = useMemo(() => getTimeRangeAsDays({ from, to }), [from, to]);

  return (
    <EuiPanel
      css={css`
        min-height: 140px;
        border: 1px solid ${colors.success};
      `}
      hasBorder
      hasShadow={false}
      paddingSize="none"
    >
      <CostSavingsMetric metric={costSavingsMetric} />
      <ComparePercentageBadge
        positionForLens
        colorFamily="bright"
        currentCount={costSavings}
        previousCount={costSavingsCompare}
        stat={formatDollars(costSavingsCompare)}
        statType={i18n.COST_SAVED_DESC.toLowerCase()}
        timeRange={timerangeAsDays}
      />
    </EuiPanel>
  );
};
