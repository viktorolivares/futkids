/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_ACADEMY_ENV: string;
  readonly VITE_DEFAULT_ACADEMY_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
