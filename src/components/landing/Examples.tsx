import type { CSSProperties } from "react";

export default function Examples() {
  return (
    <section className="ex" id="examples">
      <div className="exdesk" aria-hidden="true">
        <i style={{left: "4%", top: "120px", width: "70px", height: "26px", background: "#BCD7FF", '--r': "-8deg"} as CSSProperties} />
        <i style={{right: "6%", top: "90px", width: "54px", height: "54px", background: "var(--yellow)", '--dx': "-16px", '--dy': "14px", animationDuration: "17s"} as CSSProperties} />
        <i style={{left: "9%", bottom: "90px", width: "90px", height: "22px", background: "#C9F0D6", '--dx': "20px", animationDuration: "19s"} as CSSProperties} />
        <i style={{right: "3%", bottom: "150px", width: "64px", height: "30px", background: "#E6D9FF", '--r': "10deg", animationDuration: "15s"} as CSSProperties} />
      </div>
      <div className="exhead wrap">
        <span className="bubble">doubtster</span>
        <h2>see a real one, <em>start to finish<svg viewBox="0 0 200 20" preserveAspectRatio="none"><path d="M4 14 Q60 2 110 10 T196 8" /></svg></em></h2>
        <p>Four questions, four subjects. The voice, the board, the diagrams and the code in these videos all come from the Doubtster video engine.</p>
        <div className="ticker">
          <span style={{'--c': "#2F7BFF", transitionDelay: ".15s"} as CSSProperties}><b />maths</span>
          <span style={{'--c': "#E5484D", transitionDelay: ".25s"} as CSSProperties}><b />physics</span>
          <span style={{'--c': "#8A4DFF", transitionDelay: ".35s"} as CSSProperties}><b />coding</span>
          <span style={{'--c': "#12A150", transitionDelay: ".45s"} as CSSProperties}><b />biology</span>
        </div>
      </div>
      <div className="exgrid">
        <div className="exlist" id="exlist" role="tablist" aria-label="Example videos" />
        <div className="exstage" id="exstage">
          <div className="exnote n1" id="exn1"><b>WATCH FOR</b><span /></div>
          <div className="exnote n2" id="exn2"><b>IN THIS ONE</b><span /></div>
          <div className="explayer" id="explayer">
            <div className="win"><div className="tb"><i /><i /><i /><em id="exfile">integration-by-parts.mov</em><span className="live">engine render</span></div>
              <div className="bd">
                <div className="screen paused" id="exscreen">
                  <video id="exvid" playsInline muted preload="metadata" />
                  <div className="wipe" id="exwipe" />
                  <button className="snd hide" id="exsnd" type="button">🔈 tap for sound</button>
                  <button className="big-play" id="exbig" type="button" aria-label="Play">▶</button>
                  <div className="ctl"><button type="button" id="explay">❚❚ pause</button><div className="bar2" id="exbar" role="slider" aria-label="Seek" aria-valuemin={0} aria-valuemax={100} aria-valuenow={0}><i /></div><button type="button" id="exmute">🔈</button></div>
                </div>
              </div>
            </div>
          </div>
          <div className="exsteps" id="exsteps">
            <span><b>1</b> what we know</span><span><b>2</b> the method, and why</span><span><b>3</b> step by step</span><span><b>4</b> the answer</span><span><b>5</b> check and common mistake</span>
          </div>
        </div>
      </div>
      <nav className="exlinks" aria-label="Full example lessons">
        <span>full lessons with transcripts:</span>
        <a href="/examples/integral-of-x-sin-x-integration-by-parts">integral of x sin x by parts</a>
        <a href="/examples/block-sliding-down-incline-with-friction">block on an incline with friction</a>
        <a href="/examples/median-of-two-sorted-arrays">median of two sorted arrays</a>
        <a href="/examples/why-dna-replication-is-semiconservative">semiconservative DNA replication</a>
      </nav>
      <p className="ill">Sample videos made with the Doubtster video engine. Videos for your own questions follow the same steps but can vary, and AI can make mistakes.</p>
    </section>
  );
}
