module.exports = async ({ strapi }) => {
  const count = await strapi.entityService.count('api::tombstone.tombstone');
  console.log(`--- DB CHECK: ${count} memorials found ---`);
  
  if (count > 0) {
    const all = await strapi.entityService.findMany('api::tombstone.tombstone', {
      fields: ['full_name', 'slug', 'lifecycle_status']
    });
    console.log('--- MEMORIAL LIST ---');
    console.log(JSON.stringify(all, null, 2));
  } else {
    console.log('--- DB is EMPTY! ---');
  }
};
