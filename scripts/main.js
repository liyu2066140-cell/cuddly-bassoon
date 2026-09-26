import { loadAssets } from './core/assets.js';
import { sfx } from './core/audio.js';
import { cv } from './core/canvas.js';
import { autoAcquire, hitFx, onEnemyDead, shake, whirl } from './systems/combat.js';
import { CFG, H, W } from './core/config.js';
import { $ } from './core/dom.js';
import { commandAttack, commandGather, nearestNode, tryBuild } from './systems/economy.js';
import { addBuilding, makeEnemy, spawnUnit } from './entities/entities.js';
import { PARTCOL, spawnParts } from './systems/fx.js';
import { clampCam } from './systems/input.js';
import { LEVELS, nextLevel, retryLevel, startLevel } from './scenes/levels.js';
import { buildGrid, followPath, worldPath } from './core/pathfinding.js';
import { render } from './render/render.js';
import { saveSettings } from './core/settings.js';
import { G } from './core/state.js';
import { drawMountains } from './render/terrain.js';
import { addFloat, banner, hud, syncPanel, tutor } from './ui/ui.js';
import { dist2, rnd } from './core/utils.js';

$("cFarmer").onclick=()=>tryBuild("farmer");

$("cHouse").onclick=()=>tryBuild("house");

$("cBarracks").onclick=()=>tryBuild("barracks");

$("cArcher").onclick=()=>tryBuild("archer");

$("cTower").onclick=()=>tryBuild("tower");

$("cSkill").onclick=()=>whirl();

// ============ 更新 ============
function update(dt){
  if(G.gameOver) return;
  const ms=640*dt;
  if(G.keys["arrowleft"])G.cam.x-=ms; if(G.keys["arrowright"])G.cam.x+=ms;
  if(G.keys["arrowup"])G.cam.y-=ms; if(G.keys["arrowdown"])G.cam.y+=ms;
  clampCam();
  if(G.heroCd>0) G.heroCd=Math.max(0,G.heroCd-dt);
  // 波次（1-2）
  const L=LEVELS[G.level];
  if(L.waves && G.waveIdx<L.waves.length){
    G.waveT+=dt;
    if(G.waveT>=L.waves[G.waveIdx].at){
      const wv=L.waves[G.waveIdx]; G.waveIdx++;
      banner("—— 第 "+G.waveIdx+" 波教徒来袭 ——");
      const side=G.waveIdx%2, sy0=side?840:130;
      (wv.c||[]).forEach((n,i)=>{ for(let k=0;k<n;k++) G.enemies.push(makeEnemy("cultist",1520,sy0+i*26+k*30)); });
      (wv.e||[]).forEach((n,i)=>{ for(let k=0;k<n;k++) G.enemies.push(makeEnemy("cultist_elite",1520,sy0+60+i*30+k*34,true)); });
      (wv.w||[]).forEach((n,i)=>{ for(let k=0;k<n;k++) G.enemies.push(makeEnemy("wolf",1520,sy0+140+k*70)); });
    }
  }
  // 建造队列
  for(const q of [...G.buildQ]){
    q.timer+=dt;
    if(q.timer>=q.total){
      G.buildQ.splice(G.buildQ.indexOf(q),1);
      if(G.selectedQ===q) G.selectedQ=null;
      sfx("build");
      spawnParts(q.x,q.y-16,12,"#cfc8b8",110,160,0.8,3.4);
      if(q.type==="house"){ addBuilding("house",q.x,q.y); G.popCap+=5; addFloat(q.x,q.y-40,"人口+5","#2a7"); }
      else if(q.type==="barracks"){ addBuilding("barracks",q.x,q.y); addFloat(q.x,q.y-50,"兵营建成！","#185FA5"); }
      else if(q.type==="tower"){ addBuilding("tower",q.x,q.y); addFloat(q.x,q.y-50,"箭塔建成！","#185FA5"); }
      else spawnUnit(q.type,q.x,q.y);
    }
  }
  // 我方单位
  for(const u of [...G.units]){
    u.animT+=dt; u.moving=false; if(u.atkT>0) u.atkT-=dt;
    if(u.lungeT>0) u.lungeT-=dt; if(u.hurtT>0) u.hurtT-=dt; if(u.atkPulseT>0) u.atkPulseT-=dt;
    if(u.hp<=0){ G.units.splice(G.units.indexOf(u),1); G.selList=G.selList.filter(x=>x!==u); sfx("die_ally"); addFloat(u.x,u.y,"阵亡…","#555"); continue; }
    if(u.state==="move"&&u.dest){
      if(!u.path){ u.path=worldPath(u.x,u.y,u.dest.x,u.dest.y); u.pi=0; }
      if(u.path){ const done=followPath(u,dt);
        if(done||dist2(u.x,u.y,u.dest.x,u.dest.y)<8){ u.state="idle"; u.dest=null; u.path=null; } }
      else { moveTo(u,u.dest.x,u.dest.y,dt,0); if(dist2(u.x,u.y,u.dest.x,u.dest.y)<6){u.state="idle";u.dest=null;} }
    }
    else if(u.state==="gather"&&u.node){
      if(u.node.amt<=0){ const nx=nearestNode(u.node.kind,u);
        if(nx){ u.node=nx; u.gT=0; u.path=null; addFloat(u.x,u.y-38,"转移采集","#185FA5"); }
        else { u.node=null; u.state="idle"; addFloat(u.x,u.y-38,"资源采尽","#888"); }
        continue; }
      if(!u.path){ u.path=worldPath(u.x,u.y,u.node.x,u.node.y); u.pi=0; }
      if(u.path&&u.pi<u.path.length){ followPath(u,dt); }
      else if(dist2(u.x,u.y,u.node.x,u.node.y)>60){ u.path=null; moveTo(u,u.node.x,u.node.y,dt,0); }
      else { u.gT+=dt; if(u.gT>=CFG.gatherTrip){ u.gT=0; const take=Math.min(CFG.gatherAmt,u.node.amt); u.node.amt-=take;
        const map={wood:["wood","木","#7a4a1d"],food:["food","食","#2a7a2a"],stone:["stone","石","#556"],gold:["gold","金","#a8821c"]};
        const m=map[u.node.kind]; G.res[m[0]]+=take; addFloat(u.x,u.y-40,"+"+take+" "+m[1],m[2]);
        if(u.node.amt<=0) addFloat(u.node.x,u.node.y-30,"枯竭","#888"); sfx("gather");
        spawnParts(u.x,u.y-14,8,PARTCOL[u.node.kind]||"#fff",90,240,0.55,3.2); } }
    }
    else if(u.state==="idle"&&!u.dest){
      u.scanT=(u.scanT||0)+dt;
      if(u.scanT>0.3){ u.scanT=0; const nx=autoAcquire(u); if(nx){ u.target=nx; u.state="attack"; } }
    }
    else if(u.state==="attack"&&u.target){
      if(u.target.hp<=0){ const nx=autoAcquire(u);
        if(nx){ u.target=nx; } else { u.state="idle"; u.target=null; } continue; }
      if(dist2(u.x,u.y,u.target.x,u.target.y)>u.rng+14) moveTo(u,u.target.x,u.target.y,dt,0);
      else if(u.atkT<=0){ u.atkT=u.as;
        const ranged=u.rng>60;
        if(ranged) G.projs.push({x:u.x,y:u.y-24,x2:u.target.x,y2:u.target.y-20,t:0});
        hitFx(u,u.target,ranged);
        u.target.hp-=u.atk; addFloat(u.target.x,u.target.y-34,"-"+u.atk,"#e24B4A");
        if(u.target.hp<=0) onEnemyDead(u.target); }
    }
  }
  // 塔攻击
  for(const b of G.buildings){ if(b.type!=="tower"||b.hp<=0) continue;
    if(b.atkT>0) b.atkT-=dt;
    let near=null,nd=b.rng;
    for(const e of G.enemies){ const d=dist2(b.x,b.y-60,e.x,e.y); if(d<nd){nd=d;near=e;} }
    if(near&&b.atkT<=0){ b.atkT=b.as; G.projs.push({x:b.x,y:b.y-70,x2:near.x,y2:near.y-20,t:0});
      hitFx(null,near,true); sfx("tower_shot");
      near.hp-=b.atk; addFloat(near.x,near.y-34,"-"+b.atk,"#e24B4A"); if(near.hp<=0) onEnemyDead(near); }
  }
  // 建筑损毁
  for(const b of [...G.buildings]){ if(b.hp<=0){ G.buildings.splice(G.buildings.indexOf(b),1); buildGrid(); sfx("building_down"); addFloat(b.x,b.y-30,"建筑被毁！","#d33");
    if(b.type==="townhall"){ G.gameOver=true; sfx("lose"); showOverlay("主城陷落…","第 "+G.level+" 关失败。教徒烧了主城。","重玩本关","retryLevel()"); return; } } }
  // 农民保护 / 英雄复活
  if(!G.units.some(u=>u.type==="farmer")){ G.rescueT+=dt; if(G.rescueT>15){ G.rescueT=0; spawnUnit("farmer",220,500); addFloat(220,470,"主城补员 +1","#185FA5"); } } else G.rescueT=0;
  if(!G.units.some(u=>u.type==="hero")){ G.heroRevT+=dt; if(G.heroRevT>60){ G.heroRevT=0; spawnUnit("hero",180,480); addFloat(180,450,"英雄归队！","#185FA5"); } } else G.heroRevT=0;
  // 敌人
  for(const e of [...G.enemies]){
    if(e.hp<=0){ onEnemyDead(e); continue; }
    if(e.atkT>0) e.atkT-=dt;
    e.moving=false;
    if(e.lungeT>0) e.lungeT-=dt; if(e.hurtT>0) e.hurtT-=dt; if(e.atkPulseT>0) e.atkPulseT-=dt;
    const home=G.buildings.find(b=>b.type==="townhall");
    if(e.kind==="wolf"){
      if(e.state==="attack"&&e.target){
        if(e.target.hp<=0||(e.target.team&&e.target.team!=="P")){ e.state="idle"; e.target=null; continue; }
        if(dist2(e.x,e.y,e.target.x,e.target.y)>e.rng+12) moveTo(e,e.target.x,e.target.y,dt,0);
        else if(e.atkT<=0){ e.atkT=e.as; hitFx(e,e.target,false); e.target.hp-=e.atk; addFloat(e.target.x,e.target.y-34,"-"+e.atk,"#e24B4A"); }
      } else {
        let near=null,nd=150;
        for(const u of G.units){ const d=dist2(e.x,e.y,u.x,u.y); if(d<nd){nd=d;near=u;} }
        if(near){ e.state="attack"; e.target=near; }
        else { e.wT-=dt; if(e.wT<=0){ e.wT=rnd(1.5,3.5); e.dest={x:e.hx+rnd(-70,70),y:e.hy+rnd(-50,50)}; }
          if(e.dest){ moveTo(e,e.dest.x,e.dest.y,dt,20); if(dist2(e.x,e.y,e.dest.x,e.dest.y)<4) e.dest=null; } }
      }
    } else {
      if(e.state==="attack"&&e.target){
        if(e.target.hp<=0){ e.state="march"; e.target=null; e.path=null; continue; }
        if(dist2(e.x,e.y,e.target.x,e.target.y)>e.rng+(e.target.w?e.target.w/2+6:14)) moveTo(e,e.target.x,e.target.y,dt,0);
        else if(e.atkT<=0){ e.atkT=e.as; hitFx(e,e.target,false); e.target.hp-=e.atk; shake(2.2);
          addFloat(e.target.x,e.target.y-(e.target.w?70:34),"-"+e.atk,"#e24B4A"); }
      } else {
        let near=null,nd=130;
        for(const u of G.units){ const d=dist2(e.x,e.y,u.x,u.y); if(d<nd){nd=d;near=u;} }
        for(const b of G.buildings){ if(b.type!=="tower") continue; const d=dist2(e.x,e.y,b.x,b.y); if(d<nd){nd=d;near=b;} }
        if(near){ e.state="attack"; e.target=near; }
        else {
          if(!e.path||e.pi>=e.path.length){
            if(!home) continue;
            e.path=worldPath(e.x,e.y,home.x,home.y); e.pi=0;
            if(!e.path){
              let wb=null,wd=1e9;
              for(const b of G.buildings){ if(b.type!=="wall")continue; const d=dist2(e.x,e.y,b.x,b.y); if(d<wd){wd=d;wb=b;} }
              if(wb){ e.state="attack"; e.target=wb; }
              else { e.path=null; moveTo(e,home.x,home.y,dt,0); }
              continue;
            }
          }
          const done=followPath(e,dt);
          if(done){ e.path=null;
            if(home&&dist2(e.x,e.y,home.x,home.y)<e.rng+70){ e.state="attack"; e.target=home; } }
        }
      }
    }
  }
  // 特效
  for(const f of [...G.floats]){ f.t+=dt; f.y-=28*dt; if(f.t>1.1) G.floats.splice(G.floats.indexOf(f),1); }
  for(const p of [...G.projs]){ p.t+=dt*6; if(p.t>=1) G.projs.splice(G.projs.indexOf(p),1); }
  for(const s of [...G.slashFx]){ s.t+=dt*7; if(s.t>=1) G.slashFx.splice(G.slashFx.indexOf(s),1); }
  for(const p of [...G.parts]){ p.t+=dt; p.x+=p.vx*dt; p.y+=p.vy*dt; p.vy+=p.g*dt; if(p.t>=p.life) G.parts.splice(G.parts.indexOf(p),1); }
  for(const s of [...G.sparkles]){ s.t+=dt; if(s.t>0.9) G.sparkles.splice(G.sparkles.indexOf(s),1); }
  for(const m of [...G.moveMarks]){ m.t+=dt; if(m.t>0.5) G.moveMarks.splice(G.moveMarks.indexOf(m),1); }
  if(G.shakeT>0){ G.shakeT-=dt; if(G.shakeT<=0) G.shakeAmp=0; }
  // 胜利
  if(!G.winFlag && !G.gameOver){
    const win = L.waves ? (G.waveIdx>=L.waves.length && G.enemies.length===0) : L.winCheck();
    if(win && G.units.some(u=>u.team==="P")){ G.winFlag=true;
      const secs=Math.round((performance.now()-G.t0)/1000);
      setTimeout(()=>{ if(G.gameOver)return; G.gameOver=true; sfx("win");
        const next = G.level===1 ? ["进入 1-2 月夜突袭","nextLevel()"] : G.level===2 ? ["进入 1-3 峡谷会战","nextLevel()"] : ["第一章全部通关！","nextLevel()"];
        showOverlay("胜利！", "用时 "+secs+" 秒 · 斩杀 "+G.killed+" 名敌人", next[0], next[1]); },600);
    }
  }
}

$("gearBtn").onclick=()=>{ sfx("click"); syncPanel(); $("settings").style.display="flex"; };

// 全屏切换（Fullscreen API）
$("fsBtn").onclick=()=>{ sfx("click");
  if(!document.fullscreenElement){ (document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen())||0; }
  else if(document.exitFullscreen){ document.exitFullscreen(); } };

document.addEventListener("fullscreenchange",()=>{
  $("fsBtn").textContent=document.fullscreenElement?"⤢":"⛶";
  $("fsBtn").title=document.fullscreenElement?"退出全屏":"全屏切换";
});

$("sClose").onclick=()=>{ sfx("click"); $("settings").style.display="none"; };

$("sReplay").onclick=()=>{ $("settings").style.display="none"; retryLevel(); };

$("bSpeed").onclick=()=>{ G.settings.speed=SPEEDS[(SPEEDS.indexOf(G.settings.speed)+1)%SPEEDS.length]; saveSettings(); syncPanel(); };

$("bSound").onclick=()=>{ G.settings.sound=!G.settings.sound; saveSettings(); syncPanel(); if(G.settings.sound) sfx("click"); };

$("bFloats").onclick=()=>{ G.settings.floats=!G.settings.floats; saveSettings(); syncPanel(); };

$("bBars").onclick=()=>{ G.settings.bars={all:"hurt",hurt:"off",off:"all"}[G.settings.bars]; saveSettings(); syncPanel(); };

$("bTutor").onclick=()=>{ G.settings.tutor=!G.settings.tutor; saveSettings(); syncPanel(); };

$("mWood").onclick=()=>commandGather("wood");

$("mFood").onclick=()=>commandGather("food");

$("mStone").onclick=()=>commandGather("stone");

$("mGold").onclick=()=>commandGather("gold");

$("mAtk").onclick=()=>commandAttack();

$("cWall").onclick=()=>tryBuild("wall");


// ============ 主循环 ============
let last=performance.now();

function loop(now){
  const dt=Math.min(0.05,(now-last)/1000)*G.settings.speed; last=now;
  update(dt); render(); hud(); tutor();
  requestAnimationFrame(loop);
}

const urlLevel=parseInt(new URLSearchParams(location.search).get("level")||"1",10);

loadAssets().then(()=>{ drawMountains(); startLevel([1,2,3].includes(urlLevel)?urlLevel:1); requestAnimationFrame(loop); });

// 自动拖拽自检（?autotest=1）
if(new URLSearchParams(location.search).get("autotest")){
  setTimeout(()=>{
    tryBuild("house");
    setTimeout(()=>{
      const r=cv.getBoundingClientRect();
      const ev=(t,x,y)=>new MouseEvent(t,{clientX:r.left+x*r.width/W,clientY:r.top+y*r.height/H,button:0,bubbles:true});
      cv.dispatchEvent(ev("mousemove",700,300));
      cv.dispatchEvent(ev("mousedown",700,300));
      cv.dispatchEvent(ev("mouseup",700,300));
      setTimeout(()=>{
        const q=G.buildQ[0];
        const after=q?Math.round(q.x)+","+Math.round(q.y):"GONE";
        const ok=q&&Math.abs(q.x-700)<40&&Math.abs(q.y-300)<40;
        const d=document.createElement("div");
        d.style.cssText="position:fixed;top:44%;left:50%;transform:translate(-50%,-50%);background:#000;color:"+(ok?"#0f0":"#f44")+";font-size:26px;padding:18px 26px;z-index:99;border:3px solid #fff";
        d.textContent="放置自检: -> ("+after+") "+(ok?"通过":"失败");
        document.body.appendChild(d);
        document.title="TEST:"+after;
      },400);
    },800);
  },600);
}
window.retryLevel = retryLevel;
window.nextLevel = nextLevel;

