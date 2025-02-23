/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import {
  getExpression,
  getExpressions,
  getSelectedFrame,
  getSelectedFrameId,
  getSelectedSource,
  getSelectedScopeMappings,
  getSelectedFrameBindings,
  getIsPaused,
  isMapScopesEnabled,
} from "../selectors";
import { PROMISE } from "./utils/middleware/promise";
import { wrapExpression } from "../utils/expressions";
import { features } from "../utils/prefs";

/**
 * Add expression for debugger to watch
 *
 * @param {object} cx
 * @param {string} input
 */
export function addExpression(cx, input) {
  return async ({ dispatch, getState, parserWorker }) => {
    if (!input) {
      return null;
    }

    const expressionError = await parserWorker.hasSyntaxError(input);

    // If the expression already exists, only update its evaluation
    let expression = getExpression(getState(), input);
    if (!expression) {
      // This will only display the expression input,
      // evaluateExpression will update its value.
      dispatch({ type: "ADD_EXPRESSION", input, expressionError });

      expression = getExpression(getState(), input);
      // When there is an expression error, we won't store the expression
      if (!expression) {
        return null;
      }
    }

    return dispatch(evaluateExpression(cx, expression));
  };
}

export function autocomplete(cx, input, cursor) {
  return async ({ dispatch, getState, client }) => {
    if (!input) {
      return;
    }
    const frameId = getSelectedFrameId(getState(), cx.thread);
    const result = await client.autocomplete(input, cursor, frameId);
    dispatch({ type: "AUTOCOMPLETE", cx, input, result });
  };
}

export function clearAutocomplete() {
  return { type: "CLEAR_AUTOCOMPLETE" };
}

export function clearExpressionError() {
  return { type: "CLEAR_EXPRESSION_ERROR" };
}

export function updateExpression(cx, input, expression) {
  return async ({ dispatch, parserWorker }) => {
    if (!input) {
      return;
    }

    const expressionError = await parserWorker.hasSyntaxError(input);
    dispatch({
      type: "UPDATE_EXPRESSION",
      expression,
      input: expressionError ? expression.input : input,
      expressionError,
    });

    await dispatch(evaluateExpressions(cx));
  };
}

/**
 *
 * @param {object} expression
 * @param {string} expression.input
 */
export function deleteExpression(expression) {
  return {
    type: "DELETE_EXPRESSION",
    input: expression.input,
  };
}

/**
 * Update all the current expression evaluations.
 *
 * @param {object} cx
 */
export function evaluateExpressions(cx) {
  return async function ({ dispatch, getState, client }) {
    const expressions = getExpressions(getState());
    const inputs = expressions.map(({ input }) => input);
    const frameId = getSelectedFrameId(getState(), cx.thread);
    const results = await client.evaluateExpressions(inputs, {
      frameId,
      threadId: cx.thread,
    });
    dispatch({ type: "EVALUATE_EXPRESSIONS", cx, inputs, results });
  };
}

function evaluateExpression(cx, expression) {
  return async function (thunkArgs) {
    if (!expression.input) {
      console.warn("Expressions should not be empty");
      return null;
    }
    const { dispatch, getState, client } = thunkArgs;
    let { input } = expression;
    const frame = getSelectedFrame(getState(), cx.thread);

    if (frame) {
      const selectedSource = getSelectedSource(getState());

      if (
        selectedSource &&
        frame.location.source.isOriginal &&
        selectedSource.isOriginal
      ) {
        const mapResult = await getMappedExpression(
          input,
          cx.thread,
          thunkArgs
        );
        if (mapResult) {
          input = mapResult.expression;
        }
      }
    }

    const frameId = getSelectedFrameId(getState(), cx.thread);

    return dispatch({
      type: "EVALUATE_EXPRESSION",
      cx,
      thread: cx.thread,
      input: expression.input,
      [PROMISE]: client.evaluate(wrapExpression(input), {
        frameId,
      }),
    });
  };
}

/**
 * Gets information about original variable names from the source map
 * and replaces all possible generated names.
 */
export function getMappedExpression(expression, thread, thunkArgs) {
  const { getState, parserWorker } = thunkArgs;
  const mappings = getSelectedScopeMappings(getState(), thread);
  const bindings = getSelectedFrameBindings(getState(), thread);

  // We bail early if we do not need to map the expression. This is important
  // because mapping an expression can be slow if the parserWorker
  // worker is busy doing other work.
  //
  // 1. there are no mappings - we do not need to map original expressions
  // 2. does not contain `await` - we do not need to map top level awaits
  // 3. does not contain `=` - we do not need to map assignments
  const shouldMapScopes = isMapScopesEnabled(getState()) && mappings;
  if (!shouldMapScopes && !expression.match(/(await|=)/)) {
    return null;
  }

  return parserWorker.mapExpression(
    expression,
    mappings,
    bindings || [],
    features.mapExpressionBindings && getIsPaused(getState(), thread),
    features.mapAwaitExpression
  );
}
