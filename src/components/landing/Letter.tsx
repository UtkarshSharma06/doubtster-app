import type { CSSProperties } from "react";

export default function Letter() {
  return (
    <section className="letter"><div className="wrap letterbox">
        <div className="stairs l" aria-hidden="true"><i style={{left: "0", top: "210px", background: "#FF8EC8"} as CSSProperties} /><i style={{left: "34px", top: "178px", background: "#FF8ACF"} as CSSProperties} /><i style={{left: "68px", top: "146px", background: "#E88DE8"} as CSSProperties} /><i style={{left: "102px", top: "114px", background: "#C69AF2"} as CSSProperties} /><i style={{left: "136px", top: "82px", background: "#A7A7F7"} as CSSProperties} /><i style={{left: "170px", top: "50px", background: "#8DB6F8"} as CSSProperties} /></div>
        <div className="stairs r" aria-hidden="true"><i style={{right: "0", top: "210px", background: "#FFD66E"} as CSSProperties} /><i style={{right: "34px", top: "178px", background: "#E6DB6C"} as CSSProperties} /><i style={{right: "68px", top: "146px", background: "#C8DE72"} as CSSProperties} /><i style={{right: "102px", top: "114px", background: "#A6DE80"} as CSSProperties} /><i style={{right: "136px", top: "82px", background: "#86DB9C"} as CSSProperties} /><i style={{right: "170px", top: "50px", background: "#78D8C4"} as CSSProperties} /></div>
        <span className="tag">note from us</span>
        <div className="win"><div className="tb"><i /><i /><i /><em>note.txt</em></div><div className="bd">
            <p>Most of us have sat staring at a question at midnight, with a textbook that explains everything except the part we're stuck on.</p>
            <p>We think a good explanation is <mark>patient, shows its working and doesn't make you feel slow</mark> for asking.</p>
            <p>So that's what we're building: ask in chat, get the steps, and if it still won't click, watch it drawn out.</p>
            <p>It's early, and AI can get things wrong. We'd rather say that up front than hide it. If it's an exam answer, check it with your teacher.</p>
            <div className="sig"><img src="/brand/doubtster-icon.svg" alt="" width={34} height={34} /><div><b>the doubtster team</b><small>building this for students</small></div><span className="sg">doubtster</span></div>
          </div></div>
      </div></section>
  );
}
