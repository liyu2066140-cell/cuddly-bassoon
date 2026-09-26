import { G } from '../core/state.js';

// 粒子（采集碎屑/命中火花/消散烟尘/行走尘土）
export function spawnParts(x,y,n,col,spd,g,life,size){
  for(let i=0;i<n;i++){ const a=Math.random()*Math.PI*2, v=(0.4+Math.random()*0.6)*spd;
    G.parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-spd*0.35,g:g||240,life:life||0.6,t:0,col,size:size||3}); } }

export const PARTCOL={wood:"#8a5a2a",food:"#d8383f",stone:"#9aa0a6",gold:"#f2c53d"};
