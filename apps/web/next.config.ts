import { withReticle } from '@reticlehq/next';
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // TypeScript 7 ships no JS API, so the bare `typescript` package is the
  // @typescript/typescript6 compat shim (TS 6.0.2 API). Next 16 defaults to
  // `useTypeScriptCli` for the native tsc, but the shim only exposes the API —
  // use the API path so tsconfig paths/type-checking resolve through it.
  experimental: {
    useTypeScriptCli: false,
  },
};

export default withReticle(nextConfig);
