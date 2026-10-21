import * as math from "mathjs";

// Max expression length allowed
export const MAX_EXPR_LENGTH = 200;

// Disallowed keywords and identifiers
const FORBIDDEN_TOKENS = [
  "constructor",
  "prototype",
  "__proto__",
  "import",
  "require",
  "process",
  "global",
  "window",
  "document",
  "Function",
  "eval",
  "this",
  "delete",
  "var",
  "let",
  "const",
  "return",
];

// Allowed math symbols and constants
const ALLOWED_SYMBOLS = new Set(["x", "X", "pi", "PI", "e", "E"]);

// Allowed math function names
const ALLOWED_FUNCTIONS = new Set([
  "sin",
  "cos",
  "tan",
  "asin",
  "acos",
  "atan",
  "sinh",
  "cosh",
  "tanh",
  "log",
  "ln",
  "log10",
  "log2",
  "sqrt",
  "cbrt",
  "abs",
  "exp",
  "pow",
  "min",
  "max",
  "round",
  "floor",
  "ceil",
  "sign",
]);

/**
 * Validates the AST of an expression to ensure only safe mathematical constructs exist.
 */
function validateAST(node: math.MathNode): void {
  const nodeType = node.type;

  if (nodeType === "SymbolNode") {
    const name = (node as any).name;
    if (!ALLOWED_SYMBOLS.has(name) && !ALLOWED_FUNCTIONS.has(name)) {
      throw new Error(`Unauthorized variable or identifier: "${name}"`);
    }
    return;
  }

  if (nodeType === "FunctionNode") {
    const fnName = (node as any).name;
    if (!ALLOWED_FUNCTIONS.has(fnName)) {
      throw new Error(`Unauthorized function call: "${fnName}()"`);
    }
  }

  // Allowed structural node types
  const allowedTypes = new Set([
    "SymbolNode",
    "ConstantNode",
    "OperatorNode",
    "FunctionNode",
    "ParenthesisNode",
    "ArrayNode",
  ]);

  if (!allowedTypes.has(nodeType)) {
    throw new Error(`Disallowed syntax or node type: "${nodeType}"`);
  }

  // Recursively validate child nodes
  node.forEach((child) => validateAST(child));
}

export interface CompiledEvaluator {
  (x: number): number;
  expr: string;
}

/**
 * Safely compiles a mathematical expression string using math.js.
 * Strictly checks length, tokens, and AST nodes. Never uses eval or Function.
 */
export function compileExpression(rawExpr: string): CompiledEvaluator {
  if (!rawExpr || typeof rawExpr !== "string") {
    throw new Error("Expression must be a non-empty string");
  }

  const trimmed = rawExpr.trim();
  if (trimmed.length > MAX_EXPR_LENGTH) {
    throw new Error(`Expression exceeds maximum length of ${MAX_EXPR_LENGTH} characters`);
  }

  // Token scan for security keywords
  const lower = trimmed.toLowerCase();
  for (const token of FORBIDDEN_TOKENS) {
    const regex = new RegExp(`\\b${token}\\b`, "i");
    if (regex.test(lower) || lower.includes(token)) {
      throw new Error(`Expression contains forbidden identifier: "${token}"`);
    }
  }

  // Parse AST
  let parsedNode: math.MathNode;
  try {
    parsedNode = math.parse(trimmed);
  } catch (err: any) {
    throw new Error(`Syntax error in expression: ${err.message}`);
  }

  // Validate AST structure
  validateAST(parsedNode);

  // Compile with math.js
  const compiled = parsedNode.compile();

  // Create safe execution closure
  const evaluator = function (x: number): number {
    if (!Number.isFinite(x)) return NaN;
    try {
      const scope = {
        x,
        X: x,
        pi: Math.PI,
        PI: Math.PI,
        e: Math.E,
        E: Math.E,
        ln: (v: number) => (v > 0 ? Math.log(v) : NaN),
      };

      const result = compiled.evaluate(scope);

      // Handle numbers
      if (typeof result === "number") {
        if (!Number.isFinite(result)) return NaN;
        // Cap extreme asymptote spikes to prevent drawing artifacts
        if (Math.abs(result) > 1e6) return NaN;
        return result;
      }

      // Handle mathjs Complex numbers
      if (result && typeof result === "object" && "re" in result && "im" in result) {
        if (Math.abs(result.im) < 1e-9 && Number.isFinite(result.re)) {
          return Math.abs(result.re) > 1e6 ? NaN : result.re;
        }
        return NaN; // Drop imaginary results
      }

      // Handle BigNumbers or Fraction if returned
      if (result && typeof result.toNumber === "function") {
        const num = result.toNumber();
        return Number.isFinite(num) && Math.abs(num) <= 1e6 ? num : NaN;
      }

      return NaN;
    } catch {
      return NaN;
    }
  };

  evaluator.expr = trimmed;
  return evaluator;
}

/**
 * Samples a function over [from, to] into (x, y) coordinates.
 * Discards NaN and non-finite values.
 */
export function sampleFunction(
  fn: CompiledEvaluator | ((x: number) => number),
  from: number,
  to: number,
  steps = 100
): Array<[number, number]> {
  const points: Array<[number, number]> = [];
  if (from >= to || steps <= 1) return points;

  const dx = (to - from) / steps;
  for (let i = 0; i <= steps; i++) {
    const x = from + i * dx;
    const y = fn(x);
    if (Number.isFinite(y)) {
      points.push([x, y]);
    }
  }
  return points;
}

/**
 * Builds a closed polygon suitable for Mafs <Polygon points={...} />
 * representing the area under the curve between `from` and `to`.
 */
export function buildShadePolygon(
  fn: CompiledEvaluator | ((x: number) => number),
  from: number,
  to: number,
  steps = 80
): Array<[number, number]> {
  const curvePoints: Array<[number, number]> = [];
  const minX = Math.min(from, to);
  const maxX = Math.max(from, to);
  const dx = (maxX - minX) / steps;

  for (let i = 0; i <= steps; i++) {
    const x = minX + i * dx;
    const y = fn(x);
    if (Number.isFinite(y)) {
      curvePoints.push([x, y]);
    }
  }

  if (curvePoints.length < 2) return [];

  // Close the polygon at the x-axis: [minX, 0] -> curve -> [maxX, 0]
  return [[minX, 0], ...curvePoints, [maxX, 0]];
}

/**
 * Automatically calculates a suitable y-range for function plots if none is specified.
 */
export function autoCalculateYRange(
  evaluators: Array<(x: number) => number>,
  xRange: [number, number],
  explicitPoints?: Array<{ x: number; y: number }>
): [number, number] {
  let minY = Infinity;
  let maxY = -Infinity;

  const [xMin, xMax] = xRange;
  const samples = 60;
  const dx = (xMax - xMin) / samples;

  for (const fn of evaluators) {
    for (let i = 0; i <= samples; i++) {
      const x = xMin + i * dx;
      const y = fn(x);
      if (Number.isFinite(y) && Math.abs(y) <= 100000) {
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (explicitPoints) {
    for (const p of explicitPoints) {
      if (Number.isFinite(p.y)) {
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      }
    }
  }

  // Fallback defaults if no finite values were sampled
  if (!Number.isFinite(minY) || !Number.isFinite(maxY) || minY >= maxY) {
    return [-10, 10];
  }

  const height = maxY - minY;
  const pad = Math.max(height * 0.15, 1.0);
  return [
    Math.floor((minY - pad) * 10) / 10,
    Math.ceil((maxY + pad) * 10) / 10,
  ];
}
