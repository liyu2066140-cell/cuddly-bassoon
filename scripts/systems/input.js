import { sfx } from '../core/audio.js';
import { cv } from '../core/canvas.js';
import { CFG, GH, GS, GW, H, W, WH, WW } from '../core/config.js';
import { commandGather, tryBuild } from './economy.js';
import { buildGrid } from '../core/pathfinding.js';
import { G } from '../core/state.js';
import { addFloat, flash } from '../ui/ui.js';
import { dist2, rnd } from '../core/utils.js';

// ============ 输入（单点 + 框选多选 + 右键命令）============
export let dragStart=null, dragQ=null, dragQFrom=null, panStart=null, panned=false;

export function canvasPos(e){ const r=cv.getBoundingClientRect();
  return {x:(e.clientX-r.left)*W/r.width+G.cam.x, y:(e.clientY-r.top)*H/r.height+G.cam.y}; }

export function clampCam(){ G.cam.x=Math.max(0,Math.min(WW-W,G.cam.x)); G.cam.y=Math.max(0,Math.min(WH-H,G.cam.y)); }

cv.addEventListener("mousemove",e=>{
  if(panStart){ const r=cv.getBoundingClientRect(), k=W/r.width;
    G.cam.x=panStart.cx-(e.clientX-panStart.sx)*k; G.cam.y=panStart.cy-(e.clientY-panStart.sy)*k; clampCam();
    if(Math.abs(e.clientX-panStart.sx)>8||Math.abs(e.clientY-panStart.sy)>8) panned=true;
    G.mouse=canvasPos(e); return; }
  G.mouse=canvasPos(e);
  if(dragQ){ dragQ.x=Math.max(40,Math.min(WW-40,G.mouse.x)); dragQ.y=Math.max(60,Math.min(WH-20,G.mouse.y)); }
});

cv.addEventListener("mousedown",e=>{
  if(G.gameOver)return;
  if(e.button===2){ panStart={sx:e.clientX,sy:e.clientY,cx:G.cam.x,cy:G.cam.y}; panned=false; return; }
  if(e.button!==0)return;
  const p=canvasPos(e); dragStart=p;
  if(G.placing) return;
  dragQ=pickQueue(p); dragQFrom=dragQ?{x:dragQ.x,y:dragQ.y}:null;
  if(dragQ){ G.selectedQ=dragQ; G.selList=[]; }
});

cv.addEventListener("mouseup",e=>{
  if(e.button===2){ panStart=null; return; }
  if(e.button!==0||G.gameOver||!dragStart)return;
  const p=canvasPos(e);
  if(dragQ){
    if(Math.abs(p.x-dragStart.x)>6||Math.abs(p.y-dragStart.y)>6) moveQueueTo(dragQ,p,dragQFrom);
    dragQ=null; dragStart=null; return;
  }
  if(Math.abs(p.x-dragStart.x)>14||Math.abs(p.y-dragStart.y)>14) boxSelect(dragStart,p);
  else clickCmd(p);
  dragStart=null;
});

window.addEventListener("mouseup",()=>{ dragStart=null; dragQ=null; });

cv.addEventListener("contextmenu",e=>{ e.preventDefault();
  if(panned){ panned=false; return; }
  if(G.placing){ G.placing=null; return; }
  if(!G.gameOver&&!panStart) commandAt(canvasPos(e)); });

window.addEventListener("keydown",e=>{
  if(e.key==="Escape"){ G.placing=null; return; }
  const k=e.key.toLowerCase();
  if(k==="arrowleft"||k==="arrowright"||k==="arrowup"||k==="arrowdown") G.keys[k]=true;
  if(k==="1") commandGather("wood");
  else if(k==="2") commandGather("food");
  else if(k==="3") commandGather("stone");
  else if(k==="4") commandGather("gold");
  else if(k==="5") tryBuild("wall");
  else if(k==="a") commandAttack();
});

window.addEventListener("keyup",e=>{ G.keys[e.key.toLowerCase()]=false; });

export function boxSelect(a,b){
  const x1=Math.min(a.x,b.x), x2=Math.max(a.x,b.x), y1=Math.min(a.y,b.y), y2=Math.max(a.y,b.y);
  G.selList=G.units.filter(u=>u.x>=x1-6&&u.x<=x2+6&&u.y-18>=y1-6&&u.y-18<=y2+6);
  G.selectedQ=null;
  if(G.selList.length) addFloat(W/2,110,"已选中 "+G.selList.length+" 个单位","#2a9d3f");
}

export function clickCmd(p){
  if(G.placing){
    const gx=Math.max(1,Math.min(GW-2,Math.round(p.x/GS))), gy=Math.max(1,Math.min(GH-2,Math.round(p.y/GS)));
    const cx=gx*GS+32, cy=gy*GS+32;
    if(!legalSpot(cx,cy)) return flash("这里放不下，换个位置");
    const c=CFG.cost[G.placing.type];
    for(const k of ["wood","food","stone","gold"]) if(c[k]){
      if(G.res[k]<c[k]){ G.placing=null; return flash("资源不够"); } G.res[k]-=c[k]; }
    G.buildQ.push({type:G.placing.type,timer:0,total:CFG.buildTime[G.placing.type],x:cx,y:cy});
    buildGrid(); sfx("hammer");
    if(G.placing.type==="wall"&&G.res.stone>=30){ addFloat(cx,cy-70,"继续放置 · 右键结束","#39d353"); }
    else G.placing=null;
    return;
  }
  const q=pickQueue(p);
  if(q){ G.selectedQ=q; G.selList=[]; addFloat(q.x,q.y-70,"点地面挪位","#39d353"); return; }
  if(G.selectedQ){ moveQueueTo(G.selectedQ,p); G.selectedQ=null; return; }
  const u=pickUnit(p);
  if(u){ G.selList=[u]; G.selectedQ=null; return; }
  commandAt(p);
}

export function pickQueue(p){ let best=null,bd=52;
  for(const q of G.buildQ){ const d=dist2(p.x,p.y,q.x,q.y-25); if(d<bd){bd=d;best=q;} } return best; }

export function legalSpot(x,y){
  const gx=Math.floor(x/GS), gy=Math.floor(y/GS);
  if(gx<0||gy<0||gx>=GW||gy>=GH||G.grid[gy][gx]===1) return false;
  for(const b of G.buildings){ if(dist2(x,y,b.x,b.y)<58) return false; }
  for(const n of G.nodes){ if(n.amt>0&&dist2(x,y,n.x,n.y)<44) return false; }
  return true;
}

export function findFreeSpot(nx,ny){
  const gx0=Math.max(1,Math.min(GW-2,Math.round(nx/GS))), gy0=Math.max(1,Math.min(GH-2,Math.round(ny/GS)));
  if(legalSpot(gx0*GS+32,gy0*GS+32)) return {x:gx0*GS+32,y:gy0*GS+32};
  for(let r=1;r<=6;r++){
    for(let a=0;a<8;a++){
      const gx=gx0+Math.round(Math.cos(a*Math.PI/4)*r), gy=gy0+Math.round(Math.sin(a*Math.PI/4)*r);
      if(gx<1||gy<1||gx>=GW-1||gy>=GH-1) continue;
      if(legalSpot(gx*GS+32,gy*GS+32)) return {x:gx*GS+32,y:gy*GS+32};
    }
  }
  return null;
}

export function moveQueueTo(q,p,from){
  const spot=findFreeSpot(p.x,p.y);
  if(!spot){ if(from){q.x=from.x;q.y=from.y;} return flash("周围都放不下，换个空地"); }
  q.x=spot.x; q.y=spot.y; addFloat(spot.x,spot.y-46,"工地挪位","#2a9d3f"); sfx("place");
}

export function commandAt(p){
  if(G.selectedQ){ moveQueueTo(G.selectedQ,p); G.selectedQ=null; return; }
  const en=pickEnemy(p), n=pickNode(p);
  if(!G.selList.length) return;
  if(en){ for(const s of G.selList){
      if(s.type!=="farmer"){ s.target=en; s.state="attack"; s.node=null; }
      else { s.dest={x:p.x+rnd(-20,20),y:p.y+rnd(-20,20)}; s.state="move"; } }
    G.moveMarks.push({x:en.x,y:en.y,t:0,col:"#e24b4a"}); return; }
  if(n){ let anyFarmer=false;
    for(const s of G.selList){
      if(s.type==="farmer"){ s.node=n; s.state="gather"; s.target=null; anyFarmer=true; }
      else { s.dest={x:p.x+rnd(-24,24),y:p.y+rnd(-24,24)}; s.state="move"; } }
    G.moveMarks.push({x:n.x,y:n.y,t:0,col:"#e8b93a"});
    if(!anyFarmer) flash("只有农民能采集");
    return; }
  for(const s of G.selList){ s.dest={x:p.x+rnd(-26,26),y:p.y+rnd(-26,26)}; s.state="move"; s.target=null; s.node=null; }
  G.moveMarks.push({x:p.x,y:p.y,t:0,col:"#39d353"});
}

export function pickUnit(p){ let best=null,bd=30; for(const u of G.units){ const d=dist2(p.x,p.y,u.x,u.y-18); if(d<bd){bd=d;best=u;} } return best; }

export function pickEnemy(p){ let best=null,bd=32; for(const w of G.enemies){ const d=dist2(p.x,p.y,w.x,w.y-16); if(d<bd){bd=d;best=w;} } return best; }

export function pickNode(p){ let best=null,bd=34; for(const n of G.nodes){ if(n.amt<=0)continue; const d=dist2(p.x,p.y,n.x,n.y-14); if(d<bd){bd=d;best=n;} } return best; }


function commandAttack(){
  if(G.gameOver) return;
  const ts=G.units.filter(u=>u.type==="archer"||u.type==="hero");
  if(!ts.length) return flash("没有战斗单位");
  if(!G.enemies.length) return flash("视野内没有敌人");
  for(const t of ts){ let near=null,nd=1e9;
    for(const e of G.enemies){ const d=dist2(t.x,t.y,e.x,e.y); if(d<nd){nd=d;near=e;} }
    if(near){ t.target=near; t.state="attack"; t.node=null; t.dest=null; } }
  addFloat(W/2,110,"全军出击！","#c33333"); sfx("click");
}
