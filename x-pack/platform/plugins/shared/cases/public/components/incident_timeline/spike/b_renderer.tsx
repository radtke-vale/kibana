/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

// SPIKE ONLY (E1 candidate B): the AlertTimelineChart shell from @kbn/alerting-v2-episodes-ui.
// The shell gives the label column, fixed 44 px rows, the 6-row scroll box and the time axis.
// Every row is a customRow, so everything inside a row is drawn here. Span colours match A.

import React, { useCallback, useMemo, useState } from 'react';
import { css } from '@emotion/react';
import type {
  AnnotationClickListener,
  BrushEndListener,
  ElementClickListener,
  Theme,
  XYChartElementEvent,
} from '@elastic/charts';
import {
  Axis,
  Chart,
  LineAnnotation,
  LineSeries,
  Position,
  RectAnnotation,
  ScaleType,
  Settings,
  Tooltip,
  getChartsTheme,
} from '@elastic/charts';
import type { EuiThemeComputed } from '@elastic/eui';
import {
  EuiBadge,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiLink,
  EuiText,
  EuiTextTruncate,
  EuiToolTip,
  useEuiTheme,
  useResizeObserver,
} from '@elastic/eui';
import type {
  AlertTimelineCustomRow,
  AlertTimelineCustomRowRenderProps,
} from '@kbn/alerting-v2-episodes-ui/alert_timeline';
import { AlertTimelineChart } from '@kbn/alerting-v2-episodes-ui/alert_timeline';
import { CaseStatuses } from '../../../../common/types/domain';
import type { IncidentTimelineAlert } from '../../../../common/types/api';
import { useTimeZone } from '../../../common/lib/kibana';
import { statuses } from '../../status/config';
import type {
  AlertCell,
  AlertRow,
  CaseMarker,
  CaseMarkerKind,
  CaseSpan,
  EntryRow,
  TimeWindow,
  TimelineEntry,
} from '../model';
import { TIMELINE_DENSITY, renderAlertRow } from '../model';
import { formatDuration, formatRange, formatTime } from '../format';
import * as i18n from '../translations';
import type { TimelineRendererProps } from '../renderer/types';
import type { SpikeVariants } from './spike_hook';

const LABEL_WIDTH = 300;
const RECT_Y0 = 0.375;
const RECT_Y1 = 0.625;
const DOT_RADIUS = 4.5;
const PAD_X = DOT_RADIUS + 1;
const FLAG_PX = 16;
const MIN_LABEL_PX = 24;

const severityColor = (euiTheme: EuiThemeComputed, severity?: string): string => {
  const { severity: colors } = euiTheme.colors;
  if (severity === 'critical') return colors.danger;
  if (severity === 'high') return colors.risk;
  if (severity === 'medium') return colors.warning;
  if (severity === 'low') return colors.neutral;
  return colors.unknown;
};

const spanColor = (euiTheme: EuiThemeComputed, status: CaseStatuses): string => {
  if (status === CaseStatuses.open) return euiTheme.colors.backgroundLightSuccess;
  if (status === CaseStatuses['in-progress']) return euiTheme.colors.backgroundLightPrimary;
  return euiTheme.colors.backgroundLightText;
};

const markerColor = (euiTheme: EuiThemeComputed, kind: CaseMarkerKind): string => {
  if (kind === 'closed') return euiTheme.colors.darkShade;
  if (kind === 'reopened') return euiTheme.colors.warning;
  if (kind === 'in_progress') return euiTheme.colors.primary;
  return euiTheme.colors.success;
};

const TipPanel: React.FC<{ title: React.ReactNode; children?: React.ReactNode }> = ({
  title,
  children,
}) => {
  const { euiTheme } = useEuiTheme();
  return (
    <div
      css={css`
        max-width: 280px;
        padding: ${euiTheme.size.xs} ${euiTheme.size.s};
      `}
    >
      <EuiText size="xs">
        <strong>{title}</strong>
        {children}
      </EuiText>
    </div>
  );
};

/** One custom row: an elastic-charts chart on the shell's window, with brush added here. */
const RowFrame: React.FC<{
  props: AlertTimelineCustomRowRenderProps;
  onBrush: (window: TimeWindow) => void;
  onElementClick?: ElementClickListener;
  onAnnotationClick?: AnnotationClickListener;
  tooltip?: (datum: unknown) => React.ReactNode;
  children: (widthPx: number) => React.ReactNode;
  overlay?: (widthPx: number) => React.ReactNode;
  testSubj?: string;
}> = ({ props, onBrush, onElementClick, onAnnotationClick, tooltip, children, overlay, testSubj }) => {
  const { euiTheme } = useEuiTheme();
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  const { width } = useResizeObserver(el, 'width');
  const widthPx = Math.max(width - 2 * PAD_X, 1);
  const onBrushEnd = useCallback<BrushEndListener>(
    ({ x }) => {
      const [startMs, endMs] = x ?? [];
      if (typeof startMs === 'number' && typeof endMs === 'number' && endMs > startMs) {
        onBrush({ startMs, endMs });
      }
    },
    [onBrush]
  );
  return (
    <div
      ref={setEl}
      data-test-subj={testSubj}
      css={css`
        position: relative;
        height: ${props.height}px;
        box-shadow: inset 0 1px ${euiTheme.colors.lightestShade};
      `}
    >
      <Chart size={{ height: props.height }}>
        <Settings
          showLegend={false}
          baseTheme={props.baseTheme}
          locale="en"
          xDomain={{ min: props.windowStartMs, max: props.windowEndMs }}
          onBrushEnd={onBrushEnd}
          onElementClick={onElementClick}
          onAnnotationClick={onAnnotationClick}
          theme={{
            chartMargins: { top: 0, right: 0, bottom: 0, left: 0 },
            chartPaddings: { top: 0, right: PAD_X, bottom: 0, left: PAD_X },
          }}
        />
        <Tooltip
          header="none"
          body={({ items }) => (tooltip ? tooltip(items?.[0]?.datum) : null)}
        />
        <Axis id="left" position={Position.Left} hide domain={{ min: 0, max: 1, fit: false }} />
        <LineSeries
          id="anchor"
          xScaleType={ScaleType.Time}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          data={[
            { x: props.windowStartMs, y: 0 },
            { x: props.windowEndMs, y: 1 },
          ]}
          hideInLegend
          filterSeriesInTooltip={() => false}
          lineSeriesStyle={{ line: { visible: false, opacity: 0 }, point: { visible: 'never' } }}
        />
        {children(widthPx)}
      </Chart>
      {overlay && (
        <div
          css={css`
            position: absolute;
            inset: 0 ${PAD_X}px;
            pointer-events: none;
            & > * {
              pointer-events: auto;
            }
          `}
        >
          {overlay(widthPx)}
        </div>
      )}
    </div>
  );
};

const RowLabel: React.FC<{
  lane?: React.ReactNode;
  label: string;
  count?: number | string;
  countProps?: Record<`data-${string}`, string>;
}> = ({ lane, label, count, countProps }) => (
  <div
    css={css`
      width: ${LABEL_WIDTH}px;
    `}
  >
    {lane && (
      <EuiText size="xs" color="subdued">
        <strong>{lane}</strong>
      </EuiText>
    )}
    <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
      <EuiFlexItem
        css={css`
          min-width: 0;
        `}
      >
        <EuiToolTip content={label} display="block">
          <EuiText size="xs" tabIndex={0}>
            <EuiTextTruncate text={label} />
          </EuiText>
        </EuiToolTip>
      </EuiFlexItem>
      {count !== undefined && (
        <EuiFlexItem grow={false}>
          <EuiBadge color="hollow" {...countProps}>
            {count}
          </EuiBadge>
        </EuiFlexItem>
      )}
    </EuiFlexGroup>
  </div>
);

interface MarkerDatum {
  x: number;
  y: number;
  marker: CaseMarker;
}

interface AlertDatum {
  x: number;
  y: number;
  alert: IncidentTimelineAlert;
}

const caseRow = (
  spans: readonly CaseSpan[],
  markers: readonly CaseMarker[],
  reopenCount: number,
  euiTheme: EuiThemeComputed,
  timeZone: string,
  onBrush: (window: TimeWindow) => void
): AlertTimelineCustomRow => ({
  id: 'case',
  label: (
    <RowLabel
      lane={i18n.LANE_CASE}
      label={i18n.CASE_STATUS_ROW}
      count={i18n.REOPEN_COUNT(reopenCount)}
      countProps={{ 'data-test-subj': 'incidentTimelineReopenCount' }}
    />
  ),
  render: (props) => (
    <RowFrame
      props={props}
      onBrush={onBrush}
      testSubj="incident-timeline-case-lane"
      tooltip={(datum) => {
        const marker = (datum as MarkerDatum | undefined)?.marker;
        if (!marker) return null;
        return (
          <TipPanel title={i18n.MARKER_LABELS[marker.kind]}>
            <div>
              {formatTime(marker.atMs, timeZone)} {i18n.BY_USER(marker.user)}
              {marker.source ? ` ${i18n.VIA_SOURCE(marker.source)}` : ''}
            </div>
          </TipPanel>
        );
      }}
    >
      {() => (
        <>
          {spans.map((span, index) => (
            <RectAnnotation
              key={`span-${index}`}
              id={`span-${index}`}
              dataValues={[
                { coordinates: { x0: span.startMs, x1: span.endMs, y0: RECT_Y0, y1: RECT_Y1 } },
              ]}
              style={{ fill: spanColor(euiTheme, span.status), opacity: 1, strokeWidth: 0 }}
              customTooltip={() => (
                <TipPanel title={statuses[span.status].label}>
                  <div>{formatRange(span.startMs, span.endMs, timeZone)}</div>
                  <div>
                    {i18n.DURATION}: {formatDuration(span.endMs - span.startMs)}
                  </div>
                </TipPanel>
              )}
            />
          ))}
          <LineSeries
            id="case-markers"
            xScaleType={ScaleType.Time}
            yScaleType={ScaleType.Linear}
            timeZone={timeZone}
            xAccessor="x"
            yAccessors={['y']}
            data={markers.map<MarkerDatum>((marker) => ({ x: marker.atMs, y: 0.5, marker }))}
            hideInLegend
            lineSeriesStyle={{
              line: { visible: false, opacity: 0 },
              point: {
                visible: 'always',
                radius: DOT_RADIUS,
                fill: euiTheme.colors.emptyShade,
                strokeWidth: 2,
              },
            }}
            pointStyleAccessor={(datum) => ({
              stroke: markerColor(euiTheme, (datum.datum as MarkerDatum).marker.kind),
            })}
          />
        </>
      )}
    </RowFrame>
  ),
});

const EntryLabels: React.FC<{
  row: EntryRow;
  window: TimeWindow;
  widthPx: number;
  selectedId?: string;
  onEntryClick: (entry: TimelineEntry) => void;
}> = ({ row, window, widthPx, selectedId, onEntryClick }) => {
  const pxPerMs = widthPx / (window.endMs - window.startMs);
  const xs = row.entries.map(({ occurredMs }) => (occurredMs - window.startMs) * pxPerMs);
  return (
    <>
      {row.entries.map((entry, i) => {
        const x = xs[i];
        if (x < 0 || x > widthPx) return null;
        const room = Math.min(xs[i + 1] ?? widthPx, widthPx) - x - 12;
        const showLabel = room >= MIN_LABEL_PX;
        const width = (showLabel ? room : 0) + FLAG_PX;
        return (
          <div
            key={entry.id}
            data-test-subj="spike-entry-label"
            data-label-shown={showLabel}
            css={css`
              position: absolute;
              top: 4px;
              left: ${x - FLAG_PX / 2}px;
              width: ${width}px;
            `}
          >
            <EuiLink
              color="text"
              onClick={() => onEntryClick(entry)}
              aria-label={entry.data.title}
              data-test-subj="incident-timeline-entry-marker"
              css={css`
                display: flex;
                align-items: center;
                gap: 4px;
                width: 100%;
              `}
            >
              <EuiIcon
                type="flag"
                size="s"
                color={entry.id === selectedId ? 'primary' : 'accent'}
                aria-hidden={true}
              />
              {showLabel && (
                <EuiText size="xs" className="eui-textTruncate">
                  {entry.data.title}
                </EuiText>
              )}
            </EuiLink>
          </div>
        );
      })}
    </>
  );
};

const entryRow = (
  row: EntryRow,
  first: boolean,
  euiTheme: EuiThemeComputed,
  selectedId: string | undefined,
  onBrush: (window: TimeWindow) => void,
  onEntryClick: (entry: TimelineEntry) => void
): AlertTimelineCustomRow => ({
  id: `entries-${row.category}`,
  label: (
    <RowLabel
      lane={first ? i18n.LANE_ENTRIES : undefined}
      label={i18n.CATEGORY_LABELS[row.category]}
      count={row.entries.length}
    />
  ),
  render: (props) => (
    <RowFrame
      props={props}
      onBrush={onBrush}
      testSubj={`incident-timeline-entry-row-${row.category}`}
      overlay={(widthPx) => (
        <EntryLabels
          row={row}
          window={{ startMs: props.windowStartMs, endMs: props.windowEndMs }}
          widthPx={widthPx}
          selectedId={selectedId}
          onEntryClick={onEntryClick}
        />
      )}
    >
      {() =>
        row.entries.map((entry) => {
          const color = entry.id === selectedId ? euiTheme.colors.primary : euiTheme.colors.accent;
          return (
            <React.Fragment key={entry.id}>
              {entry.endMs !== undefined && (
                <RectAnnotation
                  id={`range-${entry.id}`}
                  dataValues={[
                    {
                      coordinates: {
                        x0: entry.occurredMs,
                        x1: entry.endMs,
                        y0: RECT_Y0 - 0.25,
                        y1: RECT_Y1 - 0.25,
                      },
                    },
                  ]}
                  style={{ fill: color, opacity: 0.5, strokeWidth: 0 }}
                />
              )}
              <LineAnnotation
                id={`entry-${entry.id}`}
                domainType="xDomain"
                dataValues={[{ dataValue: entry.occurredMs }]}
                style={{ line: { stroke: color, strokeWidth: 2, opacity: 1 } }}
              />
            </React.Fragment>
          );
        })
      }
    </RowFrame>
  ),
});

const AlertRowContent: React.FC<{
  row: AlertRow;
  props: AlertTimelineCustomRowRenderProps;
  selectedAlertId?: string;
  timeZone: string;
  onBrush: (window: TimeWindow) => void;
  onAlertClick: (alert: IncidentTimelineAlert, ruleName: string) => void;
  onCellClick: (cell: AlertCell) => void;
}> = ({ row, props, selectedAlertId, timeZone, onBrush, onAlertClick, onCellClick }) => {
  const { euiTheme } = useEuiTheme();
  const window = { startMs: props.windowStartMs, endMs: props.windowEndMs };
  const onElementClick = useCallback<ElementClickListener>(
    (elements) => {
      const [geometry] = elements[0] as XYChartElementEvent;
      const datum = geometry.datum as AlertDatum | undefined;
      if (datum?.alert) onAlertClick(datum.alert, row.ruleName);
    },
    [onAlertClick, row.ruleName]
  );
  const onAnnotationClick = useCallback<AnnotationClickListener>(
    ({ rects }) => {
      const details = rects[0]?.datum.details;
      if (details) onCellClick(JSON.parse(details) as AlertCell);
    },
    [onCellClick]
  );

  return (
    <RowFrame
      props={props}
      onBrush={onBrush}
      onElementClick={onElementClick}
      onAnnotationClick={onAnnotationClick}
      testSubj="incident-timeline-alert-row"
      tooltip={(datum) => {
        const alert = (datum as AlertDatum | undefined)?.alert;
        if (!alert) return null;
        return (
          <TipPanel title={row.ruleName}>
            <div>
              {i18n.ALERT_TIME}: {formatTime(Date.parse(alert.time), timeZone)}
            </div>
            {alert.hostNames.length > 0 && (
              <div>
                {i18n.HOSTS}: {alert.hostNames.join(', ')}
              </div>
            )}
            {alert.userNames.length > 0 && (
              <div>
                {i18n.USERS}: {alert.userNames.join(', ')}
              </div>
            )}
            {alert.severity && (
              <div>
                {i18n.SEVERITY}: {alert.severity}
              </div>
            )}
          </TipPanel>
        );
      }}
      overlay={(widthPx) => {
        const rendering = renderAlertRow(row, window, widthPx, TIMELINE_DENSITY);
        if (rendering.kind !== 'cells') return null;
        const pxPerMs = widthPx / (window.endMs - window.startMs);
        const maxCount = Math.max(...rendering.cells.map(({ count }) => count));
        return rendering.cells.map((cell) => {
          const left = (cell.startMs - window.startMs) * pxPerMs;
          const cellWidth = (cell.endMs - cell.startMs) * pxPerMs;
          if (cellWidth < 14 || left < 0 || left + cellWidth > widthPx) return null;
          return (
            <span
              key={cell.startMs}
              css={css`
                position: absolute;
                top: 0;
                left: ${left}px;
                width: ${cellWidth}px;
                line-height: ${props.height}px;
                text-align: center;
                font-size: 12px;
                pointer-events: none;
                color: ${cell.count / maxCount > 0.5
                  ? euiTheme.colors.textInverse
                  : euiTheme.colors.textParagraph};
              `}
            >
              {cell.count}
            </span>
          );
        });
      }}
    >
      {(widthPx) => {
        const rendering = renderAlertRow(row, window, widthPx, TIMELINE_DENSITY);
        if (rendering.kind === 'cells') {
          const maxCount = Math.max(...rendering.cells.map(({ count }) => count));
          return rendering.cells.map((cell, index) => (
            <RectAnnotation
              key={`cell-${index}`}
              id={`cell-${index}`}
              dataValues={[
                {
                  coordinates: { x0: cell.startMs, x1: cell.endMs, y0: 0.15, y1: 0.85 },
                  details: JSON.stringify(cell),
                },
              ]}
              style={{
                fill: euiTheme.colors.vis.euiColorVis0,
                opacity: 0.25 + 0.75 * (cell.count / maxCount),
                stroke: euiTheme.colors.emptyShade,
                strokeWidth: 1,
              }}
              customTooltip={() => (
                <TipPanel title={row.ruleName}>
                  <div>{formatRange(cell.startMs, cell.endMs, timeZone)}</div>
                  <div>{i18n.ALERT_COUNT(cell.count)}</div>
                </TipPanel>
              )}
            />
          ));
        }
        const slots = TIMELINE_DENSITY.pointStackSlots;
        const data = rendering.points.map<AlertDatum>(({ alert, timeMs, stack }) => ({
          x: timeMs,
          y: 0.5 + (stack - (slots - 1) / 2) * 0.22,
          alert,
        }));
        return (
          <LineSeries
            id="alerts"
            xScaleType={ScaleType.Time}
            yScaleType={ScaleType.Linear}
            timeZone={timeZone}
            xAccessor="x"
            yAccessors={['y']}
            data={data}
            hideInLegend
            lineSeriesStyle={{
              line: { visible: false, opacity: 0 },
              point: {
                visible: 'always',
                radius: DOT_RADIUS,
                fill: euiTheme.colors.emptyShade,
                strokeWidth: 2,
              },
            }}
            pointStyleAccessor={(datum) => {
              const { alert } = datum.datum as AlertDatum;
              return {
                stroke: severityColor(euiTheme, alert.severity),
                fill: alert.id === selectedAlertId ? euiTheme.colors.textParagraph : undefined,
              };
            }}
          />
        );
      }}
    </RowFrame>
  );
};

/** Candidate B: the alerting-v2 AlertTimelineChart shell with every row a customRow. */
export const BRenderer: React.FC<TimelineRendererProps & SpikeVariants> = ({
  model,
  window,
  selection,
  alertsPlaceholder,
  onBrush,
  onAlertClick,
  onCellClick,
  onEntryClick,
}) => {
  const { euiTheme, colorMode } = useEuiTheme();
  const timeZone = useTimeZone();
  const baseTheme: Theme = useMemo(
    () => getChartsTheme(euiTheme.themeName, colorMode),
    [euiTheme.themeName, colorMode]
  );
  const selectedAlertId = selection?.kind === 'alert' ? selection.alert.id : undefined;
  const selectedEntryId = selection?.kind === 'entry' ? selection.entry.id : undefined;

  const customRows: AlertTimelineCustomRow[] = [
    caseRow(
      model.caseLane.spans,
      model.caseLane.markers,
      model.reopenCount,
      euiTheme,
      timeZone,
      onBrush
    ),
    ...model.entryRows.map((row, i) =>
      entryRow(row, i === 0, euiTheme, selectedEntryId, onBrush, onEntryClick)
    ),
    ...(alertsPlaceholder !== undefined
      ? []
      : model.alertRows.map<AlertTimelineCustomRow>((row, i) => ({
          id: `alerts-${row.ruleId}`,
          label: (
            <RowLabel
              lane={
                i === 0 ? (
                  <>
                    {i18n.LANE_ALERTS}{' '}
                    <EuiBadge color="hollow" data-test-subj="incidentTimelineAlertCount">
                      {i18n.ALERT_COUNT(model.alertCount)}
                    </EuiBadge>
                  </>
                ) : undefined
              }
              label={row.ruleName}
              count={row.alerts.length}
              countProps={{
                'data-test-subj': 'incidentTimelineRuleRowCount',
                'data-rule-id': row.ruleId,
              }}
            />
          ),
          render: (props) => (
            <AlertRowContent
              row={row}
              props={props}
              selectedAlertId={selectedAlertId}
              timeZone={timeZone}
              onBrush={onBrush}
              onAlertClick={onAlertClick}
              onCellClick={onCellClick}
            />
          ),
        }))),
  ];

  return (
    <div data-test-subj="incident-timeline-renderer-b">
      <AlertTimelineChart
        rows={[]}
        windowStartMs={window.startMs}
        windowEndMs={window.endMs}
        baseTheme={baseTheme}
        timeZone={timeZone}
        customRows={customRows}
        labelColumnWidth={LABEL_WIDTH}
      />
      {alertsPlaceholder}
    </div>
  );
};

TipPanel.displayName = 'TipPanel';
RowFrame.displayName = 'RowFrame';
RowLabel.displayName = 'RowLabel';
EntryLabels.displayName = 'EntryLabels';
AlertRowContent.displayName = 'AlertRowContent';
BRenderer.displayName = 'BRenderer';
