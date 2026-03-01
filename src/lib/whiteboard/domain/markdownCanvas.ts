import MarkdownIt from "markdown-it";
import type { FontWeight, Point, TextAlign } from "./types";

type MarkdownInlineStyle = {
  bold: boolean;
  italic: boolean;
  link: boolean;
  linkHref: string | null;
};

type MarkdownFragment = {
  text: string;
  style: MarkdownInlineStyle;
};

type MarkdownBlock = {
  fontSize: number;
  fontWeight: FontWeight;
  fragments: MarkdownFragment[];
};

type RenderLineFragment = {
  text: string;
  style: MarkdownInlineStyle;
  width: number;
};

type RenderLine = {
  fragments: RenderLineFragment[];
  width: number;
  height: number;
  fontSize: number;
  fontWeight: FontWeight;
};

type DrawMarkdownTextParams = {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontWeight: FontWeight;
  textAlign: TextAlign;
  textColor: string;
  paddingX?: number;
  paddingTop?: number;
};

const SANS_FONT_FAMILY = "Inter, system-ui, sans-serif";

const defaultStyle: MarkdownInlineStyle = {
  bold: false,
  italic: false,
  link: false,
  linkHref: null,
};

const EMPTY_FRAGMENT: MarkdownFragment = { text: "", style: defaultStyle };

const headingScaleByLevel: Record<number, number> = {
  1: 2,
  2: 1.6,
  3: 1.35,
  4: 1.2,
  5: 1.1,
  6: 1,
};

const markdownParser = new MarkdownIt({
  html: false,
  linkify: false,
  typographer: false,
});

type MarkdownToken = ReturnType<MarkdownIt["parse"]>[number];

export function drawMarkdownText(
  ctx: CanvasRenderingContext2D,
  params: DrawMarkdownTextParams,
): void {
  const maxLineWidth = Math.max(0, params.width - (params.paddingX ?? 8) * 2);
  const lines = getRenderLines(
    ctx,
    params.text,
    Math.max(1, params.fontSize),
    params.fontWeight,
    maxLineWidth,
  );

  const top = params.y + (params.paddingTop ?? 6);
  const left = params.x + (params.paddingX ?? 8);
  const right = params.x + params.width - (params.paddingX ?? 8);
  const bottom = params.y + params.height;

  let cursorY = top;
  ctx.textBaseline = "top";

  for (const line of lines) {
    if (cursorY + line.height > bottom) {
      break;
    }

    const lineStartX =
      params.textAlign === "left"
        ? left
        : params.textAlign === "center"
          ? left + (maxLineWidth - line.width) / 2
          : right - line.width;

    let cursorX = lineStartX;

    for (const fragment of line.fragments) {
      if (!fragment.text.length) {
        continue;
      }

      applyFont(ctx, line.fontWeight, line.fontSize, fragment.style);
      ctx.fillStyle = params.textColor;
      ctx.fillText(fragment.text, cursorX, cursorY, maxLineWidth);

      if (fragment.style.link) {
        const underlineY = cursorY + line.fontSize + 1;
        ctx.save();
        ctx.strokeStyle = params.textColor;
        ctx.lineWidth = Math.max(1, line.fontSize * 0.06);
        ctx.beginPath();
        ctx.moveTo(cursorX, underlineY);
        ctx.lineTo(cursorX + fragment.width, underlineY);
        ctx.stroke();
        ctx.restore();
      }

      cursorX += fragment.width;
    }

    cursorY += line.height;
  }
}

export function getMarkdownLinkAtPoint(
  ctx: CanvasRenderingContext2D,
  params: DrawMarkdownTextParams & { point: Point },
): string | null {
  const maxLineWidth = Math.max(0, params.width - (params.paddingX ?? 8) * 2);
  const lines = getRenderLines(
    ctx,
    params.text,
    Math.max(1, params.fontSize),
    params.fontWeight,
    maxLineWidth,
  );

  const top = params.y + (params.paddingTop ?? 6);
  const left = params.x + (params.paddingX ?? 8);
  const right = params.x + params.width - (params.paddingX ?? 8);
  const bottom = params.y + params.height;

  if (
    params.point.x < left ||
    params.point.x > right ||
    params.point.y < top ||
    params.point.y > bottom
  ) {
    return null;
  }

  let cursorY = top;
  for (const line of lines) {
    if (cursorY + line.height > bottom) {
      break;
    }

    const lineStartX =
      params.textAlign === "left"
        ? left
        : params.textAlign === "center"
          ? left + (maxLineWidth - line.width) / 2
          : right - line.width;

    let cursorX = lineStartX;
    for (const fragment of line.fragments) {
      const fragmentEndX = cursorX + fragment.width;
      if (
        fragment.style.link &&
        fragment.style.linkHref &&
        params.point.x >= cursorX &&
        params.point.x <= fragmentEndX &&
        params.point.y >= cursorY &&
        params.point.y <= cursorY + line.height
      ) {
        return fragment.style.linkHref;
      }
      cursorX = fragmentEndX;
    }

    cursorY += line.height;
  }

  return null;
}

function getRenderLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  fontSize: number,
  fontWeight: FontWeight,
  maxLineWidth: number,
): RenderLine[] {
  const blocks = parseMarkdownBlocks(text, fontSize, fontWeight);
  return layoutBlocksIntoLines(ctx, blocks, maxLineWidth);
}

function parseMarkdownBlocks(
  text: string,
  baseFontSize: number,
  baseFontWeight: FontWeight,
): MarkdownBlock[] {
  const normalized = text.replace(/\r\n/g, "\n");
  const tokens = markdownParser.parse(normalized, {});
  const sourceLineCount = normalized.split("\n").length;
  const blocks: MarkdownBlock[] = [];
  let lastConsumedSourceLine = 0;

  const appendSourceGapBlocks = (startLine: number) => {
    const gapCount = Math.max(0, startLine - lastConsumedSourceLine);
    if (gapCount <= 0) {
      return;
    }
    blocks.push(...createEmptyBlocks(gapCount, baseFontSize, baseFontWeight));
  };

  let index = 0;
  while (index < tokens.length) {
    const token = tokens[index];

    if (token.type === "heading_open") {
      appendSourceGapBlocks(token.map?.[0] ?? lastConsumedSourceLine);
      const level = Number.parseInt(token.tag.slice(1), 10);
      const inline = tokens[index + 1];
      const fragments = parseInlineToken(inline);
      blocks.push(
        ...fragmentsToBlocks(
          fragments,
          Math.max(1, baseFontSize * (headingScaleByLevel[level] ?? 1)),
          "bold",
        ),
      );
      lastConsumedSourceLine =
        token.map?.[1] ??
        Math.max(lastConsumedSourceLine, (token.map?.[0] ?? 0) + 1);
      index += 3;
      continue;
    }

    if (token.type === "paragraph_open") {
      appendSourceGapBlocks(token.map?.[0] ?? lastConsumedSourceLine);
      const inline = tokens[index + 1];
      const fragments = parseInlineToken(inline);
      blocks.push(
        ...fragmentsToBlocks(fragments, baseFontSize, baseFontWeight),
      );
      lastConsumedSourceLine =
        token.map?.[1] ??
        Math.max(lastConsumedSourceLine, (token.map?.[0] ?? 0) + 1);
      index += 3;
      continue;
    }

    if (
      token.type === "bullet_list_open" ||
      token.type === "ordered_list_open"
    ) {
      appendSourceGapBlocks(token.map?.[0] ?? lastConsumedSourceLine);
      const listResult = parseListBlocks(
        tokens,
        index,
        baseFontSize,
        baseFontWeight,
      );
      blocks.push(...listResult.blocks);
      lastConsumedSourceLine = Math.max(
        lastConsumedSourceLine,
        listResult.endSourceLine,
      );
      index = listResult.nextIndex;
      continue;
    }

    index += 1;
  }

  if (sourceLineCount > lastConsumedSourceLine) {
    blocks.push(
      ...createEmptyBlocks(
        sourceLineCount - lastConsumedSourceLine,
        baseFontSize,
        baseFontWeight,
      ),
    );
  }

  return blocks.length > 0
    ? blocks
    : [
        {
          fontSize: baseFontSize,
          fontWeight: baseFontWeight,
          fragments: [EMPTY_FRAGMENT],
        },
      ];
}

function parseInlineToken(
  inlineToken: MarkdownToken | undefined,
): MarkdownFragment[] {
  if (!inlineToken || inlineToken.type !== "inline") {
    return [EMPTY_FRAGMENT];
  }

  const children = inlineToken.children ?? [];
  const fragments: MarkdownFragment[] = [];
  const styleState: MarkdownInlineStyle = {
    ...defaultStyle,
  };

  const pushFragment = (value: string, style: MarkdownInlineStyle) => {
    const previous = fragments[fragments.length - 1];
    if (
      value.length > 0 &&
      previous &&
      previous.style.bold === style.bold &&
      previous.style.italic === style.italic &&
      previous.style.link === style.link &&
      previous.style.linkHref === style.linkHref
    ) {
      previous.text += value;
      return;
    }

    fragments.push({ text: value, style });
  };

  for (const child of children) {
    if (child.type === "strong_open") {
      styleState.bold = true;
      continue;
    }

    if (child.type === "strong_close") {
      styleState.bold = false;
      continue;
    }

    if (child.type === "em_open") {
      styleState.italic = true;
      continue;
    }

    if (child.type === "em_close") {
      styleState.italic = false;
      continue;
    }

    if (child.type === "link_open") {
      styleState.link = true;
      styleState.linkHref = child.attrGet("href") ?? null;
      continue;
    }

    if (child.type === "link_close") {
      styleState.link = false;
      styleState.linkHref = null;
      continue;
    }

    if (child.type === "text") {
      pushFragment(child.content, { ...styleState });
      continue;
    }

    if (child.type === "softbreak" || child.type === "hardbreak") {
      pushFragment("\n", { ...styleState });
      continue;
    }
  }

  return fragments.length > 0 ? fragments : [EMPTY_FRAGMENT];
}

function fragmentsToBlocks(
  fragments: MarkdownFragment[],
  fontSize: number,
  fontWeight: FontWeight,
): MarkdownBlock[] {
  const lines: MarkdownBlock[] = [];
  let currentFragments: MarkdownFragment[] = [];

  const pushLine = () => {
    lines.push({
      fontSize,
      fontWeight,
      fragments:
        currentFragments.length > 0 ? currentFragments : [EMPTY_FRAGMENT],
    });
    currentFragments = [];
  };

  for (const fragment of fragments) {
    if (!fragment.text.includes("\n")) {
      currentFragments.push(fragment);
      continue;
    }

    const parts = fragment.text.split("\n");
    for (let partIndex = 0; partIndex < parts.length; partIndex += 1) {
      const part = parts[partIndex] ?? "";
      if (part.length > 0) {
        currentFragments.push({
          text: part,
          style: fragment.style,
        });
      }
      if (partIndex < parts.length - 1) {
        pushLine();
      }
    }
  }

  pushLine();
  return lines;
}

function parseListBlocks(
  tokens: MarkdownToken[],
  startIndex: number,
  baseFontSize: number,
  baseFontWeight: FontWeight,
): { blocks: MarkdownBlock[]; nextIndex: number; endSourceLine: number } {
  const blocks: MarkdownBlock[] = [];
  const startToken = tokens[startIndex];
  const listCloseType =
    startToken.type === "ordered_list_open"
      ? "ordered_list_close"
      : "bullet_list_close";
  const startLine = startToken.map?.[0] ?? 0;
  let endSourceLine = startToken.map?.[1] ?? startLine;
  let currentNumber = Number.parseInt(startToken.attrGet("start") ?? "1", 10);

  let index = startIndex + 1;
  while (index < tokens.length && tokens[index].type !== listCloseType) {
    const token = tokens[index];
    if (token.type !== "list_item_open") {
      index += 1;
      continue;
    }

    const itemBlocks: MarkdownBlock[] = [];
    index += 1;

    while (index < tokens.length && tokens[index].type !== "list_item_close") {
      const itemToken = tokens[index];

      if (itemToken.type === "paragraph_open") {
        if (itemToken.map?.[1] !== undefined) {
          endSourceLine = Math.max(endSourceLine, itemToken.map[1]);
        }
        const inline = tokens[index + 1];
        const fragments = parseInlineToken(inline);
        itemBlocks.push(
          ...fragmentsToBlocks(fragments, baseFontSize, baseFontWeight),
        );
        index += 3;
        continue;
      }

      index += 1;
    }

    const marker =
      startToken.type === "ordered_list_open" ? `${currentNumber}. ` : "• ";
    if (!itemBlocks.length) {
      itemBlocks.push({
        fontSize: baseFontSize,
        fontWeight: baseFontWeight,
        fragments: [{ text: marker, style: defaultStyle }],
      });
    } else {
      const firstBlock = itemBlocks[0];
      firstBlock.fragments = [
        { text: marker, style: defaultStyle },
        ...firstBlock.fragments,
      ];
    }

    blocks.push(...itemBlocks);
    if (startToken.type === "ordered_list_open") {
      currentNumber += 1;
    }
    index += 1;
  }

  return {
    blocks,
    nextIndex: Math.min(tokens.length, index + 1),
    endSourceLine,
  };
}

function createEmptyBlocks(
  count: number,
  fontSize: number,
  fontWeight: FontWeight,
): MarkdownBlock[] {
  if (count <= 0) {
    return [];
  }

  return Array.from({ length: count }, () => ({
    fontSize,
    fontWeight,
    fragments: [EMPTY_FRAGMENT],
  }));
}

function layoutBlocksIntoLines(
  ctx: CanvasRenderingContext2D,
  blocks: MarkdownBlock[],
  maxWidth: number,
): RenderLine[] {
  if (maxWidth <= 0) {
    return [
      {
        fragments: [],
        width: 0,
        height: 12,
        fontSize: 12,
        fontWeight: "normal",
      },
    ];
  }

  const lines: RenderLine[] = [];

  for (const block of blocks) {
    const tokens = tokenizeFragments(block.fragments);
    let currentLineFragments: RenderLineFragment[] = [];
    let currentLineWidth = 0;
    const lineHeight = Math.max(12, block.fontSize * 1.3);

    const flushCurrentLine = () => {
      lines.push({
        fragments: currentLineFragments,
        width: currentLineWidth,
        height: lineHeight,
        fontSize: block.fontSize,
        fontWeight: block.fontWeight,
      });
      currentLineFragments = [];
      currentLineWidth = 0;
    };

    if (!tokens.length) {
      lines.push({
        fragments: [],
        width: 0,
        height: lineHeight,
        fontSize: block.fontSize,
        fontWeight: block.fontWeight,
      });
      continue;
    }

    for (const token of tokens) {
      if (!token.text.length) {
        continue;
      }

      const fragment: RenderLineFragment = {
        text: token.text,
        style: token.style,
        width: measureTextWidth(
          ctx,
          token.text,
          block.fontWeight,
          block.fontSize,
          token.style,
        ),
      };
      const isWhitespace = /^\s+$/.test(fragment.text);
      if (isWhitespace && currentLineFragments.length === 0) {
        continue;
      }

      if (
        currentLineFragments.length > 0 &&
        currentLineWidth + fragment.width > maxWidth
      ) {
        flushCurrentLine();
        if (isWhitespace) {
          continue;
        }
      }

      currentLineFragments.push(fragment);
      currentLineWidth += fragment.width;
    }

    if (!currentLineFragments.length) {
      lines.push({
        fragments: [],
        width: 0,
        height: lineHeight,
        fontSize: block.fontSize,
        fontWeight: block.fontWeight,
      });
    } else {
      flushCurrentLine();
    }
  }

  return lines.length > 0
    ? lines
    : [
        {
          fragments: [],
          width: 0,
          height: 12,
          fontSize: 12,
          fontWeight: "normal",
        },
      ];
}

function tokenizeFragments(fragments: MarkdownFragment[]): MarkdownFragment[] {
  const tokens: MarkdownFragment[] = [];

  for (const fragment of fragments) {
    const parts = fragment.text
      .split(/(\s+)/)
      .filter((part) => part.length > 0);
    for (const part of parts) {
      tokens.push({
        text: part,
        style: fragment.style,
      });
    }
  }

  return tokens;
}

function measureTextWidth(
  ctx: CanvasRenderingContext2D,
  text: string,
  blockFontWeight: FontWeight,
  fontSize: number,
  style: MarkdownInlineStyle,
): number {
  applyFont(ctx, blockFontWeight, fontSize, style);
  return ctx.measureText(text).width;
}

function applyFont(
  ctx: CanvasRenderingContext2D,
  blockFontWeight: FontWeight,
  fontSize: number,
  style: MarkdownInlineStyle,
): void {
  const fontWeight = style.bold ? "bold" : blockFontWeight;
  const fontStyle = style.italic ? "italic" : "normal";
  ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${SANS_FONT_FAMILY}`;
}
