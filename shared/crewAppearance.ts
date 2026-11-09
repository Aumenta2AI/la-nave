import {crewCatalog} from './crewCatalog.ts';
// Explicit art direction for the fictional characters in the supplied catalogue.
// Unknown/custom identities retain the appearance chosen by the user.
const feminineNames=new Set(['Catalina Ospina','Juliana Vélez','Daniela Pineda','Carolina Zapata','Natalia Arboleda','Paola Duque','Marcela Rincón','Andrea Osorio','Lucía Pardo','Valeria Álvarez','Gabriela Moreno','Mariana Bustamante','Sara Medina','Mónica Salcedo','Lorena Franco','María José Rivera','Isabella Márquez','Laura Castaño','Sofía Lozano','Fernanda Salazar','Patricia Valencia','Alejandra Ríos','Adriana Benítez','Natalia Mejía','Viviana Correa','Sandra Pulido','Diana Murillo','Carolina Londoño','Valentina Giraldo','Claudia Montoya','Paola Restrepo','Diana Carolina Vélez','Tatiana Molina','Camila Arango','Marcela Gil','Luciana Herrera','Valeria Aguirre']);
const models=['administrativo','legal','diseno','soporte','contabilidad','marketing'];
export const catalogAppearance=Object.fromEntries(crewCatalog.filter(a=>a.number>=5).flatMap(a=>a.agents.map((person,index)=>{
 const feminine=feminineNames.has(person.name);
 const pool=feminine?['administrativo','diseno','contabilidad']:['legal','soporte','marketing'];
 return [person.name,{presentation:feminine?'feminine':'masculine',model:pool[(a.number+index)%pool.length]}];
})));
export function crewAreaModel(person:{name?:string;appearance?:string;leaderId?:string}|undefined,departmentModel='administrativo'){
 if(!person?.leaderId)return departmentModel;
 const configured=person.name?catalogAppearance[person.name]:undefined;
 return configured?.model||(models.includes(person.appearance||'')?person.appearance!:'administrativo');
}
