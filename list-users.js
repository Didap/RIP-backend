module.exports = async ({ strapi }) => {
  const users = await strapi.entityService.findMany('plugin::users-permissions.user');
  console.log('--- USERS LIST ---');
  users.forEach(u => console.log(`ID: ${u.id}, Username: ${u.username}, Email: ${u.email}`));
  console.log('--- END USERS LIST ---');
};
