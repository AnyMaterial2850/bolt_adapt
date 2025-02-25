/// <reference types="vite/client" />

interface ServiceWorkerGlobalScope {
    __WB_MANIFEST: Array<{
      revision: string | null;
      url: string;
    }>;
  }