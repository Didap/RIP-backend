import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::tombstone.tombstone', ({ strapi }) => ({
  async update(ctx) {
    return await super.update(ctx);
  },
  async create(ctx) {
    const { data } = (ctx.request as any).body;
    
    if (data && data.agency) {
      const agencyId = data.agency;
      const agency = await strapi.entityService.findOne('api::agency.agency', agencyId);
      
      if (!agency) {
        return ctx.badRequest('Agenzia non valida');
      }
      
      const COST = 100;
      const currentCredits = agency.credits || 0;
      
      if (currentCredits < COST) {
        return ctx.forbidden('Crediti insufficienti. Ricarica il tuo saldo per poter generare un nuovo memoriale.');
      }
      
      // deduct credits
      await strapi.entityService.update('api::agency.agency', agencyId, {
        data: { credits: currentCredits - COST }
      });
      
      // create the tombstone using core functionality
      const result = await super.create(ctx);
      const newId = result?.data?.id || 'Unknown';
      
      // log transaction
      await strapi.entityService.create('api::credit-transaction.credit-transaction', {
        data: {
          amount: -COST,
          type: 'generation',
          description: `Generazione Memoriale #${newId}`,
          agency: agencyId
        }
      });
      
      return result;
    }
    
    return await super.create(ctx);
  },

  async findOneBySlug(ctx) {
    const { slug } = ctx.params;
    try {
      const service = strapi.service('api::tombstone.tombstone') as any;
      const tombstone = await service.findOneBySlug(slug);
      if (!tombstone) {
        return ctx.notFound('Tombstone non trovato');
      }
      return ctx.send({ data: tombstone });
    } catch (err: any) {
      return ctx.internalServerError(`Errore durante la ricerca: ${err.message}`);
    }
  },

  async getExploreList(ctx) {
    const queryType = ctx.query.type as string | undefined;
    const queryCity = ctx.query.city as string | undefined;
    const querySearch = ctx.query.search as string | undefined;
    const service = strapi.service('api::tombstone.tombstone') as any;
    const result = await service.getExploreList(queryType, queryCity, querySearch);
    return ctx.send(result);
  },

  async getFeed(ctx) {
    const queryPage = ctx.query.page as string | undefined;
    const queryPageSize = ctx.query.pageSize as string | undefined;
    const page = parseInt(queryPage || '1');
    const pageSize = Math.min(parseInt(queryPageSize || '20'), 50);
    const service = strapi.service('api::tombstone.tombstone') as any;
    const result = await service.getFeed(page, pageSize);
    return ctx.send(result);
  },

  async createContribution(ctx) {
    const { slug } = ctx.params;
    const { content_type, text_content, event_date, is_anonymous } = ctx.request.body as any;
    const user = ctx.state.user;
    const authorId = user ? (user.documentId || user.id) : null;
    const service = strapi.service('api::tombstone.tombstone') as any;

    const result = await service.createContribution(slug, content_type, text_content, event_date, is_anonymous, authorId);

    if (!result) {
      return ctx.notFound('Memoriale non trovato');
    }
    if (result.error) {
      return ctx.badRequest(result.error);
    }
    return ctx.send(result, 201);
  },
}));
