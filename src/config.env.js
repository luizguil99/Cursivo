const config = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL,
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS),
  },
  storage: {
    minio: {
      endPoint: process.env.MINIO_ENDPOINT,
      port: parseInt(process.env.MINIO_PORT),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY,
      secretKey: process.env.MINIO_SECRET_KEY,
      bucket: process.env.MINIO_BUCKET,
      region: process.env.MINIO_REGION,
    },
    paths: {
      chatImages: process.env.STORAGE_PATH_CHAT_IMAGES,
    },
  },
};

export default config;
