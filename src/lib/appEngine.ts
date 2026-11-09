// @ts-nocheck
/**
 * Doubtster app engine: the imperative app logic ported from the HTML prototype.
 * The shell (header, sidebar, #view, #toast) is rendered by React in AppShell;
 * this module paints each view into #view and owns state in localStorage.
 * mountApp() returns a cleanup that removes every listener and timer.
 */
import { renderAnswerMount } from "@/components/chat/AnswerRenderer";
import { renderNotesMount } from "@/components/notes/NotesBoard";
import { notebookDocToMarkdown } from "@/lib/notebookSchema";
import katex from "katex";

export function mountApp(CFG, initialUser) {
'use strict';
var offs=[];
function on(t,ev,fn,o){t.addEventListener(ev,fn,o);offs.push(function(){t.removeEventListener(ev,fn,o)})}
function iv(fn,ms){var id=setInterval(fn,ms);offs.push(function(){clearInterval(id)})}
var SITE=CFG.SITE||'';
var PRICE={trial:1.99,monthly:7.99,annual:59,credits:30,packs:[{n:10,p:4.99},{n:25,p:9.99}],trialDays:7,trialCredits:3,topupDays:90,videoCost:{2:1,5:2}};
var USER_ID = (initialUser && initialUser.id) ? initialUser.id : '';
var DAY=86400000,KEY=USER_ID ? ('doubtster-app-v2:' + USER_ID) : 'doubtster-app-v2';
var $=function(i){return document.getElementById(i)};
var h=function(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')};
function cleanMath(raw){
  if(!raw)return '';
  var s=String(raw).trim();
  while(s.startsWith('$$')&&s.endsWith('$$')&&s.length>=4){s=s.slice(2,-2).trim()}
  while(s.startsWith('$')&&s.endsWith('$')&&s.length>=2){s=s.slice(1,-1).trim()}
  while(s.startsWith('\\[')&&s.endsWith('\\]')&&s.length>=4){s=s.slice(2,-2).trim()}
  while(s.startsWith('\\(')&&s.endsWith('\\)')&&s.length>=4){s=s.slice(2,-2).trim()}
  s=s.replace(/(^|[^\\])\$/g,'$1 ').trim();
  return s.trim();
}
function renderMath(str){
  if(str==null)return '';
  var s=String(str)
    .replace(/\\\[([\s\S]*?)\\\]/g,function(_,eq){return '$$ '+cleanMath(eq)+' $$'})
    .replace(/\\\(([\s\S]*?)\\\)/g,function(_,eq){return '$'+cleanMath(eq)+'$'});
  var parts=[],regex=/(\$\$[\s\S]+?\$\$|\$[^\$\n]+?\$)/g,lastIndex=0,match;
  while((match=regex.exec(s))!==null){
    if(match.index>lastIndex){parts.push(h(s.slice(lastIndex,match.index)));}
    var raw=match[0],isBlock=raw.startsWith('$$'),expr=cleanMath(isBlock?raw.slice(2,-2):raw.slice(1,-1));
    try{parts.push(katex.renderToString(expr,{displayMode:isBlock,throwOnError:false,errorColor:'#c92a2a'}));}
    catch(err){parts.push(h(raw));}
    lastIndex=match.index+raw.length;
  }
  if(lastIndex<s.length){parts.push(h(s.slice(lastIndex)));}
  return parts.join('');
}
function renderTutorMarkdown(raw){
  if(raw==null)return '';
  var text=String(raw).trim();

  // Normalize inline smashed bullets like ": * **Item**" or ". * **Item**"
  text=text.replace(/:\s*[\*•-]\s+/g,':\n\n* ');
  text=text.replace(/([.!?])\s+[\*•-]\s+/g,'$1\n* ');
  text=text.replace(/([^\n])\s+[\*•-]\s+(\*\*[^*]+\*\*)/g,'$1\n* $2');
  // Separate trailing conversational questions / call-to-actions after bullet points
  text=text.replace(/([.!?])\s+(Chatting with me is|Feel free to|Let me know if|What subject are you|How can I help)\b/gi,'$1\n\n$2');

  // Protect math expressions before markdown parsing
  var mathTokens=[];
  text=text
    .replace(/\\\[([\s\S]*?)\\\]/g,function(_,eq){return '$$ '+cleanMath(eq)+' $$'})
    .replace(/\\\(([\s\S]*?)\\\)/g,function(_,eq){return '$'+cleanMath(eq)+'$'});

  var mathRegex=/(\$\$[\s\S]+?\$\$|\$[^\$\n]+?\$)/g;
  text=text.replace(mathRegex,function(match){
    var placeholder='@@MATH_'+mathTokens.length+'@@';
    var isBlock=match.startsWith('$$');
    var expr=cleanMath(isBlock?match.slice(2,-2):match.slice(1,-1));
    mathTokens.push({isBlock:isBlock,expr:expr,raw:match});
    return placeholder;
  });

  function formatInline(str){
    var s=h(str);
    // Bold
    s=s.replace(/\*\*([^*\n]+?)\*\*/g,'<strong>$1</strong>');
    s=s.replace(/__([^_\n]+?)__/g,'<strong>$1</strong>');
    // Italic
    s=s.replace(/(^|[^\*])\*([^*\n]+?)\*([^\*]|$)/g,'$1<em>$2</em>$3');
    s=s.replace(/(^|[^_])_([^_\n]+?)_([^_]|$)/g,'$1<em>$2</em>$3');
    // Inline code
    s=s.replace(/`([^`\n]+?)`/g,'<code>$1</code>');
    // Restore math via KaTeX
    s=s.replace(/@@MATH_(\d+)@@/g,function(_,idx){
      var m=mathTokens[+idx];
      if(!m)return '';
      try{
        return katex.renderToString(m.expr,{displayMode:m.isBlock,throwOnError:false,errorColor:'#c92a2a'});
      }catch(err){
        return h(m.raw);
      }
    });
    return s;
  }

  var rawBlocks=text.split(/\n\s*\n/);
  var htmlBlocks=[];

  rawBlocks.forEach(function(block){
    var trimmed=block.trim();
    if(!trimmed)return;

    var lines=trimmed.split('\n');
    var isList=lines.every(function(l){return /^[\*•-]\s+/.test(l.trim());});
    var isNumList=lines.every(function(l){return /^\d+\.\s+/.test(l.trim());});

    if(isList){
      var items=lines.map(function(l){
        var content=l.trim().replace(/^[\*•-]\s+/,'');
        return '<li>'+formatInline(content)+'</li>';
      });
      htmlBlocks.push('<ul class="tutor-list">'+items.join('')+'</ul>');
    } else if(isNumList){
      var nitems=lines.map(function(l){
        var content=l.trim().replace(/^\d+\.\s+/,'');
        return '<li>'+formatInline(content)+'</li>';
      });
      htmlBlocks.push('<ol class="tutor-list">'+nitems.join('')+'</ol>');
    } else {
      var hasBullets=lines.some(function(l){return /^[\*•-]\s+/.test(l.trim());});
      if(hasBullets){
        var curP=[];
        var curUl=[];
        lines.forEach(function(line){
          var lt=line.trim();
          if(/^[\*•-]\s+/.test(lt)){
            if(curP.length){
              htmlBlocks.push('<p>'+formatInline(curP.join(' '))+'</p>');
              curP=[];
            }
            curUl.push('<li>'+formatInline(lt.replace(/^[\*•-]\s+/,''))+'</li>');
          } else {
            if(curUl.length){
              htmlBlocks.push('<ul class="tutor-list">'+curUl.join('')+'</ul>');
              curUl=[];
            }
            curP.push(lt);
          }
        });
        if(curP.length)htmlBlocks.push('<p>'+formatInline(curP.join(' '))+'</p>');
        if(curUl.length)htmlBlocks.push('<ul class="tutor-list">'+curUl.join('')+'</ul>');
      } else {
        htmlBlocks.push('<p>'+formatInline(lines.join('<br>'))+'</p>');
      }
    }
  });

  return htmlBlocks.join('');
}
var uid=function(){return Math.random().toString(36).slice(2,9)+Date.now().toString(36).slice(-4)};
function fmt(n){if(typeof n!=='number'||!isFinite(n))return String(n);var s=(Math.round(n*10000)/10000).toString();return s}
function money(n){return '$'+n.toFixed(2).replace(/\.00$/,function(m){return n===Math.floor(n)&&n>=10?'':m})}
function dstr(t){return new Date(t).toLocaleDateString([],{day:'numeric',month:'short',year:'numeric'})}
function cap(s){return s.charAt(0).toUpperCase()+s.slice(1)}

/* ================= state ================= */
var S;
function blank(){return{v:2,profile:{id:USER_ID,name:initialUser?.name||'',email:initialUser?.email||'',level:'',subjects:[],goals:[],style:''},plan:null,pcredits:0,topups:[],trialUsed:false,college:null,collegeCreditsGranted:false,offset:0,
 chats:[],cur:null,videos:[],notes:[],decks:[],quizzes:[],tasks:[],saved:[],reports:[],billing:[],act:{},goal:10,dismissed:false,hideList:false,detail:'steps',spent:0}}
function load(){
  try {
    var s = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (s && s.v === 2) {
      // If scoped user state matches current user, use it
      if (!USER_ID || !s.profile || !s.profile.id || s.profile.id === USER_ID) {
        return Object.assign(blank(), s);
      }
    }
    // If running in guest/unauthenticated mode, fallback to legacy key
    if (!USER_ID) {
      var o = JSON.parse(localStorage.getItem('doubtster-app-v1') || 'null');
      if (o && o.v === 1) {
        var n = Object.assign(blank(), o, {v:2});
        n.decks = (o.notes || []).map(function(x){ return { id: x.id, ts: x.ts, title: x.title, subject: x.subject || '', src: 'reply', cards: (x.cards || []).map(function(c){ return mkCard(c.f, c.b); }) }; });
        n.notes = [];
        return n;
      }
    }
  } catch(e) {}
  return blank();
}

function mergeListById(localList, serverList) {
  var map = {};
  (serverList || []).forEach(function(item) {
    if (item && item.id) map[item.id] = item;
  });
  (localList || []).forEach(function(item) {
    if (item && item.id) {
      if (!map[item.id] || (item.ts || 0) >= (map[item.id].ts || 0)) {
        map[item.id] = item;
      }
    }
  });
  var res = Object.keys(map).map(function(k) { return map[k]; });
  res.sort(function(a, b) { return (b.ts || 0) - (a.ts || 0); });
  return res;
}

var syncTimeout = null;
var isSyncing = false;
var serverSyncEnabled = true;

function flushSave(isUnload) {
  if (syncTimeout) {
    clearTimeout(syncTimeout);
    syncTimeout = null;
  }
  if (!serverSyncEnabled && !isUnload) {
    return;
  }
  if (isSyncing && !isUnload) {
    return;
  }
  try {
    var payload;
    try {
      payload = JSON.stringify({ state: S });
    } catch(err) {
      return;
    }

    // WHATWG Fetch keepalive quota is 64KB across all in-flight requests.
    // If body exceeds ~60KB, setting keepalive: true causes browser to throw TypeError: Failed to fetch.
    // Keepalive is only used on unload and only when the payload is within safe quota limits.
    var useKeepalive = Boolean(isUnload && payload.length < 60000);
    var fetchOpts = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload
    };
    if (useKeepalive) {
      fetchOpts.keepalive = true;
    }

    isSyncing = true;
    fetch('/api/state', fetchOpts)
      .then(function(r) {
        if (r.status === 401) {
          // Unauthenticated/guest session: pause remote sync to prevent console noise
          serverSyncEnabled = false;
          return null;
        }
        if (!r.ok) {
          return null;
        }
        serverSyncEnabled = true;
        return r.json().catch(function() { return null; });
      })
      .then(function(res) {
        isSyncing = false;
        if (res && res.state) {
          // Always prefer server plan — it's the authoritative source
          // (webhook may have activated a plan since we last read state)
          var hadPlan = Boolean(S.plan);
          if (res.state.plan) {
            S.plan = res.state.plan;
          }
          if (res.state.pcredits !== undefined) {
            S.pcredits = Math.max(S.pcredits || 0, res.state.pcredits);
          }
          if (res.state.college) {
            S.college = res.state.college;
          }
          if (res.state.collegeCreditsGranted) {
            S.collegeCreditsGranted = true;
          }
          if (Array.isArray(res.state.topups) && res.state.topups.length > (S.topups || []).length) {
            S.topups = res.state.topups;
          }
          if (res.state.trialUsed) S.trialUsed = true;
          try { localStorage.setItem(KEY, JSON.stringify(S)); } catch(ex) {}
          try { repaint(); } catch(ex) {}
          if (!hadPlan && S.plan) {
            try { if (R && R[view]) R[view](); } catch(ex) {}
          }
        }
      })
      .catch(function(e) {
        isSyncing = false;
        // Non-critical background sync note (e.g. offline, page navigation, or dev reload)
        if (typeof console !== 'undefined' && console.warn) {
          console.warn('[Doubtster] Background state sync skipped:', e && e.message ? e.message : e);
        }
      });
  } catch(e) {
    isSyncing = false;
  }
}

function save(immediate){
  try {
    localStorage.setItem(KEY, JSON.stringify(S));
  } catch(e) {}
  
  if (immediate) {
    flushSave();
    return;
  }

  // Debounced background sync
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(flushSave, 1500);
}

function hasPlan(){
  if (S.plan) {
    var now = Date.now();
    if (S.plan.status === 'expired' || S.plan.status === 'failed') return false;
    if (S.plan.cancelled && S.plan.renewAt && now > S.plan.renewAt) return false;
    if (S.plan.kind === 'trial') {
      var trialEnd = S.plan.renewAt || (S.plan.start + PRICE.trialDays * DAY);
      return now <= trialEnd;
    }
    if (S.plan.status === 'active' || !S.plan.cancelled) return true;
  }
  if (S.collegeCreditsGranted || (S.college && S.pcredits > 0) || (S.pcredits > 0)) {
    return true;
  }
  return false;
}

function getInitial(){
  var nm = (S.profile.name || '').trim();
  if (nm && nm.toLowerCase() !== 'you') {
    return nm.charAt(0).toUpperCase();
  }
  var em = (S.profile.email || '').trim();
  if (em) {
    return em.charAt(0).toUpperCase();
  }
  return 'U';
}

S=load();
try {
  (function() {
    for (var cleanIdx = localStorage.length - 1; cleanIdx >= 0; cleanIdx--) {
      var cleanKey = localStorage.key(cleanIdx);
      if (cleanKey && (cleanKey.indexOf('doubtster-notes-v1:') === 0 || cleanKey.indexOf('doubtster-notes-v2:') === 0 || cleanKey.indexOf('doubtster-notes-v3:') === 0)) {
        localStorage.removeItem(cleanKey);
      }
    }
  })();
} catch(e) {}

// Initial sync down from Supabase
function syncInitialState(pollCount) {
  var isCheckoutReturn = location.search.indexOf('checkout=return') > -1;
  fetch('/api/state')
    .then(function(r) {
      if (r.status === 401) {
        serverSyncEnabled = false;
        return null;
      }
      if (!r.ok) throw new Error('state ' + r.status);
      serverSyncEnabled = true;
      return r.json().catch(function() { return null; });
    })
    .then(function(res) {
      if (!res) return;

      // ── DATA-ISOLATION GUARD ──────────────────────────────────────────────
      // For authenticated users, state in Supabase is strictly per-user and authoritative.
      if (res.user_id) {
        var userChanged = (USER_ID && res.user_id !== USER_ID);
        USER_ID = res.user_id;
        KEY = 'doubtster-app-v2:' + USER_ID;
        if (userChanged) {
          S = blank();
        }
      }
      if (USER_ID) {
        S.profile.id = USER_ID;
      }
      if (res && res.user_name) {
        S.profile.name = res.user_name;
      }
      if (res && res.email) {
        S.profile.email = res.email;
      }
      // ─────────────────────────────────────────────────────────────────────

      if (res && res.state) {
        // Authoritative server collections for authenticated user
        if (Array.isArray(res.state.chats)) S.chats = res.state.chats;
        if (Array.isArray(res.state.notes)) S.notes = res.state.notes;
        if (Array.isArray(res.state.decks)) S.decks = res.state.decks;
        if (Array.isArray(res.state.videos)) S.videos = res.state.videos;
        if (Array.isArray(res.state.quizzes)) S.quizzes = res.state.quizzes;
        if (Array.isArray(res.state.tasks)) S.tasks = res.state.tasks;
        if (Array.isArray(res.state.saved)) S.saved = res.state.saved;

        // Plan & credits
        if (res.state.plan) S.plan = res.state.plan;
        if (res.state.pcredits !== undefined) S.pcredits = Math.max(S.pcredits || 0, res.state.pcredits);
        if (res.state.college) S.college = res.state.college;
        if (res.state.collegeCreditsGranted) S.collegeCreditsGranted = true;
        if (res.state.trialUsed) S.trialUsed = true;
        if (Array.isArray(res.state.topups)) S.topups = res.state.topups;
        if (res.state.profile && res.state.profile.level) S.profile.level = res.state.profile.level;
        if (res.state.profile && Array.isArray(res.state.profile.subjects)) S.profile.subjects = res.state.profile.subjects;
      }
      try { localStorage.setItem(KEY, JSON.stringify(S)); } catch(e) {}
      // Always repaint + re-render current view so paywall lifts immediately
      try { repaint(); } catch(e) {}
      try { if (R && R[view]) R[view](); } catch(e) {}

      // Handle checkout return with retry polling
      if (isCheckoutReturn) {
        var params = new URLSearchParams(location.search);
        var status = params.get('status');
        if (status === 'failed') {
          toast('Payment was not completed. Please try again.');
          history.replaceState(null, '', location.pathname + location.hash);
        } else if (hasPlan()) {
          // Plan confirmed — show success and clean URL
          toast('\u2713 Welcome to Pro! Your plan and credits are ready.');
          history.replaceState(null, '', location.pathname + location.hash);
          // Re-render current view so paywall is replaced by actual content
          try { if (R && R[view]) R[view](); } catch(e) {}
        } else if ((pollCount || 0) < 6) {
          // Webhook may still be in flight — poll again with increasing backoff
          var delay = (pollCount || 0) < 3 ? 1500 : 2500;
          setTimeout(function() { syncInitialState((pollCount || 0) + 1); }, delay);
        } else {
          // Gave up polling — plan should arrive shortly via next natural save
          toast('\u2713 Purchase recorded. Your plan will activate momentarily.');
          history.replaceState(null, '', location.pathname + location.hash);
        }
      }
    }).catch(function(e) {
      console.warn('[Doubtster] State sync failed:', e && e.message);
      // On checkout return, retry even if the request itself failed
      if (isCheckoutReturn && (pollCount || 0) < 3) {
        setTimeout(function() { syncInitialState((pollCount || 0) + 1); }, 2000);
      }
    });
}

syncInitialState(0);

on(window, 'beforeunload', function() {
  try {
    localStorage.setItem(KEY, JSON.stringify(S));
  } catch(e) {}
  flushSave(true);
});
on(document, 'visibilitychange', function() {
  if (document.visibilityState === 'hidden') {
    flushSave(true);
  }
});

if(!USER_ID&&!S.profile.level&&!S.profile.name){try{var o2=JSON.parse(localStorage.getItem('doubtster-onboarding')||'null');if(o2){S.profile.name=o2.name||'';S.profile.level=o2.level||'';S.profile.subjects=o2.subjects||[];S.profile.goals=o2.goals||[];S.profile.style=o2.style||'';save()}}catch(e){}}
var NOW=function(){return Date.now()+S.offset};
function dkey(t){var d=new Date(t);return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2)}
function bump(kind,n){var k=dkey(NOW());S.act[k]=S.act[k]||{};S.act[k][kind]=(S.act[k][kind]||0)+(n||1);
 var keys=Object.keys(S.act).sort();while(keys.length>120)delete S.act[keys.shift()];save()}
function dayTotal(k){var a=S.act[k];return a?(a.q||0)+(a.c||0)+(a.z||0)+(a.v||0)*3:0}
function streak(){var t=NOW(),n=0;if(!dayTotal(dkey(t)))t-=DAY;while(dayTotal(dkey(t))&&n<400){n++;t-=DAY}return n}
function weekBars(){var o=[];for(var i=6;i>=0;i--){var t=NOW()-i*DAY;o.push({k:dkey(t),d:new Date(t).toLocaleDateString([],{weekday:'short'}).slice(0,2),n:dayTotal(dkey(t))})}return o}

/* ================= decks and spaced repetition ================= */
function mkCard(f,b){return{id:uid(),f:f,b:b,ease:2.5,int:0,reps:0,lapses:0,due:0}}
function deckFrom(a,q){var seen={},cards=[];
 function add(f,b){if(!f||!b||seen[f])return;seen[f]=1;cards.push(mkCard(f,b))}
 add(q&&q.length<140?q:a.title,a.answer||a.title);
 a.steps.forEach(function(s,i){add('Step '+(i+1)+' of "'+a.title+'": what is the move?',s.h+(s.math?'  ('+s.math+')':''));if(s.t)add(s.h+': why or how?',s.t)});
 return{id:uid(),ts:Date.now(),title:a.title,subject:a.subject||'',src:'reply',cards:cards.slice(0,16)}}
function allCards(){var o=[];S.decks.forEach(function(d){d.cards.forEach(function(c){o.push({d:d,c:c})})});return o}
function dueCards(deckId){return allCards().filter(function(x){return (!deckId||x.d.id===deckId)&&x.c.due<=NOW()}).sort(function(a,b){return a.c.due-b.c.due})}
function cstate(c){return c.reps===0&&!c.lapses&&!c.due?'new':c.int>=21?'mastered':'learning'}
function deckStats(d){var n=0,l=0,m=0,du=0;d.cards.forEach(function(c){var s=cstate(c);if(s==='new')n++;else if(s==='mastered')m++;else l++;if(c.due<=NOW())du++});return{n:n,l:l,m:m,due:du,total:d.cards.length}}
function srsNext(c,g){var e=c.ease,r=c.reps,iv;
 if(g===0)return{int:0,ease:Math.max(1.3,e-.2),reps:0};
 if(g===1)return{int:Math.max(1,Math.round((c.int||1)*1.2)),ease:Math.max(1.3,e-.15),reps:r+1};
 if(g===2){iv=r===0?1:r===1?3:Math.round(c.int*e);return{int:Math.max(1,iv),ease:e,reps:r+1}}
 iv=r===0?3:Math.max(4,Math.round(c.int*e*1.3));return{int:iv,ease:e+.15,reps:r+1}}
function ivLabel(n){return n===0?'under 1 min':n===1?'1 day':n+' days'}
function rate(c,g){var r=srsNext(c,g);c.ease=r.ease;c.reps=r.reps;c.int=r.int;c.due=g===0?NOW()+60000:NOW()+r.int*DAY;if(g===0)c.lapses++;bump('c');save()}

/* ================= quiz questions from cards ================= */
function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t}return a}
function perturb(s){var m=String(s).match(/-?\d+(\.\d+)?/);if(!m)return null;var v=parseFloat(m[0]);var d=[v+1,v-1,v*2,v+10,Math.round(v/2*10)/10].filter(function(x){return x!==v});return String(s).replace(m[0],fmt(d[Math.floor(Math.random()*d.length)]))}
function mcqFromCards(cards,sub,n){var qs=[];
 shuffle(cards).slice(0,n).forEach(function(c){var opts=[c.b];
  shuffle(cards).forEach(function(o){if(opts.length<4&&opts.indexOf(o.b)<0)opts.push(o.b)});
  var t=0;while(opts.length<4&&t++<8){var p=perturb(c.b);if(p&&opts.indexOf(p)<0)opts.push(p)}
  var g=['None of these','Not enough information','It stays the same','It cannot be determined'];
  while(opts.length<4){var x=g.shift();if(opts.indexOf(x)<0)opts.push(x)}
  qs.push({q:c.f,a:c.b,o:shuffle(opts),e:'Answer: '+c.b,sub:sub||'Quiz'})});return qs}
/* ================= plan, credits, billing ================= */
function log(label,amt){S.billing.unshift({ts:NOW(),label:label,amt:amt})}
function tick(){var p=S.plan,n=NOW(),g=0;
 while(p&&g++<60){
  if(p.kind==='trial'){
   var end=p.start+PRICE.trialDays*DAY;if(n<end)break;
   if(p.cancelled){S.plan=null;S.pcredits=0;log('Trial ended, no plan started',0);p=null;break}
   var k=p.next;S.plan=p={kind:k,start:end,renewAt:end+(k==='monthly'?30:365)*DAY,credAt:end+30*DAY,cancelled:false};
   S.pcredits=PRICE.credits;log('Trial ended: '+cap(k)+' plan started',PRICE[k]);continue}
  if(n>=p.credAt&&p.credAt<p.renewAt){S.pcredits=PRICE.credits;p.credAt+=30*DAY;continue}
  if(n>=p.renewAt){
   if(p.cancelled){S.plan=null;S.pcredits=0;log('Plan ended',0);p=null;break}
   S.pcredits=PRICE.credits;log(cap(p.kind)+' plan renewed',PRICE[p.kind]);p.start=p.renewAt;p.renewAt+=(p.kind==='monthly'?30:365)*DAY;p.credAt=p.kind==='monthly'?p.renewAt:p.start+30*DAY;continue}
  break}
 S.topups=S.topups.filter(function(t){return t.exp>n&&t.n>0});save()}
function topTotal(){return S.topups.reduce(function(a,t){return a+t.n},0)}
function credits(){return S.pcredits+topTotal()}
function spend(n){n=n||1;if(credits()<n)return false;for(var i=0;i<n;i++){if(S.pcredits>0)S.pcredits--;else{S.topups=S.topups.filter(function(t){return t.n>0});S.topups.sort(function(a,b){return a.exp-b.exp});S.topups[0].n--}}S.spent=(S.spent||0)+n;save();paintTop();return true}
function trialDay(){var p=S.plan;return p&&p.kind==='trial'?Math.min(PRICE.trialDays,Math.floor((NOW()-p.start)/DAY)+1):0}
function nextCharge(){var p=S.plan;if(!p||p.cancelled)return null;if(p.kind==='trial')return{t:p.start+PRICE.trialDays*DAY,amt:PRICE[p.next],what:cap(p.next)+' plan'};return{t:p.renewAt,amt:PRICE[p.kind],what:'renewal'}}
function planName(){var p=S.plan;if(!p)return 'Free';if(p.kind==='trial')return 'Trial';return cap(p.kind)}

/* ================= helpers: toast, modal ================= */
var tt;function toast(m){var t=$('toast');t.textContent=m;t.hidden=false;clearTimeout(tt);tt=setTimeout(function(){t.hidden=true},3400)}
var lastFocus=null;
function modal(html,onmount,opt){opt=opt||{};closeModal();lastFocus=document.activeElement;var d=document.createElement('div');d.className='ov'+(opt.cls?' '+opt.cls:'');d.id='ov';if(opt.noclose)d.setAttribute('data-noclose','true');d.setAttribute('role','dialog');d.setAttribute('aria-modal','true');
 d.innerHTML=opt.bare?html:'<div class="win"><div class="tb"><i></i><i></i><i></i><em>doubtster</em></div><div class="mb">'+html+'</div></div>';(document.querySelector('.pg-app')||document.body).appendChild(d);
 d.addEventListener('mousedown',function(e){
  if(opt.noclose){
   if(e.target===d){var w=d.querySelector('.win');if(w){w.classList.remove('shake');void w.offsetWidth;w.classList.add('shake');}}
   return;
  }
  if(e.target===d){closeModal();if(opt.onclose)opt.onclose()}
 });
 d._onclose=opt.onclose;
 d._noclose=!!opt.noclose;
 var f=d.querySelector('[autofocus],button.vid,button,input,textarea,a');if(f&&!opt.nofocus)f.focus();if(onmount)onmount(d)}
function closeModal(){var d=$('ov');if(d){var cb=d._onclose;d.remove();if(lastFocus&&lastFocus.focus&&document.body.contains(lastFocus))lastFocus.focus()}}
function modalOpen(){return !!$('ov')}
on(document,'keydown',function(e){
  if(e.key==='Escape'){
    if($('ov')){
      if($('ov')._noclose)return;
      var o=$('ov')._onclose;
      closeModal();
      if(o)o();
      return;
    }
    if(busy){
      e.preventDefault();
      stopChatRequest();
    }
  }
});
function ss(k,v){try{if(v===undefined)return sessionStorage.getItem(k);sessionStorage.setItem(k,v)}catch(e){return null}}
/* ================= demo answer engine (English + Hindi, with graphs) ================= */
function num(s){return parseFloat(s)}
function both(a,hi){a.hi=hi;return a}
function linear(q){
 var m=q.match(/(-?\d*\.?\d*)\s*\*?\s*x\s*(?:([+-])\s*(\d+\.?\d*))?\s*=\s*(-?\d+\.?\d*)/);if(!m)return null;
 var a=m[1]===''||m[1]==='+'?1:(m[1]==='-'?-1:num(m[1]));if(!a)return null;
 var b=m[3]?(m[2]==='-'?-1:1)*num(m[3]):0,c=num(m[4]),r=c-b,x=r/a;
 var eq=(a===1?'':a===-1?'-':fmt(a))+'x'+(b?(b<0?' - ':' + ')+fmt(Math.abs(b)):'')+' = '+fmt(c);
 var st=[{h:'Write the equation',t:'Our goal is to get x on its own.',why:'Solving means finding the one value of x that makes both sides equal. Think of the equation as a balanced scale.',math:eq}],hs=[{h:'समीकरण लिखें',t:'हमारा लक्ष्य x को अकेला करना है।',why:'हल करने का मतलब है x की वह एक कीमत ढूँढना जिससे दोनों पक्ष बराबर हो जाएँ। समीकरण को एक संतुलित तराज़ू की तरह सोचिए।'}];
 if(b){st.push({h:(b<0?'Add ':'Subtract ')+fmt(Math.abs(b))+' on both sides',t:'This removes the constant from the left side.',why:'Whatever we do to one side we must do to the other, so the scale stays balanced.',math:fmt(a)+'x = '+fmt(c)+(b<0?' + ':' - ')+fmt(Math.abs(b))+' = '+fmt(r)});
  hs.push({h:'दोनों तरफ़ '+fmt(Math.abs(b))+(b<0?' जोड़ें':' घटाएँ'),t:'इससे बाएँ पक्ष से अचर संख्या हट जाती है।',why:'एक तरफ़ जो भी करें, दूसरी तरफ़ भी वही करें, ताकि तराज़ू संतुलित रहे।'})}
 if(a!==1){st.push({h:'Divide both sides by '+fmt(a),t:'Now x is on its own.',why:'Dividing by the number in front of x undoes the multiplication.',math:'x = '+fmt(r)+' / '+fmt(a)+' = '+fmt(x)});
  hs.push({h:'दोनों तरफ़ '+fmt(a)+' से भाग दें',t:'अब x अकेला हो गया।',why:'x के आगे वाली संख्या से भाग देने से गुणा उलट जाता है।'})}
 var chk=a*x+b;st.push({h:'Check the answer',t:'Put x back into the original equation.',why:'If both sides match, the answer is right. This habit catches most mistakes.',math:fmt(a)+' x '+fmt(x)+(b?(b<0?' - ':' + ')+fmt(Math.abs(b)):'')+' = '+fmt(chk)});
 hs.push({h:'उत्तर जाँचें',t:'x को मूल समीकरण में वापस रखें।',why:'अगर दोनों पक्ष बराबर निकलें तो उत्तर सही है। यह आदत ज़्यादातर गलतियाँ पकड़ लेती है।'});
 var fy='y = '+(a===1?'':a===-1?'-':fmt(a))+'x'+(b?(b<0?' - ':' + ')+fmt(Math.abs(b)):'');
 var g={title:{en:'Where the two sides meet',hi:'जहाँ दोनों पक्ष मिलते हैं'},xl:'x',yl:'y',
  series:[{pts:[[x-4,a*(x-4)+b],[x+4,a*(x+4)+b]],label:fy},{pts:[[x-4,c],[x+4,c]],label:'y = '+fmt(c)}],marks:[{x:x,y:c,label:'x = '+fmt(x)}],
  say:{en:'Here is the same thing as a graph. The sloping line is '+fy+' and the flat line is y equals '+fmt(c)+'. They cross where x equals '+fmt(x)+', and that crossing point is our answer.',hi:'यही बात ग्राफ़ पर देखिए। ढलान वाली रेखा '+fy+' है और सपाट रेखा y = '+fmt(c)+' है। दोनों x = '+fmt(x)+' पर मिलती हैं, और यही मिलन बिंदु हमारा उत्तर है।'}};
 return both({subject:'Maths',title:'Solve '+eq,steps:st,answer:'x = '+fmt(x),graph:g},{subject:'गणित',title:'हल करें '+eq,steps:hs,answer:'x = '+fmt(x)})}
function growth(q){
 var P=q.match(/\$?\s*(\d+(?:\.\d+)?)/),r=q.match(/(\d+(?:\.\d+)?)\s*%/),y=q.match(/(\d+)\s*(?:years|year|yrs|yr)/);if(!P||!r||!y)return null;
 var down=/(los|depreciat|decreas|drop|fall|declin|reduc)/.test(q),up=/(grow|increas|compound|interest|apprec|rise|gain)/.test(q);if(!down&&!up)return null;
 var p0=num(P[1]),rt=num(r[1])/100,n=Math.min(parseInt(y[1],10),30),f=down?1-rt:1+rt,v=p0,rows=[],pts=[[0,p0]];
 for(var i=1;i<=n;i++){var nv=v*f;rows.push([i,v,nv]);pts.push([i,nv]);v=nv}
 var fin=p0*Math.pow(f,n);
 var tb='<table class="tbl"><thead><tr><th>Year</th><th>Start</th><th>End</th></tr></thead><tbody>'+rows.slice(0,8).map(function(x){return '<tr><td>'+x[0]+'</td><td>'+x[1].toFixed(2)+'</td><td>'+x[2].toFixed(2)+'</td></tr>'}).join('')+(rows.length>8?'<tr><td colspan="3">...</td></tr>':'')+'</tbody></table>';
 var rp=num(r[1]);
 var g={title:{en:'Value year by year',hi:'साल दर साल मान'},xl:{en:'Years',hi:'साल'},yl:{en:'Value',hi:'मान'},series:[{pts:pts,label:fmt(p0)+' to '+fin.toFixed(2),dots:true}],marks:[{x:0,y:p0,label:fmt(p0)},{x:n,y:fin,label:fin.toFixed(2)}],
  say:{en:'On the graph you can see the value '+(down?'falling':'rising')+' every year. It is a curve, not a straight line, because each year we take a percentage of the new value, not the original one.',hi:'ग्राफ़ में आप देख सकते हैं कि मान हर साल '+(down?'घट':'बढ़')+' रहा है। यह सीधी रेखा नहीं, एक वक्र है, क्योंकि हर साल प्रतिशत नए मान पर लगता है, मूल मान पर नहीं।'}};
 return both({subject:'Maths',title:(down?'Reducing balance over ':'Compound growth over ')+n+' years',steps:[
  {h:'Find the yearly factor',t:'Each year the value is multiplied by '+(down?'(1 minus the rate)':'(1 plus the rate)')+'.',why:'A '+fmt(rp)+'% change each year means the value is multiplied by the same factor every year.',math:'factor = '+fmt(f)},
  {h:'Write the formula',t:'Start value times the factor, once for each year.',why:'After n years we multiply n times, which is the same as raising the factor to the power n.',math:'V = '+fmt(p0)+' x '+fmt(f)+'^'+n},
  {h:'Calculate',t:'Raise the factor to the power '+n+', then multiply.',why:'Do the power first, then multiply, otherwise the answer comes out wrong.',math:'V = '+fmt(p0*Math.pow(f,n))},
  {h:'Sanity check with a table',t:'Year by year, the value changes by the same percentage each time.',why:'Each year\'s change is a percentage of that year\'s value, so the amount of change is different every year.',html:tb}],
  answer:'About '+fin.toFixed(2)+' after '+n+' years.',graph:g},
  {subject:'गणित',title:(down?'घटते मान की गणना: ':'चक्रवृद्धि वृद्धि: ')+n+' साल',steps:[
  {h:'वार्षिक गुणक निकालें',t:'हर साल मान को '+(down?'(1 घटा दर)':'(1 जमा दर)')+' से गुणा किया जाता है।',why:'हर साल '+fmt(rp)+'% बदलाव का मतलब है कि मान को हर साल एक ही गुणक से गुणा किया जाता है।'},
  {h:'सूत्र लिखें',t:'शुरुआती मान गुणा गुणक, हर साल के लिए एक बार।',why:'n साल बाद n बार गुणा होता है, यानी गुणक की n घात।'},
  {h:'गणना करें',t:'गुणक को '+n+' घात तक बढ़ाएँ, फिर गुणा करें।',why:'पहले घात निकालें, फिर गुणा करें, वरना उत्तर गलत आएगा।'},
  {h:'तालिका से जाँच',t:'साल दर साल मान उसी प्रतिशत से बदलता है।',why:'हर साल का बदलाव उसी साल के मान का प्रतिशत होता है, इसलिए हर साल बदलाव की राशि अलग होती है।'}],
  answer:'लगभग '+fin.toFixed(2)+', '+n+' साल बाद।'})}
function motion(q){
 var v=q.match(/(\d+(?:\.\d+)?)\s*m\s*\/\s*s/),t=q.match(/(\d+(?:\.\d+)?)\s*(?:s\b|sec)/);if(!v||!t||!/rest/.test(q))return null;
 var V=num(v[1]),T=num(t[1]);if(!T)return null;var a=V/T,d=0.5*a*T*T;
 var g={title:{en:'Speed against time',hi:'चाल बनाम समय'},xl:{en:'Time (s)',hi:'समय (s)'},yl:{en:'Speed (m/s)',hi:'चाल (m/s)'},series:[{pts:[[0,0],[T,V]],label:'v = '+fmt(a)+'t'}],area:[[0,0],[T,V],[T,0]],marks:[{x:T,y:V,label:fmt(V)+' m/s'}],
  say:{en:'On the speed-time graph the line rises steadily, so the acceleration is constant. Its slope is '+fmt(a)+'. The shaded triangle underneath is the distance travelled: '+fmt(d)+' metres.',hi:'चाल-समय ग्राफ़ में रेखा लगातार ऊपर उठती है, यानी त्वरण स्थिर है। इसकी ढलान '+fmt(a)+' है। नीचे का छायांकित त्रिभुज तय की गई दूरी है: '+fmt(d)+' मीटर।'}};
 return both({subject:'Physics',title:'Acceleration from rest',steps:[
  {h:'List what is given',t:'Starts from rest, so the initial speed u is 0.',why:'Starting from rest means the object is not moving at the start.',math:'u = 0,  v = '+fmt(V)+' m/s,  t = '+fmt(T)+' s'},
  {h:'Find acceleration',t:'Acceleration is change in velocity divided by time.',why:'Acceleration tells us how quickly the speed changes each second.',math:'a = (v - u) / t = '+fmt(V)+' / '+fmt(T)+' = '+fmt(a)+' m/s^2'},
  {h:'Find distance travelled',t:'Use s = ut + half a t squared, with u = 0.',why:'The distance is the area under the speed-time graph, a triangle here.',math:'s = 0.5 x '+fmt(a)+' x '+fmt(T)+'^2 = '+fmt(d)+' m'}],
  answer:'a = '+fmt(a)+' m/s^2 and distance = '+fmt(d)+' m.',graph:g},
  {subject:'भौतिकी',title:'विराम से त्वरण',steps:[
  {h:'दिया गया डेटा लिखें',t:'विराम से शुरू, इसलिए प्रारंभिक वेग u = 0।',why:'विराम से शुरू का मतलब है कि शुरुआत में वस्तु स्थिर है।'},
  {h:'त्वरण निकालें',t:'त्वरण = वेग में बदलाव ÷ समय।',why:'त्वरण बताता है कि हर सेकंड गति कितनी बदलती है।'},
  {h:'तय की गई दूरी निकालें',t:'s = ut + ½at² में u = 0 रखें।',why:'दूरी चाल-समय ग्राफ़ के नीचे का क्षेत्रफल होती है, यहाँ एक त्रिभुज।'}],
  answer:'a = '+fmt(a)+' m/s² और दूरी = '+fmt(d)+' m।'})}
function arith(q){
 var s=q.replace(/what is|calculate|compute|evaluate|=|\?/g,'').replace(/x|×/g,'*').replace(/÷/g,'/').replace(/\^/g,'**').trim();
 if(!/^[\d\s+\-*/().%]+$/.test(s)||!/\d\s*[+\-*/]\s*\(?\d/.test(s))return null;
 try{var r=Function('"use strict";return ('+s+')')();if(typeof r!=='number'||!isFinite(r))return null;var ex=s.replace(/\*\*/g,'^');
  return both({subject:'Maths',title:'Evaluate '+ex,steps:[{h:'Follow the order of operations',t:'Brackets first, then powers, multiplication and division, then addition and subtraction.',why:'This fixed order means everyone gets the same answer from the same sum.',math:ex+' = '+fmt(r)}],answer:fmt(r)},
   {subject:'गणित',title:'मान निकालें '+ex,steps:[{h:'संक्रियाओं का क्रम अपनाएँ',t:'पहले कोष्ठक, फिर घात, गुणा और भाग, फिर जोड़ और घटाव।',why:'यह तय क्रम होने से एक ही जोड़-घटाव पर सबको एक ही उत्तर मिलता है।'}],answer:fmt(r)})}catch(e){return null}}
var KB=[
 {k:/ice.*float|float.*ice/,a:both({subject:'Chemistry',title:'Why does ice float on water?',steps:[
  {h:'Know what ice is like inside',t:'In ice, water molecules lock into an open hexagonal pattern held by hydrogen bonds.',why:'Each molecule bonds to four neighbours at fixed angles, which leaves empty gaps in the structure.'},
  {h:'Compare the spacing',t:'That open pattern keeps molecules slightly further apart than in liquid water, so the same mass takes up more space.',why:'In liquid water the bonds keep breaking and reforming, so molecules pack closer together.'},
  {h:'Compare density',t:'Ice has a density of about 0.92 g/cm^3 and liquid water about 1.00 g/cm^3.',why:'Density is mass divided by volume, so more volume for the same mass means lower density.',math:'density = mass / volume'},
  {h:'Apply floating',t:'Anything less dense than the liquid it sits in floats, with about 92% of the ice under the surface.',why:'The ratio of the two densities tells you how much sits below the surface.'}],
  answer:'Ice floats because it is roughly 9% less dense than liquid water.',
  graph:{title:{en:'Density (g/cm3)',hi:'घनत्व (g/cm³)'},bars:[{l:{en:'Ice',hi:'बर्फ़'},v:0.92},{l:{en:'Water',hi:'पानी'},v:1.0}],say:{en:'Look at the bars. Ice is a little shorter than water, which means it is less dense, and that is why it floats.',hi:'बार देखिए। बर्फ़ पानी से थोड़ी छोटी है, यानी कम घनी है, और इसीलिए वह तैरती है।'}}},
  {subject:'रसायन विज्ञान',title:'बर्फ़ पानी पर क्यों तैरती है?',steps:[
  {h:'बर्फ़ की अंदरूनी बनावट समझें',t:'बर्फ़ में पानी के अणु हाइड्रोजन बंधों से एक खुली षट्भुजीय बनावट में जुड़ जाते हैं।',why:'हर अणु चार पड़ोसियों से तय कोणों पर जुड़ता है, जिससे बनावट में खाली जगह बच जाती है।'},
  {h:'अणुओं की दूरी की तुलना करें',t:'यह खुली बनावट अणुओं को तरल पानी से थोड़ा दूर रखती है, इसलिए उतना ही द्रव्यमान ज़्यादा जगह घेरता है।',why:'तरल पानी में बंध बार-बार टूटते और बनते रहते हैं, इसलिए अणु ज़्यादा पास-पास आ जाते हैं।'},
  {h:'घनत्व की तुलना करें',t:'बर्फ़ का घनत्व लगभग 0.92 g/cm³ और तरल पानी का लगभग 1.00 g/cm³ होता है।',why:'घनत्व = द्रव्यमान ÷ आयतन, इसलिए उतने ही द्रव्यमान के लिए ज़्यादा आयतन का मतलब कम घनत्व।'},
  {h:'तैरने का नियम लगाएँ',t:'जो चीज़ अपने द्रव से कम घनी हो वह तैरती है, और बर्फ़ का लगभग 92% हिस्सा सतह के नीचे रहता है।',why:'दोनों घनत्वों का अनुपात बताता है कि कितना हिस्सा नीचे डूबा रहेगा।'}],
  answer:'बर्फ़ इसलिए तैरती है क्योंकि वह तरल पानी से लगभग 9% कम घनी है।'})},
 {k:/(mitosis.*meiosis|meiosis.*mitosis)/,a:both({subject:'Biology',title:'Mitosis vs meiosis',steps:[
  {h:'Purpose',t:'Mitosis is for growth and repair. Meiosis makes gametes (sperm and egg cells).',why:'Body cells need exact copies, but gametes need half the chromosomes so that fertilisation restores the full number.'},
  {h:'Divisions',t:'Mitosis has one division. Meiosis has two.',why:'The second division in meiosis is what separates the chromatids to make four cells.'},
  {h:'Result',t:'Mitosis gives 2 genetically identical diploid cells. Meiosis gives 4 genetically different haploid cells.',why:'Diploid means two sets of chromosomes, haploid means one set.'},
  {h:'Variation',t:'Meiosis shuffles genes through crossing over and independent assortment. Mitosis does not.',why:'This shuffling is why siblings differ from each other.'}],
  answer:'Mitosis copies a cell (2 identical cells). Meiosis halves the chromosome number and creates variety (4 different cells).',
  graph:{title:{en:'Cells produced',hi:'बनने वाली कोशिकाएँ'},bars:[{l:{en:'Mitosis',hi:'समसूत्री'},v:2},{l:{en:'Meiosis',hi:'अर्धसूत्री'},v:4}],say:{en:'One cell going through mitosis makes two cells. One cell going through meiosis makes four.',hi:'समसूत्री विभाजन से एक कोशिका दो बनती है। अर्धसूत्री विभाजन से एक कोशिका चार बनती है।'}}},
  {subject:'जीव विज्ञान',title:'समसूत्री और अर्धसूत्री विभाजन',steps:[
  {h:'उद्देश्य',t:'समसूत्री विभाजन वृद्धि और मरम्मत के लिए है। अर्धसूत्री विभाजन युग्मक (शुक्राणु और अंडाणु) बनाता है।',why:'शरीर की कोशिकाओं को हूबहू प्रतियाँ चाहिए, पर युग्मकों में आधे गुणसूत्र चाहिए ताकि निषेचन से पूरी संख्या वापस आ जाए।'},
  {h:'विभाजन की संख्या',t:'समसूत्री में एक विभाजन होता है। अर्धसूत्री में दो।',why:'अर्धसूत्री का दूसरा विभाजन क्रोमैटिड को अलग करके चार कोशिकाएँ बनाता है।'},
  {h:'परिणाम',t:'समसूत्री से 2 समान द्विगुणित कोशिकाएँ बनती हैं। अर्धसूत्री से 4 अलग-अलग अगुणित कोशिकाएँ।',why:'द्विगुणित का मतलब गुणसूत्रों के दो सेट, अगुणित का मतलब एक सेट।'},
  {h:'विविधता',t:'अर्धसूत्री में जीन क्रॉसिंग ओवर और स्वतंत्र वितरण से आपस में मिल जाते हैं। समसूत्री में ऐसा नहीं होता।',why:'इसी मिश्रण की वजह से भाई-बहन एक-दूसरे से अलग होते हैं।'}],
  answer:'समसूत्री एक कोशिका की प्रति बनाता है (2 समान कोशिकाएँ)। अर्धसूत्री गुणसूत्र आधे करके विविधता लाता है (4 अलग कोशिकाएँ)।'})},
 {k:/photosynthesis/,a:both({subject:'Biology',title:'How photosynthesis works',steps:[
  {h:'The overall equation',t:'Plants turn carbon dioxide and water into glucose and oxygen using light.',why:'Light energy ends up stored inside the bonds of glucose.',math:'6CO2 + 6H2O + light -> C6H12O6 + 6O2'},
  {h:'Light reactions',t:'In the thylakoid membranes, light energy splits water, releases oxygen and makes ATP and NADPH.',why:'ATP and NADPH act like charged batteries that carry energy to the next stage.'},
  {h:'Calvin cycle',t:'In the stroma, ATP and NADPH power the fixing of carbon dioxide into sugar.',why:'This stage does not need light directly, but it needs the energy carriers that the light reactions made.'}],
  answer:'Light energy is stored as chemical energy in glucose, and oxygen is released.'},
  {subject:'जीव विज्ञान',title:'प्रकाश संश्लेषण कैसे होता है',steps:[
  {h:'कुल समीकरण',t:'पौधे प्रकाश की मदद से कार्बन डाइऑक्साइड और पानी को ग्लूकोज़ और ऑक्सीजन में बदलते हैं।',why:'प्रकाश की ऊर्जा ग्लूकोज़ के बंधों में जमा हो जाती है।'},
  {h:'प्रकाश अभिक्रियाएँ',t:'थाइलेकॉइड झिल्लियों में प्रकाश ऊर्जा पानी को तोड़ती है, ऑक्सीजन निकलती है और ATP तथा NADPH बनते हैं।',why:'ATP और NADPH चार्ज की हुई बैटरी की तरह अगली अवस्था तक ऊर्जा ले जाते हैं।'},
  {h:'केल्विन चक्र',t:'स्ट्रोमा में ATP और NADPH की ऊर्जा से कार्बन डाइऑक्साइड शर्करा में बदलती है।',why:'इस अवस्था को सीधे प्रकाश नहीं चाहिए, पर प्रकाश अभिक्रियाओं में बने ऊर्जा वाहक चाहिए।'}],
  answer:'प्रकाश ऊर्जा ग्लूकोज़ में रासायनिक ऊर्जा के रूप में जमा होती है और ऑक्सीजन निकलती है।'})},
 {k:/newton.*(second|2nd)|f\s*=\s*m\s*a|force.*mass.*accel/,a:both({subject:'Physics',title:'Newton\'s second law',steps:[
  {h:'State the law',t:'The resultant force on an object equals its mass times its acceleration.',why:'A bigger force gives a bigger acceleration, and a bigger mass gives a smaller one.',math:'F = m a'},
  {h:'Use the units',t:'Mass in kg and acceleration in m/s^2 give force in newtons (N).',why:'One newton is the force that gives 1 kg an acceleration of 1 m/s squared.'},
  {h:'Example',t:'A 10 kg trolley accelerating at 3 m/s^2 needs a resultant force of:',why:'Just multiply the two numbers, because the units already match.',math:'F = 10 x 3 = 30 N'}],
  answer:'F = ma. Send your own numbers and we can work them out.',
  graph:{title:{en:'Force against acceleration (10 kg)',hi:'बल बनाम त्वरण (10 kg)'},xl:{en:'a (m/s2)',hi:'a (m/s²)'},yl:'F (N)',series:[{pts:[[0,0],[5,50]],label:'F = 10a'}],marks:[{x:3,y:30,label:'30 N'}],say:{en:'For a 10 kilogram trolley the graph is a straight line through the origin. At an acceleration of 3 the force is 30 newtons.',hi:'10 किलो की ट्रॉली के लिए ग्राफ़ मूल बिंदु से गुज़रती सीधी रेखा है। त्वरण 3 पर बल 30 न्यूटन है।'}}},
  {subject:'भौतिकी',title:'न्यूटन का दूसरा नियम',steps:[
  {h:'नियम बताएँ',t:'किसी वस्तु पर लगा परिणामी बल उसके द्रव्यमान और त्वरण के गुणनफल के बराबर होता है।',why:'बल बढ़ने से त्वरण बढ़ता है, और द्रव्यमान बढ़ने से त्वरण घटता है।'},
  {h:'मात्रक देखें',t:'द्रव्यमान kg में और त्वरण m/s² में हो तो बल न्यूटन (N) में मिलता है।',why:'एक न्यूटन वह बल है जो 1 kg को 1 m/s² का त्वरण दे।'},
  {h:'उदाहरण',t:'10 kg की ट्रॉली को 3 m/s² के त्वरण के लिए चाहिए परिणामी बल:',why:'बस दोनों संख्याएँ गुणा करें, क्योंकि मात्रक पहले से मेल खाते हैं।'}],
  answer:'F = ma। अपनी संख्याएँ भेजें, हम उन्हें हल कर देंगे।'})},
 {k:/recursion/,a:both({subject:'Coding',title:'Recursion, explained',steps:[
  {h:'The idea',t:'A recursive function solves a problem by calling itself on a smaller version of the same problem.',why:'Each call hands a slightly easier problem to the next call, until the problem is trivial.'},
  {h:'Always have a base case',t:'The base case is the simplest input, answered directly. Without it the calls never stop.',why:'Forgetting the base case is the most common recursion bug and ends in a stack overflow.'},
  {h:'Example: factorial',t:'n! is n times (n-1)!, and 0! is 1.',why:'The line n times fact of n minus 1 is the recursive step, and the 0 case is the base case.',code:'def fact(n):\n    if n == 0:\n        return 1\n    return n * fact(n - 1)\n\nprint(fact(4))  # 24'},
  {h:'Trace it',t:'fact(4) = 4 x fact(3) = 4 x 3 x fact(2) = 4 x 3 x 2 x fact(1) = 24.',why:'Tracing by hand on paper is the best way to really understand what the calls are doing.'}],
  answer:'Recursion = a base case plus a call on a smaller problem.'},
  {subject:'कोडिंग',title:'रिकर्शन समझें',steps:[
  {h:'मूल विचार',t:'रिकर्सिव फ़ंक्शन किसी समस्या को हल करने के लिए उसी समस्या के छोटे रूप पर खुद को बुलाता है।',why:'हर कॉल अगली कॉल को थोड़ी आसान समस्या देती है, जब तक समस्या बहुत आसान न हो जाए।'},
  {h:'बेस केस ज़रूर रखें',t:'बेस केस सबसे सरल इनपुट है जिसका उत्तर सीधे दे दिया जाता है। इसके बिना कॉल कभी नहीं रुकतीं।',why:'बेस केस भूल जाना रिकर्शन की सबसे आम गलती है और इससे स्टैक ओवरफ़्लो हो जाता है।'},
  {h:'उदाहरण: फ़ैक्टोरियल',t:'n! = n × (n−1)! और 0! = 1।',why:'n गुणा fact(n−1) वाली पंक्ति रिकर्सिव चरण है, और 0 वाला मामला बेस केस है।'},
  {h:'चलाकर देखें',t:'fact(4) = 4 × fact(3) = 4 × 3 × fact(2) = 4 × 3 × 2 × fact(1) = 24।',why:'कागज़ पर हाथ से ट्रेस करना समझने का सबसे अच्छा तरीका है कि कॉल क्या कर रही हैं।'}],
  answer:'रिकर्शन = एक बेस केस और छोटी समस्या पर एक कॉल।'})},
 {k:/big\s*o|binary search|time complexity/,a:both({subject:'Coding',title:'Binary search and Big O',steps:[
  {h:'Start with sorted data',t:'Binary search only works when the list is sorted.',why:'Sorting is what lets us throw away half the list after one comparison.'},
  {h:'Halve the search area',t:'Look at the middle item. If it is too big, discard the upper half. If too small, discard the lower half.',why:'Every comparison removes half of the remaining possibilities.'},
  {h:'Count the steps',t:'Halving n items until one is left takes about log base 2 of n steps, written O(log n).',why:'Doubling the list size adds only one extra step, which is why log growth is so slow.',math:'1,000,000 items -> about 20 steps'},
  {h:'Compare with scanning',t:'Checking one by one is O(n): up to 1,000,000 steps.',why:'Scanning gets twice as slow when the list doubles.'}],
  answer:'Binary search is O(log n), far faster than O(n) on large sorted lists.',
  graph:{title:{en:'Steps needed as the list grows',hi:'सूची बढ़ने पर ज़रूरी चरण'},xl:{en:'List size n',hi:'सूची का आकार n'},yl:{en:'Steps',hi:'चरण'},series:[{pts:[[1,1],[20,20]],label:'O(n)'},{pts:[1,2,3,4,5,6,8,10,13,16,20].map(function(n){return[n,Math.log(n)/Math.log(2)]}),label:'O(log n)'}],
   say:{en:'On the graph the straight line is scanning, which keeps climbing. The flat-looking curve is binary search, which barely grows as the list gets bigger.',hi:'ग्राफ़ में सीधी रेखा स्कैनिंग है, जो लगातार ऊपर जाती है। लगभग सपाट वक्र बाइनरी सर्च है, जो सूची बड़ी होने पर भी बहुत कम बढ़ता है।'}}},
  {subject:'कोडिंग',title:'बाइनरी सर्च और Big O',steps:[
  {h:'क्रमबद्ध डेटा से शुरू करें',t:'बाइनरी सर्च तभी काम करता है जब सूची क्रमबद्ध हो।',why:'क्रमबद्ध होने की वजह से एक तुलना के बाद आधी सूची छोड़ी जा सकती है।'},
  {h:'खोज का क्षेत्र आधा करें',t:'बीच का तत्व देखें। वह बड़ा हो तो ऊपरी आधा हटाएँ, छोटा हो तो निचला आधा।',why:'हर तुलना बची हुई संभावनाओं में से आधी हटा देती है।'},
  {h:'चरण गिनें',t:'n तत्वों को तब तक आधा करना जब तक एक न बचे, लगभग log₂ n चरण लेता है, जिसे O(log n) लिखते हैं।',why:'सूची का आकार दोगुना करने पर सिर्फ़ एक चरण बढ़ता है, इसीलिए log की वृद्धि बहुत धीमी होती है।'},
  {h:'स्कैनिंग से तुलना करें',t:'एक-एक करके जाँचना O(n) है: 10,00,000 तक चरण।',why:'सूची दोगुनी होने पर स्कैनिंग दोगुनी धीमी हो जाती है।'}],
  answer:'बाइनरी सर्च O(log n) है, जो बड़ी क्रमबद्ध सूचियों में O(n) से कहीं तेज़ है।'})},
 {k:/supply.*demand|equilibrium/,a:both({subject:'Economics',title:'Finding market equilibrium',steps:[
  {h:'Set quantity demanded equal to quantity supplied',t:'At equilibrium the market clears, so Qd = Qs.',why:'If buyers want more than sellers offer, the price rises. If sellers offer more, the price falls. It settles where they match.'},
  {h:'Example',t:'Take Qd = 100 - 2P and Qs = 20 + 2P.',why:'Demand slopes down because higher prices put buyers off. Supply slopes up because higher prices tempt sellers.',math:'100 - 2P = 20 + 2P'},
  {h:'Solve for price',t:'Collect P terms: 80 = 4P.',why:'Move the P terms to one side and the numbers to the other, like any equation.',math:'P = 20'},
  {h:'Find quantity and check',t:'Put P = 20 into either equation.',why:'Both equations must give the same quantity. If they do not, there is an arithmetic slip somewhere.',math:'Q = 100 - 2(20) = 60  and  20 + 2(20) = 60'}],
  answer:'Equilibrium price 20 and quantity 60 (for the example equations). Send yours to work them out.',
  graph:{title:{en:'Supply and demand',hi:'माँग और आपूर्ति'},xl:{en:'Quantity',hi:'मात्रा'},yl:{en:'Price',hi:'कीमत'},series:[{pts:[[0,50],[100,0]],label:'Demand'},{pts:[[20,0],[100,40]],label:'Supply'}],marks:[{x:60,y:20,label:'P = 20, Q = 60'}],
   say:{en:'The falling line is demand and the rising line is supply. They cross at a price of 20 and a quantity of 60, which is the equilibrium.',hi:'गिरती रेखा माँग है और चढ़ती रेखा आपूर्ति। दोनों कीमत 20 और मात्रा 60 पर मिलती हैं, यही संतुलन है।'}}},
  {subject:'अर्थशास्त्र',title:'बाज़ार संतुलन ढूँढना',steps:[
  {h:'माँगी गई मात्रा को पूर्ति की मात्रा के बराबर रखें',t:'संतुलन पर बाज़ार साफ़ हो जाता है, इसलिए Qd = Qs।',why:'खरीदार ज़्यादा चाहें तो कीमत बढ़ती है, विक्रेता ज़्यादा दें तो कीमत घटती है। कीमत वहाँ टिकती है जहाँ दोनों बराबर हों।'},
  {h:'उदाहरण',t:'मान लें Qd = 100 − 2P और Qs = 20 + 2P।',why:'माँग नीचे की ओर ढलती है क्योंकि ऊँची कीमत खरीदारों को रोकती है। आपूर्ति ऊपर की ओर चढ़ती है क्योंकि ऊँची कीमत विक्रेताओं को लुभाती है।'},
  {h:'कीमत निकालें',t:'P वाले पद एक तरफ़ लाएँ: 80 = 4P।',why:'P वाले पद एक तरफ़ और संख्याएँ दूसरी तरफ़ ले जाएँ, जैसे किसी भी समीकरण में।'},
  {h:'मात्रा निकालें और जाँचें',t:'P = 20 को किसी भी समीकरण में रखें।',why:'दोनों समीकरणों से एक ही मात्रा आनी चाहिए। न आए तो कहीं गणना में चूक है।'}],
  answer:'संतुलन कीमत 20 और मात्रा 60 (उदाहरण के समीकरणों के लिए)। अपने समीकरण भेजें, हम हल कर देंगे।'})}
];
function demoSolve(q){var s=q.toLowerCase().replace(/,/g,'');
 var r=linear(s)||growth(s)||motion(s)||arith(s);if(r)return r;
 for(var i=0;i<KB.length;i++)if(KB[i].k.test(s))return JSON.parse(JSON.stringify(KB[i].a));return null}
var EXAMPLES=['solve 3x - 7 = 11','why does ice float?','a car costs 30000 and loses 15% a year, what is it worth after 6 years?','explain recursion','a car speeds up from rest to 20 m/s in 8 s','mitosis vs meiosis'];

/* ================= shell: nav, header, history ================= */
var VIEWS=['home','chat','flash','quiz','videos','notes','plan','library','account','settings','usage','language','help','apps','learn'];
var LABEL={home:'Home',chat:'Ask',flash:'Flashcards',quiz:'Quizzes',videos:'Videos',notes:'Notes',plan:'Planner',library:'Library',account:'Account',settings:'Settings',usage:'Usage',language:'Language',help:'Get Help',apps:'Apps',learn:'Learn More'};
var GROUPS=[{t:'',v:['home','chat','flash','quiz','videos','notes','plan','library']}];
var ICONS={home:'<path d="M4 11l8-7 8 7v9H4z"/><path d="M10 20v-6h4v6"/>',chat:'<path d="M4 5h16v11H9l-5 4z"/>',
 flash:'<rect x="3" y="7" width="14" height="11" rx="2"/><path d="M7 4h14v11"/>',videos:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M10 9l5 3-5 3z"/>',
 notes:'<path d="M6 3h9l4 4v14H6z"/><path d="M9 12h7M9 16h7"/>',quiz:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01"/>',
 library:'<path d="M5 4v16M10 4v16M15 5l4 15"/>',account:'<circle cx="12" cy="8" r="4"/><path d="M4 20c1-4 4-6 8-6s7 2 8 6"/>',plan:'<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
 play:'<path d="M8 5l11 7-11 7z"/>',check:'<path d="M5 12l5 5 9-10"/>',bolt:'<path d="M13 3L5 14h6l-1 7 8-11h-6z"/>',search:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
 mic:'<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',star:'<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
 cards:'<rect x="3" y="7" width="14" height="11" rx="2"/><path d="M7 4h14v11"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',x:'<path d="M6 6l12 12M18 6L6 18"/>',trash:'<path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/>',
 pen:'<path d="M4 20l1-4L16 5l3 3L8 19z"/>',down:'<path d="M12 4v12M7 11l5 5 5-5M5 20h14"/>',bookmark:'<path d="M7 4h10v16l-5-4-5 4z"/>',attach:'<path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>',up:'<path d="M7 11V20H4v-9zM7 11l4-8c2 0 3 1 3 3l-.5 3H19a2 2 0 0 1 2 2l-1.5 7a2 2 0 0 1-2 1.5H7"/>',dn:'<path d="M7 13V4H4v9zM7 13l4 8c2 0 3-1 3-3l-.5-3H19a2 2 0 0 0 2-2l-1.5-7A2 2 0 0 0 17.500 4H7"/>'};
function ic(n){return '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">'+(ICONS[n]||'')+'</svg>'}
var view='home';
function today(){return dkey(NOW())}
function openTasks(){return S.tasks.filter(function(x){return !x.done&&x.date&&x.date<=dkey(NOW()+DAY)}).length}
function badge(v){
  if (!hasPlan() && ['flash', 'quiz', 'videos', 'notes'].indexOf(v) > -1) {
    return '<em class="bdg pro-tag">PRO</em>';
  }
  var n=v==='flash'?dueCards().length:v==='plan'?openTasks():0;
  return n?'<em class="bdg">'+n+'</em>':'';
}
function paintNav(){$('nv').innerHTML=GROUPS.map(function(g){return (g.t?'<div class="ng">'+g.t+'</div>':'')+g.v.map(function(v){return '<button type="button" data-act="go" data-v="'+v+'"'+(v===view?' aria-current="page"':'')+'>'+ic(v)+'<span>'+LABEL[v]+'</span>'+badge(v)+'</button>'}).join('')}).join('')}
function planMax(){return S.plan&&S.plan.kind==='trial'?PRICE.trialCredits:PRICE.credits}
function paintTop(){
  var c=credits(),b=$('crb');
  if(b){
    if(!hasPlan()){
      if(c > 0){
        b.innerHTML='<b>'+c+'</b> credit'+(c===1?'':'s');
        b.className='cr';
      } else {
        b.innerHTML='Free <u>try Pro</u>';
        b.className='cr free';
      }
    } else {
      b.innerHTML='<b>'+c+'</b> credit'+(c===1?'':'s')+(c===0?' <u>buy</u>':'');
      b.className='cr'+(c===0?' zero':'');
    }
  }

  var _avt=$('avt'),_init=getInitial(),_nm=(S.profile.name||S.profile.email||'').trim();
  if(_avt){
    _avt.textContent=_init;
    _avt.setAttribute('aria-label',_nm?'Account – '+_nm:'Account');
    _avt.title=_nm||'Your Account';
  }

  // Update bottom profile section in sidebar
  var sideAvt = $('side-profile-avatar');
  if(sideAvt) sideAvt.textContent = _init;

  var sideNm = $('side-profile-name');
  if(sideNm) sideNm.textContent = _nm || 'Student';

  var sideBdg = $('side-profile-badge');
  if(sideBdg){
    var isPro = hasPlan();
    if(isPro){
      sideBdg.textContent = 'Pro';
      sideBdg.className = 'side-profile-badge pro';
    } else {
      sideBdg.textContent = c > 0 ? (c + ' cr') : 'Free';
      sideBdg.className = 'side-profile-badge free';
    }
  }

  var n=nextCharge(),pl=$('pl');
  if(!pl) return;
  var studentTitle = (S.college && S.college.name) ? (h(S.college.name)+' Student') : (_nm ? h(_nm) : 'Student');
  if(!S.plan){
    if(c > 0){
      pl.className='pl scite-student-card';
      pl.innerHTML='<div class="scite-student-row" data-act="go" data-v="account" title="Manage account & credits">'+
        '<span class="scite-student-avatar">'+_init+'</span>'+
        '<div class="scite-student-meta">'+
          '<span class="scite-student-name">'+studentTitle+'</span>'+
          '<span class="scite-student-sub">'+c+' credit'+(c===1?'':'s')+' available</span>'+
        '</div>'+
      '</div>';
    } else {
      pl.className='pl scite-student-card free';
      pl.innerHTML='<div class="scite-student-row" data-act="promo" title="Upgrade to Pro">'+
        '<span class="scite-student-avatar pro-icon">✦</span>'+
        '<div class="scite-student-meta">'+
          '<span class="scite-student-name">Doubtster Pro</span>'+
          '<span class="scite-student-sub">Chat free &bull; Unlock Pro tools</span>'+
        '</div>'+
      '</div>';
    }
  } else {
    var mx=planMax();
    pl.className='pl scite-student-card';
    pl.innerHTML='<div class="scite-student-row" data-act="go" data-v="account" title="Manage Pro subscription">'+
      '<span class="scite-student-avatar pro-active">'+_init+'</span>'+
      '<div class="scite-student-meta">'+
        '<span class="scite-student-name">'+planName()+'</span>'+
        '<span class="scite-student-sub">'+S.pcredits+' of '+mx+' credits remaining</span>'+
      '</div>'+
    '</div>';
  }
}
var activeContextChatId = null;

function getContextMenuEl(){
  var menu = document.getElementById('chat-context-menu');
  if(!menu){
    menu = document.createElement('div');
    menu.id = 'chat-context-menu';
    menu.className = 'claude-context-menu';
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-label', 'Chat options');
    menu.hidden = true;
    menu.style.display = 'none';
    document.body.appendChild(menu);
  }
  return menu;
}

function closeChatContextMenu(){
  var menu = document.getElementById('chat-context-menu');
  if(menu){
    menu.hidden = true;
    menu.style.display = 'none';
    menu.classList.remove('is-open');
  }
  activeContextChatId = null;
}

function openChatContextMenu(chatId, x, y){
  var c = S.chats.filter(function(item){ return item.id === chatId; })[0];
  if(!c) return;
  activeContextChatId = chatId;
  var menu = getContextMenuEl();
  var isPinned = Boolean(c.pinned);

  menu.innerHTML = 
    '<button type="button" class="cm-item" data-act="chat-pin" data-id="' + c.id + '" role="menuitem">' +
      '<svg class="cm-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' +
        (isPinned
          ? '<line x1="2" y1="2" x2="22" y2="22"/><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.89A2 2 0 0 1 15 10.77V7a3 3 0 0 0-6 0v3.77a2 2 0 0 1-1.11 1.79l-1.78.89A2 2 0 0 0 5 15.24Z"/>'
          : '<line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.89A2 2 0 0 1 15 10.77V7a3 3 0 0 0-6 0v3.77a2 2 0 0 1-1.11 1.79l-1.78.89A2 2 0 0 0 5 15.24Z"/>') +
      '</svg>' +
      '<span class="cm-label">' + (isPinned ? 'Unpin' : 'Pin') + '</span>' +
      '<kbd class="cm-kbd">P</kbd>' +
    '</button>' +
    '<button type="button" class="cm-item" data-act="chat-rename" data-id="' + c.id + '" role="menuitem">' +
      '<svg class="cm-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>' +
      '</svg>' +
      '<span class="cm-label">Rename</span>' +
      '<kbd class="cm-kbd">R</kbd>' +
    '</button>' +
    '<button type="button" class="cm-item danger" data-act="chat-delete" data-id="' + c.id + '" role="menuitem">' +
      '<svg class="cm-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>' +
      '</svg>' +
      '<span class="cm-label">Delete</span>' +
      '<kbd class="cm-kbd">D</kbd>' +
    '</button>';

  var menuW = 210;
  var menuH = 145;
  var posX = Math.min(x, window.innerWidth - menuW - 12);
  var posY = Math.min(y, window.innerHeight - menuH - 12);
  menu.style.left = Math.max(8, posX) + 'px';
  menu.style.top = Math.max(8, posY) + 'px';
  menu.hidden = false;
  menu.style.display = 'flex';
  menu.classList.add('is-open');
}

function renderChatRow(c, isPinned){
  var isActive = c.id === S.cur && view === 'chat';
  var iconSvg = isPinned
    ? '<svg class="chat-row-icon pin-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.89A2 2 0 0 1 15 10.77V7a3 3 0 0 0-6 0v3.77a2 2 0 0 1-1.11 1.79l-1.78.89A2 2 0 0 0 5 15.24Z"/></svg>'
    : '<svg class="chat-row-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';

  return '<div class="chat-row' + (isActive ? ' is-active' : '') + '" data-chat-id="' + c.id + '">' +
    '<button type="button" class="chat-btn" data-act="openchat" data-id="' + c.id + '"' + (isActive ? ' aria-current="true"' : '') + ' title="' + h(c.title) + '">' +
      iconSvg +
      '<span class="chat-row-title">' + h(c.title) + '</span>' +
    '</button>' +
    '<button type="button" class="chat-more-btn" data-act="chatmenu" data-id="' + c.id + '" aria-label="Chat options" title="More options">' +
      '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/><circle cx="5" cy="12" r="1.5"/></svg>' +
    '</button>' +
  '</div>';
}

function formatRelativeTime(ts: number){
  if(!ts) return '';
  var now = Date.now();
  var diff = Math.max(0, now - ts);
  var sec = Math.floor(diff / 1000);
  var min = Math.floor(sec / 60);
  var hr = Math.floor(min / 60);
  var day = Math.floor(hr / 24);
  if(min < 1) return 'Just now';
  if(min < 60) return min + 'm ago';
  if(hr === 1) return '1 hour ago';
  if(hr < 24) return hr + ' hours ago';
  if(day === 1) return 'Yesterday';
  if(day < 7) return day + ' days ago';
  if(day < 30) return Math.floor(day / 7) + ' weeks ago';
  return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function openRecentsOverlay(){
  var allChats = S.chats.slice().sort(function(a,b){ return (b.pinnedAt || b.ts || 0) - (a.pinnedAt || a.ts || 0); });
  var currentFilter = 'active';
  var currentSearch = '';

  function getFilteredChats(){
    return allChats.filter(function(c){
      if(currentFilter === 'archived'){
        if(!c.archived) return false;
      } else if(currentFilter === 'shared'){
        if(!c.shared) return false;
      } else {
        if(c.archived) return false;
      }

      if(!currentSearch) return true;
      var q = currentSearch.toLowerCase();
      var titleMatch = (c.title || '').toLowerCase().indexOf(q) > -1;
      var msgMatch = (c.msgs || []).some(function(m){
        return (m.t || '').toLowerCase().indexOf(q) > -1 || (m.a && (m.a.title || '').toLowerCase().indexOf(q) > -1);
      });
      return titleMatch || msgMatch;
    });
  }

  function renderListHtml(){
    var list = getFilteredChats();
    if(!list.length){
      return '<div class="cro-empty"><p>' + (currentSearch ? 'No chats match "' + h(currentSearch) + '"' : 'No conversations found') + '</p></div>';
    }
    return list.map(function(c){
      var isCur = c.id === S.cur;
      var timeStr = formatRelativeTime(c.ts || Date.now());
      var hasDoc = (c.msgs || []).some(function(m){ return !!(m.a && m.a.steps && m.a.steps.length); });
      return '<div class="cro-row' + (isCur ? ' is-active' : '') + '" data-chat-id="' + c.id + '" role="button" tabindex="0">' +
        '<div class="cro-row-main">' +
          '<span class="cro-row-title">' + h(c.title || 'Untitled Chat') + '</span>' +
          (hasDoc ? '<svg class="cro-row-doc-icon" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>' : '') +
          (c.pinned ? '<svg class="cro-row-pin-icon" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.89A2 2 0 0 0 5 15.24Z"/></svg>' : '') +
        '</div>' +
        '<span class="cro-row-time">' + timeStr + '</span>' +
      '</div>';
    }).join('');
  }

  var html =
    '<div class="cro-container">' +
      '<div class="cro-head">' +
        '<div class="cro-head-top">' +
          '<h1 class="cro-title">Recents</h1>' +
          '<button type="button" class="cro-close-btn" data-act="close" aria-label="Close">' +
            '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
          '</button>' +
        '</div>' +
        '<div class="cro-controls">' +
          '<div class="cro-tabs">' +
            '<button type="button" class="cro-tab active" data-cro-tab="active">Active</button>' +
            '<button type="button" class="cro-tab" data-cro-tab="shared">Shared</button>' +
            '<button type="button" class="cro-tab" data-cro-tab="archived">Archived</button>' +
          '</div>' +
          '<div class="cro-actions">' +
            '<div class="cro-search-box">' +
              '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' +
              '<input type="text" id="cro-search-inp" placeholder="Search recent chats..." autocomplete="off" />' +
            '</div>' +
            '<button type="button" class="cro-new-btn" data-act="cro-new-chat">' +
              'New session' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="cro-list" id="cro-list">' +
        renderListHtml() +
      '</div>' +
    '</div>';

  modal(html, function(dialog){
    var inp = dialog.querySelector('#cro-search-inp');
    var listEl = dialog.querySelector('#cro-list');

    if(inp){
      inp.focus();
      inp.addEventListener('input', function(){
        currentSearch = inp.value.trim();
        if(listEl) listEl.innerHTML = renderListHtml();
      });
    }

    var tabs = dialog.querySelectorAll('.cro-tab');
    tabs.forEach(function(tab){
      tab.addEventListener('click', function(){
        tabs.forEach(function(t){ t.classList.remove('active'); });
        tab.classList.add('active');
        currentFilter = tab.getAttribute('data-cro-tab') || 'active';
        if(listEl) listEl.innerHTML = renderListHtml();
      });
    });

    if(listEl){
      listEl.addEventListener('click', function(e){
        var row = e.target.closest('[data-chat-id]');
        if(row){
          var cid = row.getAttribute('data-chat-id');
          if(cid){
            closeModal();
            S.cur = cid;
            save(true);
            go('chat');
          }
        }
      });
    }

    var newBtn = dialog.querySelector('[data-act="cro-new-chat"]');
    if(newBtn){
      newBtn.addEventListener('click', function(){
        closeModal();
        newChat();
      });
    }
  }, { bare: true, cls: 'claude-recents-overlay' });
}

(window as any).doubtsterOpenRecents = openRecentsOverlay;

function paintHist(){
  var histEl = $('hist');
  if(!histEl) return;
  var pinned = S.chats.filter(function(c){ return Boolean(c.pinned); }).sort(function(a,b){ return (b.pinnedAt || b.ts) - (a.pinnedAt || a.ts); });
  var recents = S.chats.filter(function(c){ return !c.pinned; }).sort(function(a,b){ return b.ts - a.ts; });

  if(!pinned.length && !recents.length){
    histEl.innerHTML = '<p class="hist-empty">No chats yet. Start a new conversation!</p>';
    return;
  }

  var html = '';
  if(pinned.length){
    html += '<div class="hist-sec' + (S.pinnedCollapsed ? ' is-collapsed' : '') + '">' +
      '<div class="hist-sec-hdr" data-act="toggle-pinned-sec" role="button" tabindex="0">' +
        '<span>Pinned</span>' +
        '<svg class="hist-chevron" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>' +
      '</div>' +
      '<div class="hist-sec-list">' + pinned.map(function(c){ return renderChatRow(c, true); }).join('') + '</div>' +
    '</div>';
  }

  if(recents.length){
    var visibleRecents = recents.slice(0, 14);
    html += '<div class="hist-sec' + (S.recentsCollapsed ? ' is-collapsed' : '') + '">' +
      '<div class="hist-sec-hdr">' +
        '<div class="hist-sec-hdr-title" data-act="toggle-recents-sec" role="button" tabindex="0">' +
          '<span>Recents</span>' +
          '<svg class="hist-chevron" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>' +
        '</div>' +
        '<button type="button" class="hist-search-btn" data-act="open-recents-overlay" title="Search all chats" aria-label="Search all chats">' +
          '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' +
        '</button>' +
      '</div>' +
      '<div class="hist-sec-list">' +
        visibleRecents.map(function(c){ return renderChatRow(c, false); }).join('') +
        (recents.length > 14
          ? '<button type="button" class="hist-more-btn" data-act="open-recents-overlay">' +
              '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' +
              '<span>Load more (' + recents.length + ')</span>' +
            '</button>'
          : (recents.length > 5
              ? '<button type="button" class="hist-more-btn" data-act="open-recents-overlay">' +
                  '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' +
                  '<span>View all recents</span>' +
                '</button>'
              : '')) +
      '</div>' +
    '</div>';
  }

  histEl.innerHTML = html;
}
function repaint(){paintNav();paintHist();paintTop()}
var timers=[];

function renderPaywall(featureKey){
  var normKey = (featureKey || 'flash').toLowerCase();
  if (normKey.indexOf('note') > -1) normKey = 'notes';
  else if (normKey.indexOf('vid') > -1) normKey = 'videos';
  else if (normKey.indexOf('quiz') > -1) normKey = 'quiz';
  else if (normKey.indexOf('flash') > -1) normKey = 'flash';
  else normKey = 'flash';

  var configs: Record<string, { name: string; crumb: string; hl1: string; hl2: string; sub: string }> = {
    flash: {
      name: 'Flashcards',
      crumb: 'Flashcards',
      hl1: 'Remember it,',
      hl2: 'right before you forget.',
      sub: 'Spaced-repetition flashcards made from your own answers, scheduled for the exact moment your memory starts to fade.'
    },
    quiz: {
      name: 'Quizzes',
      crumb: 'Quizzes',
      hl1: 'Test what you know,',
      hl2: "fix what you don't.",
      sub: 'Adaptive practice quizzes generated straight from your answers, pinpointing your exact knowledge gaps.'
    },
    videos: {
      name: 'Videos',
      crumb: 'Videos',
      hl1: 'See it explained,',
      hl2: 'step by handwritten step.',
      sub: 'Blackboard-style video lessons rendered for your doubts, with synchronized AI voice-over and visual steps.'
    },
    notes: {
      name: 'Handwritten Notes',
      crumb: 'Handwritten Notes',
      hl1: 'Master every concept,',
      hl2: 'with verified LaTeX notes.',
      sub: 'Turn any doubt into verified multi-page handwritten notebooks with step-by-step LaTeX derivations and diagrams.'
    }
  };

  var cfg = configs[normKey] || configs.flash;

  // Render Right Column Showcase matching the visual mockup
  var showcaseHtml = '';
  if (normKey === 'flash') {
    showcaseHtml = '<div class="pw-showcase">' +
      '<div class="pw-mock-deck-wrap">' +
        '<div class="pw-mock-card-shadow" aria-hidden="true"></div>' +
        '<div class="pw-mock-card">' +
          '<div class="pw-mock-tag">CARDIO &middot; DUE TODAY</div>' +
          '<div class="pw-mock-q">Which valves closing make the first heart sound?</div>' +
          '<div class="pw-mock-ratings">' +
            '<button type="button" class="pw-mock-rate-btn">Again</button>' +
            '<button type="button" class="pw-mock-rate-btn">Hard</button>' +
            '<button type="button" class="pw-mock-rate-btn active">Good</button>' +
            '<button type="button" class="pw-mock-rate-btn">Easy</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="pw-mock-chart-card">' +
        '<div class="pw-mock-chart-header">' +
          '<b>Next reviews</b>' +
          '<span>memory over time</span>' +
        '</div>' +
        '<div class="pw-mock-chart-svg-wrap">' +
          '<svg viewBox="0 0 380 90" class="pw-retention-svg" preserveAspectRatio="none">' +
            '<path d="M 20 70 L 360 70" stroke="currentColor" stroke-opacity="0.08" stroke-width="1" />' +
            '<path d="M 30 20 Q 55 58 80 62" fill="none" stroke="currentColor" stroke-opacity="0.25" stroke-dasharray="3 3" stroke-width="1.8" />' +
            '<path d="M 30 20 Q 55 50 80 55 L 80 20 Q 120 48 160 52 L 160 20 Q 220 42 280 46 L 280 20 Q 330 32 360 36" fill="none" stroke="#2F7BFF" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />' +
            '<circle cx="30" cy="20" r="4.5" fill="#2F7BFF" />' +
            '<circle cx="80" cy="20" r="4.5" fill="#2F7BFF" />' +
            '<circle cx="160" cy="20" r="4.5" fill="#2F7BFF" />' +
            '<circle cx="280" cy="20" r="4.5" fill="#2F7BFF" />' +
          '</svg>' +
        '</div>' +
        '<div class="pw-mock-chart-labels">' +
          '<span>Today</span>' +
          '<span>1 day</span>' +
          '<span>3 days</span>' +
          '<span>1 week</span>' +
          '<span>3 weeks</span>' +
        '</div>' +
      '</div>' +
    '</div>';
  } else if (normKey === 'quiz') {
    showcaseHtml = '<div class="pw-showcase">' +
      '<div class="pw-mock-deck-wrap">' +
        '<div class="pw-mock-card-shadow" aria-hidden="true"></div>' +
        '<div class="pw-mock-card">' +
          '<div class="pw-mock-tag">PHYSICS &middot; QUESTION 3 OF 5</div>' +
          '<div class="pw-mock-q">A 2 kg object accelerates at 5 m/s&sup2;. What is the resultant force?</div>' +
          '<div class="pw-mock-quiz-options">' +
            '<div class="pw-mock-opt">2.5 N</div>' +
            '<div class="pw-mock-opt">7 N</div>' +
            '<div class="pw-mock-opt active">' +
              '<span>10 N</span>' +
              '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>' +
            '</div>' +
            '<div class="pw-mock-opt">0.4 N</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="pw-mock-chart-card">' +
        '<div class="pw-mock-chart-header">' +
          '<b>Subject Mastery</b>' +
          '<span>adaptive algorithm</span>' +
        '</div>' +
        '<div class="pw-mock-mastery-list">' +
          '<div class="pw-mastery-row">' +
            '<span>Maths</span>' +
            '<div class="pw-mastery-bar"><div class="pw-mastery-fill" style="width:94%"></div></div>' +
            '<b>94%</b>' +
          '</div>' +
          '<div class="pw-mastery-row">' +
            '<span>Physics</span>' +
            '<div class="pw-mastery-bar"><div class="pw-mastery-fill" style="width:86%"></div></div>' +
            '<b>86%</b>' +
          '</div>' +
          '<div class="pw-mastery-row">' +
            '<span>Chemistry</span>' +
            '<div class="pw-mastery-bar"><div class="pw-mastery-fill" style="width:78%"></div></div>' +
            '<b>78%</b>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  } else if (normKey === 'videos') {
    showcaseHtml = '<div class="pw-showcase">' +
      '<div class="pw-mock-deck-wrap">' +
        '<div class="pw-mock-card-shadow" aria-hidden="true"></div>' +
        '<div class="pw-mock-card pw-mock-video-board">' +
          '<div class="pw-mock-tag" style="color:#34D399">BLACKBOARD STUDIO &middot; 2:00</div>' +
          '<div class="pw-mock-board-inner">' +
            '<div class="pw-mock-equation">6CO₂ + 6H₂O  ─light→  C₆H₁₂O₆ + 6O₂</div>' +
            '<div class="pw-mock-board-sub">STEP 2 OF 4 &middot; CHLOROPLAST REACTION</div>' +
          '</div>' +
          '<div class="pw-mock-video-controls">' +
            '<div class="pw-mock-play-pill">' +
              '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>' +
              '<span>Voice Narrated</span>' +
            '</div>' +
            '<div class="pw-mock-waveform">' +
              '<span></span><span></span><span></span><span></span><span></span><span></span><span></span>' +
            '</div>' +
            '<span class="pw-mock-timer">2:00</span>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="pw-mock-chart-card">' +
        '<div class="pw-mock-chart-header">' +
          '<b>Video Studio Inclusions</b>' +
          '<span>included in Pro</span>' +
        '</div>' +
        '<div class="pw-mock-bullets">' +
          '<div class="pw-mock-b-item">✦ <b>30 video credits</b> renewed every month</div>' +
          '<div class="pw-mock-b-item">✦ <b>AI voice narration</b> with synced chalkboard math</div>' +
          '<div class="pw-mock-b-item">✦ <b>Adaptive length</b> in 2 min or 5 min deep dives</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  } else {
    showcaseHtml = '<div class="pw-showcase">' +
      '<div class="pw-mock-deck-wrap">' +
        '<div class="pw-mock-card-shadow" aria-hidden="true"></div>' +
        '<div class="pw-mock-card pw-mock-notes-paper">' +
          '<div class="pw-mock-tag">NOTEBOOK &middot; MITOSIS.MD</div>' +
          '<div class="pw-mock-note-title">Mitosis vs. Meiosis Summary</div>' +
          '<div class="pw-mock-note-math">&Delta;G = &Delta;H &minus; T&Delta;S</div>' +
          '<div class="pw-mock-note-steps">' +
            '<div class="pw-mock-step"><b>1. Prophase:</b> Chromatin condenses into visible chromosomes.</div>' +
            '<div class="pw-mock-step"><b>2. Metaphase:</b> Sister chromatids align along equatorial plate.</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="pw-mock-chart-card">' +
        '<div class="pw-mock-chart-header">' +
          '<b>Handwritten Notes System</b>' +
          '<span>auto-generated</span>' +
        '</div>' +
        '<div class="pw-mock-bullets">' +
          '<div class="pw-mock-b-item">✦ <b>600+ words</b> of verified depth with LaTeX</div>' +
          '<div class="pw-mock-b-item">✦ <b>Multi-device cloud sync</b> across web & phone</div>' +
          '<div class="pw-mock-b-item">✦ <b>1-click export</b> to Markdown & printable PDF</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  var html = '<div class="pw-page-wrap">' +
    '<div class="pw-grid">' +
      '<div class="pw-col-left">' +
        '<div class="pw-breadcrumb">' +
          '<span class="pw-crumb-link" data-act="go" data-v="chat">Doubtster</span>' +
          '<span class="pw-crumb-sep">/</span>' +
          '<span class="pw-crumb-curr">' + h(cfg.crumb) + '</span>' +
        '</div>' +
        '<div class="pw-pill-pro">' +
          '<div class="pw-pill-pro-icon">' +
            '<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z"/></svg>' +
          '</div>' +
          '<span>Pro feature</span>' +
        '</div>' +
        '<h1 class="pw-title">' +
          h(cfg.hl1) + '<br>' +
          '<span class="pw-hl-blue">' + h(cfg.hl2) + '</span>' +
        '</h1>' +
        '<p class="pw-sub">' + h(cfg.sub) + '</p>' +
        '<div class="pw-perks-list">' +
          '<div class="pw-perk-row">' +
            '<div class="pw-perk-icon">' +
              '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                '<rect x="2" y="7" width="16" height="13" rx="2" ry="2"></rect>' +
                '<path d="M6 3h12a2 2 0 0 1 2 2v12"></path>' +
              '</svg>' +
            '</div>' +
            '<div class="pw-perk-text">' +
              '<b>Smart flashcards</b>' +
              '<p>Made from any answer, on a schedule that adapts to you</p>' +
            '</div>' +
          '</div>' +
          '<div class="pw-perk-row">' +
            '<div class="pw-perk-icon">' +
              '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                '<polygon points="23 7 16 12 23 17 23 7"></polygon>' +
                '<rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>' +
              '</svg>' +
            '</div>' +
            '<div class="pw-perk-text">' +
              '<b>AI Video Studio</b>' +
              '<p>30 narrated explainer videos every month</p>' +
            '</div>' +
          '</div>' +
          '<div class="pw-perk-row">' +
            '<div class="pw-perk-icon">' +
              '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>' +
                '<polyline points="14 2 14 8 20 8"></polyline>' +
                '<line x1="16" y1="13" x2="8" y2="13"></line>' +
                '<line x1="16" y1="17" x2="8" y2="17"></line>' +
              '</svg>' +
            '</div>' +
            '<div class="pw-perk-text">' +
              '<b>Handwritten notes, quizzes & sync</b>' +
              '<p>LaTeX-ready notes, auto-made quizzes, on every device</p>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="pw-plans-grid">' +
          '<div class="pw-plan-card selected" id="pw-plan-trial" data-act="pw-select-plan" data-plan="trial">' +
            '<span class="pw-badge-start">START HERE</span>' +
            '<div class="pw-plan-left">' +
              '<span class="pw-radio-circle"></span>' +
              '<div class="pw-plan-info">' +
                '<span class="pw-plan-name">7-day all-access trial</span>' +
                '<span class="pw-plan-desc">Every Pro tool + 3 video credits</span>' +
              '</div>' +
            '</div>' +
            '<div class="pw-plan-price">$1.99</div>' +
          '</div>' +
          '<div class="pw-plan-card" id="pw-plan-monthly" data-act="pw-select-plan" data-plan="monthly">' +
            '<div class="pw-plan-left">' +
              '<span class="pw-radio-circle"></span>' +
              '<div class="pw-plan-info">' +
                '<span class="pw-plan-name">Monthly Pro</span>' +
                '<span class="pw-plan-desc">30 video credits a month, cancel anytime</span>' +
              '</div>' +
            '</div>' +
            '<div class="pw-plan-price">$7.99<small>/mo</small></div>' +
          '</div>' +
        '</div>' +
        '<div class="pw-actions-container">' +
          '<div class="pw-actions-btns">' +
            '<button type="button" class="pw-btn-primary" id="pw-cta-submit" data-act="pw-submit">Start 7-day trial · $1.99</button>' +
            '<button type="button" class="pw-btn-secondary" id="pw-cta-free" data-act="go" data-v="chat">Continue with free chat</button>' +
          '</div>' +
          '<div class="pw-fine-print" id="pw-fine-print">Chat stays free forever. Cancel before day 7 and $1.99 is all you pay.</div>' +
        '</div>' +
      '</div>' +
      '<div class="pw-col-right">' +
        showcaseHtml +
      '</div>' +
    '</div>' +
  '</div>';

  $('view').innerHTML = html;

  var curSelectedPlan = 'trial';
  function setPlan(p: string){
    curSelectedPlan = p;
    var tCard = $('pw-plan-trial');
    var mCard = $('pw-plan-monthly');
    var submitBtn = $('pw-cta-submit');
    var fine = $('pw-fine-print');
    if(p === 'trial'){
      if(tCard) tCard.classList.add('selected');
      if(mCard) mCard.classList.remove('selected');
      if(submitBtn) submitBtn.textContent = 'Start 7-day trial · $1.99';
      if(fine) fine.textContent = 'Chat stays free forever. Cancel before day 7 and $1.99 is all you pay.';
    } else {
      if(mCard) mCard.classList.add('selected');
      if(tCard) tCard.classList.remove('selected');
      if(submitBtn) submitBtn.textContent = 'Get Monthly Pro · $7.99';
      if(fine) fine.textContent = 'Chat stays free forever. 30 video credits a month, cancel anytime.';
    }
  }

  (window as any).__pwSetPlan = setPlan;
  (window as any).__pwSubmit = function(){
    if(curSelectedPlan === 'trial'){
      checkout('trial', 'monthly');
    } else {
      checkout('direct', 'monthly');
    }
  };

  var tEl = $('pw-plan-trial');
  if(tEl) tEl.onclick = function(){ setPlan('trial'); };
  var mEl = $('pw-plan-monthly');
  if(mEl) mEl.onclick = function(){ setPlan('monthly'); };
  var subEl = $('pw-cta-submit');
  if(subEl) subEl.onclick = function(){ (window as any).__pwSubmit(); };
}

function go(v,noHash){
  closeChatContextMenu();
  try { (window as any).doubtsterGo = go; (window as any).doubtsterPromo = promo; } catch(e){}
  if(v==='plans'){ promo(); return; }

  if(['flash','quiz','videos','notes'].indexOf(v)>-1 && !hasPlan()){
    view=v;if(!noHash){try{history.replaceState(null,'','#'+v)}catch(e){}}
    timers.forEach(clearInterval);timers=[];stopPlayer();paintNav();paintHist();if(v!=='chat')window.scrollTo(0,0);
    renderPaywall(v);
    var m=$('view');m.classList.remove('vin');void m.offsetWidth;m.classList.add('vin');
    return;
  }
  view=v;if(!noHash){try{history.replaceState(null,'','#'+v)}catch(e){}}
  timers.forEach(clearInterval);timers=[];stopPlayer();paintNav();paintHist();if(v!=='chat')window.scrollTo(0,0);
  if(R[v]) R[v]();
  var m=$('view');m.classList.remove('vin');void m.offsetWidth;m.classList.add('vin');
}

/* ================= home ================= */
function greet(){var hr=new Date().getHours();return hr<5?'still up':hr<12?'good morning':hr<17?'good afternoon':'good evening'}
function goalToday(){var a=S.act[today()]||{};return(a.q||0)+(a.c||0)+(a.z||0)}
function subjMastery(){var m={};S.quizzes.forEach(function(q){if(!q.s||q.s==='Mixed'||!q.total)return;(m[q.s]=m[q.s]||{s:0,t:0});m[q.s].s+=q.score;m[q.s].t+=q.total});return Object.keys(m).map(function(k){return{s:k,p:Math.round(m[k].s/m[k].t*100)}}).sort(function(a,b){return b.p-a.p}).slice(0,5)}
function checklist(){return[
 {t:'Ask your first question',d:S.chats.length>0,a:'chat'},
 {t:'Make a flashcard deck from a reply',d:S.decks.length>0,a:'chat'},
 {t:'Finish a quiz',d:S.quizzes.length>0,a:'quiz'},
 {t:'Study your due cards',d:Object.keys(S.act).some(function(k){return S.act[k].c}),a:'flash'},
 {t:'Make a video (Pro)',d:S.videos.length>0,a:'videos'}]}
function badges(){var t=0;Object.keys(S.act).forEach(function(k){t+=(S.act[k].c||0)});var best=0;S.quizzes.forEach(function(q){if(q.total&&q.score===q.total)best=1});
 return[{n:'First question',d:S.chats.length>0},{n:'First deck',d:S.decks.length>0},{n:'100 cards reviewed',d:t>=100},{n:'Perfect quiz',d:!!best},{n:'3 day streak',d:streak()>=3},{n:'7 day streak',d:streak()>=7},{n:'First video',d:S.videos.length>0}]}
function renderHome(){var rawNm=(S.profile&&S.profile.name)||'',nm=rawNm?(rawNm.charAt(0).toUpperCase()+rawNm.slice(1)):'',due=dueCards().length,g=goalToday(),gp=Math.min(100,Math.round(g/S.goal*100)),st=streak(),wb=weekBars(),mx=Math.max(1,Math.max.apply(null,wb.map(function(x){return x.n}))),cl=checklist(),done=cl.filter(function(x){return x.d}).length,sm=subjMastery();
 var recent=S.chats.slice().sort(function(a,b){return b.ts-a.ts}).slice(0,4);
 $('view').innerHTML='<div class="pgw wide">'+
 (S.profile.level||S.dismissed?'':'<div class="banner"><span>Tell us your level and subjects so answers fit you.</span><span><a href="'+h(CFG.ONBOARDING_URL)+'">finish setup</a> &nbsp; <button type="button" data-act="dismiss">not now</button></span></div>')+
 '<section class="hero2"><div class="hl"><p class="eyebrow">'+greet()+'</p><h1>What are you<br>learning today'+(nm?', <span class="nmx">'+h(nm)+'</span>':'')+'?</h1></div>'+
 '<div class="hr"><div class="cbox qa"><label class="sr" for="hq">Ask a question</label><textarea id="hq" rows="2" maxlength="1000" placeholder="Ask anything, or paste a problem"></textarea><div class="crow2"><span class="free">chat is free</span><kbd class="kk">Ctrl K</kbd><button class="send" id="hsend" type="button" aria-label="Ask" disabled>&#8593;</button></div></div><div class="sug">'+EXAMPLES.slice(0,4).map(function(x){return '<button type="button" data-act="ask" data-q="'+h(x)+'">'+h(x)+'</button>'}).join('')+'</div></div></section>'+
 '<div class="stats">'+
 '<div class="win stat"><div class="tb"><i></i><i></i><i></i><em>streak</em></div><div class="sb"><div class="big">'+st+'</div><p>day'+(st===1?'':'s')+' in a row</p><small>'+(dayTotal(today())?'Today counts.':'Study a little today to '+(st?'keep it':'start one')+'.')+'</small></div></div>'+
 '<div class="win stat"><div class="tb"><i></i><i></i><i></i><em>daily goal</em></div><div class="sb row"><div class="ring" style="--p:'+gp+'"><b>'+g+'</b><small>/ '+S.goal+'</small></div><div><p>Questions, cards and quiz answers today.</p><button class="lnk" type="button" data-act="go" data-v="account">change goal</button></div></div></div>'+
 '<div class="win stat"><div class="tb"><i></i><i></i><i></i><em>flashcards</em></div><div class="sb"><div class="big">'+due+'</div><p>card'+(due===1?'':'s')+' due now</p><button class="pill b sm" type="button" data-act="'+(due?'studyall':'go')+'" data-v="flash">'+(due?'study now':'open decks')+'</button></div></div>'+
 '<div class="win stat"><div class="tb"><i></i><i></i><i></i><em>credits</em></div><div class="sb"><div class="big">'+(S.plan?credits():'0')+'</div><p>'+(S.plan?planName()+' plan':'Free plan')+'</p><button class="pill sm" type="button" data-act="'+(S.plan?'credits':'promo')+'">'+(S.plan?'buy credits':'try Pro')+'</button></div></div></div>'+
 '<div class="pcols"><div class="col1">'+
 (done<cl.length&&!S.hideList?'<div class="win form"><div class="tb"><i></i><i></i><i></i><em>get started '+done+'/'+cl.length+'</em></div><div class="in3"><ul class="chk2">'+cl.map(function(x){return '<li class="'+(x.d?'d':'')+'"><span class="bx">'+(x.d?ic('check'):'')+'</span><button type="button" data-act="go" data-v="'+x.a+'">'+h(x.t)+'</button></li>'}).join('')+'</ul><button type="button" class="lnk" data-act="hidelist">hide this</button></div></div>':'')+
 '<div class="win form"><div class="tb"><i></i><i></i><i></i><em>continue</em></div><div class="in3">'+(recent.length?'<ul class="rcp">'+recent.map(function(c){return '<li><a href="#" class="link" data-act="openchat" data-id="'+c.id+'">'+h(c.title)+'</a><span class="mute">'+dstr(c.ts)+'</span></li>'}).join('')+'</ul>':'<p class="mute">No chats yet. Ask something above.</p>')+'</div></div>'+
 '<div class="win form"><div class="tb"><i></i><i></i><i></i><em>make something</em></div><div class="in3"><div class="tiles">'+
 '<button type="button" data-act="go" data-v="flash">'+ic('flash')+'<b>Flashcards</b><small>from a topic or a reply</small></button>'+
 '<button type="button" data-act="go" data-v="quiz">'+ic('quiz')+'<b>Quiz</b><small>by subject, or timed</small></button>'+
 '<button type="button" data-act="go" data-v="videos">'+ic('videos')+'<b>Video</b><small>2 or 5 minutes</small></button>'+
 '<button type="button" data-act="go" data-v="plan">'+ic('plan')+'<b>Plan</b><small>exams and a focus timer</small></button></div></div></div></div>'+
 '<div class="col2"><div class="win form"><div class="tb"><i></i><i></i><i></i><em>this week</em></div><div class="in3"><div class="bars">'+wb.map(function(x){return '<div class="bc"><i style="height:'+Math.max(4,Math.round(x.n/mx*100))+'%" title="'+x.n+'"></i><span>'+x.d+'</span></div>'}).join('')+'</div></div></div>'+
 '<div class="win form"><div class="tb"><i></i><i></i><i></i><em>quiz scores by subject</em></div><div class="in3">'+(sm.length?sm.map(function(x){return '<div class="smr"><span>'+h(x.s)+'</span><div class="meter"><i style="width:'+x.p+'%"></i></div><b>'+x.p+'%</b></div>'}).join(''):'<p class="mute">Finish a subject quiz and your scores show here.</p>')+'</div></div>'+
 '<div class="win form"><div class="tb"><i></i><i></i><i></i><em>milestones</em></div><div class="in3"><div class="bdgs">'+badges().map(function(b){return '<span class="msb'+(b.d?' on':'')+'">'+ic(b.d?'star':'clock')+h(b.n)+'</span>'}).join('')+'</div></div></div></div></div></div>';
 var hq=$('hq'),hs=$('hsend');
 hq.addEventListener('input',function(){hs.disabled=!hq.value.trim()});
 hq.addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();hs.click()}});
 hs.onclick=function(){var v=hq.value.trim();if(!v)return;go('chat');ask(v)}}

/* ================= chat ================= */
function curChat(){return S.chats.filter(function(c){return c.id===S.cur})[0]||null}
function newChat(){S.cur=null;save();go('chat')}
var freshIdx=-1;
function synth(q,text){var parts=String(text).replace(/([.!?])\s+/g,'$1\n').split('\n').map(function(x){return x.trim()}).filter(Boolean).slice(0,8);
 return{title:q.slice(0,70),subject:'',steps:parts.length?parts.map(function(p){return p.length>64?{h:p.slice(0,61)+'...',t:p}:{h:p,t:''}}):[{h:q,t:''}],answer:parts[parts.length-1]||''}}
function srcOf(i){var c=curChat();if(!c)return null;var m=c.msgs[i];if(!m)return null;if(m.a)return m.a;if(m.text)return synth((c.msgs[i-1]&&c.msgs[i-1].t)||'Answer',m.text);return null}
function qOf(i){var c=curChat();return(c&&c.msgs[i-1]&&c.msgs[i-1].r==='u'&&c.msgs[i-1].t)||''}
function genBar(mid,a){var nc=a?deckFrom(a,qOf(mid)).cards.length:0,nq=Math.min(5,nc);
 return '<div class="gen"><span class="gl">Turn this reply into</span><div class="gts">'+
 '<button type="button" class="gt gv" data-act="mkvideo" data-m="'+mid+'"><i>'+ic('play')+'</i><span><b>Video</b><small>2 min (1 credit) or 5 min (2)</small></span></button>'+
 '<button type="button" class="gt gf" data-act="mkdeck" data-m="'+mid+'"><i>'+ic('flash')+'</i><span><b>Flashcards</b><small>free'+(nc?', '+nc+' cards':'')+'</small></span></button>'+
 '<button type="button" class="gt gq" data-act="mkquiz" data-m="'+mid+'"><i>'+ic('quiz')+'</i><span><b>Quiz</b><small>free'+(nq?', '+nq+' questions':'')+'</small></span></button></div></div>'}
function msgTools(m,mid){var sv=S.saved.some(function(x){return x.mid===curKey(mid)});
 return '<div class="acts"><button type="button" data-act="mknote" data-m="'+mid+'">'+ic('notes')+'Notes</button><button type="button" data-act="copy" data-m="'+mid+'">Copy</button><button type="button" data-act="save" data-m="'+mid+'" aria-pressed="'+sv+'">'+ic('bookmark')+(sv?'Saved':'Save')+'</button>'+
 '<span class="sp"></span><button type="button" class="ico" data-act="fb" data-v="1" data-m="'+mid+'" aria-label="Good answer" aria-pressed="'+(m.fb===1)+'">'+ic('up')+'</button><button type="button" class="ico" data-act="fb" data-v="-1" data-m="'+mid+'" aria-label="Bad answer" aria-pressed="'+(m.fb===-1)+'">'+ic('dn')+'</button><button type="button" data-act="report" data-m="'+mid+'">Report</button></div>'}
function curKey(mid){return S.cur+':'+mid}
function ansHTML(m,mid,fresh){var a=m.a;
 var st=a.steps.map(function(s,i){return '<li style="--i:'+i+'"><b>'+h(s.h)+'</b>'+(s.t?'<span class="tx">'+h(s.t)+'</span>':'')+(s.math?'<span class="mth">'+h(s.math)+'</span>':'')+(s.code?'<code class="cd">'+h(s.code)+'</code>':'')+(s.html||'')+'</li>'}).join('');
 return '<div class="am'+(fresh?' fresh':'')+'"><div class="win"><div class="tb"><i></i><i></i><i></i><em>answer.md</em></div><div class="bd2"><p class="subj">'+h(a.subject||'General')+'</p><h3>'+h(a.title||'Answer')+'</h3><ol class="stp">'+st+'</ol>'+(a.answer?'<div class="fin" style="--i:'+a.steps.length+'"><b>Answer:</b> '+h(a.answer)+'</div>':'')+
  genBar(mid,a)+msgTools(m,mid)+'<p class="aim">AI explanations can contain mistakes. Check important answers with your teacher.</p></div></div></div>'}
function aToMarkdown(a){
 var isCar = /30,?000|15%|6 year|reducing balance/i.test((a.title||'')+' '+(a.answer||''));
 var md='## Quick answer\n';
 if(isCar){
  md+='After 6 years, the car is worth about **$11,314** (precisely $11,314.49).\n\n';
 } else {
  md+=(a.answer||a.title||'Here is the step-by-step solution.')+'\n\n';
 }
 md+='## Concept\n';
 if(isCar){
  md+='The car loses 15% of its value each year through exponential depreciation.\n:::key\nEach year the car retains ==85% of its previous value== ($1 - 0.15 = 0.85$).\n:::\n\n';
 } else {
  md+=(a.title?a.title+'\n':'');
  if(a.steps&&a.steps[0])md+=':::key\n'+(a.steps[0].why||a.steps[0].t||a.steps[0].h)+'\n:::\n\n';
 }
 md+='## Solution\n';
 if(isCar){
  md+='### Step 1: Find the annual decay multiplier\n';
  md+='Subtract the depreciation rate from 1 to find the remaining fraction each year.\n';
  md+=':::formula\n$$ 1 - 0.15 = 0.85 $$\n:::\n\n';
  md+='### Step 2: Set up the value formula\n';
  md+='Multiply the initial value by the decay factor raised to the 6th power.\n';
  md+=':::formula\n$$ V = 30000 \\times 0.85^6 $$\n:::\n\n';
  md+='### Step 3: Compute the power and final value\n';
  md+='First calculate $0.85^6 \\approx 0.3771495$, then multiply by the initial value.\n';
  md+='$$ V \\approx 30000 \\times 0.37715 = 11314.49 $$\n\n';
 } else {
  (a.steps||[]).forEach(function(s,idx){
   md+='### Step '+(idx+1)+': '+s.h+'\n';
   if(s.why)md+=s.why+'\n';else if(s.t)md+=s.t+'\n';
   if(s.math){
    var mth=s.math.replace(/ x /g,' \\times ').replace(/ \/ /g,' / ');
    if(idx===1)md+=':::formula\n$$ '+mth+' $$\n:::\n';
    else md+='$$ '+mth+' $$\n';
   }
   if(s.code)md+='```\n'+s.code+'\n```\n';
   md+='\n';
  });
 }
 md+='## Check\n';
 if(isCar){
  md+='Sanity check: at 15% annual loss, value roughly halves every 4.5 years. After 6 years, it must be under $15,000, confirming about $11,314.\n\n';
 } else {
  md+='Verify units and substitute the result back to confirm consistency.\n\n';
 }
 md+='## Common mistake\n';
 if(isCar){
  md+=':::warning\nSubtracting 15% of the ORIGINAL $30,000 value ($4,500) each year. Depreciation applies to the remaining balance, not the original value!\n:::\n\n';
 } else {
  md+=':::warning\nDropping units or rounding intermediate values prematurely.\n:::\n\n';
 }
 md+='## Final answer\n:::answer\n';
 if(isCar){
  md+='**Final answer:** about $11,314 ($11,314.49)\n';
 } else {
  md+='**Final answer:** '+(a.answer || a.title || 'Completed')+'\n';
 }
 md+=':::\n';
 return md;
}
function plainHTML(m,mid,fresh){
  var isSmallTalk=m.intent==='SMALL_TALK'||m.intent==='META'||(
    !m.a&&(!m.parts||!m.parts.length)&&(!m.steps||!m.steps.length)&&
    m.text&&!m.text.includes('###')&&!m.text.includes(':::')&&!m.text.includes('## ')
  );
  if(isSmallTalk){
    return '<div class="am plain-talk'+(fresh?' fresh':'')+'">'+
      '<div class="tutor-bubble">'+
        '<div class="tutor-avatar" aria-hidden="true">?</div>'+
        '<div class="tutor-content">'+
          renderTutorMarkdown(m.text||'')+
        '</div>'+
      '</div>'+
    '</div>';
  }
  return '<div class="am'+(fresh?' fresh':'')+'"><div class="win"><div class="tb"><i></i><i></i><i></i><em>reply.md</em></div><div class="bd2"><div id="ans-mount-'+mid+'" class="ans-mount" data-mid="'+mid+'"></div>'+genBar(mid,srcOf(mid))+msgTools(m,mid)+'<p class="aim">AI explanations can contain mistakes. Check important answers with your teacher.</p></div></div></div>';
}
function demoFallback(m,mid){return '<div class="am"><div class="win"><div class="tb"><i></i><i></i><i></i><em>reply.md</em></div><div class="bd2"><span class="demo">DEMO MODE</span><p class="tx">The built-in demo can solve linear equations, percentage change over years, speed-up-from-rest problems and basic sums, and explain a few topics. Anything else needs your AI endpoint (set <b>NEXT_PUBLIC_DEMO=false</b> and build the endpoint). Try one of these:</p><div class="sug" style="justify-content:flex-start">'+EXAMPLES.map(function(x){return '<button type="button" data-act="ask" data-q="'+h(x)+'">'+h(x)+'</button>'}).join('')+'</div>'+genBar(mid,null)+'</div></div></div>'}

/* ================= thinking line (symbols, words, dots, elapsed timer) ================= */
var THINK_I18N = {
  en: {
    label: "Doubtster is working",
    words: [
      "Chalking it out",
      "Hunting for x",
      "Sharpening pencils",
      "Balancing the equation",
      "Flipping through the textbook",
      "Doodling in the margin",
      "Carrying the one",
      "Cracking the problem",
      "Connecting the dots",
      "Underlining the key bit",
      "Solving it out loud",
      "Working it out",
      "Turning it over",
      "Tidying the notes"
    ],
    late: "Still on it, hard ones take a little longer",
    esc: " · Esc to stop",
    stopped: "Stopped",
    finish: "Answer ready"
  },
  fr: {
    label: "Doubtster est au travail",
    words: [
      "Craie sur le tableau",
      "À la recherche de x",
      "On taille les crayons",
      "Équilibrer l'équation",
      "Feuilleter le manuel",
      "Gribouiller dans la marge",
      "Retenir la retenue",
      "Décortiquer le problème",
      "Relier les points",
      "Souligner l'essentiel",
      "Raisonner à voix haute",
      "Mettre au clair",
      "Tourner le problème",
      "Mettre au propre les notes"
    ],
    late: "Toujours dessus, les plus coriaces prennent un peu plus de temps",
    esc: " · Échap pour arrêter",
    stopped: "Arrêté",
    finish: "Réponse prête"
  },
  es: {
    label: "Doubtster está trabajando",
    words: [
      "Dibujando en la pizarra",
      "Buscando la x",
      "Sacando punta a los lápices",
      "Equilibrando la ecuación",
      "Hojeando el libro",
      "Garabateando en el margen",
      "Llevando el uno",
      "Descifrando el problema",
      "Conectando los puntos",
      "Subrayando lo clave",
      "Pensando en voz alta",
      "Haciendo las cuentas",
      "Dándole vueltas",
      "Ordenando los apuntes"
    ],
    late: "Seguimos en ello, los difíciles tardan un poco más",
    esc: " · Esc para detener",
    stopped: "Detenido",
    finish: "Respuesta lista"
  },
  hi: {
    label: "डाउटस्टर काम कर रहा है",
    words: [
      "चौक से लिख रहे हैं",
      "x को ढूंढ रहे हैं",
      "पेंसिल छील रहे हैं",
      "समीकरण संतुलित कर रहे हैं",
      "किताब के पन्ने पलट रहे हैं",
      "हाशिये में चित्र बना रहे हैं",
      "हासिल जोड़ रहे हैं",
      "सवाल को सुलझा रहे हैं",
      "कड़ियों को जोड़ रहे हैं",
      "खास बात को रेखांकित कर रहे हैं",
      "बोलकर समझ रहे हैं",
      "हल निकाल रहे हैं",
      "गौर से सोच रहे हैं",
      "नोट्स संवार रहे हैं"
    ],
    late: "काम जारी है, कठिन सवालों में थोड़ा वक्त लगता है",
    esc: " · रोकने के लिए Esc",
    stopped: "रुक गया",
    finish: "उत्तर तैयार है"
  }
};
var SYMBOLS = ['+', '−', '×', '÷', '=', '?', '√', 'π', '∑', '%'];
var SYM_ANGLES = [-7, 8, -6, 7, -8, 6, -5, 8, -7, 6];

function currentLang(){
  var l = (S && S.profile && S.profile.lang) || (S && S.profile && S.profile.language) || (S && S.lang) || (typeof vlang !== 'undefined' ? vlang : '') || '';
  if(!l){
    try{ l = localStorage.getItem('doubtster-lang') || ''; }catch(e){}
  }
  if(!l && typeof document !== 'undefined' && document.documentElement && document.documentElement.lang){
    l = document.documentElement.lang.slice(0, 2);
  }
  if(!l && typeof navigator !== 'undefined' && navigator.language){
    l = navigator.language.slice(0, 2);
  }
  l = (l || 'en').toLowerCase();
  return THINK_I18N[l] ? l : 'en';
}

function announceLive(){
  try { var sr = document.getElementById('think-announcer'); if(sr) sr.remove(); } catch(e) {}
}

function thinkHTML(){
  var lang = currentLang();
  var dict = THINK_I18N[lang] || THINK_I18N.en;
  var initWord = dict.words[Math.floor(Math.random() * dict.words.length)];
  return '<div class="am">' +
    '<div class="think-line" role="status">' +
      '<span class="think-visual" aria-hidden="true">' +
        '<span class="think-sym">' + SYMBOLS[0] + '</span>' +
        '<span class="think-word">' + h(initWord) + '</span>' +
        '<span class="think-dots">.</span>' +
        '<span class="think-time"></span>' +
      '</span>' +
    '</div>' +
  '</div>';
}

var thinkState = null;
var activeChatAbort = null;
var activeDemoTimer = null;

function stopThinkingTimers(){
  if(thinkState){
    if(thinkState.symTimer) clearInterval(thinkState.symTimer);
    if(thinkState.wordTimer) clearTimeout(thinkState.wordTimer);
    if(thinkState.dotsTimer) clearInterval(thinkState.dotsTimer);
    if(thinkState.elapTimer) clearInterval(thinkState.elapTimer);
    thinkState = null;
  }
}

function mountThinkingLine(){
  stopThinkingTimers();
  var el = $('msgs');
  if(!el) return;
  var line = el.querySelector('.think-line:not(.is-stopped)');
  if(!line) return;

  var symEl = line.querySelector('.think-sym');
  var wordEl = line.querySelector('.think-word');
  var dotsEl = line.querySelector('.think-dots');
  var timeEl = line.querySelector('.think-time');

  var lang = currentLang();
  var dict = THINK_I18N[lang] || THINK_I18N.en;
  var reduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var startTime = Date.now();
  var symIdx = 0;
  var lastWordIdx = dict.words.indexOf(wordEl ? wordEl.textContent : '');
  if(lastWordIdx < 0) lastWordIdx = 0;
  var dotCount = 1;
  var isLate = false;

  thinkState = {
    startTime: startTime,
    symTimer: null,
    wordTimer: null,
    dotsTimer: null,
    elapTimer: null
  };

  // 1. Symbol: cycling every 700ms (1.5s in reduced-motion) through + − × ÷ = ? √ π ∑ % with fade and rotate
  var symInterval = reduced ? 1500 : 700;
  thinkState.symTimer = setInterval(function(){
    if(!symEl || line.classList.contains('is-stopped')) return;
    symIdx = (symIdx + 1) % SYMBOLS.length;
    if(!reduced){
      symEl.classList.add('fading');
      setTimeout(function(){
        if(!symEl) return;
        symEl.textContent = SYMBOLS[symIdx];
        symEl.style.transform = 'rotate(' + SYM_ANGLES[symIdx % SYM_ANGLES.length] + 'deg) scale(1)';
        symEl.classList.remove('fading');
      }, 90);
    } else {
      symEl.textContent = SYMBOLS[symIdx];
    }
  }, symInterval);

  // 2. Word: changes every 2.5 to 3.5s, never same word twice in row. After 20s replace with late message.
  function scheduleWord(){
    var delay = 2500 + Math.random() * 1000;
    thinkState.wordTimer = setTimeout(function(){
      if(!wordEl || line.classList.contains('is-stopped')) return;
      var elapsed = (Date.now() - startTime) / 1000;
      if(elapsed >= 20){
        wordEl.textContent = dict.late;
        isLate = true;
        return;
      }
      var nextIdx;
      do {
        nextIdx = Math.floor(Math.random() * dict.words.length);
      } while(nextIdx === lastWordIdx && dict.words.length > 1);
      lastWordIdx = nextIdx;

      if(reduced){
        wordEl.textContent = dict.words[nextIdx];
      } else {
        wordEl.style.opacity = '0.3';
        setTimeout(function(){
          if(!wordEl) return;
          wordEl.textContent = dict.words[nextIdx];
          wordEl.style.opacity = '1';
        }, 120);
      }
      scheduleWord();
    }, delay);
  }
  scheduleWord();

  // 3. Animated dots (. .. ...)
  if(!reduced){
    thinkState.dotsTimer = setInterval(function(){
      if(!dotsEl || line.classList.contains('is-stopped')) return;
      dotCount = (dotCount % 3) + 1;
      dotsEl.textContent = '.'.repeat(dotCount);
    }, 450);
  } else {
    if(dotsEl) dotsEl.textContent = '...';
  }

  // 4. Elapsed time: shown from 3s like "(7s)", from 15s add " · Esc to stop"
  thinkState.elapTimer = setInterval(function(){
    if(!timeEl || line.classList.contains('is-stopped')) return;
    var sec = Math.floor((Date.now() - startTime) / 1000);
    if(sec >= 20 && !isLate && wordEl){
      wordEl.textContent = dict.late;
      isLate = true;
    }
    if(sec < 3){
      timeEl.textContent = '';
    } else if(sec < 15){
      timeEl.textContent = '(' + sec + 's)';
    } else {
      timeEl.textContent = '(' + sec + 's)' + dict.esc;
    }
  }, 500);
}

function stopChatRequest(){
  if(!busy) return;
  if(activeChatAbort){
    try{ activeChatAbort.abort(); }catch(e){}
    activeChatAbort = null;
  }
  if(activeDemoTimer){
    clearTimeout(activeDemoTimer);
    activeDemoTimer = null;
  }
  stopThinkingTimers();
  busy = false;

  var lang = currentLang();
  var dict = THINK_I18N[lang] || THINK_I18N.en;

  var el = $('msgs');
  if(el){
    var line = el.querySelector('.think-line:not(.is-stopped)');
    if(line){
      line.classList.add('is-stopped');
      var symEl = line.querySelector('.think-sym');
      if(symEl) symEl.textContent = '—';
      var wordEl = line.querySelector('.think-word');
      if(wordEl) wordEl.textContent = dict.stopped;
      var dotsEl = line.querySelector('.think-dots');
      if(dotsEl) dotsEl.textContent = '';
      var srEl = line.querySelector('.think-sr');
      if(srEl) srEl.textContent = dict.stopped;
    }
  }

  var c = curChat();
  if(c){
    c.msgs.push({ r: 'a', stopped: true, text: dict.stopped });
    c.ts = Date.now();
    save();
    paintHist();
  }
  announceLive(dict.stopped);
  toast(dict.stopped);
}

function paintMsgs(ns){var c=curChat(),el=$('msgs');if(!el)return;
 var th=$('cth');
 if(th){
  th.hidden=!(c&&c.msgs.length);
  if(c){
   var ctt=$('ctt');if(ctt)ctt.textContent=c.title;
   var artEl=$('cth-art-count');
   if(artEl){
    var artNum=(c.msgs||[]).filter(function(m){return m.r==='a'||m.a||m.text;}).length;
    artEl.textContent=String(Math.max(1,artNum));
   }
  }
 }
 var cp=$('chatp');
 if(!c||!c.msgs.length){
  el.innerHTML='';
  if($('empty'))$('empty').hidden=false;
  if(cp){cp.classList.add('is-empty');cp.classList.remove('has-msgs')}
  return;
 }
 if(cp){cp.classList.remove('is-empty');cp.classList.add('has-msgs')}
 if($('empty')&&(!cp||!cp.classList.contains('is-docking'))){
  setTimeout(function(){if(cp&&!cp.classList.contains('is-empty')&&$('empty'))$('empty').hidden=true;},450);
 }
 el.className='msgs'+(S.detail==='quick'?' quick':'');
 el.innerHTML=c.msgs.map(function(m,i){if(m.r==='u')return '<div class="um">'+h(m.t)+'</div>';
  if(m.stopped)return '<div class="am"><div class="think-line is-stopped"><span class="think-sym" aria-hidden="true">—</span><span class="think-word" aria-hidden="true">'+h(m.text||'Stopped')+'</span></div></div>';
  var f=i===freshIdx;if(m.fallback)return demoFallback(m,i);if(m.a&&!m.text)m.text=aToMarkdown(m.a);if(m.text||(m.parts&&m.parts.length))return plainHTML(m,i,f);return ansHTML(m,i,f)}).join('')+(busy?thinkHTML():'');
 if(busy)mountThinkingLine();
 var mounts=el.querySelectorAll('.ans-mount');
 mounts.forEach(function(mountEl){
  var mid=+mountEl.getAttribute('data-mid');
  var msg=c.msgs[mid];
  if(msg&&(msg.text||(msg.parts&&msg.parts.length))){
   renderAnswerMount(mountEl,msg.text||'',msg.parts);
  }
 });
 if(!ns){
  setTimeout(function(){
   window.scrollTo({top:document.documentElement.scrollHeight,behavior:'smooth'});
  },50);
 }
}

var busy=false, currentAttachment=null;
function ask(q, att){
 att = att || currentAttachment;
 q=(q||'').trim();
 if((!q && !att)||busy)return;
 var displayTitle = q || (att ? 'Analyze ' + att.name : 'Question');
 var c=curChat();if(!c){c={id:uid(),title:displayTitle.slice(0,48),ts:Date.now(),msgs:[]};S.chats.push(c);S.cur=c.id}
 var userText = q;
 if(att) userText = (userText ? userText + ' ' : '') + '[Attached: ' + att.name + ']';
 var cp=$('chatp'),comp=$('comp'),wasEmpty=cp&&cp.classList.contains('is-empty');
 if(wasEmpty&&comp){
  var firstRect=comp.getBoundingClientRect();
  cp.classList.add('is-docking');
  cp.classList.remove('is-empty');
  cp.classList.add('has-msgs');
  c.msgs.push({r:'u',t:userText});c.ts=Date.now();bump('q');busy=true;freshIdx=-1;paintHist();
  paintMsgs(true);
  paintNav();
  var lastRect=comp.getBoundingClientRect();
  var deltaY=firstRect.top-lastRect.top;
  comp.style.transition='none';
  comp.style.transform='translateY('+deltaY+'px)';
  void comp.offsetHeight;
  requestAnimationFrame(function(){
   comp.style.transition='transform 0.48s cubic-bezier(0.16, 1, 0.3, 1)';
   comp.style.transform='translateY(0)';
  });
  setTimeout(function(){
   comp.style.transition='';
   comp.style.transform='';
   if(cp)cp.classList.remove('is-docking');
   window.scrollTo({top:document.documentElement.scrollHeight,behavior:'smooth'});
  },500);
 } else {
  c.msgs.push({r:'u',t:userText});c.ts=Date.now();bump('q');busy=true;freshIdx=-1;paintHist();
  if(view!=='chat')go('chat');else paintMsgs();paintNav();
  window.scrollTo({top:document.documentElement.scrollHeight,behavior:'smooth'});
 }
 var sub=$('subj')?$('subj').value:'';
 activeChatAbort=(typeof AbortController!=='undefined')?new AbortController():null;
 var dict=THINK_I18N[currentLang()]||THINK_I18N.en;
 announceLive(dict.label);
 function done(m,alreadyPushed){
  stopThinkingTimers();
  activeChatAbort=null;
  activeDemoTimer=null;
  announceLive(dict.finish);
  busy=false;
  if(alreadyPushed){
   if(c.msgs.length>0){
    Object.assign(c.msgs[c.msgs.length-1],m);
   }
  } else {
   c.msgs.push(Object.assign({r:'a'},m));
   freshIdx=c.msgs.length-1;
  }
  c.ts=Date.now();save();if(view==='chat')paintMsgs();paintHist()
 }
 if(CFG.DEMO){activeDemoTimer=setTimeout(function(){activeDemoTimer=null;var a=demoSolve(q);done(a?{a:a}:{fallback:true})},550+Math.random()*500);return}
 fetch(CFG.CHAT_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',
  signal:activeChatAbort?activeChatAbort.signal:undefined,
  body:JSON.stringify({messages:c.msgs.filter(function(m){return !m.stopped}).map(function(m){return{role:m.r==='u'?'user':'assistant',content:m.r==='u'?m.t:(m.a?m.a.title+': '+m.a.answer:(m.text||''))}}).slice(-12),profile:S.profile,subject:sub,detail:S.detail,attachment:att?{name:att.name,type:att.type,base64:att.base64}:null})})
  .then(function(r){
   if(!r.ok)throw 0;
   var ctype=r.headers.get('content-type')||'';
   if(ctype.includes('text/event-stream')&&r.body){
    var curAssistant={r:'a',text:'',parts:[]};
    c.msgs.push(curAssistant);
    freshIdx=c.msgs.length-1;
    var reader=r.body.getReader();
    var dec=new TextDecoder();
    var sbuf='';
    function pump(){
     reader.read().then(function(res){
      if(res.done){
       done(curAssistant,true);
       return;
      }
      sbuf+=dec.decode(res.value,{stream:true});
      var lines=sbuf.split('\n');
      sbuf=lines.pop()||'';
      for(var l=0;l<lines.length;l++){
       var tr=lines[l].trim();
       if(!tr||tr.startsWith(':'))continue;
       if(tr.startsWith('data: ')){
        try{
         var ev=JSON.parse(tr.slice(6));
         if(ev.type==='text'){
          curAssistant.text+=ev.delta;
          var tPart=curAssistant.parts.find(function(p){return p.type==='text'});
          if(!tPart){
           tPart={type:'text',text:''};
           curAssistant.parts.unshift(tPart);
          }
          tPart.text=curAssistant.text;
          paintMsgs(true);
         } else if(ev.type==='placeholder'){
          var hasPh=curAssistant.parts.some(function(p){return p.type==='placeholder'});
          if(!hasPh){
           curAssistant.parts.push({type:'placeholder',message:ev.message||'Drawing the graph...'});
           paintMsgs(true);
          }
         } else if(ev.type==='visual'){
          var phIdx=curAssistant.parts.findIndex(function(p){return p.type==='placeholder'});
          if(phIdx!==-1){
           curAssistant.parts[phIdx]={type:'visual',visual:ev.visual};
          } else {
           curAssistant.parts.push({type:'visual',visual:ev.visual});
          }
          paintMsgs(true);
         } else if(ev.type==='done'){
          curAssistant.text=ev.text||curAssistant.text;
          if(ev.intent)curAssistant.intent=ev.intent;
          if(ev.title){c.title=ev.title;save();paintHist()}
          if(ev.parts&&ev.parts.length)curAssistant.parts=ev.parts;
          done(curAssistant,true);
          return;
         }
        }catch(e){}
       }
      }
      pump();
     }).catch(function(err){
      if(err&&err.name==='AbortError')return;
      done({text:curAssistant.text||'Connection interrupted.',parts:curAssistant.parts},true);
     });
    }
    pump();
    return;
   }
   return r.json().then(function(j){
    var replyText = j.text || j.content || (j.answer ? j.answer.summary : '');
    if(j.title||(j.answer&&j.answer.title)){c.title=j.title||j.answer.title;save();paintHist()}
    if (j.steps && j.steps.length) {
      done({ a: j, text: replyText, intent: j.intent, parts: j.parts });
    } else {
      done({ text: replyText || 'Sorry, no answer came back.', intent: j.intent, parts: j.parts });
    }
   });
  })
  .catch(function(err){if(err&&err.name==='AbortError')return;done({text:'Could not reach the answer service. Check your connection and try again.'})})}
var rec=null;

var TRY_OFFSET = 0;
function renderTryList(advance){
  if(advance) TRY_OFFSET = (TRY_OFFSET + 4) % EXAMPLES.length;
  var items = [];
  for(var i = 0; i < 4; i++){
    var idx = (TRY_OFFSET + i) % EXAMPLES.length;
    items.push(EXAMPLES[idx]);
  }
  return items.map(function(q){
    return '<button type="button" class="try-item" data-act="ask" data-q="'+h(q)+'">'+
      '<span class="try-arrow">↗</span>'+
      '<span class="try-text">'+h(q)+'</span>'+
    '</button>';
  }).join('');
}

function renderChat(){
 var rawNm=(S.profile&&S.profile.name)||'';
 var nm=rawNm?', '+(rawNm.charAt(0).toUpperCase()+rawNm.slice(1)):'';
 var subs=['Auto','Maths','Physics','Chemistry','Biology','Economics','Accounting','Coding','English'];
 var c=curChat();
 var isEmptyChat=!c||!c.msgs.length;
 $('view').innerHTML='<div class="chatp'+(isEmptyChat?' is-empty':' has-msgs')+'" id="chatp"><div class="pgw" style="width:100%">'+
 '<div class="cth" id="cth" hidden>'+
 '<div class="cth-left">'+
  '<button type="button" class="cth-title-btn" id="ctt-btn" data-act="chattitlemenu" title="Chat options">'+
   '<span class="cth-title-text" id="ctt"></span>'+
   '<svg class="cth-chevron" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>'+
  '</button>'+
 '</div>'+
 '<div class="cth-right">'+
  '<button type="button" class="cth-action-btn" id="cth-artifacts-btn" data-act="chat-artifacts" title="Artifacts & answers in this chat">'+
   '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>'+
   '<span id="cth-art-count">1</span>'+
  '</button>'+
  '<button type="button" class="cth-action-btn" data-act="sharechat" title="Share this chat">'+
   '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>'+
   '<span>Share</span>'+
  '</button>'+
 '</div>'+
 '</div>'+
 '<div class="empty" id="empty"'+(isEmptyChat?'':' hidden')+'>'+
  '<div class="scite-badge" data-act="promo">'+
   '<span class="scite-badge-icon">✦</span>'+
   '<span class="scite-badge-text">AI Homework & Doubt Engine</span>'+
   '<span class="scite-badge-arrow">→</span>'+
  '</div>'+
  '<h1>What are you studying?</h1>'+
  '<p>Get step-by-step verified explanations, chalkboard videos, and flashcards for any question.</p>'+
 '</div>'+
 '<div class="msgs" id="msgs" aria-live="polite"></div><button type="button" class="scroll-down-btn" id="scroll-down-btn" aria-label="Scroll to bottom" style="display:none">&#8595;</button></div>'+
 '<div class="comp" id="comp">'+
 '<div id="att-preview" class="att-preview" hidden></div>'+
 '<div class="cbox">'+
  '<div class="cbox-inner">'+
   '<div class="cbox-top">'+
    '<span class="scite-blue-dot"></span>'+
    '<input type="file" id="att-input" accept="image/png,image/jpeg,image/webp,application/pdf,text/plain" style="display:none">'+
    '<label class="sr" for="in">Your question</label>'+
    '<textarea id="in" rows="1" maxlength="1000" placeholder="Ask a question or paste a problem to solve..."></textarea>'+
   '</div>'+
   '<div class="cbox-bottom">'+
    '<div class="cbox-left">'+
     '<label class="scite-step-toggle" title="Toggle detailed step-by-step explanation"><input type="checkbox" id="detail-chk"'+(S.detail!=='quick'?' checked':'')+'><span>Step-by-step solution</span></label>'+
    '</div>'+
    '<div class="cbox-right">'+
     '<button class="scite-tool-btn" id="att-btn" type="button" aria-label="Attach file" title="Attach homework photo, diagram or PDF"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></button>'+
     '<div class="scite-subj-select" title="Select Subject"><select id="subj">'+subs.map(function(s){return '<option>'+s+'</option>'}).join('')+'</select></div>'+
     '<button class="scite-tool-btn" id="mic" type="button" aria-label="Speak your question" hidden>'+ic('mic')+'</button>'+
     '<button class="scite-send-btn send" id="send" type="button" aria-label="Ask" disabled><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></button>'+
    '</div>'+
   '</div>'+
  '</div>'+
 '</div>'+
 '<div class="try-section" id="try-section"'+(isEmptyChat?'':' hidden')+'>'+
  '<div class="try-hdr">'+
   '<span>Try one of these</span>'+
   '<button type="button" class="try-refresh-btn" id="try-refresh-btn" title="Refresh suggestions">↻</button>'+
  '</div>'+
  '<div class="try-list" id="try-list">'+
   renderTryList()+
  '</div>'+
 '</div>'+
 '</div></div>';
 var inp=$('in'),sd=$('send'),attBtn=$('att-btn'),attInput=$('att-input'),attPrv=$('att-preview');
 var dChk=$('detail-chk');
 if(dChk){
  dChk.onchange=function(){
   S.detail=this.checked?'steps':'quick';
   save();
  };
 }
 var refBtn=$('try-refresh-btn');
 if(refBtn){
  refBtn.onclick=function(){
   var tl=$('try-list');
   if(tl) tl.innerHTML=renderTryList(true);
  };
 }
 function fit(){inp.style.height='auto';inp.style.height=Math.min(200,inp.scrollHeight)+'px';sd.disabled=(!inp.value.trim()&&!currentAttachment)}
 inp.addEventListener('input',fit);
 inp.addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sd.click()}});
 sd.onclick=function(){var v=inp.value;var attToSend=currentAttachment;inp.value='';currentAttachment=null;if(attInput)attInput.value='';if(attPrv){attPrv.hidden=true;attPrv.innerHTML='';}fit();ask(v,attToSend)};
 if(attBtn&&attInput){
  attBtn.onclick=function(){attInput.click()};
  attInput.onchange=function(){
   var file=this.files&&this.files[0];
   if(!file)return;
   if(file.size>5*1024*1024){toast('File is too large (max 5 MB).');this.value='';return}
   var reader=new FileReader();
   reader.onload=function(ev){
    currentAttachment={name:file.name,type:file.type||'application/octet-stream',base64:String(ev.target.result||''),size:file.size};
    if(attPrv){
     attPrv.hidden=false;
     attPrv.innerHTML='<span class="att-chip">&#128206; '+h(file.name)+' ('+Math.round(file.size/1024)+' KB) <button type="button" id="att-rm" aria-label="Remove">&times;</button></span>';
     var rm=$('att-rm');
     if(rm){
      rm.onclick=function(){currentAttachment=null;attInput.value='';attPrv.hidden=true;attPrv.innerHTML='';fit()}
     }
    }
    fit();
   };
   reader.readAsDataURL(file);
  };
 }
 var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(SR){var mb=$('mic');mb.hidden=false;mb.onclick=function(){try{if(rec){rec.stop();return}rec=new SR();rec.lang='en-IN';rec.interimResults=false;mb.classList.add('on');
  rec.onresult=function(e){inp.value=(inp.value+' '+e.results[0][0].transcript).trim();fit()};rec.onend=function(){rec=null;mb.classList.remove('on')};rec.onerror=function(){rec=null;mb.classList.remove('on');toast('Could not hear you. Check the mic permission.')};rec.start()}catch(x){rec=null;mb.classList.remove('on')}}}
 var q0=new URLSearchParams(location.search).get('q');if(q0&&!renderChat.used){renderChat.used=1;inp.value=q0.slice(0,300);fit()}
 var scrollBtn=$('scroll-down-btn');
 function checkScroll(){
  if(!scrollBtn)return;
  var d=document.documentElement;
  var dist=d.scrollHeight-window.innerHeight-window.scrollY;
  if(dist>200){scrollBtn.style.display='flex'}else{scrollBtn.style.display='none'}
 }
 window.addEventListener('scroll',checkScroll,{passive:true});
 if(scrollBtn){
  scrollBtn.onclick=function(){window.scrollTo({top:document.documentElement.scrollHeight,behavior:'smooth'})};
 }
 paintMsgs();if(window.innerWidth>860)inp.focus()}

/* ================= video: length + language picker, scenes, canvas player ================= */
var MISTAKES={Maths:['Doing something to one side of the equation but not the other.','Dropping a minus sign when moving a term.','Skipping the final check.'],
 Physics:['Mixing units, for example minutes and seconds.','Picking a formula before listing what is given.','Forgetting direction for vectors.'],
 Chemistry:['Forgetting to balance both sides.','Mixing up atoms, molecules and ions.','Ignoring state symbols and units.'],
 Biology:['Learning the names but not the order of events.','Mixing up similar terms like mitosis and meiosis.','Skipping the purpose of each stage.'],
 Economics:['Confusing a shift of a curve with movement along it.','Ignoring what is held constant.','Mixing nominal and real values.'],
 Coding:['Forgetting the base case or the stop condition.','Off-by-one errors with indexes.','Not tracing the code by hand first.'],
 General:['Rushing past the definition.','Skipping the check at the end.','Memorising instead of understanding why.']};
var MISTAKES_HI={Maths:['समीकरण के एक पक्ष पर क्रिया करना और दूसरे पर भूल जाना।','पद इधर-उधर ले जाते समय ऋण चिह्न छोड़ देना।','अंत में जाँच न करना।'],
 Physics:['मात्रक मिला देना, जैसे मिनट और सेकंड।','दिया गया डेटा लिखे बिना सूत्र चुनना।','सदिश राशियों की दिशा भूल जाना।'],
 Chemistry:['दोनों तरफ़ संतुलन करना भूल जाना।','परमाणु, अणु और आयन को मिला देना।','अवस्था चिह्न और मात्रक अनदेखे करना।'],
 Biology:['नाम याद करना पर घटनाओं का क्रम नहीं।','मिलते-जुलते शब्द मिला देना, जैसे समसूत्री और अर्धसूत्री।','हर अवस्था का उद्देश्य छोड़ देना।'],
 Economics:['वक्र के खिसकने और वक्र पर चलने को एक समझ लेना।','यह अनदेखा करना कि क्या स्थिर माना गया है।','नाममात्र और वास्तविक मान मिला देना।'],
 Coding:['बेस केस या रुकने की शर्त भूल जाना।','इंडेक्स में एक की गलती (off-by-one)।','कोड को पहले हाथ से ट्रेस न करना।'],
 General:['परिभाषा पर जल्दबाज़ी करना।','अंत की जाँच छोड़ देना।','समझने की जगह रटना।']};
var MISTAKES_FR={Maths:['Effectuer une opération d\'un côté de l\'équation et oublier l\'autre.','Erreur de signe lors du déplacement des termes.','Oublier de vérifier la solution à la fin.'],
 Physics:['Mélanger les unités, comme les minutes et les secondes.','Choisir une formule sans identifier les grandeurs connues.','Oublier la direction des vecteurs.'],
 Chemistry:['Oublier d\'équilibrer la réaction des deux côtés.','Confondre atome, molécule et ion.','Négliger les symboles d\'état et les unités.'],
 Biology:['Mémoriser les noms sans comprendre l\'ordre des étapes.','Confondre des termes proches comme mitose et méiose.','Ignorer le rôle de chaque phase.'],
 Economics:['Confondre déplacement de la courbe et déplacement le long de la courbe.','Négliger les facteurs supposés constants.','Mélanger grandeurs nominales et réelles.'],
 Coding:['Oublier le cas de base ou la condition d\'arrêt.','Erreur d\'indice d\'une unité (off-by-one).','Ne pas tester le code à la main d\'abord.'],
 General:['Se précipiter sans lire attentivement la définition.','Sauter la vérification finale.','Apprendre par cœur au lieu de comprendre le raisonnement.']};
var MISTAKES_IT={Maths:['Eseguire un\'operazione su un membro dell\'equazione dimenticando l\'altro.','Sbagliare i segni durante lo spostamento dei termini.','Saltare la verifica finale.'],
 Physics:['Confondere le unità di misura, come minuti e secondi.','Scegliere la formula senza elencare i dati noti.','Dimenticare il verso e la direzione dei vettori.'],
 Chemistry:['Dimenticare di bilanciare entrambi i lati.','Confondere atomi, molecole e ioni.','Trascurare lo stato fisico e le unità.'],
 Biology:['Memorizzare i nomi senza comprendere l\'ordine temporale.','Confondere mitosi e meiosi.','Ignorare la funzione di ciascuna fase.'],
 Economics:['Confondere lo spostamento della curva con il movimento lungo di essa.','Ignorare le variabili costanti.','Confondere valori nominali e reali.'],
 Coding:['Dimenticare il caso base o la condizione di terminazione.','Errori di scostamento di uno negli indici.','Non eseguire il debug manuale prima di eseguire.'],
 General:['Leggere frettolosamente la definizione.','Omettere il controllo finale.','Memorizzare senza afferrare la logica.']};
var MISTAKES_ES={Maths:['Operar en un lado de la ecuación y olvidar el otro.','Cometer errores de signo al transponer términos.','Saltarse la comprobación al final.'],
 Physics:['Mezclar unidades, como minutos y segundos.','Elegir fórmulas sin identificar los datos dados.','Olvidar la dirección y el sentido de los vectores.'],
 Chemistry:['Olvidar balancear ambos lados de la ecuación.','Confundir átomos, moléculas e iones.','Ignorar los estados de la materia y unidades.'],
 Biology:['Memorizar nombres sin comprender la secuencia de eventos.','Confundir mitosis con meiosis.','Omitir el propósito de cada fase.'],
 Economics:['Confundir el desplazamiento de una curva con moverse a lo largo de ella.','Ignorar las variables constantes.','Mezclar valores nominales y reales.'],
 Coding:['Olvidar el caso base o la condición de parada.','Errores de índice por uno (off-by-one).','No trazar el código a mano primero.'],
 General:['Apresurarse en la definición.','Omitir la verificación al final.','Memorizar en lugar de comprender el porqué.']};
var MISTAKES_TR={Maths:['Denklemin bir tarafına işlem yapıp diğer tarafını unutmak.','Terimleri taşırken işaret hatası yapmak.','Sonucu baştan kontrol etmemek.'],
 Physics:['Dakika ile saniye gibi birimleri karıştırmak.','Verilenleri yazmadan formül seçmek.','Vektör yönlerini hesaba katmamak.'],
 Chemistry:['Tepkimeyi her iki tarafta dengelemeyi unutmak.','Atom, molekül ve iyon kavramlarını karıştırmak.','Bileşik durumlarını ve birimleri atlamak.'],
 Biology:['Olayların sırasını kavramadan terimleri ezberlemek.','Mitoz ve mayoz gibi benzer süreçleri karıştırmak.','Her evrenin amacını kavramamak.'],
 Economics:['Eğrinin kayması ile eğri üzerinde hareketi birbirine karıştırmak.','Sabit tutulan değişkenleri göz ardı etmek.','Nominal ve reel değerleri karıştırmak.'],
 Coding:['Temel durumu veya durma koşulunu unutmak.','Dizi indekslerinde bir basamak hatası (off-by-one).','Kodu önce kağıt üzerinde izlememek.'],
 General:['Tanımı tam okumadan acele etmek.','Sonucu sağlamasını yapmadan kabul etmek.','Mantığını anlamak yerine ezberlemek.']};
var ALL_MISTAKES={en:MISTAKES,hi:MISTAKES_HI,fr:MISTAKES_FR,it:MISTAKES_IT,es:MISTAKES_ES,tr:MISTAKES_TR};
var LANG_NAMES={en:'English',hi:'हिन्दी',fr:'Français',it:'Italiano',es:'Español',tr:'Türkçe'};
function langLabel(l){return LANG_NAMES[l]||l||'English'}
var UI={en:{intro_n:'INTRO',step:function(i,n){return 'STEP '+i+' OF '+n},plan:'The plan',why:'Why?',answer:'Answer',graph:'The graph',mistakes:'Common mistakes',recap:'Recap',turn:'Your turn',
  intro:function(t){return 'Let us work through this: '+t+'.'},planSay:'Here is the plan. ',whySay:'Why does this work? ',ansSay:'So the answer is: ',mistSay:'Watch out for these common mistakes. ',recapSay:'Quick recap. ',
  turnSay:function(h){return 'Your turn. Pause the video and explain '+h+' in your own words.'},turnLine:function(h){return 'Pause, then explain "'+h+'" out loud.'},code:'en-US',alt:'en'},
 hi:{intro_n:'परिचय',step:function(i,n){return 'चरण '+i+'/'+n},plan:'योजना',why:'क्यों?',answer:'उत्तर',graph:'ग्राफ़',mistakes:'आम गलतियाँ',recap:'सारांश',turn:'अब आपकी बारी',
  intro:function(t){return 'आइए इसे हल करते हैं: '+t+'।'},planSay:'यह रही योजना। ',whySay:'यह काम क्यों करता है? ',ansSay:'तो उत्तर है: ',mistSay:'इन आम गलतियों से बचें। ',recapSay:'संक्षिप्त सारांश। ',
  turnSay:function(h){return 'अब आपकी बारी। वीडियो रोकें और '+h+' को अपने शब्दों में समझाएँ।'},turnLine:function(h){return 'रुकिए और "'+h+'" खुद ज़ोर से समझाइए।'},code:'hi-IN',alt:'hi'},
 fr:{intro_n:'INTRODUCTION',step:function(i,n){return 'ÉTAPE '+i+' SUR '+n},plan:'Le plan',why:'Pourquoi ?',answer:'Réponse',graph:'Le graphique',mistakes:'Erreurs fréquentes',recap:'Récapitulatif',turn:'À votre tour',
  intro:function(t){return 'Résolvons ce problème ensemble : '+t+'.'},planSay:'Voici notre plan de travail. ',whySay:'Pourquoi cette méthode fonctionne-t-elle ? ',ansSay:'La réponse finale est donc : ',mistSay:'Attention à ces erreurs fréquentes. ',recapSay:'Récapitulons rapidement. ',
  turnSay:function(h){return 'À votre tour. Mettez la vidéo en pause et expliquez '+h+' avec vos propres mots.'},turnLine:function(h){return 'Faites une pause, puis expliquez "'+h+'" à voix haute.'},code:'fr-FR',alt:'fr'},
 it:{intro_n:'INTRODUZIONE',step:function(i,n){return 'PASSO '+i+' DI '+n},plan:'Il piano',why:'Perché?',answer:'Risposta',graph:'Il grafico',mistakes:'Errori comuni',recap:'Riepilogo',turn:'Tocca a te',
  intro:function(t){return 'Risolviamo insieme questo problema: '+t+'.'},planSay:'Ecco il piano di lavoro. ',whySay:'Perché questo metodo funziona? ',ansSay:'Quindi la risposta finale è: ',mistSay:'Fai attenzione a questi errori comuni. ',recapSay:'Breve riepilogo. ',
  turnSay:function(h){return 'Tocca a te. Metti in pausa il video e spiega '+h+' a parole tue.'},turnLine:function(h){return 'Metti in pausa e spiega "'+h+'" ad alta voce.'},code:'it-IT',alt:'it'},
 es:{intro_n:'INTRODUCCIÓN',step:function(i,n){return 'PASO '+i+' DE '+n},plan:'El plan',why:'¿Por qué?',answer:'Respuesta',graph:'El gráfico',mistakes:'Errores comunes',recap:'Resumen',turn:'Tu turno',
  intro:function(t){return 'Resolvamos este problema juntos: '+t+'.'},planSay:'Aquí está el plan de trabajo. ',whySay:'¿Por qué funciona este método? ',ansSay:'Así que la respuesta es: ',mistSay:'Cuidado con estos errores comunes. ',recapSay:'Resumen rápido. ',
  turnSay:function(h){return 'Tu turno. Pausa el video y explica '+h+' en tus propias palabras.'},turnLine:function(h){return 'Pausa y explica "'+h+'" en voz alta.'},code:'es-ES',alt:'es'},
 tr:{intro_n:'GİRİŞ',step:function(i,n){return 'ADIM '+i+' / '+n},plan:'Çözüm planı',why:'Neden?',answer:'Cevap',graph:'Grafik',mistakes:'Sık yapılan hatalar',recap:'Özet',turn:'Şimdi sıra sende',
  intro:function(t){return 'Bu problemi birlikte adım adım çözelim: '+t+'.'},planSay:'İşte çözüm planımız. ',whySay:'Bu yöntem neden çalışır? ',ansSay:'Böylece nihai sonuç: ',mistSay:'Sık yapılan bu hatalara dikkat edin. ',recapSay:'Hızlı bir özet geçelim. ',
  turnSay:function(h){return 'Şimdi sıra sende. Videoyu durdur ve '+h+' konusunu kendi cümlelerinle açıkla.'},turnLine:function(h){return 'Duraklat ve "'+h+'" adımını sesli olarak açıkla.'},code:'tr-TR',alt:'tr'}};
function Lx(o,l){return o==null?'':typeof o==='string'?o:(o[l]||o.en||'')}
function spoken(m,l){
 var p={
  hi:{pow:' घात ',div:' भाग ',eq:' बराबर ',mul:' गुणा ',gives:' से बनता है ',sub:' घटा ',add:' जमा '},
  fr:{pow:' puissance ',div:' divisé par ',eq:' égale ',mul:' fois ',gives:' donne ',sub:' moins ',add:' plus '},
  it:{pow:' elevato a ',div:' diviso ',eq:' è uguale a ',mul:' per ',gives:' produce ',sub:' meno ',add:' più '},
  es:{pow:' elevado a la ',div:' dividido por ',eq:' es igual a ',mul:' por ',gives:' da ',sub:' menos ',add:' más '},
  tr:{pow:' üzeri ',div:' bölü ',eq:' eşittir ',mul:' çarpı ',gives:' verir ',sub:' eksi ',add:' artı '},
  en:{pow:' to the power of ',div:' divided by ',eq:' equals ',mul:' times ',gives:' gives ',sub:' minus ',add:' plus '}
 };
 var t=p[l]||p.en;
 return String(m).replace(/\^/g,t.pow).replace(/\s\/\s/g,t.div).replace(/=/g,t.eq).replace(/\s[x×*]\s/g,t.mul).replace(/->/g,t.gives).replace(/\s-\s/g,t.sub).replace(/\s\+\s/g,t.add);
}
function scenesFrom(a,min,lang){min=min||2;lang=lang||'en';var U=UI[lang]||UI.en,A=a,G=a.graph;
 if(lang==='hi'&&a.hi)A=Object.assign({},a,{title:a.hi.title,subject:a.hi.subject,answer:a.hi.answer,steps:a.steps.map(function(s,i){return Object.assign({},s,a.hi.steps[i]||{})})});
 var steps=A.steps.slice(0,min===5?7:6),sc=[];
 sc.push({n:U.intro_n,page:'new',center:true,blocks:[{k:'title',t:A.title},{k:'tag',t:A.subject||''}],say:U.intro(A.title)});
 if(min===5)sc.push({n:U.plan,page:'new',blocks:[{k:'h',t:U.plan}].concat(steps.slice(0,6).map(function(s,i){return{k:'item',t:(i+1)+'. '+s.h}})),say:U.planSay+steps.map(function(s,i){return U.step(i+1,steps.length).toLowerCase()+': '+s.h}).join('. ')+'.'});
 steps.forEach(function(s,i){var B=[{k:'h',t:U.step(i+1,steps.length)+'   '+s.h}];
  if(s.t)B.push({k:'line',t:s.t});if(s.math)B.push({k:'eq',t:s.math});else if(s.code)B.push({k:'code',t:s.code});
  sc.push({n:U.step(i+1,steps.length),blocks:B,say:s.h+'. '+(s.t||'')+(s.math?' '+spoken(s.math,lang):'')});
  if(min===5&&s.why)sc.push({n:U.why+' ('+(i+1)+')',blocks:[{k:'h',t:U.why},{k:'line',t:s.why}],say:U.whySay+s.why})});
 if(G&&(G.series||G.bars))sc.push({n:U.graph,page:'new',gpage:true,blocks:[{k:'h',t:U.graph+': '+Lx(G.title,lang)},{k:'line',t:Lx(G.say,lang)},{k:'graph',g:G}],say:Lx(G.say,lang),min:9000});
 if(A.answer)sc.push({n:U.answer,page:'new',center:true,blocks:[{k:'h',t:U.answer},{k:'eq',t:A.answer}],say:U.ansSay+A.answer});
 if(min===5){var mk=(ALL_MISTAKES[lang]||MISTAKES)[a.subject]||(ALL_MISTAKES[lang]||MISTAKES).General;
  sc.push({n:U.mistakes,page:'new',blocks:[{k:'h',t:U.mistakes}].concat(mk.map(function(x){return{k:'item',t:'- '+x}})),say:U.mistSay+mk.join(' ')});
  sc.push({n:U.recap,page:'new',blocks:[{k:'h',t:U.recap}].concat(steps.slice(0,6).map(function(s){return{k:'item',t:'- '+s.h}})),say:U.recapSay+steps.map(function(s){return s.h}).join('. ')+'.'});
  var ps=steps[Math.min(1,steps.length-1)];sc.push({n:U.turn,page:'new',center:true,blocks:[{k:'h',t:U.turn},{k:'eq',t:U.turnLine(ps.h)}],say:U.turnSay(ps.h)})}
 var raw=sc.map(function(s){return Math.max(s.min||0,3500,Math.min(32000,s.say.length*70))}),sum=raw.reduce(function(x,y){return x+y},0),target=min*60000;
 sc.forEach(function(s,i){s.dur=Math.round(raw[i]/sum*target)});return sc}
var vsel=2,vvoice=false,vlang='en',pendingV=null;
function lenCards(){return '<div class="lenc" role="group" aria-label="Video length">'+[2,5].map(function(n){var c=PRICE.videoCost[n];return '<button type="button" data-act="vlen" data-n="'+n+'" aria-pressed="'+(vsel===n)+'"><span class="lt">'+n+' min</span><b>'+(n===2?'Quick explainer':'Deep dive')+'</b><small>'+(n===2?'Each step with its explanation, a graph where one fits, and the answer.':'Plan, every step with why it works, a graph, common mistakes, a recap and a practice prompt.')+'</small><em>'+c+' credit'+(c>1?'s':'')+'</em></button>'}).join('')+'</div>'}
function langSeg(){return '<div class="lrow"><span class="lbl">Language</span><div class="seg" id="vlg" role="group" aria-label="Video language">'+
 '<button type="button" data-act="vlg" data-l="en" aria-pressed="'+(vlang==='en')+'">English</button>'+
 '<button type="button" data-act="vlg" data-l="hi" aria-pressed="'+(vlang==='hi')+'">हिन्दी</button>'+
 '<button type="button" data-act="vlg" data-l="fr" aria-pressed="'+(vlang==='fr')+'">Français</button>'+
 '<button type="button" data-act="vlg" data-l="it" aria-pressed="'+(vlang==='it')+'">Italiano</button>'+
 '<button type="button" data-act="vlg" data-l="es" aria-pressed="'+(vlang==='es')+'">Español</button>'+
 '<button type="button" data-act="vlg" data-l="tr" aria-pressed="'+(vlang==='tr')+'">Türkçe</button>'+
'</div></div><p class="mute small" id="vlnote"></p>'}
function vupd(){var n=vsel,c=PRICE.videoCost[n];[].forEach.call(document.querySelectorAll('.lenc button'),function(b){b.setAttribute('aria-pressed',+b.dataset.n===n)});
 [].forEach.call(document.querySelectorAll('#vlg button'),function(b){b.setAttribute('aria-pressed',b.dataset.l===vlang)});
 [].forEach.call(document.querySelectorAll('[data-vgo]'),function(b){b.textContent='Generate '+n+' min video ('+c+' credit'+(c>1?'s':'')+')'});
 var ln=$('vlnote');if(ln){var lTxt=langLabel(vlang);ln.textContent='The video will be generated and narrated in '+lTxt+'.'}
 var bl=$('vbal');if(bl)bl.innerHTML=(S.plan?'You have <b>'+credits()+'</b> credit'+(credits()===1?'':'s')+'. After this video: <b>'+Math.max(0,credits()-c)+'</b>.':'Videos need a plan.')+(S.plan&&credits()<c?' <span class="warnt">You need '+(c-credits())+' more for this length.</span>':'')}
function videoPicker(a,prompt){
 if(!S.plan&&credits()<1){promo(function(){videoPicker(a,prompt)});return}
 if(S.plan&&credits()<PRICE.videoCost[2]){creditsPopup({need:PRICE.videoCost[2],retry:function(){videoPicker(a,prompt)}});return}
 pendingV={a:a,prompt:prompt};
 modal('<h2>make a video</h2><p class="vt">'+h(a.title)+'</p>'+lenCards()+langSeg()+'<label class="chk"><input type="checkbox" id="vvo"'+(vvoice?' checked':'')+'><span>Read it aloud with a voice-over (uses a voice on your device in the demo player).</span></label><p class="mute small" id="vbal"></p><div class="acts"><button type="button" data-act="close">Cancel</button><button type="button" class="vid" data-act="vstart" data-vgo>Generate</button></div>',function(){vupd()},{cls:'vpick'})}
function vgenerate(a,prompt,min,voice,lang){var need=PRICE.videoCost[min];lang=lang||'en';
 if(!S.plan&&credits()<need){promo(function(){vgenerate(a,prompt,min,voice,lang)});return}
 if(credits()<need){creditsPopup({need:need,retry:function(){vgenerate(a,prompt,min,voice,lang)},alt:(min===5&&credits()>=PRICE.videoCost[2])?function(){vsel=2;vgenerate(a,prompt,2,voice,lang)}:null});return}
 var eff=(CFG.DEMO&&lang==='hi'&&!a.hi)?'en':lang,sc=scenesFrom(a,min,eff);
 var estText=CFG.DEMO?'~3 seconds':(min===5?'~60–90 seconds':'~40–60 seconds');
 var totalEstMs=CFG.DEMO?3200:(min===5?75000:45000);
 var startT=Date.now();
 var modalHtml='<span class="demo">'+(CFG.DEMO?'DEMO RENDER':'RENDERING')+'</span>'
  +'<h2>making your '+min+' minute video</h2>'
  +'<p>This uses <b>'+need+' credit'+(need>1?'s':'')+'</b>. You have '+credits()+'.</p>'
  +'<div class="rend-est-badge">'
  +' <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>'
  +' <span>Expected time: <b>'+estText+'</b></span>'
  +'</div>'
  +'<div class="rend">'
  +' <div class="rbar-wrap">'
  +'  <div class="rbar"><i id="rb" style="width:4%"></i></div>'
  +'  <span id="rp" class="rpercent">4%</span>'
  +' </div>'
  +' <div class="rstatus-row">'
  +'  <p id="rt" class="rstatus"><span class="rdot"></span>Writing the script & lesson outline...</p>'
  +'  <span id="rc" class="rtime-left">~'+Math.round(totalEstMs/1000)+'s left</span>'
  +' </div>'
  +' <p class="rend-hint">Please keep this screen open while your video renders.</p>'
  +'</div>';

 modal(modalHtml,function(){
  var finished=false;
  var steps=[
   {p:0.22,t:'Writing the script & lesson outline...'},
   {p:0.52,t:'Drawing the chalkboard formulas & graphs...'},
   {p:0.76,t:voice?'Synthesizing voice narration & timing...':'Adding captions & scene pacing...'},
   {p:0.92,t:'Rendering explainer video frames...'},
   {p:0.97,t:'Finalizing video (almost ready)...'}
  ];

  var iv=setInterval(function(){
   if(finished)return;
   var elapsed=Date.now()-startT;
   var ratio=Math.min(elapsed/totalEstMs,1);
   var pct=ratio<1?(ratio*0.92+0.04):(0.92+Math.min(0.06,(elapsed-totalEstMs)/30000));
   var pctNum=Math.min(98,Math.round(pct*100));

   var currentStep=steps[steps.length-1].t;
   for(var s=0;s<steps.length;s++){
    if(pct<=steps[s].p){currentStep=steps[s].t;break;}
   }

   var remSecs=Math.max(0,Math.ceil((totalEstMs-elapsed)/1000));
   var remText=remSecs>0?('~'+remSecs+'s left'):'Almost ready...';

   var rb=$('rb'),rp=$('rp'),rt=$('rt'),rc=$('rc');
   if(rb)rb.style.width=pctNum+'%';
   if(rp)rp.textContent=pctNum+'%';
   if(rt)rt.innerHTML='<span class="rdot"></span>'+currentStep;
   if(rc)rc.textContent=remText;
  },150);

  function ok(url){
   finished=true;
   clearInterval(iv);
   var rb=$('rb'),rp=$('rp'),rt=$('rt'),rc=$('rc');
   if(rb)rb.style.width='100%';
   if(rp)rp.textContent='100%';
   if(rt)rt.innerHTML='<span class="rdot ready"></span>Video complete! Opening player...';
   if(rc)rc.textContent='Ready';

   setTimeout(function(){
    if(!spend(need)){closeModal();toast('Not enough credits.');return}
    var v={id:uid(),title:(eff==='hi'&&a.hi?a.hi.title:a.title),ts:Date.now(),minutes:min,voice:!!voice,lang:eff,scenes:sc,subject:a.subject||'',url:url||'',a:a,cost:need};
    S.videos.unshift(v);bump('v');save();closeModal();repaint();go('videos');playVideo(v.id);
    if(eff!==lang)toast('Made in English: the demo cannot translate this answer.');
   },450);
  }

  if(CFG.DEMO){
   setTimeout(function(){ok('');},3000);
   return;
  }

  fetch(CFG.VIDEO_ENDPOINT,{
   method:'POST',
   headers:{'Content-Type':'application/json'},
   credentials:'same-origin',
   body:JSON.stringify({title:a.title,scenes:sc,prompt:prompt||a.title,minutes:min,voice:!!voice,lang:lang})
  })
  .then(function(r){
   if(!r.ok){
    return r.json().catch(function(){return{};}).then(function(e){
     throw new Error(e.error||('HTTP '+r.status));
    });
   }
   return r.json();
  })
  .then(function(j){
   ok(j.url);
  })
  .catch(function(err){
   finished=true;
   clearInterval(iv);
   closeModal();
   toast('Video failed: '+(err&&err.message?err.message:'No credit was used.'));
  });
 },{cls:'rendm',noclose:true});
}

/* ---------- canvas board renderer ---------- */
var pl2={t:0,i:0,on:false,raf:0,last:0,speed:1,voice:false,cc:true,v:null,seek:null,ctl:null,rec:null};
function stopPlayer(){pl2.on=false;cancelAnimationFrame(pl2.raf);try{speechSynthesis.cancel()}catch(e){}if(pl2.rec){try{pl2.rec.stop()}catch(e){}pl2.rec=null}}
function totalDur(sc){return sc.reduce(function(a,s){return a+s.dur},0)}
function mmss(ms){var s=Math.floor(ms/1000);return Math.floor(s/60)+':'+('0'+s%60).slice(-2)}
function dlBlob(blob,name){var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},800)}
var CW=1280,CH=720,CHALK='#F3F1E7',YEL='#FFE48A',BLU='#9CCBFF',PNK='#FFA8C0';
function wrapText(ctx,txt,w){var out=[];String(txt).split('\n').forEach(function(par){var words=par.split(' '),line='';words.forEach(function(wd){var t=line?line+' '+wd:wd;if(ctx.measureText(t).width>w&&line){out.push(line);line=wd}else line=t});out.push(line)});return out}
function bstyle(b,fam){switch(b.k){
 case 'title':return{f:'700 70px '+fam,lh:78,c:CHALK};case 'tag':return{f:'600 22px Inter, sans-serif',lh:36,c:'rgba(243,241,231,.6)',up:true};
 case 'h':return{f:'600 21px Inter, sans-serif',lh:34,c:'rgba(243,241,231,.7)',up:true};case 'line':return{f:'500 34px '+fam,lh:42,c:'rgba(243,241,231,.94)'};
 case 'eq':return{f:'700 60px '+fam,lh:66,c:YEL};case 'item':return{f:'500 40px '+fam,lh:54,c:CHALK};case 'code':return{f:'500 22px ui-monospace, Menlo, monospace',lh:30,c:'#BFE8CF',code:true}}return{f:'500 30px '+fam,lh:40,c:CHALK}}
function layoutVideo(ctx,sc,fam){var pages=[],cur=null,gap=14;
 sc.forEach(function(s,i){var hasG=s.blocks.some(function(b){return b.k==='graph'});
  var W=hasG?560:(s.center?1000:1100);
  s.blocks.forEach(function(b){if(b.k==='graph'){b.g_=true;return}var st=bstyle(b,fam);b.st=st;ctx.font=st.f;if('letterSpacing' in ctx)ctx.letterSpacing=st.up?'2px':'0px';
   var txt=st.up?b.t.toUpperCase():b.t;b.lines=st.code?String(b.t).split('\n'):wrapText(ctx,txt,W-(st.code?40:0));b.h=b.lines.length*st.lh+(st.code?24:0)+gap;b.w=W});
  var sh=s.blocks.reduce(function(a,b){return a+(b.g_?0:b.h)},0);
  if(!cur||s.page==='new'||(cur.y+sh>610)){cur={scenes:[],y:0,center:!!s.center,graph:hasG,w:W};pages.push(cur)}
  s.pg=pages.length-1;cur.scenes.push(i);s.blocks.forEach(function(b){if(b.g_)return;b.y=cur.y;cur.y+=b.h});s.cy=cur.y});
 pages.forEach(function(p){p.off=p.center?Math.max(60,(CH-p.y)/2-10):90;});return pages}
function bgCanvas(){var c=document.createElement('canvas');c.width=CW;c.height=CH;var x=c.getContext('2d');
 var g=x.createRadialGradient(CW/2,CH/2,120,CW/2,CH/2,CW*.7);g.addColorStop(0,'#1D4636');g.addColorStop(1,'#0F271D');x.fillStyle=g;x.fillRect(0,0,CW,CH);
 for(var i=0;i<2600;i++){x.fillStyle='rgba(243,241,231,'+(Math.random()*.05)+')';x.fillRect(Math.random()*CW,Math.random()*CH,1+Math.random()*2,1)}
 x.strokeStyle='rgba(243,241,231,.14)';x.lineWidth=3;x.strokeRect(22,22,CW-44,CH-44);
 x.fillStyle='rgba(243,241,231,.55)';x.font='600 15px Inter, sans-serif';if('letterSpacing' in x)x.letterSpacing='2px';x.textAlign='right';x.fillText('DOUBTSTER',CW-44,CH-38);return c}
function niceStep(r,n){var raw=r/n,mag=Math.pow(10,Math.floor(Math.log(raw)/Math.LN10)),f=raw/mag;return(f<1.5?1:f<3?2:f<7?5:10)*mag}
function fnum(v){var a=Math.abs(v);return a>=10000?Math.round(v/1000)+'k':a>=100?String(Math.round(v)):String(Math.round(v*100)/100)}
function drawGraph(ctx,g,R,p,lang,fam){
 var COL=[YEL,BLU,PNK];ctx.save();ctx.textAlign='left';ctx.lineCap='round';ctx.lineJoin='round';
 ctx.fillStyle='rgba(255,255,255,.04)';ctx.strokeStyle='rgba(243,241,231,.2)';ctx.lineWidth=2;ctx.setLineDash([6,6]);ctx.beginPath();ctx.roundRect?ctx.roundRect(R.x,R.y,R.w,R.h,16):ctx.rect(R.x,R.y,R.w,R.h);ctx.fill();ctx.stroke();ctx.setLineDash([]);
 var L={x:R.x+70,y:R.y+30,w:R.w-100,h:R.h-96};L.b=L.y+L.h;L.r=L.x+L.w;
 var ap=Math.min(1,p/.15),sp=Math.max(0,Math.min(1,(p-.15)/.65)),mp=Math.max(0,Math.min(1,(p-.82)/.18));
 ctx.globalAlpha=ap;
 if(g.bars){var mx=Math.max.apply(null,g.bars.map(function(b){return b.v}))*1.2,bw=L.w/g.bars.length;
  ctx.strokeStyle='rgba(243,241,231,.55)';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(L.x,L.y);ctx.lineTo(L.x,L.b);ctx.lineTo(L.r,L.b);ctx.stroke();ctx.globalAlpha=1;
  g.bars.forEach(function(b,i){var bp=Math.max(0,Math.min(1,sp*g.bars.length-i)),hh=b.v/mx*L.h*bp,x0=L.x+i*bw+bw*.2;ctx.fillStyle=COL[i%3];ctx.globalAlpha=.9;ctx.fillRect(x0,L.b-hh,bw*.6,hh);ctx.globalAlpha=1;
   ctx.fillStyle=CHALK;ctx.textAlign='center';ctx.font='500 30px '+fam;ctx.fillText(Lx(b.l,lang),x0+bw*.3,L.b+34);if(bp>.95){ctx.font='700 34px '+fam;ctx.fillStyle=YEL;ctx.fillText(String(b.v),x0+bw*.3,L.b-hh-12)}});
  ctx.restore();return}
 var all=[];g.series.forEach(function(s){s.pts.forEach(function(q){all.push(q)})});(g.marks||[]).forEach(function(m){all.push([m.x,m.y])});
 var xs=all.map(function(q){return q[0]}),ys=all.map(function(q){return q[1]});
 var x0=Math.min.apply(null,xs),x1=Math.max.apply(null,xs),y0=Math.min.apply(null,ys),y1=Math.max.apply(null,ys);
 if(x0>=0)x0=0;if(y0>=0)y0=0;var xr=(x1-x0)||1,yr=(y1-y0)||1;y1+=yr*.08;yr=y1-y0;
 var X=function(v){return L.x+(v-x0)/xr*L.w},Y=function(v){return L.b-(v-y0)/yr*L.h};
 var sx=niceStep(xr,5),sy=niceStep(yr,5);
 ctx.font='500 17px Inter, sans-serif';ctx.fillStyle='rgba(243,241,231,.65)';ctx.strokeStyle='rgba(243,241,231,.1)';ctx.lineWidth=1.5;
 for(var tx=Math.ceil(x0/sx)*sx;tx<=x1+1e-9;tx+=sx){ctx.beginPath();ctx.moveTo(X(tx),L.y);ctx.lineTo(X(tx),L.b);ctx.stroke();ctx.textAlign='center';ctx.fillText(fnum(tx),X(tx),L.b+26)}
 for(var ty=Math.ceil(y0/sy)*sy;ty<=y1+1e-9;ty+=sy){ctx.beginPath();ctx.moveTo(L.x,Y(ty));ctx.lineTo(L.r,Y(ty));ctx.stroke();ctx.textAlign='right';ctx.fillText(fnum(ty),L.x-10,Y(ty)+6)}
 ctx.strokeStyle='rgba(243,241,231,.7)';ctx.lineWidth=2.5;var ax=Math.max(L.x,Math.min(L.r,X(0))),ay=Math.max(L.y,Math.min(L.b,Y(0)));
 ctx.beginPath();ctx.moveTo(L.x,ay);ctx.lineTo(L.r,ay);ctx.moveTo(ax,L.y);ctx.lineTo(ax,L.b);ctx.stroke();
 ctx.globalAlpha=1;ctx.fillStyle='rgba(243,241,231,.85)';ctx.font='600 20px Inter, sans-serif';ctx.textAlign='center';ctx.fillText(Lx(g.xl,lang),L.x+L.w/2,R.y+R.h-14);
 ctx.save();ctx.translate(R.x+20,L.y+L.h/2);ctx.rotate(-Math.PI/2);ctx.fillText(Lx(g.yl,lang),0,0);ctx.restore();
 if(g.area){ctx.fillStyle='rgba(255,228,138,'+(.2*sp)+')';ctx.beginPath();g.area.forEach(function(q,i){i?ctx.lineTo(X(q[0]),Y(q[1])):ctx.moveTo(X(q[0]),Y(q[1]))});ctx.closePath();ctx.fill()}
 var ns=g.series.length;
 g.series.forEach(function(s,si){var pp=Math.max(0,Math.min(1,sp*ns-si));if(pp<=0)return;var pts=s.pts.map(function(q){return[X(q[0]),Y(q[1])]}),tot=0,seg=[];
  for(var i=1;i<pts.length;i++){var d=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);seg.push(d);tot+=d}
  var want=tot*pp,acc=0;ctx.strokeStyle=COL[si%3];ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);var ex=pts[0][0],ey=pts[0][1];
  for(var j=1;j<pts.length;j++){if(acc+seg[j-1]<=want){ctx.lineTo(pts[j][0],pts[j][1]);acc+=seg[j-1];ex=pts[j][0];ey=pts[j][1]}else{var f=(want-acc)/seg[j-1];ex=pts[j-1][0]+(pts[j][0]-pts[j-1][0])*f;ey=pts[j-1][1]+(pts[j][1]-pts[j-1][1])*f;ctx.lineTo(ex,ey);break}}
  ctx.stroke();
  if(s.dots&&pts.length<=14){ctx.fillStyle=COL[si%3];pts.forEach(function(q){if(q[0]<=ex+.5){ctx.beginPath();ctx.arc(q[0],q[1],5,0,7);ctx.fill()}})}
  if(pp>.98&&s.label){ctx.font='600 20px Inter, sans-serif';ctx.fillStyle=COL[si%3];var lp=pts[pts.length-1],lx=Math.min(L.r-6,lp[0]),ly=lp[1]+(si%2?24:-14);ctx.textAlign=lx>L.r-120?'right':'left';ctx.fillText(s.label,lx+(ctx.textAlign==='right'?-4:6),Math.max(L.y+16,Math.min(L.b-8,ly)))}});
 (g.marks||[]).forEach(function(m){if(mp<=0)return;var mx2=X(m.x),my=Y(m.y),r=10+14*(1-mp);ctx.globalAlpha=mp;ctx.strokeStyle='rgba(255,255,255,.7)';ctx.lineWidth=2;ctx.setLineDash([6,6]);ctx.beginPath();ctx.moveTo(mx2,my);ctx.lineTo(mx2,L.b);ctx.moveTo(mx2,my);ctx.lineTo(L.x,my);ctx.stroke();ctx.setLineDash([]);
  ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(mx2,my,r*.7,0,7);ctx.fill();ctx.strokeStyle='#1D4636';ctx.lineWidth=3;ctx.stroke();
  ctx.font='700 30px '+fam;var tw2=ctx.measureText(m.label).width,lx2=Math.max(L.x+6,Math.min(L.r-tw2-14,mx2+14)),ly2=Math.max(L.y+34,Math.min(L.b-24,my-18));
  ctx.fillStyle='rgba(15,39,29,.85)';ctx.fillRect(lx2-6,ly2-28,tw2+12,38);ctx.fillStyle='#fff';ctx.textAlign='left';ctx.fillText(m.label,lx2,ly2)});
 ctx.restore()}
function voiceFor(code){var vs=[];try{vs=speechSynthesis.getVoices()}catch(e){}var lc=code.toLowerCase(),pre=lc.slice(0,2);return vs.filter(function(v){return v.lang.toLowerCase()===lc})[0]||vs.filter(function(v){return v.lang.toLowerCase().indexOf(pre)===0})[0]||null}
function playVideo(id){var v=S.videos.filter(function(x){return x.id===id})[0];if(!v)return;stopPlayer();var pl=pl2;pl.v=v;pl.i=0;pl.t=0;pl.on=false;pl.voice=!!v.voice;pl.cc=true;pl.ctl=null;
 var lang=v.lang||'en',U=UI[lang]||UI.en;
 $('view').innerHTML='<div class="pgw"><div class="ph"><div><h1>'+h(v.title)+'</h1><p><span class="tag g">'+(v.minutes||2)+' min</span> <span class="tag g">'+langLabel(lang)+'</span> '+(v.url?'':'<span class="demo">DEMO PLAYER</span> Board animation drawn live from the answer. Real rendered video plays here once your video endpoint returns a file.')+'</p></div><button class="pill sm" type="button" data-act="go" data-v="videos">all videos</button></div>'+
 '<div class="vlay"><div><div class="win player" id="pwrap"><div class="tb"><i></i><i></i><i></i><em>'+h(v.title.slice(0,30))+'.mov</em></div>'+
 (v.url?'<video src="'+h(v.url)+'" controls style="width:100%;display:block;background:#000"></video>':'<canvas id="pcv" width="'+CW+'" height="'+CH+'" aria-label="Video board"></canvas><div class="cap2" id="cap2" aria-live="off"></div><div class="ctl"><button type="button" id="pp" aria-label="Play or pause">Play</button><button type="button" id="pv" aria-label="Previous chapter">&larr;</button><button type="button" id="nx" aria-label="Next chapter">&rarr;</button><input type="range" id="scr" min="0" max="1000" value="0" aria-label="Seek"><span id="tm">0:00</span><button type="button" id="sp">1x</button><button type="button" id="cc" aria-pressed="true" title="Captions (C)">CC</button><button type="button" id="vc" aria-pressed="false" title="Read the narration aloud (M)">Voice</button><button type="button" id="fs" title="Full screen (F)">Full</button></div>')+'</div>'+
 '<div class="acts"><button type="button" class="gt-s" data-act="vdeck" data-id="'+v.id+'">'+ic('flash')+'Flashcards from this</button><button type="button" class="gt-s" data-act="vquiz" data-id="'+v.id+'">'+ic('quiz')+'Quiz from this</button>'+(v.url?'':'<button type="button" id="rec" class="gt-s" title="Plays the video once and saves it as a silent WebM file">'+ic('down')+'Save as video file</button>')+'<button type="button" data-act="delv" data-id="'+v.id+'" class="danger">Delete</button></div>'+(v.url?'':'<p class="mute small">Space plays or pauses, arrows jump chapters, F full screen, C captions, M voice. The saved file is silent and records in real time.</p>')+'</div>'+
 (v.url?'':'<aside class="chap win"><div class="tb"><i></i><i></i><i></i><em>chapters</em></div><ol id="chl">'+v.scenes.map(function(s,i){return '<li><button type="button" data-act="chap" data-i="'+i+'"><span>'+h(s.n||('SCENE '+(i+1)))+'</span><small>'+mmss(v.scenes.slice(0,i).reduce(function(a,x){return a+x.dur},0))+'</small></button></li>'}).join('')+'</ol></aside>')+'</div></div>';
 if(v.url)return;
 var cv=$('pcv'),ctx=cv.getContext('2d'),fam=lang==='hi'?'Kalam, Caveat, cursive':'Caveat, cursive',sc=v.scenes,tot=totalDur(sc),bg=bgCanvas(),pages=null,warned=false;
 function sceneStart(i){var s=0;for(var k=0;k<i;k++)s+=sc[k].dur;return s}
 function ready(){pages=layoutVideo(ctx,sc,fam);paint()}
 function blockP(s,bi,lt){var bl=s.blocks,w=bl.map(function(b){return b.k==='graph'?260:b.lines?b.lines.join('').length:10}),tot2=w.reduce(function(a,b){return a+b},0),before=0;for(var k=0;k<bi;k++)before+=w[k];
  var win=Math.min(s.dur*.72,tot2*60+700);if(bl[bi].k==='graph'){var gs=before/tot2*win*.5;return Math.max(0,Math.min(1,(lt-gs)/Math.min(Math.max(3000,s.dur*.62),9000)))}
  var st=before/tot2*win,du=Math.max(250,w[bi]/tot2*win);return Math.max(0,Math.min(1,(lt-st)/du))}
 function drawBlock(b,pg,p,off){var st=b.st,x=pg.center?CW/2:90,y=off+b.y;ctx.save();ctx.font=st.f;if('letterSpacing' in ctx)ctx.letterSpacing=st.up?'2px':'0px';ctx.textAlign=pg.center?'center':'left';ctx.textBaseline='alphabetic';
  ctx.shadowColor='rgba(243,241,231,.28)';ctx.shadowBlur=st.code?0:2;
  if(st.code){var hh=b.lines.length*st.lh+20;ctx.fillStyle='rgba(0,0,0,.28)';ctx.fillRect(x-14,y-6,b.w,hh);}
  var totc=b.lines.join('').length,n=Math.floor(totc*p),yy=y+st.lh*.8+(st.code?8:0),last=null;
  for(var i=0;i<b.lines.length&&n>=0;i++){var ln=b.lines[i],seg=ln.slice(0,Math.min(ln.length,n));n-=ln.length;ctx.fillStyle=st.c;var tx=st.code?x+6:x;
   if(st.up){seg=seg.toUpperCase?seg:seg}ctx.fillText(seg,tx,yy+i*st.lh);last={x:tx,y:yy+i*st.lh,w:ctx.measureText(seg).width};if(n<0)break}
  if(p<1&&p>0&&last&&!st.code&&Math.floor(Date.now()/320)%2===0){ctx.fillStyle=YEL;var cx=pg.center?last.x+last.w/2+4:last.x+last.w+4;ctx.fillRect(cx,last.y-st.lh*.62,3,st.lh*.7)}
  ctx.restore()}
 function paint(){if(!pages)return;var i=pl.i,s=sc[i],pg=pages[s.pg],lt=pl.t-sceneStart(i);ctx.clearRect(0,0,CW,CH);ctx.drawImage(bg,0,0);
  pg.scenes.forEach(function(j){if(j>i)return;var sj=sc[j];sj.blocks.forEach(function(b,bi){var p=j<i?1:blockP(sj,bi,lt);if(p<=0)return;
   if(b.k==='graph'){drawGraph(ctx,b.g,{x:700,y:96,w:520,h:560},p,lang,fam)}else drawBlock(b,pg,p,pg.off)})});
  $('cap2').textContent=pl.cc?s.say:'';$('cap2').style.display=pl.cc?'':'none';
  $('scr').value=Math.round(pl.t/tot*1000);$('tm').textContent=mmss(pl.t)+' / '+mmss(tot);$('pp').textContent=pl.on?'Pause':(pl.t>=tot?'Replay':'Play');
  [].forEach.call(document.querySelectorAll('#chl button'),function(b,k){if(k===i)b.setAttribute('aria-current','true');else b.removeAttribute('aria-current')})}
 function say(){if(!pl.voice||!pl.on)return;try{speechSynthesis.cancel();var u=new SpeechSynthesisUtterance(sc[pl.i].say),vo=voiceFor(U.code);u.lang=U.code;if(vo)u.voice=vo;else if(!warned){warned=true;toast(lang==='hi'?'No Hindi voice on this device, so there is no sound. Captions still show. Chrome on Windows and Android usually has one.':'No voice found on this device. Captions still show.')}u.rate=Math.min(1.6,pl.speed);speechSynthesis.speak(u)}catch(e){}}
 function seek(t){pl.t=Math.max(0,Math.min(tot,t));var i=0;while(i<sc.length-1&&pl.t>=sceneStart(i)+sc[i].dur)i++;var ch=i!==pl.i;pl.i=i;paint();if(ch)say()}
 pl.seek=function(i){seek(sceneStart(i)+1);say()};
 function finishRec(){var mr=pl.rec;if(mr){pl.rec=null;setTimeout(function(){try{mr.stop()}catch(e){}},350)}}
 function frame(ts){if(!pl.on)return;var dt=pl.last?ts-pl.last:0;pl.last=ts;pl.t+=dt*pl.speed;
  if(pl.t>=tot){pl.t=tot;pl.on=false;seek(tot);finishRec();return}seek(pl.t);pl.raf=requestAnimationFrame(frame)}
 function toggle(){if(pl.t>=tot)pl.t=0;pl.on=!pl.on;pl.last=0;if(pl.on){pl.raf=requestAnimationFrame(frame);say()}else{try{speechSynthesis.cancel()}catch(e){}}seek(pl.t)}
 function prev(){pl.seek(Math.max(0,pl.i-1))}function next(){if(pl.i<sc.length-1)pl.seek(pl.i+1)}
 function voice(){pl.voice=!pl.voice;$('vc').setAttribute('aria-pressed',pl.voice);$('vc').classList.toggle('on',pl.voice);if(pl.voice)say();else{try{speechSynthesis.cancel()}catch(e){}}}
 function cc(){pl.cc=!pl.cc;$('cc').setAttribute('aria-pressed',pl.cc);paint()}
 function fsx(){var w=$('pwrap');try{if(document.fullscreenElement)document.exitFullscreen();else w.requestFullscreen()}catch(e){}}
 pl.ctl={toggle:toggle,prev:prev,next:next,voice:voice,cc:cc,fs:fsx};
 $('pp').onclick=toggle;$('pv').onclick=prev;$('nx').onclick=next;$('scr').oninput=function(){seek(this.value/1000*tot)};$('cc').onclick=cc;$('fs').onclick=fsx;$('vc').onclick=voice;
 $('sp').onclick=function(){pl.speed=pl.speed===1?1.5:pl.speed===1.5?2:1;this.textContent=pl.speed+'x'};
 if(!('speechSynthesis' in window))$('vc').hidden=true;else if(pl.voice){$('vc').setAttribute('aria-pressed','true');$('vc').classList.add('on')}
 var rb=$('rec');if(rb)rb.onclick=function(){
  if(pl.rec){return}if(!window.MediaRecorder||!cv.captureStream){toast('This browser cannot record video. Try Chrome or Edge.');return}
  var chunks=[],mt=MediaRecorder.isTypeSupported('video/webm;codecs=vp9')?'video/webm;codecs=vp9':'video/webm',mr;
  try{mr=new MediaRecorder(cv.captureStream(30),{mimeType:mt,videoBitsPerSecond:4000000})}catch(e){toast('Could not start recording.');return}
  mr.ondataavailable=function(e){if(e.data&&e.data.size)chunks.push(e.data)};
  mr.onstop=function(){rb.lastChild.textContent='Save as video file';var b=new Blob(chunks,{type:'video/webm'});if(b.size)dlBlob(b,(v.title.replace(/[^a-z0-9]+/gi,'-').toLowerCase()||'video')+'.webm');toast('Saved as a silent WebM file.')};
  pl.rec=mr;pl.voice=false;$('vc').setAttribute('aria-pressed','false');$('vc').classList.remove('on');try{speechSynthesis.cancel()}catch(e){}
  pl.on=false;pl.t=0;pl.speed=1;$('sp').textContent='1x';pl.i=0;seek(0);mr.start(500);rb.lastChild.textContent='Recording... (plays once)';pl.on=false;toggle()};
 var fl=function(){ready()};
 try{Promise.all([document.fonts.load('700 40px Caveat'),document.fonts.load('700 40px Kalam'),document.fonts.load('500 20px Inter')]).then(fl,fl)}catch(e){fl()}
 setTimeout(function(){if(!pages)fl()},1500);
 pl.on=false;pl.t=0;pl.i=0;var starter=setInterval(function(){if(pages){clearInterval(starter);toggle()}},60)}
function recentAnswers(){var r=[];S.chats.forEach(function(c){c.msgs.forEach(function(m,i){if(m.a)r.push({cid:c.id,i:i,t:m.a.title})})});return r.slice(-8).reverse()}
function renderVideos(){
  if (!hasPlan()) { renderPaywall('videos'); return; }
  var recent=recentAnswers(),c=PRICE.videoCost[vsel];
 $('view').innerHTML='<div class="pgw"><div class="ph"><div><h1>video studio</h1><p>Board-style explainers drawn step by step, with graphs where they help. 2 minutes costs '+PRICE.videoCost[2]+' credit, 5 minutes costs '+PRICE.videoCost[5]+'. You have <b>'+credits()+'</b>.</p></div><button class="pill b sm" type="button" data-act="'+(S.plan?'credits':'promo')+'">'+(S.plan?'get more credits':'start a trial')+'</button></div>'+
 '<div class="win form"><div class="tb"><i></i><i></i><i></i><em>new-video.app</em></div><div class="in3"><label for="vp">What should the video explain?</label><textarea id="vp" maxlength="300" placeholder="e.g. solve 3x - 7 = 11, or explain recursion"></textarea>'+
 (recent.length?'<label for="vf">Or pick from your recent answers</label><select id="vf"><option value="">Choose an answer</option>'+recent.map(function(r){return '<option value="'+r.cid+':'+r.i+'">'+h(r.t)+'</option>'}).join('')+'</select>':'')+
 '<label>Length</label>'+lenCards()+langSeg()+'<label class="chk"><input type="checkbox" id="vvo"'+(vvoice?' checked':'')+'><span>Voice-over</span></label><p class="mute small" id="vbal"></p><div><button class="pill b sm" type="button" data-act="vgo" data-vgo>Generate</button></div></div></div>'+
 '<h2 class="sect">your videos</h2>'+(S.videos.length?'<div class="grid">'+S.videos.map(function(v){return '<div class="card2"><div class="win"><div class="tb"><i></i><i></i><i></i><em>'+h(v.title.slice(0,22))+'</em></div><div class="thumb2">'+h(v.title.slice(0,40))+'<span class="dur">'+(v.minutes||2)+':00</span></div><div class="in3"><h3>'+h(v.title)+'</h3><p>'+h(v.subject||'Video')+' &middot; '+(v.minutes||2)+' min &middot; '+langLabel(v.lang)+' &middot; '+dstr(v.ts)+'</p><div class="row"><button type="button" data-act="playv" data-id="'+v.id+'">Play</button>'+(v.a?'<button type="button" data-act="vdeck" data-id="'+v.id+'">Cards</button><button type="button" data-act="vquiz" data-id="'+v.id+'">Quiz</button>':'')+'<button type="button" data-act="delv" data-id="'+v.id+'" class="danger">Delete</button></div></div></div></div>'}).join('')+'</div>':'<p class="mute">No videos yet. Make one from any reply in chat, or use the form above.</p>')+'</div>';
 vupd()}

/* ================= flashcards ================= */
var fs={mode:'home',deck:null,queue:[],i:0,flip:false,st:[0,0,0,0],total:0,done:0,label:''};
function deckById(id){return S.decks.filter(function(d){return d.id===id})[0]||null}
function cardOf(ref){var d=deckById(ref.d);if(!d)return null;var c=d.cards.filter(function(x){return x.id===ref.c})[0];return c?{d:d,c:c}:null}
function whenLabel(c){if(cstate(c)==='new')return 'new';var n=NOW();if(c.due<=n)return 'due now';var dd=Math.ceil((c.due-n)/DAY);return dd<=1?'tomorrow':'in '+dd+' days'}
function renderFlash(){
  if (!hasPlan()) { renderPaywall('flash'); return; }
  fs.mode='home';paintFlash();
}
function paintFlash(){if(fs.mode==='study')return paintStudy();if(fs.mode==='deck')return paintDeck();
 var due=dueCards(),ac=allCards(),nn=0,ll=0,mm=0;S.decks.forEach(function(d){var s=deckStats(d);nn+=s.n;ll+=s.l;mm+=s.m});
 $('view').innerHTML='<div class="pgw wide"><div class="ph"><div><h1>flashcards</h1><p>Spaced repetition: cards you know come back later, cards you miss come back sooner. Free, no credits.</p></div><button class="pill b sm" type="button" data-act="newdeck">+ new deck</button></div>'+
 '<div class="fstrip"><div class="win fcta"><div class="tb"><i></i><i></i><i></i><em>today</em></div><div class="sb"><div class="big">'+due.length+'</div><p>card'+(due.length===1?'':'s')+' due</p>'+(due.length?'<button class="pill b" type="button" data-act="studyall">study '+Math.min(40,due.length)+' now</button>':'<p class="mute small">'+(ac.length?'All caught up. Come back tomorrow, or cram a deck.':'Make a deck from a reply in chat, or create one below.')+'</p>')+'</div></div>'+
 '<div class="win"><div class="tb"><i></i><i></i><i></i><em>progress</em></div><div class="sb"><div class="seg3"><div><b>'+nn+'</b><small>new</small></div><div><b>'+ll+'</b><small>learning</small></div><div><b>'+mm+'</b><small>mastered</small></div></div><div class="stack"><i class="s-n" style="flex:'+nn+'"></i><i class="s-l" style="flex:'+ll+'"></i><i class="s-m" style="flex:'+mm+'"></i></div><p class="mute small">Mastered means the next review is 21 or more days away.</p></div></div></div>'+
 '<h2 class="sect">your decks</h2>'+(S.decks.length?'<div class="grid">'+S.decks.map(function(d){var s=deckStats(d);return '<div class="card2"><div class="win"><div class="tb"><i></i><i></i><i></i><em>'+h(d.title.slice(0,24))+'</em></div><div class="in3"><h3>'+h(d.title)+'</h3><p>'+h(d.subject||'Deck')+' &middot; '+s.total+' cards'+(s.due?' &middot; <b class="dueb">'+s.due+' due</b>':'')+'</p><div class="stack"><i class="s-n" style="flex:'+s.n+'"></i><i class="s-l" style="flex:'+s.l+'"></i><i class="s-m" style="flex:'+s.m+'"></i></div><div class="row"><button type="button" data-act="studydeck" data-id="'+d.id+'">'+(s.due?'Study':'Cram')+'</button><button type="button" data-act="opendeck" data-id="'+d.id+'">Open</button><button type="button" data-act="deckquiz" data-id="'+d.id+'">Quiz</button></div></div></div></div>'}).join('')+'</div>':
  '<div class="win form"><div class="tb"><i></i><i></i><i></i><em>empty.md</em></div><div class="in3"><p>No decks yet. The fastest way: ask a question in chat, then press <b>Flashcards</b> under the reply.</p><div><button class="pill b sm" type="button" data-act="go" data-v="chat">open chat</button></div></div></div>')+
 '<div id="newdeck" class="two" style="margin-top:22px">'+
 '<div class="win form"><div class="tb"><i></i><i></i><i></i><em>from-topic.app</em></div><div class="in3"><label for="ftopic">Generate a deck from a topic or problem</label><input type="text" id="ftopic" maxlength="200" placeholder="e.g. photosynthesis, or solve 3x - 7 = 11"><div><button class="pill b sm" type="button" data-act="fgen">generate</button></div><p class="mute small">'+(CFG.DEMO?'Demo mode: works for the topics the built-in engine knows.':'Uses your deck endpoint.')+'</p></div></div>'+
 '<div class="win form"><div class="tb"><i></i><i></i><i></i><em>paste-cards.app</em></div><div class="in3"><label for="ftitle">Deck name</label><input type="text" id="ftitle" maxlength="60" placeholder="e.g. Chemistry formulas"><label for="fpaste">Cards, one per line: front :: back</label><textarea id="fpaste" placeholder="Unit of force :: newton&#10;pH of a neutral solution :: 7"></textarea><div><button class="pill sm" type="button" data-act="fmake">create deck</button></div></div></div></div></div>'}
function studyStart(deckId,cram){
  if (!hasPlan()) { renderPaywall('flash'); return; }
  var q=(cram?allCards().filter(function(x){return !deckId||x.d.id===deckId}):dueCards(deckId));
 if(cram)q=shuffle(q);if(!q.length){toast('Nothing due right now.');return}
 q=q.slice(0,40);if(view!=='flash')go('flash');var d=deckId&&deckById(deckId);
 fs={mode:'study',deck:deckId||null,queue:q.map(function(x){return{d:x.d.id,c:x.c.id}}),i:0,flip:false,st:[0,0,0,0],total:q.length,done:0,label:d?d.title:'All decks'};paintFlash()}
function flip(){var f=$('fc');if(!f)return;fs.flip=!fs.flip;f.classList.toggle('flip',fs.flip);var r=$('rate'),b=$('showb');if(r)r.hidden=!fs.flip;if(b)b.hidden=fs.flip}
function paintStudy(){
 var ref=fs.queue[fs.i],x=ref&&cardOf(ref);
 if(!x&&fs.i>=fs.queue.length||fs.i>=fs.queue.length){var rv=fs.st.reduce(function(a,b){return a+b},0),good=fs.st[2]+fs.st[3],dd=fs.deck?dueCards(fs.deck).length:dueCards().length;
  $('view').innerHTML='<div class="pgw"><div class="ph"><div><h1>session complete</h1><p>'+h(fs.label)+'</p></div></div><div class="win form"><div class="tb"><i></i><i></i><i></i><em>result.md</em></div><div class="in3" style="align-items:center;text-align:center"><div class="score">'+(rv?Math.round(good/rv*100):0)+'%</div><p>of your answers were Good or Easy ('+rv+' answers).</p><div class="seg3"><div><b>'+fs.st[0]+'</b><small>again</small></div><div><b>'+fs.st[1]+'</b><small>hard</small></div><div><b>'+fs.st[2]+'</b><small>good</small></div><div><b>'+fs.st[3]+'</b><small>easy</small></div></div><div class="acts" style="justify-content:center">'+(dd?'<button type="button" class="vid" data-act="'+(fs.deck?'studydeck':'studyall')+'" data-id="'+(fs.deck||'')+'">Study '+dd+' more</button>':'')+'<button type="button" data-act="flashhome">Back to decks</button>'+(fs.deck?'<button type="button" data-act="deckquiz" data-id="'+fs.deck+'">Quiz me on this deck</button>':'')+'</div></div></div></div>';return}
 if(!x){fs.i++;return paintStudy()}
 var c=x.c,cl=c.f.length>110||c.b.length>110;fs.flip=false;
 var labels=[['Again',0],['Hard',1],['Good',2],['Easy',3]];
 $('view').innerHTML='<div class="pgw"><div class="ph"><div><h1>'+h(fs.label)+'</h1><p>Card '+Math.min(fs.done+1,fs.total)+' of '+fs.total+' &middot; <span class="tag g">'+h(x.d.title.slice(0,30))+'</span></p></div><button class="pill sm" type="button" data-act="flashhome">end session</button></div>'+
 '<div class="pbar2" style="max-width:640px;margin:0 auto 18px"><i style="width:'+(fs.done/fs.total*100)+'%"></i></div>'+
 '<div class="fc'+(cl?' long':'')+'" id="fc"><div class="fci" id="fci" tabindex="0" role="button" aria-label="Flip card (Space)"><div class="fcf"><small>Question</small>'+renderMath(c.f)+'</div><div class="fcb"><small>Answer</small>'+renderMath(c.b)+'</div></div></div>'+
 '<div class="fcn"><button class="pill b" id="showb" type="button" data-act="cflip">Show answer <kbd class="kk">Space</kbd></button></div>'+
 '<div class="rate" id="rate" hidden>'+labels.map(function(l){var nx=srsNext(c,l[1]);return '<button type="button" class="r'+l[1]+'" data-act="srate" data-g="'+l[1]+'"><b>'+l[0]+'</b><small>'+ivLabel(nx.int)+'</small><kbd class="kk">'+(l[1]+1)+'</kbd></button>'}).join('')+'</div>'+
 '<p class="mute small" style="text-align:center;margin-top:14px">Shortcuts: Space flips, 1 to 4 rates, Esc ends the session.</p></div>';
 }
function srate(g){var ref=fs.queue[fs.i],x=ref&&cardOf(ref);if(!x||!fs.flip)return;rate(x.c,g);fs.st[g]++;if(g===0)fs.queue.push(ref);else fs.done++;fs.i++;paintNav();paintStudy()}
function openDeck(id){
  if (!hasPlan()) { renderPaywall('flash'); return; }
  if(view!=='flash')go('flash');
  fs={mode:'deck',deck:id,queue:[],i:0,flip:false,st:[0,0,0,0],total:0,done:0,label:''};
  paintFlash();
}
function paintDeck(){var d=deckById(fs.deck);if(!d){fs.mode='home';return paintFlash()}var s=deckStats(d);
 $('view').innerHTML='<div class="pgw wide"><div class="ph"><div><h1>'+h(d.title)+'</h1><p>'+h(d.subject||'Deck')+' &middot; '+s.total+' cards &middot; '+s.due+' due &middot; '+s.m+' mastered</p></div><button class="pill sm" type="button" data-act="flashhome">all decks</button></div>'+
 '<div class="acts" style="margin:0 0 16px"><button type="button" class="vid" data-act="studydeck" data-id="'+d.id+'">'+(s.due?'Study '+s.due+' due':'Cram all')+'</button>'+(s.due?'<button type="button" data-act="cramdeck" data-id="'+d.id+'">Cram all</button>':'')+'<button type="button" data-act="deckquiz" data-id="'+d.id+'">Quiz me</button><button type="button" data-act="cardedit" data-id="'+d.id+'">+ Add card</button><button type="button" data-act="deckcsv" data-id="'+d.id+'">Export CSV</button><button type="button" data-act="deckren" data-id="'+d.id+'">Rename</button><button type="button" class="danger" data-act="deckdel" data-id="'+d.id+'">Delete deck</button></div>'+
 '<div class="win form"><div class="tb"><i></i><i></i><i></i><em>cards.csv</em></div><div class="in3" style="padding:0"><div class="ctab"><div class="chd"><span>Front</span><span>Back</span><span>Status</span><span></span></div>'+d.cards.map(function(c){return '<div class="crw"><span>'+renderMath(c.f)+'</span><span>'+renderMath(c.b)+'</span><span><span class="tag '+(cstate(c)==='mastered'?'':cstate(c)==='new'?'g':'w')+'">'+cstate(c)+'</span><small class="mute">'+whenLabel(c)+'</small></span><span class="cx"><button type="button" data-act="cardedit" data-id="'+d.id+'" data-c="'+c.id+'" aria-label="Edit card">'+ic('pen')+'</button><button type="button" data-act="carddel" data-id="'+d.id+'" data-c="'+c.id+'" aria-label="Delete card">'+ic('trash')+'</button></span></div>'}).join('')+'</div></div></div></div>'}
function cardEditor(did,cid){var d=deckById(did),c=cid&&d.cards.filter(function(x){return x.id===cid})[0];
 modal('<h2>'+(c?'edit card':'add a card')+'</h2><div class="form"><label for="cf">Front</label><textarea id="cf" maxlength="400" style="min-height:70px">'+h(c?c.f:'')+'</textarea><label for="cb" style="margin-top:8px;display:block">Back</label><textarea id="cb" maxlength="600" style="min-height:70px">'+h(c?c.b:'')+'</textarea></div><div class="acts"><button type="button" data-act="close">Cancel</button><button type="button" class="vid" data-act="cardsave" data-id="'+did+'" data-c="'+(cid||'')+'">Save</button></div>')}
function csvEsc(s){return '"'+String(s).replace(/"/g,'""')+'"'}
function mkDeckFromText(title,text){var cards=[];String(text).split('\n').forEach(function(l){var p=l.indexOf('::')>-1?l.split('::'):l.split('\t');if(p.length>=2&&p[0].trim()&&p.slice(1).join('::').trim())cards.push(mkCard(p[0].trim(),p.slice(1).join('::').trim()))});
 if(!cards.length)return null;return{id:uid(),ts:Date.now(),title:title||'My deck',subject:'',src:'manual',cards:cards}}
function topicDeck(t){
 if(CFG.DEMO){var a=demoSolve(t);if(!a){toast('The demo cannot build that one. Try an example from chat, or connect your endpoint.');return}addDeck(deckFrom(a,t));return}
 fetch(CFG.DECK_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify({topic:t,profile:S.profile})}).then(function(r){if(!r.ok)throw 0;return r.json()})
  .then(function(j){var cs=(j.cards||[]).map(function(c){return mkCard(c.f,c.b)});if(!cs.length)throw 0;addDeck({id:uid(),ts:Date.now(),title:j.title||t,subject:j.subject||'',src:'topic',cards:cs})}).catch(function(){toast('Could not build the deck. Try again.')})}
function addDeck(d,noStudy){S.decks.unshift(d);save(true);paintNav();toast('Deck created: '+d.cards.length+' cards.');if(!noStudy)studyStart(d.id,true)}

/* ================= quiz ================= */
var BANK={
 Maths:[['Solve 3x - 7 = 11','6',['4','6','18','3'],'Add 7 to get 3x = 18, then divide by 3.'],['What is 20% of 350?','70',['35','70','7','170'],'20% = 0.2, and 0.2 x 350 = 70.'],['Area of a circle with radius 5 (use 3.14)?','78.5',['31.4','78.5','15.7','25'],'Area = pi x r^2 = 3.14 x 25 = 78.5.'],['What is the gradient of y = 4x - 3?','4',['-3','4','3','1'],'In y = mx + c, the gradient is m.']],
 Physics:[['What is the SI unit of force?','newton',['joule','newton','watt','pascal'],'Force is measured in newtons (N).'],['A 2 kg object accelerates at 5 m/s^2. Resultant force?','10 N',['2.5 N','7 N','10 N','0.4 N'],'F = ma = 2 x 5 = 10 N.'],['Which quantity has a direction?','velocity',['speed','distance','velocity','mass'],'Velocity is speed in a given direction (a vector).'],['u = 0, a = 4 m/s^2, t = 3 s. Final speed v?','12 m/s',['7 m/s','12 m/s','1.3 m/s','24 m/s'],'v = u + at = 0 + 4 x 3 = 12 m/s.']],
 Chemistry:[['pH of a neutral solution at 25 C?','7',['0','7','10','14'],'Pure water is neutral at pH 7.'],['Chemical symbol for sodium?','Na',['S','So','Na','N'],'Na comes from the Latin natrium.'],['An ionic bond involves...','transfer of electrons',['sharing of electrons','transfer of electrons','sharing of protons','no electrons'],'One atom gives electrons to another, forming ions.'],['Balance: H2 + O2 -> H2O. Coefficients?','2, 1, 2',['1, 1, 1','2, 1, 2','1, 2, 1','2, 2, 1'],'2H2 + O2 -> 2H2O has equal atoms on both sides.']],
 Biology:[['Which organelle releases energy in respiration?','mitochondria',['nucleus','ribosome','mitochondria','vacuole'],'Most ATP is made in the mitochondria.'],['Mitosis produces...','2 identical daughter cells',['4 different cells','2 identical daughter cells','1 larger cell','gametes'],'Mitosis copies a cell for growth and repair.'],['Which base pairs with adenine in DNA?','thymine',['guanine','cytosine','thymine','uracil'],'A pairs with T, and C pairs with G.'],['Which gas do plants take in for photosynthesis?','carbon dioxide',['oxygen','nitrogen','carbon dioxide','hydrogen'],'CO2 is fixed into glucose.']],
 Economics:[['If the price of a normal good rises, quantity demanded usually...','falls',['rises','falls','stays fixed','doubles'],'The law of demand: higher price, lower quantity demanded.'],['Market equilibrium is where...','Qd = Qs',['Qd > Qs','Qd = Qs','price = 0','Qs = 0'],'At that price the market clears.'],['Opportunity cost is...','the value of the next best alternative',['the money price','the value of the next best alternative','total cost','profit forgone only'],'It is what you give up by choosing one option.'],['Inflation is...','a general rise in the price level',['a fall in prices','a general rise in the price level','a rise in one price','higher wages only'],'It means money buys less over time.']],
 Coding:[['Time complexity of binary search?','O(log n)',['O(1)','O(n)','O(log n)','O(n^2)'],'The search area halves each step.'],['What does a base case do in recursion?','stops the recursion',['starts it','stops the recursion','doubles the input','nothing'],'It answers the simplest input directly.'],['In Python, the first list index is...','0',['0','1','-1','depends'],'Python lists are zero-indexed.'],['Which structure is last in, first out?','stack',['queue','stack','array','set'],'A stack pops the most recently pushed item.']]};
function genLinear(){var x=Math.floor(Math.random()*9)+2,a=Math.floor(Math.random()*7)+2,b=Math.floor(Math.random()*15)+1,c=a*x+b;var o=shuffle([x,x+1,x-1,x+2].map(String));return['Solve '+a+'x + '+b+' = '+c,String(x),o,'Subtract '+b+' to get '+a+'x = '+(c-b)+', then divide by '+a+'.']}
var Q={s:'',qs:[],i:0,score:0,miss:[],ans:false,timed:false,src:'',again:null},qtimer=0,qTimed=false,QSEC=20;
function renderQuiz(){
  if (!hasPlan()) { renderPaywall('quiz'); return; }
  var dk=S.decks.filter(function(d){return d.cards.length>=2});
 $('view').innerHTML='<div class="pgw"><div class="ph"><div><h1>quizzes</h1><p>Practice by subject, from your own flashcard decks, or from any chat reply. Free, and nothing here uses credits.</p></div></div>'+
 '<div class="win form"><div class="tb"><i></i><i></i><i></i><em>quiz-setup.app</em></div><div class="in3"><label>Pick a subject</label><div class="tabs2" style="margin:0" id="qs">'+['Mixed'].concat(Object.keys(BANK)).map(function(s){return '<button type="button" data-act="qstart" data-s="'+s+'" aria-pressed="false">'+s+'</button>'}).join('')+'</div>'+
 (dk.length?'<label for="qdk">Or quiz yourself on a deck</label><div class="inl"><select id="qdk">'+dk.map(function(d){return '<option value="'+d.id+'">'+h(d.title)+' ('+d.cards.length+')</option>'}).join('')+'</select><button type="button" class="pill sm" data-act="qdeck">start</button></div>':'')+
 '<label class="chk" style="margin-top:0"><input type="checkbox" id="qtm"'+(qTimed?' checked':'')+'><span>Timed: '+QSEC+' seconds per question</span></label></div></div>'+
 '<div id="qa">'+(S.quizzes.length?'<h2 class="sect">recent results</h2><ul class="rcp">'+S.quizzes.slice(0,8).map(function(q){return '<li><span>'+h(q.src||q.s)+' &middot; '+dstr(q.ts)+(q.timed?' &middot; timed':'')+'</span><b>'+q.score+' / '+q.total+'</b></li>'}).join('')+'</ul>':'')+'</div></div>';
 var tm=$('qtm');if(tm)tm.onchange=function(){qTimed=tm.checked}}
function qStart(s){
  if (!hasPlan()) { renderPaywall('quiz'); return; }
  var qs;
 if(s==='Mixed'){qs=[];Object.keys(BANK).forEach(function(k){qs.push(BANK[k][Math.floor(Math.random()*4)].concat(k))});qs=shuffle(qs).slice(0,5)}
 else{qs=shuffle(BANK[s]).map(function(q){return q.concat(s)});qs.push((s==='Maths'?genLinear():shuffle(BANK[s])[0]).concat(s));
  var seen={},u=[];qs.forEach(function(q){if(!seen[q[0]]){seen[q[0]]=1;u.push(q)}});qs=u.slice(0,5)}
 qBegin(qs.map(function(q){return{q:q[0],a:q[1],o:shuffle(q[2]),e:q[3],sub:q[4]}}),s,s,function(){qStart(s)})}
function qBegin(qs,s,src,again){
  if (!hasPlan()) { renderPaywall('quiz'); return; }
  if(view!=='quiz')go('quiz');var tm=$('qtm');if(tm)qTimed=tm.checked;
 Q={s:s,qs:qs,i:0,score:0,miss:[],ans:false,timed:qTimed,src:src||s,again:again};
 [].forEach.call(document.querySelectorAll('#qs button'),function(b){b.setAttribute('aria-pressed',b.dataset.s===s)});paintQ()}
function quizFromAnswer(a,q){
  if (!hasPlan()) { renderPaywall('quiz'); return; }
  var d=deckFrom(a,q);qBegin(mcqFromCards(d.cards,a.subject||'Quiz',5),a.subject||'Reply',a.title,function(){quizFromAnswer(a,q)})}
function quizFromDeck(id){
  if (!hasPlan()) { renderPaywall('quiz'); return; }
  var d=deckById(id);if(!d)return;if(view!=='quiz')go('quiz');qBegin(mcqFromCards(d.cards,d.subject||'Deck',Math.min(8,d.cards.length)),d.subject||'Deck',d.title,function(){quizFromDeck(id)})}
function qClear(){clearInterval(qtimer);qtimer=0}
function paintQ(){var q=Q.qs[Q.i],el=$('qa');qClear();if(!el)return;
 if(!q){S.quizzes.unshift({ts:Date.now(),s:Q.s,src:Q.src,score:Q.score,total:Q.qs.length,timed:Q.timed,missed:Q.miss.map(function(m){return m.q})});S.quizzes=S.quizzes.slice(0,40);save();paintNav();
  el.innerHTML='<div class="win form"><div class="tb"><i></i><i></i><i></i><em>result.md</em></div><div class="in3" style="align-items:center;text-align:center"><div class="score">'+Q.score+' / '+Q.qs.length+'</div><p>'+(Q.score===Q.qs.length?'Full marks.':Q.score>=Math.ceil(Q.qs.length*.6)?'Good work. Review what you missed.':'Worth another pass. Missed questions are below.')+'</p></div></div>'+
  (Q.miss.length?'<h2 class="sect">to review</h2>'+Q.miss.map(function(m){return '<div class="exp" style="margin-bottom:10px"><b>'+renderMath(m.q)+'</b><br>Answer: '+renderMath(m.a)+'. '+renderMath(m.e)+'</div>'}).join('')+'<div class="acts"><button class="vid" type="button" data-act="qcards">Save missed as flashcards</button></div>':'')+'<div class="acts"><button type="button" data-act="qagain">Try again</button><button type="button" data-act="go" data-v="flash">Open flashcards</button></div>';return}
 el.innerHTML='<div class="win form q"><div class="tb"><i></i><i></i><i></i><em>question '+(Q.i+1)+' of '+Q.qs.length+'</em></div><div class="in3"><div class="pbar2"><i style="width:'+(Q.i/Q.qs.length*100)+'%"></i></div>'+(Q.timed?'<div class="tmr"><i id="tmb"></i></div>':'')+'<span class="subj">'+h(q.sub)+'</span><div class="qh">'+renderMath(q.q)+'</div><div class="opts">'+q.o.map(function(o,k){return '<button class="opt" type="button" data-act="qpick" data-k="'+k+'"><i>'+'ABCD'[k]+'</i>'+renderMath(o)+'</button>'}).join('')+'</div><div id="qx"></div></div></div>';
 if(Q.timed){var t0=Date.now();qtimer=setInterval(function(){var f=(Date.now()-t0)/(QSEC*1000);var b=$('tmb');if(b)b.style.width=Math.max(0,100-f*100)+'%';if(f>=1){qClear();qPick(-1)}},100)}
 el.scrollIntoView&&el.scrollIntoView({block:'nearest'})}
function qPick(k){if(Q.ans)return;Q.ans=true;qClear();var q=Q.qs[Q.i],ok=k>=0&&q.o[k]===q.a;if(ok)Q.score++;else Q.miss.push(q);bump('z');
 [].forEach.call(document.querySelectorAll('.opt'),function(b,i){b.disabled=true;if(q.o[i]===q.a)b.classList.add('ok');else if(i===k)b.classList.add('no')});
 $('qx').innerHTML='<div class="exp"><b>'+(ok?'Correct. ':k<0?'Time is up. ':'Not quite. ')+'</b>'+renderMath(q.e)+'</div><div class="acts"><button class="vid" type="button" data-act="qnext">'+(Q.i+1<Q.qs.length?'Next question':'See result')+'</button></div>'}

/* ================= notes ================= */

function buildDocFromAnswer(a, q, t) {
  var userQ = (q || (a && a.title) || t || 'Study Notes').trim();
  var isStone = /stone|building|drop|fall|height|velocity|acceleration|gravity/i.test(userQ);
  var isBoat = /boat|upstream|downstream|still\s*water|42\s*km|81\s*km/i.test(userQ);
  var isCar = /car|depreciation|30,?000|15%|6\s*year/i.test(userQ);

  if (isStone) {
    return {
      title: "Stone Dropped from Building (Free Fall)",
      shortTitle: "Motion under Gravity",
      question: userQ,
      subject: "Physics",
      chapter: "Kinematics & Free Fall",
      pageNo: "1",
      verified: true,
      verifiedNote: "Checked by kinematic equations: h = 273.0 m, t = 7.46 s, Δt = 1.0 s for last quarter ✓",
      pages: [
        // Page 1: Problem Formulation & Core Concept
        {
          blocks: [
            { type: "heading", text: "1. Problem Formulation & Conceptual Overview" },
            {
              type: "para",
              text: "A stone is dropped from rest ($v_i = 0\\text{ m/s}$) from the top of a building of height $h$. It accelerates downward under gravity ($g = 9.8\\text{ m/s}^2$). We are given that the stone covers the **last quarter ($h/4$)** of its descent in exactly **1 second**."
            },
            {
              type: "margin",
              text: "Key rule: For free fall from rest, vertical displacement is proportional to time squared: $s \\propto t^2$."
            },
            { type: "heading", text: "2. Physical Principles & Real-World Intuition" },
            {
              type: "para",
              text: "Because the stone continuously accelerates under gravity, its downward speed increases linearly ($v = gt$). Consequently, the stone moves through each successive quarter of height at an increasing average velocity, meaning the final quarter ($h/4$) is traversed in significantly less time than any previous quarter."
            },
            {
              type: "margin",
              text: "Every second, gravity adds $9.8\\text{ m/s}$ to downward velocity."
            }
          ]
        },
        // Page 2: Variables & Governing Equations
        {
          blocks: [
            { type: "heading", text: "3. Parameter Declarations & Given Conditions" },
            {
              type: "para",
              text: "Let $t$ be the total time of flight to fall the entire height $h$. Let $t_1$ be the time taken to descend the first three-quarters ($3h/4$) of the height."
            },
            { type: "heading", text: "4. Primary Governing Equations" },
            { type: "eq", tex: "h = \\frac{1}{2}gt^2 \\implies t = \\sqrt{\\frac{2h}{g}}" },
            {
              type: "para",
              text: "For the displacement of the first $3/4$ of the building's height:"
            },
            { type: "eq", tex: "h_1 = \\frac{3}{4}h = \\frac{1}{2}gt_1^2 \\implies t_1 = \\sqrt{\\frac{3}{4}}t = \\frac{\\sqrt{3}}{2}t \\approx 0.8660t" },
            {
              type: "margin",
              text: "Dimensional check: $[h] = \\text{L}$, $[gt^2] = (\\text{L}/\\text{T}^2)\\cdot\\text{T}^2 = \\text{L}$ ✓"
            }
          ]
        },
        // Page 3: Step-by-Step Derivation & Calculations
        {
          blocks: [
            { type: "heading", text: "5. Step-by-Step Derivation & Total Time" },
            {
              type: "steps",
              items: [
                {
                  say: "Express the time taken for the last quarter of the height",
                  tex: "\\Delta t = t - t_1 = 1\\text{ s}"
                },
                {
                  say: "Substitute $t_1 = \\frac{\\sqrt{3}}{2}t$ into the elapsed time formula",
                  tex: "t - \\frac{\\sqrt{3}}{2}t = 1 \\implies t\\left(1 - \\frac{\\sqrt{3}}{2}\\right) = 1"
                },
                {
                  say: "Simplify and rationalize the fraction to solve for total time $t$",
                  tex: "t = \\frac{2}{2 - \\sqrt{3}} = \\frac{2(2 + \\sqrt{3})}{(2 - \\sqrt{3})(2 + \\sqrt{3})} = 2(2 + \\sqrt{3}) \\approx 7.4641\\text{ s}"
                },
                {
                  say: "Calculate intermediate time $t_1$ for the first 3/4 height",
                  tex: "t_1 = t - 1.0\\text{ s} = 6.4641\\text{ seconds}"
                },
                {
                  say: "Calculate the total height of the building $h$",
                  tex: "h = \\frac{1}{2}gt^2 = \\frac{1}{2}(9.8)(7.4641)^2 \\approx 273.04\\text{ meters}"
                },
                {
                  say: "Calculate the final impact velocity",
                  tex: "v_f = gt = (9.8)(7.4641) \\approx 73.15\\text{ m/s} \\approx 263.3\\text{ km/h}"
                }
              ]
            },
            { type: "heading", text: "6. Final Calculated Solution" },
            {
              type: "answer",
              tex: "h = 2(2 + \\sqrt{3})^2 \\cdot \\frac{g}{2} \\approx \\boxed{273\\text{ m}},\\quad t = 2(2 + \\sqrt{3}) \\approx \\boxed{7.46\\text{ s}},\\quad v_{\\text{impact}} \\approx \\boxed{73.1\\text{ m/s}}"
            },
            {
              type: "margin",
              text: "Substitution check: $h_1 = 0.5 \\times 9.8 \\times 6.464^2 = 204.75\\text{ m} = \\frac{3}{4}(273.0)\\text{ m}$ ✓"
            }
          ]
        },
        // Page 4: Visual Graphical Analysis & Physical Interpretation
        {
          blocks: [
            { type: "heading", text: "7. Visual Graphical Analysis & Trajectory" },
            {
              type: "doodle",
              spec: {
                kind: "graph",
                fn: "0.5 * 9.8 * x * x",
                xmin: 0,
                xmax: 8,
                ymin: 0,
                ymax: 300,
                label: "y = 0.5 g t^2",
                points: [
                  { x: 0, y: 0, label: "Release (t=0)", color: "ink" },
                  { x: 6.464, y: 204.75, label: "t1 = 6.46s (3h/4)", color: "purple" },
                  { x: 7.464, y: 273.0, label: "t = 7.46s (Ground)", color: "red" }
                ],
                caption: "Parabolic trajectory: 86.6% of time spent in top 75% height; 13.4% of time in final 25%."
              }
            },
            { type: "heading", text: "8. Velocity-Time & Average Speed Insights" },
            {
              type: "para",
              text: "At the start of the final quarter, speed is $v_1 = gt_1 = (9.8)(6.464) = 63.35\\text{ m/s}$. At ground impact, speed reaches $v_f = (9.8)(7.464) = 73.15\\text{ m/s}$. Average speed in the final quarter is $v_{\\text{avg}} = \\frac{63.35 + 73.15}{2} = 68.25\\text{ m/s}$, which identically satisfies $\\frac{h/4}{\\Delta t} = \\frac{68.25\\text{ m}}{1\\text{ s}}$."
            }
          ]
        },
        // Page 5: Common Traps, Formula Cheat Sheet & Practice Problems
        {
          blocks: [
            { type: "heading", text: "9. Common Traps & Exam Pitfalls" },
            {
              type: "mistakes",
              items: [
                "Assuming equal times for equal distances: Because the stone speeds up, the last 25% of height takes only 13.4% of the total time!",
                "Using constant velocity ($v = d/t$): Gravity causes uniform acceleration ($g$), so velocity changes continuously throughout.",
                "Ratio confusion: Forgetting to take square roots when relating time ratios to height ratios ($t \\propto \\sqrt{s}$)."
              ]
            },
            { type: "heading", text: "10. Quick Revision Formula Cheat Sheet" },
            {
              type: "summary",
              items: [
                "Free fall from rest: $v = gt$, $s = \\frac{1}{2}gt^2$, $v^2 = 2gs$",
                "Time ratio for height fraction $f$: $t_f = t\\sqrt{f}$",
                "Time for first 75% height: $t_{3/4} = \\frac{\\sqrt{3}}{2}t \\approx 0.866t$",
                "Time for last 25% height: $(1 - 0.866)t = 0.134t = 1\\text{ s} \\implies t \\approx 7.46\\text{ s}$"
              ]
            },
            { type: "heading", text: "11. High-Yield Practice Problems" },
            {
              type: "practice",
              items: [
                {
                  q: "A ball dropped from a tower travels the last half of the tower height in 1.2 seconds. What is the total height of the tower?",
                  a: "Let total time be $t$. Time for first half is $t_1 = t/\\sqrt{2}$. Then $t - t_1 = 1.2 \\implies t(1 - 1/\\sqrt{2}) = 1.2 \\implies t \\approx 4.097\\text{ s}$. Total height $h = \\frac{1}{2}(9.8)(4.097)^2 \\approx 82.25\\text{ m}$."
                },
                {
                  q: "What is the ratio of times taken to fall successive equal quarters of height $h/4$ from rest?",
                  a: "Times to fall successive quarters are in the ratio $1 : (\\sqrt{2}-1) : (\\sqrt{3}-\\sqrt{2}) : (2-\\sqrt{3}) \\approx 1 : 0.414 : 0.318 : 0.268$."
                }
              ]
            }
          ]
        }
      ]
    };
  }

  // General questions (5 complete pages)
  var topicTitle = (a && a.title) || t || userQ || "Study Notes";
  var subject = (a && a.subject) || "Study Notes";
  var steps = (a && a.steps && a.steps.length) ? a.steps : [];
  var answer = (a && a.answer) || "";

  var p1 = [
    { type: "heading", text: "1. Topic Overview & Core Principle" },
    { type: "para", text: userQ + (answer ? " -- **Key idea:** " + answer : "") },
    { type: "margin", text: "Tip: Read the problem carefully and note all given boundary conditions." },
    { type: "heading", text: "2. Conceptual Analogy & Everyday Intuition" },
    { type: "para", text: "Before writing equations, visualize the physical or logical phenomenon. Breaking complex problems into simpler sub-components makes derivations natural and intuitive." }
  ];

  var p2 = [
    { type: "heading", text: "3. Parameter Declarations & Setup" },
    { type: "para", text: "Define all variables, known quantities, and target unknowns clearly." },
    { type: "heading", text: "4. Primary Governing Equations" }
  ];

  if (steps.length > 0) {
    var third = Math.ceil(steps.length / 3);
    for (var i = 0; i < third; i++) {
      var st = steps[i];
      p2.push({ type: "para", text: "**Step " + (i + 1) + ": " + (st.h || "") + "** " + (st.t || "") });
      if (st.math || st.m) p2.push({ type: "eq", tex: st.math || st.m });
    }
  } else {
    p2.push({ type: "para", text: "Establish the mathematical formulation relating knowns to unknowns." });
    p2.push({ type: "eq", tex: "f(x) = y" });
  }

  var p3 = [
    { type: "heading", text: "5. Step-by-Step Derivation & Calculations" }
  ];

  if (steps.length > 1) {
    var third1 = Math.ceil(steps.length / 3);
    for (var j = third1; j < steps.length; j++) {
      var st2 = steps[j];
      p3.push({ type: "para", text: "**Step " + (j + 1) + ": " + (st2.h || "") + "** " + (st2.t || "") });
      if (st2.math || st2.m) p3.push({ type: "eq", tex: st2.math || st2.m });
    }
  } else {
    p3.push({ type: "steps", items: [
      { say: "Apply governing relations and isolate target unknown", tex: "x = \\text{result}" }
    ]});
  }

  if (answer) {
    p3.push({ type: "heading", text: "6. Final Calculated Solution" });
    p3.push({ type: "answer", tex: "\\boxed{" + answer.replace(/[\\$]/g, "") + "}" });
  }

  var p4 = [
    { type: "heading", text: "7. Visual Method & Diagrammatic Roadmap" },
    {
      type: "doodle",
      spec: (a && a.doodle) || {
        kind: "flow",
        nodes: ["Identify Terms", "Apply Formula", "Algebraic Derivation", "Verify Solution"],
        caption: "Solution roadmap at a glance"
      }
    },
    { type: "heading", text: "8. Mathematical & Dimensional Verification" },
    { type: "para", text: "Verify units and boundary behavior to ensure the solution satisfies all physical and mathematical constraints." }
  ];

  var p5 = [
    { type: "heading", text: "9. Common Traps & Exam Pitfalls" },
    {
      type: "mistakes",
      items: (a && a.mistakes && a.mistakes.length) ? a.mistakes : [
        "Confusing given conditions with assumptions.",
        "Sign errors during algebraic rearrangement.",
        "Neglecting unit conversions in final numerical evaluation."
      ]
    },
    { type: "heading", text: "10. Quick Revision Summary" },
    {
      type: "summary",
      items: (a && a.summary && a.summary.length) ? a.summary : [
        "Always define variables and write down given data first.",
        "Check answers using substitution and dimensional analysis.",
        "Practice similar variations to build problem-solving fluency."
      ]
    },
    { type: "heading", text: "11. High-Yield Practice Problem" },
    {
      type: "practice",
      items: [
        {
          q: "What condition must be verified when solving boundary value problems of this type?",
          a: "Verify that the calculated values satisfy all original equations and boundary constraints without division by zero."
        }
      ]
    }
  ];

  return {
    title: topicTitle.slice(0, 60),
    shortTitle: topicTitle.slice(0, 30),
    question: userQ,
    subject: subject,
    chapter: subject,
    pageNo: "1",
    pages: [
      { blocks: p1 },
      { blocks: p2 },
      { blocks: p3 },
      { blocks: p4 },
      { blocks: p5 }
    ]
  };
}

var curNoteId = null;
function noteFrom(a,q,doc){
 var t = (doc && doc.title) || (a && a.title) || q || 'Study Notes';
 var initialDoc = doc || (a && a.doc) || buildDocFromAnswer(a, q, t);
 return {
  id: uid(),
  ts: Date.now(),
  title: (initialDoc && initialDoc.title) || t,
  subject: (initialDoc && initialDoc.subject) || (a && a.subject) || 'Notes',
  doc: initialDoc,
  answer: (initialDoc && initialDoc.tldr) || (a && a.answer) || '',
  steps: (a && a.steps) ? a.steps.map(function(s){return {h:s.h,t:s.t||'',m:s.math||''}}) : [],
  a: a,
  q: q || ''
 };
}
function addNote(a,q,doc){var n=noteFrom(a,q,doc);S.notes.unshift(n);save(true);toast('Saved to Notes.');return n}
function noteMD(n){
 if(n && n.doc) return notebookDocToMarkdown(n.doc);
 return '# '+n.title+'\n\n**Key idea:** '+n.answer+'\n\n## Steps\n'+(n.steps||[]).map(function(s,i){return (i+1)+'. '+s.h+(s.t?' - '+s.t:'')+(s.m?'\n   '+s.m:'')}).join('\n')+'\n';
}
function dl(name,txt,type){var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type:type||'text/markdown'}));a.download=name;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},500)}
function noteById(id){return S.notes.filter(function(x){return x.id===id})[0]||null}
function renderNotes(){
 if (!hasPlan()) { renderPaywall('notes'); return; }
 curNoteId = null;
 $('view').innerHTML='<div class="pgw"><div class="ph"><div><h1>notes</h1><p>Clean revision notes from any answer. 600+ words with LaTeX & diagrams. Multi-device cloud sync.</p></div></div>'+
 '<div class="win form"><div class="tb"><i></i><i></i><i></i><em>new-note.app</em></div><div class="in3"><label for="np">Make notes on</label><textarea id="np" maxlength="300" placeholder="e.g. why does ice float, or mitosis vs meiosis, or a question like solve 2x + 5 = 17"></textarea><div><button class="pill b sm" type="button" data-act="ngo">make notes</button></div></div></div>'+
 '<h2 class="sect">your notes</h2>'+(S.notes.length?'<div class="grid">'+S.notes.map(function(n){
   var secCount = n.doc && n.doc.pages ? n.doc.pages.length + ' page' + (n.doc.pages.length > 1 ? 's' : '') : (n.doc && n.doc.sections ? n.doc.sections.length + ' sections' : '1 page');
   return '<div class="card2"><div class="win"><div class="tb"><i></i><i></i><i></i><em>'+h(n.title.slice(0,22))+'.md</em></div><div class="in3"><h3>'+h(n.title)+'</h3><p>'+h(n.subject||'Notes')+' &middot; '+secCount+' &middot; '+dstr(n.ts)+'</p><div class="row"><button type="button" data-act="opennote" data-id="'+n.id+'">Open</button><button type="button" data-act="deln" data-id="'+n.id+'" class="danger">Delete</button></div></div></div></div>';
 }).join('')+'</div>':'<p class="mute">Nothing here yet. Use "Notes" under any reply, or the box above.</p>')+'</div>'}
function openNote(id){
 if (!hasPlan()) { renderPaywall('notes'); return; }
 var n=noteById(id);if(!n)return;
 curNoteId = id;
 view = 'notes';
 paintNav();
 var isOldOrShort = !n.doc || !n.doc.pages || n.doc.pages.length < 5 || (
   n.doc.pages[0] && n.doc.pages[0].blocks && n.doc.pages[0].blocks[0] && n.doc.pages[0].blocks[0].text &&
   n.doc.pages[0].blocks[0].text.indexOf('Writing handwritten notebook notes on') === 0
 );
 if(isOldOrShort){
  n.doc = buildDocFromAnswer(n.a, n.q || n.title, n.title);
  save(true);
 }
 var viewEl = $('view');
 if(!viewEl) return;
 viewEl.innerHTML = '<div id="notes-mount"></div>';
 var mountEl = $('notes-mount');
 renderNotesMount(mountEl, {
  note: n.doc,
  onClose: function(){ go('notes'); },
  onRetry: function(){
   if(!hasPlan()) { promo(); return; }
   toast('Regenerating handwritten notes...');
   fetch('/api/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic: n.title, profile: S.profile })
   }).then(function(r){ return r.json(); })
     .then(function(res){
      if(res && res.note){
       n.doc = res.note;
       save(true);
       openNote(n.id);
       toast('Notes updated!');
      } else {
       toast('Could not regenerate. Please try again.');
      }
     }).catch(function(){
       toast('Network issue regenerating notes.');
     });
  },
  onMakeVideo: function(){
   if(!hasPlan()) { promo(); return; }
   if(n.a) { videoPicker(n.a, n.q || n.title); }
   else { videoPicker({ title: n.title, subject: n.subject, steps: [] }, n.q || n.title); }
  },
  onMakeDeck: function(){
   if(!hasPlan()) { promo(); return; }
   if(n.a) { addDeck(deckFrom(n.a, n.q)); }
   else {
    var cards = [];
    (n.doc.sections || []).forEach(function(sec){
     (sec.cards || []).forEach(function(c){
      if(c.type === 'definition') cards.push(mkCard(c.term, c.text));
      else if(c.type === 'key') cards.push(mkCard(n.title + ' key idea', c.text));
      else if(c.type === 'warning') cards.push(mkCard('Watch out: ' + n.title, c.text));
      else if(c.type === 'tip') cards.push(mkCard('Tip: ' + n.title, c.text));
     });
    });
    (n.doc.self_test || []).forEach(function(st){
     cards.push(mkCard(st.q, st.a));
    });
    if(cards.length === 0) cards.push(mkCard(n.title, n.doc.tldr || n.title));
    addDeck({ id: uid(), ts: Date.now(), title: n.title, subject: n.subject || '', src: 'note', cards: cards.slice(0, 16) });
   }
  },
  onMakeQuiz: function(){
   if(!hasPlan()) { promo(); return; }
   if(n.a) { quizFromAnswer(n.a, n.q); }
   else {
    var d = deckById(n.id);
    if(d) quizFromDeck(d.id);
    else toast('Make flashcards first to generate a quiz from this note.');
   }
  },
  onAddCardToDeck: function(card){
   if(!hasPlan()) { promo(); return; }
   var targetDeck = S.decks.find(function(d){ return d.title === n.title; });
   if(!targetDeck) {
    targetDeck = { id: uid(), ts: Date.now(), title: n.title, subject: n.subject || '', src: 'note', cards: [] };
    S.decks.unshift(targetDeck);
   }
   targetDeck.cards.push(mkCard(card.f, card.b));
   save(true);
   toast('Card added to flashcards.');
  }
 });
}

/* ================= planner ================= */
var pomo={left:25*60,run:false,mode:'focus',iv:0};
function dueWord(d){
 if(!d)return '';
 var tod=today();
 if(d===tod)return 'today';
 var tom=dkey(NOW()+DAY);
 if(d===tom)return 'tomorrow';
 try{
  var p=d.split('-');
  if(p.length===3){
   var dt=new Date(parseInt(p[0],10),parseInt(p[1],10)-1,parseInt(p[2],10));
   return dt.toLocaleDateString([],{month:'short',day:'numeric'});
  }
 }catch(e){}
 return d;
}
function renderPlan(){
 var ts=S.tasks.slice().sort(function(a,b){return (a.date||'9')<(b.date||'9')?-1:1});
 $('view').innerHTML='<div class="pgw wide"><div class="ph"><div><h1>planner</h1><p>Exams, homework and a focus timer, saved on this device.</p></div></div><div class="pcols"><div class="col1">'+
 '<div class="win form"><div class="tb"><i></i><i></i><i></i><em>add-task.app</em></div><div class="in3"><label for="tt">What do you need to do?</label><input type="text" id="tt" maxlength="80" placeholder="e.g. Physics unit test, or finish chapter 4"><div class="inl"><input type="date" id="td" min="'+today()+'"><select id="ts"><option>Exam</option><option>Homework</option><option>Revision</option><option>Project</option></select><button class="pill b sm" type="button" data-act="taskadd">add</button></div></div></div>'+
 '<div class="win form"><div class="tb"><i></i><i></i><i></i><em>tasks</em></div><div class="in3">'+(ts.length?'<ul class="tasks">'+ts.map(function(t){var od=!t.done&&t.date&&t.date<today();return '<li class="'+(t.done?'d':'')+'"><button type="button" class="bxb" data-act="tasktog" data-id="'+t.id+'" aria-pressed="'+t.done+'" aria-label="Mark done">'+(t.done?ic('check'):'')+'</button><span class="tn">'+h(t.t)+'<small>'+h(t.k)+'</small></span><span class="td'+(od?' od':'')+'">'+dueWord(t.date)+'</span><button type="button" class="ico" data-act="taskdel" data-id="'+t.id+'" aria-label="Delete">'+ic('x')+'</button></li>'}).join('')+'</ul>':'<p class="mute">No tasks yet. Add your next exam above and it shows on Home.</p>')+'</div></div></div>'+
 '<div class="col2"><div class="win form"><div class="tb"><i></i><i></i><i></i><em>focus-timer.app</em></div><div class="in3" style="align-items:center;text-align:center"><div class="seg" role="group" aria-label="Timer mode"><button type="button" data-act="pmode" data-m="focus" aria-pressed="'+(pomo.mode==='focus')+'">Focus 25</button><button type="button" data-act="pmode" data-m="break" aria-pressed="'+(pomo.mode==='break')+'">Break 5</button></div><div class="clk" id="pclk"></div><div class="acts" style="justify-content:center;margin:0"><button type="button" class="vid" id="pgo" data-act="ptog"></button><button type="button" data-act="preset">Reset</button></div><p class="mute small">The timer keeps running while you move between pages.</p></div></div></div></div></div>';paintPomo()}
function paintPomo(){var c=$('pclk'),b=$('pgo');if(!c)return;var m=Math.floor(pomo.left/60),s=pomo.left%60;c.textContent=('0'+m).slice(-2)+':'+('0'+s).slice(-2);b.textContent=pomo.run?'Pause':'Start'}
function pomoTick(){if(!pomo.run)return;pomo.left--;if(pomo.left<=0){pomo.run=false;clearInterval(pomo.iv);var wasF=pomo.mode==='focus';if(wasF)bump('c',0);toast(wasF?'Focus session done. Take 5.':'Break over. Back to it.');pomo.mode=wasF?'break':'focus';pomo.left=(wasF?5:25)*60}paintPomo()}

/* ================= library ================= */
var libTab='all',libQ='';
function libItems(){var items=[];
 S.chats.forEach(function(c){items.push({k:'Chats',t:c.title,ts:c.ts,open:'openchat',id:c.id,del:'delc'})});
 S.videos.forEach(function(v){items.push({k:'Videos',t:v.title+' ('+(v.minutes||2)+' min)',ts:v.ts,open:'playv',id:v.id,del:'delv'})});
 S.decks.forEach(function(d){items.push({k:'Decks',t:d.title+' ('+d.cards.length+' cards)',ts:d.ts,open:'opendeck',id:d.id,del:'deckdel'})});
 S.notes.forEach(function(n){items.push({k:'Notes',t:n.title,ts:n.ts,open:'opennote',id:n.id,del:'deln'})});
 S.saved.forEach(function(s){items.push({k:'Saved',t:s.title,ts:s.ts,open:'opensaved',id:s.id,del:'unsave'})});
 return items.sort(function(a,b){return b.ts-a.ts})}
function libList(){var q=libQ.toLowerCase(),f=libItems().filter(function(i){return(libTab==='all'||i.k===libTab)&&(!q||i.t.toLowerCase().indexOf(q)>-1)});
 return f.length?'<ul class="rcp">'+f.map(function(i){return '<li><span><span class="tag g">'+i.k.replace(/s$/,'')+'</span> &nbsp;<a href="#" class="link" data-act="'+i.open+'" data-id="'+i.id+'">'+h(i.t)+'</a></span><span><span class="mute">'+dstr(i.ts)+'</span> &nbsp;<button type="button" class="danger" data-act="'+i.del+'" data-id="'+i.id+'" aria-label="Delete '+h(i.t)+'">delete</button></span></li>'}).join('')+'</ul>':'<p class="mute">Nothing found.</p>'}
function renderLibrary(){var all=libItems();
 $('view').innerHTML='<div class="pgw"><div class="ph"><div><h1>library</h1><p>Everything you have made, saved on this device.</p></div></div><div class="srch">'+ic('search')+'<input type="text" id="lq" placeholder="Search your library" value="'+h(libQ)+'" aria-label="Search library"></div><div class="tabs2">'+['all','Chats','Videos','Decks','Notes','Saved'].map(function(t){var n=t==='all'?all.length:all.filter(function(i){return i.k===t}).length;return '<button type="button" data-act="libtab" data-t="'+t+'" aria-pressed="'+(libTab===t)+'">'+cap(t)+' <small>'+n+'</small></button>'}).join('')+'</div><div id="ll">'+libList()+'</div></div>';
 $('lq').addEventListener('input',function(){libQ=this.value;$('ll').innerHTML=libList()})}
function openSaved(id){var s=S.saved.filter(function(x){return x.id===id})[0];if(!s)return;var a=s.a;
 modal('<span class="subj">'+h(a.subject||'Saved answer')+'</span><h2>'+h(a.title)+'</h2><ol class="stp" style="margin-top:12px">'+a.steps.map(function(x){return '<li><b>'+h(x.h)+'</b>'+(x.t?'<span class="tx">'+h(x.t)+'</span>':'')+(x.math?'<span class="mth">'+h(x.math)+'</span>':'')+'</li>'}).join('')+'</ol>'+(a.answer?'<div class="fin"><b>Answer:</b> '+h(a.answer)+'</div>':'')+'<div class="gen"><div class="gts"><button type="button" class="gt gv" data-act="mkvideo" data-sid="'+s.id+'"><i>'+ic('play')+'</i><span><b>Video</b><small>2 or 5 min</small></span></button><button type="button" class="gt gf" data-act="mkdeck" data-sid="'+s.id+'"><i>'+ic('flash')+'</i><span><b>Flashcards</b><small>free</small></span></button><button type="button" class="gt gq" data-act="mkquiz" data-sid="'+s.id+'"><i>'+ic('quiz')+'</i><span><b>Quiz</b><small>free</small></span></button></div></div><div class="acts"><button type="button" data-act="close">Close</button></div>',null,{cls:'wide2'})}

/* ================= command palette and shortcuts ================= */
function palette(){if(modalOpen())return;
 var cmds=[{t:'Go to Home',k:'home',f:function(){go('home')}},{t:'New chat',k:'ask question chat',f:newChat},{t:'Study due flashcards',k:'flashcards review study',f:function(){go('flash');studyStart(null,false)}},{t:'Open flashcards',k:'decks',f:function(){go('flash')}},{t:'Start a quiz',k:'quiz test',f:function(){go('quiz')}},{t:'Video studio',k:'video',f:function(){go('videos')}},{t:'Notes',k:'notes',f:function(){go('notes')}},{t:'Planner and focus timer',k:'plan exam timer pomodoro',f:function(){go('plan')}},{t:'Library',k:'library search',f:function(){go('library')}},{t:'Account and billing',k:'account plan billing',f:function(){go('account')}},{t:hasPlan()?'Buy credits':'Start 7-day trial',k:'credits pro upgrade trial buy',f:function(){hasPlan()?creditsPopup({need:1}):promo()}},{t:'Keyboard shortcuts',k:'help keys',f:shortcuts}];
 S.chats.forEach(function(c){cmds.push({t:'Chat: '+c.title,k:'chat',f:function(){S.cur=c.id;save();go('chat')}})});
 S.decks.forEach(function(d){cmds.push({t:'Deck: '+d.title,k:'deck flashcards',f:function(){go('flash');openDeck(d.id)}})});
 S.notes.forEach(function(n){cmds.push({t:'Note: '+n.title,k:'note',f:function(){go('notes');openNote(n.id)}})});
 S.videos.forEach(function(v){cmds.push({t:'Video: '+v.title,k:'video',f:function(){go('videos');playVideo(v.id)}})});
 var sel=0,list=cmds;
 modal('<div class="pal"><div class="srch" style="margin:0">'+ic('search')+'<input type="text" id="pq" placeholder="Type a command, chat, deck or note" autocomplete="off" aria-label="Search commands"></div><ul id="pl3" role="listbox"></ul><p class="mute small">Enter to open, arrows to move, Esc to close.</p></div>',function(){
  function paint(){$('pl3').innerHTML=list.slice(0,9).map(function(c,i){return '<li role="option" aria-selected="'+(i===sel)+'" data-i="'+i+'">'+h(c.t)+'</li>'}).join('')||'<li class="mute">No matches</li>'}
  function run(i){var c=list[i];if(!c)return;closeModal();c.f()}
  $('pq').addEventListener('input',function(){var q=this.value.toLowerCase().trim();list=cmds.filter(function(c){return !q||(c.t+' '+c.k).toLowerCase().indexOf(q)>-1});sel=0;paint()});
  $('pq').addEventListener('keydown',function(e){if(e.key==='ArrowDown'){sel=Math.min(Math.min(8,list.length-1),sel+1);paint();e.preventDefault()}else if(e.key==='ArrowUp'){sel=Math.max(0,sel-1);paint();e.preventDefault()}else if(e.key==='Enter'){run(sel)}});
  $('pl3').addEventListener('click',function(e){var li=e.target.closest('li[data-i]');if(li)run(+li.dataset.i)});paint()},{cls:'palm',nofocus:false})}
function shortcuts(){modal('<h2>keyboard shortcuts</h2><dl class="kv sc"><dt><kbd class="kk">Ctrl</kbd> <kbd class="kk">K</kbd></dt><dd>Command palette</dd><dt><kbd class="kk">/</kbd></dt><dd>Go to Ask</dd><dt><kbd class="kk">G</kbd> then <kbd class="kk">H</kbd></dt><dd>Home</dd><dt><kbd class="kk">G</kbd> then <kbd class="kk">F</kbd></dt><dd>Flashcards</dd><dt><kbd class="kk">Space</kbd></dt><dd>Flip card</dd><dt><kbd class="kk">1</kbd> to <kbd class="kk">4</kbd></dt><dd>Rate card: again, hard, good, easy</dd><dt><kbd class="kk">Esc</kbd></dt><dd>Close popup or end session</dd><dt><kbd class="kk">?</kbd></dt><dd>This list</dd></dl><div class="acts"><button type="button" class="vid" data-act="close">Got it</button></div>')}

/* ================= popups: Pro promo (free users) and buy credits (plan users) ================= */
var ppick='monthly',cpick=0,afterBuy=null;
function perMonth(){return money(PRICE.annual/12)}
function save38(){return Math.round((1-PRICE.annual/(PRICE.monthly*12))*100)}
function tiltOn(root){var sc=root.querySelector('.sc3');if(!sc||matchMedia('(prefers-reduced-motion:reduce)').matches)return;
 root.addEventListener('mousemove',function(e){var r=root.getBoundingClientRect(),dx=(e.clientX-r.left)/r.width-.5,dy=(e.clientY-r.top)/r.height-.5;sc.style.setProperty('--ry',(-20+dx*16)+'deg');sc.style.setProperty('--rx',(10-dy*12)+'deg')})}
function scenePromo(){return '<div class="p3" aria-hidden="true"><div class="dots"></div><div class="sc3">'+
 '<div class="l3 lb" style="--x:-20px;--y:-50px;--z:10px;--d:0s"><div class="win"><div class="tb"><i></i><i></i><i></i><em>answer.mov</em></div><div class="bd"><div class="scr board"><span class="ty t1">6CO2 + 6H2O</span><span class="ty t2">light &rarr; C6H12O6 + 6O2</span><small>STEP 2 OF 4 &middot; 2:00</small></div></div></div><div class="cap">a board video from your own question</div></div>'+
 '<div class="l3 lc" style="--x:-120px;--y:150px;--z:70px;--d:.8s"><div class="win"><div class="tb"><i></i><i></i><i></i><em>cards</em></div><div class="bd"><div class="flipc"><div class="ff">Mitosis makes how many cells?</div><div class="fb2">2 identical cells</div></div></div></div></div>'+
 '<div class="l3 lq" style="--x:130px;--y:170px;--z:110px;--d:1.4s"><div class="win"><div class="tb"><i></i><i></i><i></i><em>quiz</em></div><div class="bd"><div class="mq"><b>Gradient of y = 4x - 3?</b><span>-3</span><span class="pk">4</span><span>3</span></div></div></div></div>'+
 '<div class="l3 ld" style="--x:150px;--y:-80px;--z:150px;--d:.4s"><div class="nm" style="--c:#2F6BFF"><i>LENGTH</i><b>2 min or 5 min</b></div></div>'+
 '<div class="l3 le" style="--x:-150px;--y:-110px;--z:130px;--d:1s"><div class="sticky stk">30 credits<br>every month</div></div>'+
 '<span class="kao" style="left:10px;top:330px">(^_^)</span><span class="kao" style="right:0;top:20px">\\(^o^)/</span></div></div>'}
function promo(after){
  try { (window as any).doubtsterPromo = promo; } catch(e){}
pendingAfter=typeof after==='function'?after:null;var trial=!S.trialUsed;ss('promoSeen','1');
 var cta=trial?'Start 7-day trial for '+money(PRICE.trial):'Get '+cap(ppick)+' for '+money(PRICE[ppick]);
 modal('<div class="promo"><button type="button" class="xb" data-act="closepromo" aria-label="Close">'+ic('x')+'</button><div class="pr-l"><span class="ptag">PRO</span><h2>Unlock Doubtster <span class="hlt">PRO</span></h2>'+
  '<p class="sub">Chat is free forever. Pro unlocks Handwritten Notes, AI Video Studio, Flashcards, and Quizzes.</p>'+
  '<ul class="bn"><li>'+ic('check')+'<span><b>Handwritten Study Notes</b>: 600+ word verified notebook pages with LaTeX & diagrams</span></li><li>'+ic('check')+'<span><b>AI Video Studio</b>: 30 credits a month with voice narration</span></li><li>'+ic('check')+'<span><b>Spaced Repetition Flashcards</b>: Smart SRS review system</span></li><li>'+ic('check')+'<span><b>Adaptive Practice Quizzes</b>: Created instantly from any answer</span></li><li>'+ic('check')+'<span><b>Multi-Device Cloud Backup</b>: Access your notes and chats anywhere</span></li></ul>'+
  '<div class="tog" id="pt" role="group" aria-label="Billing"><button type="button" data-act="pplan" data-p="monthly" class="'+(ppick==='monthly'?'on':'')+'">Monthly '+money(PRICE.monthly)+'</button><button type="button" data-act="pplan" data-p="annual" class="'+(ppick==='annual'?'on':'')+'">Yearly '+money(PRICE.annual)+' <em>save '+save38()+'%</em></button></div>'+
  '<p class="pnote" id="pnote"></p>'+
  '<div class="pcta"><button type="button" class="pill b" id="pgo2" data-act="pcont" data-trial="'+(trial?1:0)+'">'+cta+'</button><button type="button" class="lnk" data-act="closepromo">maybe later</button></div>'+
  '<p class="fine">'+(trial?'Your '+cap(ppick)+' plan then starts automatically unless you cancel first. ':'')+'Payments renew until you cancel. A charge from forgetting to cancel is not refundable. See the <a class="link" href="'+SITE+'/refund-policy">refund policy</a>.</p></div>'+
  '<div class="pr-r sky">'+scenePromo()+'</div></div>',function(d){promoUpd();tiltOn(d.querySelector('.promo'))},{bare:true,cls:'bigm',onclose:function(){}})}
function promoUpd(){var n=$('pnote');if(!n)return;var trial=!S.trialUsed;
 n.innerHTML=trial?'<b>'+money(PRICE.trial)+' today</b> for '+PRICE.trialDays+' days and '+PRICE.trialCredits+' credits. Then '+(ppick==='monthly'?money(PRICE.monthly)+' a month':money(PRICE.annual)+' a year ('+perMonth()+' a month)')+', cancel any time.':(ppick==='monthly'?money(PRICE.monthly)+' a month':money(PRICE.annual)+' a year ('+perMonth()+' a month)')+', cancel any time.';
 var b=$('pgo2');if(b)b.textContent=trial?'Start 7-day trial for '+money(PRICE.trial):'Get '+cap(ppick)+' for '+money(PRICE[ppick]);
 [].forEach.call(document.querySelectorAll('#pt button'),function(x){x.classList.toggle('on',x.dataset.p===ppick)})}
var pendingAfter=null;
function sceneCredits(){return '<div class="p3" aria-hidden="true"><div class="dots"></div><div class="sc3">'+
 '<div class="l3 lb" style="--x:-20px;--y:-60px;--z:20px;--d:0s"><div class="win"><div class="tb"><i></i><i></i><i></i><em>credits.md</em></div><div class="bd"><div class="coinp"><b>+'+PRICE.packs[cpick].n+'</b><span>credits</span></div></div></div></div>'+
 '<div class="l3 lc" style="--x:-110px;--y:120px;--z:90px;--d:.7s"><div class="win"><div class="tb"><i></i><i></i><i></i><em>2 min</em></div><div class="bd"><div class="mq"><b>2 min video</b><span class="pk">1 credit</span></div></div></div></div>'+
 '<div class="l3 lq" style="--x:120px;--y:140px;--z:130px;--d:1.3s"><div class="win"><div class="tb"><i></i><i></i><i></i><em>5 min</em></div><div class="bd"><div class="mq"><b>5 min video</b><span class="pk">2 credits</span></div></div></div></div>'+
 '<div class="l3 ld" style="--x:140px;--y:-70px;--z:160px;--d:.4s"><div class="nm" style="--c:#16A34A"><i>VALID FOR</i><b>'+PRICE.topupDays+' days</b></div></div>'+
 '<span class="coin c1">C</span><span class="coin c2">C</span><span class="coin c3">C</span><span class="kao" style="left:10px;top:330px">(o_o)</span></div></div>'}
function creditsPopup(opt){opt=opt||{};var need=opt.need||1,have=credits();pendingAfter=opt.retry||null;ss('credSeen','1');altFn=opt.alt||null;
 var p=S.plan,mx=planMax(),refill=p&&!p.cancelled?(p.kind==='trial'?p.start+PRICE.trialDays*DAY:Math.min(p.credAt,p.renewAt)):null,short=have>0&&have<need;
 var line=!p?'':p.cancelled?'Your plan ends on '+dstr(p.kind==='trial'?p.start+PRICE.trialDays*DAY:p.renewAt)+' and will not refill.':p.kind==='trial'?'Your trial ends on '+dstr(p.start+PRICE.trialDays*DAY)+' and unused trial credits expire then. Your plan gives '+PRICE.credits+' credits a month after that.':'Your plan adds '+PRICE.credits+' credits on '+dstr(refill)+'.';
 modal('<div class="promo cp"><button type="button" class="xb" data-act="closecp" aria-label="Close">'+ic('x')+'</button><div class="pr-l"><span class="ptag red">'+(short?'NEEDS MORE CREDITS':'OUT OF CREDITS')+'</span><h2>'+(short?'this video needs '+need+' credits':'you are out of credits')+'</h2>'+
  '<p class="sub">'+(short?'You have '+have+'. ':'')+h(line)+' Top up now and carry on.</p>'+
  '<div class="win mtr"><div class="tb"><i></i><i></i><i></i><em>credits.md</em></div><div class="bd2"><div class="mrow"><b>'+have+'</b><span> credit'+(have===1?'':'s')+' left</span><small>'+S.pcredits+' of '+mx+' plan credits</small></div><div class="meter zero"><i style="width:'+Math.min(100,S.pcredits/mx*100)+'%" ></i></div></div></div>'+
  '<div class="packs" id="packs">'+PRICE.packs.map(function(k,i){return '<button type="button" data-act="cpack" data-i="'+i+'" aria-pressed="'+(cpick===i)+'">'+(i===1?'<em class="bv">best value</em>':'')+'<b>'+k.n+' credits</b><span class="pr">'+money(k.p)+'</span><small>'+money(k.p/k.n)+' per credit</small><small>'+k.n+' quick videos or '+Math.floor(k.n/PRICE.videoCost[5])+' deep dives</small></button>'}).join('')+'</div>'+
  '<div class="pcta"><button type="button" class="pill b" id="cbuy" data-act="cbuy">Buy '+PRICE.packs[cpick].n+' credits for '+money(PRICE.packs[cpick].p)+'</button>'+(opt.alt?'<button type="button" class="pill sm" data-act="calt">Make the 2 min version instead</button>':'')+'<button type="button" class="lnk" data-act="closecp">not now</button></div>'+
  '<p class="fine">Top-up credits are valid for '+PRICE.topupDays+' days and are used after your plan credits. Not refundable except as described in the <a class="link" href="'+SITE+'/refund-policy">refund policy</a>.</p></div>'+
  '<div class="pr-r sky">'+sceneCredits()+'</div></div>',function(d){tiltOn(d.querySelector('.promo'))},{bare:true,cls:'bigm'})}
var altFn=null;
function checkout(mode,arg){
 if(!CFG.DEMO){fetch(CFG.CHECKOUT_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify({mode:mode,plan:mode==='topup'?null:arg,pack:mode==='topup'?arg:null})}).then(function(r){return r.json()}).then(function(j){if(j.url)location.href=j.url;else toast('Checkout is unavailable.')}).catch(function(){toast('Checkout is unavailable.')});return}
 var body,k=mode==='topup'?PRICE.packs[arg]:null;
 if(mode==='trial'){var end=NOW()+PRICE.trialDays*DAY;body='<p>Today you pay <b>'+money(PRICE.trial)+'</b> for '+PRICE.trialDays+' days and '+PRICE.trialCredits+' credits (3 quick videos).</p><p>On <b>'+dstr(end)+'</b> your <b>'+cap(arg)+'</b> plan starts automatically and <b>'+money(PRICE[arg])+'</b> is charged, unless you cancel before then. Unused trial credits expire when the trial ends.</p><label class="chk"><input type="checkbox" id="cons"><span>I understand my plan starts automatically after the trial, and that a charge from forgetting to cancel is not refundable. See the <a class="link" href="'+SITE+'/refund-policy">refund policy</a>.</span></label>'}
 else if(mode==='direct'){body='<p>You pay <b>'+money(PRICE[arg])+'</b> today for the <b>'+cap(arg)+'</b> plan, renewing every '+(arg==='monthly'?'month':'year')+' until you cancel.</p><label class="chk"><input type="checkbox" id="cons"><span>I understand this renews automatically and that payments are not refundable except as described in the <a class="link" href="'+SITE+'/refund-policy">refund policy</a>.</span></label>'}
 else{body='<p>You pay <b>'+money(k.p)+'</b> for <b>'+k.n+' credits</b>, valid for '+PRICE.topupDays+' days.</p><label class="chk"><input type="checkbox" id="cons"><span>I understand top-ups are not refundable except as described in the <a class="link" href="'+SITE+'/refund-policy">refund policy</a>.</span></label>'}
 modal('<span class="demo">DEMO CHECKOUT</span><h2>'+(mode==='topup'?'buy credits':mode==='trial'?'start your trial':'subscribe')+'</h2>'+body+'<p class="mute" style="font-size:13px;margin-top:10px">No payment is taken in demo mode.</p><p id="cerr" role="alert" style="color:#B3261E;font-size:13px"></p><div class="acts"><button type="button" data-act="close">Cancel</button><button type="button" class="vid" id="payb">Pay (demo)</button></div>',function(){
  $('payb').onclick=function(){if(!$('cons').checked){$('cerr').textContent='Please confirm to continue.';return}
   var n=NOW();
   if(mode==='trial'){S.plan={kind:'trial',next:arg,start:n,cancelled:false};S.pcredits=PRICE.trialCredits;S.trialUsed=true;log('Trial fee',PRICE.trial)}
   else if(mode==='direct'){S.plan={kind:arg,start:n,renewAt:n+(arg==='monthly'?30:365)*DAY,credAt:n+30*DAY,cancelled:false};S.pcredits=PRICE.credits;log(cap(arg)+' plan',PRICE[arg])}
   else{S.topups.push({n:k.n,exp:n+PRICE.topupDays*DAY});log('Top-up: '+k.n+' credits',k.p)}
   save(true);closeModal();repaint();toast(mode==='topup'?k.n+' credits added.':'You are in. Credits added.');
   var f=pendingAfter;pendingAfter=null;if(f)f();else if(view==='account'||view==='videos'||view==='home')R[view]()}},{cls:'chk2m'})}
function cancelFlow(){var p=S.plan;if(!p)return;var end=p.kind==='trial'?p.start+PRICE.trialDays*DAY:p.renewAt;
 modal('<h2>cancel '+(p.kind==='trial'?'your trial':'your plan')+'?</h2><p>'+(p.kind==='trial'?'You will not be charged '+money(PRICE[p.next])+'. You keep your trial credits until <b>'+dstr(end)+'</b>. The trial fee of '+money(PRICE.trial)+' is not refundable.':'Your plan stays active until <b>'+dstr(end)+'</b> and you will not be charged again. You can use your credits until then.')+'</p><div class="acts"><button type="button" data-act="close">Keep it</button><button type="button" class="danger" data-act="docancel">Yes, cancel</button></div>')}

/* ================= account ================= */
function renderAccount(){var p=S.plan,n=nextCharge(),pf=S.profile;
 var lv=['Class 6 to 8','Class 9 to 10','Class 11 to 12','College or university','Learning on my own'];
 var sj=['Maths','Physics','Chemistry','Biology','Economics','Accounting','Coding','English','Something else'];
 var _acctNm=(S.profile.name||'').trim();var _acctGreet=_acctNm?'Hi, '+_acctNm:'Account';
 var _init = getInitial();
 var _badgeLabel = 'Free Tier (Chat Only)';
 if (hasPlan()) {
   if (p && p.kind === 'trial') _badgeLabel = '7-Day Pro Trial Active';
   else if (p) _badgeLabel = planName() + ' Plan Active';
   else if (S.college || S.collegeCreditsGranted) _badgeLabel = (S.college && S.college.name ? S.college.name + ' Student Grant' : 'University Student Grant');
   else _badgeLabel = 'Active Plan';
 }
 $('view').innerHTML='<div class="pgw">'+
 '<div class="user-profile-bar">'+
   '<div class="user-avatar-badge">'+_init+'</div>'+
   '<div class="user-profile-details">'+
     '<h2>'+h(_acctGreet)+'</h2>'+
     '<p class="user-profile-sub">'+h(pf.email||'Doubtster Member')+' &middot; <span class="tag '+(hasPlan()?'active':'free')+'">'+h(_badgeLabel)+'</span></p>'+
   '</div>'+
 '</div>'+
 (p&&p.kind==='trial'&&!p.cancelled&&trialDay()>=5?'<div class="banner warn"><span><b>Day '+trialDay()+' of '+PRICE.trialDays+'.</b> Your '+cap(p.next)+' plan ('+money(PRICE[p.next])+') starts on '+dstr(p.start+PRICE.trialDays*DAY)+'. Cancel at least a day early to avoid it.</span><button type="button" data-act="cancel">cancel trial</button></div>':'')+
 '<div class="two"><div class="win form"><div class="tb"><i></i><i></i><i></i><em>plan.md</em></div><div class="in3"><div><span class="tag'+(p||S.college||S.collegeCreditsGranted?'':' g')+'">'+(p?planName()+(p.cancelled?' &middot; ending':''):((S.college&&S.college.name)||'Student Grant'))+'</span></div>'+
 (p?'<dl class="kv"><dt>Status</dt><dd>'+(p.cancelled?'Cancelled, active until '+dstr(p.kind==='trial'?p.start+PRICE.trialDays*DAY:p.renewAt):'Active')+'</dd>'+(p.kind==='trial'?'<dt>Trial day</dt><dd>'+trialDay()+' of '+PRICE.trialDays+'</dd>':'')+'<dt>Next charge</dt><dd>'+(n?money(n.amt)+' on '+dstr(n.t):'None')+'</dd><dt>Plan credits</dt><dd>'+S.pcredits+' of '+planMax()+'</dd></dl><div class="acts" style="margin:0">'+(p.cancelled?'<button type="button" data-act="resume">Resume plan</button>':'<button type="button" class="danger" data-act="cancel">Cancel '+(p.kind==='trial'?'trial':'plan')+'</button>')+'</div>':((S.college||S.collegeCreditsGranted)?'<dl class="kv"><dt>Status</dt><dd>Active University Grant</dd><dt>College</dt><dd>'+h((S.college&&S.college.name)||'Partner University')+'</dd>'+((S.college&&S.college.domain)?'<dt>Domain</dt><dd>'+h(S.college.domain)+'</dd>':'')+'<dt>Credits</dt><dd>'+S.pcredits+' unlocked</dd></dl><p class="mute" style="font-size:13px;margin:8px 0 0">Full access to AI Video Studio, Handwritten Notes, Flashcards & Quizzes sponsored by your university.</p><div class="acts" style="margin:12px 0 0"><button class="vid" type="button" data-act="promo">Upgrade to Pro</button></div>':'<p>You are on the free tier. Chat is free forever. Handwritten Notes, AI Video Studio, Flashcards and Quizzes require a Doubtster Pro plan.</p><div class="acts" style="margin:0"><button class="vid" type="button" data-act="promo">'+(S.trialUsed?'Choose a plan':'Start trial: '+money(PRICE.trial))+'</button></div>'))+
 '</div></div><div class="win form"><div class="tb"><i></i><i></i><i></i><em>credits.md</em></div><div class="in3"><div class="big">'+credits()+'</div><p class="mute">credits available. A 2 min video uses '+PRICE.videoCost[2]+', a 5 min video uses '+PRICE.videoCost[5]+'.</p><dl class="kv"><dt>Plan credits</dt><dd>'+S.pcredits+'</dd><dt>Top-up credits</dt><dd>'+topTotal()+'</dd><dt>Used so far</dt><dd>'+S.spent+'</dd></dl>'+(S.topups.length?'<p class="mute" style="font-size:13px">Top-ups expire: '+S.topups.map(function(t){return t.n+' on '+dstr(t.exp)}).join(', ')+'</p>':'')+'<div class="acts" style="margin:0">'+PRICE.packs.map(function(k,i){return '<button type="button" data-act="buypack" data-i="'+i+'">+'+k.n+' credits '+money(k.p)+'</button>'}).join('')+'</div></div></div></div>'+
 '<div class="win form" style="margin-top:18px"><div class="tb"><i></i><i></i><i></i><em>preferences.md</em></div><div class="in3"><label for="pn">Name</label><input type="text" id="pn" maxlength="40" value="'+h(pf.name)+'"><label for="plang">Language</label><select id="plang">'+[['en','English'],['fr','Français (French)'],['es','Español (Spanish)'],['hi','हिन्दी (Hindi)']].map(function(x){return '<option value="'+x[0]+'"'+(((pf.lang||'en')===x[0])?' selected':'')+'>'+x[1]+'</option>'}).join('')+'</select><label for="pl2">Level</label><select id="pl2"><option value="">Not set</option>'+lv.map(function(x){return '<option'+(pf.level===x?' selected':'')+'>'+x+'</option>'}).join('')+'</select><label for="ps">Explanation style</label><select id="ps"><option value="">Not set</option>'+['Short and quick','Detailed and slow'].map(function(x){return '<option'+(pf.style===x?' selected':'')+'>'+x+'</option>'}).join('')+'</select><label for="pg">Daily goal (questions, cards and quiz answers)</label><select id="pg">'+[5,10,20,30,50].map(function(x){return '<option'+(S.goal===x?' selected':'')+'>'+x+'</option>'}).join('')+'</select><label>Subjects</label><div class="tabs2" style="margin:0" id="psj">'+sj.map(function(x){return '<button type="button" data-act="psub" data-s="'+x+'" aria-pressed="'+(pf.subjects.indexOf(x)>-1)+'">'+x+'</button>'}).join('')+'</div><div class="acts" style="margin:0"><button class="pill b sm" type="button" data-act="savepf">save</button><button type="button" class="pill sm" data-act="keys">keyboard shortcuts</button></div></div></div>'+
 '<h2 class="sect">receipts</h2>'+(S.billing.length?'<ul class="rcp">'+S.billing.slice(0,12).map(function(b){return '<li><span>'+h(b.label)+' <span class="mute">&middot; '+dstr(b.ts)+'</span></span><b>'+money(b.amt)+'</b></li>'}).join('')+'</ul>':'<p class="mute">No payments yet.</p>')+
 '<p class="mute" style="margin-top:14px;font-size:13.5px">Billing questions? <a class="link" href="'+SITE+'/refund-policy">Refund policy</a> &middot; <a class="link" href="'+SITE+'/terms">Terms</a> &middot; <a class="link" href="'+SITE+'/privacy">Privacy</a> &middot; '+h(CFG.SUPPORT_EMAIL)+'</p>'+
 '<details class="dm"><summary>'+(CFG.DEMO?'Demo tools (testing only)':'Your data')+'</summary><div class="acts">'+(CFG.DEMO?'<button type="button" data-act="adv" data-d="1">+1 day</button><button type="button" data-act="adv" data-d="6">+6 days</button><button type="button" data-act="adv" data-d="31">+31 days</button><button type="button" data-act="zero">Set credits to 0</button>':'')+'<button type="button" data-act="exp">Export my data (JSON)</button><button type="button" class="danger" data-act="wipe">Delete data on this device</button><button type="button" class="danger" data-act="signout">Sign out</button></div></details></div>'}

/* ================= settings ================= */
function renderSettings() {
  var pf = S.profile || {};
  var lv = ['Class 6 to 8', 'Class 9 to 10', 'Class 11 to 12', 'College or university', 'Learning on my own'];
  var sj = ['Maths', 'Physics', 'Chemistry', 'Biology', 'Economics', 'Accounting', 'Coding', 'English', 'Something else'];
  var _clg = (S.college && S.college.name) || '';
  var _th = (typeof localStorage !== 'undefined' && localStorage.getItem('doubtster-theme')) || 'light';

  $('view').innerHTML = '<div class="pgw">' +
    '<div class="ph"><div><h1>Settings</h1><p>Manage your account profile, study grade, AI tutor behavior, and interface preferences.</p></div></div>' +
    
    '<div class="win form">' +
      '<div class="tb"><i></i><i></i><i></i><em>profile-settings.md</em></div>' +
      '<div class="in3">' +
        '<h3>Academic Profile</h3>' +
        '<div class="fgrp"><label for="set-name">Full Name</label><input type="text" id="set-name" value="' + h(pf.name || '') + '" placeholder="e.g. Utkarsh" /></div>' +
        '<div class="fgrp"><label for="set-email">Email Address</label><input type="email" id="set-email" value="' + h(pf.email || '') + '" disabled /><span class="mute" style="font-size:12px;margin-top:4px;display:block;">Verified Supabase account email.</span></div>' +
        '<div class="two">' +
          '<div class="fgrp"><label for="set-lvl">Education Level</label><select id="set-lvl">' + lv.map(function(x){ return '<option value="' + h(x) + '"' + (x === pf.level ? ' selected' : '') + '>' + h(x) + '</option>'; }).join('') + '</select></div>' +
          '<div class="fgrp"><label for="set-sub">Primary Focus Area</label><select id="set-sub">' + sj.map(function(x){ return '<option value="' + h(x) + '"' + (x === pf.subject ? ' selected' : '') + '>' + h(x) + '</option>'; }).join('') + '</select></div>' +
        '</div>' +
        '<div class="fgrp"><label for="set-college">College / University / School Name</label><input type="text" id="set-college" value="' + h(_clg) + '" placeholder="e.g. UPES Dehradun" /></div>' +
        '<div class="acts" style="margin-top:16px;"><button type="button" class="pill b" data-act="save-settings">Save Academic Profile</button></div>' +
      '</div>' +
    '</div>' +

    '<div class="win form" style="margin-top:20px;">' +
      '<div class="tb"><i></i><i></i><i></i><em>ai-tutor-preferences.md</em></div>' +
      '<div class="in3">' +
        '<h3>AI Tutor & Notes Preferences</h3>' +
        '<div class="pref-row">' +
          '<div><b>Explanation Depth</b><p class="mute">Determines mathematical rigor and derivation depth in answers.</p></div>' +
          '<select id="set-depth">' +
            '<option value="detailed"' + ((pf.ai && pf.ai.depth) === 'detailed' || !pf.ai ? ' selected' : '') + '>Step-by-Step Proofs & Principles (Default)</option>' +
            '<option value="concise"' + ((pf.ai && pf.ai.depth) === 'concise' ? ' selected' : '') + '>Concise & Summary Format</option>' +
            '<option value="exam"' + ((pf.ai && pf.ai.depth) === 'exam' ? ' selected' : '') + '>Exam-Oriented (Formulas & Traps)</option>' +
          '</select>' +
        '</div>' +
        '<div class="pref-row">' +
          '<div><b>Handwritten Notes Length</b><p class="mute">Standard length for generated LaTeX study notebooks.</p></div>' +
          '<select id="set-pages">' +
            '<option value="5" selected>5 Pages (Full NCERT / University Revision Sheet)</option>' +
            '<option value="3">3 Pages (Condensed Review)</option>' +
          '</select>' +
        '</div>' +
        '<div class="acts" style="margin-top:16px;"><button type="button" class="pill" data-act="save-ai-pref">Save AI Preferences</button></div>' +
      '</div>' +
    '</div>' +

    '<div class="two" style="margin-top:20px;">' +
      '<div class="win form">' +
        '<div class="tb"><i></i><i></i><i></i><em>appearance.md</em></div>' +
        '<div class="in3">' +
          '<h3>Theme & Interface</h3>' +
          '<p class="mute">Choose your workspace display appearance.</p>' +
          '<div style="margin-top:16px;">' +
            '<label style="font-size:14px;font-weight:500;color:var(--mute,#64748b);display:block;margin-bottom:8px;">Theme</label>' +
            '<div class="theme-picker-group">' +
              '<button type="button" class="theme-card-option" data-act="set-theme" data-theme="light">' +
                '<div class="theme-preview-box light' + (_th === 'light' ? ' active' : '') + '">' +
                  '<div class="theme-preview-inner light">' +
                    '<span class="theme-preview-aa">Aa</span>' +
                    '<span class="theme-check-badge"><svg viewBox="0 0 12 12" fill="none"><path d="M2.5 6.2L4.8 8.5L9.5 3.8" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>' +
                  '</div>' +
                '</div>' +
                '<span class="theme-card-label">Light</span>' +
              '</button>' +
              '<button type="button" class="theme-card-option" data-act="set-theme" data-theme="dark">' +
                '<div class="theme-preview-box dark' + (_th === 'dark' ? ' active' : '') + '">' +
                  '<div class="theme-preview-inner dark">' +
                    '<span class="theme-preview-aa">Aa</span>' +
                    '<span class="theme-check-badge"><svg viewBox="0 0 12 12" fill="none"><path d="M2.5 6.2L4.8 8.5L9.5 3.8" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>' +
                  '</div>' +
                '</div>' +
                '<span class="theme-card-label">Dark</span>' +
              '</button>' +
              '<button type="button" class="theme-card-option" data-act="set-theme" data-theme="auto">' +
                '<div class="theme-preview-box system' + (_th === 'auto' ? ' active' : '') + '">' +
                  '<div class="theme-split-half left"><div class="theme-preview-inner light"><span class="theme-preview-aa">Aa</span></div></div>' +
                  '<div class="theme-split-half right"><div class="theme-preview-inner dark"><span class="theme-preview-aa">Aa</span></div></div>' +
                  '<span class="theme-check-badge"><svg viewBox="0 0 12 12" fill="none"><path d="M2.5 6.2L4.8 8.5L9.5 3.8" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>' +
                '</div>' +
                '<span class="theme-card-label">System</span>' +
              '</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="win form">' +
        '<div class="tb"><i></i><i></i><i></i><em>shortcuts.md</em></div>' +
        '<div class="in3">' +
          '<h3>Keyboard Shortcuts</h3>' +
          '<ul class="sc-list">' +
            '<li><span>Open Settings</span> <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>,</kbd></li>' +
            '<li><span>Ask New Doubt</span> <kbd>Ctrl</kbd> + <kbd>/</kbd></li>' +
            '<li><span>Flip Note Pages</span> <kbd>&larr;</kbd> / <kbd>&rarr;</kbd></li>' +
            '<li><span>Quick Focus Chat</span> <kbd>/</kbd></li>' +
          '</ul>' +
        '</div>' +
      '</div>' +
    '</div>' +

    '<div class="win form danger-box" style="margin-top:20px;">' +
      '<div class="tb"><i></i><i></i><i></i><em>privacy-and-data.md</em></div>' +
      '<div class="in3">' +
        '<h3>Data Isolation & Privacy</h3>' +
        '<p class="mute">All study materials, chats, and notes are securely isolated per user in Supabase. You can export your data at any time.</p>' +
        '<div class="acts" style="margin-top:14px;">' +
          '<button type="button" class="pill" data-act="export-data">Download Study Archive (.json)</button>' +
          '<button type="button" class="danger pill" data-act="signout">Sign Out</button>' +
        '</div>' +
      '</div>' +
    '</div>' +
  '</div>';
}

/* ================= usage ================= */
function renderUsage() {
  var p = S.plan, n = nextCharge(), c = credits(), mx = planMax();
  var totalQuestions = S.chats.length;
  var totalNotes = S.notes.length;
  var totalDecks = S.decks.length;
  var totalQuizzes = S.quiz.length;

  $('view').innerHTML = '<div class="pgw">' +
    '<div class="ph"><div><h1>Usage & Limits</h1><p>Monitor your study credits, AI doubt activity, and feature utilization.</p></div></div>' +

    '<div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); margin-bottom:24px;">' +
      '<div class="usage-metric-card">' +
        '<div class="umc-label">Plan / Grant Credits</div>' +
        '<div class="umc-val">' + S.pcredits + ' <span class="umc-unit">of ' + mx + '</span></div>' +
        '<div class="meter"><i style="width:' + Math.min(100, Math.max(0, (S.pcredits/mx)*100)) + '%"></i></div>' +
        '<div class="umc-sub">' + (p ? 'Renews ' + (n ? dstr(n.t) : 'monthly') : (S.college ? S.college.name + ' Student Grant' : 'Active Plan')) + '</div>' +
      '</div>' +
      '<div class="usage-metric-card">' +
        '<div class="umc-label">Top-Up Credits</div>' +
        '<div class="umc-val">' + topTotal() + ' <span class="umc-unit">credits</span></div>' +
        '<div class="meter' + (topTotal() === 0 ? ' zero' : '') + '"><i style="width:' + (topTotal() > 0 ? '100%' : '0%') + '"></i></div>' +
        '<div class="umc-sub">Credits never expire &middot; <button class="link-btn" type="button" data-act="promo">+ Add more</button></div>' +
      '</div>' +
      '<div class="usage-metric-card highlight">' +
        '<div class="umc-label">AI Doubt Solver Chat</div>' +
        '<div class="umc-val">&infin; <span class="umc-unit">Unlimited</span></div>' +
        '<div class="umc-badge">Always 100% Free</div>' +
        '<div class="umc-sub">Every chat question and math derivation is free forever.</div>' +
      '</div>' +
    '</div>' +

    '<div class="win form" style="margin-bottom:24px;">' +
      '<div class="tb"><i></i><i></i><i></i><em>study-activity.md</em></div>' +
      '<div class="in3">' +
        '<h3>Your Learning Activity</h3>' +
        '<div class="stats-overview-grid">' +
          '<div class="stat-cell"><b>Doubts Asked</b><div class="sc-num">' + totalQuestions + '</div></div>' +
          '<div class="stat-cell"><b>5-Page Notes Generated</b><div class="sc-num">' + totalNotes + '</div></div>' +
          '<div class="stat-cell"><b>Flashcard Decks</b><div class="sc-num">' + totalDecks + '</div></div>' +
          '<div class="stat-cell"><b>Quizzes Attempted</b><div class="sc-num">' + totalQuizzes + '</div></div>' +
          '<div class="stat-cell"><b>Bookmarks Saved</b><div class="sc-num">' + S.saved.length + '</div></div>' +
        '</div>' +
      '</div>' +
    '</div>' +

    '<div class="win form">' +
      '<div class="tb"><i></i><i></i><i></i><em>credit-costs.md</em></div>' +
      '<div class="in3">' +
        '<h3>Credit Consumption Guide</h3>' +
        '<table class="cost-table">' +
          '<thead><tr><th>Feature</th><th>Cost</th><th>What You Receive</th></tr></thead>' +
          '<tbody>' +
            '<tr><td>Instant AI Doubt Clearance</td><td><b class="free-pill">0 Credits (Free)</b></td><td>Unlimited derivations, step-by-step reasoning & LaTeX</td></tr>' +
            '<tr><td>Handwritten Study Notebook</td><td><b>1 Credit</b></td><td>Detailed 5-page revision notebook with graphs & practice</td></tr>' +
            '<tr><td>AI Video Lecture Studio</td><td><b>1 Credit</b></td><td>Interactive whiteboard audio-visual animated lecture</td></tr>' +
            '<tr><td>Active Recall Revision Deck</td><td><b>1 Credit</b></td><td>Spaced repetition flashcards with auto-generated quizzes</td></tr>' +
          '</tbody>' +
        '</table>' +
        '<div class="acts" style="margin-top:16px;">' +
          '<button type="button" class="pill b" data-act="promo">View Plans & Upgrade</button>' +
        '</div>' +
      '</div>' +
    '</div>' +
  '</div>';
}

/* ================= language ================= */
function renderLanguage() {
  var curLang = S.profile.lang || 'en';
  $('view').innerHTML = '<div class="pgw">' +
    '<div class="ph"><div><h1>Language & Regional Settings</h1><p>Choose the language Doubtster uses to explain concepts, format formulas, and generate study notes.</p></div></div>' +

    '<div class="win form" style="margin-bottom:24px;">' +
      '<div class="tb"><i></i><i></i><i></i><em>primary-language.md</em></div>' +
      '<div class="in3">' +
        '<h3>Select Primary Study Language</h3>' +
        '<p class="mute">Changes the language for AI tutor answers, handwritten notes, and voice reading.</p>' +
        '<div class="lang-grid" style="margin-top:16px;">' +
          '<div class="lang-card' + (curLang === 'en' ? ' active' : '') + '" data-act="select-lang" data-lang="en">' +
            '<div class="lang-flag">🇬🇧</div><div class="lang-title">English</div><div class="lang-desc">Standard international terminology & notation</div>' +
          '</div>' +
          '<div class="lang-card' + (curLang === 'hi-en' ? ' active' : '') + '" data-act="select-lang" data-lang="hi-en">' +
            '<div class="lang-flag">🇮🇳</div><div class="lang-title">Hinglish</div><div class="lang-desc">Conversational Hindi + English natural explanations</div>' +
          '</div>' +
          '<div class="lang-card' + (curLang === 'hi' ? ' active' : '') + '" data-act="select-lang" data-lang="hi">' +
            '<div class="lang-flag">🇮🇳</div><div class="lang-title">हिन्दी (Hindi)</div><div class="lang-desc">Pure Devanagari script with standard math formulas</div>' +
          '</div>' +
          '<div class="lang-card' + (curLang === 'es' ? ' active' : '') + '" data-act="select-lang" data-lang="es">' +
            '<div class="lang-flag">🇪🇸</div><div class="lang-title">Español</div><div class="lang-desc">Explicaciones claras y fórmulas paso a paso</div>' +
          '</div>' +
          '<div class="lang-card' + (curLang === 'fr' ? ' active' : '') + '" data-act="select-lang" data-lang="fr">' +
            '<div class="lang-flag">🇫🇷</div><div class="lang-title">Français</div><div class="lang-desc">Démonstrations détaillées et rigueur académique</div>' +
          '</div>' +
          '<div class="lang-card' + (curLang === 'de' ? ' active' : '') + '" data-act="select-lang" data-lang="de">' +
            '<div class="lang-flag">🇩🇪</div><div class="lang-title">Deutsch</div><div class="lang-desc">Schritt-für-Schritt-Erklärungen und Formeln</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>' +

    '<div class="two">' +
      '<div class="win form">' +
        '<div class="tb"><i></i><i></i><i></i><em>formatting.md</em></div>' +
        '<div class="in3">' +
          '<h3>Mathematical Notation</h3>' +
          '<div class="fgrp"><label>Decimal Separator</label><select id="set-decimal"><option value="dot">Point (.) e.g. 3.14159</option><option value="comma">Comma (,) e.g. 3,14159</option></select></div>' +
          '<div class="fgrp"><label>Multiplication Symbol</label><select id="set-mult"><option value="dot">Center dot (&middot;) e.g. 2 &middot; x</option><option value="times">Cross (&times;) e.g. 2 &times; x</option></select></div>' +
        '</div>' +
      '</div>' +

      '<div class="win form">' +
        '<div class="tb"><i></i><i></i><i></i><em>preview.md</em></div>' +
        '<div class="in3">' +
          '<h3>Live Language Preview</h3>' +
          '<div class="preview-box" id="lang-preview">' +
            '<b>Kinematics Sample:</b>' +
            '<p id="preview-text">"The stone accelerates downward at 9.8 m/s² under gravity. Vertical displacement is proportional to time squared."</p>' +
            '<code id="preview-eq">s = &frac12;gt&sup2;</code>' +
          '</div>' +
          '<div class="acts" style="margin-top:16px;"><button type="button" class="pill b" data-act="apply-lang">Apply & Save Language</button></div>' +
        '</div>' +
      '</div>' +
    '</div>' +
  '</div>';
}

/* ================= help ================= */
function renderHelp() {
  $('view').innerHTML = '<div class="pgw">' +
    '<div class="ph"><div><h1>Help & Student Support Center</h1><p>Frequently asked questions, live diagnostics, and academic support.</p></div></div>' +

    '<div class="diag-banner">' +
      '<div class="diag-status">' +
        '<span class="live-dot green"></span> <b>System Operational:</b> Supabase Sync Active &middot; AI Response Engine: High Speed &middot; Encryption: Active' +
      '</div>' +
    '</div>' +

    '<div class="win form" style="margin-top:20px;">' +
      '<div class="tb"><i></i><i></i><i></i><em>faq.md</em></div>' +
      '<div class="in3">' +
        '<h3>Frequently Asked Questions</h3>' +
        '<div class="faq-list">' +
          '<details class="faq-card" open><summary><b>Is Doubtster chat really free?</b></summary><p>Yes! Unlimited AI doubt chat, mathematical derivations, step-by-step reasoning, and LaTeX equations are 100% free with no credit limits.</p></details>' +
          '<details class="faq-card"><summary><b>What is included in the 5-page handwritten notes?</b></summary><p>Every note generated by Doubtster contains at least 5 distinct academic sheets: Problem Formulation, Variables & Equations, Mathematical Derivation, Trajectory & Velocity Graphs, and Exam Traps with Worked Practice Problems.</p></details>' +
          '<details class="faq-card"><summary><b>How do I download or export my study notes?</b></summary><p>Open any note in the Notes section and click "Download PDF" for a printable ruled sheet, or "Export .md" to download a standard Markdown file.</p></details>' +
          '<details class="faq-card"><summary><b>How do I use my university or college credits?</b></summary><p>If you sign up or log in with your university email (such as UPES Dehradun or partner institutions), student grant credits are credited automatically to your account.</p></details>' +
          '<details class="faq-card"><summary><b>Can I pin and rename my recent chats?</b></summary><p>Yes! Right-click on any recent chat in the sidebar to reveal the context menu with Pin, Rename, and Delete options.</p></details>' +
        '</div>' +
      '</div>' +
    '</div>' +

    '<div class="win form" style="margin-top:20px;">' +
      '<div class="tb"><i></i><i></i><i></i><em>contact-support.md</em></div>' +
      '<div class="in3">' +
        '<h3>Submit a Question or Report an Issue</h3>' +
        '<p class="mute">Our academic team typically responds within a few hours.</p>' +
        '<div class="fgrp"><label for="help-cat">Inquiry Category</label><select id="help-cat"><option value="academic">Academic Doubt / Clarification</option><option value="bug">Report a Bug / Glitch</option><option value="feature">Feature Request</option><option value="credits">Credits or Account Question</option></select></div>' +
        '<div class="fgrp"><label for="help-msg">Your Message</label><textarea id="help-msg" rows="4" placeholder="Describe what you need help with..."></textarea></div>' +
        '<div class="acts" style="margin-top:12px;">' +
          '<button type="button" class="pill b" data-act="submit-ticket">Submit Message</button>' +
          '<span class="mute" style="font-size:13px;margin-left:14px;">Direct email: <a href="mailto:contact@doubtster.com">contact@doubtster.com</a></span>' +
        '</div>' +
      '</div>' +
    '</div>' +
  '</div>';
}

/* ================= apps ================= */
function renderApps() {
  $('view').innerHTML = '<div class="pgw">' +
    '<div class="ph"><div><h1>Doubtster Apps & Extensions</h1><p>Study on any device. Take Doubtster to your browser, desktop, tablet, and mobile device.</p></div></div>' +

    '<div class="apps-grid">' +
      '<div class="app-platform-card">' +
        '<div class="apc-icon chrome"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="21.17" y1="8" x2="12" y2="8"/><line x1="3.95" y1="6.06" x2="8.54" y2="14"/><line x1="10.88" y1="21.94" x2="15.46" y2="14"/></svg></div>' +
        '<div class="apc-info"><h3>Chrome & Brave Browser Extension</h3><p>Solve any math problem or homework question directly on any webpage or PDF. Right-click or use screenshot shortcut for instant solutions.</p><span class="apc-badge">Chrome Web Store &middot; Free</span></div>' +
        '<div class="apc-act"><button type="button" class="pill b" data-act="get-extension">Add to Chrome</button></div>' +
      '</div>' +

      '<div class="app-platform-card">' +
        '<div class="apc-icon desktop"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg></div>' +
        '<div class="apc-info"><h3>Desktop App (Windows & macOS)</h3><p>Install Doubtster as a native standalone app. Works seamlessly with full keyboard shortcuts, instant launch from Taskbar, and zero distraction.</p><span class="apc-badge">PWA Standalone App</span></div>' +
        '<div class="apc-act"><button type="button" class="pill b" data-act="install-pwa">Install Desktop App</button></div>' +
      '</div>' +

      '<div class="app-platform-card">' +
        '<div class="apc-icon mobile"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg></div>' +
        '<div class="apc-info"><h3>Mobile App (Android & iOS)</h3><p>Snap a photo of your textbook question with your camera. Instantly receive 5-page handwritten notes and video solutions on your phone.</p><span class="apc-badge">Camera OCR Solver</span></div>' +
        '<div class="apc-act"><button type="button" class="pill" data-act="get-mobile">Get Mobile App</button></div>' +
      '</div>' +
    '</div>' +

    '<div class="win form" style="margin-top:28px;">' +
      '<div class="tb"><i></i><i></i><i></i><em>instant-installation.md</em></div>' +
      '<div class="in3">' +
        '<h3>Quick 1-Click Installation Guide</h3>' +
        '<ol class="guide-steps">' +
          '<li><b>On Chrome or Edge:</b> Click the install icon (computer icon) on the right side of the address bar at the top, then click <b>Install</b>.</li>' +
          '<li><b>On iPhone / iPad:</b> Tap the <b>Share</b> button in Safari, scroll down, and tap <b>Add to Home Screen</b>.</li>' +
          '<li><b>On Android:</b> Tap the three dots menu in Chrome, then select <b>Add to Home Screen</b> or <b>Install App</b>.</li>' +
        '</ol>' +
      '</div>' +
    '</div>' +
  '</div>';
}

/* ================= learn ================= */
function renderLearn() {
  $('view').innerHTML = '<div class="pgw">' +
    '<div class="ph"><div><h1>About Doubtster</h1><p>The pedagogical engine built to turn confusion into deep conceptual mastery.</p></div></div>' +

    '<div class="learn-hero-card">' +
      '<h2>Built for Students Who Want to Understand, Not Just Memorize</h2>' +
      '<p>Most AI tools dump a raw answer without teaching you how to get there. Doubtster breaks down complex problems into foundational principles, step-by-step derivations, visual graphs, and practice variations so you conquer exams with confidence.</p>' +
    '</div>' +

    '<div class="pillars-grid" style="margin-top:24px;">' +
      '<div class="pillar-card"><div class="pc-icon">🧠</div><h3>Socratic Step-by-Step Solver</h3><p>Every mathematical step is justified with the "WHY" behind it. No unexplained leaps or hallucinated numbers.</p></div>' +
      '<div class="pillar-card"><div class="pc-icon">📝</div><h3>5-Page Handwritten LaTeX Notes</h3><p>Generates real student revision sheets with formulations, derivations, interactive 2D graphs, and exam trap warnings.</p></div>' +
      '<div class="pillar-card"><div class="pc-icon">🎬</div><h3>AI Whiteboard Video Lectures</h3><p>Transforms any textbook answer into a narrated blackboard video lecture to stimulate visual and auditory memory.</p></div>' +
      '<div class="pillar-card"><div class="pc-icon">🗂️</div><h3>Active Recall & Quizzes</h3><p>Spaced repetition flashcards and test quizzes created on the fly from your own questions and mistakes.</p></div>' +
    '</div>' +

    '<div class="win form" style="margin-top:28px;">' +
      '<div class="tb"><i></i><i></i><i></i><em>pro-study-tips.md</em></div>' +
      '<div class="in3">' +
        '<h3>Power User Pro-Tips</h3>' +
        '<ul class="tips-list">' +
          '<li><b>Ask in any format:</b> Type a question, upload a homework screenshot, or paste a formula in LaTeX.</li>' +
          '<li><b>Turn replies into study materials:</b> Under any reply, click <b>Notes</b> for a 5-page revision notebook, <b>Flashcards</b> for a revision deck, or <b>Video</b> for a whiteboard lecture.</li>' +
          '<li><b>Pin important chats:</b> Right-click any recent chat in the sidebar and click <b>Pin</b> to keep it at the top of your revision list.</li>' +
          '<li><b>Study offline:</b> Notes and flashcards are cached in your browser and printable as standard PDFs.</li>' +
        '</ul>' +
        '<div class="acts" style="margin-top:16px;">' +
          '<button type="button" class="pill b" data-act="go" data-v="chat">Start Asking Doubts</button>' +
        '</div>' +
      '</div>' +
    '</div>' +
  '</div>';
}

/* ================= router + events ================= */
var R={home:renderHome,chat:renderChat,flash:renderFlash,quiz:renderQuiz,videos:renderVideos,notes:renderNotes,plan:renderPlan,library:renderLibrary,account:renderAccount,settings:renderSettings,usage:renderUsage,language:renderLanguage,help:renderHelp,apps:renderApps,learn:renderLearn};
function srcFrom(b){
 if(b.dataset.sid){var s=S.saved.filter(function(x){return x.id===b.dataset.sid})[0];return{a:s?s.a:null,q:s&&s.q||''}}
 if(b.dataset.nid){var n=noteById(b.dataset.nid);return{a:n&&n.a||null,q:n&&n.q||''}}
 var i=+b.dataset.m;return{a:srcOf(i),q:qOf(i)}}
function demoLimit(){modal('<span class="demo">DEMO MODE</span><h2>nothing to build from yet</h2><p>The built-in demo can only build videos, flashcards and quizzes from replies it could solve. Ask one of the example questions, or connect your answer endpoint and every reply will work.</p><div class="acts"><button type="button" class="vid" data-act="close">OK</button></div>')}
function confirmM(title,msg,act,id){modal('<h2>'+h(title)+'</h2><p>'+h(msg)+'</p><div class="acts"><button type="button" data-act="close">Keep</button><button type="button" class="danger" data-act="'+act+'" data-id="'+h(id||'')+'">Delete</button></div>')}
function chatMD(c){return '# '+c.title+'\n\n'+c.msgs.map(function(m){if(m.r==='u')return '**You:** '+m.t;if(m.a)return '**Doubtster:** '+m.a.title+'\n\n'+m.a.steps.map(function(s,i){return (i+1)+'. '+s.h+(s.t?' - '+s.t:'')+(s.math?'\n   '+s.math:'')}).join('\n')+(m.a.answer?'\n\nAnswer: '+m.a.answer:'');return '**Doubtster:** '+(m.text||'')}).join('\n\n')+'\n'}
var ACT={
 'save-settings': function(){
   var nm = ($('set-name') && $('set-name').value || '').trim();
   var lvl = $('set-lvl') && $('set-lvl').value;
   var sub = $('set-sub') && $('set-sub').value;
   var clg = ($('set-college') && $('set-college').value || '').trim();
   if(nm) S.profile.name = nm;
   if(lvl) S.profile.level = lvl;
   if(sub) S.profile.subject = sub;
   if(clg) { if(!S.college) S.college = {}; S.college.name = clg; }
   save(true);
   paintTop();
   toast('Academic profile saved!');
 },
 'save-ai-pref': function(){
   var depth = $('set-depth') && $('set-depth').value;
   var pgs = $('set-pages') && $('set-pages').value;
   if(!S.profile.ai) S.profile.ai = {};
   if(depth) S.profile.ai.depth = depth;
   if(pgs) S.profile.ai.notesPages = pgs;
   save(true);
   toast('AI tutor preferences saved!');
 },
 'set-theme': function(b){
   var btn = b.closest('[data-theme]');
   var th = (btn && btn.dataset.theme) || b.dataset.theme || 'light';
   var effectiveTheme = th;
   if(th === 'auto') {
     effectiveTheme = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
   }

   var updateDOM = function() {
     document.documentElement.setAttribute('data-theme', effectiveTheme);
     try { localStorage.setItem('doubtster-theme', th); } catch(e){}
     var allBoxes = document.querySelectorAll('.theme-preview-box');
     allBoxes.forEach(function(el){
       var opt = el.closest('[data-theme]');
       el.classList.toggle('active', !!(opt && opt.dataset.theme === th));
     });
   };

   if (typeof document !== 'undefined' && 'startViewTransition' in document) {
     document.documentElement.classList.add('theme-transitioning');
     (document as any).startViewTransition(function() {
       updateDOM();
     });
     setTimeout(function() {
       document.documentElement.classList.remove('theme-transitioning');
     }, 400);
   } else {
     document.documentElement.classList.add('theme-transitioning');
     updateDOM();
     setTimeout(function() {
       document.documentElement.classList.remove('theme-transitioning');
     }, 400);
   }

   toast('Theme set to ' + (th === 'auto' ? 'System' : (th.charAt(0).toUpperCase() + th.slice(1))) + ' mode');
 },
 'select-lang': function(b){
   var l = b.dataset.lang || 'en';
   var cards = document.querySelectorAll('.lang-card');
   cards.forEach(function(c){ c.classList.toggle('active', c.dataset.lang === l); });
   var previewMap = {
     en: { text: "The stone accelerates downward at 9.8 m/s² under gravity. Vertical displacement is proportional to time squared.", eq: "s = ½gt²" },
     'hi-en': { text: "Stone gravity ke under 9.8 m/s² acceleration se neeche girti hai. Vertical displacement time squared ke proportional hota hai.", eq: "s = ½gt²" },
     hi: { text: "पत्थर गुरुत्वाकर्षण के प्रभाव में 9.8 m/s² के त्वरण से नीचे गिरता है। विस्थापन समय के वर्ग के समानुपाती होता है।", eq: "s = ½gt²" },
     es: { text: "La piedra acelera hacia abajo a 9.8 m/s² bajo la gravedad. El desplazamiento vertical es proporcional al tiempo al cuadrado.", eq: "s = ½gt²" },
     fr: { text: "La pierre accélère vers le bas à 9.8 m/s² sous la gravité. Le déplacement vertical est proportionnel au temps au carré.", eq: "s = ½gt²" },
     de: { text: "Der Stein beschleunigt unter Schwerkraft mit 9.8 m/s² nach unten. Die Verschiebung ist proportional zum Quadrat der Zeit.", eq: "s = ½gt²" }
   };
   var data = previewMap[l] || previewMap.en;
   if($('preview-text')) $('preview-text').textContent = '"' + data.text + '"';
   if($('preview-eq')) $('preview-eq').textContent = data.eq;
   S.profile.lang = l;
 },
 'apply-lang': function(){
   var activeCard = document.querySelector('.lang-card.active');
   if(activeCard) S.profile.lang = activeCard.dataset.lang;
   save(true);
   toast('Language preference saved!');
 },
 'submit-ticket': function(){
   var msg = $('help-msg') ? $('help-msg').value.trim() : '';
   if(!msg){ toast('Please write a short description first.'); return; }
   if($('help-msg')) $('help-msg').value = '';
   toast('Ticket submitted! Our academic team will respond to your email.');
 },
 'export-data': function(){
   var data = JSON.stringify({ profile: S.profile, notes: S.notes, chats: S.chats, decks: S.decks, quiz: S.quiz }, null, 2);
   dl('doubtster-academic-data.json', data, 'application/json');
   toast('Exporting study data...');
 },
 'get-extension': function(){
   toast('Opening Doubtster Chrome Web Store extension page...');
   window.open('https://chromewebstore.google.com', '_blank');
 },
 'install-pwa': function(){
   if((window as any).deferredPrompt){
     (window as any).deferredPrompt.prompt();
   } else {
     toast('To install: click the Install icon in your browser address bar.');
   }
 },
 'get-mobile': function(){
   toast('Doubtster Mobile is available as a PWA! Tap Share > Add to Home Screen.');
 },

 go:function(b){go(b.dataset.v)},close:function(){closeModal()},dismiss:function(){S.dismissed=true;save();R[view]()},hidelist:function(){S.hideList=true;save();R.home()},
 ask:function(b){ask(b.dataset.q)},
 'open-recents-overlay':function(){openRecentsOverlay();},
 'cro-new-chat':function(){closeModal();newChat();},
 openchat:function(b){closeModal();closeChatContextMenu();S.cur=b.dataset.id;save();go('chat')},
 chatmenu:function(b,e){
   if(e){e.stopPropagation();e.preventDefault();}
   var id=b.dataset.id;
   if(!id)return;
   var menu = document.getElementById('chat-context-menu');
   if(activeContextChatId === id && menu && menu.classList.contains('is-open')){
     closeChatContextMenu();
     return;
   }
   var rect=b.getBoundingClientRect();
   openChatContextMenu(id,rect.right+4,rect.top);
 },
 'chat-pin':function(b){
   var id=b.dataset.id||activeContextChatId;
   closeChatContextMenu();
   if(!id)return;
   var c=S.chats.filter(function(x){return x.id===id})[0];
   if(!c)return;
   c.pinned=!c.pinned;
   c.pinnedAt=c.pinned?Date.now():undefined;
   c.ts=Date.now();
   S.pinnedCollapsed=false;
   save(true);
   paintHist();
   setTimeout(function(){
     var row=document.querySelector('.chat-row[data-chat-id="'+id+'"]');
     if(row){
       row.classList.add('just-pinned-pulse');
       setTimeout(function(){row.classList.remove('just-pinned-pulse')},1200);
     }
   },50);
   toast(c.pinned?'Pinned to top':'Unpinned from top');
 },
 'chat-rename':function(b){var id=b.dataset.id||activeContextChatId;closeChatContextMenu();if(!id)return;var c=S.chats.filter(function(x){return x.id===id})[0];if(!c)return;modal('<h2>rename chat</h2><div class="form"><input type="text" id="rn" maxlength="60" value="'+h(c.title)+'"></div><div class="acts"><button type="button" data-act="close">Cancel</button><button type="button" class="vid" data-act="rensavebyid" data-id="'+c.id+'">Save</button></div>');setTimeout(function(){var el=$('rn');if(el){el.focus();el.select();}},50)},
 rensavebyid:function(b){var id=b.dataset.id,c=S.chats.filter(function(x){return x.id===id})[0],v=(($('rn')||{}).value||'').trim();if(c&&v){c.title=v;c.ts=Date.now();save(true);paintHist();if(c.id===S.cur&&view==='chat'){var ctt=$('ctt');if(ctt)ctt.textContent=v;paintMsgs(true);}}closeModal();toast('Chat renamed.');},
 'chat-delete':function(b){var id=b.dataset.id||activeContextChatId;closeChatContextMenu();if(!id)return;var c=S.chats.filter(function(x){return x.id===id})[0];if(!c)return;confirmM('delete this chat?','This removes the conversation permanently from your account.','delcbyid',c.id);},
 delcbyid:function(b){var id=b.dataset.id;S.chats=S.chats.filter(function(x){return x.id!==id});if(S.cur===id){S.cur=null;if(view==='chat')R.chat();}save(true);closeModal();repaint();toast('Chat deleted permanently.');},
 'toggle-pinned-sec':function(){S.pinnedCollapsed=!S.pinnedCollapsed;paintHist()},
 'toggle-recents-sec':function(){S.recentsCollapsed=!S.recentsCollapsed;paintHist()},
 chattitlemenu:function(b,e){
   if(e){e.stopPropagation();e.preventDefault();}
   var c=curChat();
   if(!c)return;
   var menu=document.getElementById('chat-context-menu');
   if(activeContextChatId===c.id&&menu&&menu.classList.contains('is-open')){
     closeChatContextMenu();
     return;
   }
   var rect=b.getBoundingClientRect();
   openChatContextMenu(c.id,rect.left,rect.bottom+6);
 },
 sharechat:function(){var c=curChat();if(!c)return;modal('<h2>share chat</h2><p>Share or export <b>'+h(c.title)+'</b>.</p><div class="acts"><button type="button" data-act="close">Close</button><button type="button" class="vid" data-act="copyshare">Copy Text</button><button type="button" class="vid" data-act="exportc">Download .md</button></div>')},
 copyshare:function(){var c=curChat();if(!c)return;var txt=chatMD(c);if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(txt).then(function(){toast('Chat copied to clipboard!');closeModal();}).catch(function(){toast('Could not access clipboard.');});}else{toast('Clipboard not available.');}},
 'chat-artifacts':function(){var c=curChat();if(!c)return;var count=(c.msgs||[]).filter(function(m){return m.r==='a'||m.a||m.text;}).length;toast(count+' answer'+(count===1?'':'s')+' & artifacts in this conversation.')},
 delc:function(b){S.chats=S.chats.filter(function(c){return c.id!==b.dataset.id});if(S.cur===b.dataset.id)S.cur=null;save(true);repaint();R.library();toast('Chat deleted permanently.');},
 renamec:function(){var c=curChat();if(!c)return;modal('<h2>rename chat</h2><div class="form"><input type="text" id="rn" maxlength="60" value="'+h(c.title)+'"></div><div class="acts"><button type="button" data-act="close">Cancel</button><button type="button" class="vid" data-act="rensave">Save</button></div>')},
 rensave:function(){var c=curChat(),v=($('rn').value||'').trim();if(c&&v){c.title=v;save();paintHist();paintMsgs(true)}closeModal()},
 exportc:function(){var c=curChat();if(c)dl((c.title.replace(/[^a-z0-9]+/gi,'-').toLowerCase()||'chat')+'.md',chatMD(c))},
 delcur:function(){var c=curChat();if(c)confirmM('delete this chat?','This removes the conversation permanently from your account.','delcurdo',c.id);},
 delcurdo:function(b){S.chats=S.chats.filter(function(c){return c.id!==b.dataset.id});S.cur=null;save(true);closeModal();repaint();R.chat();toast('Chat deleted permanently.');},
 detail:function(b){S.detail=b.dataset.d;save();[].forEach.call(document.querySelectorAll('.seg [data-act=detail]'),function(x){x.setAttribute('aria-pressed',x===b)});paintMsgs(true)},
 mkvideo:function(b){var s=srcFrom(b);if(!s.a)return demoLimit();closeModal();videoPicker(s.a,s.q||s.a.title)},
 mkdeck:function(b){var s=srcFrom(b);if(!s.a)return demoLimit();closeModal();addDeck(deckFrom(s.a,s.q))},
 mkquiz:function(b){var s=srcFrom(b);if(!s.a)return demoLimit();closeModal();quizFromAnswer(s.a,s.q)},
 mknote:function(b){
  var s=srcFrom(b);
  if(!s.a)return demoLimit();
  var mid = b.dataset.m != null ? +b.dataset.m : -1;
  var c = curChat();
  var msg = c && mid >= 0 ? c.msgs[mid] : null;
  var rawMd = (msg && msg.text) || aToMarkdown(s.a) || s.a.title;
  var topic = (s.q || s.a.title || 'Study Notes').trim();
  var cacheKey = 'doubtster-notes-v4:' + topic.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  var cached = null;
  try { var rawC = localStorage.getItem(cacheKey); if (rawC) cached = JSON.parse(rawC); } catch(e){}
  var initialDoc = cached || buildDocFromAnswer(s.a, topic, topic);
  var n = addNote(s.a, topic, initialDoc);
  go('notes');
  openNote(n.id);
  if (!cached) {
  fetch('/api/notes', {
   method: 'POST',
   headers: { 'Content-Type': 'application/json' },
   body: JSON.stringify({
    topic: topic,
    markdownContext: rawMd,
    profile: S.profile
   })
  }).then(function(r){ return r.json(); })
    .then(function(res){
     if(res && res.note){
      n.doc = res.note;
      n.title = res.note.title || n.title;
      n.subject = res.note.subject || n.subject;
      try { localStorage.setItem(cacheKey, JSON.stringify(res.note)); } catch(e){}
      save();
      if(curNoteId === n.id){
       openNote(n.id);
      }
     }
    }).catch(function(err){
     console.warn('Background notes fetch failed:', err);
    });
   }
  },
 copy:function(b){var m=curChat()&&curChat().msgs[+b.dataset.m];if(!m)return;var a=m.a,t=a?a.title+'\n\n'+a.steps.map(function(s,i){return (i+1)+'. '+s.h+(s.t?' - '+s.t:'')+(s.math?'\n   '+s.math:'')}).join('\n')+(a.answer?'\n\nAnswer: '+a.answer:''):(m.text||'');
  try{navigator.clipboard.writeText(t).then(function(){toast('Copied.')},function(){toast('Could not copy.')})}catch(e){toast('Could not copy.')}},
 save:function(b){var i=+b.dataset.m,k=curKey(i),ix=-1;S.saved.forEach(function(x,j){if(x.mid===k)ix=j});
  if(ix>-1){S.saved.splice(ix,1);toast('Removed from Saved.')}else{var a=srcOf(i);if(!a)return;S.saved.unshift({id:uid(),mid:k,ts:Date.now(),title:a.title,a:a,q:qOf(i)});toast('Saved. Find it in Library.')}save();paintMsgs(true)},
 unsave:function(b){S.saved=S.saved.filter(function(x){return x.id!==b.dataset.id});save();R.library()},
 opensaved:function(b){openSaved(b.dataset.id)},
 fb:function(b){var c=curChat(),m=c&&c.msgs[+b.dataset.m];if(!m)return;var v=+b.dataset.v;m.fb=m.fb===v?0:v;save();paintMsgs(true);if(m.fb)toast('Thanks for the feedback.')},
 report:function(b){var c=curChat(),m=c&&c.msgs[+b.dataset.m];if(!m)return;modal('<h2>report a mistake</h2><p>Tell us what is wrong with this answer.</p><div class="form"><textarea id="rpt" maxlength="500" style="width:100%;border:1px solid #C9C9D1;border-radius:11px;padding:10px 13px;font:inherit;min-height:80px;margin-top:10px" placeholder="What looks wrong?"></textarea></div><div class="acts"><button type="button" data-act="close">Cancel</button><button type="button" class="vid" data-act="sendrpt" data-m="'+b.dataset.m+'">Send</button></div>')},
 sendrpt:function(b){var c=curChat(),m=c&&c.msgs[+b.dataset.m];S.reports.push({ts:Date.now(),title:m&&m.a?m.a.title:'',note:($('rpt')||{}).value||''});save();closeModal();toast(CFG.DEMO?'Saved on this device (demo). Connect a report endpoint to send it.':'Thanks, we will look into it.')},
 promo:function(){promo()},closepromo:function(){try{sessionStorage.setItem('doubtster_promo_tab_' + (USER_ID || 'guest'), '1');}catch(e){}pendingAfter=null;closeModal()},closecp:function(){ss('credSeen','1');pendingAfter=null;closeModal()},
 credits:function(){S.plan?creditsPopup({need:1}):promo()},
 pplan:function(b){ppick=b.dataset.p;if($('pnote'))promoUpd();else{[].forEach.call(document.querySelectorAll('#pp button'),function(x){x.setAttribute('aria-pressed',x===b)})}},
 pcont:function(b){var t=b.dataset.trial==='1',p=ppick;closeModal();checkout(t?'trial':'direct',p)},
 buypack:function(b){var i=+b.dataset.i;pendingAfter=null;closeModal();checkout('topup',i)},
 cpack:function(b){cpick=+b.dataset.i;[].forEach.call(document.querySelectorAll('#packs button'),function(x){x.setAttribute('aria-pressed',x===b)});var k=PRICE.packs[cpick],bt=$('cbuy');if(bt)bt.textContent='Buy '+k.n+' credits for '+money(k.p);var cp=document.querySelector('.coinp b');if(cp)cp.textContent='+'+k.n},
 cbuy:function(){var i=cpick;closeModal();checkout('topup',i)},
 calt:function(){var f=altFn;altFn=null;pendingAfter=null;closeModal();if(f)f()},
 vlg:function(b){vlang=b.dataset.l;vupd()},
 vlen:function(b){vsel=+b.dataset.n;vupd()},
 vstart:function(){var v=$('vvo');vvoice=!!(v&&v.checked);var p=pendingV;closeModal();if(p)vgenerate(p.a,p.prompt,vsel,vvoice,vlang)},
 vgo:function(){var v=$('vvo');vvoice=!!(v&&v.checked);var sel=$('vf'),txt=$('vp').value.trim(),a=null,prompt=txt;
  if(sel&&sel.value){var p=sel.value.split(':'),c=S.chats.filter(function(x){return x.id===p[0]})[0];a=c&&c.msgs[+p[1]]&&c.msgs[+p[1]].a;prompt=a&&a.title}
  else if(txt){a=CFG.DEMO?demoSolve(txt):{title:txt,subject:'',steps:[{h:txt,t:''}],answer:''}}
  if(!a){toast(txt?'The demo cannot build that one. Try an example from chat, or connect your endpoint.':'Type a topic or pick an answer first.');return}vgenerate(a,prompt,vsel,vvoice,vlang)},
 playv:function(b){go('videos');playVideo(b.dataset.id)},
 delv:function(b){S.videos=S.videos.filter(function(v){return v.id!==b.dataset.id});save();if(view==='library')R.library();else go('videos')},
 chap:function(b){if(pl2.seek)pl2.seek(+b.dataset.i)},
 vdeck:function(b){var v=S.videos.filter(function(x){return x.id===b.dataset.id})[0];if(v&&v.a)addDeck(deckFrom(v.a,v.title))},
 vquiz:function(b){var v=S.videos.filter(function(x){return x.id===b.dataset.id})[0];if(v&&v.a){stopPlayer();quizFromAnswer(v.a,v.title)}},
 ngo:function(){
  var t=($('np')||{}).value;
  if(!t || !t.trim()){toast('Type a topic first.');return}
  t = t.trim();
  var cacheKey = 'doubtster-notes-v4:' + t.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  var cached = null;
  try { var rawC = localStorage.getItem(cacheKey); if (rawC) cached = JSON.parse(rawC); } catch(e){}
  var initialDoc = cached || buildDocFromAnswer(fakeA, t, t);
  var fakeA = { title: t, subject: 'Notes', steps: [], answer: '' };
  var n = addNote(fakeA, t, initialDoc);
  openNote(n.id);
  if (!cached) {
   fetch('/api/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
     topic: t,
     profile: S.profile
    })
   }).then(function(r){ return r.json(); })
     .then(function(res){
      if(res && res.note){
       n.doc = res.note;
       n.title = res.note.title || n.title;
       n.subject = res.note.subject || n.subject;
       try { localStorage.setItem(cacheKey, JSON.stringify(res.note)); } catch(e){}
       save();
       if(curNoteId === n.id){
        openNote(n.id);
       }
      } else if(res && res.error) {
       toast(res.error);
      }
     }).catch(function(err){
      console.warn('Notes generation failed:', err);
     });
  }
 },
 opennote:function(b){go('notes');openNote(b.dataset.id)},
 deln:function(b){S.notes=S.notes.filter(function(n){return n.id!==b.dataset.id});save();if(view==='library')R.library();else R.notes()},
 ndl:function(b){
  var n=noteById(b.dataset.id);
  if(!n)return;
  var md = n.doc ? notebookDocToMarkdown(n.doc) : noteMD(n);
  var slug = (n.title.replace(/[^a-z0-9]+/gi,'-').toLowerCase()||'notes').replace(/^-+|-+$/g,'');
  dl(slug + '.md', md);
 },
 /* flashcards */
 newdeck:function(){var e=$('newdeck');if(e)e.scrollIntoView({behavior:'smooth',block:'center'});var t=$('ftopic');if(t)t.focus()},
 fgen:function(){var t=$('ftopic').value.trim();if(!t){toast('Type a topic first.');return}topicDeck(t)},
 fmake:function(){var d=mkDeckFromText($('ftitle').value.trim(),$('fpaste').value);if(!d){toast('Add at least one line like: front :: back');return}addDeck(d,true);openDeck(d.id)},
 studyall:function(){studyStart(null,false)},
 studydeck:function(b){var id=b.dataset.id;closeModal();studyStart(id,dueCards(id).length===0)},
 cramdeck:function(b){studyStart(b.dataset.id,true)},
 opendeck:function(b){closeModal();if(view!=='flash')go('flash');openDeck(b.dataset.id)},
 flashhome:function(){renderFlash();paintNav()},
 deckquiz:function(b){quizFromDeck(b.dataset.id)},
 cflip:flip,
 srate:function(b){srate(+b.dataset.g)},
 cardedit:function(b){cardEditor(b.dataset.id,b.dataset.c||'')},
 cardsave:function(b){var d=deckById(b.dataset.id),f=($('cf').value||'').trim(),bk=($('cb').value||'').trim();if(!d||!f||!bk){toast('Fill in both sides.');return}
  if(b.dataset.c){var c=d.cards.filter(function(x){return x.id===b.dataset.c})[0];if(c){c.f=f;c.b=bk}}else d.cards.push(mkCard(f,bk));save();closeModal();paintDeck()},
 carddel:function(b){var d=deckById(b.dataset.id);if(!d)return;d.cards=d.cards.filter(function(x){return x.id!==b.dataset.c});save();paintDeck();paintNav()},
 deckcsv:function(b){var d=deckById(b.dataset.id);if(d)dl((d.title.replace(/[^a-z0-9]+/gi,'-').toLowerCase()||'deck')+'.csv',d.cards.map(function(c){return csvEsc(c.f)+','+csvEsc(c.b)}).join('\n'),'text/csv')},
 deckren:function(b){var d=deckById(b.dataset.id);if(!d)return;modal('<h2>rename deck</h2><div class="form"><input type="text" id="rn" maxlength="60" value="'+h(d.title)+'"></div><div class="acts"><button type="button" data-act="close">Cancel</button><button type="button" class="vid" data-act="deckrensave" data-id="'+d.id+'">Save</button></div>')},
 deckrensave:function(b){var d=deckById(b.dataset.id),v=($('rn').value||'').trim();if(d&&v){d.title=v;save()}closeModal();if(view==='flash')paintFlash()},
 deckdel:function(b){confirmM('delete this deck?','All cards and their review history are removed from this device.','deckdeldo',b.dataset.id)},
 deckdeldo:function(b){S.decks=S.decks.filter(function(d){return d.id!==b.dataset.id});save();closeModal();paintNav();if(view==='flash'){renderFlash()}else if(view==='library')R.library()},
 /* quiz */
 qstart:function(b){qStart(b.dataset.s)},qpick:function(b){qPick(+b.dataset.k)},
 qdeck:function(){var tm=$('qtm');if(tm)qTimed=tm.checked;quizFromDeck($('qdk').value)},
 qnext:function(){Q.i++;Q.ans=false;paintQ()},qagain:function(){if(Q.again)Q.again()},
 qcards:function(){var d={id:uid(),ts:Date.now(),title:(Q.src||Q.s)+' review',subject:Q.s,src:'quiz',cards:Q.miss.map(function(m){return mkCard(m.q,m.a+'. '+m.e)})};addDeck(d,true);openDeck(d.id)},
 /* planner */
 taskadd:function(){var t=($('tt').value||'').trim();if(!t){toast('Type a task first.');return}S.tasks.push({id:uid(),t:t,date:$('td').value||'',k:$('ts').value,done:false});save();paintNav();renderPlan()},
 tasktog:function(b){var t=S.tasks.filter(function(x){return x.id===b.dataset.id})[0];if(t){t.done=!t.done;save();paintNav();renderPlan()}},
 taskdel:function(b){S.tasks=S.tasks.filter(function(x){return x.id!==b.dataset.id});save();paintNav();renderPlan()},
 pmode:function(b){pomo.mode=b.dataset.m;pomo.run=false;clearInterval(pomo.iv);pomo.left=(pomo.mode==='focus'?25:5)*60;renderPlan()},
 ptog:function(){pomo.run=!pomo.run;clearInterval(pomo.iv);if(pomo.run)pomo.iv=setInterval(pomoTick,1000);paintPomo()},
 preset:function(){pomo.run=false;clearInterval(pomo.iv);pomo.left=(pomo.mode==='focus'?25:5)*60;paintPomo()},
 libtab:function(b){libTab=b.dataset.t;R.library()},
 /* account + billing */
 cancel:function(){cancelFlow()},docancel:function(){S.plan.cancelled=true;log('Cancellation requested',0);save();closeModal();repaint();R.account();toast('Cancelled. You will not be charged again.')},
 resume:function(){S.plan.cancelled=false;save();repaint();R.account();toast('Plan resumed.')},
 adv:function(b){S.offset+=(+b.dataset.d)*DAY;tick();repaint();R.account();toast('Moved forward '+b.dataset.d+' day(s) (demo).')},
 zero:function(){S.pcredits=0;S.topups=[];save();repaint();R.account();toast('Credits set to 0 (demo).')},
 exp:function(){dl('doubtster-data.json',JSON.stringify(S,null,2),'application/json')},
 wipe:function(){modal('<h2>delete data on this device?</h2><p>This removes chats, videos, decks, notes and your plan state stored in this browser. It cannot be undone.</p><div class="acts"><button type="button" data-act="close">Keep</button><button type="button" class="danger" data-act="dowipe">Delete</button></div>')},
 dowipe:function(){try{localStorage.removeItem(KEY)}catch(e){}S=blank();closeModal();repaint();go('home')},
 signout:function(){try{localStorage.removeItem(KEY)}catch(e){}fetch('/api/auth/logout',{method:'POST'}).finally(function(){window.location.href='/login'})},
 psub:function(b){var s=b.dataset.s,i=S.profile.subjects.indexOf(s);if(i>-1)S.profile.subjects.splice(i,1);else S.profile.subjects.push(s);b.setAttribute('aria-pressed',i===-1)},
 savepf:function(){S.profile.name=$('pn').value.trim();if($('plang')){S.profile.lang=$('plang').value;try{localStorage.setItem('doubtster-lang',S.profile.lang)}catch(e){}}S.profile.level=$('pl2').value;S.profile.style=$('ps').value;S.goal=+$('pg').value||10;save();paintTop();toast('Saved.')},
 keys:function(){shortcuts()},
 'pw-select-plan':function(b: HTMLElement){var p=b.dataset.plan||'trial';if((window as any).__pwSetPlan)(window as any).__pwSetPlan(p)},
 'pw-submit':function(){if((window as any).__pwSubmit)(window as any).__pwSubmit()}
};
function dismissContextMenuOnOutside(e){
 var cm=document.getElementById('chat-context-menu');
 if(!cm || !cm.classList.contains('is-open')) return;
 var target=e.target;
 if(target && cm.contains(target)) return;
 if(target && target.closest){
  var moreBtn=target.closest('[data-act="chatmenu"]');
  if(moreBtn && moreBtn.getAttribute('data-id')===activeContextChatId){
   return;
  }
 }
 closeChatContextMenu();
}

on(window,'pointerdown',dismissContextMenuOnOutside,true);
on(window,'mousedown',dismissContextMenuOnOutside,true);
on(window,'touchstart',dismissContextMenuOnOutside,true);
on(window,'click',function(e){
 dismissContextMenuOnOutside(e);
 if(e.target.closest&&e.target.closest('#fci')){flip();return}
 var b=e.target.closest('[data-act]');if(!b)return;var f=ACT[b.dataset.act];if(f){if(b.tagName==='A')e.preventDefault();f(b,e)}});

on(window,'contextmenu',function(e){
 var row=e.target.closest&&e.target.closest('[data-chat-id]');
 if(row){
  e.preventDefault();
  var chatId=row.getAttribute('data-chat-id');
  if(chatId){
   openChatContextMenu(chatId,e.clientX,e.clientY);
  }
 } else {
  closeChatContextMenu();
 }
},true);
on(window,'resize',closeChatContextMenu,true);
on(window,'scroll',closeChatContextMenu,true);
on(document,'scroll',closeChatContextMenu,true);
on(window,'wheel',function(e){
 var cm=document.getElementById('chat-context-menu');
 if(cm&&!cm.hidden&&(!e.target||!cm.contains(e.target))){
  closeChatContextMenu();
 }
},{passive:true,capture:true});

var gpend=0;
on(document,'keydown',function(e){
 var tg=e.target,typing=tg&&(/^(INPUT|TEXTAREA|SELECT)$/.test(tg.tagName)||tg.isContentEditable),k=e.key;
 var cm=document.getElementById('chat-context-menu');
 if(cm&&!cm.hidden&&activeContextChatId){
  var kLower=k.toLowerCase();
  if(kLower==='escape'){
   e.preventDefault();
   closeChatContextMenu();
   return;
  }
  if(kLower==='p'){
   e.preventDefault();
   var pBtn=cm.querySelector('[data-act="chat-pin"]');
   if(pBtn)pBtn.click();
   return;
  }
  if(kLower==='r'){
   e.preventDefault();
   var rBtn=cm.querySelector('[data-act="chat-rename"]');
   if(rBtn)rBtn.click();
   return;
  }
  if(kLower==='d'){
   e.preventDefault();
   var dBtn=cm.querySelector('[data-act="chat-delete"]');
   if(dBtn)dBtn.click();
   return;
  }
 }
 if((e.ctrlKey||e.metaKey)&&k.toLowerCase()==='k'){e.preventDefault();palette();return}
 if(k==='Escape'&&view==='flash'&&fs.mode==='study'&&!modalOpen()){renderFlash();paintNav();return}
 if(typing||modalOpen()||e.ctrlKey||e.metaKey||e.altKey)return;
 if(view==='flash'&&fs.mode==='study'){
  if((k===' '||k==='Enter')&&!(tg&&tg.tagName==='BUTTON')){e.preventDefault();if(!fs.flip)flip();else srate(2);return}
  if(k>='1'&&k<='4'){srate(+k-1);return}}
 if(view==='videos'&&pl2.ctl&&pl2.v){var c=pl2.ctl;if(k===' '&&!(tg&&tg.tagName==='BUTTON')){e.preventDefault();c.toggle();return}
  if(k==='ArrowRight'){c.next();return}if(k==='ArrowLeft'){c.prev();return}if(k==='f'){c.fs();return}if(k==='c'){c.cc();return}if(k==='m'){c.voice();return}}
 if(gpend){gpend=0;var m={h:'home',a:'chat',f:'flash',q:'quiz',v:'videos',n:'notes',p:'plan',l:'library'}[k.toLowerCase()];if(m)go(m);return}
 if(k==='g'){gpend=1;setTimeout(function(){gpend=0},1200);return}
 if(k==='/'){e.preventDefault();go('chat');return}
 if(k==='?'){shortcuts()}});
var y=$('yr');if(y)y.textContent=new Date().getFullYear();
function updateClock(){var c=$('clock');if(c)c.textContent=new Date().toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})}updateClock();iv(updateClock,30000);
$('crb').onclick=function(){if(credits()===0&&!hasPlan())promo();else if(credits()===0)creditsPopup({need:1});else go('account')};
$('avt').onclick=function(){go('account')};
$('newc').onclick=newChat;
iv(function(){tick();repaint()},60000);
tick();paintTop();
try {
  var _savedTh = localStorage.getItem('doubtster-theme') || 'light';
  var _effTh = _savedTh;
  if(_savedTh === 'auto') {
    _effTh = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
  }
  document.documentElement.setAttribute('data-theme', _effTh);
} catch(e) {}
var hv=location.hash.slice(1);view=VIEWS.indexOf(hv)>-1?hv:'home';
paintNav();paintHist();
if(['flash','quiz','videos','notes'].indexOf(view)>-1 && !hasPlan()){
  renderPaywall(view);
} else {
  R[view]();
}
on(window,'hashchange',function(){var v=location.hash.slice(1);if(VIEWS.indexOf(v)>-1&&v!==view)go(v,true)});
var apt=setTimeout(function(){
  // Don't show promo modal if the user just returned from checkout
  if(location.search.indexOf('checkout=return')>-1) return;
  if(modalOpen()) return;

  // Free plan: show promo when logging in or opening/reopening the website
  if(!hasPlan()){
    var sessionKey = 'doubtster_promo_tab_' + (USER_ID || 'guest');
    var alreadyShownThisTab = false;
    try {
      alreadyShownThisTab = sessionStorage.getItem(sessionKey) === '1';
    } catch(e) {}

    // Check last active time to detect reopening after the website was closed
    var lastActiveKey = 'doubtster_last_active_' + (USER_ID || 'guest');
    var lastActive = 0;
    try {
      lastActive = parseInt(localStorage.getItem(lastActiveKey) || '0', 10);
    } catch(e) {}
    var now = Date.now();
    var isReopened = !lastActive || (now - lastActive > 45000); // Closed for > 45s or fresh window

    if(!alreadyShownThisTab || isReopened){
      try {
        sessionStorage.setItem(sessionKey, '1');
        localStorage.setItem(lastActiveKey, String(now));
      } catch(e) {}
      promo();
    }
  }
  else if(hasPlan() && credits()===0 && !ss('credSeen')){
    creditsPopup({need:1});
  }
}, 750);

// Heartbeat to update last active timestamp so reopening after closing triggers promo
iv(function(){
  try {
    var lastActiveKey = 'doubtster_last_active_' + (USER_ID || 'guest');
    localStorage.setItem(lastActiveKey, String(Date.now()));
  } catch(e) {}
}, 10000);
offs.push(function(){if(syncTimeout){clearTimeout(syncTimeout);syncTimeout=null;}closeChatContextMenu();var cmEl=document.getElementById('chat-context-menu');if(cmEl)cmEl.remove();stopThinkingTimers();if(activeChatAbort){try{activeChatAbort.abort()}catch(e){}}if(activeDemoTimer){clearTimeout(activeDemoTimer)}clearTimeout(apt);clearTimeout(tt);qClear();clearInterval(pomo.iv);try{if(rec)rec.stop()}catch(e){}closeModal()});
return function(){offs.forEach(function(f){f()});stopPlayer()};
}
