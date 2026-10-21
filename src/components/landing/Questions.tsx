import type { CSSProperties } from "react";

export default function Questions() {
  return (
    <section className="fb"><div className="wrap">
        <div className="scroller" aria-hidden="true"><div id="sc" /></div>
        <div className="grid">
          <div className="q"><div className="h" style={{background: "#FFD7E6"} as CSSProperties} /><div className="c"><small>maths</small>why is any number to the power 0 equal to 1?</div></div>
          <div className="q"><div className="h" style={{background: "#CFE2FF"} as CSSProperties} /><div className="c"><small>economics</small>explain elasticity like I'm tired and it's 1am</div></div>
          <div className="q"><div className="h" style={{background: "#D8F3DC"} as CSSProperties} /><div className="c"><small>coding</small>my loop never ends and I don't know why</div></div>
          <div className="q"><div className="h" style={{background: "#FFF1A6"} as CSSProperties} /><div className="c"><small>physics</small>what is the difference between speed and velocity, with a real example?</div></div>
          <div className="q"><div className="h" style={{background: "#E7D9FF"} as CSSProperties} /><div className="c"><small>chemistry</small>how do I balance this equation without guessing?</div></div>
          <div className="q"><div className="h" style={{background: "#FFD7E6"} as CSSProperties} /><div className="c"><small>accounting</small>why does depreciation reduce profit if no cash leaves?</div></div>
        </div>
        <p className="ill" style={{marginTop: "14px"} as CSSProperties}>Illustrative examples of the kind of thing students ask. We don't have reviews to show yet, and we won't make any up.</p>
      </div></section>
  );
}
