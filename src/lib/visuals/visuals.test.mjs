import test from "node:test";
import assert from "node:assert/strict";

// Import compiled or transpileable modules
import { compileExpression, sampleFunction, buildShadePolygon, autoCalculateYRange } from "./evaluate.ts";
import { validateVisualSpec } from "./schema.ts";

test("evaluate.ts: compiles valid mathematical expressions", () => {
  // Quadratic
  const fn1 = compileExpression("x^2 - 4");
  assert.strictEqual(fn1(2), 0);
  assert.strictEqual(fn1(-2), 0);
  assert.strictEqual(fn1(0), -4);
  assert.strictEqual(fn1(3), 5);

  // Trigonometric
  const fn2 = compileExpression("sin(x)");
  assert.strictEqual(Math.round(fn2(0)), 0);
  assert.strictEqual(Math.round(fn2(Math.PI / 2)), 1);

  // Linear & powers
  const fn3 = compileExpression("2*x + 1");
  assert.strictEqual(fn3(4), 9);

  // Economics supply/demand
  const fn4 = compileExpression("100 - 2*x");
  assert.strictEqual(fn4(20), 60);

  // Constants: e and pi
  const fn5 = compileExpression("pi * x");
  assert.strictEqual(fn5(1), Math.PI);
});

test("evaluate.ts: handles division by zero and asymptotes (1/x) gracefully without crashing", () => {
  const fn = compileExpression("1 / x");
  const atZero = fn(0);
  assert.ok(Number.isNaN(atZero), "1/x at 0 must evaluate to NaN to avoid drawing vertical lines");

  assert.strictEqual(fn(2), 0.5);
  assert.strictEqual(fn(-2), -0.5);
});

test("evaluate.ts: strictly rejects dangerous keywords and prototypes", () => {
  const dangerous = [
    "constructor",
    "x.constructor",
    "prototype",
    "__proto__",
    "import('fs')",
    "require('os')",
    "process.exit(1)",
    "global",
    "window.alert(1)",
    "Function('return 1')()",
    "eval('1+1')",
    "this",
  ];

  for (const expr of dangerous) {
    assert.throws(
      () => compileExpression(expr),
      /forbidden|unauthorized|disallowed/i,
      `Should have rejected dangerous expression: "${expr}"`
    );
  }
});

test("evaluate.ts: rejects expressions exceeding 200 characters", () => {
  const longExpr = "x + " + "1 + ".repeat(100) + "x";
  assert.throws(
    () => compileExpression(longExpr),
    /maximum length/i
  );
});

test("evaluate.ts: builds shade polygon and calculates auto bounds", () => {
  const fn = compileExpression("sin(x)");
  const poly = buildShadePolygon(fn, 0, Math.PI, 10);
  assert.ok(poly.length >= 10);
  assert.deepStrictEqual(poly[0], [0, 0]);
  assert.deepStrictEqual(poly[poly.length - 1], [Math.PI, 0]);

  const yRange = autoCalculateYRange([fn], [0, Math.PI]);
  assert.ok(yRange[0] <= 0);
  assert.ok(yRange[1] >= 1);
});

test("schema.ts: validates valid function_plot specs", () => {
  const spec = {
    type: "function_plot",
    title: "Graph of y = x^2 - 4",
    functions: [{ expr: "x^2 - 4", label: "y = x^2 - 4" }],
    x_range: [-5, 5],
    y_range: [-6, 10],
    points: [
      { x: -2, y: 0, label: "root (-2, 0)" },
      { x: 2, y: 0, label: "root (2, 0)" },
    ],
  };

  const res = validateVisualSpec(spec);
  assert.strictEqual(res.success, true);
  if (res.success) {
    assert.strictEqual(res.data.type, "function_plot");
    assert.strictEqual(res.data.functions.length, 1);
  }
});

test("schema.ts: validates data_chart, diagram, and molecule specs", () => {
  // data_chart
  const chartRes = validateVisualSpec({
    type: "data_chart",
    chart: "line",
    title: "Supply vs Demand",
    series: [
      {
        name: "Demand",
        data: [
          { x: 0, y: 100 },
          { x: 20, y: 60 },
        ],
      },
    ],
  });
  assert.strictEqual(chartRes.success, true);

  // diagram
  const diagramRes = validateVisualSpec({
    type: "diagram",
    title: "Stages of Mitosis",
    mermaid: "flowchart LR; Prophase-->Metaphase-->Anaphase-->Telophase",
  });
  assert.strictEqual(diagramRes.success, true);

  // molecule
  const moleculeRes = validateVisualSpec({
    type: "molecule",
    smiles: "CCO",
    name: "ethanol",
  });
  assert.strictEqual(moleculeRes.success, true);
});

test("schema.ts: rejects invalid specs and malicious inputs", () => {
  // Missing type
  assert.strictEqual(validateVisualSpec({ title: "Bad" }).success, false);

  // Too many functions (> 4)
  assert.strictEqual(
    validateVisualSpec({
      type: "function_plot",
      functions: [
        { expr: "x" },
        { expr: "2x" },
        { expr: "3x" },
        { expr: "4x" },
        { expr: "5x" },
      ],
      x_range: [-1, 1],
    }).success,
    false
  );

  // Invalid JSON string
  assert.strictEqual(validateVisualSpec("{ broken json").success, false);
});
