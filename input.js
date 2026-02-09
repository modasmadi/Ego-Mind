export function initInput(p){
onkeydown=e=>{
if(e.key=='ArrowUp')p.vy=-p.s;
if(e.key=='ArrowDown')p.vy=p.s;
if(e.key=='ArrowLeft')p.vx=-p.s;
if(e.key=='ArrowRight')p.vx=p.s;
};
onkeyup=()=>{p.vx=p.vy=0;}
}