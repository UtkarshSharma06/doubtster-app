export default function Pricing() {
  return (
    <section className="sky" id="pricing"><div className="wrap">
        <div className="head">
          <h2>doubtster, your way</h2>
          <p>Chat is free. Videos run on credits. Cancel anytime.</p>
          <div className="tog" role="group" aria-label="billing"><button id="bm" className="on">monthly</button><button id="ba">yearly</button></div>
        </div>
        <div className="prices">
          <div className="pc"><h3>chat</h3><div className="s">ask until you get it</div><div className="p">$0</div><div className="u">free, always</div><a className="go" href="/app">start asking</a><small className="i">includes</small><ul><li>Unlimited text answers</li><li>Step by step working</li><li>Every subject</li></ul></div>
          <div className="pc pop"><span className="pp">starter</span><h3>trial</h3><div className="s">try the videos</div><div className="p">$1.99</div><div className="u">for 7 days</div><a className="go b" href="/signup">start trial</a><small className="i">includes</small><ul><li>3 explainer videos</li><li>Renews as a paid plan after day 7</li><li>Trial credits expire when the trial ends</li></ul></div>
          <div className="pc"><h3 id="pt">monthly plan</h3><div className="s">after the trial</div><div className="p" id="pp">$7.99</div><div className="u" id="pu">per month</div><a className="go" href="/checkout">choose plan</a><small className="i">includes</small><ul><li>30 video credits <span id="pc2">each month</span></li><li id="pv">about $0.27 a video</li><li>Credits reset monthly, no rollover</li></ul></div>
        </div>
        <div className="term"><span><b>&lt; top-ups &gt;</b>  10 credits for $4.99 or 25 for $9.99. Valid 90 days, paid plans only.</span><a href="#faq">how credits work</a></div>
        <p className="fine" id="save">Yearly is $59, about 38% less than 12 months of monthly.</p>
        <p className="fine">Forgot to cancel? That charge isn't refundable. Refunds only cover payment errors or account bugs on our side. <a href="/refund-policy">Refund policy</a></p>
      </div></section>
  );
}
