/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { ReactNode } from 'react';
import React from 'react';
import { css } from '@emotion/react';
import { useEuiTheme } from '@elastic/eui';
import { useMetricAnimation } from '../../hooks/use_metric_animation';
import { useAIValueExportContext } from '../../providers/ai_value/export_provider';

interface Props {
  metric: ReactNode;
}

const WithMetricAnimation = ({ children }: { children: React.ReactNode }) => {
  // Apply animation to the metric value
  useMetricAnimation({
    animationDurationMs: 1500,
    // Scope to this embeddable to avoid accidentally animating the first metric value on the page
    // (e.g. "Real threats detected"), since `.echMetricText__value` is used by all Lens metric cards.
    selector: '[data-test-subj="cost-savings-metric"] .echMetricText__value',
  });

  return <>{children}</>;
};

const CostSavingsMetricComponent: React.FC<Props> = ({ metric }) => {
  const {
    euiTheme: { colors },
  } = useEuiTheme();

  const exportContext = useAIValueExportContext();
  const isExportMode = exportContext?.isExportMode === true;

  const content = (
    <div
      data-test-subj="cost-savings-metric-container"
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
      {metric}
    </div>
  );

  if (isExportMode) {
    return content;
  }

  return <WithMetricAnimation>{content}</WithMetricAnimation>;
};

export const CostSavingsMetric = React.memo(CostSavingsMetricComponent);
