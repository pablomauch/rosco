/* El Rosco — modo en familia (salas en línea)
   Un teléfono crea la sala y actúa como anfitrión (lleva el estado del juego).
   Los demás se conectan directo a él por WebRTC (PeerJS); el servidor público de PeerJS
   solo se usa para el primer contacto. Con ?bc=1 se usa BroadcastChannel (pruebas en un mismo navegador). */
"use strict";
(function(){

/* ---------- estilos y pantallas ---------- */
const css = `
.code{font-family:var(--display);font-size:52px;font-weight:800;letter-spacing:.14em;color:var(--lemon);text-align:center;line-height:1;padding-left:.14em}
.qr{display:flex;justify-content:center}.qr img,.qr canvas{border:8px solid #fff;border-radius:14px;width:168px;height:168px}
.plist{display:grid;gap:6px}
.pl{display:flex;align-items:center;gap:10px;padding:11px 14px;border-radius:14px;border:1px solid var(--hair);font-weight:500}
.pl .n{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:flex;align-items:center;gap:8px}
.pl .n svg.i{width:15px;height:15px;color:var(--lemon)}
.pl.me{border-color:var(--lemon)}.pl.out{opacity:.4;text-decoration:line-through}.pl.elim{border-color:var(--coral);background:rgba(255,84,112,.12)}
.pl .s{font-family:var(--num);font-size:14px;font-variant-numeric:tabular-nums;color:var(--lemon);font-weight:600}
.pl .st{font-size:12.5px;color:var(--mut)}
.mk{width:20px;height:20px;border-radius:50%;display:grid;place-items:center;flex:0 0 20px;border:1px solid var(--hair2)}
.mk.y{background:var(--mint);border-color:var(--mint);color:#032417}.mk.no{background:var(--coral);border-color:var(--coral);color:#2b0610}
.pl .n .mk svg.i{width:12px;height:12px;stroke-width:2.6;color:inherit}
.mk svg.i{width:12px;height:12px;stroke-width:2.6}
.mk.w{border-style:dashed;animation:spin 6s linear infinite}
.badge{font-size:12px;padding:2px 9px;border-radius:999px;border:1px solid rgba(255,225,77,.5);color:var(--lemon);font-weight:600}
.waiting{text-align:center;padding:14px;border-radius:18px;border:1px dashed var(--hair2);color:var(--mut);font-weight:500}
.duelbar{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.dp{padding:12px 10px;border-radius:20px;border:1px solid var(--hair);text-align:center;transition:border-color .3s,background .3s}
.dp.act{border-color:var(--lemon);background:rgba(255,225,77,.07)}
.dp .nm{font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dp .tm{font-family:var(--display);font-size:30px;font-weight:600;font-variant-numeric:tabular-nums;margin:2px 0}
.dp .tm.low{color:var(--warn)}.dp .tm.crit{color:var(--coral)}
.dp .sc{font-size:14px;display:flex;gap:12px;justify-content:center;font-weight:600}
.flash{text-align:center;font-size:18px;font-weight:600;padding:12px 14px;border-radius:18px;border:1px solid var(--hair2)}
.flash.bad{border-color:var(--coral);background:rgba(255,84,112,.12)}.flash.pass{border-color:var(--blue);background:rgba(74,107,255,.12)}
.flash.good{border-color:var(--mint);background:rgba(47,217,154,.14)}
input.txt{width:100%;font:inherit;font-size:20px;font-weight:500;padding:13px;border-radius:16px;border:1px solid var(--hair2);background:rgba(10,4,26,.55);color:var(--ink);text-align:center;outline:none;-webkit-user-select:text;user-select:text}
input.txt:focus{border-color:var(--lemon)}
`;
document.head.insertAdjacentHTML('beforeend', `<style>${css}</style>`);
document.querySelector('#app').insertAdjacentHTML('beforeend', `
<section class="screen" id="s-mpmenu">
  <div class="top"><h2>Jugar en familia</h2><button class="icon" id="mp-menu-close" aria-label="Cerrar">${ic('close')}</button></div>
  <div class="card"><p>Todos contra todos: cada uno responde en su celular, en cada ronda se elimina a los últimos y los dos mejores se enfrentan en el rosco final.</p></div>
  <div class="card cfg">
    <h3>Tu nombre</h3>
    <input class="txt" id="mp-name" maxlength="14" placeholder="Ej: Pablo" autocomplete="off" autocorrect="off" spellcheck="false">
  </div>
  <button class="btn-main" id="mp-create">${ic('plus')}Crear sala</button>
  <div class="card">
    <h3>Unirme a una sala</h3>
    <input class="txt" id="mp-code" maxlength="4" placeholder="Código" autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false" style="letter-spacing:.3em;text-transform:uppercase">
    <button id="mp-join" style="width:100%;margin-top:10px">Unirme</button>
  </div>
  <p class="mut small" style="text-align:center">Se necesita internet. Funciona mejor si todos están en el mismo wifi.</p>
</section>
<section class="screen" id="s-mp">
  <div class="top">
    <button class="icon" id="mp-exit" aria-label="Salir">${ic('close')}</button>
    <span class="mut small" id="mp-label" style="text-align:center;flex:1;font-weight:500"></span>
    <div class="timer" id="mp-timer" style="visibility:hidden">0</div>
  </div>
  <div id="mp-body" style="display:flex;flex-direction:column;gap:14px"></div>
</section>`);
document.querySelector('#b-help') && document.querySelector('#s-help').insertAdjacentHTML('beforeend', `
  <div class="card"><h3>Jugar en familia</h3><p>Uno crea la sala y los demás entran con el código de 4 letras o escaneando el QR. Todos responden la misma pregunta a la vez: se gana por acertar y por rapidez. Al final de cada ronda quedan eliminados los últimos (si hay empate, pregunta de desempate). Los dos finalistas juegan el rosco por turnos, como en la tele: al fallar o pasar, se detiene su reloj y juega el otro. El celular del anfitrión debe quedar con la pantalla encendida.</p></div>`);

/* ---------- transporte ---------- */
const TEST_BC = /[?&]bc=1/.test(location.search);
const PREFIX = 'elrosco-pm-';
const PEER_OPTS = {debug:0, config:{iceServers:[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:global.stun.twilio.com:3478'}]}};
function mkConn(send){ const w={send, _d:null, _c:null, onData(f){w._d=f;}, onClose(f){w._c=f;}, close(){}}; return w; }
function wrapPeer(c){
  const w = mkConn(o=>{ try{ if(c.open) c.send(o); }catch(e){} });
  c.on('data', d=>w._d && w._d(d)); const cl=()=>{ if(!w.closed){ w.closed=true; w._c && w._c(); } };
  c.on('close', cl); c.on('error', cl); w.close=()=>{ try{ c.close(); }catch(e){} }; return w;
}
function hostListen(code, h){
  if(TEST_BC){
    const ch=new BroadcastChannel('rosco-'+code), conns={};
    ch.onmessage=e=>{ const m=e.data; if(m.to!=='host') return;
      if(m.k==='hi'){ const w=mkConn(o=>ch.postMessage({to:m.from,k:'d',d:o})); conns[m.from]=w; ch.postMessage({to:m.from,k:'ok'}); h.join(w); }
      else if(m.k==='d'){ const w=conns[m.from]; w && w._d && w._d(m.d); }
      else if(m.k==='bye'){ const w=conns[m.from]; w && w._c && w._c(); } };
    setTimeout(()=>h.ready(), 20); return {destroy(){ ch.close(); }};
  }
  if(!window.Peer){ setTimeout(()=>h.error({type:'nolib'}),10); return {destroy(){}}; }
  const peer = new Peer(PREFIX+code.toLowerCase(), PEER_OPTS);
  peer.on('open', ()=>h.ready());
  peer.on('error', e=>h.error(e));
  peer.on('connection', c=>{ const w=wrapPeer(c); c.on('open', ()=>h.join(w)); });
  peer.on('disconnected', ()=>{ setTimeout(()=>{ try{ if(!peer.destroyed) peer.reconnect(); }catch(e){} }, 1500); });
  return {destroy(){ try{ peer.destroy(); }catch(e){} }};
}
function clientConnect(code, h){
  if(TEST_BC){
    const id='c'+Math.random().toString(36).slice(2,9), ch=new BroadcastChannel('rosco-'+code);
    const w=mkConn(o=>ch.postMessage({to:'host',from:id,k:'d',d:o}));
    ch.onmessage=e=>{ const m=e.data; if(m.to!==id) return; if(m.k==='ok') h.open(w); else if(m.k==='d') w._d && w._d(m.d); };
    ch.postMessage({to:'host',from:id,k:'hi'});
    return {destroy(){ ch.postMessage({to:'host',from:id,k:'bye'}); ch.close(); }};
  }
  if(!window.Peer){ setTimeout(()=>h.error({type:'nolib'}),10); return {destroy(){}}; }
  const peer = new Peer(PEER_OPTS); let opened=false;
  peer.on('open', ()=>{ const c=peer.connect(PREFIX+code.toLowerCase(), {reliable:true}); const w=wrapPeer(c);
    c.on('open', ()=>{ opened=true; h.open(w); });
    setTimeout(()=>{ if(!opened) h.error({type:'timeout'}); }, 15000); });
  peer.on('error', e=>{ if(!opened) h.error(e); });
  return {destroy(){ try{ peer.destroy(); }catch(e){} }};
}
const newCode = () => Array.from({length:4},()=>'ABCDEFGHJKMNPQRSTUVWXYZ'[Math.random()*23|0]).join('');
const myPid = () => { let p=LS.get('pid',''); if(!p){ p='p'+Math.random().toString(36).slice(2,10); LS.set('pid',p); } return p; };

/* =====================================================================
   ANFITRIÓN
   ===================================================================== */
let H = null;
const HOST_PID = 'host';
function scrambleTiles(w){ const L=norm(w).toUpperCase().split(''); let s, n=0; do{ s=shuffle(L); n++; }while(s.join('')===L.join('') && n<20); return s; }

function hostCreate(){
  const name = ($('#mp-name').value||'').trim(); cfg.nombre = name; saveCfg();
  SFX.init(); keepAwake(true);
  const code = newCode();
  H = {code, players:[], phase:'lobby', key:1, timers:[],
    set:{rondas:3, preg:5, tPreg:20, voz:cfg.voz, audio:'anfitrion', hostPlays:true, hostName:name||'Anfitrión'}};
  H.net = hostListen(code, {
    ready(){ toast('Sala '+code+' lista'); addHostPlayer(); show('mp'); render(); },
    error(e){ if(e && e.type==='unavailable-id'){ H.net.destroy(); H=null; return hostCreate(); }
      toast(e && e.type==='nolib' ? 'Sin internet: no se puede crear la sala' : 'Error de conexión ('+(e&&e.type||'?')+')');
      if(H && H.phase==='lobby' && !H.players.some(p=>p.conn)) { hostClose(); } },
    join(conn){
      let pid=null;
      conn.onData(m=>{
        if(m && m.t==='hola'){ pid = m.pid; hJoin(pid, m.name, conn); }
        else if(pid) hRecv(pid, m);
      });
      conn.onClose(()=>{ const p=H && H.players.find(x=>x.pid===pid && x.conn===conn); if(p){ p.online=false; p.conn=null; bc(); checkAllAnswered(); } });
    }
  });
}
function addHostPlayer(){
  H.players = H.players.filter(p=>p.pid!==HOST_PID);
  if(H.set.hostPlays) H.players.unshift(newPlayer(HOST_PID, H.set.hostName, null));
}
function newPlayer(pid, name, conn){ return {pid, name, conn, online:true, alive:true, spectator:false, round:0, rtime:0, secs:0, ans:null, elimNow:false, wins:0}; }
function uniqueName(name, pid){
  name = (name||'Jugador').trim().slice(0,14) || 'Jugador'; let n=name, i=2;
  while(H.players.some(p=>p.pid!==pid && p.name.toLowerCase()===n.toLowerCase())) n = name+' '+(i++);
  return n;
}
function hJoin(pid, name, conn){
  let p = H.players.find(x=>x.pid===pid);
  if(p){ p.conn=conn; p.online=true; }
  else { p = newPlayer(pid, uniqueName(name, pid), conn);
    if(H.phase!=='lobby'){ p.alive=false; p.spectator=true; }
    H.players.push(p); if(H.phase==='lobby') SFX.coin(); }
  bc();
}
function hRecv(pid, m){
  if(!H || !m) return;
  if(m.t==='ans') return hAnswer(pid, m);
  if(m.t==='dans') return hDuelAnswer(pid, m);
}
function clearTimers(){ H.timers.forEach(t=>clearTimeout(t)); H.timers=[]; }
const later = (f, ms) => { const t=setTimeout(()=>{ if(H) f(); }, ms); H.timers.push(t); return t; };

/* --- audio común: suena en el anfitrión y, si así se configuró, en todos --- */
function fx(s, sayTxt){
  if(s && SFX[s]) SFX[s]();
  if(sayTxt && H.set.voz) VOZ.say(sayTxt);
  if(H.set.audio==='todos') H.players.forEach(p=>{ if(p.conn && p.online) p.conn.send({t:'fx', s, say: H.set.voz ? sayTxt : null}); });
}
function fxTo(pid, s){
  if(pid===HOST_PID){ if(SFX[s]) SFX[s](); return; }
  const p=H.players.find(x=>x.pid===pid); if(p && p.conn) p.conn.send({t:'fx', s});
}

/* --- inicio de partida --- */
function hStart(){
  const playing = H.players.filter(p=>p.online && (p.pid!==HOST_PID || H.set.hostPlays));
  if(playing.length < 2){ toast('Se necesitan al menos 2 jugadores'); return; }
  H.players.forEach(p=>{ const plays = playing.includes(p); p.alive=plays; p.spectator=!plays; p.secs=0; p.round=0; p.rtime=0; p.elimNow=false; p.ans=null; });
  const N = playing.length; let R = H.set.rondas; if(N>2 && R<1) R=1;
  let enabled = Object.keys(GAMES).filter(k=>cfg.g[k]); if(!enabled.length) enabled=['cuatro'];
  const games=[]; while(games.length<R) games.push(...shuffle(enabled)); games.length=R;
  const elim = r => Math.floor((N-2)*(r+1)/R) - Math.floor((N-2)*r/R);
  H.plan = games.map((g,r)=>({g, elim:elim(r), qs:buildQs(g, H.set.preg)}));
  const pool = roscosDe(cfg.nivel); let free = shuffle(pool.filter(r=>!used[r.id]));
  if(free.length<2) free = free.concat(shuffle(pool.filter(r=>!free.includes(r))));
  H.roscos = free.slice(0,2); H.roscos.forEach(r=>markUsed(r.id));
  H.r = 0; SFX.init();
  if(!H.plan.length) return hDuelIntro();
  hIntro();
}
function buildQs(g, n){
  const items = pickItems(g), out=[];
  if(g==='encadenadas'){
    for(const c of items){ markUsed(c.id);
      c.w.forEach((w,i)=>out.push({g, start:(i? c.k[i-1] : norm(w.r)[0]).toUpperCase(), text:w.d, ans:[w.r], prev: i? c.w[i-1].r : null}));
      if(out.length>=n) break; }
    return out.slice(0,n);
  }
  for(const it of items.slice(0,n)){ markUsed(it.id);
    if(g==='cuatro') out.push({g, text:it.p, opts:it.o, c:it.c, ans:[it.o[it.c]]});
    else if(g==='pista') out.push({g, clues:it.h, ans:it.r});
    else out.push({g, tiles:scrambleTiles(it.r), hint:it.h, len:norm(it.r).length, ans:[it.r]});
  }
  return out;
}
function setPhase(ph){ H.phase=ph; H.key++; }

function hIntro(){
  clearTimers(); const pl=H.plan[H.r], g=GAMES[pl.g];
  H.players.forEach(p=>{ p.round=0; p.rtime=0; p.elimNow=false; });
  setPhase('intro'); bc();
  const alive=H.players.filter(p=>p.alive).length;
  fx('whoosh', `Ronda ${H.r+1}. ${g.name}. ${pl.elim ? (pl.elim===1?'Al final queda eliminado un jugador.':`Al final quedan eliminados ${pl.elim} jugadores.`) : (alive>2?'En esta ronda no hay eliminados.':'')}`);
}
function hCountdown(next){ clearTimers(); setPhase('count'); bc(); later(next, 3300); }

/* --- preguntas simultáneas --- */
function hAskQ(q, who, onEnd, label){
  clearTimers();
  H.q=q; H.who=new Set(who.map(p=>p.pid)); H.onQEnd=onEnd; H.qLabel=label;
  H.players.forEach(p=>p.ans=null);
  H.clues = 1;
  const dur = (q.g==='pista' ? H.set.tPreg*1.6 : H.set.tPreg) * 1000;
  H.qStart = Date.now(); H.qEnd = H.qStart + dur; H.dur=dur;
  setPhase('q'); bc();
  if(q.g==='pista') for(let k=1;k<4;k++) later(()=>{ if(H.phase==='q' && H.q===q){ H.clues=k+1; bc(); fx(null, q.clues[k]); } }, dur*k/4);
  later(hEndQ, dur);
  const t = q.g==='cuatro' ? q.text+' '+q.opts.map((o,i)=>'ABCD'[i].toLowerCase()+': '+o).join('. ')
    : q.g==='pista' ? 'Primera pista: '+q.clues[0]
    : q.g==='anagramas' ? q.hint+'. '+q.len+' letras.'
    : 'Empieza con '+q.start.toLowerCase()+'. '+q.text;
  fx(null, t);
}
function hAnswer(pid, m){
  if(H.phase!=='q' || m.key!==H.key || !H.who.has(pid)) return;
  const p=H.players.find(x=>x.pid===pid); if(!p || p.ans) return;
  const ms = Date.now()-H.qStart, q=H.q;
  const ok = q.g==='cuatro' ? m.v===q.c : matches(String(m.v||''), q.ans);
  p.ans = {v:m.v, ms, ok, clues:H.clues};
  bc(); checkAllAnswered();
}
function checkAllAnswered(){
  if(!H || H.phase!=='q') return;
  const who = H.players.filter(p=>H.who.has(p.pid) && p.online);
  if(who.length && who.every(p=>p.ans)){ clearTimers(); later(hEndQ, 500); }
}
function hEndQ(){
  if(H.phase!=='q') return; clearTimers();
  const q=H.q, scoring = !H.tie;
  H.res = H.players.filter(p=>H.who.has(p.pid)).map(p=>{
    const a=p.ans; let pts=0, secs=0;
    if(a && a.ok){ pts = 100 + Math.round(50*Math.max(0,1-a.ms/H.dur)); secs = cfg.segAcierto;
      if(q.g==='pista'){ pts += 25*(4-a.clues); secs += 2*(4-a.clues); } }
    if(scoring){ p.round += pts; p.secs += secs; if(a && a.ok) p.rtime += a.ms; }
    return {pid:p.pid, name:p.name, ok:!!(a&&a.ok), answered:!!a, ms:a?a.ms:null, pts, secs, given: a ? (q.g==='cuatro' ? q.opts[a.v] : a.v) : null};
  }).sort((a,b)=>(b.ok-a.ok) || ((a.ms??1e9)-(b.ms??1e9)));
  setPhase('reveal'); bc();
  H.res.forEach(r=>fxTo(r.pid, r.ok?'ok':'bad'));
  fx('whoosh', 'La respuesta era: '+q.ans[0]);
  later(()=>H.onQEnd(), 4200);
}

/* --- rondas --- */
function hRunRound(){
  const pl = H.plan[H.r]; H.tie=null; let i=0;
  const alive = () => H.players.filter(p=>p.alive);
  const next = () => { if(i < pl.qs.length){ const q=pl.qs[i]; i++; hAskQ(q, alive(), next, `Ronda ${H.r+1} · Pregunta ${i} de ${pl.qs.length}`); } else hRoundEnd(); };
  next();
}
function hRoundEnd(){
  const pl=H.plan[H.r], alive=H.players.filter(p=>p.alive);
  const k = Math.min(pl.elim, alive.length-2);
  alive.sort((a,b)=>(b.round-a.round) || (a.rtime-b.rtime));
  if(k<=0) return hStandings([]);
  const cut = alive[alive.length-k], above = alive[alive.length-k-1];
  const same = (a,b) => a.round===b.round && a.rtime===b.rtime;
  if(!same(cut, above)) return hStandings(alive.slice(-k));
  const group = alive.filter(p=>same(p,cut));
  const safe = alive.filter(p=>!group.includes(p) && ((p.round>cut.round) || (p.round===cut.round && p.rtime<cut.rtime)));
  const below = alive.filter(p=>!group.includes(p) && !safe.includes(p));
  const surviveN = alive.length - k - safe.length;
  H.tie = {group, surviveN, below};
  const pick = shuffle(B.cuatro)[0];
  const q = {g:'cuatro', text:pick.p, opts:pick.o, c:pick.c, ans:[pick.o[pick.c]]};
  setPhase('tieIntro'); bc();
  fx('alarm', 'Hay empate. Pregunta de desempate para ' + group.map(p=>p.name).join(', '));
  later(()=>hAskQ(q, group, ()=>{
    const ord = shuffle(group).sort((a,b)=>{ const ra=H.res.find(r=>r.pid===a.pid), rb=H.res.find(r=>r.pid===b.pid);
      return (rb.ok-ra.ok) || ((ra.ms??1e9)-(rb.ms??1e9)); });
    const out = ord.slice(H.tie.surviveN).concat(H.tie.below); H.tie=null; hStandings(out);
  }, 'Desempate'), 4500);
}
function hStandings(out){
  clearTimers();
  H.players.forEach(p=>p.elimNow=false);
  out.forEach(p=>{ p.alive=false; p.elimNow=true; });
  setPhase('standings'); bc();
  fx(out.length?'end':'fanfare', out.length ? (out.length===1 ? `Queda eliminado ${out[0].name}.` : `Quedan eliminados ${out.map(p=>p.name).join(' y ')}.`) : 'Nadie queda eliminado en esta ronda.');
}
function hContinue(){ H.r++; if(H.r < H.plan.length) hIntro(); else hDuelIntro(); }

/* --- duelo final alternado --- */
function hDuelIntro(){
  clearTimers();
  const fin = H.players.filter(p=>p.alive).sort((a,b)=>(b.secs-a.secs) || (b.round-a.round)).slice(0,2);
  H.players.forEach(p=>{ if(!fin.includes(p)) p.alive=false; p.elimNow=false; });
  const D = H.D = {pl: fin.map((p,i)=>({pid:p.pid, name:p.name, ro:H.roscos[i] || H.roscos[0], st:Array(25).fill(0), given:Array(25).fill(''),
    q:[...Array(25).keys()], left:(cfg.tRosco + p.secs)*1000, done:false})), running:false, turn:0, flash:null};
  D.turn = D.pl[0].left <= D.pl[1].left ? 0 : 1;
  setPhase('duelIntro'); bc();
  fx('fanfare', `Gran final. ${D.pl[0].name} contra ${D.pl[1].name}. Empieza ${D.pl[D.turn].name}, que tiene menos tiempo.`);
  if(H.duelIv) clearInterval(H.duelIv);
  H.duelIv = setInterval(hDuelTick, 100);
}
function hDuelTick(){
  const D=H && H.D; if(!D || !D.running) return;
  const now=Date.now(), p=D.pl[D.turn]; p.left -= now-D.t0; D.t0=now;
  if(p.left<=0){ p.left=0; p.done=true; D.running=false; D.flash={res:'time', name:p.name}; H.key++; bc(); fx('alarm', 'Se acabó el tiempo de '+p.name); later(hDuelNext, 2200); }
}
function hDuelTurn(i){
  clearTimers(); const D=H.D; D.turn=i; D.running=false; D.flash=null;
  setPhase('duel'); bc(); fx(null, 'Turno de '+D.pl[i].name);
  later(()=>{ D.running=true; D.t0=Date.now(); H.key++; bc(); sayLetter(); }, 1800);
}
function sayLetter(){ const D=H.D, p=D.pl[D.turn]; fx(null, letraTxt(p.ro.p[p.q[0]])); }
function hDuelAnswer(pid, m){
  const D=H.D; if(!D || H.phase!=='duel' || !D.running || m.key!==H.key) return;
  const p=D.pl[D.turn], isHost = pid===HOST_PID || pid==='tv';
  if(p.pid!==pid && !isHost) return;
  if(isHost && p.pid!==pid && !m.override) return;
  const now=Date.now(); p.left -= now-D.t0; D.t0=now;
  const i=p.q[0], it=p.ro.p[i];
  const res = m.pass ? 'pass' : m.override ? m.override : (matches(String(m.v||''), it.r) ? 'ok' : 'bad');
  if(!m.pass && m.v) p.given[i]=m.v;
  if(res==='ok'){ p.st[i]=1; p.q.shift(); }
  else if(res==='bad'){ p.st[i]=2; p.q.shift(); if(cfg.penal) p.left=Math.max(0,p.left-cfg.penal*1000); }
  else p.q.push(p.q.shift());
  if(!p.q.length) p.done=true;
  fx(res==='ok'?'ok':res==='bad'?'bad':'pass'); if(H.set.audio!=='todos') fxTo(p.pid, res==='ok'?'ok':res==='bad'?'bad':'pass');
  const other = D.pl[1-D.turn];
  if(res==='ok' && !p.done){ H.key++; bc(); sayLetter(); return; }
  if(res==='pass' && other.done){ H.key++; bc(); sayLetter(); return; }
  D.running=false; D.flash = res==='ok' ? {res:'done', name:p.name} : {res, letter:it.l, ans:it.r[0], given:m.v||'', name:p.name};
  H.key++; bc();
  if(res==='bad') fx(null, 'No. Era '+it.r[0]);
  later(hDuelNext, res==='bad' ? 2200 : 1100);
}
function hDuelNext(){
  const D=H.D; if(D.pl.every(p=>p.done)) return hDuelEnd();
  const o=1-D.turn; hDuelTurn(D.pl[o].done ? D.turn : o);
}
function hDuelEnd(){
  clearTimers(); clearInterval(H.duelIv); const D=H.D; D.running=false;
  const s = D.pl.map(p=>({ok:p.st.filter(x=>x===1).length, bad:p.st.filter(x=>x===2).length}));
  let w = s[0].ok!==s[1].ok ? (s[0].ok>s[1].ok?0:1) : s[0].bad!==s[1].bad ? (s[0].bad<s[1].bad?0:1) : -1;
  D.winner = w;
  if(w>=0){ const wp=H.players.find(p=>p.pid===D.pl[w].pid); if(wp) wp.wins++; }
  setPhase('final'); bc();
  fx('fanfare', w>=0 ? `¡${D.pl[w].name} gana la final con ${s[w].ok} aciertos!` : `¡Empate! Ambos con ${s[0].ok} aciertos.`);
  if(s.some(x=>x.ok===25)) setTimeout(confetti, 300);
}
function hBackToLobby(){ clearTimers(); clearInterval(H.duelIv); H.D=null; H.plan=null;
  H.players = H.players.filter(p=>p.online || p.pid===HOST_PID);
  H.players.forEach(p=>{ p.alive=true; p.spectator=false; p.secs=0; p.round=0; p.elimNow=false; });
  setPhase('lobby'); bc(); }
function hostClose(){ if(!H) return; clearTimers(); clearInterval(H.duelIv);
  H.players.forEach(p=>{ if(p.conn) p.conn.send({t:'bye'}); });
  setTimeout(()=>{ try{ H && H.net.destroy(); }catch(e){} H=null; }, 300); }

/* --- vista para cada dispositivo --- */
function viewFor(pid){
  const me = H.players.find(p=>p.pid===pid);
  const v = {phase:H.phase, key:H.key, code:H.code, host: pid===HOST_PID || pid==='tv', meId: me?pid:null,
    audio: pid===HOST_PID || pid==='tv' || H.set.audio==='todos', set:H.set,
    me: me ? {name:me.name, alive:me.alive, spectator:me.spectator, secs:me.secs, round:me.round} : null,
    players: H.players.map(p=>({name:p.name, pid:p.pid, alive:p.alive, spectator:p.spectator, online:p.online, round:p.round, secs:p.secs, elimNow:p.elimNow, wins:p.wins,
      answered: H.phase==='q' && H.who && H.who.has(p.pid) ? !!p.ans : null})),
    nivel: cfg.nivel, tRosco: cfg.tRosco };
  if(H.plan && H.plan[H.r]){ const pl=H.plan[H.r]; v.round={n:H.r+1, of:H.plan.length, g:pl.g, elim:pl.elim, qn:pl.qs.length}; }
  if(H.phase==='q'){ const q=H.q;
    v.q = {g:q.g, text:q.text, opts:q.opts, tiles:q.tiles, hint:q.hint, len:q.len, start:q.start, prev:q.prev,
      clues: q.clues ? q.clues.slice(0,H.clues) : null, nclues:4, label:H.qLabel, tie:!!H.tie,
      endsIn: H.qEnd-Date.now(), canAnswer: !!(me && H.who.has(pid)), sent: !!(me && me.ans), sentV: me && me.ans ? me.ans.v : null };
  }
  if(H.phase==='reveal'){ v.rev = {ans:H.q.ans[0], g:H.q.g, opts:H.q.opts, c:H.q.c, res:H.res, mine:H.res.find(r=>r.pid===pid)||null, label:H.qLabel}; }
  if(H.phase==='tieIntro'){ v.tie = {names:H.tie.group.map(p=>p.name), inTie: H.tie.group.some(p=>p.pid===pid)}; }
  if(H.D){ const D=H.D;
    v.duel = {turn:D.turn, running:D.running, flash:D.flash, winner:D.winner,
      pl: D.pl.map((p,i)=>({pid:p.pid, name:p.name, left: Math.max(0, p.left - (D.running && i===D.turn ? Date.now()-D.t0 : 0)), st:p.st, done:p.done,
        ok:p.st.filter(x=>x===1).length, bad:p.st.filter(x=>x===2).length,
        letters: H.phase==='final' ? p.ro.p.map((it,j)=>({l:it.l, a:it.r[0], s:p.st[j], g:p.given[j]})) : null})),
      myTurn: D.running && D.pl[D.turn].pid===pid };
    if(D.running){ const p=D.pl[D.turn], it=p.ro.p[p.q[0]]; v.duel.cur = {idx:p.q[0], l:it.l, t:it.t, d:it.d, ans: pid===HOST_PID||pid==='tv' ? it.r[0] : null}; }
  }
  return v;
}
function bc(){
  if(!H) return;
  H.players.forEach(p=>{ if(p.conn && p.online) p.conn.send({t:'view', v:viewFor(p.pid)}); });
  CL.view(viewFor(H.set.hostPlays ? HOST_PID : 'tv'));
}
function render(){ bc(); }

/* =====================================================================
   CLIENTE (también lo usa el anfitrión para dibujar su propia pantalla)
   ===================================================================== */
const CL = {v:null, key:null, endAt:0, lastWhole:null, n:0, net:null, conn:null, code:null, retry:0, closed:false};
CL.send = m => { if(H) hRecv(H.set.hostPlays ? HOST_PID : 'tv', m); else if(CL.conn) CL.conn.send(m); };

function clientJoin(code){
  code = (code||'').toUpperCase().replace(/[^A-Z]/g,'');
  const name = ($('#mp-name').value||'').trim();
  if(code.length!==4){ toast('El código tiene 4 letras'); return; }
  if(!name){ toast('Escribe tu nombre'); $('#mp-name').focus(); return; }
  cfg.nombre=name; saveCfg(); SFX.init(); keepAwake(true);
  CL.code=code; CL.closed=false; CL.retry=0;
  show('mp'); $('#mp-body').innerHTML = `<div class="waiting">Conectando a la sala ${esc(code)}…</div>`; $('#mp-label').textContent='Sala '+code;
  connect();
}
function connect(){
  if(CL.net) CL.net.destroy();
  CL.net = clientConnect(CL.code, {
    open(conn){ CL.conn=conn; CL.retry=0;
      conn.send({t:'hola', pid:myPid(), name:cfg.nombre});
      conn.onData(m=>{ if(!m) return; if(m.t==='view') CL.view(m.v); else if(m.t==='fx'){ if(m.s && SFX[m.s]) SFX[m.s](); if(m.say) VOZ.say(m.say); } else if(m.t==='bye'){ CL.closed=true; lost('El anfitrión cerró la sala'); } });
      conn.onClose(()=>{ if(!CL.closed) reconnect(); });
    },
    error(e){ if(CL.closed) return; if(CL.v) reconnect(); else { lost(e && e.type==='peer-unavailable' ? 'No existe una sala con ese código' : e && e.type==='nolib' ? 'Sin internet' : 'No se pudo conectar'); } }
  });
}
function reconnect(){
  if(CL.closed) return; CL.retry++;
  if(CL.retry>12) return lost('Se perdió la conexión con el anfitrión');
  $('#mp-label').textContent='Reconectando…'; setTimeout(()=>{ if(!CL.closed) connect(); }, 2500);
}
function lost(msg){
  CL.closed=true; VOZ.stop(); keepAwake(false);
  $('#mp-body').innerHTML = `<div class="spacer"></div><div class="card" style="text-align:center"><p style="font-size:20px;font-weight:800">${esc(msg)}</p></div><button class="btn-main" id="mp-lost-ok">Volver al inicio</button>`;
  $('#mp-timer').style.visibility='hidden';
  $('#mp-lost-ok').onclick=()=>{ leave(); };
}
function leave(){
  CL.closed=true; if(CL.net){ CL.net.destroy(); CL.net=null; } CL.conn=null; CL.v=null; CL.key=null;
  if(H) hostClose(); VOZ.stop(); keepAwake(false); renderHome(); show('home');
}

/* --- reloj local (se sincroniza con cada mensaje del anfitrión) --- */
setInterval(()=>{
  const v=CL.v; const el=$('#mp-timer'); if(!v){ return; }
  let left=null;
  if(v.phase==='q') left = (CL.endAt - performance.now())/1000;
  else if((v.phase==='duel') && v.duel){ const p=v.duel.pl[v.duel.turn]; left = (p.left - (v.duel.running ? performance.now()-CL.recvAt : 0))/1000;
    document.querySelectorAll('.dp .tm').forEach((t,i)=>{ const pp=v.duel.pl[i]; const l=(pp.left - (v.duel.running && i===v.duel.turn ? performance.now()-CL.recvAt : 0))/1000; t.textContent=fmt(l); t.classList.toggle('crit', i===v.duel.turn && l<=5); t.classList.toggle('low', i===v.duel.turn && l>5 && l<=cfg.alerta); }); }
  if(left===null){ el.style.visibility='hidden'; return; }
  el.style.visibility = v.phase==='duel' ? 'hidden' : 'visible';
  left=Math.max(0,left); el.textContent = Math.ceil(left); timerClass(el, left);
  const whole=Math.ceil(left);
  const ticking = v.phase==='q' || (v.phase==='duel' && v.duel.running);
  if(ticking && CL.lastWhole!==null && whole<CL.lastWhole && whole>0 && (v.audio || (v.duel && v.duel.myTurn))){
    const lvl = whole<=5 && cfg.alerta>0 ? 2 : whole<=cfg.alerta ? 1 : 0; SFX.tick(CL.n++%2, lvl); if(lvl===2) vib(30);
  }
  CL.lastWhole = ticking ? whole : null;
}, 100);

/* --- dibujo de pantallas --- */
CL.view = v => {
  const fresh = v.key!==CL.key; CL.v=v; CL.recvAt=performance.now();
  if(v.phase==='q') CL.endAt = performance.now() + v.q.endsIn;
  const lbl = v.phase==='lobby' ? 'Sala '+v.code : v.round && ['intro','count','q','reveal','standings'].includes(v.phase) ? `Ronda ${v.round.n} de ${v.round.of}` : v.phase.startsWith('duel')||v.phase==='final' ? 'Gran final' : 'Sala '+v.code;
  $('#mp-label').textContent = lbl;
  if(!$('#s-mp').classList.contains('on')) show('mp');
  if(fresh){ CL.key=v.key; draw[v.phase] ? draw[v.phase](v) : null; }
  else if(upd[v.phase]) upd[v.phase](v);
};
const body = () => $('#mp-body');
const nameOf = p => esc(p.name) + (p.pid===HOST_PID ? ic('crown') : '');
function plistHTML(v, mode){
  let list = v.players.slice();
  if(mode==='score') list.sort((a,b)=>(b.alive-a.alive) || (b.round-a.round));
  return `<div class="plist">${list.map(p=>{
    const cls = ['pl', p.pid===v.meId?'me':'', p.elimNow?'elim':(!p.alive && mode!=='lobby'?'out':'')].join(' ');
    const right = mode==='lobby' ? (p.online?'':'<span class="st">desconectado</span>') + (p.wins?` <span class="badge">${p.wins} ${p.wins===1?'final':'finales'}</span>`:'')
      : mode==='q' ? (p.answered===null ? '' : p.answered ? `<span class="mk y">${ic('check')}</span>` : '<span class="mk w"></span>')
      : mode==='score' ? `<span class="st">+${p.secs}s</span> <span class="s">${p.round}</span>` : '';
    return `<div class="${cls}"><span class="n">${nameOf(p)}${p.spectator?' <span class="st">mirando</span>':''}${p.online?'':' <span class="st">sin conexión</span>'}</span>${right}</div>`; }).join('')}</div>`;
}
function hostBtn(label, id){ return `<button class="btn-main" id="${id}">${label}</button>`; }

const draw = {
  lobby(v){
    const link = location.origin + location.pathname + '?sala=' + v.code;
    if(v.host){
      const s=v.set;
      body().innerHTML = `
      <div class="card" style="text-align:center"><h3>Código de la sala</h3><div class="code">${v.code}</div>
        <div class="qr" id="mp-qr" style="margin-top:12px"></div>
        <button id="mp-share" style="margin-top:14px;width:100%">${ic('share')}Compartir enlace</button></div>
      <div class="card"><h3>Jugadores (<span id="mp-pn">${v.players.filter(p=>p.online).length}</span>)</h3><div id="mp-plist">${plistHTML(v,'lobby')}</div></div>
      <div class="card cfg"><h3>Configuración</h3>
        <label>Dificultad <select id="h-nivel">${[1,2,3].map(n=>`<option value="${n}" ${v.nivel===n?'selected':''}>${LVL[n]}</option>`).join('')}</select></label>
        <label>Rondas eliminatorias <span><input type="range" id="h-rondas" min="0" max="4" step="1" value="${s.rondas}"> <span class="v" id="hv-rondas">${s.rondas}</span></span></label>
        <label>Preguntas por ronda <span><input type="range" id="h-preg" min="3" max="10" step="1" value="${s.preg}"> <span class="v" id="hv-preg">${s.preg}</span></span></label>
        <label>Segundos por pregunta <span><input type="range" id="h-tPreg" min="10" max="45" step="5" value="${s.tPreg}"> <span class="v" id="hv-tPreg">${s.tPreg}s</span></span></label>
        <label>Tiempo base del rosco <span><input type="range" id="h-tRosco" min="40" max="300" step="5" value="${v.tRosco}"> <span class="v" id="hv-tRosco">${v.tRosco}s</span></span></label>
        <label>Leer consignas en voz alta <input type="checkbox" class="sw" id="h-voz" ${s.voz?'checked':''}></label>
        <label>Voz, reloj y sonidos en <select id="h-audio"><option value="anfitrion" ${s.audio==='anfitrion'?'selected':''}>Solo este teléfono</option><option value="todos" ${s.audio==='todos'?'selected':''}>Todos los teléfonos</option></select></label>
        <label>Yo también juego <input type="checkbox" class="sw" id="h-plays" ${s.hostPlays?'checked':''}></label>
      </div>
      <p class="mut small" id="mp-plan"></p>
      ${hostBtn(ic('play')+'Empezar partida','mp-start')}`;
      try{ if(window.QRCode) new QRCode($('#mp-qr'), {text:link, width:340, height:340, colorDark:'#0b1033', colorLight:'#ffffff'}); }catch(e){}
      $('#mp-share').onclick = async()=>{ try{ if(navigator.share) await navigator.share({title:'El Rosco', text:'¡Únete a mi sala de El Rosco! Código '+v.code, url:link}); else { await navigator.clipboard.writeText(link); toast('Enlace copiado'); } }catch(e){} };
      const S=H.set;
      $('#h-nivel').onchange=e=>{ cfg.nivel=+e.target.value; saveCfg(); planTxt(); };
      [['rondas',x=>x],['preg',x=>x],['tPreg',x=>x+'s']].forEach(([k,f])=>{ const el=$('#h-'+k); el.oninput=()=>{ S[k]=+el.value; $('#hv-'+k).textContent=f(S[k]); planTxt(); }; });
      $('#h-tRosco').oninput=e=>{ cfg.tRosco=+e.target.value; $('#hv-tRosco').textContent=cfg.tRosco+'s'; saveCfg(); };
      $('#h-voz').onchange=e=>{ S.voz=e.target.checked; };
      $('#h-audio').onchange=e=>{ S.audio=e.target.value; };
      $('#h-plays').onchange=e=>{ S.hostPlays=e.target.checked; addHostPlayer(); bc(); };
      $('#mp-start').onclick=()=>hStart();
      planTxt();
    } else {
      body().innerHTML = `<div class="card" style="text-align:center"><h3>Sala</h3><div class="code">${v.code}</div></div>
        <div class="waiting">Estás dentro. La partida empieza cuando el anfitrión la inicie.</div>
        <div class="card"><h3>Jugadores</h3><div id="mp-plist">${plistHTML(v,'lobby')}</div></div>`;
    }
  },
  intro(v){
    const g=GAMES[v.round.g], alive=v.players.filter(p=>p.alive).length;
    body().innerHTML = `<div class="spacer"></div><div class="game-ico">${g.ico}</div>
      <h2 style="text-align:center;font-size:28px">${g.name}</h2>
      <div class="card"><p>${esc(g.rules)}</p><p style="margin-top:10px">${v.round.qn} preguntas · se gana por acertar y por rapidez.</p>
      <p style="margin-top:10px;font-weight:800;color:var(--gold)">${v.round.elim ? (v.round.elim===1?'Al final queda eliminado 1 jugador':`Al final quedan eliminados ${v.round.elim} jugadores`) : (alive>2?'Ronda sin eliminados':'Ronda para sumar segundos')}</p></div>
      ${v.me && !v.me.alive ? '<div class="waiting">Estás mirando esta ronda</div>' : ''}
      <div class="spacer"></div>
      ${v.host ? hostBtn('¡Comenzar ronda!','mp-go') : '<div class="waiting">Esperando al anfitrión…</div>'}`;
    if(v.host) $('#mp-go').onclick=()=>{ VOZ.stop(); hCountdown(hRunRound); };
  },
  count(v){
    body().innerHTML = `<div class="spacer"></div><div class="count" id="mp-cn" style="text-align:center">3</div><div class="spacer"></div>`;
    let i=3; const el=$('#mp-cn');
    const step=()=>{ if(!CL.v || CL.v.phase!=='count') return;
      if(i>0){ el.textContent=i; el.style.animation='none'; void el.offsetWidth; el.style.animation=''; if(v.audio) SFX.beep(false); i--; setTimeout(step,800); }
      else { el.textContent='¡YA!'; el.style.animation='none'; void el.offsetWidth; el.style.animation=''; if(v.audio) SFX.beep(true); vib(100); } };
    step();
  },
  q(v){
    const q=v.q; let h = `<div class="kicker" style="justify-content:center">${GAMES[q.g].ico}${esc(q.label||'')}</div>`;
    if(q.g==='cuatro') h += `<div class="card"><div class="q">${esc(q.text)}</div></div>`;
    else if(q.g==='pista') h += `<div class="clues" id="mp-clues"></div>`;
    else if(q.g==='anagramas') h += `<div class="card"><div class="tiles">${q.tiles.map(c=>`<div class="tile">${c}</div>`).join('')}</div><p class="mut" style="text-align:center;margin-top:12px">${esc(q.hint)}. ${q.len} letras.</p></div>`;
    else h += `<div class="card">${q.prev?`<p class="mut">Anterior: <b>${esc(q.prev.toUpperCase())}</b></p>`:'<p class="mut">Nueva cadena</p>'}<div style="margin:10px 0 6px">Empieza con <span class="syl" style="font-size:26px">${esc(q.start)}</span></div><div class="q">${esc(q.text)}</div></div>`;
    h += `<div id="mp-ans"></div><div class="card"><h3>Respuestas</h3><div id="mp-plist">${plistHTML(v,'q')}</div></div>`;
    body().innerHTML = h;
    drawClues(v); drawAnswer(v);
  },
  reveal(v){
    const r=v.rev, m=r.mine;
    let h = `<div class="kicker" style="justify-content:center">${esc(r.label||'')}</div>`;
    if(m) h += `<div class="flash ${m.ok?'good':'bad'}" style="font-size:20px">${m.ok ? `¡Correcto! +${m.pts} puntos y +${m.secs} s` : m.answered ? 'Incorrecto' : 'No alcanzaste a responder'}</div>`;
    h += `<div class="card" style="text-align:center"><h3>La respuesta era</h3><div class="reveal" style="font-size:28px">${esc(r.ans)}</div></div>`;
    h += `<div class="card"><h3>Resultados</h3><div class="plist">${r.res.map(x=>`<div class="pl ${x.pid===v.meId?'me':''}"><span class="n"><span class="mk ${x.ok?'y':x.answered?'no':''}">${x.ok?ic('check'):x.answered?ic('close'):''}</span>${esc(x.name)}</span><span class="st">${x.given!=null && !x.ok ? esc(String(x.given)).slice(0,18) : x.ok ? (x.ms/1000).toFixed(1)+'s' : ''}</span><span class="s">${x.pts?'+'+x.pts:''}</span></div>`).join('')}</div></div>`;
    body().innerHTML = h;
  },
  tieIntro(v){
    body().innerHTML = `<div class="spacer"></div><div class="game-ico">${ic('flag')}</div><h2 style="text-align:center">¡Empate!</h2>
      <div class="card" style="text-align:center"><p>Pregunta de desempate para</p><p style="font-size:22px;font-weight:900;margin-top:8px;color:var(--gold)">${v.tie.names.map(esc).join(' · ')}</p>
      <p class="mut" style="margin-top:8px">Gana quien acierte más rápido</p></div>
      ${v.tie.inTie ? '<div class="waiting">¡Prepárate, te toca!</div>' : '<div class="waiting">Mira el desempate</div>'}<div class="spacer"></div>`;
  },
  standings(v){
    const out = v.players.filter(p=>p.elimNow), last = v.round.n===v.round.of;
    body().innerHTML = `<h2 style="text-align:center">Fin de la ronda ${v.round.n}</h2>
      ${out.length ? `<div class="flash bad">${out.length===1?'Queda eliminado':'Quedan eliminados'} ${out.map(p=>esc(p.name)).join(' y ')}</div>` : '<div class="flash pass">Nadie quedó eliminado</div>'}
      ${v.me && v.me.alive ? `<div class="waiting">Sigues en juego · llevas <b style="color:var(--gold)">+${v.me.secs}s</b> para el rosco</div>` : v.me && out.some(p=>p.pid===v.meId) ? '<div class="waiting">Quedaste fuera, pero puedes seguir mirando la partida.</div>' : ''}
      <div class="card"><h3>Puntos de la ronda y segundos acumulados para el rosco</h3>${plistHTML(v,'score')}</div>
      ${v.host ? hostBtn(last ? ic('target')+'Ir a la gran final' : 'Siguiente ronda','mp-next') : '<div class="waiting">Esperando al anfitrión…</div>'}`;
    if(v.host) $('#mp-next').onclick=()=>{ VOZ.stop(); hContinue(); };
  },
  duelIntro(v){
    const d=v.duel;
    body().innerHTML = `<div class="spacer"></div><div class="game-ico">${ic('target')}</div><h2 style="text-align:center;font-size:28px">Gran final</h2>
      <div class="duelbar">${d.pl.map((p,i)=>`<div class="dp ${i===d.turn?'act':''}"><div class="nm">${esc(p.name)}</div><div class="tm">${fmt(p.left/1000)}</div><div class="st small mut">${i===d.turn?'empieza':''}</div></div>`).join('')}</div>
      <div class="card"><p>Cada finalista tiene su propio rosco y su propio reloj (tiempo base + segundos ganados). Responde hasta que falles o digas «paso»: ahí se detiene tu reloj y juega el otro. Gana quien tenga más aciertos.</p></div>
      ${d.pl.some(p=>p.pid===v.meId) ? '<div class="waiting" style="color:var(--lemon);border-color:rgba(255,225,77,.5)">¡Estás en la final!</div>' : ''}
      <div class="spacer"></div>
      ${v.host ? hostBtn('¡Que empiece la final!','mp-duel') : '<div class="waiting">Esperando al anfitrión…</div>'}`;
    if(v.host) $('#mp-duel').onclick=()=>{ VOZ.stop(); hCountdown(()=>hDuelTurn(H.D.turn)); };
  },
  duel(v){
    const d=v.duel, act=d.pl[d.turn];
    let h = `<div class="duelbar">${d.pl.map((p,i)=>`<div class="dp ${i===d.turn?'act':''}"><div class="nm">${esc(p.name)}</div><div class="tm">${fmt(p.left/1000)}</div><div class="sc"><span><i class="dot dok"></i>${p.ok}</span><span><i class="dot dbad"></i>${p.bad}</span>${p.done?'<span class="mut">terminó</span>':''}</div></div>`).join('')}</div>
      <div class="rwrap" style="width:${d.myTurn ? 'clamp(150px,calc(100svh - 610px),290px)' : 'min(100%,290px)'}"><svg viewBox="0 0 300 300" id="mp-ring"></svg><div class="center"><div class="mut small">Rosco de</div><div class="display" style="font-size:20px;margin-top:4px">${esc(act.name)}</div></div></div>`;
    if(d.flash){ const f=d.flash;
      h += f.res==='bad' ? `<div class="flash bad">${esc(f.name)} falló la ${f.letter}${f.given?` con «${esc(f.given)}»`:''}<br><span class="display" style="color:var(--lemon);font-size:17px">Era ${esc(f.ans)}</span></div>`
        : f.res==='pass' ? `<div class="flash pass">${esc(f.name)} pasa la ${f.letter}</div>`
        : f.res==='time' ? `<div class="flash bad">Se acabó el tiempo de ${esc(f.name)}</div>`
        : `<div class="flash good">${esc(f.name)} terminó su rosco</div>`;
    } else if(!d.running){ h += `<div class="waiting" style="font-size:20px;color:var(--ink)">${act.pid===v.meId?'Te toca a ti':'Turno de <b style="color:var(--lemon)">'+esc(act.name)+'</b>'}</div>`; }
    if(d.running && d.cur){ const c=d.cur;
      h += `<div class="card"><span class="tag ${c.t==='c'?'c':''}"><span class="L">${c.l}</span>${c.t==='e'?'Empieza con':'Contiene'}</span><div class="q">${esc(c.d)}</div></div><div id="mp-ans"></div>`; }
    body().innerHTML = h;
    drawRing($('#mp-ring'), act.st, d.running && d.cur ? d.cur.idx : -1);
    if(d.running && d.cur){
      const host = $('#mp-ans');
      if(d.myTurn){
        answerPanelMP(host, v=>CL.send({t:'dans', key:CL.key, v}), ()=>CL.send({t:'dans', key:CL.key, pass:true}), '¡Paso!');
      } else if(v.host && d.cur.ans){
        host.innerHTML = `<div class="reveal" id="mp-hidden">&nbsp;</div><button id="mp-see" style="width:100%;margin-bottom:10px">${ic('eye')}Ver respuesta</button>
          <div class="row"><button class="btn-bad" id="mp-ov-bad">${ic('close')}Mal</button><button class="btn-ok" id="mp-ov-ok">${ic('check')}Bien</button></div>
          <p class="mut small" style="margin-top:6px;text-align:center">Responde ${esc(act.name)} en su teléfono. Si contesta en voz alta, puedes marcar tú.</p>`;
        let vis=false; $('#mp-see').onclick=()=>{ vis=!vis; $('#mp-hidden').innerHTML = vis ? esc(d.cur.ans.toUpperCase()) : '&nbsp;'; };
        $('#mp-ov-ok').onclick=()=>CL.send({t:'dans', key:CL.key, override:'ok'});
        $('#mp-ov-bad').onclick=()=>CL.send({t:'dans', key:CL.key, override:'bad'});
      } else host.innerHTML = `<div class="waiting">Responde ${esc(act.name)}…</div>`;
    }
  },
  final(v){
    const d=v.duel, w=d.winner;
    const iWon = w>=0 && d.pl[w].pid===v.meId;
    body().innerHTML = `<div class="game-ico">${ic('trophy')}</div><h2 style="text-align:center;font-size:28px">${w>=0 ? '¡'+esc(d.pl[w].name)+' gana!' : '¡Empate!'}</h2>
      ${iWon ? '<div class="flash good">¡Ganaste la final!</div>' : ''}
      <div class="duelbar">${d.pl.map((p,i)=>`<div class="dp ${i===w?'act':''}"><div class="nm">${esc(p.name)}</div><div class="tm" style="color:var(--lemon)">${p.ok}</div><div class="sc"><span class="mut">aciertos</span><span><i class="dot dbad"></i>${p.bad}</span></div></div>`).join('')}</div>
      ${d.pl.map(p=>`<div class="card"><h3>Rosco de ${esc(p.name)}</h3><div class="res-letters">${p.letters.map(x=>`<div class="${x.s===1?'o':x.s===2?'x':'p'}"><b>${x.l}</b> · ${esc(x.a)}${x.s===2&&x.g?` <span class="mut">(${esc(x.g)})</span>`:''}</div>`).join('')}</div></div>`).join('')}
      ${v.host ? hostBtn(ic('redo')+'Otra partida en esta sala','mp-again') : '<div class="waiting">El anfitrión puede iniciar otra partida</div>'}`;
    if(v.host) $('#mp-again').onclick=()=>hBackToLobby();
    if(iWon) setTimeout(confetti, 200);
  }
};
const upd = {
  lobby(v){ const el=$('#mp-plist'); if(el) el.innerHTML = plistHTML(v,'lobby'); const n=$('#mp-pn'); if(n) n.textContent=v.players.filter(p=>p.online).length; if(v.host) planTxt(); },
  q(v){ const el=$('#mp-plist'); if(el) el.innerHTML = plistHTML(v,'q'); drawClues(v);
    if(v.q.sent && !$('#mp-ans .sent')) drawAnswer(v); },
  duel(v){}
};
function planTxt(){
  const el=$('#mp-plan'); if(!el || !H) return;
  const N = H.players.filter(p=>p.online).length, R = Math.max(N>2?1:0, H.set.rondas);
  el.textContent = N<2 ? 'Esperando jugadores… (mínimo 2)' : `${N} jugadores · ${R} ronda${R===1?'':'s'} · ${N>2?`se eliminan ${N-2} antes de la final`:'pasan los 2 a la final'} · ${roscosDe(cfg.nivel).filter(r=>!used[r.id]).length} roscos nuevos de nivel ${LVL[cfg.nivel]}`;
}
function drawClues(v){
  const el=$('#mp-clues'); if(!el || !v.q.clues) return;
  const n=v.q.clues.length; if(el.dataset.n==String(n)) return; el.dataset.n=n;
  el.innerHTML = [0,1,2,3].map(i=> i<n ? `<div class="clue">${esc(v.q.clues[i])}</div>` : `<div class="clue hid">La pista ${i+1} aparece pronto</div>`).join('');
  if(n>1 && v.audio) SFX.tone(880,.08,'sine',.2);
}
function drawAnswer(v){
  const host=$('#mp-ans'), q=v.q; if(!host) return;
  if(!q.canAnswer){ host.innerHTML = `<div class="waiting">${v.me && !v.me.alive ? 'Estás mirando esta ronda' : 'Pantalla del anfitrión'}</div>`;
    if(q.g==='cuatro') host.innerHTML += `<div class="opts">${q.opts.map((o,i)=>`<button disabled><b>${'ABCD'[i]}</b>${esc(o)}</button>`).join('')}</div>`;
    return; }
  if(q.sent){ host.innerHTML = `<div class="waiting sent">Respuesta enviada${q.g==='cuatro'?': '+esc(q.opts[q.sentV]):q.sentV?': '+esc(q.sentV):''}<br><span class="mut small">esperando a los demás…</span></div>`; return; }
  if(q.g==='cuatro'){
    host.innerHTML = `<div class="opts">${q.opts.map((o,i)=>`<button data-i="${i}"><b>${'ABCD'[i]}</b>${esc(o)}</button>`).join('')}</div>`;
    host.querySelectorAll('button').forEach(b=>b.onclick=()=>{ host.querySelectorAll('button').forEach(x=>x.disabled=true); b.style.background='var(--blue)'; CL.send({t:'ans', key:CL.key, v:+b.dataset.i}); });
  } else {
    answerPanelMP(host, val=>CL.send({t:'ans', key:CL.key, v:val}), null, null);
  }
}
function answerPanelMP(host, onSend, onPass, passLabel){
  kbPanel(host, {onSubmit:onSend, onPass:onPass||null, passLabel});
}
function drawRing(svg, st, cur){
  let h=''; for(let i=0;i<25;i++){ const a=-Math.PI/2+i*2*Math.PI/25, x=150+130*Math.cos(a), y=150+130*Math.sin(a);
    const cls=(st[i]===1?'ok':st[i]===2?'bad':'')+(i===cur?' cur':'');
    h+=`<g class="rl ${cls}"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="14"/><text x="${x.toFixed(1)}" y="${(y+.5).toFixed(1)}">${LET[i]}</text></g>`; }
  svg.innerHTML='<circle class="rtrack" cx="150" cy="150" r="130"/>'+h;
}

/* ---------- menú ---------- */
$('#b-mp').onclick=()=>{ $('#mp-name').value=cfg.nombre||''; show('mpmenu'); SFX.init(); };
$('#mp-menu-close').onclick=()=>show('home');
$('#mp-create').onclick=()=>{ const n=($('#mp-name').value||'').trim(); if(!n){ toast('Escribe tu nombre'); $('#mp-name').focus(); return; } hostCreate(); };
$('#mp-join').onclick=()=>clientJoin($('#mp-code').value);
$('#mp-code').addEventListener('keydown', e=>{ if(e.key==='Enter') clientJoin($('#mp-code').value); });
$('#mp-exit').onclick=()=>{ if(confirm(H ? '¿Cerrar la sala? Se termina la partida para todos.' : '¿Salir de la sala?')) leave(); };
window.addEventListener('beforeunload', ()=>{ if(CL.net) CL.net.destroy(); });

// Enlace directo: ?sala=ABCD
const m = location.search.match(/[?&]sala=([A-Za-z]{4})/);
if(m){ $('#mp-code').value=m[1].toUpperCase(); $('#mp-name').value=cfg.nombre||''; show('mpmenu'); if(cfg.nombre) setTimeout(()=>$('#mp-join').focus(),100); }

window.__MP = {get H(){return H;}, CL};
})();
