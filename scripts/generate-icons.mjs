import sharp from 'sharp';
import {readFile,mkdir} from 'node:fs/promises';
const svg=await readFile(new URL('../icon.svg',import.meta.url));
await mkdir(new URL('../icons/',import.meta.url),{recursive:true});
for(const size of [192,512])await sharp(svg).resize(size,size).png().toFile(new URL(`../icons/icon-${size}.png`,import.meta.url).pathname);
await sharp(svg).resize(410,410).extend({top:51,bottom:51,left:51,right:51,background:'#081d30'}).png().toFile(new URL('../icons/icon-maskable-512.png',import.meta.url).pathname);
console.log('Ícones PWA gerados.');
