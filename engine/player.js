export class Player{
constructor(x,y){this.x=x;this.y=y;this.vx=0;this.vy=0;this.s=0.1;}
update(w,change){
this.x+=this.vx;this.y+=this.vy;
if(this.x<0)change(-1,0);
if(this.x>=w.w)change(1,0);
if(this.y<0)change(0,-1);
if(this.y>=w.h)change(0,1);
}
draw(ctx){ctx.fillStyle='#3498db';ctx.fillRect(this.x*32+4,this.y*32+4,24,24);}}