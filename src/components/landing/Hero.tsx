import type { CSSProperties } from "react";

export default function Hero() {
  return (
    <section className="hero" id="hero">
      <div className="dots" /><div className="dots2" id="dots2" />
      <div className="stage" id="stage">
        <div className="fw a" data-d="1.1" style={{left: "38%", top: "18px", '--w': "250px"} as CSSProperties}><div className="win"><div className="tb"><i /><i /><i /><em>×</em></div><div className="bd"><div className="scr board"><small>SCENE 4 OF 6</small><span>30,000 × 0.85⁶</span></div></div></div><div className="cap">car-loan.mov</div></div>
        <div className="fw b" data-d="0.6" style={{left: "9%", top: "70px", '--w': "215px"} as CSSProperties}><div className="win"><div className="tb"><i /><i /><i /></div><div className="bd"><div className="scr chat"><span className="u">why does ice float?</span><span className="a">Solid water is less dense. Step 1: ...</span></div></div></div><div className="cap">chat.txt</div></div>
        <div className="fw hide-m" data-d="1.4" style={{left: "66%", top: "50px", '--w': "270px"} as CSSProperties}><div className="win"><div className="tb"><i /><i /><i /></div><div className="bd"><div className="scr code">{"def area(r):\n    "}<b>return</b>{" 3.14159 * r ** 2\nprint(area(4))  "}<b># 50.27</b></div></div></div><div className="cap">recursion.py</div></div>
        <div className="fw c" data-d="0.9" style={{left: "82%", top: "400px", '--w': "185px"} as CSSProperties}><div className="win"><div className="tb"><i /><i /><i /></div><div className="bd"><div className="scr sticky">step 3:<br />divide both sides</div></div></div><div className="cap">sticky.note</div></div>
        <div className="fw hide-m" data-d="0.7" style={{left: "3%", top: "410px", '--w': "235px"} as CSSProperties}><div className="win"><div className="tb"><i /><i /><i /></div><div className="bd"><div className="scr note"><div className="d">read the question</div><div className="d">write what is given</div><div>pick the formula</div><div>check the units</div></div></div></div><div className="cap">checklist.md</div></div>
        <div className="fw hide-m" data-d="1.2" style={{left: "19%", top: "600px", '--w': "150px"} as CSSProperties}><div className="win"><div className="tb"><i /><i /><i /></div><div className="bd"><div className="scr tile">Fe</div></div></div><div className="cap">chemistry.png</div></div>
        <div className="fw hide-m" data-d="0.5" style={{left: "73%", top: "610px", '--w': "215px"} as CSSProperties}><div className="win"><div className="tb"><i /><i /><i /></div><div className="bd"><div className="scr" style={{background: "#fff"} as CSSProperties}><svg viewBox="0 0 200 150" width="100%" height="100%"><path d="M12 128 Q100 -10 188 128" fill="none" stroke="#2F7BFF" strokeWidth={3} strokeDasharray="6 5" /><circle cx={100} cy={42} r={6} fill="#2F7BFF" /><line x1={12} y1={130} x2={188} y2={130} stroke="#bbb" /><text x={76} y={30} fontSize={11} fill="#555">v = 12 m/s</text></svg></div></div></div><div className="cap">projectile.mov</div></div>
        <div className="nm hide-m" style={{left: "27%", top: "36px", transform: "rotate(-5deg)", '--c': "#2F6BFF"} as CSSProperties}><i>HELLO<br />my name is</i><b>doubtster</b></div>
        <div className="nm hide-m" style={{left: "86%", top: "225px", transform: "rotate(6deg)", '--c': "#E5483B"} as CSSProperties}><i>HELLO<br />my name is</i><b>doubtster</b></div>
        <div className="fold hide-m" style={{left: "23%", top: "290px"} as CSSProperties} />
        <div className="fold hide-m" style={{left: "90%", top: "720px"} as CSSProperties} />
        <div className="trash hide-m" style={{left: "5%", top: "300px"} as CSSProperties}><svg viewBox="0 0 44 54" width={44} height={54}><path d="M6 12h32l-3 38a3 3 0 0 1-3 3H12a3 3 0 0 1-3-3z" fill="#D9DCE3" stroke="#9AA0AD" /><rect x={4} y={7} width={36} height={6} rx={3} fill="#C4C8D2" stroke="#9AA0AD" /><path d="M15 18v28M22 18v28M29 18v28" stroke="#9AA0AD" /><rect x={12} y={2} width={6} height={8} rx={2} fill="#FF7AB8" /><rect x={20} y={0} width={6} height={10} rx={2} fill="#5AA2FF" /><rect x={28} y={3} width={6} height={7} rx={2} fill="#FFD84D" /></svg></div>
        <div className="dot2 hide-m" style={{left: "55%", top: "210px"} as CSSProperties} />
        <div className="kao" style={{left: "25%", top: "215px"} as CSSProperties}>^ ω ^</div>
        <div className="kao" style={{left: "70%", top: "20px"} as CSSProperties}>¯\_(ツ)_/¯</div>
        <div className="kao hide-m" style={{left: "90%", top: "345px"} as CSSProperties}>{'{'} ^_^ {'}'}</div>
        <div className="kao hide-m" style={{left: "7%", top: "700px"} as CSSProperties}>(¬_¬)</div>
        <div className="center">
          <h1>doubtster<span className="sr-only">: AI homework helper with step-by-step answers and video explanations</span></h1>
          <p className="sub">an AI homework helper that explains it on video</p>
          <div className="hchat" id="hchat">
            <div className="hc-top"><img src="/brand/doubtster-icon.svg" alt="" /><span>ask doubtster</span><span className="free">chat is free</span></div>
            <form id="hform" action="/app" method="get">
              <div className="tw"><div className="ty" id="hty" aria-hidden="true" /><textarea id="hq" name="q" rows={2} aria-label="Ask a question" maxLength={300} defaultValue={""} /></div>
              <button className="send" type="submit" aria-label="Ask" id="hsend">↑</button>
            </form>
            <div className="chips" id="hchips"><button type="button">why does ice float?</button><button type="button">solve 2x + 5 = 17</button><button type="button">explain recursion</button></div>
          </div>
          <div className="btns">
            <a className="pill b" href="/signup">start your trial</a>
            <a className="pill" href="/app">ask in chat, free</a>
          </div>
          <p className="note-s">$1.99 for 7 days and 3 videos. Cancel before day 7 and that's all you pay.</p>
        </div>
      </div>
      <div className="vidwrap">
        <div className="film" id="big">
          <div className="win"><div className="tb"><i /><i /><i /><em>the-doubtster-film.mov</em><span>0:22</span></div>
            <div className="bd"><div className="fscr" id="fscr">
                <video id="fvid" playsInline preload="metadata" />
                <button className="fhit" id="fhit" type="button" aria-label="Play the Doubtster film" />
              </div></div>
          </div>
        </div>
        <p className="ill">The Doubtster film, 22 seconds. Turn the sound on.</p>
      </div>
    </section>
  );
}
