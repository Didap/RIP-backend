
export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   */
  register({ strapi }) {
    console.log('--- SYSTEM: REGISTERING CUSTOM AUTH LOGIC ---');

    const plugin = strapi.plugin('users-permissions');

    // 1. BYPASS ROUTE VALIDATOR
    // We remove the YUP validator from the registration route to allow custom fields.
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
      const { username, email, password, first_name, last_name, birth_date, birth_place, gender, phone, fiscal_code } = ctx.request.body || {};

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
            populate: ['role']
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
    console.log('--- SYSTEM: SYNCING PERMISSIONS ---');
    try {
      const roleService = strapi.plugin('users-permissions').service('role');
      const roles = await roleService.find();
      const authenticatedRole = roles.find(r => r.type === 'authenticated');
      const publicRole = roles.find(r => r.type === 'public');

      const rolesToUpdate = [
        { role: authenticatedRole, type: 'authenticated' },
        { role: publicRole, type: 'public' }
      ];

      for (const roleObj of rolesToUpdate) {
        if (roleObj.role) {
          console.log(`--- SYSTEM: UPDATING PERMISSIONS FOR ROLE: ${roleObj.role.name} ---`);
          
          // Shared permissions for both (viewing)
          const basePerms = [
            { action: 'api::memorial.memorial.find', role: roleObj.role.id },
            { action: 'api::memorial.memorial.findOne', role: roleObj.role.id },
            { action: 'api::memory-asset.memory-asset.find', role: roleObj.role.id },
            { action: 'api::memory-asset.memory-asset.findOne', role: roleObj.role.id },
            { action: 'api::guestbook.guestbook.find', role: roleObj.role.id },
            { action: 'api::guestbook.guestbook.findOne', role: roleObj.role.id },
          ];

          // Additional perms for public (leaving tributes)
          const publicOnlyPerms = roleObj.type === 'public' ? [
            { action: 'api::guestbook.guestbook.create', role: roleObj.role.id },
          ] : [];

          // Additional perms for authenticated
          const authOnlyPerms = roleObj.type === 'authenticated' ? [
            { action: 'api::guestbook.guestbook.create', role: roleObj.role.id },
            { action: 'api::memory-asset.memory-asset.create', role: roleObj.role.id },
            { action: 'api::family.family.find', role: roleObj.role.id },
            { action: 'api::family.family.findOne', role: roleObj.role.id },
            { action: 'api::family.family.create', role: roleObj.role.id },
            { action: 'api::family.family.update', role: roleObj.role.id },
            { action: 'api::memorial.memorial.create', role: roleObj.role.id },
            { action: 'api::memorial.memorial.update', role: roleObj.role.id },
            { action: 'plugin::upload.upload', role: roleObj.role.id },
            { action: 'plugin::upload.find', role: roleObj.role.id },
            { action: 'plugin::upload.findOne', role: roleObj.role.id },
            { action: 'plugin::upload.destroy', role: roleObj.role.id },
            { action: 'plugin::upload.content-api.upload', role: roleObj.role.id },
            { action: 'plugin::upload.content-api.find', role: roleObj.role.id },
            { action: 'plugin::upload.content-api.findOne', role: roleObj.role.id },
            { action: 'plugin::users-permissions.user.update', role: roleObj.role.id },
            { action: 'plugin::users-permissions.user.me', role: roleObj.role.id },
          ] : [];

          const allRolePerms = [...basePerms, ...publicOnlyPerms, ...authOnlyPerms];

          for (const p of allRolePerms) {
            const exists = await strapi.query('plugin::users-permissions.permission').findOne({
              where: { action: p.action, role: p.role }
            });
            
            if (!exists) {
              console.log(`--- SYSTEM: GRANTING ${p.action} TO ${roleObj.type} ---`);
              await strapi.query('plugin::users-permissions.permission').create({
                data: { ...p }
              });
            }
          }
        }
      }
      console.log('--- SYSTEM: PERMISSIONS SYNCED ---');
    } catch (err) {
      console.error('--- SYSTEM: FAILED TO SYNC PERMISSIONS ---', err.message);
    }
  },
};
