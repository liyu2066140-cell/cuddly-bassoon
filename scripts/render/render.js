import { IMGS, baked } from '../core/assets.js';
import { ctx } from '../core/canvas.js';
import { CFG, H, W, WH, WW } from '../core/config.js';
import { legalSpot, dragStart } from '../systems/input.js';
import { LEVELS } from '../scenes/levels.js';
import { G } from '../core/state.js';
import { terrainC, ground2, deco, edge, vig } from './terrain.js';
import { barOn } from '../ui/ui.js';

// ============ 渲染 ============
function shadow(x,y,rx,ry){
  ctx.fillStyle="rgba(20,44,16,.10)"; ctx.beginPath(); ctx.ellipse(x,y,rx*1.35,ry*1.35,0,0,7); ctx.fill();
  ctx.fillStyle="rgba(20,44,16,.22)"; ctx.beginPath(); ctx.ellipse(x,y,rx,ry,0,0,7); ctx.fill();
}

export function hpBar(x,y,w,h,ratio,col){
  ratio=Math.max(0,Math.min(1,ratio));
  ctx.fillStyle="rgba(10,14,10,.75)"; ctx.fillRect(x-1,y-1,w+2,h+2);
  ctx.fillStyle=col; ctx.fillRect(x,y,w*ratio,h);
  ctx.fillStyle="rgba(255,255,255,.32)"; ctx.fillRect(x,y,w*ratio,1.3);
  ctx.strokeStyle="rgba(0,0,0,.55)"; ctx.lineWidth=1; ctx.strokeRect(x-0.5,y-0.5,w+1,h+1);
}

function drawWolf(e){
  const s=50; let bobY, rot=0, sc=1, ox=0;
  shadow(e.x,e.y+5,s*0.32,s*0.12);
  if(e.moving){ bobY=-Math.abs(Math.sin((e.walkT||0)*13))*3; rot=Math.sin((e.walkT||0)*13+1.2)*0.07; }
  else bobY=Math.sin(performance.now()/420+e.hx)*1.5;
  if(e.lungeT>0){ const k=Math.sin((0.18-e.lungeT)/0.18*Math.PI); ox=(e.lungeDx||0)*k; bobY+=(e.lungeDy||0)*k; rot-=0.18*k; }
  if(e.atkPulseT>0){ const p=Math.sin((0.18-e.atkPulseT)/0.18*Math.PI); sc=1+0.12*p; }
  ctx.save(); ctx.translate(e.x+ox,e.y+bobY); ctx.rotate(rot); if(e.face>0)ctx.scale(-1,1); ctx.scale(sc,sc);
  if(e.hurtT>0) ctx.filter="brightness(1.75) saturate(.45)";
  ctx.drawImage(baked(IMGS["10_wolf"],s,s),-s/2,-s+10,s,s);
  ctx.filter="none"; ctx.restore();
}

function drawSprite(e,s){
  const now=performance.now()/1000;
  shadow(e.x,e.y+4,s*0.30,s*0.11);
  let bobY, rot=0, sc=1, ox=0;
  if(e.moving){ bobY=Math.sin((e.walkT||0)*16)*2.5; rot=Math.sin((e.walkT||0)*16+1.6)*0.06; }
  else bobY=Math.sin(now*2.2+(e.animT||0))*1.2;
  if(e.lungeT>0){ const k=Math.sin((0.18-e.lungeT)/0.18*Math.PI); ox=(e.lungeDx||0)*k; bobY+=(e.lungeDy||0)*k; }
  if(e.atkPulseT>0){ const p=Math.sin((0.18-e.atkPulseT)/0.18*Math.PI); sc=1+0.13*p; rot+=((e.lungeDx||0)>=0?1:-1)*0.2*p; }
  ctx.save(); ctx.translate(e.x+ox,e.y+bobY); ctx.rotate(rot); if(e.face<0)ctx.scale(-1,1); ctx.scale(sc,sc);
  if(e.hurtT>0) ctx.filter="brightness(1.75) saturate(.45)";
  ctx.drawImage(baked(IMGS[e.img],s,s),-s/2,-s+6,s,s);
  ctx.filter="none"; ctx.restore();
}


export function render(){
  ctx.save();
  let sx=0, sy=0;
  if(G.shakeT>0){ const k=G.shakeT/0.14; sx=(Math.random()-0.5)*2*G.shakeAmp*k; sy=(Math.random()-0.5)*2*G.shakeAmp*k; }
  ctx.translate(-G.cam.x+sx,-G.cam.y+sy);
  ctx.drawImage(IMGS["17_ground_big"],0,0,WW,WH);
  ctx.drawImage(ground2,0,0);
  ctx.drawImage(deco,0,0);
  ctx.drawImage(terrainC,0,0);
  ctx.drawImage(edge,0,0);
  const nimg={wood:["16_tree2",96],food:["13_berry",68],gold:["14_gold",72],stone:["15_stone",64]};
  const gathering=new Set();
  for(const u of G.units){ if(u.type==="farmer"&&u.state==="gather"&&u.node) gathering.add(u.node); }
  for(const n of G.nodes){ if(n.amt<=0) continue;
    const nc=nimg[n.kind];
    if(n.kind==="wood"){
      shadow(n.x,n.y+3,nc[1]*0.40,nc[1]*0.12);
      const amp=gathering.has(n)?0.055:0.022;
      ctx.save(); ctx.translate(n.x,n.y+2); ctx.rotate(Math.sin(performance.now()/(gathering.has(n)?520:850)+n.x*0.013)*amp);
      ctx.drawImage(baked(IMGS[nc[0]],nc[1],nc[1]),-nc[1]/2,-nc[1]*0.82,nc[1],nc[1]); ctx.restore();
    } else {
      if((n.kind==="gold"||n.kind==="food")&&Math.random()<0.012)
        G.sparkles.push({x:n.x+(Math.random()*36-18),y:n.y-14-Math.random()*22,t:0});
      shadow(n.x,n.y+3,nc[1]*0.40,nc[1]*0.12);
      ctx.drawImage(baked(IMGS[nc[0]],nc[1],nc[1]),n.x-nc[1]/2,n.y-nc[1]*0.8,nc[1],nc[1]);
    }
    ctx.fillStyle="rgba(0,0,0,.5)"; ctx.font="11px sans-serif"; ctx.textAlign="center"; ctx.fillText(n.amt,n.x,n.y+12); }
  const pd={house:{w:70,img:"11_house"},barracks:{w:96,img:"07_barracks"},tower:{w:80,img:"06_tower_stone"},wall:{w:56,img:"18_wall"}};
  for(const q of G.buildQ){
    const isSel=q===G.selectedQ, dq=pd[q.type];
    if(dq&&dq.img){ ctx.globalAlpha=.32; ctx.drawImage(IMGS[dq.img],q.x-dq.w/2,q.y-dq.w*0.82,dq.w,dq.w); ctx.globalAlpha=1; }
    ctx.strokeStyle=isSel?"#39d353":"#8a6a3a"; ctx.lineWidth=isSel?3.5:2; ctx.setLineDash([6,5]);
    ctx.strokeRect(q.x-40,q.y-55,80,65); ctx.setLineDash([]);
    ctx.fillStyle="#8a5a2a"; ctx.strokeStyle="#3a2a10"; ctx.lineWidth=1;
    for(const [cx2,cy2] of [[q.x-38,q.y-52],[q.x+34,q.y-52],[q.x-38,q.y+6],[q.x+34,q.y+6]]){
      ctx.fillRect(cx2,cy2-8,4,14); ctx.strokeRect(cx2,cy2-8,4,14); }
    hpBar(q.x-35,q.y+18,70,7,q.timer/q.total,"#ffd75e");
  }
  for(const b of G.buildings){
    shadow(b.x,b.y+7,b.w*0.50,b.w*0.15);
    const s=b.w; ctx.drawImage(baked(IMGS[b.img],s,s),b.x-s/2,b.y-s*0.82,s,s);
    const bw=b.type==="townhall"?80:56, byy=b.type==="townhall"?b.y-b.w*0.86:b.y-b.w*0.82-4;
    if((b.hp<b.maxHp||b.type==="townhall")&&barOn(b)) hpBar(b.x-bw/2,byy,bw,6,b.hp/b.maxHp,b.type==="townhall"?"#4caf50":"#e2a84b");
  }
  if(G.placing&&G.mouse.x){
    const pd={house:{w:70,img:"11_house"},barracks:{w:96,img:"07_barracks"},tower:{w:80,img:"06_tower_stone"},wall:{w:56,img:"18_wall"}};
    const dd=pd[G.placing.type], ok=legalSpot(G.mouse.x,G.mouse.y);
    ctx.globalAlpha=.68;
    ctx.drawImage(baked(IMGS[dd.img],dd.w,dd.w),G.mouse.x-dd.w/2,G.mouse.y-dd.w*0.82,dd.w,dd.w);
    ctx.globalAlpha=1;
    ctx.strokeStyle=ok?"#39d353":"#e24b4a"; ctx.lineWidth=3; ctx.setLineDash([7,5]);
    ctx.beginPath(); ctx.ellipse(G.mouse.x,G.mouse.y+6,dd.w*0.62,dd.w*0.3,0,0,7); ctx.stroke(); ctx.setLineDash([]);
    ctx.font="bold 13px sans-serif"; ctx.textAlign="center"; ctx.fillStyle=ok?"#0a6b2a":"#c33333";
    ctx.fillText(ok?"点击放置 · 右键取消":"这里放不下",G.mouse.x,G.mouse.y-dd.w*0.95);
  }
  const drawList=[...G.units.map(u=>({y:u.y,d:()=>{ drawSprite(u,u.type==="hero"?52:44);
    if(barOn(u)) hpBar(u.x-20,u.y-46,40,5,u.hp/u.maxHp,"#4caf50"); }})),
    ...G.enemies.map(e=>({y:e.y,d:()=>{ if(e.kind==="wolf")drawWolf(e); else drawSprite(e,e.elite?54:44);
    if(e.elite){ ctx.fillStyle="#ffd75e"; ctx.beginPath(); ctx.moveTo(e.x,e.y-58); ctx.lineTo(e.x-7,e.y-52); ctx.lineTo(e.x,e.y-46); ctx.lineTo(e.x+7,e.y-52); ctx.closePath(); ctx.fill(); }
    if(barOn(e)) hpBar(e.x-20,e.y-46,40,5,e.hp/e.maxHp,e.elite?"#ff9a3c":"#e24b4a"); }}))].sort((a,b)=>a.y-b.y);
  for(const o of drawList) o.d();
  for(const s of G.selList){ const rr2=20+Math.sin(performance.now()/240)*1.6;
    ctx.fillStyle="rgba(57,211,83,.16)"; ctx.beginPath(); ctx.ellipse(s.x,s.y+4,rr2,rr2*0.45,0,0,7); ctx.fill();
    ctx.strokeStyle="rgba(57,211,83,.45)"; ctx.lineWidth=4.5; ctx.beginPath(); ctx.ellipse(s.x,s.y+4,rr2,rr2*0.45,0,0,7); ctx.stroke();
    ctx.strokeStyle="#39d353"; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(s.x,s.y+4,rr2,rr2*0.45,0,0,7); ctx.stroke(); }
  if(dragStart&&G.mouse.x){ const x1=Math.min(dragStart.x,G.mouse.x),x2=Math.max(dragStart.x,G.mouse.x),y1=Math.min(dragStart.y,G.mouse.y),y2=Math.max(dragStart.y,G.mouse.y);
    ctx.fillStyle="rgba(57,211,83,.14)"; ctx.fillRect(x1,y1,x2-x1,y2-y1);
    ctx.strokeStyle="#39d353"; ctx.lineWidth=1.5; ctx.setLineDash([5,4]); ctx.strokeRect(x1,y1,x2-x1,y2-y1); ctx.setLineDash([]); }
  if(G.selList.length&&G.mouse.x){ ctx.strokeStyle="rgba(57,211,83,.5)"; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(G.mouse.x,G.mouse.y,8,0,7); ctx.stroke(); }
  const hero=G.units.find(u=>u.type==="hero");
  if(hero&&hero.whirlFx>0){ hero.whirlFx-=0.016; ctx.strokeStyle="rgba(80,150,255,"+Math.max(0,hero.whirlFx*2)+")"; ctx.lineWidth=5; ctx.beginPath(); ctx.arc(hero.x,hero.y-14,CFG.whirlR*(1-hero.whirlFx*1.2),0,7); ctx.stroke(); }
  for(const p of G.projs){ const t=Math.min(1,p.t), ix=p.x+(p.x2-p.x)*t, iy=p.y+(p.y2-p.y)*t;
    ctx.strokeStyle="rgba(138,90,42,.40)"; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(ix-12,iy+1.5); ctx.lineTo(ix-4,iy); ctx.stroke();
    ctx.strokeStyle="#5e3c1c"; ctx.lineWidth=2.6; ctx.beginPath(); ctx.moveTo(ix-6,iy); ctx.lineTo(ix+6,iy); ctx.stroke(); }
  for(const s of G.slashFx){ const k=1-s.t;
    ctx.strokeStyle="rgba(255,238,170,"+(k*0.5).toFixed(2)+")"; ctx.lineWidth=6.5; ctx.lineCap="round";
    ctx.beginPath(); ctx.arc(s.x,s.y,15,s.ang-1.1+k*1.4,s.ang-0.2+k*1.4); ctx.stroke();
    ctx.strokeStyle="rgba(255,255,255,"+(k*0.95).toFixed(2)+")"; ctx.lineWidth=2.5;
    ctx.beginPath(); ctx.arc(s.x,s.y,15,s.ang-1.1+k*1.4,s.ang-0.2+k*1.4); ctx.stroke(); ctx.lineCap="butt"; }
  for(const m of G.moveMarks){ const k=m.t/0.5;
    ctx.strokeStyle=m.col; ctx.globalAlpha=1-k; ctx.lineWidth=2.5;
    ctx.beginPath(); ctx.ellipse(m.x,m.y,5+k*20,(5+k*20)*0.45,0,0,7); ctx.stroke();
    ctx.fillStyle=m.col; ctx.beginPath(); ctx.arc(m.x,m.y,2.5,0,7); ctx.fill(); ctx.globalAlpha=1; }
  for(const s of G.sparkles){ const k=Math.sin(Math.min(1,s.t/0.9)*Math.PI), r=4+k*4;
    ctx.strokeStyle="rgba(255,240,150,"+(k*0.95).toFixed(2)+")"; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(s.x-r,s.y); ctx.lineTo(s.x+r,s.y); ctx.moveTo(s.x,s.y-r); ctx.lineTo(s.x,s.y+r); ctx.stroke();
    ctx.fillStyle="rgba(255,255,220,"+(k*0.9).toFixed(2)+")"; ctx.beginPath(); ctx.arc(s.x,s.y,1.6+k,0,7); ctx.fill(); }
  for(const p of G.parts){ ctx.globalAlpha=Math.max(0,1-p.t/p.life); ctx.fillStyle=p.col;
    ctx.fillRect(p.x-p.size/2,p.y-p.size/2,p.size,p.size); ctx.globalAlpha=1; }
  for(const f of G.floats){ ctx.globalAlpha=Math.max(0,1-f.t);
    const sc2=f.t<0.18?(0.65+0.5*(f.t/0.18)):1;
    ctx.font="bold "+Math.round(14*sc2)+"px sans-serif"; ctx.textAlign="center"; ctx.strokeStyle="rgba(255,255,255,.85)"; ctx.lineWidth=3.5; ctx.strokeText(f.text,f.x,f.y);     ctx.fillStyle=f.color; ctx.fillText(f.text,f.x,f.y); ctx.globalAlpha=1; }
  ctx.restore();
  if(LEVELS[G.level].night){ ctx.fillStyle="rgba(16,20,60,.38)"; ctx.fillRect(0,0,W,H);
    ctx.fillStyle="#f5f2d8"; ctx.beginPath(); ctx.arc(842,74,26,0,7); ctx.fill();
    ctx.fillStyle="rgba(16,20,60,.38)"; ctx.beginPath(); ctx.arc(852,66,22,0,7); ctx.fill(); }
  ctx.drawImage(vig,0,0);
}

