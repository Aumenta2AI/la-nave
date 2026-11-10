import {defineConfig} from 'vite';
import {readdirSync,copyFileSync,mkdirSync} from 'node:fs';
import path from 'node:path';
export default defineConfig({
 define:{__NAVE_DEMO__:JSON.stringify(process.env.NAVE_DEMO==='1')},
 plugins:[{name:'public-character-images',closeBundle(){
  mkdirSync('dist/assets',{recursive:true});
  for(const name of readdirSync('.'))if(/^[\w-]+\.png$/.test(name))copyFileSync(name,path.join('dist/assets',name));
 }}]
});
