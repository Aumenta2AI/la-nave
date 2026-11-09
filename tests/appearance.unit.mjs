import {test} from 'node:test';
import assert from 'node:assert/strict';
import {catalogAppearance,crewAreaModel} from '../shared/crewAppearance.ts';
test('Los 72 personajes usan una base compatible con su diseño y conservan identidades personalizadas',()=>{
 assert.equal(Object.keys(catalogAppearance).length,72);
 for(const [name,look] of Object.entries(catalogAppearance)){
 const allowed=look.presentation==='feminine'?['administrativo','diseno','contabilidad']:['legal','soporte','marketing'];
 assert.ok(allowed.includes(crewAreaModel({name,leaderId:'legal',appearance:'legal'})),name);
 }
 assert.equal(crewAreaModel({name:'Catalina Ospina',leaderId:'administrativo'}),catalogAppearance['Catalina Ospina'].model);
 assert.equal(crewAreaModel({name:'Mi personaje',leaderId:'legal',appearance:'diseno'}),'diseno');
 assert.equal(crewAreaModel({name:'Dirección'},'legal'),'legal');
});
