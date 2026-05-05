/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useCallback, useMemo } from 'react';
import { PageScope } from '../../../data_view_manager/constants';
import { useSignalIndexWithDefault } from '../../hooks/use_signal_index_with_default';
import {
  type GetLensAttributes,
  VisualizationContextMenuActions,
} from '../../../common/components/visualization_actions/types';
import { getTimeSavedMetricLensAttributes } from '../../../common/components/visualization_actions/lens_attributes/ai/time_saved_metric';
import * as i18n from './translations';
import { VisualizationEmbeddable } from '../../../common/components/visualization_actions/visualization_embeddable';

interface Props {
  from: string;
  to: string;
  minutesPerAlert: number;
}
const ID = 'TimeSavedMetricQuery';

const LiveTimeSavedMetricComponent: React.FC<Props> = ({ from, to, minutesPerAlert }) => {
  const timerange = useMemo(() => ({ from, to }), [from, to]);
  const signalIndexName = useSignalIndexWithDefault();

  const getLensAttributes = useCallback<GetLensAttributes>(
    (args) => getTimeSavedMetricLensAttributes({ ...args, minutesPerAlert, signalIndexName }),
    [minutesPerAlert, signalIndexName]
  );

  return (
    <VisualizationEmbeddable
      data-test-subj="time-saved-metric"
      getLensAttributes={getLensAttributes}
      timerange={timerange}
      id={`${ID}-metric`}
      inspectTitle={i18n.TIME_SAVED}
      scopeId={PageScope.alerts}
      withActions={[
        VisualizationContextMenuActions.addToExistingCase,
        VisualizationContextMenuActions.addToNewCase,
        VisualizationContextMenuActions.inspect,
      ]}
    />
  );
};

export const LiveTimeSavedMetric = React.memo(LiveTimeSavedMetricComponent);
