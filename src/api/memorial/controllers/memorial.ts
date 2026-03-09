import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::memorial.memorial', ({ strapi }) => ({
  async create(ctx) {
    // 1. Ensure user is authenticated
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized('Devi essere autenticato per scolpire un memoriale');
    }

    // 2. Extract data from body
    const { data } = ctx.request.body;
    if (!data) {
        return ctx.badRequest('Dati mancanti');
    }

    // 3. Create Memorial using Entity Service (Bypass standard controller validation)
    try {
      const entry = await strapi.entityService.create('api::memorial.memorial', {
        data: {
          ...data,
          owner: user.id,
          publishedAt: new Date(), // Auto-publish for now
        }
      });

      return entry;
    } catch (err: any) {
      console.error('--- MEMORIAL CREATE ERROR:', err.message);
      return ctx.badRequest(err.message);
    }
  },

  async update(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized('Devi essere autenticato per modificare un memoriale');
    }

    const { id } = ctx.params;
    const memorial = await strapi.entityService.findOne('api::memorial.memorial', id, {
      populate: ['owner']
    }) as any;

    if (!memorial) {
      return ctx.notFound('Memoriale non trovato');
    }

    // Check if the user is the owner
    if (memorial.owner?.id !== user.id) {
      return ctx.forbidden('Non sei il proprietario di questo memoriale');
    }

    // Prevent changing the owner even if passed in data
    if (ctx.request.body.data) {
      delete ctx.request.body.data.owner;
    }

    return await super.update(ctx);
  }
}));
