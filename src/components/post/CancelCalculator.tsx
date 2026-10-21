"use client";
import { useState } from "react";
import { PRICING, trialOutcome, usd } from "@/content/pricing";

export function CancelCalculator() {
  const [plan, setPlan] = useState<"monthly" | "annual">("monthly");
  const [day, setDay] = useState(3);
  const r = trialOutcome(plan, day);
  const msg =
    r.tone === "good"
      ? `Cancelling on day ${day} costs ${usd(PRICING.trialPrice)} in total. No plan charge, and you keep your ${PRICING.trialVideos} trial videos until day ${PRICING.trialDays}.`
      : r.tone === "warn"
      ? "Cancel at least a day early. Day 6 is the last safe day, and the timing is easy to get wrong."
      : `Your ${plan} plan has started and the charge is not refundable. Forgetting to cancel is not a reason for a refund.`;
  return (
    <div className="calc" role="group" aria-label="Cancellation cost calculator">
      <div className="crow">
        <div className="seg" role="group" aria-label="Plan">
          {(["monthly", "annual"] as const).map((p) => (
            <button key={p} type="button" aria-pressed={plan === p} onClick={() => setPlan(p)}>
              {p === "monthly" ? "Monthly" : "Annual"}
            </button>
          ))}
        </div>
        <label className="slider">
          <span>I cancel on day <b>{day}</b></span>
          <input type="range" min={0} max={10} step={1} value={day} onChange={(e) => setDay(+e.target.value)} />
        </label>
      </div>
      <div className="track" aria-hidden="true">
        {Array.from({ length: 11 }, (_, i) => (
          <i key={i} className={i >= 7 ? "paid" : undefined} data-on={i <= day} />
        ))}
      </div>
      <div className="tl" aria-hidden="true"><span>Day 0</span><span>Trial ends day 7</span><span>Day 10</span></div>
      <div className="res">
        <div><span>Total paid</span><b>{usd(r.total)}</b></div>
        <div><span>Plan charge</span><b>{usd(r.charge)}</b></div>
        <div><span>Videos kept</span><b>{r.videos}</b></div>
      </div>
      <p className={`verdict ${r.tone}`} role="status">{msg}</p>
    </div>
  );
}
