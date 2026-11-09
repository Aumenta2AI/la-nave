import 'dotenv/config';
import {loadProtectedCredentials} from '../server/credentialVault.ts';
loadProtectedCredentials();
const {providerStatus}=await import('../server/providers.ts');
const {paymentStatus}=await import('../server/paymentConnections.ts');
console.log(JSON.stringify({providers:providerStatus().map(p=>({id:p.id,mode:p.mode,configured:p.configured,apiConfigured:p.apiConfigured,modelSelected:!!p.selectedModel})),payments:paymentStatus().map(p=>({id:p.id,configured:p.configured,mode:p.mode})),googleLogin:!!process.env.GOOGLE_LOGIN_CLIENT_ID&&!!process.env.GOOGLE_LOGIN_CLIENT_SECRET,composioAuthConfig:!!process.env.COMPOSIO_AUTH_CONFIG_ID},null,2));
