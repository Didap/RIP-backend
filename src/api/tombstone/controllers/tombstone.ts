import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::tombstone.tombstone', ({ strapi }) => ({
  async update(ctx) {
    console.log('--- UPDATE REQUEST ---');
    console.log('Body:', ctx.request.body);
    console.log('Files:', ctx.request.files);
    return await super.update(ctx);
  },
  async create(ctx) {
    console.log('--- CREATE REQUEST ---');
    console.log('Body:', ctx.request.body);
    console.log('Files:', ctx.request.files);
    return await super.create(ctx);
  },

  async findOneBySlug(ctx) {
    const { slug } = ctx.params;
    console.log(`📡 [CONTROLLER] Incoming request for slug: "${slug}"`);
    
    try {
      const service = strapi.service('api::tombstone.tombstone') as any;
      const tombstone = await service.findOneBySlug(slug);
      
      if (!tombstone) {
        console.log(`⚠️  [CONTROLLER] Service returned null for slug: "${slug}"`);
        return ctx.notFound('Tombstone non trovato');
      }
      
      console.log(`✨ [CONTROLLER] Successfully found tombstone: ${tombstone.full_name}`);
      return ctx.send({ data: tombstone });
    } catch (err: any) {
      console.error(`💥 [CONTROLLER] ERROR searching for slug "${slug}":`, err.message);
      return ctx.internalServerError(`Errore durante la ricerca: ${err.message}`);
    }
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
    const { content_type, text_content } = ctx.request.body as any;
    const service = strapi.service('api::tombstone.tombstone') as any;
    const result = await service.createContribution(slug, content_type, text_content);

    if (!result) {
      return ctx.notFound('Memoriale non trovato');
    }
    if (result.error) {
      return ctx.badRequest(result.error);
    }
    return ctx.send(result, 201);
  },
}));
