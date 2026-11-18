/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

// SPIKE ONLY. Throwaway: reads dev-only URL params for the rendering spike. Delete the folder.

import React, { Suspense, useState } from 'react';
import { EuiSkeletonText } from '@elastic/eui';
import type { TimeWindow } from '../model';
import {
  TIMELINE_DENSITY,
  buildAlertRows,
  getBucketIntervalMs,
  groupCaseMarkers,
  renderAlertRow,
} from '../model';
import type { TimelineDensity } from '../model/density';
import type { TimelineRenderer, TimelineRendererProps } from '../renderer/types';

export type SpikeCaseLane = 'status' | 'comments' | 'assignees' | 'all';
export type SpikeLanes = 'source' | 'actor';
export type SpikeLabels = 'cut' | 'stack';

export interface SpikeVariants {
  readonly caseId: string;
  readonly caseLane: SpikeCaseLane;
  readonly lanes: SpikeLanes;
  readonly labels: SpikeLabels;
}

const DEFAULT_DENSITY: TimelineDensity = { ...TIMELINE_DENSITY };

const readParams = (): URLSearchParams => {
  const params = new URLSearchParams(window.location.search);
  const hashQuery = window.location.hash.split('?')[1];
  if (hashQuery) new URLSearchParams(hashQuery).forEach((v, k) => params.set(k, v));
  return params;
};

const oneOf = <T extends string>(value: string | null, allowed: readonly T[], fallback: T): T =>
  allowed.includes(value as T) ? (value as T) : fallback;

const BRenderer = React.lazy(() =>
  import('./b_renderer').then(({ BRenderer: Component }) => ({ default: Component }))
);
const AVariantsRenderer = React.lazy(() =>
  import('./a_variants_renderer').then(({ AVariantsRenderer: Component }) => ({
    default: Component,
  }))
);

type SpikeWindow = Window & { __itSpike?: Record<string, unknown> };

/** Exposes the real model functions and the last renderer props to the evidence harness. */
const record = (props: TimelineRendererProps, renderer: string) => {
  (window as SpikeWindow).__itSpike = {
    renderer,
    model: props.model,
    window: props.window,
    density: { ...TIMELINE_DENSITY },
    buildAlertRows,
    renderAlertRow,
    groupCaseMarkers,
    getBucketIntervalMs,
  };
};

const wrap = (
  Inner: React.ComponentType<TimelineRendererProps & SpikeVariants>,
  variants: SpikeVariants,
  name: string
): TimelineRenderer => {
  const Wrapped: React.FC<TimelineRendererProps> = (props) => {
    record(props, name);
    return (
      <Suspense fallback={<EuiSkeletonText lines={3} />}>
        <Inner {...props} {...variants} />
      </Suspense>
    );
  };
  return Wrapped;
};

export interface SpikeOverrides {
  readonly Renderer: TimelineRenderer;
  readonly initialZoom?: TimeWindow;
}

/** Applies ?itDensity to the shared density object and picks a spike renderer from the URL. */
export const useSpikeOverrides = (
  caseId: string,
  DefaultRenderer: TimelineRenderer
): SpikeOverrides => {
  const [overrides] = useState<SpikeOverrides>(() => {
    const params = readParams();
    Object.assign(TIMELINE_DENSITY, DEFAULT_DENSITY);
    const density = params.get('itDensity');
    if (density) {
      try {
        Object.assign(TIMELINE_DENSITY, JSON.parse(density));
      } catch {
        // ignore a bad override
      }
    }
    const [startMs, endMs] = (params.get('itWindow') ?? '').split(',').map(Number);
    const initialZoom =
      Number.isFinite(startMs) && Number.isFinite(endMs) && endMs > startMs
        ? { startMs, endMs }
        : undefined;

    const variants: SpikeVariants = {
      caseId,
      caseLane: oneOf(params.get('itCaseLane'), ['status', 'comments', 'assignees', 'all'], 'status'),
      lanes: oneOf(params.get('itLanes'), ['source', 'actor'], 'source'),
      labels: oneOf(params.get('itLabels'), ['cut', 'stack'], 'cut'),
    };
    if (params.get('itRenderer') === 'b') {
      return { Renderer: wrap(BRenderer, variants, 'b'), initialZoom };
    }
    const isVariant =
      variants.caseLane !== 'status' || variants.lanes !== 'source' || variants.labels !== 'cut';
    if (isVariant) return { Renderer: wrap(AVariantsRenderer, variants, 'a-variants'), initialZoom };
    const Kept: React.FC<TimelineRendererProps & SpikeVariants> = (props) => (
      <DefaultRenderer {...props} />
    );
    return { Renderer: wrap(Kept, variants, 'a'), initialZoom };
  });
  return overrides;
};
