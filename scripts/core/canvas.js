import { H, W } from './config.js';

export const cv=document.getElementById("cv"), ctx=cv.getContext("2d");

export const DPR=Math.min(window.devicePixelRatio||1,2);

cv.width=W*DPR; cv.height=H*DPR;

ctx.setTransform(DPR,0,0,DPR,0,0);

ctx.imageSmoothingEnabled=true; ctx.imageSmoothingQuality="high";
