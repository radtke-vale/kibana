/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { isEmpty } from 'lodash';
import useDebounce from 'react-use/lib/useDebounce';
import type { FieldHook } from '@kbn/es-ui-shared-plugin/static/forms/hook_form_lib';

const STORAGE_DEBOUNCE_TIME = 500;

export interface SessionStorageType {
  field: FieldHook<string>;
  sessionKey: string;
  initialValue: string | undefined;
}

export const useMarkdownSessionStorage = ({
  field,
  sessionKey,
  initialValue,
}: SessionStorageType) => {
  const [hasConflicts, setHasConflicts] = useState<boolean>(false);
  const isFirstRender = useRef(true);
  const initialValueRef = useRef(initialValue);

  if (!isEmpty(sessionKey) && window.sessionStorage.getItem(sessionKey) === null) {
    window.sessionStorage.setItem(sessionKey, '');
  }
  const sessionValue = window.sessionStorage.getItem(sessionKey) ?? '';
  const fieldValueRef = useRef(field.value);
  fieldValueRef.current = field.value;
  const [, cancelDebouncedSave] = useDebounce(
    () => {
      if (!isEmpty(sessionKey)) {
        window.sessionStorage.setItem(sessionKey, fieldValueRef.current);
      }
    },
    STORAGE_DEBOUNCE_TIME,
    [field.value]
  );
  const saveDraft = useCallback(
    (value = fieldValueRef.current) => {
      cancelDebouncedSave();
      if (!isEmpty(sessionKey) && window.sessionStorage.getItem(sessionKey) !== null) {
        window.sessionStorage.setItem(sessionKey, value);
      }
    },
    [cancelDebouncedSave, sessionKey]
  );

  useEffect(() => () => saveDraft(), [saveDraft]);

  if (!isEmpty(sessionValue) && !isEmpty(sessionKey) && isFirstRender.current) {
    field.setValue(sessionValue);
  }

  if (isFirstRender.current) {
    isFirstRender.current = false;
  }

  if (initialValue !== initialValueRef.current && initialValue !== field.value) {
    initialValueRef.current = initialValue;
    setHasConflicts(true);
  }

  return { hasConflicts, saveDraft };
};
