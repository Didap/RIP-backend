import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::tombstone.tombstone', ({ strapi }) => ({
  async findOneBySlug(slug: string) {
    console.log(`🔍 [SERVICE] Searching for tombstone with slug: "${slug}"`);
    
    // Check total count just to see if DB has data
    const totalCount = await strapi.entityService.count('api::tombstone.tombstone');
    console.log(`📊 [SERVICE] Total tombstones in DB: ${totalCount}`);

    const results = await strapi.entityService.findMany('api::tombstone.tombstone', {
      filters: { slug, lifecycle_status: 'published' },
      populate: {
        profile_image: { fields: ['url', 'alternativeText', 'width', 'height'] },
        cover_image: { fields: ['url', 'alternativeText', 'width', 'height'] },
        contributions: {
          filters: { is_approved: true },
          populate: {
            author: { fields: ['username', 'first_name', 'last_name'] },
            media: { fields: ['url', 'alternativeText'] },
          },
        },
        connections: {
          populate: {
            user: { fields: ['username', 'first_name', 'last_name'] },
          },
        },
      },
    });

    console.log(`📦 [SERVICE] Query returned ${results?.length || 0} results for slug "${slug}"`);
    
    if (!results || results.length === 0) {
      console.log(`❌ [SERVICE] No results found for slug: "${slug}" with lifecycle_status: "published"`);
      return null;
    }
    
    const m = results[0] as any;
    console.log(`✅ [SERVICE] Tombstone found: ${m.full_name} (ID: ${m.id})`);
    const contributions = m.contributions || [];
    const flowers = contributions.filter((c: any) => c.content_type === 'flower').length;
    const candles = contributions.filter((c: any) => c.content_type === 'candle').length;

    return {
      id: m.documentId || m.id,
      full_name: m.full_name,
      slogan: m.slogan || null,
      biography: m.biography || null,
      dates: m.dates || null,
      template: m.template || 'classic',
      slug: m.slug,
      profile_image: m.profile_image || null,
      cover_image: m.cover_image || null,
      connections: m.connections || [],
      contributions,
      stats: {
        total: contributions.length,
        flowers,
        candles,
        memories: contributions.length - flowers - candles,
      },
      createdAt: m.createdAt,
    };
  },

  async getFeed(page: number, pageSize: number) {
    const start = (page - 1) * pageSize;

    const [memorials, contributions] = await Promise.all([
      strapi.entityService.findMany('api::tombstone.tombstone', {
        filters: { lifecycle_status: 'published' },
        populate: {
          profile_image: { fields: ['url', 'alternativeText'] },
        },
        sort: 'createdAt:desc',
        start,
        limit: pageSize,
      }),
      strapi.entityService.findMany('api::contribution.contribution', {
        filters: {
          is_approved: true,
          content_type: { $in: ['text', 'flower', 'candle', 'photo'] },
        },
        populate: {
          tombstone: {
            fields: ['full_name', 'slug', 'template'],
            populate: { profile_image: { fields: ['url', 'alternativeText'] } },
          },
          author: { fields: ['username', 'first_name', 'last_name'] },
        },
        sort: 'createdAt:desc',
        start: 0,
        limit: pageSize,
      }),
    ]);

    const feedItems = [
      ...memorials.map((m: any) => ({
        id: `m-${m.documentId || m.id}`,
        type: 'memorial' as const,
        full_name: m.full_name,
        slug: m.slug,
        slogan: m.slogan,
        template: m.template,
        profile_image: m.profile_image || null,
        dates: m.dates || null,
        timestamp: m.createdAt,
      })),
      ...contributions.map((c: any) => ({
        id: `c-${c.documentId || c.id}`,
        type: 'contribution' as const,
        content_type: c.content_type,
        text_content: c.text_content || null,
        author: c.author || null,
        tombstone: c.tombstone
          ? {
              full_name: c.tombstone.full_name,
              slug: c.tombstone.slug,
              template: c.tombstone.template,
              profile_image: c.tombstone.profile_image || null,
            }
          : null,
        timestamp: c.createdAt,
      })),
    ];

    feedItems.sort(
      (a: any, b: any) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return {
      data: feedItems.slice(0, pageSize),
      meta: { page, pageSize, total: feedItems.length },
    };
  },

  async createContribution(
    slug: string,
    content_type: string,
    text_content?: string
  ) {
    const validTypes = ['flower', 'candle', 'text', 'photo'];
    if (!content_type || !validTypes.includes(content_type)) {
      return { error: 'content_type non valido' };
    }

    const memorials = await strapi.entityService.findMany(
      'api::tombstone.tombstone',
      {
        filters: { slug, lifecycle_status: 'published' },
      }
    );

    if (!memorials || memorials.length === 0) {
      return null;
    }

    const contribution = await strapi.entityService.create(
      'api::contribution.contribution',
      {
        data: {
          tombstone: memorials[0].documentId || memorials[0].id,
          content_type: content_type as 'photo' | 'video' | 'audio' | 'text' | 'flower' | 'candle',
          text_content: text_content || null,
          is_approved: false,
        },
      }
    );

    return { data: contribution };
  },
}));
