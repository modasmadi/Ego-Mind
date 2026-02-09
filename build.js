export function initBuild(world,canvas){
canvas.onclick=e=>{
let x=Math.floor(e.offsetX/world.size);
let y=Math.floor(e.offsetY/world.size);
if(world.map[y]&&world.map[y][x]!=null){
world.map[y][x]=1;
world.save();
}}}