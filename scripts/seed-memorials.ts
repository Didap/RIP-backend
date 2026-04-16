
export const seedMemorials = async (strapi) => {
  const users = await strapi.entityService.findMany('plugin::users-permissions.user', { limit: 1 });
  const agencies = await strapi.entityService.findMany('api::agency.agency', { limit: 1 });

  if (users.length === 0 || agencies.length === 0) {
    console.log('--- SEED: Missing user or agency, skipping memorial seed ---');
    return;
  }

  const userId = users[0].id;
  const agencyId = agencies[0].id;

  const memorials = [
    {
      full_name: 'Elena Fabbri',
      slogan: 'Sempre con noi, nel riflesso di una vita radiosa',
      biography: 'Elena è stata una luce per tutti coloro che l\'hanno conosciuta. La sua passione per l\'arte e la sua gentilezza rimarranno per sempre nei nostri ricordi.',
      template: 'elegant',
      dates: { birth: '1960-05-12', death: '2023-11-20' },
      agency: agencyId,
      lifecycle_status: 'published',
      slug: 'elena-fabbri-seed'
    },
    {
      full_name: 'Giovanni Rossi',
      slogan: 'Un uomo giusto, forte come il marmo che lo ricorda',
      biography: 'Giovanni ha dedicato la sua vita alla famiglia e al lavoro. Un pilastro della nostra comunità che non verrà mai dimenticato.',
      template: 'classic',
      dates: { birth: '1945-02-18', death: '2024-01-05' },
      agency: agencyId,
      lifecycle_status: 'published',
      slug: 'giovanni-rossi-seed'
    },
    {
      full_name: 'Marco Bianchi',
      slogan: 'Vivi, ridi, ama.',
      biography: 'Marco amava la natura e i viaggi. Il suo spirito libero continua a correre tra i sentieri che tanto amava.',
      template: 'modern',
      dates: { birth: '1985-08-30', death: '2024-03-15' },
      agency: agencyId,
      lifecycle_status: 'published',
      slug: 'marco-bianchi-seed'
    }
  ];

  for (const m of memorials) {
    const existing = await strapi.entityService.findMany('api::tombstone.tombstone', {
      filters: { slug: m.slug }
    });

    if (existing.length === 0) {
      console.log(`--- SEED: Creating memorial ${m.full_name} ---`);
      const created = await strapi.entityService.create('api::tombstone.tombstone', {
        data: m
      });
      
      // Assign owner permission
      await strapi.entityService.create('api::tombstone-permission.tombstone-permission', {
        data: {
          user: userId,
          tombstone: created.id,
          access_level: 'owner',
        }
      });
    }
  }
};
