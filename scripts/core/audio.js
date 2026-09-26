import { whirl } from '../systems/combat.js';
import { G } from './state.js';

let AC=null;

function beep(f,t,type,vol,delay){
  if(!G.settings.sound) return;
  if(!AC){ try{ AC=new (window.AudioContext||window.webkitAudioContext)(); }catch(err){ return; } }
  const o=AC.createOscillator(), g=AC.createGain();
  o.type=type; o.frequency.value=f;
  g.gain.setValueAtTime(vol||0.04, AC.currentTime+delay);
  g.gain.exponentialRampToValueAtTime(0.0001, AC.currentTime+delay+t);
  o.connect(g); g.connect(AC.destination); o.start(AC.currentTime+delay); o.stop(AC.currentTime+delay+t);
}

function noiseBurst(t,vol,delay,cutoff){
  if(!G.settings.sound) return;
  if(!AC){ try{ AC=new (window.AudioContext||window.webkitAudioContext)(); }catch(err){ return; } }
  const b=AC.createBuffer(1,Math.max(1,Math.floor(AC.sampleRate*t)),AC.sampleRate);
  const d=b.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1;
  const src=AC.createBufferSource(); src.buffer=b;
  const f=AC.createBiquadFilter(); f.type="lowpass"; f.frequency.value=cutoff||800;
  const g=AC.createGain();
  g.gain.setValueAtTime(vol||0.04, AC.currentTime+delay);
  g.gain.exponentialRampToValueAtTime(0.0001, AC.currentTime+delay+t);
  src.connect(f); f.connect(g); g.connect(AC.destination); src.start(AC.currentTime+delay);
}

function sweepTone(f1,f2,t,type,vol,delay){
  if(!G.settings.sound) return;
  if(!AC){ try{ AC=new (window.AudioContext||window.webkitAudioContext)(); }catch(err){ return; } }
  const o=AC.createOscillator(), g=AC.createGain();
  o.type=type; o.frequency.setValueAtTime(f1, AC.currentTime+delay);
  o.frequency.exponentialRampToValueAtTime(Math.max(30,f2), AC.currentTime+delay+t);
  g.gain.setValueAtTime(vol||0.04, AC.currentTime+delay);
  g.gain.exponentialRampToValueAtTime(0.0001, AC.currentTime+delay+t);
  o.connect(g); g.connect(AC.destination); o.start(AC.currentTime+delay); o.stop(AC.currentTime+delay+t);
}

export function sfx(name){
  if(name==="hit"){ noiseBurst(0.07,0.05,0,900); beep(150,0.06,"square",0.03,0); }
  else if(name==="slash"){ noiseBurst(0.09,0.055,0,1500); sweepTone(300,140,0.08,"square",0.03,0); }
  else if(name==="bow"){ beep(980,0.05,"sine",0.03,0); noiseBurst(0.05,0.02,0,2600); }
  else if(name==="tower_shot"){ beep(720,0.06,"sine",0.03,0); noiseBurst(0.06,0.025,0,1800); }
  else if(name==="cultist_atk"){ beep(95,0.11,"sawtooth",0.05,0); noiseBurst(0.08,0.03,0,420); }
  else if(name==="wolf"){ beep(110,0.12,"sawtooth",0.05,0); noiseBurst(0.09,0.03,0,700); }
  else if(name==="die_enemy"){ sweepTone(180,65,0.2,"sawtooth",0.05,0); noiseBurst(0.18,0.05,0.03,500); }
  else if(name==="die_ally"){ sweepTone(260,95,0.28,"triangle",0.055,0); noiseBurst(0.22,0.06,0.06,340); }
  else if(name==="whirl"){ sweepTone(280,880,0.24,"sawtooth",0.04,0); noiseBurst(0.26,0.035,0,2000); }
  else if(name==="place"){ beep(500,0.05,"sine",0.035,0); noiseBurst(0.05,0.03,0,900); }
  else if(name==="hammer"){ noiseBurst(0.06,0.05,0,650); beep(180,0.06,"square",0.03,0.01); }
  else if(name==="building_hit"){ noiseBurst(0.1,0.05,0,340); beep(85,0.08,"sawtooth",0.03,0); }
  else if(name==="building_down"){ noiseBurst(0.55,0.09,0,240); sweepTone(90,40,0.45,"sawtooth",0.07,0); }
  else if(name==="gather") beep(880,0.06,"sine",0.035,0);
  else if(name==="build"){ beep(523,0.08,"sine",0.04,0); beep(784,0.1,"sine",0.04,0.09); noiseBurst(0.08,0.02,0.02,1200); }
  else if(name==="win"){ beep(523,0.12,"triangle",0.055,0); beep(659,0.12,"triangle",0.055,0.13); beep(784,0.3,"triangle",0.055,0.26); }
  else if(name==="lose"){ beep(320,0.2,"sawtooth",0.05,0); beep(210,0.4,"sawtooth",0.05,0.2); }
  else if(name==="click") beep(660,0.04,"sine",0.025,0);
}
