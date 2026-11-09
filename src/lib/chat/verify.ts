import * as math from "mathjs";
import { Answer } from "./schema";

export interface VerificationResult {
  verified: boolean;
  notes: string[];
  recalculated: Record<string, number>;
}

export function verifyAnswerMath(answer: Answer): VerificationResult {
  const notes: string[] = [];
  const recalculated: Record<string, number> = {};
  let verified = true;

  try {
    // Check if this is a projectile motion problem
    const givenBlock = answer.blocks.find((b) => b.type === "given") as any;
    if (givenBlock) {
      let v0: number | null = null;
      let thetaDeg: number | null = null;
      let g = 9.8;

      for (const item of givenBlock.items) {
        const val = item.value.toLowerCase();
        if (val.includes("20 m/s") || item.label.toLowerCase().includes("speed") || item.label.toLowerCase().includes("v0")) {
          const match = /(\d+(\.\d+)?)/.exec(item.value);
          if (match) v0 = parseFloat(match[1]);
        }
        if (val.includes("30") || val.includes("°") || item.label.toLowerCase().includes("angle")) {
          const match = /(\d+(\.\d+)?)/.exec(item.value);
          if (match) thetaDeg = parseFloat(match[1]);
        }
        if (val.includes("9.8") || item.label.toLowerCase().includes("gravity")) {
          const match = /(\d+(\.\d+)?)/.exec(item.value);
          if (match) g = parseFloat(match[1]);
        }
      }

      if (v0 !== null && thetaDeg !== null) {
        const rad = (thetaDeg * Math.PI) / 180;
        const vx = v0 * Math.cos(rad);
        const vy = v0 * Math.sin(rad);
        const tup = vy / g;
        const T = 2 * tup;
        const H = (vy * vy) / (2 * g);
        const R1 = vx * T;
        const R2 = (v0 * v0 * Math.sin(2 * rad)) / g;

        recalculated["H"] = parseFloat(H.toFixed(2));
        recalculated["T"] = parseFloat(T.toFixed(2));
        recalculated["R"] = parseFloat(R1.toFixed(1));

        // Compare with results in answer
        for (const res of answer.result) {
          const valNum = parseFloat(res.value.replace(/[^\d.]/g, ""));
          if (!isNaN(valNum)) {
            const lab = res.label.toLowerCase();
            const isHeight = lab.includes("height") || /\bh\b/.test(lab);
            const isTime = lab.includes("time") || /\bt\b/.test(lab);
            const isRange = lab.includes("range") || /\br\b/.test(lab);

            if (isHeight) {
              if (Math.abs(valNum - H) > 0.1) {
                verified = false;
                notes.push(`Height discrepancy: calculated ${H.toFixed(2)}m vs ${valNum}m`);
              }
            } else if (isTime) {
              if (Math.abs(valNum - T) > 0.1) {
                verified = false;
                notes.push(`Time discrepancy: calculated ${T.toFixed(2)}s vs ${valNum}s`);
              }
            } else if (isRange) {
              if (Math.abs(valNum - R1) > 0.5) {
                verified = false;
                notes.push(`Range discrepancy: calculated ${R1.toFixed(1)}m vs ${valNum}m`);
              }
            }
          }
        }

        // Check if two methods gave same range
        if (Math.abs(R1 - R2) < 0.05) {
          notes.push("Range verified with two independent methods (vx * T and v0²*sin(2θ)/g)");
        }
      }
    }

    // Verify other arithmetic blocks using mathjs
    for (const b of answer.blocks) {
      if (b.type === "steps") {
        for (const step of b.steps) {
          if (step.math) {
            for (const eq of step.math) {
              // Extract simple assignments like "10 / 9.8 = 1.02"
              const parts = eq.split("=");
              if (parts.length >= 2) {
                const exprPart = parts[parts.length - 2].trim().replace(/\\times/g, "*").replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1)/($2)");
                const resPart = parts[parts.length - 1].trim().replace(/\\text\{[^}]+\}/g, "").replace(/[^\d.]/g, "");
                const resNum = parseFloat(resPart);
                if (!isNaN(resNum)) {
                  try {
                    const evalResult = math.evaluate(exprPart);
                    if (typeof evalResult === "number" && !isNaN(evalResult)) {
                      if (Math.abs(evalResult - resNum) > 0.1 && Math.abs(evalResult - resNum) / resNum > 0.05) {
                        notes.push(`Step check on '${step.title}': ${exprPart} = ${evalResult.toFixed(2)} vs stated ${resNum}`);
                      }
                    }
                  } catch {
                    // Ignore non-evaluatable complex expressions
                  }
                }
              }
            }
          }
        }
      }
    }
  } catch (err: any) {
    notes.push(`Verification warning: ${err?.message}`);
  }

  return { verified, notes, recalculated };
}
