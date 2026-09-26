import { $ } from '../core/dom.js';
import { addBuilding, makeEnemy, spawnUnit } from '../entities/entities.js';
import { buildGrid } from '../core/pathfinding.js';
import { G } from '../core/state.js';
import { tutor } from '../ui/ui.js';

// ============ 关卡 ============
export const LEVELS={
  1:{ name:"1-1 荒岛安家", night:false,
      tip:"拖框多选 / 右键拖屏·方向键移动视角 | [1-4]一键采集 [5]城墙 [A]出击 | 建筑放置自选位置 | 目标：过桥清光三头野狼",
      start(){
        addBuilding("townhall",160,480); addBuilding("barracks",352,544);
        for(let i=0;i<3;i++) spawnUnit("farmer",230+i*26,410);
        spawnUnit("hero",190,370);
        [[600,250],[720,350],[560,450],[480,600]].forEach(p=>G.nodes.push({kind:"wood",x:p[0],y:p[1],amt:300,max:300}));
        [[350,200],[420,150]].forEach(p=>G.nodes.push({kind:"food",x:p[0],y:p[1],amt:500,max:500}));
        G.nodes.push({kind:"gold",x:500,y:680,amt:300,max:300});
        G.nodes.push({kind:"stone",x:830,y:430,amt:600,max:600});
        G.nodes.push({kind:"stone",x:890,y:600,amt:600,max:600});
        [[1050,600],[1120,650],[1180,580]].forEach(p=>G.enemies.push(makeEnemy("wolf",p[0],p[1])));
        buildGrid();
      },
      winCheck(){ return G.enemies.length===0; } },
  2:{ name:"1-2 月夜突袭", night:true,
      tip:"敌军从东侧两个入口沿路进攻，必经中央石桥！用城墙[5]+箭塔封死桥口，弓手压阵 | 主城被毁 = 失败",
      waves:[ {at:10,c:[3]}, {at:55,c:[4]}, {at:100,c:[4],w:[2]} ],
      start(){
        addBuilding("townhall",160,480); addBuilding("barracks",352,544);
        for(let i=0;i<3;i++) spawnUnit("farmer",230+i*26,410);
        spawnUnit("hero",190,370);
        [[600,250],[720,350],[560,450],[480,600]].forEach(p=>G.nodes.push({kind:"wood",x:p[0],y:p[1],amt:300,max:300}));
        [[350,200],[420,150]].forEach(p=>G.nodes.push({kind:"food",x:p[0],y:p[1],amt:500,max:500}));
        G.nodes.push({kind:"gold",x:500,y:680,amt:300,max:300});
        G.nodes.push({kind:"stone",x:830,y:430,amt:600,max:600});
        G.nodes.push({kind:"stone",x:890,y:600,amt:600,max:600});
        buildGrid();
      } },
  3:{ name:"1-3 峡谷会战", night:true,
      tip:"头目亲自带队，四波强攻石桥！双线防守：南口墙阵+北口箭塔群，守住英雄别浪 | 全歼即第一章通关",
      res:{ wood:400, food:400, stone:200, gold:200 },
      waves:[ {at:8,c:[4]}, {at:50,c:[5],e:[1]}, {at:95,c:[5],e:[2]}, {at:140,c:[6],e:[2],w:[2]} ],
      start(){
        addBuilding("townhall",160,480); addBuilding("barracks",352,544);
        for(let i=0;i<3;i++) spawnUnit("farmer",230+i*26,410);
        spawnUnit("hero",190,370);
        [[600,250],[720,350],[560,450],[480,600]].forEach(p=>G.nodes.push({kind:"wood",x:p[0],y:p[1],amt:400,max:400}));
        [[350,200],[420,150]].forEach(p=>G.nodes.push({kind:"food",x:p[0],y:p[1],amt:600,max:600}));
        G.nodes.push({kind:"gold",x:500,y:680,amt:500,max:500});
        G.nodes.push({kind:"stone",x:830,y:430,amt:900,max:900});
        G.nodes.push({kind:"stone",x:890,y:600,amt:900,max:900});
        buildGrid();
      } },
};

export function startLevel(n){
  const L=LEVELS[n];
  G.level=n; G.res={...(L.res||{wood:200,food:200,stone:0,gold:0})}; G.popCap=10;
  G.units=[]; G.buildings=[]; G.nodes=[]; G.enemies=[]; G.buildQ=[]; G.projs=[]; G.floats=[]; G.slashFx=[]; G.parts=[]; G.sparkles=[]; G.moveMarks=[];
  G.selList=[]; G.selectedQ=null; G.placing=null; G.heroCd=0; G.killed=0; G.gameOver=false; G.winFlag=false; G.waveIdx=0; G.waveT=0; G.t0=performance.now();
  G.cam.x=0; G.cam.y=0;
  G.tutorStep = (n===1&&G.settings.tutor ? 1 : 99); G.tutorHold=0;
  $("tip").textContent=LEVELS[n].tip; $("lvName").textContent=LEVELS[n].name;
  $("overlay").style.display="none";
  LEVELS[n].start();
}


export function nextLevel(){
  if(G.level===1) startLevel(2);
  else if(G.level===2) startLevel(3);
  else startLevel(3);
}

export function retryLevel(){ startLevel(G.level); }

