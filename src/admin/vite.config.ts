import { mergeConfig, type UserConfig } from 'vite';

export default (config: UserConfig) => {
  return mergeConfig(config, {
    // We remove the heavy polyfills that were causing Buffer/fs errors
    // Strapi 5 should handle most things, and the previous errors were likely 
    // triggered by the broken schema.
    optimizeDeps: {
      include: ['@strapi/strapi/admin'],
    },
  });
};
