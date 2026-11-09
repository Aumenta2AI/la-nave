import net from 'node:net';
import {createHash} from 'node:crypto';
import {realpathSync} from 'node:fs';
export async function acquireInstance(directory:string){
 const key=createHash('sha256').update(realpathSync(directory).toLowerCase()).digest('hex').slice(0,24);
 const endpoint=process.platform==='win32'?'\\\\.\\pipe\\la-nave-'+key:{host:'127.0.0.1',port:40000+parseInt(key.slice(0,4),16)%20000};
 const lock=net.createServer(socket=>socket.destroy());
 await new Promise<void>((resolve,reject)=>{lock.once('error',()=>reject(Error('Ya existe una instancia de La Nave usando estos datos, o no se pudo reservar el bloqueo. Cierra la instancia anterior antes de iniciar otra.')));lock.listen(endpoint as any,()=>resolve());});
 return lock;
}
