/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

// SPIKE ONLY (E10): comment and assignee ticks for the case lane.

import { useQuery } from '@kbn/react-query';
import { MAX_USER_ACTIONS_PER_PAGE } from '../../../../common/constants';
import { UserActionTypes } from '../../../../common/types/domain';
import type { UserActionUI } from '../../../../common/ui/types';
import { findCaseUserActions } from '../../../containers/api';

export type ActivityKind = 'comment_human' | 'comment_automated' | 'assignee';

export interface ActivityTick {
  readonly kind: ActivityKind;
  readonly atMs: number;
  readonly user: string;
  readonly source?: string;
  readonly text: string;
}

const COMMENT_TYPES = new Set(['user', 'comment']);

const fetchAll = async (
  caseId: string,
  type: typeof UserActionTypes.comment | typeof UserActionTypes.assignees,
  signal?: AbortSignal
): Promise<UserActionUI[]> => {
  const all: UserActionUI[] = [];
  for (let page = 1; ; page++) {
    const { userActions, total } = await findCaseUserActions(
      caseId,
      { type, sortOrder: 'asc', page, perPage: MAX_USER_ACTIONS_PER_PAGE },
      signal
    );
    all.push(...userActions);
    if (userActions.length === 0 || page * MAX_USER_ACTIONS_PER_PAGE >= total) return all;
  }
};

const toTick = (action: UserActionUI): ActivityTick[] => {
  const user = action.createdBy.fullName || action.createdBy.username || '';
  const sourceType = action.source?.type;
  const source = action.source?.name ? `${sourceType} (${action.source.name})` : sourceType;
  const atMs = Date.parse(action.createdAt);
  const { payload } = action as unknown as { payload: Record<string, unknown> };
  if (action.type === UserActionTypes.assignees) {
    const assignees = (payload.assignees as Array<{ uid: string }> | undefined) ?? [];
    return [
      {
        kind: 'assignee',
        atMs,
        user,
        source,
        text: `${action.action} ${assignees.map(({ uid }) => uid).join(', ')}`,
      },
    ];
  }
  const comment = payload.comment as
    | { type?: string; comment?: string; data?: { content?: string } }
    | undefined;
  if (action.action !== 'create' || !comment?.type || !COMMENT_TYPES.has(comment.type)) return [];
  const human = sourceType === undefined || sourceType === 'user';
  return [
    {
      kind: human ? 'comment_human' : 'comment_automated',
      atMs,
      user,
      source,
      text: (comment.comment ?? comment.data?.content ?? '').slice(0, 160),
    },
  ];
};

export const useCaseActivity = (caseId: string, comments: boolean, assignees: boolean) =>
  useQuery(['spike-case-activity', caseId, comments, assignees], async ({ signal }) => {
    const actions = [
      ...(comments ? await fetchAll(caseId, UserActionTypes.comment, signal) : []),
      ...(assignees ? await fetchAll(caseId, UserActionTypes.assignees, signal) : []),
    ];
    return actions.flatMap(toTick).sort((a, b) => a.atMs - b.atMs);
  });
