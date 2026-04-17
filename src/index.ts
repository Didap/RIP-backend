
export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   */
  register({ strapi }) {
    console.log('--- SYSTEM: REGISTERING CUSTOM AUTH LOGIC ---');

    const plugin = strapi.plugin('users-permissions');

    // 1. BYPASS ROUTE VALIDATOR
    if (plugin.routes) {
      Object.keys(plugin.routes).forEach(type => {
        const routes = plugin.routes[type].routes || [];
        const registerRoute = routes.find(r => r.path === '/auth/local/register' && r.method === 'POST');
        
        if (registerRoute) {
          console.log(`--- SYSTEM: DISABLING VALIDATOR FOR ${type} REGISTER ROUTE ---`);
          if (registerRoute.request) {
            delete registerRoute.request.body;
          }
        }
      });
    }

    // 2. OVERRIDE REGISTRATION CONTROLLER
    plugin.controllers.auth.register = async (ctx) => {
      const {
        username, email, password,
        first_name, last_name, birth_date, birth_place,
        gender, phone, fiscal_code, role_type
      } = ctx.request.body || {};

      if (!email || !password || !username) {
        return ctx.badRequest('Missing mandatory fields (email, password or username)');
      }

      try {
        console.log(`--- SYSTEM: MANUAL REGISTRATION FOR ${email} ---`);

        // Check if user already exists
        const existingUser = await strapi.query('plugin::users-permissions.user').findOne({
          where: { $or: [{ email: email.toLowerCase() }, { username }] }
        });

        if (existingUser) {
          return ctx.badRequest('Email or Username already taken');
        }

        // Get default "Authenticated" role
        const advancedConfigs = await (strapi.store({ type: 'plugin', name: 'users-permissions', key: 'advanced' }).get() as any);
        const defaultRole = await strapi.query('plugin::users-permissions.role').findOne({
          where: { type: advancedConfigs.default_role || 'authenticated' }
        });

        if (!defaultRole) {
          throw new Error('Default role (Authenticated) not found');
        }

        // Create the user manually
        const newUser = await strapi.entityService.create('plugin::users-permissions.user', {
          data: {
            username,
            email: email.toLowerCase(),
            password,
            first_name,
            last_name,
            birth_date,
            birth_place,
            gender,
            phone,
            fiscal_code,
            role_type: role_type || 'individual',
            credits: 0,
            role: defaultRole.id,
            confirmed: true,
            provider: 'local',
          },
        });

        console.log(`--- SYSTEM: USER ${newUser.id} CREATED SUCCESSFULLY ---`);

        // Generate JWT
        const jwt = strapi.plugin('users-permissions').service('jwt').issue({
          id: newUser.id,
        });

        // Response
        ctx.body = {
          jwt,
          user: await strapi.entityService.findOne('plugin::users-permissions.user', newUser.id, {
            populate: ['role', 'managed_agency', 'agencies']
          })
        };

      } catch (err: any) {
        console.error(`--- SYSTEM: REGISTRATION FAILED ---`, err.message);
        return ctx.badRequest(err.message);
      }
    };
  },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   */
  async bootstrap({ strapi }) {
    const { seedPermissions } = require('../scripts/seed-permissions');
    const { seedMemorials } = require('../scripts/seed-memorials');
    
    await seedPermissions(strapi);
    await seedMemorials(strapi);

    // --- SYSTEM: Ensure user-agency link for dashboard ---
    console.log('--- SYSTEM: ENSURING USER-AGENCY ASSOCIATION ---');
    const firstUser = await strapi.entityService.findMany('plugin::users-permissions.user', { limit: 1 });
    const firstAgency = await strapi.entityService.findMany('api::agency.agency', { limit: 1 });

    if (firstUser.length > 0 && firstAgency.length > 0) {
      const user = firstUser[0];
      const agency = firstAgency[0];
      
      // Update user with agency link if missing
      await strapi.entityService.update('plugin::users-permissions.user', user.id, {
        data: {
          managed_agency: agency.id,
          agencies: [agency.id]
        }
      });
      console.log(`--- SYSTEM: LINKED USER ${user.username} TO AGENCY ${agency.name} ---`);
    }
  },
};
