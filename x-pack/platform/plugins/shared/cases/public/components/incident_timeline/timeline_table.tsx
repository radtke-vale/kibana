/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useMemo } from 'react';
import type { EuiBasicTableColumn } from '@elastic/eui';
import {
  EuiBadge,
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiInMemoryTable,
  EuiText,
  EuiToolTip,
} from '@elastic/eui';
import type { IncidentTimelineAlert } from '../../../common/types/api';
import { useTimeZone } from '../../common/lib/kibana';
import { formatRange, formatTime } from './format';
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

const Details: React.FC<{ event: TimelineEvent; timeZone: string }> = ({ event, timeZone }) => {
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
          <div>{formatRange(entry.occurredMs, entry.endMs, timeZone)}</div>
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
  const timeZone = useTimeZone();

  const columns = useMemo<Array<EuiBasicTableColumn<TimelineEvent>>>(
    () => [
      {
        field: 'atMs',
        name: i18n.COLUMN_TIME,
        width: '170px',
        render: (atMs: number) => formatTime(atMs, timeZone),
      },
      {
        field: 'kind',
        name: i18n.COLUMN_EVENT,
        width: '110px',
        render: (kind: TimelineEvent['kind']) => EVENT_LABELS[kind],
      },
      {
        name: i18n.COLUMN_DETAILS,
        render: (event: TimelineEvent) => <Details event={event} timeZone={timeZone} />,
      },
      {
        name: i18n.COLUMN_TIME_SOURCE,
        width: '130px',
        render: (event: TimelineEvent) => {
          if (event.kind !== 'alert') return null;
          return TIME_SOURCE_LABELS[event.alert.timeSource];
        },
      },
      {
        name: i18n.COLUMN_HOST,
        render: (event: TimelineEvent) =>
          event.kind === 'alert' ? event.alert.hostNames.join(', ') : null,
      },
      {
        name: i18n.COLUMN_USER,
        render: (event: TimelineEvent) =>
          event.kind === 'alert' ? event.alert.userNames.join(', ') : null,
      },
      {
        name: i18n.COLUMN_ACTIONS,
        width: '200px',
        render: (event: TimelineEvent) => {
          if (event.kind === 'alert') {
            const { alert, ruleName } = event;
            return (
              <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
                <ViewAlertAction alertId={alert.id} index={alert.index} />
                {canCreate && (
                  <EuiFlexItem grow={false}>
                    <EuiButtonEmpty
                      size="xs"
                      iconType="flag"
                      onClick={() => onMarkAsSignificant(alert, ruleName)}
                      aria-label={i18n.MARK_AS_SIGNIFICANT_ARIA(
                        ruleName,
                        formatTime(event.atMs, timeZone)
                      )}
                      data-test-subj="incident-timeline-table-mark-significant"
                    >
                      {i18n.MARK_AS_SIGNIFICANT}
                    </EuiButtonEmpty>
                  </EuiFlexItem>
                )}
              </EuiFlexGroup>
            );
          }
          if (event.kind === 'entry') {
            const { entry } = event;
            return (
              <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
                {canUpdate && (
                  <EuiFlexItem grow={false}>
                    <EuiToolTip content={i18n.EDIT} disableScreenReaderOutput>
                      <EuiButtonIcon
                        iconType="pencil"
                        aria-label={i18n.EDIT_ENTRY_ARIA(entry.data.title)}
                        onClick={() => onEditEntry(entry)}
                        data-test-subj="incident-timeline-table-entry-edit"
                      />
                    </EuiToolTip>
                  </EuiFlexItem>
                )}
                {canDelete && (
                  <EuiFlexItem grow={false}>
                    <EuiToolTip content={i18n.DELETE} disableScreenReaderOutput>
                      <EuiButtonIcon
                        iconType="trash"
                        color="danger"
                        aria-label={i18n.DELETE_ENTRY_ARIA(entry.data.title)}
                        onClick={() => onDeleteEntry(entry)}
                        data-test-subj="incident-timeline-table-entry-delete"
                      />
                    </EuiToolTip>
                  </EuiFlexItem>
                )}
              </EuiFlexGroup>
            );
          }
          return null;
        },
      },
    ],
    [timeZone, canCreate, canUpdate, canDelete, onMarkAsSignificant, onEditEntry, onDeleteEntry]
  );

  return (
    <EuiInMemoryTable<TimelineEvent>
      tableCaption={i18n.TABLE_CAPTION}
      items={events}
      itemId="id"
      columns={columns}
      pagination={{ initialPageSize: 25, pageSizeOptions: [25, 50, 100] }}
      rowProps={(event) => ({ 'data-test-subj': `incident-timeline-table-row-${event.kind}` })}
      data-test-subj="incident-timeline-table"
    />
  );
};

Details.displayName = 'Details';
TimelineTable.displayName = 'TimelineTable';
