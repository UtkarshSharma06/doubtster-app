import type { CSSProperties } from "react";

export default function FinalCta() {
  return (
    <section className="cta" id="start" data-rv="scale">
      <div className="glow" />
      <span className="chalk" style={{left: "4%", top: "16%", fontSize: "44px"} as CSSProperties}>∫ x·sin(x) dx</span>
      <span className="chalk" style={{right: "6%", top: "22%", fontSize: "38px", animationDelay: "-6s"} as CSSProperties}>a = g(sin θ − μ cos θ)</span>
      <span className="chalk" style={{left: "8%", bottom: "14%", fontSize: "36px", animationDelay: "-3s"} as CSSProperties}>2x + 5 = 17</span>
      <span className="chalk" style={{right: "9%", bottom: "12%", fontSize: "40px", animationDelay: "-9s"} as CSSProperties}>O(log n)</span>
      <div className="ctain">
        <img className="lg" src="/brand/doubtster-logo-dark.svg" alt="Doubtster" />
        <h2>stuck right now? <br /><span className="hand">just ask it.</span></h2>
        <p>Chat is free, forever. When reading isn't enough, watch it explained on the board.</p>
        <div className="btns"><a className="pill b" href="/signup">start your trial</a><a className="pill" href="/app">ask in chat, free</a></div>
        <p className="note-s" style={{color: "#8A8A94", marginTop: "16px"} as CSSProperties}>$1.99 for 7 days and 3 videos. Cancel before day 7 and that's all you pay.</p>
      </div>
    </section>
  );
}
