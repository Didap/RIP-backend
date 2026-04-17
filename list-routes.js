module.exports = async ({ strapi }) => {
  console.log('--- REGISTERED ROUTES ---');
  const routes = strapi.server.listRoutes();
  routes.forEach(r => {
    if (r.path.includes('tombstone') || r.path.includes('memorial') || r.path.includes('feed')) {
      console.log(`${r.method} ${r.path} -> ${r.handler}`);
    }
  });
  console.log('--- END REGISTERED ROUTES ---');
};
