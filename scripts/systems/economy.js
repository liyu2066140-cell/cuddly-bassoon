import { sfx } from '../core/audio.js';
import { CFG, W } from '../core/config.js';
import { G } from '../core/state.js';
import { addFloat, flash } from '../ui/ui.js';
import { dist2 } from '../core/utils.js';

// ============ 卡片 ============
export function tryBuild(type){
  if(G.gameOver) return;
  const c=CFG.cost[type];
  for(const k of ["wood","food","stone","gold"]) if(c[k]&&G.res[k]<c[k]) return flash("资源不够！");
  if(type==="barracks"&&G.buildings.some(b=>b.type==="barracks")) return flash("兵营只能一座");
  if(type==="tower"&&G.buildings.filter(b=>b.type==="tower").length>=3) return flash("箭塔最多 3 座");
  if((type==="farmer"||type==="archer")&&popUsed()>=G.popCap) return flash("人口满了，先造民居");
  if(type==="archer"&&!G.buildings.some(b=>b.type==="barracks")) return flash("需要先造兵营");
  if(type==="farmer"||type==="archer"){
    for(const k of ["wood","food","stone","gold"]) if(c[k]) G.res[k]-=c[k];
    const home=G.buildings.find(b=>b.type==="townhall");
    G.buildQ.push({type,timer:0,total:CFG.buildTime[type],x:home.x+70,y:home.y+40});
    return;
  }
  G.placing={type};   // 建筑：进入放置模式，玩家选位置，落点才扣资源
}

// 最近同类资源点：软负载均衡（已被越多农民占的节点罚距越大）
export function nearestNode(kind,u){
  const cnt={};
  for(const u2 of G.units){ if(u2.type==="farmer"&&u2.state==="gather"&&u2.node&&u2.node.kind===kind)
    cnt[u2.node]=(cnt[u2.node]||0)+1; }
  let best=null,bd=1e9;
  for(const n of G.nodes){ if(n.amt<=0||n.kind!==kind) continue;
    const d=dist2(u.x,u.y,n.x,n.y)+(cnt[n]||0)*900;
    if(d<bd){bd=d;best=n;} }
  return best;
}

// ============ 一键指令（采集/全军出击）============
export function commandGather(kind){
  if(G.gameOver) return;
  const fs=G.units.filter(u=>u.type==="farmer");
  if(!fs.length) return flash("没有农民，先造一个");
  const labels={wood:"伐木",food:"采食",stone:"采石",gold:"挖金"};
  let sent=0;
  for(const f of fs){ const n=nearestNode(kind,f); if(n){ f.node=n; f.state="gather"; f.target=null; f.dest=null; sent++; } }
  if(!sent) return flash("地图上没有可采的"+{wood:"树木",food:"浆果",stone:"石头",gold:"金矿"}[kind]);
  addFloat(W/2,110,"全体农民 → "+labels[kind],"#185FA5"); sfx("click");
}

export function commandAttack(){
  if(G.gameOver) return;
  const ts=G.units.filter(u=>u.type==="archer"||u.type==="hero");
  if(!ts.length) return flash("没有战斗单位");
  if(!G.enemies.length) return flash("视野内没有敌人");
  for(const t of ts){ let near=null,nd=1e9;
    for(const e of enemies){ const d=dist2(t.x,t.y,e.x,e.y); if(d<nd){nd=d;near=e;} }
    if(near){ t.target=near; t.state="attack"; t.node=null; t.dest=null; } }
  addFloat(W/2,110,"全军出击！","#c33333"); sfx("click");
}
