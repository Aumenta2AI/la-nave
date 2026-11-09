import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdirSync,mkdtempSync} from 'node:fs';
import path from 'node:path';
mkdirSync('.test-data',{recursive:true});process.env.DATA_DIR=mkdtempSync(path.resolve('.test-data/analytics-'));
const {put,db}=await import('../server/store.ts');const {analytics}=await import('../server/analytics.ts');after(()=>db.close());
test('Analytics uses Bogota calendar boundaries, zero fills and excludes future records',()=>{
 const now=Date.parse('2026-10-25T18:00:00Z');
 put('messages',{id:'previous',createdAt:'2026-10-19T04:59:59Z'});
 put('messages',{id:'boundary',createdAt:'2026-10-19T05:00:00Z'});
 put('messages',{id:'future',createdAt:'2026-10-26T12:00:00Z'});
 put('messages',{id:'unknown'});
 const result=analytics('7',now);assert.equal(result.start,'2026-10-19');assert.equal(result.series.length,7);assert.equal(result.totals.messages,1);assert.equal(result.series[0].messages,1);assert.equal(result.series[1].messages,0);assert.equal(result.undated,1);
 assert.equal(analytics('30',now).series.length,30);
 put('jobs',{id:'old',createdAt:'2026-01-15T12:00:00Z',status:'done'});
 const history=analytics('all',now);assert.equal(history.monthly,true);assert.equal(history.series.length,10);assert.equal(history.totals.completed,1);
});
