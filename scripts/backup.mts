import {backupDatabase} from '../server/backups.ts';
import {db} from '../server/store.ts';
try{console.log('Copia verificada: '+await backupDatabase());}finally{db.close();}
