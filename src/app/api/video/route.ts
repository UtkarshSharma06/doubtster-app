import { NextRequest, NextResponse } from "next/server";
import { verifyPlanAccess } from "@/lib/planGuard";
import { db } from "@/lib/subscriptionDb";

export const maxDuration = 600;

export async function POST(req: NextRequest) {
  try {
    const planCheck = await verifyPlanAccess("AI Video Studio");
    if (!planCheck.allowed) {
      return NextResponse.json(
        {
          error: planCheck.error,
          requiresPlan: true,
          code: "PLAN_REQUIRED",
        },
        { status: planCheck.status }
      );
    }

    if ((planCheck.credits || 0) < 1) {
      return NextResponse.json(
        {
          error: "You have 0 video credits remaining. Please buy a top-up pack or wait for plan renewal.",
          requiresCredits: true,
          code: "CREDITS_EXHAUSTED",
        },
        { status: 402 }
      );
    }

    const { title, scenes, prompt, minutes, voice, lang } = await req.json();
    const duration = minutes === 5 ? "5 mins" : (minutes === 1 ? "1 min" : "2 mins");
    const creditCost = minutes === 5 ? 2 : 1;
    const targetLang = (lang || "en").toLowerCase();

    if ((planCheck.credits || 0) < creditCost) {
      return NextResponse.json(
        {
          error: `This video requires ${creditCost} credits, but you only have ${planCheck.credits}.`,
          requiresCredits: true,
          code: "INSUFFICIENT_CREDITS",
        },
        { status: 402 }
      );
    }
    
    // Call the Doubtster video engine
    const question = (title || prompt || "Lesson topic").trim();
    const { engineFetch } = await import("@/lib/doubtster-engine");
    const { generateVideoPlan, LANGUAGE_META } = await import("@/lib/videoPlanGenerator");

    // Generate verified multilingual plan with target duration scaling (2 min vs 5 min)
    let plan: any = null;
    try {
      plan = await generateVideoPlan({
        question,
        lang: targetLang,
        minutes: minutes === 5 ? 5 : 2,
      });
    } catch (planErr) {
      console.warn("[/api/video] Custom plan generation warning, falling back to engine prompts:", planErr);
    }

    const langInfo = (LANGUAGE_META as any)[targetLang] || { name: "English" };
    const enginePayload: any = {
      question: plan ? question : `[Language: ${langInfo.name}] [Target Duration: ${minutes || 2} minutes] ${question}`,
      options: {
        resolution: "720p",
        fps: 24,
        captions: true,
      },
    };

    if (plan) {
      enginePayload.plan = plan;
    }

    const engineRes = await engineFetch("/v1/videos", {
      method: "POST",
      body: JSON.stringify(enginePayload),
    });

    if (!engineRes.ok) {
      const errText = await engineRes.text().catch(() => "");
      console.error("[/api/video] Video engine error:", engineRes.status, errText);
      throw new Error(`Video engine error ${engineRes.status}: ${errText}`);
    }

    const job = await engineRes.json();
    const jobId = job.id;

    // Poll until video render is done
    const startTime = Date.now();
    const maxWaitMs = 480000; // 8 minutes timeout
    let completed = false;

    while (Date.now() - startTime < maxWaitMs) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const statusRes = await engineFetch(`/v1/videos/${jobId}`);
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        if (statusData.status === "done") {
          completed = true;
          break;
        }
        if (statusData.status === "failed") {
          throw new Error(`Video rendering failed: ${statusData.error || "Unknown engine error"}`);
        }
      }
    }

    if (!completed) {
      throw new Error("Video generation timed out on the engine server.");
    }

    const videoUrl = `/api/explainer/${jobId}/video`;

    // Deduct credit from user backend state
    try {
      const s = planCheck.state;
      if (s) {
        let remainingToDeduct = creditCost;
        if (s.pcredits >= remainingToDeduct) {
          s.pcredits -= remainingToDeduct;
          remainingToDeduct = 0;
        } else {
          remainingToDeduct -= s.pcredits;
          s.pcredits = 0;
          if (Array.isArray(s.topups)) {
            for (const t of s.topups) {
              if (t.n > 0 && remainingToDeduct > 0) {
                const take = Math.min(t.n, remainingToDeduct);
                t.n -= take;
                remainingToDeduct -= take;
              }
            }
          }
        }
        s.spent = (s.spent || 0) + creditCost;
        await db.saveUserState(planCheck.user.id, s, planCheck.user.email);
      }
    } catch (deductErr) {
      console.warn("Failed to deduct credit from DB:", deductErr);
    }
    
    return NextResponse.json({ url: videoUrl, id: jobId });
  } catch (err: any) {
    console.error("Video Generation Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
