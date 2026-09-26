import { IMGS } from '../core/assets.js';
import { BRIDGE_ROWS, GS, H, MOUNTAINS, RIVER_X, W, WH, WW } from '../core/config.js';
import { G } from '../core/state.js';
import { rnd } from '../core/utils.js';

// 暗角（一次性离屏）
export const vig=document.createElement("canvas"); vig.width=W; vig.height=H;

{ const c=vig.getContext("2d");
  const g=c.createRadialGradient(W/2,H/2,H*0.40,W/2,H/2,H*0.80);
  g.addColorStop(0,"rgba(0,0,0,0)"); g.addColorStop(1,"rgba(18,24,16,0.14)");
  c.fillStyle=g; c.fillRect(0,0,W,H); }

// 世界地形层（河/桥/山/道路，一次性离屏 1536×1024）
export const terrainC=document.createElement("canvas"); terrainC.width=WW; terrainC.height=WH;

{ const c=terrainC.getContext("2d");
  c.fillStyle="#4a9ac2"; c.fillRect(RIVER_X*GS,0,GS,WH);
  c.strokeStyle="rgba(255,255,255,.28)"; c.lineWidth=3;
  for(let y=24;y<WH;y+=60){ c.beginPath(); c.moveTo(RIVER_X*GS+8,y); c.quadraticCurveTo(RIVER_X*GS+32,y+10,RIVER_X*GS+56,y); c.stroke(); }
  c.fillStyle="#a8783c"; c.fillRect(RIVER_X*GS-6,BRIDGE_ROWS[0]*GS,GS+12,BRIDGE_ROWS.length*GS);
  c.strokeStyle="#6a4a20"; c.lineWidth=3;
  for(let y=BRIDGE_ROWS[0]*GS+12;y<BRIDGE_ROWS[0]*GS+BRIDGE_ROWS.length*GS;y+=16){
    c.beginPath(); c.moveTo(RIVER_X*GS-6,y); c.lineTo(RIVER_X*GS+GS+6,y); c.stroke(); }
  c.fillStyle="#6a4a20"; c.fillRect(RIVER_X*GS-10,BRIDGE_ROWS[0]*GS,6,BRIDGE_ROWS.length*GS); c.fillRect(RIVER_X*GS+GS+4,BRIDGE_ROWS[0]*GS,6,BRIDGE_ROWS.length*GS);
  let rseed=913; const rr2=()=>{ rseed=(rseed*9301+49297)%233280; return rseed/233280; };
  c.lineCap="round";
  const paths=[ [[23,2],[19,2],[18,5],[15,5],[15,7],[13,7],[3,7]],
                [[23,13],[19,13],[15,13],[13,10],[13,8],[3,8]] ];
  for(const pts of paths){
    for(let i=0;i<pts.length-1;i++){
      const x1=pts[i][0]*GS+32, y1=pts[i][1]*GS+32, x2=pts[i+1][0]*GS+32, y2=pts[i+1][1]*GS+32;
      const len=Math.hypot(x2-x1,y2-y1), steps=Math.ceil(len/13);
      for(let s2=0;s2<=steps;s2++){
        const t=s2/steps, x=x1+(x2-x1)*t, y=y1+(y2-y1)*t, r=16+rr2()*7;
        c.fillStyle=(s2+i)%2?"rgba(158,126,72,.95)":"rgba(146,114,62,.95)";
        c.beginPath(); c.arc(x,y,r,0,7); c.fill();
      }
    }
    c.strokeStyle="rgba(198,166,110,.9)"; c.lineWidth=20;
    c.beginPath(); pts.forEach((p,i)=>{ const x=p[0]*GS+32,y=p[1]*GS+32; i?c.lineTo(x,y):c.moveTo(x,y); }); c.stroke();
    c.setLineDash([4,30]); c.strokeStyle="rgba(118,94,52,.55)"; c.lineWidth=3; c.stroke(); c.setLineDash([]);
    for(let i=0;i<pts.length-1;i++){
      const x1=pts[i][0]*GS+32, y1=pts[i][1]*GS+32, x2=pts[i+1][0]*GS+32, y2=pts[i+1][1]*GS+32;
      const len=Math.hypot(x2-x1,y2-y1), steps=Math.ceil(len/24);
      const dx=(x2-x1)/len, dy=(y2-y1)/len;
      for(let s2=1;s2<steps;s2++){
        const x=x1+(x2-x1)*s2/steps, y=y1+(y2-y1)*s2/steps;
        for(const sgn of [-1,1]){
          const off=20+rr2()*9, px=x-dy*off*sgn, py=y+dx*off*sgn;
          if(rr2()<0.55){
            c.strokeStyle="rgba(40,110,40,"+(0.5+rr2()*0.3).toFixed(2)+")"; c.lineWidth=1.8;
            for(let k=-1;k<=1;k++){ c.beginPath(); c.moveTo(px+k*2.2,py); c.quadraticCurveTo(px+k*3,py-4,px+k*3.8,py-7); c.stroke(); }
          } else {
            c.fillStyle="rgba(150,140,120,.8)"; c.beginPath(); c.ellipse(px,py,2.5+rr2()*2,1.8+rr2()*1.4,rr2()*3,0,7); c.fill();
          }
        }
      }
    }
    for(let i=0;i<pts.length-1;i++){ const [x1,y1]=pts[i],[x2,y2]=pts[i+1];
      const steps=Math.max(Math.abs(x2-x1),Math.abs(y2-y1))*2;
      for(let s2=0;s2<=steps;s2++) G.roadSet.add(Math.round(x1+(x2-x1)*s2/steps)+","+Math.round(y1+(y2-y1)*s2/steps)); }
  } }

export function drawMountains(){ const c=terrainC.getContext("2d"); const m=IMGS["19_mountain"]; if(!m)return;
  for(let i=0;i<MOUNTAINS.length;i++){ const [mx,my]=MOUNTAINS[i];
    const cx=mx*GS+32, cy=my*GS+GS-4, s=i%2?84:76;
    c.drawImage(m,cx-s/2,cy-s,s,s); } }

// 色阶层（世界尺寸）
export const ground2=document.createElement("canvas"); ground2.width=WW; ground2.height=WH;

{ const c=ground2.getContext("2d");
  let seed=777; const rnd=()=>{ seed=(seed*9301+49297)%233280; return seed/233280; };
  for(let i=0;i<64;i++){ c.fillStyle="rgba(36,108,28,"+(0.05+rnd()*0.05).toFixed(2)+")";
    c.beginPath(); c.ellipse(rnd()*WW,rnd()*WH,60+rnd()*90,40+rnd()*60,rnd()*3,0,7); c.fill(); }
  for(let i=0;i<50;i++){ c.fillStyle="rgba(196,232,124,"+(0.05+rnd()*0.06).toFixed(2)+")";
    c.beginPath(); c.ellipse(rnd()*WW,rnd()*WH,50+rnd()*80,35+rnd()*55,rnd()*3,0,7); c.fill(); }
  for(let i=0;i<25;i++){ c.fillStyle="rgba(152,122,70,"+(0.04+rnd()*0.04).toFixed(2)+")";
    c.beginPath(); c.ellipse(rnd()*WW,rnd()*WH,40+rnd()*60,25+rnd()*40,rnd()*3,0,7); c.fill(); } }

// 装饰层（世界尺寸，避开河带）
export const deco=document.createElement("canvas"); deco.width=WW; deco.height=WH;

{ const c=deco.getContext("2d");
  let seed=4224; const rnd=()=>{ seed=(seed*9301+49297)%233280; return seed/233280; };
  c.lineCap="round";
  for(let i=0;i<240;i++){ const x=48+rnd()*(WW-96), y=52+rnd()*(WH-104); if(x>872&&x<984) continue;
    c.strokeStyle="rgba(30,86,26,"+(0.22+rnd()*0.26).toFixed(2)+")"; c.lineWidth=1.7;
    for(let k=-1;k<=1;k++){ c.beginPath(); c.moveTo(x+k*2.4,y); c.quadraticCurveTo(x+k*3.4,y-5,x+k*4.4,y-9); c.stroke(); } }
  for(let i=0;i<66;i++){ const x=52+rnd()*(WW-104), y=56+rnd()*(WH-112); if(x>872&&x<984) continue;
    const col=rnd()>0.5?"255,255,255":"255,214,80";
    c.fillStyle="rgba("+col+",0.9)";
    for(let p=0;p<5;p++){ const a=p/5*Math.PI*2+rnd(); c.beginPath(); c.arc(x+Math.cos(a)*2.8,y+Math.sin(a)*2.8,1.7,0,7); c.fill(); }
    c.fillStyle="rgba(255,150,40,.95)"; c.beginPath(); c.arc(x,y,1.5,0,7); c.fill(); }
  for(let i=0;i<40;i++){ const x=56+rnd()*(WW-112), y=60+rnd()*(WH-120); if(x>872&&x<984) continue;
    c.fillStyle="rgba(142,148,132,.55)"; c.strokeStyle="rgba(58,64,52,.4)"; c.lineWidth=1;
    c.beginPath(); c.ellipse(x,y,3+rnd()*2.6,2+rnd()*1.7,rnd()*3,0,7); c.fill(); c.stroke(); } }

// 岛屿沙沿（世界尺寸）
export const edge=document.createElement("canvas"); edge.width=WW; edge.height=WH;

{ const c=edge.getContext("2d"), M=40;
  const sides=[[0,0,0,M],[WW,0,WW-M,0],[0,WH,0,WH-M],[0,0,0,M]];
  for(let side=0; side<4; side++){
    const g=c.createLinearGradient(sides[side][0],sides[side][1],sides[side][2],sides[side][3]);
    g.addColorStop(0,"rgba(74,150,178,.9)");
    g.addColorStop(0.35,"rgba(206,186,132,.7)");
    g.addColorStop(1,"rgba(206,186,132,0)");
    c.fillStyle=g;
    if(side===0) c.fillRect(0,0,WW,M);
    if(side===1) c.fillRect(WW-M,0,M,WH);
    if(side===2) c.fillRect(0,WH-M,WW,M);
    if(side===3) c.fillRect(0,0,M,WH);
  } }
