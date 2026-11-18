/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

// SPIKE ONLY: Jeff-style label stacking. Close entries go to the next free level instead of
// being cut where the next entry starts.

export interface LabelBox {
  readonly left: number;
  readonly width: number;
  readonly level: number;
  readonly flip: boolean;
}

export const LABEL_LEVEL_PX = 20;
const FLAG_PX = 16;
const GAP_PX = 6;
const MAX_LABEL_PX = 280;

let canvas: HTMLCanvasElement | undefined;
const textWidth = (text: string): number => {
  canvas = canvas ?? document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return text.length * 7;
  context.font = '12px Inter, sans-serif';
  return context.measureText(text).width;
};

/** `xs` must be sorted ascending. Returns one box per x and the number of levels used. */
export const stackLabels = (
  xs: readonly number[],
  titles: readonly string[],
  widthPx: number
): { boxes: LabelBox[]; levels: number } => {
  const levelEnds: number[] = [];
  const boxes = xs.map((x, i) => {
    const width = FLAG_PX + 4 + Math.min(textWidth(titles[i]) + 2, MAX_LABEL_PX);
    const flip = x - FLAG_PX / 2 + width > widthPx;
    const left = flip ? x + FLAG_PX / 2 - width : x - FLAG_PX / 2;
    let level = levelEnds.findIndex((end) => end + GAP_PX <= left);
    if (level === -1) {
      level = levelEnds.length;
      levelEnds.push(0);
    }
    levelEnds[level] = left + width;
    return { left, width, level, flip };
  });
  return { boxes, levels: Math.max(levelEnds.length, 1) };
};
