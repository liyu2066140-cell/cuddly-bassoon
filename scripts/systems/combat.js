import { sfx } from '../core/audio.js';
import { CFG } from '../core/config.js';
import { spawnParts } from './fx.js';
import { G } from '../core/state.js';
import { addFloat } from '../ui/ui.js';
import { dist2 } from '../core/utils.js';

export function shake(amp){ G.shakeT=0.14; G.shakeAmp=Math.max(G.shakeAmp,amp); }

export function whirl(){
  const hero=G.units.find(u=>u.type==="hero");
  if(!hero||G.heroCd>0||G.gameOver) return;
  G.heroCd=CFG.whirlCD; hero.whirlFx=0.4; sfx("whirl");
  addFloat(hero.x,hero.y-64,"旋风斧！","#185FA5");
  for(const w of [...G.enemies]){ if(dist2(hero.x,hero.y,w.x,w.y)<CFG.whirlR){ w.hp-=CFG.whirlDmg; addFloat(w.x,w.y-30,"-"+CFG.whirlDmg,"#e24B4A"); if(w.hp<=0) onEnemyDead(w); } }
}


// 自动索敌：战斗单位视野内最近敌人（农民不参战）
export function autoAcquire(u){
  if(u.type==="farmer") return null;
  let near=null, nd=u.rng+80;
  for(const e of G.enemies){ if(e.hp<=0)continue; const d=dist2(u.x,u.y,e.x,e.y); if(d<nd){nd=d;near=e;} }
  return near;
}

export function onEnemyDead(e){ const i=G.enemies.indexOf(e); if(i>=0)G.enemies.splice(i,1); G.killed++;
  shake(3.6); sfx("die_enemy");
  spawnParts(e.x,e.y-14,14,"#8a8a94",150,200,0.7,3.6);
  addFloat(e.x,e.y-20,e.kind==="wolf"?"野狼被消灭！":"教徒倒下！","#d33");
  for(const u of G.units){ if(u.target===e){ const nx=autoAcquire(u);
    if(nx){ u.target=nx; u.state="attack"; } else { u.target=null; u.state="idle"; } } } }

// 攻击表现：近战突刺+挥砍弧光 / 远程后坐 + 受击闪白
export function hitFx(att,tgt,ranged){
  if(att){ const dx=tgt.x-att.x, dy=tgt.y-att.y, d=Math.hypot(dx,dy)||1;
    att.lungeT=0.18; att.lungeDx=(ranged?-dx/d*5:dx/d*11); att.lungeDy=(ranged?-dy/d*5:dy/d*11); att.atkPulseT=0.18; }
  tgt.hurtT=0.15;
  spawnParts(tgt.x,tgt.y-16,4,"#f2e6c8",120,300,0.35,2.6);
  let sname="hit";
  if(att){ if(tgt.w) sname="building_hit";
    else if(att.kind==="wolf") sname="wolf";
    else if(att.kind==="cultist") sname="cultist_atk";
    else if(att.type==="hero") sname="slash";
    else if(ranged) sname="bow"; }
  else sname="bow";
  sfx(sname);
  if(!ranged) shake(1.4);
  if(!ranged&&att) G.slashFx.push({x:tgt.x,y:tgt.y-16,ang:Math.atan2(tgt.y-att.y,tgt.x-att.x),t:0});
}
