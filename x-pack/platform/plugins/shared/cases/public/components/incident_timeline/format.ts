/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import moment from 'moment-timezone';

export const formatTime = (ms: number, timeZone: string): string =>
  moment.tz(ms, timeZone).format('MMM D, YYYY HH:mm:ss');

export const formatRange = (startMs: number, endMs: number, timeZone: string): string =>
  `${formatTime(startMs, timeZone)} – ${formatTime(endMs, timeZone)}`;

export const formatDuration = (ms: number): string => moment.duration(ms).humanize();

const DAY_MS = 24 * 60 * 60 * 1000;

/** Axis labels in the Kibana time zone, as precise as the window needs. */
export const formatAxisTick = (
  ms: number,
  { startMs, endMs }: { startMs: number; endMs: number },
  timeZone: string
): string => {
  const span = endMs - startMs;
  if (span > 7 * DAY_MS) return moment.tz(ms, timeZone).format('MMM D');
  if (span > DAY_MS) return moment.tz(ms, timeZone).format('MMM D HH:mm');
  return moment.tz(ms, timeZone).format('HH:mm:ss');
};
