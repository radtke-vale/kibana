/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useCallback, useMemo } from 'react';
import { useEuiTheme } from '@elastic/eui';
import { PageScope } from '../../../data_view_manager/constants';
import * as i18n from './translations';
import {
  type GetLensAttributes,
  VisualizationContextMenuActions,
} from '../../../common/components/visualization_actions/types';
import { VisualizationEmbeddable } from '../../../common/components/visualization_actions/visualization_embeddable';
import { getCostSavingsMetricLensAttributes } from '../../../common/components/visualization_actions/lens_attributes/ai/cost_savings_metric';
import { useSignalIndexWithDefault } from '../../hooks/use_signal_index_with_default';

interface Props {
  from: string;
  to: string;
  minutesPerAlert: number;
  analystHourlyRate: number;
}

const ID = 'CostSavingsMetricQuery';

const LiveCostSavingsMetricComponent: React.FC<Props> = ({
  from,
  to,
  minutesPerAlert,
  analystHourlyRate,
}) => {
  const {
    euiTheme: { colors },
  } = useEuiTheme();
  const signalIndexName = useSignalIndexWithDefault();
  const timerange = useMemo(() => ({ from, to }), [from, to]);

  const getLensAttributes = useCallback<GetLensAttributes>(
    (args) =>
      getCostSavingsMetricLensAttributes({
        ...args,
        backgroundColor: colors.backgroundBaseSuccess,
        minutesPerAlert,
        analystHourlyRate,
        signalIndexName,
      }),
    [analystHourlyRate, colors.backgroundBaseSuccess, minutesPerAlert, signalIndexName]
  );

  return (
    <VisualizationEmbeddable
      data-test-subj="cost-savings-metric"
      getLensAttributes={getLensAttributes}
      timerange={timerange}
      id={`${ID}-metric`}
      inspectTitle={i18n.COST_SAVINGS_TREND}
      scopeId={PageScope.alerts}
      withActions={[
        VisualizationContextMenuActions.addToExistingCase,
        VisualizationContextMenuActions.addToNewCase,
        VisualizationContextMenuActions.inspect,
      ]}
    />
  );
};

export const LiveCostSavingsMetric = React.memo(LiveCostSavingsMetricComponent);
