import { factories } from '@strapi/strapi';

const defaultRouter = factories.createCoreRouter('api::tombstone.tombstone');

const customRoutes = [
  {
    method: 'GET' as const,
    path: '/memorial/:slug',
    handler: 'tombstone.findMemorialBySlug',
    config: {
      auth: false,
      policies: [] as string[],
    },
  },
  {
    method: 'GET' as const,
    path: '/feed',
    handler: 'tombstone.getFeed',
    config: {
      auth: false,
      policies: [] as string[],
    },
  },
  {
    method: 'POST' as const,
    path: '/memorial/:slug/contribute',
    handler: 'tombstone.createContribution',
    config: {
      auth: false,
      policies: [] as string[],
    },
  },
];

// Cast to any to bypass Strapi v5 RouterConfig type issue
// defaultRouter.routes can be Route[] | (() => Route[])
export default {
  routes: [
    ...(defaultRouter as any).routes || [],
    ...customRoutes,
  ],
} as any;
