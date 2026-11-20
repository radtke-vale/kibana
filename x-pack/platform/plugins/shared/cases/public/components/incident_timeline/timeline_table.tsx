/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useMemo } from 'react';
import type { EuiBasicTableColumn, EuiSearchBarProps } from '@elastic/eui';
import { EuiBadge, EuiInMemoryTable, EuiText } from '@elastic/eui';
import type { IncidentTimelineAlert } from '../../../common/types/api';
import type { TimeFormat } from './format';
import { formatRange, formatTime, useTimeFormat } from './format';
import type { TimelineEntry, TimelineEvent } from './model';
import { ViewAlertAction } from './selection_bar';
import * as i18n from './translations';

export interface TimelineTableProps {
  events: TimelineEvent[];
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  onMarkAsSignificant: (alert: IncidentTimelineAlert, ruleName: string) => void;
  onEditEntry: (entry: TimelineEntry) => void;
  onDeleteEntry: (entry: TimelineEntry) => void;
}

const EVENT_LABELS: Record<TimelineEvent['kind'], string> = {
  status: i18n.EVENT_STATUS,
  entry: i18n.EVENT_ENTRY,
  alert: i18n.EVENT_ALERT,
};

const TIME_SOURCE_LABELS: Record<IncidentTimelineAlert['timeSource'], string> = {
  original_time: i18n.TIME_SOURCE_EVENT,
  sequence_start: i18n.TIME_SOURCE_SEQUENCE_START,
  timestamp: i18n.TIME_SOURCE_WRITE,
};

const Details: React.FC<{ event: TimelineEvent; format: TimeFormat }> = ({ event, format }) => {
  if (event.kind === 'status') {
    const { marker } = event;
    return (
      <EuiText size="s">
        {i18n.MARKER_LABELS[marker.kind]} {i18n.BY_USER(marker.user)}
        {marker.source ? ` ${i18n.VIA_SOURCE(marker.source)}` : ''}
      </EuiText>
    );
  }
  if (event.kind === 'entry') {
    const { entry } = event;
    return (
      <EuiText size="s">
        <EuiBadge color="hollow">{i18n.CATEGORY_LABELS[entry.category]}</EuiBadge>{' '}
        <strong>{entry.data.title}</strong>
        {entry.endMs !== undefined && (
          <div>{formatRange(entry.occurredMs, entry.endMs, format)}</div>
        )}
        <div>{i18n.BY_USER(entry.createdBy)}</div>
      </EuiText>
    );
  }
  const { alert, ruleName } = event;
  return (
    <EuiText size="s">
      {ruleName}
      {alert.severity && <div>{`${i18n.SEVERITY}: ${alert.severity}`}</div>}
    </EuiText>
  );
};

const SEARCH: EuiSearchBarProps = {
  box: { incremental: true },
  filters: [
    {
      type: 'field_value_selection',
      field: 'kind',
      name: i18n.COLUMN_EVENT,
      multiSelect: 'or',
      options: (Object.keys(EVENT_LABELS) as Array<TimelineEvent['kind']>).map((kind) => ({
        value: kind,
        name: EVENT_LABELS[kind],
      })),
    },
  ],
};

const isEntry = (event: TimelineEvent): event is Extract<TimelineEvent, { kind: 'entry' }> =>
  event.kind === 'entry';
const isAlert = (event: TimelineEvent): event is Extract<TimelineEvent, { kind: 'alert' }> =>
  event.kind === 'alert';

/** Every event as a keyboard-operable table, the accessible alternative to the chart. */
export const TimelineTable: React.FC<TimelineTableProps> = ({
  events,
  canCreate,
  canUpdate,
  canDelete,
  onMarkAsSignificant,
  onEditEntry,
  onDeleteEntry,
}) => {
  const format = useTimeFormat();

  const columns = useMemo<Array<EuiBasicTableColumn<TimelineEvent>>>(
    () => [
      {
        field: 'atMs',
        name: i18n.COLUMN_TIME,
        width: '190px',
        sortable: true,
        render: (atMs: number) => formatTime(atMs, format),
      },
      {
        field: 'kind',
        name: i18n.COLUMN_EVENT,
        width: '110px',
        render: (kind: TimelineEvent['kind']) => EVENT_LABELS[kind],
      },
      {
        name: i18n.COLUMN_DETAILS,
        render: (event: TimelineEvent) => <Details event={event} format={format} />,
      },
      {
        name: i18n.COLUMN_TIME_SOURCE,
        width: '130px',
        render: (event: TimelineEvent) =>
          isAlert(event) ? TIME_SOURCE_LABELS[event.alert.timeSource] : null,
      },
      {
        name: i18n.COLUMN_HOST,
        render: (event: TimelineEvent) =>
          isAlert(event) ? event.alert.hostNames.join(', ') : null,
      },
      {
        name: i18n.COLUMN_USER,
        render: (event: TimelineEvent) =>
          isAlert(event) ? event.alert.userNames.join(', ') : null,
      },
      {
        name: i18n.COLUMN_ACTIONS,
        width: '200px',
        actions: [
          {
            available: isAlert,
            render: (event: TimelineEvent) =>
              isAlert(event) ? (
                <ViewAlertAction alertId={event.alert.id} index={event.alert.index} />
              ) : (
                <></>
              ),
          },
          {
            type: 'button',
            name: i18n.MARK_AS_SIGNIFICANT,
            description: (event: TimelineEvent) =>
              isAlert(event)
                ? i18n.MARK_AS_SIGNIFICANT_ARIA(event.ruleName, formatTime(event.atMs, format))
                : '',
            available: (event: TimelineEvent) => canCreate && isAlert(event),
            onClick: (event: TimelineEvent) => {
              if (isAlert(event)) onMarkAsSignificant(event.alert, event.ruleName);
            },
            'data-test-subj': 'incident-timeline-table-mark-significant',
          },
          {
            type: 'icon',
            name: i18n.EDIT,
            description: (event: TimelineEvent) =>
              isEntry(event) ? i18n.EDIT_ENTRY_ARIA(event.entry.data.title) : '',
            icon: 'pencil',
            available: (event: TimelineEvent) => canUpdate && isEntry(event),
            onClick: (event: TimelineEvent) => {
              if (isEntry(event)) onEditEntry(event.entry);
            },
            'data-test-subj': 'incident-timeline-table-entry-edit',
          },
          {
            type: 'icon',
            name: i18n.DELETE,
            description: (event: TimelineEvent) =>
              isEntry(event) ? i18n.DELETE_ENTRY_ARIA(event.entry.data.title) : '',
            icon: 'trash',
            color: 'danger',
            available: (event: TimelineEvent) => canDelete && isEntry(event),
            onClick: (event: TimelineEvent) => {
              if (isEntry(event)) onDeleteEntry(event.entry);
            },
            'data-test-subj': 'incident-timeline-table-entry-delete',
          },
        ],
      },
    ],
    [format, canCreate, canUpdate, canDelete, onMarkAsSignificant, onEditEntry, onDeleteEntry]
  );

  return (
    <EuiInMemoryTable<TimelineEvent>
      tableCaption={i18n.TABLE_CAPTION}
      items={events}
      itemId="id"
      columns={columns}
      search={SEARCH}
      sorting={{ sort: { field: 'atMs', direction: 'asc' } }}
      pagination={{ initialPageSize: 25, pageSizeOptions: [25, 50, 100] }}
      rowProps={(event) => ({ 'data-test-subj': `incident-timeline-table-row-${event.kind}` })}
      data-test-subj="incident-timeline-table"
    />
  );
};

Details.displayName = 'Details';
TimelineTable.displayName = 'TimelineTable';
