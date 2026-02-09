export class World{
constructor(cx,cy){
this.cx=cx;this.cy=cy;
this.size=32;this.w=25;this.h=15;
this.map=this.load()||this.gen();
}
gen(){return Array.from({length:this.h},()=>Array(this.w).fill(0));}
save(){localStorage.setItem(`w_${this.cx}_${this.cy}`,JSON.stringify(this.map));}
load(){let d=localStorage.getItem(`w_${this.cx}_${this.cy}`);return d?JSON.parse(d):null;}
draw(ctx){
for(let y=0;y<this.h;y++)for(let x=0;x<this.w;x++){
ctx.fillStyle=this.map[y][x]?'#27ae60':'#2ecc71';
ctx.fillRect(x*this.size,y*this.size,this.size,this.size);
}}}