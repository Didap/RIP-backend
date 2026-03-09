
export default async ({ strapi }) => {
  const permissions = await strapi.query('plugin::users-permissions.permission').findMany({
    populate: ['role']
  });
  console.log('--- SYSTEM: PERMISSIONS DUMP ---');
  permissions.forEach(p => {
    console.log(`Role: ${p.role?.name}, Action: ${p.action}`);
  });
  console.log('--- SYSTEM: END PERMISSIONS DUMP ---');
};
