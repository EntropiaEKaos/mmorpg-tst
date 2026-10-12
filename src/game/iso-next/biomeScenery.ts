import type { Graphics } from 'pixi.js';

/** Seeded detail without Math.random(), so streaming/repainting never shuffles the scene.
 * All marks are decorative; only server tiles decide terrain and collisions.
 */
const hash=(x:number,y:number,salt=0):number=>{
 let n=Math.imul(x+salt*37,374761393)+Math.imul(y-salt*11,668265263);
 n=Math.imul(n^(n>>>13),1274126177);
 return ((n^(n>>>16))>>>0)/4294967295;
};
const palettes:Record<string,{foliage:number,light:number,dark:number,detail:number}>={
 plains:{foliage:0x527f44,light:0x9eb67d,dark:0x253f32,detail:0xe0bd77},
 snow:{foliage:0x537e80,light:0xe6f7fa,dark:0x445b72,detail:0xbbddea},
 swamp:{foliage:0x31563c,light:0x83a66a,dark:0x23382d,detail:0xa9ad5c},
 desert:{foliage:0x87784c,light:0xf0d19b,dark:0x71543b,detail:0xb9663c},
 shadow:{foliage:0x504766,light:0x887eaa,dark:0x17182d,detail:0xa778bd},
};

/** Drawn into the *existing tile Graphics* — zero extra display-list items. */
export function drawBiomeTileDetails(g:Graphics,code:string,biome:string,cityStyle:string|undefined,x:number,y:number):void{
 const b=palettes[biome]||palettes.plains;
 const v=hash(x,y);
 const shift=(hash(x,y,3)-.5)*22;
 if(code==='g'||code==='u'||code==='d'||code==='s'){
  // Ground grains/grass are small, camera-scale-aware accents.
  for(let k=0;k<3;k++){
   const a=hash(x+k*13,y+k*7,2),px=(a-.5)*54,py=(hash(y+k*5,x,5)-.5)*19;
   g.moveTo(px,py).lineTo(px+3+a*3,py-2-a*3)
    .stroke({width:1.5,color:b.light,alpha:.18+.19*a});
  }
 }
 if(code==='p'||code==='f'||code==='h'||code==='b'){
  // Only a fraction of paved tiles need mortar seams: continuous five-line
  // hatching made the capital look like a grid and hurt software WebGL.
  if(((x*7+y*3)&3)===0){
   const yy=(v-.5)*12;
   g.moveTo(-25,yy).lineTo(-1,yy-1).stroke({width:1,color:b.dark,alpha:.22});
   g.moveTo(9,yy+7).lineTo(29,yy+6).stroke({width:1,color:b.dark,alpha:.16});
  }
  if(code==='b'&&((x+y)&1)===0){
   g.moveTo(-12,-6).lineTo(-12,6).stroke({width:1.5,color:0x30291f,alpha:.34});
   g.moveTo(12,-6).lineTo(12,6).stroke({width:1.5,color:0x30291f,alpha:.34});
  }
 }
 if(code==='a'){
  for(let k=0;k<3;k++){
   const ox=hash(x,y,k+2)*52-26,oy=hash(y,x,k+4)*18-9;
   g.moveTo(ox-8,oy).quadraticCurveTo(ox,oy-3,ox+9,oy)
    .stroke({width:1.5,color:b.light,alpha:.25});
  }
  if(biome==='swamp'&&v>.44){
   for(let i=0;i<3;i++){
    const ox=-17+i*13+shift*.2;
    g.moveTo(ox,6).quadraticCurveTo(ox+4,-10,ox+6,-14-i*3)
     .stroke({width:2,color:0x73915b,alpha:.9});
    g.ellipse(ox+6,-16-i*3,2,6).fill(0x4b6441);
   }
  }
 }
 if(code==='l'){
  g.poly([-31,4,-13,-7,3,3,19,-7,31,-1]).stroke({width:3.5,color:0xffb360,alpha:.62});
  g.moveTo(-19,9).lineTo(-6,3).lineTo(9,11).stroke({width:2,color:0xffd17e,alpha:.48});
 }
 if(code==='t'){
  const snow=biome==='snow'||cityStyle==='alpine';
  const shadow=biome==='shadow';
  if(snow||shadow){
   const col=snow?0x426b68:0x3d3558, tip=snow?0xb2d5d2:0x7773a3;
   g.rect(-5,-19,10,25).fill(0x56463a);
   for(let k=0;k<3;k++){
    const top=-66+k*16,half=13+k*8;
    g.poly([-half,top+20,0,top-12,half,top+20]).fill(k%2?col:tip);
   }
   if(snow)g.poly([-11,-37,0,-58,11,-37]).fill({color:0xe7eef1,alpha:.68});
  }else if(biome==='swamp'){
   g.rect(-5,-34,10,40).fill(0x4b4838);
   g.ellipse(0,-42,27,15).fill(b.foliage);
   g.ellipse(13,-47,19,18).fill({color:b.light,alpha:.35});
   for(let i=-2;i<=2;i++)g.moveTo(i*10,-42).quadraticCurveTo(i*11+7,-23,i*10+5,-12)
     .stroke({width:2,color:0x869b65,alpha:.5});
  }else{
   g.rect(-5,-30,10,36).fill(0x64472d);
   g.ellipse(-8,-43,23,17).fill(b.dark);
   g.ellipse(12,-48,24,22).fill(b.foliage);
   g.ellipse(-2,-60,22,16).fill({color:b.light,alpha:.45});
   if(v>.7)g.circle(12,-49,3).fill(b.detail);
  }
 }
 if(code==='u'){
  g.ellipse(-6,-10,19,10).fill(b.foliage);
  g.ellipse(7,-11,16,12).fill(b.dark);
  if(biome==='swamp'){
   for(let i=0;i<3;i++)g.ellipse(-11+i*10,-21,5,7).fill(i%2?0x9ea66a:0xad7561);
  }else if(v>.6)for(let i=0;i<3;i++)g.circle(-9+i*8,-15-(i%2)*6,2).fill(b.detail);
 }
 if(code==='r'||code==='o'){
  const crystal=cityStyle==='crystal'||cityStyle==='geode';
  if(crystal){
   g.poly([-19,3,-9,-27,3,-42,12,-18,18,5]).fill(0x568fa9).stroke({width:2,color:0x9fe7e7,alpha:.66});
   g.poly([-9,-27,3,-42,5,-4,-9,3]).fill({color:0xb1dbff,alpha:.45});
  }else{
   g.poly([-21,4,-14,-17,0,-23,18,-10,22,3]).fill(b.dark);
   g.poly([-14,-17,0,-23,18,-10,0,-5]).fill({color:b.light,alpha:.42});
  }
 }
 if(code==='w'){
  for(let i=-2;i<=2;i++){
   const xx=i*19+(v-.5)*3;
   g.moveTo(xx,-6).lineTo(xx+4,-18).stroke({width:1,color:b.dark,alpha:.42});
  }
 }
 if(code==='s'&&v>.53){
  g.ellipse(-13+shift*.3,4,14,3).fill({color:b.light,alpha:.5});
  g.circle(-3+shift*.3,2,2).fill({color:0xffffff,alpha:.4});
 }
 if(code==='d'){
  g.moveTo(-28,8).quadraticCurveTo(0,1,30,8).stroke({width:2,color:b.light,alpha:.42});
  g.moveTo(-17,-2).quadraticCurveTo(4,-7,21,-1).stroke({width:1.5,color:b.dark,alpha:.25});
 }
}
