/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CaseStatuses } from '../../../../common/types/domain';
import type { IncidentTimelineAlert } from '../../../../common/types/api';
import { renderWithTestingProviders } from '../../../common/mock';
import type { TimelineEntry } from '../model';
import { buildTimelineModel } from '../model';
import { ElasticChartsRenderer } from './elastic_charts_renderer';

const T0 = Date.parse('2026-09-01T09:00:00.000Z');
const MINUTE = 60 * 1000;
const iso = (ms: number) => new Date(ms).toISOString();

const alert: IncidentTimelineAlert = {
  id: 'cred',
  index: '.alerts-security.alerts-default',
  time: iso(T0 + 10 * MINUTE),
  timeSource: 'original_time',
  timestamp: iso(T0 + 10 * MINUTE),
  ruleId: 'cred-rule',
  ruleName: 'Access of Stored Browser Credentials',
  hostNames: ['mac-01'],
  userNames: ['jdoe'],
};

const entry: TimelineEntry = {
  id: 'pasted',
  version: 'v1',
  category: 'actor',
  occurredMs: T0 + 5 * MINUTE,
  createdBy: 'analyst',
  data: { title: 'User pasted ClickFix command', occurredAt: iso(T0 + 5 * MINUTE) },
};

const model = buildTimelineModel({
  createdAtMs: T0,
  createdBy: 'analyst',
  closedAtMs: T0 + 30 * MINUTE,
  statusChanges: [{ status: CaseStatuses.closed, atMs: T0 + 30 * MINUTE, user: 'analyst' }],
  alerts: [alert],
  entries: [entry],
  nowMs: T0 + 60 * MINUTE,
  showAllRules: false,
});

const renderRenderer = () => {
  const handlers = {
    onBrush: jest.fn(),
    onAlertClick: jest.fn(),
    onCellClick: jest.fn(),
    onEntryClick: jest.fn(),
  };
  renderWithTestingProviders(
    <ElasticChartsRenderer model={model} window={model.window} {...handlers} />
  );
  return handlers;
};

describe('ElasticChartsRenderer', () => {
  it('draws one lane row per entry category and per rule', () => {
    renderRenderer();

    expect(screen.getByTestId('incident-timeline-entry-row-actor')).toBeInTheDocument();
    expect(screen.getAllByTestId('incident-timeline-alert-row')).toHaveLength(1);
    expect(screen.getByTestId('incidentTimelineAlertCount')).toHaveTextContent('1 alert');
  });

  it('selects an entry from its flag with the keyboard', async () => {
    const { onEntryClick } = renderRenderer();

    act(() => screen.getByRole('button', { name: 'User pasted ClickFix command' }).focus());
    await userEvent.keyboard('{Enter}');

    expect(onEntryClick).toHaveBeenCalledWith(entry);
  });
});
