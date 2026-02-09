import { World } from './engine/world.js';
import { Player } from './engine/player.js';
import { initInput } from './engine/input.js';
import { initBuild } from './engine/build.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let cx=0, cy=0;
let world = new World(cx,cy);
let player = new Player(10,7);

initInput(player);
initBuild(world,canvas);

function changeWorld(dx,dy){
  world.save();
  cx+=dx; cy+=dy;
  world = new World(cx,cy);
  player.x=10; player.y=7;
  initBuild(world,canvas);
}

function loop(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  world.draw(ctx);
  player.update(world,changeWorld);
  player.draw(ctx);
  requestAnimationFrame(loop);
}
loop();