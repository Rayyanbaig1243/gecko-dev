/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import { isConsole } from "../utils/preview";
import { findBestMatchExpression } from "../utils/ast";
import { getGrip, getFront } from "../utils/evaluation-result";
import { getExpressionFromCoords } from "../utils/editor/get-expression";

import {
  isLineInScope,
  isSelectedFrameVisible,
  getSelectedSource,
  getSelectedLocation,
  getSelectedFrame,
  getSymbols,
  getCurrentThread,
  getSelectedException,
} from "../selectors";

import { getMappedExpression } from "./expressions";

function findExpressionMatch(state, codeMirror, tokenPos) {
  const location = getSelectedLocation(state);
  if (!location) {
    return null;
  }

  const symbols = getSymbols(state, location);

  let match;
  if (!symbols) {
    match = getExpressionFromCoords(codeMirror, tokenPos);
  } else {
    match = findBestMatchExpression(symbols, tokenPos);
  }
  return match;
}

export function getPreview(cx, target, tokenPos, codeMirror) {
  return async thunkArgs => {
    const { getState, client } = thunkArgs;
    if (
      !isSelectedFrameVisible(getState()) ||
      !isLineInScope(getState(), tokenPos.line)
    ) {
      return null;
    }

    const source = getSelectedSource(getState());
    if (!source) {
      return null;
    }
    const thread = getCurrentThread(getState());
    const selectedFrame = getSelectedFrame(getState(), thread);
    if (!selectedFrame) {
      return null;
    }

    const match = findExpressionMatch(getState(), codeMirror, tokenPos);
    if (!match) {
      return null;
    }

    let { expression, location } = match;

    if (isConsole(expression)) {
      return null;
    }

    if (location && source.isOriginal) {
      const mapResult = await getMappedExpression(
        expression,
        thread,
        thunkArgs
      );
      if (mapResult) {
        expression = mapResult.expression;
      }
    }

    const { result } = await client.evaluate(expression, {
      frameId: selectedFrame.id,
    });

    const resultGrip = getGrip(result);

    // Error case occurs for a token that follows an errored evaluation
    // https://github.com/firefox-devtools/debugger/pull/8056
    // Accommodating for null allows us to show preview for falsy values
    // line "", false, null, Nan, and more
    if (resultGrip === null) {
      return null;
    }

    // Handle cases where the result is invisible to the debugger
    // and not possible to preview. Bug 1548256
    if (
      resultGrip &&
      resultGrip.class &&
      typeof resultGrip.class === "string" &&
      resultGrip.class.includes("InvisibleToDebugger")
    ) {
      return null;
    }

    const root = {
      path: expression,
      contents: {
        value: resultGrip,
        front: getFront(result),
      },
    };
    const properties = await client.loadObjectProperties(root, thread);

    return {
      target,
      tokenPos,
      cursorPos: target.getBoundingClientRect(),
      expression,
      root,
      resultGrip,
      properties,
    };
  };
}

export function getExceptionPreview(cx, target, tokenPos, codeMirror) {
  return async ({ dispatch, getState }) => {
    const match = findExpressionMatch(getState(), codeMirror, tokenPos);
    if (!match) {
      return null;
    }

    const tokenColumnStart = match.location.start.column + 1;
    const exception = getSelectedException(
      getState(),
      tokenPos.line,
      tokenColumnStart
    );
    if (!exception) {
      return null;
    }

    return {
      target,
      tokenPos,
      cursorPos: target.getBoundingClientRect(),
      exception,
    };
  };
}
