module.exports = ({ env }) => ({
  'open-ai-embeddings': {
    enabled: true,
    resolve: './src/plugins/open-ai-embeddings',
    config: {
      openAIApiKey: env('OPEN_AI_KEY'),
      dbPrivateKey: env('SUPABASE_PRIVATE_KEY'),
      dbUrl: env('SUPABASE_URL'),
    },
  },
});
