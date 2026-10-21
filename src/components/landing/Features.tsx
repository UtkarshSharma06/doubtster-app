import type { CSSProperties } from "react";

export default function Features() {
  return (
    <section className="feat wrap" id="features">
      <div className="fhead" data-rv>
        <span className="bubble">how it works</span>
        <h2>stuck to <span className="hand">sorted</span>, in three steps</h2>
        <p>Ask any homework question the way you'd ask a friend, in maths, physics, chemistry, biology or coding. Read the step-by-step answer. If it still won't click, watch it drawn out.</p>
      </div>
      <div className="frow">
        <div className="ftxt" data-rv="left">
          <span className="fnum">01 · ASK</span>
          <h3>finally get the thing</h3>
          <p>Type the question exactly as it's stuck in your head. You get the answer in small steps, each one saying why, not a wall of text.</p>
          <ul className="fpts"><li><i>✓</i>small steps you can follow</li><li><i>✓</i>every step says why</li><li><i>✓</i>chat is free, always</li></ul>
          <a className="flink" href="/signup">ask your first question <span>→</span></a>
        </div>
        <div className="fdemo" data-rv="scale" style={{'--d': ".12s"} as CSSProperties}>
          <div className="deco d1">no wall<br />of text</div>
          <div className="win"><div className="tb"><i /><i /><i /><em>chat · doubtster</em><span>live</span></div>
            <div className="bd"><div className="cd" id="cdemo">
                <div className="u" id="cdq" />
                <div className="who" id="cdw"><img src="/brand/doubtster-icon.svg" alt="" />doubtster <span className="dots3" id="cdd"><b /><b /><b /></span></div>
                <ol id="cdl" />
              </div></div>
          </div>
        </div>
      </div>
      <div className="frow flip">
        <div className="fdemo" data-rv="scale" style={{'--d': ".12s"} as CSSProperties}>
          <div className="deco d1">even the<br />weird ones</div>
          <div className="win"><div className="tb"><i /><i /><i /><em>subjects</em><span>all of them</span></div>
            <div className="bd"><div className="sd" id="sdemo">
                <div className="mq" style={{'--t': "38s"} as CSSProperties}><div id="mq1" /></div>
                <div className="sq"><span className="lb" id="sql">calculus</span><span className="tx" id="sqt">why is the derivative of x² equal to 2x?</span><span className="go">↑</span></div>
                <div className="mq r" style={{'--t': "44s"} as CSSProperties}><div id="mq2" /></div>
                <div className="mq" style={{'--t': "34s"} as CSSProperties}><div id="mq3" /></div>
              </div></div>
          </div>
        </div>
        <div className="ftxt" data-rv="right">
          <span className="fnum">02 · ANY SUBJECT</span>
          <h3>ask anything you're studying</h3>
          <p>Maths, science, economics, coding, accounting and the odd one your syllabus throws at you. Asking never costs a credit.</p>
          <ul className="fpts"><li><i>✓</i>school, uni and exam prep</li><li><i>✓</i>English, French, Spanish and Hindi</li><li><i>✓</i>follow-up questions welcome</li></ul>
        </div>
      </div>
      <div className="frow">
        <div className="ftxt" data-rv="left">
          <span className="fnum">03 · WATCH</span>
          <h3>then watch it explained</h3>
          <p>Turn any answer into a short video. A voice talks you through it while the working is written out on the board, line by line.</p>
          <ul className="fpts"><li><i>✓</i>voice and board in sync</li><li><i>✓</i>diagrams drawn exactly</li><li><i>✓</i>maths steps machine-checked</li></ul>
          <a className="flink" href="#examples">see real examples <span>→</span></a>
        </div>
        <div className="fdemo" data-rv="scale" style={{'--d': ".12s"} as CSSProperties}>
          <div className="cb" id="cb2"><div className="bd2"><div className="svgw" id="board2" /></div><div className="tray"><i /><i /><i /><b /></div></div>
          <div className="cbcap"><span><b>scene 2 of 5</b> · acceleration</span><span>drawn live, the way the video does it</span></div>
        </div>
      </div>
    </section>
  );
}
