// ============ 素材 ============
export const IMGS={};

const SRC=["01_hero_viking","02_enemy_cultist","03_archer","05_townhall_t1","06_tower_stone","07_barracks","09_farmer","10_wolf","11_house","13_berry","14_gold","15_stone","16_tree2","17_ground_big","18_wall","19_mountain"];

export function loadAssets(){ return Promise.all(SRC.map(n=>new Promise(ok=>{ const i=new Image(); i.onload=ok; i.src="assets/"+n+".png"; IMGS[n]=i; }))); }

// 素材烘焙：两步下采样（1024→2x→1x）预过滤，小尺寸显示边缘更锐
const bakeCache={};

export function baked(img,w,h){
  const key=img.src+"|"+w+"x"+h;
  if(bakeCache[key]) return bakeCache[key];
  const s1=document.createElement("canvas"); s1.width=w*2; s1.height=h*2;
  const c1=s1.getContext("2d"); c1.imageSmoothingEnabled=true; c1.imageSmoothingQuality="high";
  const iw=img.naturalWidth||img.width, ih=img.naturalHeight||img.height, ins=Math.max(1,Math.round(iw*0.002));
  c1.drawImage(img,ins,ins,iw-ins*2,ih-ins*2,0,0,s1.width,s1.height);
  const s2=document.createElement("canvas"); s2.width=w; s2.height=h;
  const c2=s2.getContext("2d"); c2.imageSmoothingEnabled=true; c2.imageSmoothingQuality="high";
  c2.drawImage(s1,0,0,w,h);
  bakeCache[key]=s2; return s2;
}

