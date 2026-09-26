import { CFG } from '../core/config.js';
import { buildGrid } from '../core/pathfinding.js';
import { G } from '../core/state.js';

export function popUsed(){ return G.units.filter(u=>u.team==="P").length + G.buildQ.filter(q=>q.type==="farmer"||q.type==="archer").length; }

export function spawnUnit(type,x,y){
  const c=CFG[type];
  const u={type,team:"P",x,y,hp:c.hp,maxHp:c.hp,atk:c.atk,as:c.as,rng:c.rng,spd:c.spd,
    state:"idle",dest:null,target:null,node:null,atkT:0,gT:0,face:1,animT:0,whirlFx:0,
    img: type==="hero"?"01_hero_viking": type==="archer"?"03_archer":"09_farmer"};
  G.units.push(u); return u;
}

export function makeEnemy(kind,x,y,elite){
  const c=CFG[kind];
  const mul=elite?{hp:2.8,atk:1.5,spd:0.75}:{hp:1,atk:1,spd:1};
  return {kind,x,y,elite:!!elite,hp:Math.round(c.hp*mul.hp),maxHp:Math.round(c.hp*mul.hp),atk:Math.round(c.atk*mul.atk),as:c.as,rng:c.rng,spd:Math.round(c.spd*mul.spd),
    state:kind==="wolf"?"idle":"march",target:null,dest:null,atkT:0,wT:0,face:1,hx:x,hy:y,pi:0,path:null};
}

export function addBuilding(type,x,y){
  const defs={ townhall:{hp:1500,w:110,img:"05_townhall_t1"}, barracks:{hp:600,w:96,img:"07_barracks"},
               house:{hp:300,w:70,img:"11_house"}, tower:{hp:800,w:80,img:"06_tower_stone",atk:CFG.tower.atk,as:CFG.tower.as,rng:CFG.tower.rng},
               wall:{hp:900,w:56,img:"18_wall"} };
  const d=defs[type];
  const b={type,x,y,hp:d.hp,maxHp:d.hp,w:d.w,img:d.img,atkT:0};
  if(d.atk){ b.atk=d.atk; b.as=d.as; b.rng=d.rng; }
  G.buildings.push(b); buildGrid(); return b;
}
