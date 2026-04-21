/**
 * agency router
 */

import { factories } from '@strapi/strapi';

const coreRouter = factories.createCoreRouter('api::agency.agency');

export default {
  get routes() {
    const coreRoutes = typeof coreRouter.routes === 'function' ? coreRouter.routes() : coreRouter.routes;
    
    return [
      {
        method: 'POST',
        path: '/agencies/:id/staff',
        handler: 'api::agency.agency.addStaff',
        config: {
          policies: [],
          middlewares: [],
        },
      },
      {
        method: 'POST',
        path: '/agencies/:id/recharge',
        handler: 'api::agency.agency.recharge',
        config: {
          policies: [],
          middlewares: [],
        },
      },
      ...coreRoutes,
    ];
  },
};
