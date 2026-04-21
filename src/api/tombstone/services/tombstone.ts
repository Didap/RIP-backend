import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::tombstone.tombstone', ({ strapi }) => ({
  async findOneBySlug(slug: string) {

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

    if (!results || results.length === 0) {
      return null;
    }

    const m = results[0] as any;
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
      contributions: (m.contributions || []).map((c: any) => ({
        ...c,
        author: c.is_anonymous ? null : c.author,
      })),
      contributions_raw: m.contributions || [], // Keep for internal use if needed
      stats: {
        total: contributions.length,
        flowers,
        candles,
        memories: contributions.length - flowers - candles,
      },
      city: m.city || null,
      type: m.type || 'persona',
      animal_type: m.animal_type || null,
      funeral_home: m.funeral_home || null,
      customization: m.customization || null,
      createdAt: m.createdAt,
    };
  },

  async getExploreList(type?: string, city?: string, search?: string) {
    const filters: any = { lifecycle_status: 'published' };
    if (type) filters.type = type;
    if (city) filters.city = city;

    const results = await strapi.entityService.findMany('api::tombstone.tombstone', {
      filters,
      populate: {
        profile_image: { fields: ['url', 'alternativeText', 'width', 'height'] },
        cover_image: { fields: ['url', 'alternativeText', 'width', 'height'] },
        contributions: { fields: ['content_type'] },
      },
      sort: 'createdAt:desc',
      limit: 100,
    });

    let items = (results || []).map((m: any) => {
      const contributions = m.contributions || [];
      const flowers = contributions.filter((c: any) => c.content_type === 'flower').length;
      const candles = contributions.filter((c: any) => c.content_type === 'candle').length;
      return {
        id: m.documentId || m.id,
        full_name: m.full_name,
        biography: m.biography || null,
        dates: m.dates || null,
        template: m.template || 'classic',
        slug: m.slug,
        profile_image: m.profile_image || null,
        cover_image: m.cover_image || null,
        connections: [],
        contributions: [],
        stats: {
          total: contributions.length,
          flowers,
          candles,
          memories: contributions.length - flowers - candles,
        },
        city: m.city || null,
        type: m.type || 'persona',
        animal_type: m.animal_type || null,
        funeral_home: m.funeral_home || null,
        createdAt: m.createdAt,
      };
    });

    if (search) {
      const q = search.toLowerCase();
      items = items.filter((m: any) =>
        m.full_name?.toLowerCase().includes(q) ||
        m.city?.toLowerCase().includes(q)
      );
    }

    return { data: items };
  },

  async getFeed(page: number, pageSize: number) {
    const contributionLimit = Math.floor(pageSize * 0.7);
    const memorialLimit = pageSize;
    const memorialStart = (page - 1) * memorialLimit;
    const contributionStart = (page - 1) * contributionLimit;

    const [memorials, contributions] = await Promise.all([
      strapi.entityService.findMany('api::tombstone.tombstone', {
        populate: {
          profile_image: { fields: ['url', 'alternativeText'] },
        },
        sort: 'createdAt:desc',
        start: memorialStart,
        limit: memorialLimit,
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
        start: contributionStart,
        limit: contributionLimit,
      }),
    ]);

    const memorialItems = (memorials || []).map((m: any) => ({
      id: `m-${m.documentId || m.id}`,
      type: 'memorial' as const,
      full_name: m.full_name,
      slug: m.slug,
      slogan: m.slogan,
      template: m.template,
      profile_image: m.profile_image || null,
      dates: m.dates || null,
      city: m.city || null,
      memorial_type: m.type || 'persona',
      animal_type: m.animal_type || null,
      timestamp: m.createdAt,
    }));

    const contributionItems = (contributions || []).map((c: any) => ({
      id: `c-${c.documentId || c.id}`,
      type: 'contribution' as const,
      content_type: c.content_type,
      text_content: c.text_content || null,
      author: c.is_anonymous ? null : (c.author || null),
      is_anonymous: !!c.is_anonymous,
      tombstone: c.tombstone
        ? {
            full_name: c.tombstone.full_name,
            slug: c.tombstone.slug,
            template: c.tombstone.template,
            profile_image: c.tombstone.profile_image || null,
          }
        : null,
      timestamp: c.createdAt,
    }));

    // Interleave: insert one memorial before every 3rd contribution
    const feedItems: any[] = [];
    let mi = 0;
    for (let ci = 0; ci < contributionItems.length; ci++) {
      // Insert a memorial at positions 0, 3, 6...
      if (ci % 3 === 0 && mi < memorialItems.length) {
        feedItems.push(memorialItems[mi++]);
      }
      feedItems.push(contributionItems[ci]);
    }
    // Append any remaining memorials that didn't fit between contributions
    while (mi < memorialItems.length) {
      feedItems.push(memorialItems[mi++]);
    }

    return {
      data: feedItems.slice(0, pageSize),
      meta: { page, pageSize, total: feedItems.length },
    };
  },

  async createContribution(
    slug: string,
    content_type: string,
    text_content?: string,
    event_date?: string,
    is_anonymous?: boolean,
    authorId?: string | number
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

    const memorial = memorials[0];
    const isAutoApproved = ['flower', 'candle'].includes(content_type);

    const contribution = await strapi.entityService.create(
      'api::contribution.contribution',
      {
        data: {
          tombstone: memorial.documentId || memorial.id,
          content_type: content_type as any,
          text_content: text_content || null,
          event_date: event_date || null,
          is_anonymous: !!is_anonymous,
          author: authorId || null,
          is_approved: isAutoApproved,
        },
      }
    );

    return { data: contribution };
  },
}));
