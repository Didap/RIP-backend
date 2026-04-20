
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
      city: 'Bologna',
      type: 'persona',
      funeral_home: 'Agenzia Funebre S.r.l.',
      agency: agencyId,
      lifecycle_status: 'published',
      slug: 'elena-fabbri-seed',
      connections: [
        { relation_type: 'Coniuge', user: userId },
        { relation_type: 'Figlio/a', user: userId },
      ],
    },
    {
      full_name: 'Giovanni Rossi',
      slogan: 'Un uomo giusto, forte come il marmo che lo ricorda',
      biography: 'Giovanni ha dedicato la sua vita alla famiglia e al lavoro. Un pilastro della nostra comunità che non verrà mai dimenticato.',
      template: 'classic',
      dates: { birth: '1945-02-18', death: '2024-01-05' },
      city: 'Roma',
      type: 'persona',
      funeral_home: 'Onoranze Funebri Roma Centro',
      agency: agencyId,
      lifecycle_status: 'published',
      slug: 'giovanni-rossi-seed',
      connections: [
        { relation_type: 'Fratello/Sorella', user: userId },
      ],
    },
    {
      full_name: 'Marco Bianchi',
      slogan: 'Vivi, ridi, ama.',
      biography: 'Marco amava la natura e i viaggi. Il suo spirito libero continua a correre tra i sentieri che tanto amava.',
      template: 'classic',
      dates: { birth: '1985-08-30', death: '2024-03-15' },
      city: 'Milano',
      type: 'persona',
      funeral_home: 'Ferraris & Fumagalli',
      agency: agencyId,
      lifecycle_status: 'published',
      slug: 'marco-bianchi-seed',
      connections: [
        { relation_type: 'Amico', user: userId },
      ],
    },
    {
      full_name: 'Margherita Conti',
      slogan: 'Maestra di vita',
      biography: 'Maestra elementare per quarant\'anni. Amava il giardinaggio, il pane fatto in casa e le lunghe passeggiate in collina.',
      template: 'classic',
      dates: { birth: '1942-03-15', death: '2023-11-22' },
      city: 'Firenze',
      type: 'persona',
      funeral_home: 'Pompei Funebri',
      agency: agencyId,
      lifecycle_status: 'published',
      slug: 'margherita-conti-seed',
      connections: [],
    },
    {
      full_name: 'Luca Moretti',
      slogan: 'Il suo pesto era leggenda.',
      biography: 'Cuoco e ristoratore. Il suo ristorante sul mare era il rifugio di chi cercava autenticità.',
      template: 'elegant',
      dates: { birth: '1955-07-22', death: '2022-09-30' },
      city: 'Genova',
      type: 'persona',
      funeral_home: 'Funebri Genovesi',
      agency: agencyId,
      lifecycle_status: 'published',
      slug: 'luca-moretti-seed',
      connections: [],
    },
    {
      full_name: 'Sofia Colombo',
      slogan: 'La cura più importante era l\'ascolto.',
      biography: 'Pediatra amata da tutti i bambini del quartiere. Il suo ambulatorio era pieno di disegni e sorrisi.',
      template: 'classic',
      dates: { birth: '1960-04-12', death: '2024-02-18' },
      city: 'Torino',
      type: 'persona',
      funeral_home: 'Onoranze Funebri Torino',
      agency: agencyId,
      lifecycle_status: 'published',
      slug: 'sofia-colombo-seed',
      connections: [],
    },
    {
      full_name: 'Antonio Greco',
      slogan: 'Poeta del mare.',
      biography: 'Pescatore e poeta. Scriveva versi sulle barche e sul mare. La sua voce profonda raccontava storie di tempeste e albe serene.',
      template: 'elegant',
      dates: { birth: '1945-01-08', death: '2023-03-14' },
      city: 'Palermo',
      type: 'persona',
      funeral_home: 'Funebri Palermo',
      agency: agencyId,
      lifecycle_status: 'published',
      slug: 'antonio-greco-seed',
      connections: [],
    },
    {
      full_name: 'Argo',
      slogan: 'Il miglior amico di tutta la famiglia.',
      biography: 'Un cucciolo trovato sotto la pioggia che diventò il compagno fedele di tutti. Non ha mai lasciato il fianco di chi amava.',
      template: 'classic',
      dates: { birth: '2009-05-01', death: '2024-01-10' },
      city: 'Napoli',
      type: 'animale',
      animal_type: 'cane',
      agency: agencyId,
      lifecycle_status: 'published',
      slug: 'argo-seed',
      connections: [],
    },
    {
      full_name: 'Luna',
      slogan: 'Un angelo con quattro zampe.',
      biography: 'Una cagnolina bianca dal cuore enorme. Accompagnava la padrona in ogni passeggiata e accolse tre cuccioli con infinita dolcezza.',
      template: 'classic',
      dates: { birth: '2014-12-01', death: '2024-06-15' },
      city: 'Firenze',
      type: 'animale',
      animal_type: 'cane',
      agency: agencyId,
      lifecycle_status: 'published',
      slug: 'luna-seed',
      connections: [],
    },
    {
      full_name: 'Micio',
      slogan: 'Re del divano.',
      biography: 'Un gatto rosso adottato da un rifugio. Dormiva sulla tastiera del computer e faceva le fusa più forti del quartiere.',
      template: 'classic',
      dates: { birth: '2012-03-01', death: '2024-04-01' },
      city: 'Roma',
      type: 'animale',
      animal_type: 'gatto',
      agency: agencyId,
      lifecycle_status: 'published',
      slug: 'micio-seed',
      connections: [],
    },
  ];

  for (const m of memorials) {
    const existing = await strapi.entityService.findMany('api::tombstone.tombstone', {
      filters: { slug: m.slug }
    });

    if (existing.length === 0) {
      console.log(`--- SEED: Creating memorial ${m.full_name} (${m.type}) ---`);
      try {
        const created = await strapi.entityService.create('api::tombstone.tombstone', {
          data: m,
        });

        // Assign owner permission
        await strapi.entityService.create('api::tombstone-permission.tombstone-permission', {
          data: {
            user: userId,
            tombstone: created.id,
            access_level: 'owner',
          },
        });
        console.log(`--- SEED: ✅ ${m.full_name} created ---`);
      } catch (err: any) {
        console.error(`--- SEED: ❌ Error creating ${m.full_name}: ${err.message} ---`);
      }
    } else {
      console.log(`--- SEED: Skipping ${m.full_name} (already exists) ---`);
    }
  }
};
