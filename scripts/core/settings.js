import { G } from './state.js';

try{ Object.assign(G.settings, JSON.parse(localStorage.getItem("isle_settings")||"{}")); }catch(err){}

export function saveSettings(){ try{ localStorage.setItem("isle_settings", JSON.stringify(G.settings)); }catch(err){} }

const SPEEDS=[1,1.5,2];
