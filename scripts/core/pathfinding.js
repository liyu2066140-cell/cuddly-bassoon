import { BRIDGE_ROWS, GH, GS, GW, MOUNTAINS, RIVER_X } from './config.js';
import { spawnParts } from '../systems/fx.js';
import { G } from './state.js';
import { dist2 } from './utils.js';

export function buildGrid(){
  G.grid=[];
  for(let y=0;y<GH;y++){ const row=[];
    for(let x=0;x<GW;x++){ let b=0;
      if(x===RIVER_X&&!BRIDGE_ROWS.includes(y)) b=1;
      for(const m of MOUNTAINS) if(m[0]===x&&m[1]===y) b=1;
      row.push(b); }
    G.grid.push(row); }
  for(const b of G.buildings){ const gx=Math.floor(b.x/GS), gy=Math.floor(b.y/GS);
    if(gx>=0&&gy>=0&&gx<GW&&gy<GH) G.grid[gy][gx]=1; }
  for(const n of G.nodes){ if(n.amt<=0) continue;
    const gx=Math.floor(n.x/GS), gy=Math.floor(n.y/GS);
    if(gx>=0&&gy>=0&&gx<GW&&gy<GH) G.grid[gy][gx]=1; }
  for(const e of G.enemies){ if(e.kind==="cultist") e.path=null; }
}

function astar(sgx,sgy,tgx,tgy){
  if(sgx<0||sgy<0||sgx>=GW||sgy>=GH) return null;
  if(G.grid[tgy]&&G.grid[tgy][tgx]===1){
    const alts=[[tgx+1,tgy],[tgx-1,tgy],[tgx,tgy+1],[tgx,tgy-1]].filter(([x,y])=>x>=0&&y>=0&&x<GW&&y<GH&&G.grid[y][x]===0);
    if(!alts.length) return null;
    alts.sort((a,b)=>dist2(a[0]*GS+32,a[1]*GS+32,sgx*GS+32,sgy*GS+32)-dist2(b[0]*GS+32,b[1]*GS+32,sgx*GS+32,sgy*GS+32));
    tgx=alts[0][0]; tgy=alts[0][1];
  }
  const open=[[sgx,sgy]], came={}, gs={}, fs={};
  const sk=sgx+","+sgy; gs[sk]=0; fs[sk]=Math.abs(tgx-sgx)+Math.abs(tgy-sgy);
  let guard=0;
  while(open.length&&guard++<2000){
    let bi=0;
    for(let i=1;i<open.length;i++){ const a=open[i][0]+","+open[i][1], b=open[bi][0]+","+open[bi][1];
      if((fs[a]||1e9)<(fs[b]||1e9)) bi=i; }
    const cur=open.splice(bi,1)[0], ck=cur[0]+","+cur[1];
    if(cur[0]===tgx&&cur[1]===tgy){
      const path=[]; let k=ck;
      while(k){ const p=k.split(","), x=+p[0], y=+p[1]; path.unshift({x:x*GS+32,y:y*GS+32}); k=came[k]; }
      return path;
    }
    for(const d of [[1,0],[-1,0],[0,1],[0,-1]]){
      const nx=cur[0]+d[0], ny=cur[1]+d[1];
      if(nx<0||ny<0||nx>=GW||ny>=GH||G.grid[ny][nx]===1) continue;
      const ng=(gs[ck]||0)+(G.roadSet.has(nx+","+ny)?0.6:1), nk=nx+","+ny;
      if(gs[nk]===undefined||ng<gs[nk]){ gs[nk]=ng; came[nk]=ck;
        fs[nk]=ng+Math.abs(tgx-nx)+Math.abs(tgy-ny);
        if(!open.some(o=>o[0]===nx&&o[1]===ny)) open.push([nx,ny]); }
    }
  }
  return null;
}

export function worldPath(x1,y1,x2,y2){
  const p=astar(Math.floor(x1/GS),Math.floor(y1/GS),Math.floor(x2/GS),Math.floor(y2/GS));
  if(p&&p.length) p[p.length-1]={x:x2,y:y2};
  return p;
}

export function followPath(u,dt){
  while(u.path&&u.pi<u.path.length&&dist2(u.x,u.y,u.path[u.pi].x,u.path[u.pi].y)<22) u.pi++;
  if(!u.path||u.pi>=u.path.length) return true;
  moveTo(u,u.path[u.pi].x,u.path[u.pi].y,dt,0);
  return false;
}

function moveTo(o,tx,ty,dt,stopD){
  const dx=tx-o.x, dy=ty-o.y, d=Math.hypot(dx,dy);
  if(d>Math.max(1,stopD)){ o.x+=dx/d*o.spd*dt; o.y+=dy/d*o.spd*dt; o.face=dx>=0?1:-1; o.moving=true; o.walkT=(o.walkT||0)+dt;
    if(Math.random()<dt*5) spawnParts(o.x,o.y+2,1,"rgba(186,168,128,.5)",26,80,0.4,2.4); }
}
