const config = {
  app: {
    name: import.meta.env.VITE_APP_NAME,
    url: import.meta.env.VITE_APP_URL,
  },
  openai: {
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    model: import.meta.env.VITE_OPENAI_MODEL,
    maxTokens: parseInt(import.meta.env.VITE_OPENAI_MAX_TOKENS),
  },
  storage: {
    minio: {
      endPoint: import.meta.env.VITE_MINIO_ENDPOINT,
      port: parseInt(import.meta.env.VITE_MINIO_PORT),
      useSSL: import.meta.env.VITE_MINIO_USE_SSL === 'true',
      accessKey: import.meta.env.VITE_MINIO_ACCESS_KEY,
      secretKey: import.meta.env.VITE_MINIO_SECRET_KEY,
      bucket: import.meta.env.VITE_MINIO_BUCKET,
      region: import.meta.env.VITE_MINIO_REGION,
    },
    paths: {
      chatImages: import.meta.env.VITE_STORAGE_PATH_CHAT_IMAGES,
    },
  },
};

export default config;
