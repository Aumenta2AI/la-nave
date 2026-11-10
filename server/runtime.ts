import 'dotenv/config';

export const hosted = process.env.NAVE_HOSTED === '1';
export function publicOrigin() {
  const value = process.env.PUBLIC_ORIGIN || '';
  if (!hosted) return '';
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash)
    throw Error('PUBLIC_ORIGIN debe ser un origen HTTPS sin ruta ni credenciales.');
  return url.origin;
}
export function validateRuntime() {
  if (!hosted) return;
  publicOrigin();
  if (process.env.PULPO_TEST_MODE === '1') throw Error('El modo de pruebas no puede publicarse.');
  if (!process.env.DATA_DIR) throw Error('Configura DATA_DIR sobre un volumen persistente.');
  if (!/^[a-f0-9]{64}$/i.test(process.env.NAVE_VAULT_KEY || ''))
    throw Error('NAVE_VAULT_KEY debe contener 32 bytes aleatorios en hexadecimal.');
  if ((process.env.NAVE_SETUP_TOKEN || '').length < 32)
    throw Error('Configura NAVE_SETUP_TOKEN con al menos 32 caracteres aleatorios.');
}
validateRuntime();
