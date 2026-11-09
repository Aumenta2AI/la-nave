import {test,after} from 'node:test';import assert from 'node:assert/strict';import {mkdirSync,mkdtempSync} from 'node:fs';import path from 'node:path';
mkdirSync('.test-data',{recursive:true});process.env.DATA_DIR=mkdtempSync(path.resolve('.test-data/payments-'));
const {db,put}=await import('../server/store.ts');const {savePayment,paymentStatus,checkPayment}=await import('../server/paymentConnections.ts');const {assignReferral,recordPayout,affiliateOverview}=await import('../server/affiliateOperations.ts');after(()=>db.close());
test('Payment credentials stay private, isolated by environment and checks never create charges',async()=>{
 savePayment('stripe',{mode:'test',credentials:{secretKey:'sk_test_fixture_only'}});
 assert.ok(!JSON.stringify(paymentStatus()).includes('sk_test_fixture_only'));
 const calls=[];const fake=async(url,options)=>{calls.push({url,options});return Response.json({object:'balance',livemode:false});};
 assert.equal((await checkPayment('stripe',fake)).check.ok,true);assert.equal(calls[0].url,'https://api.stripe.com/v1/balance');assert.equal(calls[0].options.method,undefined);
 savePayment('stripe',{mode:'live',credentials:{}});assert.equal(paymentStatus().find(p=>p.id==='stripe').configured,false);
 assert.throws(()=>savePayment('stripe',{mode:'live',credentials:{secretKey:'sk_test_fixture_only'}}));
 savePayment('stripe',{mode:'test',credentials:{},remove:['secretKey']});assert.equal(paymentStatus().find(p=>p.id==='stripe').configured,false);
});
test('Provider error bodies never expose credentials and PayPal uses sandbox OAuth',async()=>{
 savePayment('paypal',{mode:'test',credentials:{clientId:'fixture_client',clientSecret:'fixture_private'}});
 const success=await checkPayment('paypal',async(url,options)=>{assert.equal(url,'https://api-m.sandbox.paypal.com/v1/oauth2/token');assert.equal(options.body,'grant_type=client_credentials');return Response.json({access_token:'never_return_token'});});assert.equal(success.check.ok,true);assert.ok(!JSON.stringify(success).includes('never_return_token'));
 const failure=await checkPayment('paypal',async()=>new Response('fixture_private',{status:401}));assert.equal(failure.check.ok,false);assert.ok(!JSON.stringify(failure).includes('fixture_private'));
});
test('Referrals require approval, unique company and payout references; totals stay separated by currency',()=>{
 put('saas-affiliates',{id:'affiliate',name:'Test',status:'pending',commissionPercent:15});put('saas-companies',{id:'company'});
 assert.throws(()=>assignReferral({affiliateId:'affiliate',companyId:'company'}));put('saas-affiliates',{id:'affiliate',name:'Test',status:'approved',commissionPercent:15});assignReferral({affiliateId:'affiliate',companyId:'company'});assert.throws(()=>assignReferral({affiliateId:'affiliate',companyId:'company'}));
 const payout={affiliateId:'affiliate',currency:'COP',amountMinor:10000,reference:'external-001',paidAt:'2026-01-01T12:00:00Z'};recordPayout(payout,'owner');assert.throws(()=>recordPayout(payout,'owner'));recordPayout({...payout,currency:'USD',reference:'external-002'},'owner');assert.equal(affiliateOverview().totals.length,2);
});
