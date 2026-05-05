/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useCallback } from 'react';
import {
  type GetLensAttributes,
  VisualizationContextMenuActions,
} from '../../../common/components/visualization_actions/types';
import { useSpaceId } from '../../../common/hooks/use_space_id';
import * as i18n from './translations';
import { getThreatsDetectedMetricLensAttributes } from '../../../common/components/visualization_actions/lens_attributes/ai/threats_detected_metric';
import { VisualizationEmbeddable } from '../../../common/components/visualization_actions/visualization_embeddable';

interface Props {
  from: string;
  to: string;
}
const ID = 'ThreatsDetectedMetricQuery';

const LiveThreatsDetectedMetricComponent: React.FC<Props> = ({ from, to }) => {
  const spaceId = useSpaceId();

  const getLensAttributes = useCallback<GetLensAttributes>(
    (args) => getThreatsDetectedMetricLensAttributes({ ...args, spaceId: spaceId ?? 'default' }),
    [spaceId]
  );

  return (
    <VisualizationEmbeddable
      data-test-subj="threats-detected-metric"
      getLensAttributes={getLensAttributes}
      timerange={{ from, to }}
      id={`${ID}-area-embeddable`}
      inspectTitle={i18n.THREATS_DETECTED}
      withActions={[
        VisualizationContextMenuActions.addToExistingCase,
        VisualizationContextMenuActions.addToNewCase,
        VisualizationContextMenuActions.inspect,
      ]}
    />
  );
};

export const LiveThreatsDetectedMetric = React.memo(LiveThreatsDetectedMetricComponent);
