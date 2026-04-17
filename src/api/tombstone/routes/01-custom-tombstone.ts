export default {
  type: 'content-api' as const,
  routes: [
    {
      method: 'GET' as const,
      path: '/tombstones/tombstone/:slug',
      handler: 'tombstone.findOneBySlug',
      config: {
        auth: false,
        policies: [] as string[],
      },
    },
    {
      method: 'GET' as const,
      path: '/tombstones/feed',
      handler: 'tombstone.getFeed',
      config: {
        auth: false,
        policies: [] as string[],
      },
    },
    {
      method: 'POST' as const,
      path: '/tombstones/tombstone/:slug/contribute',
      handler: 'tombstone.createContribution',
      config: {
        auth: false,
        policies: [] as string[],
      },
    },
  ],
};
