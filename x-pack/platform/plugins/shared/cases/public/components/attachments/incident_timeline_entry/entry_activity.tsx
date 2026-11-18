/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import {
  EuiBadge,
  EuiButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiMarkdownFormat,
  EuiText,
} from '@elastic/eui';
import type { IncidentTimelineEntryData } from '../../../../common/types/domain/attachment/incident_timeline_entry/v2';
import type { UnifiedValueAttachmentViewProps } from '../../../client/attachment_framework/types';
import { useTimeZone } from '../../../common/lib/kibana';
import { formatRange, formatTime } from '../../incident_timeline/format';
import { useIncidentTimelineFocus } from '../../incident_timeline/focus_context';
import * as i18n from '../../incident_timeline/translations';

export type EntryViewProps = UnifiedValueAttachmentViewProps<IncidentTimelineEntryData>;

export const EntryActivityBody: React.FC<EntryViewProps> = ({ data }) => {
  const timeZone = useTimeZone();
  const occurredMs = Date.parse(data.occurredAt);
  return (
    <EuiFlexGroup
      direction="column"
      gutterSize="xs"
      data-test-subj="incident-timeline-entry-activity"
    >
      <EuiFlexItem>
        <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
          <EuiFlexItem grow={false}>
            <EuiBadge color="hollow">
              {i18n.CATEGORY_LABELS[data.category ?? 'uncategorized']}
            </EuiBadge>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiText size="s" color="subdued">
              {data.endAt
                ? formatRange(occurredMs, Date.parse(data.endAt), timeZone)
                : formatTime(occurredMs, timeZone)}
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlexItem>
      <EuiFlexItem>
        <EuiText size="s">
          <strong>{data.title}</strong>
        </EuiText>
      </EuiFlexItem>
      {data.content && (
        <EuiFlexItem>
          <EuiMarkdownFormat textSize="s">{data.content}</EuiMarkdownFormat>
        </EuiFlexItem>
      )}
    </EuiFlexGroup>
  );
};

export const EntryActivityActions: React.FC<{ entryId: string; canUpdate: boolean }> = ({
  entryId,
  canUpdate,
}) => {
  const focus = useIncidentTimelineFocus();
  if (!focus) return null;
  return (
    <EuiFlexGroup gutterSize="xs" responsive={false}>
      {canUpdate && (
        <EuiFlexItem grow={false}>
          <EuiButtonEmpty
            size="xs"
            iconType="pencil"
            onClick={() => focus.focusEntry({ entryId, intent: 'edit' })}
            data-test-subj="incident-timeline-entry-activity-edit"
          >
            {i18n.EDIT}
          </EuiButtonEmpty>
        </EuiFlexItem>
      )}
      <EuiFlexItem grow={false}>
        <EuiButtonEmpty
          size="xs"
          iconType="eye"
          onClick={() => focus.focusEntry({ entryId, intent: 'show' })}
          data-test-subj="incident-timeline-entry-activity-show"
        >
          {i18n.SHOW_ON_TIMELINE}
        </EuiButtonEmpty>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

EntryActivityBody.displayName = 'EntryActivityBody';
EntryActivityActions.displayName = 'EntryActivityActions';
