module.exports = async ({ strapi }) => {
  const entry = await strapi.entityService.findOne('api::memorial.memorial', 5, {
    populate: '*'
  });
  console.log('--- MEMORIAL ENTRY ---');
  console.log(JSON.stringify(entry, null, 2));
  console.log('--- END MEMORIAL ENTRY ---');
};
