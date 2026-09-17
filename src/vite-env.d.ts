/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL base da API. Em dev e "/api", repassado pelo proxy do Vite. */
  readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
