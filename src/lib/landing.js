/* eslint-disable */
// Doubtster landing page behaviour: hero motion, chalkboard lessons, notes viewer,
// example video player, film, pricing toggle and scroll animations.
// Runs once in the browser after the page has rendered (see components/landing/LandingEffects.tsx).

export function initLanding() {
  if (typeof window === "undefined" || window.__doubtsterLanding) return;
  window.__doubtsterLanding = true;
  /* ---- part 0 ---- */

(function(){
var $=function(i){return document.getElementById(i)};
$('yr').textContent=new Date().getFullYear();
function tick(){var d=new Date();$('clock').textContent=d.toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})}
tick();setInterval(tick,30000);
var w=['they ask it everyday ','they ask it everyday ','they ask it everyday ','they ask it everyday '];
$('sc').innerHTML=(w.map(function(t,i){return '<span>'+t+'</span>'}).join(''))+(w.map(function(t){return '<span>'+t+'</span>'}).join(''));

/* pricing toggle */
var P={m:{t:'monthly plan',p:'$7.99',u:'per month',c:'each month',v:'about $0.27 a video',s:'Yearly is $59, about 38% less than 12 months of monthly.'},
       a:{t:'yearly plan',p:'$59',u:'per year',c:'released monthly',v:'about $0.16 a video',s:'That is about 38% less than 12 months of monthly.'}};
function setPlan(k){var o=P[k];$('pt').textContent=o.t;$('pp').textContent=o.p;$('pu').textContent=o.u;$('pc2').textContent=o.c;$('pv').textContent=o.v;$('save').textContent=o.s;
 $('bm').className=k=='m'?'on':'';$('ba').className=k=='a'?'on':''}
$('bm').onclick=function(){setPlan('m')};$('ba').onclick=function(){setPlan('a')};

/* ---------- chalkboard engine: writes and draws like a teacher ---------- */
function Chalk(host,capEl){
 var NS='http://www.w3.org/2000/svg',self=this,uid=(Chalk.n=(Chalk.n||0)+1),cn=0,dn=0;
 function S(t,a){var e=document.createElementNS(NS,t);for(var k in a)e.setAttribute(k,a[k]);return e}
 var svg=S('svg',{viewBox:'0 0 800 450',preserveAspectRatio:'xMidYMid meet'});svg.style.cssText='width:100%;height:100%;display:block';
 var defs=S('defs'),flt=S('filter',{id:'chk'+uid,x:'-5%',y:'-5%',width:'110%',height:'110%'});
 flt.appendChild(S('feTurbulence',{type:'fractalNoise',baseFrequency:'.8',numOctaves:'2',seed:'3',result:'n'}));
 flt.appendChild(S('feDisplacementMap',{'in':'SourceGraphic',in2:'n',scale:'2.2'}));defs.appendChild(flt);svg.appendChild(defs);
 var layer=S('g',{filter:'url(#chk'+uid+')'}),fx=S('g'),stick=S('g',{opacity:0});
 stick.appendChild(S('rect',{x:-3.5,y:-30,width:7,height:30,rx:2.5,fill:'#F6F4EA'}));stick.appendChild(S('rect',{x:-3.5,y:-30,width:7,height:6,rx:2.5,fill:'#CFCCBC'}));
 svg.appendChild(layer);svg.appendChild(fx);fx.appendChild(stick);host.appendChild(svg);
 self.paused=false;self.speed=1;self.tok=0;self.beats=[];
 function tween(ms,fn,tok){return new Promise(function(res){var t=0,last=performance.now();(function f(now){if(tok!==self.tok)return res(false);var dt=Math.max(0,Math.min(64,now-last));last=now;if(!self.paused)t+=dt*self.speed;var p=Math.min(1,t/ms);if(fn)fn(p);if(p>=1)res(true);else requestAnimationFrame(f)})(last)})}
 function move(x,y){stick.setAttribute('transform','translate('+x.toFixed(1)+' '+y.toFixed(1)+') rotate(24)');stick.setAttribute('opacity',1);
  if(cn++%5==0){var d=S('circle',{cx:x+(Math.random()-.5)*6,cy:y+Math.random()*4,r:1+Math.random()*1.4,fill:'#F3F1E7',opacity:.7});d.style.animation='dust 1s ease-out forwards';fx.insertBefore(d,stick);setTimeout(function(){d.remove()},1000)}}
 function hide(){stick.setAttribute('opacity',0)}
 async function draw(op,tok,fast){
  if(op.k=='wait')return fast?true:tween(op.ms,null,tok);
  if(op.k=='erase'){if(fast){layer.innerHTML='';return true}var ok=await tween(650,function(p){layer.setAttribute('opacity',1-p)},tok);layer.innerHTML='';layer.setAttribute('opacity',1);return ok}
  if(op.k=='text'){var t=S('text',{x:op.x,y:op.y,'font-size':op.s||30,fill:op.c||'#F3F1E7','font-family':'Caveat,cursive','font-weight':600});if(op.a)t.setAttribute('text-anchor',op.a);t.textContent=op.t;layer.appendChild(t);
   if(fast)return true;var bb=t.getBBox(),id='cp'+uid+'_'+(++dn),cp=S('clipPath',{id:id}),r=S('rect',{x:bb.x-4,y:bb.y-4,width:0,height:bb.height+8});cp.appendChild(r);defs.appendChild(cp);t.setAttribute('clip-path','url(#'+id+')');
   var ok2=await tween(Math.max(450,op.t.length*(op.v||58)),function(p){r.setAttribute('width',(bb.width+8)*p);move(bb.x+bb.width*p,bb.y+bb.height*.74+Math.sin(p*38)*2)},tok);t.removeAttribute('clip-path');cp.remove();return ok2}
  if(op.k=='path'){var p=S('path',{d:op.d,fill:op.f||'none',stroke:op.c||'#F3F1E7','stroke-width':op.w||3,'stroke-linecap':'round','stroke-linejoin':'round'});layer.appendChild(p);if(fast)return true;
   var L=p.getTotalLength();p.setAttribute('stroke-dasharray',L);p.setAttribute('stroke-dashoffset',L);if(op.f)p.setAttribute('fill-opacity',0);
   var ok3=await tween(op.ms||Math.max(280,L*3),function(q){p.setAttribute('stroke-dashoffset',L*(1-q));if(op.f)p.setAttribute('fill-opacity',q*.9);var pt=p.getPointAtLength(L*q);move(pt.x,pt.y)},tok);p.removeAttribute('stroke-dasharray');p.removeAttribute('stroke-dashoffset');return ok3}
  return true}
 function est(b){var n=0;b.ops.forEach(function(o){n+=o.k=='text'?Math.max(450,o.t.length*(o.v||58)):o.k=='path'?(o.ms||700):o.k=='wait'?o.ms:300});return Math.max(1800,Math.min(7000,n))}
 function setCap(t,ms,fast){if(!capEl)return;capEl.innerHTML='';if(!t){capEl.style.display='none';return}capEl.style.display='block';var w=t.split(' '),step=Math.min(260,Math.max(50,ms*.85/w.length));
  w.forEach(function(x,i){var s=document.createElement('span');s.textContent=x+' ';if(fast){s.style.animation='none';s.style.opacity=1}else s.style.animationDelay=(i*step)+'ms';capEl.appendChild(s)})}
 self.load=function(b){self.beats=b;b.forEach(function(x){x.ms=est(x)})};
 self.showUpTo=function(i){self.tok++;layer.innerHTML='';layer.setAttribute('opacity',1);hide();for(var k=0;k<i&&k<self.beats.length;k++)self.beats[k].ops.forEach(function(o){draw(o,self.tok,true)});setCap(i>0?self.beats[Math.min(i,self.beats.length)-1].cap:'',0,true)};
 self.playFrom=async function(i,onBeat,onEnd){self.showUpTo(i);var tok=self.tok;setCap('',0);
  for(var k=i;k<self.beats.length;k++){var b=self.beats[k];if(onBeat)onBeat(k);setCap(b.cap,b.ms);
   for(var j=0;j<b.ops.length;j++){var ok=await draw(b.ops[j],tok,false);if(!ok)return}
   hide();if(!(await tween(b.pause||650,null,tok)))return}
  if(onEnd)onEnd()};
 self.hold=function(ms){return tween(ms,null,self.tok)};
 self.erase=async function(){setCap('',0);var ok=await draw({k:'erase'},self.tok,false);return ok};
 self.stop=function(){self.tok++;hide()};
}
function cj(a){return a+(Math.random()-.5)*3}
function cLine(x1,y1,x2,y2){return 'M'+cj(x1).toFixed(1)+' '+cj(y1).toFixed(1)+' Q'+((x1+x2)/2+(Math.random()-.5)*5).toFixed(1)+' '+((y1+y2)/2+(Math.random()-.5)*5).toFixed(1)+' '+cj(x2).toFixed(1)+' '+cj(y2).toFixed(1)}
function cBox(x,y,w,h){return 'M'+cj(x)+' '+cj(y)+' L'+cj(x+w)+' '+cj(y)+' L'+cj(x+w)+' '+cj(y+h)+' L'+cj(x)+' '+cj(y+h)+' L'+cj(x)+' '+cj(y-4)}
function cEll(cx,cy,rx,ry){var d='';for(var i=0;i<=52;i++){var a=-1.9+i/48*Math.PI*2.1,k=1+Math.sin(i*.7)*.012+i*.0015;d+=(i?'L':'M')+(cx+Math.cos(a)*rx*k).toFixed(1)+' '+(cy+Math.sin(a)*ry*k).toFixed(1)}return d}
function cWrap(t,n){var w=t.split(' '),out=[],cur='';w.forEach(function(x){if((cur+' '+x).trim().length>n&&cur){out.push(cur);cur=x}else cur=(cur+' '+x).trim()});if(cur)out.push(cur);return out}
function carLesson(){
 var Y='#FFE27A',B='#9FD0FF',G='#8CE8A8',W='#F3F1E7',M='#BDBBAE',vals=[30000,25500,21675,18423.75,15660.19,13311.16,11314.49],lab=['30k','25.5k','21.7k','18.4k','15.7k','13.3k','11.3k'];
 var bars=[{k:'path',d:cLine(440,350,786,350),ms:500},{k:'path',d:cLine(440,350,440,128),ms:450,c:M}];
 vals.forEach(function(v,i){var h=190*v/30000,x=452+i*46,y=350-h;bars.push({k:'path',d:cBox(x,y,34,h),f:'rgba(159,208,255,.28)',c:B,w:2.6,ms:380});bars.push({k:'text',t:lab[i],x:x+17,y:y-8,s:17,a:'middle',c:W,v:40});bars.push({k:'text',t:String(i),x:x+17,y:374,s:19,a:'middle',c:M,v:40})});
 bars.push({k:'text',t:'years',x:620,y:402,s:21,a:'middle',c:M});
 return [
  {cap:'A car loses value every year. So what is a $30,000 car worth after 6 years?',ops:[{k:'text',t:'Car depreciation',x:30,y:62,s:48,c:Y},{k:'path',d:cLine(30,74,330,72),c:Y,ms:420}]},
  {cap:'It starts at $30,000 and loses 15% of its value every single year.',ops:[{k:'text',t:'a $30,000 car',x:30,y:126,s:34},{k:'text',t:'loses 15% each year',x:30,y:166,s:34,c:B},{k:'text',t:'worth after 6 years = ?',x:30,y:206,s:34}]},
  {cap:'Here is the rule: multiply by 0.85, once for every year that passes.',ops:[{k:'text',t:'v = p × (1 − r)ⁿ',x:34,y:270,s:40,c:G},{k:'path',d:cBox(20,236,290,48),c:G,w:2.6,ms:700},{k:'text',t:'p = 30,000   r = 0.15   n = 6',x:30,y:320,s:25,c:M}]},
  {cap:'Watch it shrink. Each year we take 15% of a smaller amount, so the drop slows down.',ops:bars,pause:900},
  {cap:'So after 6 years, the car is worth about $11,314.',ops:[{k:'text',t:'30,000 × 0.85⁶',x:30,y:364,s:32},{k:'text',t:'= $11,314.49',x:30,y:406,s:38,c:G},{k:'path',d:cEll(128,394,132,29),c:G,w:2.8,ms:800}],pause:300}]}
function accelLesson(){var Y='#FFE27A',B='#9FD0FF',G='#8CE8A8';
 return [{cap:'',ops:[{k:'text',t:'a = (v − u) / t',x:60,y:130,s:50,c:B},{k:'text',t:'a = 12 / 6',x:60,y:210,s:50},{k:'text',t:'= 2 m/s²',x:60,y:290,s:54,c:G},{k:'path',d:cEll(190,277,170,40),c:G,w:3,ms:800}]}]}
function lessonFromScenes(v){
 var T=v.scenes[0].t,st=v.scenes.filter(function(s){return s.k=='s'}),res=v.scenes.filter(function(s){return s.k=='r'})[0],Y='#FFE27A',cols=['#F3F1E7','#9FD0FF','#FFE27A','#BFEAD0'];
 var beats=[{cap:'Let\'s work through this: '+T+'.',ops:[{k:'text',t:T.length>30?T.slice(0,29)+'…':T,x:30,y:62,s:46,c:Y},{k:'path',d:cLine(30,74,Math.min(760,60+Math.min(T.length,30)*17),72),c:Y,ms:420}]}],y=124;
 st.forEach(function(s,i){var ls=cWrap((i+1)+'. '+s.t,46),need=ls.length*38+14,ops=[];
  if(y+need>388){ops.push({k:'erase'});y=64}
  ls.forEach(function(l,j){ops.push({k:'text',t:l,x:j?52:30,y:y+j*38,s:29,c:cols[i%4]})});y+=need;beats.push({cap:s.t,ops:ops})});
 if(res){var ls2=cWrap(res.t,40),ops2=[],need2=ls2.length*40+30;if(y+need2>400){ops2.push({k:'erase'});y=90}
  ls2.forEach(function(l,j){ops2.push({k:'text',t:l,x:36,y:y+j*40,s:32,c:'#8CE8A8'})});ops2.push({k:'path',d:cBox(22,y-32,Math.min(756,ls2.reduce(function(a,l){return Math.max(a,l.length)},0)*13+40),ls2.length*40+16),c:'#8CE8A8',w:2.8,ms:700});beats.push({cap:res.t,ops:ops2})}
 return beats}

/* hero chalkboard lesson */
var big=$('big'),reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,vis=true;
var ck2=new Chalk($('board2'),null),L2=accelLesson();ck2.load(L2);
var ready=(document.fonts&&document.fonts.ready?Promise.race([document.fonts.ready,new Promise(function(r){setTimeout(r,1500)})]):Promise.resolve());
ready.then(function(){
 if(reduce){ck2.showUpTo(1);return}
 new IntersectionObserver(function(en,ob){if(en[0].isIntersecting){ob.disconnect();ck2.playFrom(0)}}).observe($('cb2'));
});

/* structured notes viewer */
var AR='<defs><marker id="MK" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#444"/></marker></defs>';
function ar(id){return AR.replace(/MK/g,id)}
var NOTES=[
{id:'bio',tab:'Biology',t:'#2E9E5B',tb:'#E3F5E8',file:'photosynthesis.md',title:'Photosynthesis',
 html:'<h5>Key idea</h5><p>Plants turn light energy into chemical energy stored in glucose.</p><h5>Two stages</h5><ol><li><b>Light-dependent reactions</b> in the thylakoid membranes: water is split, O₂ is released, ATP and NADPH are made.</li><li><b>Calvin cycle</b> in the stroma: CO₂ is fixed into sugar using that ATP and NADPH.</li></ol><div class="eqn">6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂</div><div class="tip"><b>Exam tip:</b> the oxygen comes from water, not from CO₂.</div>',
 cap:'Inside a chloroplast',
 svg:'<svg class="ds" viewBox="0 0 400 300" role="img" aria-label="Chloroplast with thylakoid stacks and stroma, showing inputs and outputs of photosynthesis">'+ar('a1')+'<ellipse cx="200" cy="165" rx="150" ry="92" fill="#EAF7EE" stroke="#2E9E5B" stroke-width="3"/><ellipse cx="200" cy="165" rx="138" ry="80" fill="none" stroke="#2E9E5B" stroke-width="1" stroke-dasharray="3 4"/>'+[[88,128],[132,168],[92,196]].map(function(p){var o='';for(var i=0;i<4;i++)o+='<rect x="'+p[0]+'" y="'+(p[1]+i*10)+'" width="46" height="8" rx="4" fill="#7BCB96" stroke="#2E9E5B"/>';return o}).join('')+'<text x="68" y="248" class="sm">thylakoids (grana)</text><text x="258" y="170" class="bold">stroma</text><text x="236" y="186" class="sm">Calvin cycle</text><path d="M152 168 L226 168" stroke="#444" stroke-width="1.6" stroke-dasharray="4 3" marker-end="url(#a1)" fill="none"/><text x="168" y="160" class="sm">ATP, NADPH</text><circle cx="40" cy="42" r="14" fill="#FFD84D" stroke="#E0A800"/><path d="M58 54 L96 112" stroke="#444" stroke-width="1.8" marker-end="url(#a1)" fill="none"/><text x="66" y="46" class="sm">light</text><path d="M14 168 L74 168" stroke="#444" stroke-width="1.8" marker-end="url(#a1)" fill="none"/><text x="14" y="160" class="bold">H₂O</text><path d="M126 120 L168 42" stroke="#444" stroke-width="1.8" marker-end="url(#a1)" fill="none"/><text x="172" y="40" class="bold">O₂</text><path d="M392 128 L304 140" stroke="#444" stroke-width="1.8" marker-end="url(#a1)" fill="none"/><text x="348" y="120" class="bold">CO₂</text><path d="M290 198 L300 268" stroke="#444" stroke-width="1.8" marker-end="url(#a1)" fill="none"/><text x="262" y="288" class="bold">glucose</text></svg>',
 cards:[['Where do the light-dependent reactions happen?','In the thylakoid membranes'],['Where does the O₂ released come from?','From water, split by light (photolysis)'],['What does the Calvin cycle do?','Uses ATP and NADPH to fix CO₂ into sugar']]},
{id:'chem',tab:'Chemistry',t:'#2F7BFF',tb:'#E6F0FF',file:'water-bonding.md',title:'Covalent bonding in water',
 html:'<h5>Key idea</h5><p>In a covalent bond, atoms share a pair of electrons. Oxygen shares one pair with each hydrogen.</p><h5>Shape</h5><ul><li>Oxygen has 2 bonding pairs and 2 lone pairs.</li><li>Lone pairs repel more strongly, squeezing the bond angle to about 104.5° (a bent shape).</li></ul><h5>Polarity</h5><p>Oxygen is more electronegative, so it pulls the shared electrons: δ− on O and δ+ on each H. The bent shape means the dipoles do not cancel, so water is polar.</p><div class="eqn">polar molecules → hydrogen bonds → high boiling point</div><div class="tip"><b>Exam tip:</b> say lone pairs repel more than bonding pairs to explain why the angle is below 109.5°.</div>',
 cap:'Bent shape and polarity of H₂O',
 svg:'<svg class="ds" viewBox="0 0 400 300" role="img" aria-label="Water molecule showing the 104.5 degree bond angle, lone pairs and partial charges">'+ar('a2')+'<path d="M200 130 L125 188 M200 130 L275 188" stroke="#444" stroke-width="5" stroke-linecap="round"/><circle cx="200" cy="130" r="32" fill="#FFC9C4" stroke="#D6453D" stroke-width="2.5"/><text x="200" y="138" text-anchor="middle" class="bold" style="font-size:22px">O</text><circle cx="125" cy="188" r="22" fill="#DCEAFF" stroke="#2F7BFF" stroke-width="2.5"/><text x="125" y="195" text-anchor="middle" class="bold" style="font-size:17px">H</text><circle cx="275" cy="188" r="22" fill="#DCEAFF" stroke="#2F7BFF" stroke-width="2.5"/><text x="275" y="195" text-anchor="middle" class="bold" style="font-size:17px">H</text><g fill="#D6453D"><circle cx="181" cy="90" r="3.2"/><circle cx="190" cy="86" r="3.2"/><circle cx="210" cy="86" r="3.2"/><circle cx="219" cy="90" r="3.2"/></g><text x="200" y="72" text-anchor="middle" class="sm">2 lone pairs</text><path d="M160.5 160.6 A50 50 0 0 0 239.5 160.6" fill="none" stroke="#444" stroke-width="1.5"/><text x="200" y="214" text-anchor="middle" class="bold">104.5°</text><text x="244" y="116" class="bold" fill="#D6453D" style="fill:#D6453D;font-size:15px">δ−</text><text x="108" y="232" class="bold" style="fill:#2F7BFF;font-size:15px">δ+</text><text x="270" y="232" class="bold" style="fill:#2F7BFF;font-size:15px">δ+</text><path d="M340 215 L340 90" stroke="#444" stroke-width="2" marker-end="url(#a2)" fill="none"/><text x="332" y="240" text-anchor="middle" class="sm">net dipole</text><text x="200" y="274" text-anchor="middle" class="sm">The two O–H dipoles do not cancel</text></svg>',
 cards:[['Shape of an H₂O molecule?','Bent, with a bond angle of about 104.5°'],['Why is water a polar molecule?','O is more electronegative and the shape is bent, so the dipoles do not cancel'],['Which force holds water molecules to each other?','Hydrogen bonds']]},
{id:'phy',tab:'Physics',t:'#E0A800',tb:'#FFF4C9',file:'projectile-motion.md',title:'Projectile motion',
 html:'<h5>Key idea</h5><p>Horizontal and vertical motion are independent.</p><h5>Rules</h5><ul><li>Horizontal: no acceleration, so vₓ = v₀cosθ stays constant.</li><li>Vertical: acceleration is g = 9.8 m/s² downward, so vᵧ = v₀sinθ − gt.</li></ul><div class="eqn">T = 2v₀sinθ / g<br>R = v₀² sin2θ / g</div><h5>Worked example</h5><p>v₀ = 20 m/s at θ = 30°:<br>T = 2 × 20 × 0.5 / 9.8 ≈ <b>2.04 s</b><br>R = 400 × sin60° / 9.8 ≈ <b>35.3 m</b></p><div class="tip"><b>Exam tip:</b> these formulas assume level ground and no air resistance.</div>',
 cap:'Path of a projectile on level ground',
 svg:'<svg class="ds" viewBox="0 0 400 300" role="img" aria-label="Projectile path with launch angle, velocity components, maximum height and range">'+ar('a3')+'<line x1="20" y1="240" x2="385" y2="240" stroke="#888" stroke-width="2"/><path d="M40 240 Q200 80 360 240" fill="none" stroke="#2F7BFF" stroke-width="2.5" stroke-dasharray="7 5"/><circle cx="200" cy="160" r="5" fill="#2F7BFF"/><path d="M40 240 L92 188" stroke="#D6453D" stroke-width="2.6" marker-end="url(#a3)" fill="none"/><path d="M40 240 L92 240" stroke="#444" stroke-width="1.4" stroke-dasharray="3 3"/><path d="M92 240 L92 188" stroke="#444" stroke-width="1.4" stroke-dasharray="3 3"/><path d="M68 240 A28 28 0 0 0 60 220" fill="none" stroke="#444" stroke-width="1.3"/><text x="72" y="232" class="bold">θ</text><text x="58" y="200" class="bold" style="fill:#D6453D">v₀</text><text x="64" y="256" class="sm">vₓ</text><text x="98" y="216" class="sm">vᵧ</text><path d="M200 160 L250 160" stroke="#444" stroke-width="2" marker-end="url(#a3)" fill="none"/><text x="214" y="150" class="sm">vₓ only, vᵧ = 0</text><path d="M200 160 L200 240" stroke="#888" stroke-width="1.2" stroke-dasharray="4 4"/><text x="206" y="206" class="bold">H</text><path d="M40 266 L360 266" stroke="#444" stroke-width="1.6" marker-start="url(#a3)" marker-end="url(#a3)" fill="none"/><text x="200" y="285" text-anchor="middle" class="bold">R (range)</text><path d="M335 100 L335 150" stroke="#444" stroke-width="2" marker-end="url(#a3)" fill="none"/><text x="322" y="92" class="sm">g = 9.8 m/s²</text></svg>',
 cards:[['Horizontal velocity of a projectile (no air resistance)?','Constant, because there is no horizontal acceleration'],['Launch angle for maximum range on level ground?','45°'],['Vertical velocity at the top of the path?','Zero, but the horizontal component remains']]},
{id:'code',tab:'Coding',t:'#7B5CFF',tb:'#ECE7FF',file:'binary-search.md',title:'Binary search',
 html:'<h5>Key idea</h5><p>On a sorted array, compare with the middle and discard the half that cannot contain the target.</p><h5>Steps</h5><ol><li>Set lo = 0 and hi = n − 1.</li><li>mid = (lo + hi) // 2.</li><li>If a[mid] is the target, stop. If it is smaller, set lo = mid + 1. Otherwise set hi = mid − 1.</li><li>Repeat until lo &gt; hi, which means not found.</li></ol><pre>def search(a, t):\n    lo, hi = 0, len(a) - 1\n    while lo &lt;= hi:\n        mid = (lo + hi) // 2\n        if a[mid] == t: return mid\n        if a[mid] &lt; t: lo = mid + 1\n        else: hi = mid - 1\n    return -1</pre><div class="eqn">time O(log n), extra space O(1)</div><div class="tip"><b>Exam tip:</b> the array must be sorted or the halving logic breaks.</div>',
 cap:'Searching for 23 in a sorted array',
 svg:(function(){var v=[2,5,8,12,16,23,38,56];function row(y,lo,mid,hi,fade,found){var o='';v.forEach(function(n,i){var x=25+i*44,out=i<lo||i>hi,f=i==mid?(found?'#BFEAD0':'#FFE27A'):'#fff',s=i==mid?(found?'#1E9E5A':'#E0A800'):'#7B5CFF';o+='<g opacity="'+(out?.28:1)+'"><rect x="'+x+'" y="'+y+'" width="40" height="40" rx="6" fill="'+f+'" stroke="'+s+'" stroke-width="2"/><text x="'+(x+20)+'" y="'+(y+26)+'" text-anchor="middle" class="bold" style="font-size:15px">'+n+'</text><text x="'+(x+20)+'" y="'+(y+54)+'" text-anchor="middle" class="sm">'+i+'</text></g>'});
  [['lo',lo],['mid',mid],['hi',hi]].forEach(function(p){var x=25+p[1]*44+20,dx=p[0]=='lo'&&lo==mid?-10:p[0]=='hi'&&hi==mid?10:0;o+='<text x="'+(x+dx)+'" y="'+(y+74)+'" text-anchor="middle" class="bold" style="font-size:12px;fill:'+(p[0]=='mid'?(found?'#1E9E5A':'#B58900'):'#7B5CFF')+'">'+p[0]+'</text>'});return o}
  return '<svg class="ds" viewBox="0 0 400 300" role="img" aria-label="Binary search on a sorted array finding 23 in two steps">'+'<text x="25" y="24" class="bold">Step 1: mid = 3, and 12 &lt; 23, so go right</text>'+row(36,0,3,7)+'<text x="25" y="150" class="bold">Step 2: mid = 5, and 23 = target. Found.</text>'+row(162,4,5,7,0,1)+'<text x="200" y="282" text-anchor="middle" class="sm">Each step halves the search range, so O(log n)</text></svg>'})(),
 cards:[['Time complexity of binary search?','O(log n)'],['What must be true about the array?','It must be sorted'],['In Java or C, why write lo + (hi − lo) / 2?','To avoid integer overflow in lo + hi']]}
];
(function(){
 var tabs=$('ntabs'),note=$('nnote'),fig=$('nfig'),cards=$('ncards'),file=$('nfile'),cur=0;
 function show(i){cur=i;var n=NOTES[i];
  [].forEach.call(tabs.children,function(b,j){b.className=j==i?'on':'';b.setAttribute('aria-selected',j==i)});
  file.textContent=n.file;
  note.style.setProperty('--t',n.t);note.style.setProperty('--tb',n.tb);cards.style.setProperty('--t',n.t);cards.style.setProperty('--tb',n.tb);
  note.innerHTML='<span class="chip2">'+n.tab+'</span><h3 class="nh">'+n.title+'</h3>'+n.html;
  fig.innerHTML=n.svg+'<figcaption>'+n.cap+'</figcaption>';
  cards.innerHTML=n.cards.map(function(c,k){return '<button class="fcd" type="button" aria-label="Flashcard '+(k+1)+', click to flip"><span class="cfi"><span class="cff"><small>QUESTION</small>'+c[0]+'</span><span class="cfb"><small>ANSWER</small>'+c[1]+'</span></span></button>'}).join('');
  [].forEach.call(cards.children,function(b){b.onclick=function(){b.classList.toggle('flip')}})}
 NOTES.forEach(function(n,i){var b=document.createElement('button');b.type='button';b.setAttribute('role','tab');b.style.setProperty('--t',n.t);b.style.setProperty('--tb',n.tb);b.innerHTML='<i></i>'+n.tab;b.onclick=function(){show(i)};tabs.appendChild(b)});
 show(0);
})();

/* cursor reactive windows */
var hero=$('hero'),stage=$('stage'),fws=[].slice.call(document.querySelectorAll('.fw')),d2=$('dots2');
var mx=-9999,my=-9999,have=false,cs=[];
function measure(){var r=stage.getBoundingClientRect();cs=fws.map(function(e){return{e:e,cx:e.offsetLeft+e.offsetWidth/2,cy:e.offsetTop+e.offsetHeight/2,o:1,x:0,y:0,s:1,d:parseFloat(e.dataset.d)}})}
measure();addEventListener('resize',measure);
var fine=matchMedia('(pointer:fine)').matches;
if(fine&&!reduce){
 hero.addEventListener('mousemove',function(ev){var r=stage.getBoundingClientRect();mx=ev.clientX-r.left;my=ev.clientY-r.top;have=true;
  var h=hero.getBoundingClientRect();d2.style.setProperty('--x',(ev.clientX-h.left)+'px');d2.style.setProperty('--y',(ev.clientY-h.top)+'px')});
 hero.addEventListener('mouseleave',function(){have=false;d2.style.setProperty('--x','-999px')});
 (function frame(){var W=stage.offsetWidth||1;
  cs.forEach(function(c){var tx=0,ty=0,ts=1;
   if(have){var dx=mx-c.cx,dy=my-c.cy,dist=Math.sqrt(dx*dx+dy*dy),pr=Math.max(0,1-dist/360);
    ts=1+.08*pr;tx=-((mx-W/2)/W)*40*c.d;ty=-((my-350)/700)*40*c.d}
   c.x+=(tx-c.x)*.08;c.y+=(ty-c.y)*.08;c.s+=(ts-c.s)*.1;
   c.e.style.transform='translate3d('+c.x.toFixed(1)+'px,'+c.y.toFixed(1)+'px,0) scale('+c.s.toFixed(3)+')'});
  requestAnimationFrame(frame)})();
}else if(!reduce){
 fws.forEach(function(e,i){e.animate([{transform:'translateY(0)'},{transform:'translateY(-10px)'},{transform:'translateY(0)'}],{duration:4000+i*400,iterations:Infinity,easing:'ease-in-out'})});
}
})();

(function(){
 var ty=document.getElementById('hty'),q=document.getElementById('hq'),chips=document.getElementById('hchips');
 if(!ty||!q)return;
 var Q=['why does ice float?','solve 2x + 5 = 17, step by step','explain recursion with an example','what is the difference between mitosis and meiosis?','a car costs 30,000 and loses 15% a year. what is it worth after 6 years?'];
 var i=0,j=0,del=false,t=null,stop=false,reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
 function draw(txt){ty.innerHTML='';ty.appendChild(document.createTextNode(txt));var c=document.createElement('i');ty.appendChild(c)}
 function tick(){
  if(stop)return;
  var s=Q[i];
  if(!del){j++;draw(s.slice(0,j));if(j>=s.length){del=true;t=setTimeout(tick,1700);return}t=setTimeout(tick,38+Math.random()*45)}
  else{j-=2;if(j<=0){j=0;del=false;i=(i+1)%Q.length;draw('');t=setTimeout(tick,450);return}draw(s.slice(0,j));t=setTimeout(tick,18)}
 }
 function halt(){stop=true;clearTimeout(t);ty.style.display=q.value?'none':'none'}
 function sync(){if(q.value){stop=true;clearTimeout(t);ty.style.display='none'}else if(stop&&document.activeElement!==q){stop=false;ty.style.display='';j=0;del=false;tick()}}
 if(reduce){draw(Q[0].slice(0));ty.querySelector('i').style.animation='none'}else{tick()}
 q.addEventListener('focus',function(){stop=true;clearTimeout(t);ty.style.display='none'});
 q.addEventListener('blur',function(){if(!q.value&&!reduce){ty.style.display='';stop=false;j=0;del=false;draw('');tick()}});
 q.addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();document.getElementById('hform').submit()}});
 chips.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;q.value=b.textContent;stop=true;clearTimeout(t);ty.style.display='none';q.focus()});
 document.getElementById('hform').addEventListener('submit',function(e){if(!q.value.trim()){e.preventDefault();q.focus()}});
})();

  /* ---- part 1 ---- */

/* media now lives in /public/media */
window.DTMEDIA={video:function(i){return '/media/'+i+'.mp4'},img:function(i){return '/media/'+i+'.jpg'}};

  /* ---- part 2 ---- */

/* examples: real engine videos */
(function(){
  var root=document.getElementById('examples'); if(!root) return;
  var V=[
    {id:'maths-integration-by-parts',file:'integration-by-parts.mov',tag:'maths',c:'#2F7BFF',dur:'2:01',
     q:'Evaluate the integral of x sin x from 0 to π/2',
     n1:'the circle lands right as she says “split this”',n2:'by parts, 11 small steps, then the graph'},
    {id:'physics-block-on-a-ramp',file:'block-on-a-ramp.mov',tag:'physics',c:'#E5484D',dur:'1:50',
     q:'A block slides down a 30° slope with friction μ = 0.2. Find its acceleration.',
     n1:'the force diagram is drawn in code, so the angle is exact',n2:'forces, Newton’s 2nd law, then the numbers'},
    {id:'coding-median-two-arrays',file:'median-two-sorted-arrays.mov',tag:'coding',c:'#8A4DFF',dur:'3:25',
     q:'Median of two sorted arrays, in O(log(m+n)) time',
     n1:'the code types itself while the lines are explained',n2:'the idea, a worked example, then the code'},
    {id:'biology-dna-replication',file:'dna-replication.mov',tag:'biology',c:'#12A150',dur:'2:22',
     q:'Why is DNA replication called semiconservative? (A to D)',
     n1:'wrong options get crossed out one by one',n2:'old strands in blue, new strands in red'}
  ];
  var list=document.getElementById('exlist'),vid=document.getElementById('exvid'),scr=document.getElementById('exscreen'),
      wipe=document.getElementById('exwipe'),file=document.getElementById('exfile'),snd=document.getElementById('exsnd'),
      big=document.getElementById('exbig'),playB=document.getElementById('explay'),muteB=document.getElementById('exmute'),
      bar=document.getElementById('exbar'),n1=document.querySelector('#exn1 span'),n2=document.querySelector('#exn2 span'),
      steps=[].slice.call(document.querySelectorAll('#exsteps span')),stage=document.getElementById('exstage'),
      player=document.getElementById('explayer');
  var cur=0,cards=[],inView=false,userSound=false;

  V.forEach(function(v,i){
    var b=document.createElement('button');
    b.type='button';b.className='exc';b.setAttribute('role','tab');b.style.setProperty('--c',v.c);
    b.style.transitionDelay=(0.12*i+0.1)+'s';
    b.innerHTML='<div class="win"><div class="tb"><i></i><i></i><i></i><em>'+v.file+'</em></div>'+
      '<div class="bd"><div class="th"><img src="'+DTMEDIA.img(v.id)+'" alt=""><span class="du">'+v.dur+'</span></div>'+
      '<div class="meta"><small>'+v.tag+'</small><p>'+v.q+'</p></div><div class="pg"><i></i></div></div></div>';
    b.addEventListener('click',function(){userSound=true;select(i,true)});
    list.appendChild(b);cards.push(b);
  });

  function swapNote(el,text){el.classList.add('sw');setTimeout(function(){el.textContent=text;el.classList.remove('sw')},260)}
  function paint(i){
    var v=V[i];
    cards.forEach(function(c,k){c.classList.toggle('on',k===i);c.setAttribute('aria-selected',k===i)});
    root.style.setProperty('--c',v.c);scr.style.setProperty('--c',v.c);
    document.getElementById('exsteps').style.setProperty('--c',v.c);
    file.textContent=v.file;swapNote(n1,v.n1);swapNote(n2,v.n2);
  }
  function load(i){
    var v=V[i];vid.poster=DTMEDIA.img(v.id);vid.src=DTMEDIA.video(v.id);vid.load();
  }
  function play(){
    vid.muted=!userSound;snd.classList.toggle('hide',userSound);muteB.textContent=vid.muted?'🔈':'🔊';
    var p=vid.play(); if(p&&p.catch) p.catch(function(){scr.classList.add('paused')});
  }
  function select(i,go){
    if(i===cur&&vid.src){if(go){vid.currentTime=0;play()}return}
    cur=i;paint(i);
    wipe.classList.remove('go');void wipe.offsetWidth;wipe.classList.add('go');
    setTimeout(function(){load(i);if(go||inView)play()},330);
  }

  vid.addEventListener('play',function(){scr.classList.remove('paused');playB.textContent='❚❚ pause'});
  vid.addEventListener('pause',function(){scr.classList.add('paused');playB.textContent='▶ play'});
  vid.addEventListener('timeupdate',function(){
    if(!vid.duration) return;
    var f=vid.currentTime/vid.duration;
    cards[cur].querySelector('.pg i').style.width=(f*100)+'%';
    bar.firstElementChild.style.width=(f*100)+'%';bar.setAttribute('aria-valuenow',Math.round(f*100));
    var th=[0,.07,.16,.82,.9];
    steps.forEach(function(s,k){s.classList.toggle('hit',f>=th[k])});
  });
  vid.addEventListener('ended',function(){cards[cur].querySelector('.pg i').style.width='0';select((cur+1)%V.length,true)});
  big.addEventListener('click',function(){userSound=true;play()});
  playB.addEventListener('click',function(){vid.paused?play():vid.pause()});
  snd.addEventListener('click',function(){userSound=true;vid.muted=false;snd.classList.add('hide');muteB.textContent='🔊';if(vid.paused)play()});
  muteB.addEventListener('click',function(){vid.muted=!vid.muted;userSound=!vid.muted;muteB.textContent=vid.muted?'🔈':'🔊';snd.classList.toggle('hide',!vid.muted)});
  bar.addEventListener('click',function(e){var r=bar.getBoundingClientRect();if(vid.duration)vid.currentTime=vid.duration*(e.clientX-r.left)/r.width});

  // gentle 3D tilt that follows the pointer
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!reduce){
    stage.addEventListener('mousemove',function(e){
      var r=stage.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
      player.style.transform='rotateY('+(x*5)+'deg) rotateX('+(-y*4)+'deg)';
    });
    stage.addEventListener('mouseleave',function(){player.style.transform=''});
  }

  paint(0);load(0);
  if('IntersectionObserver' in window){
    new IntersectionObserver(function(es){es.forEach(function(e){
      inView=e.isIntersecting;
      if(inView){root.classList.add('in');play()}else if(!vid.paused){vid.pause()}
    })},{threshold:.35}).observe(root);
  }else{root.classList.add('in')}
})();

  /* ---- part 3 ---- */

/* hero film: themed poster, plays with sound on click, pauses when scrolled away */
(function(){
  var wrap=document.getElementById('big'),vid=document.getElementById('fvid'),scr=document.getElementById('fscr'),hit=document.getElementById('fhit');
  if(!wrap||!window.DTMEDIA) return;
  vid.poster=DTMEDIA.img('film');
  var loaded=false;
  function start(){
    if(!loaded){vid.src=DTMEDIA.video('film');loaded=true}
    vid.controls=true;vid.muted=false;scr.classList.add('playing');
    var pr=vid.play();if(pr&&pr.catch)pr.catch(function(){});
  }
  hit.addEventListener('click',start);
  vid.addEventListener('ended',function(){vid.controls=false;scr.classList.remove('playing');vid.load()});
  if('IntersectionObserver' in window){
    new IntersectionObserver(function(es){es.forEach(function(e){
      if(e.isIntersecting)wrap.classList.add('in');else if(!vid.paused)vid.pause();
    })},{threshold:.2}).observe(wrap);
  }else wrap.classList.add('in');
})();

  /* ---- part 4 ---- */

/* ===== v3 motion ===== */
(function(){
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  function onView(el,fn,th,once){
    if(!('IntersectionObserver' in window)){fn(true);return}
    var io=new IntersectionObserver(function(es){es.forEach(function(e){fn(e.isIntersecting);if(e.isIntersecting&&once)io.disconnect()})},{threshold:th||.2,rootMargin:'0px 0px -6% 0px'});
    io.observe(el);
  }

  // generic reveal, plus section-level "in" classes
  [].forEach.call(document.querySelectorAll('[data-rv]'),function(el){onView(el,function(v){if(v)el.classList.add('in')},.15,true)});
  ['.letter','.mark'].forEach(function(s){var el=document.querySelector(s);if(el)onView(el,function(v){if(v)el.classList.add('in')},.3,true)});

  // auto-tag the older sections so they animate too
  function tag(sel,kind,step){[].forEach.call(document.querySelectorAll(sel),function(el,i){
    if(el.hasAttribute('data-rv'))return;el.setAttribute('data-rv',kind||'');el.style.setProperty('--d',((step||0)*i)+'s');
    onView(el,function(v){if(v)el.classList.add('in')},.12,true)})}
  tag('.nhead');tag('.nwin','scale');tag('.letter .tag');tag('.letter .win','tilt');
  tag('.fb .scroller');tag('.fb .q','tilt',.08);tag('.fb .ill');
  tag('.sky .head');tag('.sky .pc','',.12);tag('.sky .term');tag('.sky .fine','',.08);
  tag('.faq h2');tag('.faq .sb');tag('.faq details','',.06);
  tag('.cols>div','',.08);

  // footer wordmark, letter by letter
  var mk=document.querySelector('.mark');
  if(mk&&!mk.querySelector('span')){mk.innerHTML=mk.textContent.split('').map(function(c,i){return '<span style="--i:'+i+'">'+c+'</span>'}).join('')}

  // price count-up the first time pricing is seen
  var prices=[].slice.call(document.querySelectorAll('.sky .pc .p'));
  if(prices.length&&!reduce){onView(document.querySelector('.sky .prices'),function(v){if(!v)return;
    prices.forEach(function(p){var fin=p.textContent,m=fin.match(/\$(\d+(?:\.\d+)?)/);if(!m)return;var to=parseFloat(m[1]),dp=(m[1].split('.')[1]||'').length,t0=performance.now();
      (function step(t){var k=Math.min(1,(t-t0)/900),e=1-Math.pow(1-k,3);
        if(p.textContent.indexOf('$')<0)return;p.textContent=fin.replace(m[0],'$'+(to*e).toFixed(dp));
        if(k<1)requestAnimationFrame(step);else p.textContent=fin})(t0)})},.3,true)}

  // drifting clouds in pricing
  var sky=document.querySelector('.sky');
  if(sky){[[8,14,340,120,0],[70,6,420,140,-9],[60,72,380,130,-4],[2,66,300,110,-14]].forEach(function(c){var d=document.createElement('i');d.className='cl';
    d.style.cssText='left:'+c[0]+'%;top:'+c[1]+'%;width:'+c[2]+'px;height:'+c[3]+'px;animation-delay:'+c[4]+'s';sky.insertBefore(d,sky.firstChild)})}

  // demo 1: live chat that types, thinks and answers
  var Q=[
    {q:'a ball is thrown at 12 m/s and takes 6 s to land. how far does it go?',s:[['horizontal speed stays constant','nothing pushes it sideways once it is thrown'],['distance = speed × time','the time in the air is the same 6 s'],['12 × 6 = 72','so the ball travels']],a:'72 m'},
    {q:'solve 2x + 5 = 17',s:[['take 5 from both sides','undo the + 5 first, so 2x = 12'],['divide both sides by 2','undo the × 2, so x = 6'],['check: 2 × 6 + 5 = 17','it works, so']],a:'x = 6'},
    {q:'why does ice float on water?',s:[['water expands when it freezes','its molecules lock into an open pattern'],['same mass, more space, so less dense','ice is about 9% less dense than water'],['less dense things float','so ice sits on top, which is why']],a:'lakes freeze from the top'}
  ];
  var cdq=document.getElementById('cdq'),cdw=document.getElementById('cdw'),cdd=document.getElementById('cdd'),cdl=document.getElementById('cdl');
  if(cdq){
    var qi=0,live=false,timer=null,running=false;
    function wait(ms){return new Promise(function(r){timer=setTimeout(r,ms)})}
    function show(i){var x=Q[i];cdq.textContent=x.q;cdw.classList.add('on');cdd.style.display='none';
      cdl.innerHTML=x.s.map(function(s,k){return '<li class="on"><b>'+(k+1)+'</b><div>'+s[0]+'<small>'+s[1]+'</small></div></li>'}).join('')+'<li class="on ans"><b>✓</b><div><em>'+x.a+'</em></div></li>'}
    async function run(){
      if(running)return;running=true;
      while(live){
        var x=Q[qi];cdl.innerHTML='';cdw.classList.remove('on');cdq.innerHTML='<span class="cur"></span>';
        for(var c=1;c<=x.q.length&&live;c++){cdq.innerHTML=x.q.slice(0,c)+'<span class="cur"></span>';await wait(26+Math.random()*30)}
        cdq.textContent=x.q;await wait(350);cdw.classList.add('on');cdd.style.display='';await wait(1100);cdd.style.display='none';
        var items=x.s.map(function(s,k){return '<li><b>'+(k+1)+'</b><div>'+s[0]+'<small>'+s[1]+'</small></div></li>'}).concat('<li class="ans"><b>✓</b><div><em>'+x.a+'</em></div></li>');
        for(var k=0;k<items.length&&live;k++){cdl.insertAdjacentHTML('beforeend',items[k]);var li=cdl.lastElementChild;void li.offsetWidth;li.classList.add('on');await wait(k<items.length-1?750:500)}
        await wait(3600);qi=(qi+1)%Q.length;
      }
      running=false;
    }
    if(reduce){show(0)}else{onView(document.getElementById('cdemo'),function(v){live=v;if(v)run();else clearTimeout(timer)},.35)}
  }

  // demo 2: subject marquees and a question that changes subject
  var SUB=['calculus','organic chemistry','economics','python','physics','accounting','statistics','essays','biology','linear algebra','microeconomics','java','genetics','trigonometry','finance','your weird one'];
  function fill(id,off){var el=document.getElementById(id);if(!el)return;var a=SUB.slice(off).concat(SUB.slice(0,off));el.innerHTML=a.concat(a).map(function(s){return '<span>'+s+'</span>'}).join('')}
  fill('mq1',0);fill('mq2',5);fill('mq3',10);
  var SQ=[['calculus','#2F7BFF','why is the derivative of x² equal to 2x?'],['chemistry','#12A150','why does benzene not act like an alkene?'],['economics','#E08A00','what happens to price when supply shifts left?'],['python','#8A4DFF','why does my recursion never stop?'],['physics','#E5484D','is velocity the same as speed?'],['accounting','#0F9DB5','why is depreciation an expense?']];
  var sql=document.getElementById('sql'),sqt=document.getElementById('sqt'),si=0,st=null;
  if(sql&&!reduce){onView(document.getElementById('sdemo'),function(v){clearInterval(st);if(!v)return;st=setInterval(function(){si=(si+1)%SQ.length;sqt.classList.add('sw');
    setTimeout(function(){sql.textContent=SQ[si][0];sql.style.setProperty('--sc',SQ[si][1]);sqt.textContent=SQ[si][2];sqt.classList.remove('sw')},300)},2600)},.3)}
})();

}
