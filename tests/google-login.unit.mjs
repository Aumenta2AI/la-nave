import {test,after} from 'node:test';import assert from 'node:assert/strict';import {mkdtempSync,mkdirSync} from 'node:fs';import path from 'node:path';
mkdirSync('.test-data',{recursive:true});process.env.DATA_DIR=mkdtempSync(path.resolve('.test-data/google-login-'));
const {resolveGoogleUser}=await import('../server/googleLogin.ts');const {put,get,db}=await import('../server/store.ts');after(()=>db.close());
test('Registro Google queda pendiente, sin administrador ni acceso automático',()=>{
 const u=resolveGoogleUser({sub:'google-test',email:'new@example.com',email_verified:true});assert.equal(u.disabled,true);assert.equal(u.role,'reader');assert.equal(u.platformAdmin,undefined);assert.equal(resolveGoogleUser({sub:'google-test',email:'new@example.com',email_verified:true}).id,u.id);
 assert.throws(()=>resolveGoogleUser({sub:'bad',email:'bad@example.com',email_verified:false}));
});
test('No vincula por correo sin sesión local y conserva el rol al vincular explícitamente',()=>{
 put('users',{id:'owner',username:'owner@example.com',role:'admin',platformAdmin:true});
 const profile={sub:'google-owner',email:'owner@example.com',email_verified:true};
 assert.throws(()=>resolveGoogleUser(profile),/contraseña/);
 assert.throws(()=>resolveGoogleUser(profile,'other'));
 const linked=resolveGoogleUser(profile,'owner');assert.equal(linked.role,'admin');assert.equal(linked.platformAdmin,true);assert.equal(get('users','owner').googleSub,'google-owner');
});
