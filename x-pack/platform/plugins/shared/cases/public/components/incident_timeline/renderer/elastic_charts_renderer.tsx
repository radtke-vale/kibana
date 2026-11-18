/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { css } from '@emotion/react';
import type {
  AnnotationClickListener,
  BrushEndListener,
  CustomTooltip,
  ElementClickListener,
  PartialTheme,
  Theme,
  XYChartElementEvent,
} from '@elastic/charts';
import {
  Axis,
  BubbleSeries,
  Chart,
  LineAnnotation,
  LineSeries,
  Position,
  RectAnnotation,
  ScaleType,
  Settings,
  Tooltip,
  TooltipType,
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
  EuiTextBlockTruncate,
  EuiTitle,
  EuiToolTip,
  useEuiTheme,
  useResizeObserver,
} from '@elastic/eui';
import { CaseStatuses } from '../../../../common/types/domain';
import type { IncidentTimelineAlert } from '../../../../common/types/api';
import { useTimeZone } from '../../../common/lib/kibana';
import { statuses } from '../../status/config';
import type {
  AlertCell,
  AlertRow,
  AlertRowRendering,
  CaseMarkerGroup,
  CaseMarkerKind,
  CaseSpan,
  EntryLabelLayout,
  EntryRow,
  TimeWindow,
  TimelineEntry,
} from '../model';
import {
  ENTRY_FLAG_PX,
  TIMELINE_DENSITY,
  groupCaseMarkers,
  layoutEntryLabels,
  renderAlertRow,
} from '../model';
import { formatAxisTick, formatDuration, formatRange, formatTime } from '../format';
import * as i18n from '../translations';
import type { TimelineRendererProps } from './types';

const LABEL_WIDTH = 300;
const CASE_ROW_HEIGHT = 40;
const ENTRY_ROW_HEIGHT = 40;
const ALERT_ROW_HEIGHT = 24;
const AXIS_HEIGHT = 40;
const MIN_CELL_LABEL_PX = 14;
const ENTRY_LEVEL_PX = 20;

const ZERO_MARGINS: PartialTheme = {
  chartMargins: { top: 0, bottom: 0, left: 0, right: 0 },
  chartPaddings: { top: 0, bottom: 0, left: 0, right: 0 },
};

/** Leaves room above the row for annotation markers. */
const MARKER_ROOM: PartialTheme = {
  chartMargins: { top: 14, bottom: 0, left: 0, right: 0 },
  chartPaddings: { top: 0, bottom: 0, left: 0, right: 0 },
};

const MARKER_ICONS: Record<CaseMarkerKind, string> = {
  created: 'plusInCircle',
  in_progress: 'folderExclamation',
  opened: 'folderOpen',
  closed: 'folderCheck',
  reopened: 'refresh',
};

interface AlertPointDatum {
  x: number;
  y: number;
  alert: IncidentTimelineAlert;
}

const severityColor = (euiTheme: EuiThemeComputed, severity?: string): string => {
  const { severity: colors } = euiTheme.colors;
  switch (severity) {
    case 'critical':
      return colors.danger;
    case 'high':
      return colors.risk;
    case 'medium':
      return colors.warning;
    case 'low':
      return colors.neutral;
    default:
      return colors.unknown;
  }
};

const spanColor = (euiTheme: EuiThemeComputed, status: CaseStatuses): string => {
  if (status === CaseStatuses.open) return euiTheme.colors.backgroundLightSuccess;
  if (status === CaseStatuses['in-progress']) return euiTheme.colors.backgroundLightPrimary;
  return euiTheme.colors.backgroundLightText;
};

const markerColor = (euiTheme: EuiThemeComputed, kind: CaseMarkerKind): string => {
  if (kind === 'closed') return euiTheme.colors.borderStrongText;
  if (kind === 'reopened') return euiTheme.colors.borderStrongWarning;
  if (kind === 'in_progress') return euiTheme.colors.borderStrongPrimary;
  return euiTheme.colors.borderStrongSuccess;
};

const TooltipBox: React.FC<{ title: React.ReactNode; children?: React.ReactNode }> = ({
  title,
  children,
}) => {
  const { euiTheme } = useEuiTheme();
  return (
    <div
      css={css`
        background: ${euiTheme.colors.backgroundBasePlain};
        border: ${euiTheme.border.thin};
        border-radius: ${euiTheme.border.radius.medium};
        padding: ${euiTheme.size.s};
        max-width: 360px;
      `}
    >
      <EuiText size="xs">
        <strong>{title}</strong>
        {children}
      </EuiText>
    </div>
  );
};

const TooltipLine: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div>
    {label}
    {': '}
    {value}
  </div>
);

const distinctSummary = (values: readonly string[]): string =>
  values.length === 0 ? '0' : i18n.DISTINCT_OF(values.slice(0, 3).join(', '), values.length);

interface RowChartProps {
  id: string;
  height: number;
  window: TimeWindow;
  theme: Theme;
  timeZone: string;
  tooltip?: CustomTooltip;
  onBrush: (window: TimeWindow) => void;
  onElementClick?: ElementClickListener;
  onAnnotationClick?: AnnotationClickListener;
  yDomain?: { min: number; max: number };
  hasMarkers?: boolean;
  children?: React.ReactNode;
}

/** One lane row: a chart on the shared x domain whose own series is invisible. */
const RowChart: React.FC<RowChartProps> = ({
  id,
  height,
  window,
  theme,
  timeZone,
  tooltip,
  onBrush,
  onElementClick,
  onAnnotationClick,
  yDomain = { min: 0, max: 1 },
  hasMarkers = false,
  children,
}) => {
  const onBrushEnd = useCallback<BrushEndListener>(
    ({ x }) => {
      const [startMs, endMs] = x ?? [];
      if (typeof startMs === 'number' && typeof endMs === 'number' && endMs > startMs) {
        onBrush({ startMs, endMs });
      }
    },
    [onBrush]
  );
  const domainData = useMemo(
    () => [
      { x: window.startMs, y: yDomain.min },
      { x: window.endMs, y: yDomain.min },
    ],
    [window, yDomain.min]
  );

  return (
    <Chart size={{ height }} id={id}>
      <Settings
        baseTheme={theme}
        theme={hasMarkers ? MARKER_ROOM : ZERO_MARGINS}
        xDomain={{ min: window.startMs, max: window.endMs }}
        showLegend={false}
        onBrushEnd={onBrushEnd}
        onElementClick={onElementClick}
        onAnnotationClick={onAnnotationClick}
        locale="en"
      />
      <Tooltip
        type={tooltip ? TooltipType.Follow : TooltipType.None}
        customTooltip={tooltip}
        showNullValues={false}
      />
      <Axis
        id={`${id}-y`}
        position={Position.Left}
        hide
        domain={yDomain}
        gridLine={{ visible: false }}
      />
      <LineSeries
        id={`${id}-domain`}
        xScaleType={ScaleType.Time}
        yScaleType={ScaleType.Linear}
        timeZone={timeZone}
        xAccessor="x"
        yAccessors={['y']}
        data={domainData}
        lineSeriesStyle={{ line: { visible: false }, point: { visible: 'never' } }}
        hideInLegend
      />
      {children}
    </Chart>
  );
};

const RowLabel: React.FC<{
  label: string;
  count?: number;
  countLabel?: string;
  countProps?: Record<`data-${string}`, string>;
}> = ({ label, count, countLabel, countProps }) => (
  <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
    <EuiFlexItem
      css={css`
        min-width: 0;
      `}
    >
      <EuiToolTip content={label} display="block">
        <EuiText size="xs" tabIndex={0}>
          <EuiTextBlockTruncate lines={2}>{label}</EuiTextBlockTruncate>
        </EuiText>
      </EuiToolTip>
    </EuiFlexItem>
    {count !== undefined && (
      <EuiFlexItem grow={false}>
        <EuiBadge color="hollow" {...countProps}>
          {countLabel ?? count}
        </EuiBadge>
      </EuiFlexItem>
    )}
  </EuiFlexGroup>
);

const LaneRow: React.FC<{
  label?: React.ReactNode;
  height: number;
  chartRef?: (el: HTMLDivElement | null) => void;
  children: React.ReactNode;
  testSubj?: string;
}> = ({ label, height, chartRef, children, testSubj }) => (
  <EuiFlexGroup gutterSize="s" responsive={false} alignItems="center" data-test-subj={testSubj}>
    <EuiFlexItem
      grow={false}
      css={css`
        width: ${LABEL_WIDTH}px;
      `}
    >
      {label}
    </EuiFlexItem>
    <EuiFlexItem
      css={css`
        min-width: 0;
        height: ${height}px;
        position: relative;
      `}
    >
      <div ref={chartRef}>{children}</div>
    </EuiFlexItem>
  </EuiFlexGroup>
);

const LaneHeading: React.FC<{ title: string; badge?: React.ReactNode }> = ({ title, badge }) => (
  <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
    <EuiFlexItem grow={false}>
      <EuiTitle size="xxxs">
        <h3>{title}</h3>
      </EuiTitle>
    </EuiFlexItem>
    {badge && <EuiFlexItem grow={false}>{badge}</EuiFlexItem>}
  </EuiFlexGroup>
);

/**
 * Case status markers as an HTML overlay: `@elastic/charts` line-annotation markers are tab stops
 * named "line annotation <epoch ms>" with an `aria-describedby` to a tooltip that is not in the DOM.
 */
const CaseMarkers: React.FC<{
  groups: readonly CaseMarkerGroup[];
  window: TimeWindow;
  widthPx: number;
  timeZone: string;
}> = ({ groups, window, widthPx, timeZone }) => {
  const { euiTheme } = useEuiTheme();
  const pxPerMs = widthPx / (window.endMs - window.startMs);
  return (
    <>
      {groups.map((group) => {
        const x = (group.atMs - window.startMs) * pxPerMs;
        if (x < 0 || x > widthPx) return null;
        const [first] = group.markers;
        const merged = group.markers.length > 1;
        const title = merged
          ? i18n.MARKER_CHANGES(group.markers.length)
          : i18n.MARKER_LABELS[first.kind];
        return (
          <div
            key={group.atMs}
            data-test-subj="incident-timeline-case-marker"
            css={css`
              position: absolute;
              top: 0;
              left: ${x}px;
              transform: translateX(-50%);
              line-height: 0;
            `}
          >
            <EuiToolTip
              title={title}
              content={group.markers.map((marker, i) => (
                <div key={i}>
                  {merged && <strong>{`${i18n.MARKER_LABELS[marker.kind]} `}</strong>}
                  {formatTime(marker.atMs, timeZone)} {i18n.BY_USER(marker.user)}
                  {marker.source ? ` ${i18n.VIA_SOURCE(marker.source)}` : ''}
                </div>
              ))}
            >
              <span
                tabIndex={0}
                role="img"
                aria-label={i18n.MARKER_ARIA(title, formatTime(group.atMs, timeZone))}
              >
                {merged ? (
                  <EuiBadge color="hollow">{group.markers.length}</EuiBadge>
                ) : (
                  <EuiIcon
                    type={MARKER_ICONS[first.kind]}
                    size="s"
                    color={markerColor(euiTheme, first.kind)}
                    aria-hidden={true}
                  />
                )}
              </span>
            </EuiToolTip>
          </div>
        );
      })}
    </>
  );
};

const CaseRowChart: React.FC<{
  spans: readonly CaseSpan[];
  groups: readonly CaseMarkerGroup[];
  common: Omit<RowChartProps, 'id' | 'height'>;
  timeZone: string;
}> = ({ spans, groups, common, timeZone }) => {
  const { euiTheme } = useEuiTheme();

  return (
    <RowChart id="incident-timeline-case" height={CASE_ROW_HEIGHT} hasMarkers {...common}>
      {spans.map((span, index) => (
        <RectAnnotation
          key={`span-${index}`}
          id={`span-${index}`}
          dataValues={[{ coordinates: { x0: span.startMs, x1: span.endMs, y0: 0.25, y1: 0.75 } }]}
          style={{ fill: spanColor(euiTheme, span.status), opacity: 1, strokeWidth: 0 }}
          customTooltip={() => (
            <TooltipBox title={statuses[span.status].label}>
              <div>{formatRange(span.startMs, span.endMs, timeZone)}</div>
              <TooltipLine
                label={i18n.DURATION}
                value={formatDuration(span.endMs - span.startMs)}
              />
            </TooltipBox>
          )}
        />
      ))}
      {groups.map((group, index) => {
        const merged = group.markers.length > 1;
        return (
          <LineAnnotation
            key={`marker-${index}`}
            id={`marker-${index}`}
            domainType="xDomain"
            dataValues={[{ dataValue: group.atMs }]}
            style={{
              line: {
                stroke: merged
                  ? euiTheme.colors.textParagraph
                  : markerColor(euiTheme, group.markers[0].kind),
                strokeWidth: merged ? 3 : 2,
                opacity: 1,
              },
            }}
          />
        );
      })}
    </RowChart>
  );
};

const entryTimeText = (entry: TimelineEntry, timeZone: string): string =>
  entry.endMs !== undefined
    ? formatRange(entry.occurredMs, entry.endMs, timeZone)
    : formatTime(entry.occurredMs, timeZone);

const EntryTooltipLines: React.FC<{ entry: TimelineEntry; timeZone: string }> = ({
  entry,
  timeZone,
}) => (
  <>
    <div>{i18n.CATEGORY_LABELS[entry.category]}</div>
    <div>{entryTimeText(entry, timeZone)}</div>
    {entry.data.content && <div>{entry.data.content.slice(0, 300)}</div>}
    <div>{i18n.BY_USER(entry.createdBy)}</div>
  </>
);

let measureCanvas: HTMLCanvasElement | undefined;
const textMeasurer = (font: string) => {
  measureCanvas = measureCanvas ?? document.createElement('canvas');
  const context = measureCanvas.getContext('2d');
  if (context) context.font = font;
  return (text: string): number => context?.measureText(text).width ?? text.length * 7;
};

const entryRowHeight = (levels: number): number =>
  Math.max(ENTRY_ROW_HEIGHT, levels * ENTRY_LEVEL_PX + ENTRY_LEVEL_PX / 2);

/** Entry flags with their titles, as focusable links over the row chart, one level per overlap. */
const EntryMarkers: React.FC<{
  layout: EntryLabelLayout;
  selectedId?: string;
  timeZone: string;
  onEntryClick: (entry: TimelineEntry) => void;
}> = ({ layout, selectedId, timeZone, onEntryClick }) => {
  const { euiTheme } = useEuiTheme();
  return (
    <>
      {layout.boxes.map(({ entry, left, width, level, side }) => (
        <div
          key={entry.id}
          css={css`
            position: absolute;
            top: ${level * ENTRY_LEVEL_PX}px;
            left: ${left}px;
            width: ${width}px;
          `}
        >
          <EuiToolTip
            title={entry.data.title}
            content={<EntryTooltipLines entry={entry} timeZone={timeZone} />}
            display="block"
          >
            <EuiLink
              color="text"
              onClick={() => onEntryClick(entry)}
              aria-label={entry.data.title}
              data-test-subj="incident-timeline-entry-marker"
              css={css`
                display: flex;
                flex-direction: ${side === 'right' ? 'row' : 'row-reverse'};
                align-items: center;
                gap: ${euiTheme.size.xs};
                width: 100%;
              `}
            >
              <EuiIcon
                type="flag"
                size="s"
                color={entry.id === selectedId ? 'primary' : 'accent'}
                aria-hidden={true}
                css={css`
                  flex: 0 0 ${ENTRY_FLAG_PX}px;
                `}
              />
              {width > ENTRY_FLAG_PX && (
                <EuiText size="xs" className="eui-textTruncate">
                  {entry.data.title}
                </EuiText>
              )}
            </EuiLink>
          </EuiToolTip>
        </div>
      ))}
    </>
  );
};

const EntryRowChart: React.FC<{
  row: EntryRow;
  height: number;
  selectedId?: string;
  common: Omit<RowChartProps, 'id' | 'height'>;
  timeZone: string;
  onEntryClick: (entry: TimelineEntry) => void;
}> = ({ row, height, selectedId, common, timeZone, onEntryClick }) => {
  const { euiTheme } = useEuiTheme();
  const onAnnotationClick = useCallback<AnnotationClickListener>(
    ({ rects, lines }) => {
      // Annotation event ids are composite, so the entry id travels in the datum `details`.
      const entryId = [...lines, ...rects][0]?.datum.details;
      const entry = row.entries.find(({ id }) => id === entryId);
      if (entry) onEntryClick(entry);
    },
    [row.entries, onEntryClick]
  );

  return (
    <RowChart
      id={`incident-timeline-entries-${row.category}`}
      height={height}
      hasMarkers
      {...common}
      onAnnotationClick={onAnnotationClick}
    >
      {row.entries.map((entry) => {
        const selected = entry.id === selectedId;
        const color = selected ? euiTheme.colors.primary : euiTheme.colors.accent;
        const tooltip = () => (
          <TooltipBox title={entry.data.title}>
            <EntryTooltipLines entry={entry} timeZone={timeZone} />
          </TooltipBox>
        );
        return (
          <React.Fragment key={entry.id}>
            {entry.endMs !== undefined && (
              <RectAnnotation
                id={`range-${entry.id}`}
                dataValues={[
                  {
                    coordinates: { x0: entry.occurredMs, x1: entry.endMs, y0: 0.3, y1: 0.7 },
                    details: entry.id,
                  },
                ]}
                style={{ fill: color, opacity: selected ? 0.8 : 0.5, strokeWidth: 0 }}
                customTooltip={tooltip}
              />
            )}
            <LineAnnotation
              id={`entry-${entry.id}`}
              domainType="xDomain"
              dataValues={[{ dataValue: entry.occurredMs, details: entry.id }]}
              style={{ line: { stroke: color, strokeWidth: selected ? 3 : 2, opacity: 1 } }}
            />
          </React.Fragment>
        );
      })}
    </RowChart>
  );
};

/** `@timestamp` stands in for a missing event time; such points are drawn hollow. */
const isFallbackTime = (alert: IncidentTimelineAlert): boolean => alert.timeSource === 'timestamp';

const AlertRowChart: React.FC<{
  row: AlertRow;
  rendering: AlertRowRendering;
  widthPx: number;
  window: TimeWindow;
  selectedAlertId?: string;
  common: Omit<RowChartProps, 'id' | 'height'>;
  timeZone: string;
  onAlertClick: (alert: IncidentTimelineAlert, ruleName: string) => void;
  onCellClick: (cell: AlertCell) => void;
}> = ({
  row,
  rendering,
  widthPx,
  window,
  selectedAlertId,
  common,
  timeZone,
  onAlertClick,
  onCellClick,
}) => {
  const { euiTheme } = useEuiTheme();

  const onElementClick = useCallback<ElementClickListener>(
    (elements) => {
      const [geometry] = elements[0] as XYChartElementEvent;
      const datum = geometry.datum as AlertPointDatum | undefined;
      if (datum?.alert) onAlertClick(datum.alert, row.ruleName);
    },
    [onAlertClick, row.ruleName]
  );

  const onAnnotationClick = useCallback<AnnotationClickListener>(
    ({ rects }) => {
      if (rendering.kind !== 'cells') return;
      const index = Number(rects[0]?.datum.details);
      const cell = rendering.cells[index];
      if (cell) onCellClick(cell);
    },
    [rendering, onCellClick]
  );

  const pointTooltip = useCallback<CustomTooltip>(
    ({ values }) => {
      const datum = values.find((value) => (value.datum as AlertPointDatum)?.alert)?.datum as
        | AlertPointDatum
        | undefined;
      if (!datum) return null;
      const { alert } = datum;
      const timeMs = Date.parse(alert.time);
      const writeMs = Date.parse(alert.timestamp);
      return (
        <TooltipBox title={row.ruleName}>
          <TooltipLine label={i18n.ALERT_TIME} value={formatTime(timeMs, timeZone)} />
          {alert.timeSource === 'timestamp' && <div>{i18n.EVENT_TIME_UNAVAILABLE}</div>}
          {alert.timeSource === 'sequence_start' && <div>{i18n.SEQUENCE_START_TIME}</div>}
          {alert.timeSource !== 'timestamp' && Math.abs(writeMs - timeMs) > 60 * 1000 && (
            <TooltipLine label={i18n.WRITE_TIME} value={formatTime(writeMs, timeZone)} />
          )}
          {alert.hostNames.length > 0 && (
            <TooltipLine label={i18n.HOSTS} value={alert.hostNames.join(', ')} />
          )}
          {alert.userNames.length > 0 && (
            <TooltipLine label={i18n.USERS} value={alert.userNames.join(', ')} />
          )}
          {alert.severity && <TooltipLine label={i18n.SEVERITY} value={alert.severity} />}
        </TooltipBox>
      );
    },
    [row.ruleName, timeZone]
  );

  const slots = TIMELINE_DENSITY.pointStackSlots;
  const yDomain = { min: -0.5, max: slots - 0.5 };

  if (rendering.kind === 'cells') {
    const maxCount = Math.max(...rendering.cells.map(({ count }) => count));
    const pxPerMs = widthPx / (window.endMs - window.startMs);
    return (
      <>
        <RowChart
          id={`incident-timeline-alerts-${row.ruleId}`}
          height={ALERT_ROW_HEIGHT}
          {...common}
          yDomain={yDomain}
          onAnnotationClick={onAnnotationClick}
        >
          {rendering.cells.map((cell, index) => (
            <RectAnnotation
              key={`cell-${index}`}
              id={`cell-${index}`}
              dataValues={[
                { coordinates: { x0: cell.startMs, x1: cell.endMs }, details: `${index}` },
              ]}
              style={{
                fill: euiTheme.colors.vis.euiColorVis0,
                opacity: 0.25 + 0.75 * (cell.count / maxCount),
                stroke: euiTheme.colors.backgroundBasePlain,
                strokeWidth: 1,
              }}
              customTooltip={() => (
                <TooltipBox title={row.ruleName}>
                  <div>{formatRange(cell.startMs, cell.endMs, timeZone)}</div>
                  <div>{i18n.ALERT_COUNT(cell.count)}</div>
                  <TooltipLine label={i18n.HOSTS} value={distinctSummary(cell.hostNames)} />
                  <TooltipLine label={i18n.USERS} value={distinctSummary(cell.userNames)} />
                </TooltipBox>
              )}
            />
          ))}
        </RowChart>
        {rendering.cells.map((cell) => {
          const left = (cell.startMs - window.startMs) * pxPerMs;
          const width = (cell.endMs - cell.startMs) * pxPerMs;
          if (width < MIN_CELL_LABEL_PX || left < 0 || left + width > widthPx) return null;
          return (
            <span
              key={cell.startMs}
              css={css`
                position: absolute;
                top: 0;
                left: ${left}px;
                width: ${width}px;
                line-height: ${ALERT_ROW_HEIGHT}px;
                text-align: center;
                font-size: ${euiTheme.size.m};
                pointer-events: none;
                color: ${cell.count / maxCount > 0.5
                  ? euiTheme.colors.textInverse
                  : euiTheme.colors.textParagraph};
              `}
            >
              {cell.count}
            </span>
          );
        })}
      </>
    );
  }

  const series = new Map<string, { severity: string; hollow: boolean; data: AlertPointDatum[] }>();
  for (const { alert, timeMs, stack } of rendering.points) {
    const severity = alert.severity ?? 'unknown';
    const hollow = isFallbackTime(alert);
    const key = `${severity}-${hollow ? 'hollow' : 'filled'}`;
    const entry = series.get(key) ?? { severity, hollow, data: [] };
    entry.data.push({ x: timeMs, y: stack, alert });
    series.set(key, entry);
  }
  const selected = rendering.points.find(({ alert }) => alert.id === selectedAlertId);

  return (
    <RowChart
      id={`incident-timeline-alerts-${row.ruleId}`}
      height={ALERT_ROW_HEIGHT}
      {...common}
      yDomain={yDomain}
      tooltip={pointTooltip}
      onElementClick={onElementClick}
    >
      {Array.from(series, ([key, { severity, hollow, data }]) => (
        <BubbleSeries
          key={key}
          id={`alerts-${key}`}
          xScaleType={ScaleType.Time}
          yScaleType={ScaleType.Linear}
          timeZone={timeZone}
          xAccessor="x"
          yAccessors={['y']}
          data={data}
          color={severityColor(euiTheme, severity)}
          bubbleSeriesStyle={{
            point: hollow
              ? { radius: 4, strokeWidth: 2, opacity: 1, fill: euiTheme.colors.backgroundBasePlain }
              : { radius: 4, strokeWidth: 1, opacity: 1 },
          }}
        />
      ))}
      {selected && (
        <BubbleSeries
          id="alerts-selected"
          xScaleType={ScaleType.Time}
          yScaleType={ScaleType.Linear}
          timeZone={timeZone}
          xAccessor="x"
          yAccessors={['y']}
          data={[{ x: selected.timeMs, y: selected.stack, alert: selected.alert }]}
          color={euiTheme.colors.textParagraph}
          bubbleSeriesStyle={{ point: { radius: 7, strokeWidth: 2, opacity: 0.4 } }}
        />
      )}
    </RowChart>
  );
};

/** Candidate A: one `@elastic/charts` chart per lane row on a shared time domain. */
export const ElasticChartsRenderer: React.FC<TimelineRendererProps> = ({
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
  const theme = useMemo(
    () => getChartsTheme(euiTheme.themeName, colorMode),
    [euiTheme.themeName, colorMode]
  );
  const [axisEl, setAxisEl] = useState<HTMLDivElement | null>(null);
  const { width } = useResizeObserver(axisEl, 'width');
  const widthPx = Math.max(width, 1);

  const common = useMemo(
    () => ({ window, theme, timeZone, onBrush }),
    [window, theme, timeZone, onBrush]
  );
  const markerGroups = useMemo(
    () => groupCaseMarkers(model.caseLane.markers, window, widthPx, TIMELINE_DENSITY),
    [model.caseLane.markers, window, widthPx]
  );
  const entryLayouts = useMemo(() => {
    const fontPx = euiTheme.font.scale.xs * euiTheme.base;
    const measure = textMeasurer(`${fontPx}px ${euiTheme.font.family}`);
    return model.entryRows.map((row) => layoutEntryLabels(row.entries, window, widthPx, measure));
  }, [
    model.entryRows,
    window,
    widthPx,
    euiTheme.font.scale.xs,
    euiTheme.base,
    euiTheme.font.family,
  ]);
  const alertRenderings = useMemo(
    () => model.alertRows.map((row) => renderAlertRow(row, window, widthPx, TIMELINE_DENSITY)),
    [model.alertRows, window, widthPx]
  );
  const hasHollowPoints = alertRenderings.some(
    (rendering) =>
      rendering.kind === 'points' && rendering.points.some(({ alert }) => isFallbackTime(alert))
  );
  const selectedAlertId = selection?.kind === 'alert' ? selection.alert.id : undefined;
  const selectedEntryId = selection?.kind === 'entry' ? selection.entry.id : undefined;

  return (
    <EuiFlexGroup direction="column" gutterSize="xs" data-test-subj="incident-timeline-renderer-a">
      <LaneHeading title={i18n.LANE_CASE} />
      <LaneRow
        label={
          <RowLabel
            label={i18n.CASE_STATUS_ROW}
            count={model.reopenCount}
            countLabel={i18n.REOPEN_COUNT(model.reopenCount)}
            countProps={{ 'data-test-subj': 'incidentTimelineReopenCount' }}
          />
        }
        height={CASE_ROW_HEIGHT}
        testSubj="incident-timeline-case-lane"
      >
        <CaseRowChart
          spans={model.caseLane.spans}
          groups={markerGroups}
          common={common}
          timeZone={timeZone}
        />
        <CaseMarkers groups={markerGroups} window={window} widthPx={widthPx} timeZone={timeZone} />
      </LaneRow>

      {model.entryRows.length > 0 && (
        <>
          <LaneHeading title={i18n.LANE_ENTRIES} />
          {model.entryRows.map((row, index) => {
            const layout = entryLayouts[index];
            const height = entryRowHeight(layout.levels);
            return (
              <LaneRow
                key={row.category}
                label={
                  <RowLabel label={i18n.CATEGORY_LABELS[row.category]} count={row.entries.length} />
                }
                height={height}
                testSubj={`incident-timeline-entry-row-${row.category}`}
              >
                <EntryRowChart
                  row={row}
                  height={height}
                  selectedId={selectedEntryId}
                  common={common}
                  timeZone={timeZone}
                  onEntryClick={onEntryClick}
                />
                <EntryMarkers
                  layout={layout}
                  selectedId={selectedEntryId}
                  timeZone={timeZone}
                  onEntryClick={onEntryClick}
                />
              </LaneRow>
            );
          })}
        </>
      )}

      <LaneHeading
        title={i18n.LANE_ALERTS}
        badge={
          alertsPlaceholder === undefined && (
            <EuiBadge color="hollow" data-test-subj="incidentTimelineAlertCount">
              {i18n.ALERT_COUNT(model.alertCount)}
            </EuiBadge>
          )
        }
      />
      {alertsPlaceholder ??
        model.alertRows.map((row, index) => (
          <LaneRow
            key={row.ruleId}
            label={
              <RowLabel
                label={row.ruleName}
                count={row.alerts.length}
                countProps={{
                  'data-test-subj': 'incidentTimelineRuleRowCount',
                  'data-rule-id': row.ruleId,
                }}
              />
            }
            height={ALERT_ROW_HEIGHT}
            testSubj="incident-timeline-alert-row"
          >
            <AlertRowChart
              row={row}
              rendering={alertRenderings[index]}
              widthPx={widthPx}
              window={window}
              selectedAlertId={selectedAlertId}
              common={common}
              timeZone={timeZone}
              onAlertClick={onAlertClick}
              onCellClick={onCellClick}
            />
          </LaneRow>
        ))}

      <LaneRow height={AXIS_HEIGHT} chartRef={setAxisEl}>
        <RowChart id="incident-timeline-axis" height={AXIS_HEIGHT} {...common}>
          <Axis
            id="incident-timeline-time"
            position={Position.Bottom}
            tickFormat={(value: number) => formatAxisTick(value, window, timeZone)}
            timeAxisLayerCount={0}
            gridLine={{ visible: false }}
          />
        </RowChart>
      </LaneRow>
      {alertsPlaceholder === undefined && hasHollowPoints && (
        <EuiFlexGroup gutterSize="s" responsive={false} alignItems="center">
          <EuiFlexItem
            grow={false}
            css={css`
              width: ${LABEL_WIDTH}px;
            `}
          />
          <EuiFlexItem>
            <EuiText size="xs" color="subdued" data-test-subj="incident-timeline-hollow-legend">
              <span
                aria-hidden={true}
                css={css`
                  display: inline-block;
                  width: 8px;
                  height: 8px;
                  margin-right: ${euiTheme.size.xs};
                  border: 2px solid ${euiTheme.colors.textSubdued};
                  border-radius: 50%;
                `}
              />
              {i18n.HOLLOW_POINTS_LEGEND}
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>
      )}
    </EuiFlexGroup>
  );
};

TooltipBox.displayName = 'TooltipBox';
TooltipLine.displayName = 'TooltipLine';
RowChart.displayName = 'RowChart';
RowLabel.displayName = 'RowLabel';
LaneRow.displayName = 'LaneRow';
LaneHeading.displayName = 'LaneHeading';
CaseMarkers.displayName = 'CaseMarkers';
CaseRowChart.displayName = 'CaseRowChart';
EntryTooltipLines.displayName = 'EntryTooltipLines';
EntryMarkers.displayName = 'EntryMarkers';
EntryRowChart.displayName = 'EntryRowChart';
AlertRowChart.displayName = 'AlertRowChart';
ElasticChartsRenderer.displayName = 'ElasticChartsRenderer';
