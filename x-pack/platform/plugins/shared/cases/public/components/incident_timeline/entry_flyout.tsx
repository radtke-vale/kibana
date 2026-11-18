/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useState } from 'react';
import moment from 'moment-timezone';
import type { Moment } from 'moment-timezone';
import {
  EuiButton,
  EuiButtonEmpty,
  EuiDatePicker,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutFooter,
  EuiFlyoutHeader,
  EuiForm,
  EuiFormRow,
  EuiMarkdownEditor,
  EuiSelect,
  EuiTitle,
  useGeneratedHtmlId,
} from '@elastic/eui';
import type {
  IncidentTimelineEntryCategory,
  IncidentTimelineEntryData,
} from '../../../common/types/domain/attachment/incident_timeline_entry/v2';
import {
  INCIDENT_TIMELINE_ENTRY_CATEGORIES,
  IncidentTimelineEntryDataSchema,
  MAX_INCIDENT_TIMELINE_ENTRY_CONTENT_LENGTH,
  MAX_INCIDENT_TIMELINE_ENTRY_TITLE_LENGTH,
} from '../../../common/types/domain/attachment/incident_timeline_entry/v2';
import { useTimeZone } from '../../common/lib/kibana';
import * as i18n from './translations';

export interface EntryFlyoutProps {
  /** Values the form starts from: an existing entry, or a prefill from an alert. */
  initial: Partial<IncidentTimelineEntryData>;
  isEdit: boolean;
  isSubmitting: boolean;
  onSubmit: (data: IncidentTimelineEntryData) => void;
  onClose: () => void;
}

const toMoment = (iso: string | undefined, timeZone: string): Moment | null =>
  iso ? moment.tz(iso, timeZone) : null;

export const EntryFlyout: React.FC<EntryFlyoutProps> = ({
  initial,
  isEdit,
  isSubmitting,
  onSubmit,
  onClose,
}) => {
  const timeZone = useTimeZone();
  const titleId = useGeneratedHtmlId({ prefix: 'incidentTimelineEntryFlyout' });
  const [title, setTitle] = useState(initial.title ?? '');
  const [occurredAt, setOccurredAt] = useState<Moment | null>(
    toMoment(initial.occurredAt, timeZone) ?? moment.tz(timeZone)
  );
  const [endAt, setEndAt] = useState<Moment | null>(toMoment(initial.endAt, timeZone));
  const [category, setCategory] = useState<IncidentTimelineEntryCategory | ''>(
    initial.category ?? ''
  );
  const [content, setContent] = useState(initial.content ?? '');
  const [submitted, setSubmitted] = useState(false);

  const titleError = (() => {
    if (title.trim().length === 0) return i18n.TITLE_REQUIRED;
    if (title.length > MAX_INCIDENT_TIMELINE_ENTRY_TITLE_LENGTH) {
      return i18n.TOO_LONG(MAX_INCIDENT_TIMELINE_ENTRY_TITLE_LENGTH);
    }
    return undefined;
  })();
  const endError =
    endAt && occurredAt && endAt.valueOf() < occurredAt.valueOf()
      ? i18n.END_BEFORE_START
      : undefined;
  const contentError =
    content.length > MAX_INCIDENT_TIMELINE_ENTRY_CONTENT_LENGTH
      ? i18n.TOO_LONG(MAX_INCIDENT_TIMELINE_ENTRY_CONTENT_LENGTH)
      : undefined;

  const handleSubmit = () => {
    setSubmitted(true);
    if (!occurredAt || titleError || endError || contentError) return;
    const parsed = IncidentTimelineEntryDataSchema.safeParse({
      title: title.trim(),
      occurredAt: occurredAt.toISOString(),
      ...(endAt ? { endAt: endAt.toISOString() } : {}),
      ...(category ? { category } : {}),
      ...(content.trim() ? { content } : {}),
      ...(initial.alert ? { alert: initial.alert } : {}),
    });
    if (parsed.success) onSubmit(parsed.data);
  };

  return (
    <EuiFlyout
      onClose={onClose}
      size="s"
      aria-labelledby={titleId}
      data-test-subj="incident-timeline-entry-flyout"
    >
      <EuiFlyoutHeader hasBorder>
        <EuiTitle size="s">
          <h2 id={titleId}>{isEdit ? i18n.EDIT_ENTRY_TITLE : i18n.ADD_ENTRY_TITLE}</h2>
        </EuiTitle>
      </EuiFlyoutHeader>
      <EuiFlyoutBody>
        <EuiForm component="form" onSubmit={(e) => e.preventDefault()}>
          <EuiFormRow
            label={i18n.FIELD_TITLE}
            isInvalid={submitted && titleError !== undefined}
            error={titleError}
            fullWidth
          >
            <EuiFieldText
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              isInvalid={submitted && titleError !== undefined}
              fullWidth
              data-test-subj="incident-timeline-entry-title"
            />
          </EuiFormRow>
          <EuiFormRow
            label={i18n.FIELD_OCCURRED_AT}
            helpText={i18n.TIME_ZONE_HELP(timeZone)}
            fullWidth
          >
            <EuiDatePicker
              selected={occurredAt}
              onChange={setOccurredAt}
              showTimeSelect
              timeFormat="HH:mm"
              dateFormat="MMM D, YYYY HH:mm:ss"
              fullWidth
              data-test-subj="incident-timeline-entry-occurred-at"
            />
          </EuiFormRow>
          <EuiFormRow
            label={i18n.FIELD_END}
            helpText={i18n.FIELD_END_HELP}
            isInvalid={endError !== undefined}
            error={endError}
            fullWidth
          >
            <EuiDatePicker
              selected={endAt}
              onChange={setEndAt}
              onClear={() => setEndAt(null)}
              showTimeSelect
              timeFormat="HH:mm"
              dateFormat="MMM D, YYYY HH:mm:ss"
              isInvalid={endError !== undefined}
              fullWidth
              data-test-subj="incident-timeline-entry-end-at"
            />
          </EuiFormRow>
          <EuiFormRow label={i18n.FIELD_CATEGORY} fullWidth>
            <EuiSelect
              value={category}
              onChange={(e) => setCategory(e.target.value as IncidentTimelineEntryCategory | '')}
              options={[
                { value: '', text: i18n.CATEGORY_NONE },
                ...INCIDENT_TIMELINE_ENTRY_CATEGORIES.map((value) => ({
                  value,
                  text: i18n.CATEGORY_LABELS[value],
                })),
              ]}
              fullWidth
              data-test-subj="incident-timeline-entry-category"
            />
          </EuiFormRow>
          <EuiFormRow
            label={i18n.FIELD_TEXT}
            isInvalid={contentError !== undefined}
            error={contentError}
            fullWidth
          >
            <EuiMarkdownEditor
              aria-label={i18n.FIELD_TEXT}
              value={content}
              onChange={setContent}
              height={160}
              data-test-subj="incident-timeline-entry-text"
            />
          </EuiFormRow>
        </EuiForm>
      </EuiFlyoutBody>
      <EuiFlyoutFooter>
        <EuiFlexGroup justifyContent="spaceBetween">
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty onClick={onClose}>{i18n.CANCEL}</EuiButtonEmpty>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton
              fill
              onClick={handleSubmit}
              isLoading={isSubmitting}
              data-test-subj="incident-timeline-entry-save"
            >
              {i18n.SAVE}
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlyoutFooter>
    </EuiFlyout>
  );
};

EntryFlyout.displayName = 'EntryFlyout';
