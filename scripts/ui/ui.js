import { shake } from '../systems/combat.js';
import { W } from '../core/config.js';
import { $ } from '../core/dom.js';
import { LEVELS, retryLevel } from '../scenes/levels.js';
import { G } from '../core/state.js';
import { popUsed } from '../entities/entities.js';

export function addFloat(x,y,text,color){ if(!G.settings.floats) return; G.floats.push({x,y,text,color,t:0}); }

export function flash(msg){ addFloat(W/2,130,msg,"#ff5555"); }


function flashCard(msg){ flash(msg); }

function showOverlay(title,text,btnTxt,btnFn){
  $("ovTitle").textContent=title; $("ovText").textContent=text;
  $("ovBtns").innerHTML='<button onclick="'+btnFn+'">'+btnTxt+'</button><button onclick="retryLevel()">重玩本关</button>';
  $("overlay").style.display="flex";
}

// ============ HUD ============
export function banner(txt){ const b=$("banner"); b.textContent=txt; b.classList.remove("show"); void b.offsetWidth; b.classList.add("show"); }

export function hud(){
  $("rWood").textContent=G.res.wood; $("rFood").textContent=G.res.food; $("rStone").textContent=G.res.stone; $("rGold").textContent=G.res.gold;
  for(const k of ["wood","food","stone","gold"]){ const el=$("r"+k[0].toUpperCase()+k.slice(1));
    if(G.lastRes[k]!==undefined&&G.lastRes[k]!==G.res[k]){ el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop"); }
    G.lastRes[k]=G.res[k]; }
  $("rPop").textContent=popUsed()+"/"+G.popCap;
  $("heroCd").textContent= G.heroCd>0 ? "旋风斧：CD "+G.heroCd.toFixed(1)+"s" : "旋风斧：就绪";
  const hasB=G.buildings.some(b=>b.type==="barracks");
  setCard("cFarmer", G.res.food>=50 && popUsed()<G.popCap);
  setCard("cHouse", G.res.wood>=80);
  setCard("cBarracks", G.res.wood>=150 && !hasB);
  setCard("cArcher", hasB && G.res.wood>=45&&G.res.gold>=40 && popUsed()<G.popCap);
  setCard("cTower", G.res.stone>=150);
  setCard("cWall", G.res.stone>=30);
  setCard("cSkill", G.heroCd<=0 && G.units.some(u=>u.type==="hero"));
  const pmap={house:"cHouse",barracks:"cBarracks",tower:"cTower"};
  for(const k in pmap) $(pmap[k]).style.outline=(G.placing&&G.placing.type===k)?"3px solid #39d353":"none";
  const popSpan=$("rPop"), popRatio=popUsed()/G.popCap;
  popSpan.style.color = popRatio>=1 ? "#c22" : popRatio>=0.8 ? "#d80" : "";
  const L2=LEVELS[G.level];
  if(L2.waves&&G.waveIdx<L2.waves.length){
    $("nextWave").style.display="inline";
    $("nextWave").textContent="下波 "+Math.max(0,Math.ceil(L2.waves[G.waveIdx].at-G.waveT))+"s";
  } else $("nextWave").style.display="none";
}

export function setCard(id,ok){ const el=$(id); el.classList.toggle("off",!ok); if(!ok){ el.classList.remove("shake"); void el.offsetWidth; el.classList.add("shake"); } }


export function tutor(dt){
  const el=$("tutor");
  if(!G.settings.tutor||G.level!==1||G.gameOver||G.tutorStep>3){ el.style.display="none"; return; }
  if(G.tutorStep===1 && G.selList.some(u=>u.type==="farmer")){ G.tutorStep=2; }
  if(G.tutorStep===2 && G.units.some(u=>u.type==="farmer"&&u.state==="gather")){ G.tutorStep=3; G.tutorHold=3.5; }
  if(G.tutorStep===1) el.textContent="① 左键点选一个农民（草帽小人，脚下出现绿圈）";
  else if(G.tutorStep===2) el.textContent="② 左键点击树木 / 浆果 / 金矿 → 农民自动开采";
  else el.textContent="③ 采集自动循环入账 → 造农民扩张经济，清光野狼获胜！";
  el.style.display="block";
  if(G.tutorStep===3){ G.tutorHold-=dt; if(G.tutorHold<=0) G.tutorStep=99; }
}


export function syncPanel(){
  $("bSpeed").textContent=G.settings.speed+"x";
  $("bSound").textContent=G.settings.sound?"开":"关";
  $("bFloats").textContent=G.settings.floats?"开":"关";
  $("bBars").textContent={all:"全部",hurt:"受伤时",off:"隐藏"}[G.settings.bars];
  $("bTutor").textContent=G.settings.tutor?"开":"关";
}

export function barOn(e){ if(G.settings.bars==="off") return false; if(G.settings.bars==="hurt") return e.hp<e.maxHp; return true; }

