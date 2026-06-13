globalThis.process ??= {}; globalThis.process.env ??= {};
import './chunks/astro-designed-error-pages_BmDAFtRv.mjs';
import './chunks/astro/server_Cl2Cnp4d.mjs';
import { s as sequence } from './chunks/render-context_DcMd3Mlj.mjs';

const onRequest$1 = (context, next) => {
  if (context.isPrerendered) {
    context.locals.runtime ??= {
      env: process.env
    };
  }
  return next();
};

const onRequest = sequence(
	onRequest$1,
	
	
);

export { onRequest };
