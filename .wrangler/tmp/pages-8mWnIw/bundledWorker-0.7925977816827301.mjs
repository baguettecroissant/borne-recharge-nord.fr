var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// _worker.js/index.js
import { renderers } from "./renderers.mjs";
import { c as createExports, s as serverEntrypointModule } from "./chunks/_@astrojs-ssr-adapter_DExORc0l.mjs";
import { manifest } from "./manifest_CPYjyN0w.mjs";
globalThis.process ??= {};
globalThis.process.env ??= {};
var serverIslandMap = /* @__PURE__ */ new Map();
var _page0 = /* @__PURE__ */ __name(() => import("./pages/_image.astro.mjs"), "_page0");
var _page1 = /* @__PURE__ */ __name(() => import("./pages/aides-advenir.astro.mjs"), "_page1");
var _page2 = /* @__PURE__ */ __name(() => import("./pages/api/lead.astro.mjs"), "_page2");
var _page3 = /* @__PURE__ */ __name(() => import("./pages/communes.astro.mjs"), "_page3");
var _page4 = /* @__PURE__ */ __name(() => import("./pages/confirmation.astro.mjs"), "_page4");
var _page5 = /* @__PURE__ */ __name(() => import("./pages/devis.astro.mjs"), "_page5");
var _page6 = /* @__PURE__ */ __name(() => import("./pages/guide-installation.astro.mjs"), "_page6");
var _page7 = /* @__PURE__ */ __name(() => import("./pages/guides/_slug_.astro.mjs"), "_page7");
var _page8 = /* @__PURE__ */ __name(() => import("./pages/guides.astro.mjs"), "_page8");
var _page9 = /* @__PURE__ */ __name(() => import("./pages/mentions-legales.astro.mjs"), "_page9");
var _page10 = /* @__PURE__ */ __name(() => import("./pages/politique-confidentialite.astro.mjs"), "_page10");
var _page11 = /* @__PURE__ */ __name(() => import("./pages/tarifs.astro.mjs"), "_page11");
var _page12 = /* @__PURE__ */ __name(() => import("./pages/borne-recharge-copropriete-_commune_.astro.mjs"), "_page12");
var _page13 = /* @__PURE__ */ __name(() => import("./pages/installateur-borne-recharge-_commune_.astro.mjs"), "_page13");
var _page14 = /* @__PURE__ */ __name(() => import("./pages/wallbox-_commune_.astro.mjs"), "_page14");
var _page15 = /* @__PURE__ */ __name(() => import("./pages/index.astro.mjs"), "_page15");
var pageMap = /* @__PURE__ */ new Map([
  ["node_modules/@astrojs/cloudflare/dist/entrypoints/image-endpoint.js", _page0],
  ["src/pages/aides-advenir.astro", _page1],
  ["src/pages/api/lead.ts", _page2],
  ["src/pages/communes.astro", _page3],
  ["src/pages/confirmation.astro", _page4],
  ["src/pages/devis.astro", _page5],
  ["src/pages/guide-installation.astro", _page6],
  ["src/pages/guides/[slug].astro", _page7],
  ["src/pages/guides/index.astro", _page8],
  ["src/pages/mentions-legales.astro", _page9],
  ["src/pages/politique-confidentialite.astro", _page10],
  ["src/pages/tarifs.astro", _page11],
  ["src/pages/borne-recharge-copropriete-[commune].astro", _page12],
  ["src/pages/installateur-borne-recharge-[commune].astro", _page13],
  ["src/pages/wallbox-[commune].astro", _page14],
  ["src/pages/index.astro", _page15]
]);
var _manifest = Object.assign(manifest, {
  pageMap,
  serverIslandMap,
  renderers,
  actions: /* @__PURE__ */ __name(() => import("./noop-entrypoint.mjs"), "actions"),
  middleware: /* @__PURE__ */ __name(() => import("./_astro-internal_middleware.mjs"), "middleware")
});
var _args = void 0;
var _exports = createExports(_manifest);
var __astrojsSsrVirtualEntry = _exports.default;
var _start = "start";
if (Object.prototype.hasOwnProperty.call(serverEntrypointModule, _start)) {
  serverEntrypointModule[_start](_manifest, _args);
}
export {
  __astrojsSsrVirtualEntry as default,
  pageMap
};
//# sourceMappingURL=bundledWorker-0.7925977816827301.mjs.map
