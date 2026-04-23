
export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   */
  register({ strapi }) {

    const plugin = strapi.plugin('users-permissions');

    // 1. BYPASS ROUTE VALIDATOR
    if (plugin.routes) {
      Object.keys(plugin.routes).forEach(type => {
        const routes = plugin.routes[type].routes || [];
        const registerRoute = routes.find(r => r.path === '/auth/local/register' && r.method === 'POST');
        
        if (registerRoute) {
          if (registerRoute.request) {
            delete registerRoute.request.body;
          }
        }
      });
    }

    // 2. OVERRIDE REGISTRATION CONTROLLER — Agency-only registration with email confirmation
    plugin.controllers.auth.register = async (ctx) => {
      const {
        agency_name, email, password,
        vat_number, phone
      } = ctx.request.body || {};

      // ── Validation ──────────────────────────────────────
      if (!email || !password || !agency_name) {
        return ctx.badRequest('Campi obbligatori mancanti: email, password e nome agenzia');
      }

      if (password.length < 6) {
        return ctx.badRequest('La password deve contenere almeno 6 caratteri');
      }

      // Derive a unique username from the email
      const username = email.toLowerCase().split('@')[0] + '_' + Date.now();

      try {
        // ── Check if user already exists ──────────────────
        const existingUser = await strapi.query('plugin::users-permissions.user').findOne({
          where: { email: email.toLowerCase() }
        });

        if (existingUser) {
          return ctx.badRequest('Questa email è già registrata');
        }

        // ── Get default "Authenticated" role ──────────────
        const advancedConfigs = await (strapi.store({ type: 'plugin', name: 'users-permissions', key: 'advanced' }).get() as any);
        const defaultRole = await strapi.query('plugin::users-permissions.role').findOne({
          where: { type: advancedConfigs.default_role || 'authenticated' }
        });

        if (!defaultRole) {
          throw new Error('Default role (Authenticated) not found');
        }

        // ── Create the user (NOT confirmed) ──────────────
        const newUser = await strapi.entityService.create('plugin::users-permissions.user', {
          data: {
            username,
            email: email.toLowerCase(),
            password,
            role_type: 'agency_admin',
            credits: 0,
            role: defaultRole.id,
            confirmed: false,
            provider: 'local',
          },
        });

        // ── Create the Agency and link to the user ───────
        const newAgency = await strapi.entityService.create('api::agency.agency', {
          data: {
            name: agency_name,
            vat_number: vat_number || null,
            phone: phone || null,
            email: email.toLowerCase(),
            owner: newUser.id,
            staff: [newUser.id],
            credits: 0,
          },
        });

        // ── Link the user back to their agency ───────────
        await strapi.entityService.update('plugin::users-permissions.user', newUser.id, {
          data: {
            managed_agency: newAgency.id,
            agencies: [newAgency.id],
          },
        });

        // ── Send confirmation email via Strapi's built-in service ──
        try {
          // Fetch user with role populated (needed by sendConfirmationEmail)
          const userWithRole = await strapi.query('plugin::users-permissions.user').findOne({
            where: { id: newUser.id },
            populate: ['role'],
          });

          await strapi.plugin('users-permissions').service('user').sendConfirmationEmail(userWithRole);
          strapi.log.info(`Confirmation email sent to ${email}`);
        } catch (emailErr) {
          strapi.log.error('Failed to send confirmation email:', emailErr);
          // Registration still succeeds even if email fails — can be resent later
        }

        // ── Response (no JWT — user must confirm first) ──
        ctx.body = {
          message: 'Registrazione completata! Controlla la tua email per confermare l\'account.',
          user: {
            id: newUser.id,
            email: newUser.email,
            confirmed: false,
          },
        };
      } catch (err: any) {
        strapi.log.error('Registration error:', err);
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

    // Link uploaded images to memorials (one-time)
    const { linkImages } = require('../scripts/link-images');
    await linkImages(strapi);

    // ── Fix: Ensure Users-Permissions uses a verified Resend domain ──
    try {
      const upStore = strapi.store({ type: 'plugin', name: 'users-permissions', key: 'email' });
      const emailSettings = await upStore.get() as any;
      
      if (emailSettings) {
        let changed = false;
        
        // Fix confirmation email
        if (emailSettings.email_confirmation?.options?.fromAddress?.includes('strapi.io')) {
          emailSettings.email_confirmation.options.fromAddress = 'onboarding@resend.dev';
          emailSettings.email_confirmation.options.fromName = 'RIP - Rest in Pixel';
          changed = true;
        }
        
        // Fix reset password email
        if (emailSettings.reset_password?.options?.fromAddress?.includes('strapi.io')) {
          emailSettings.reset_password.options.fromAddress = 'onboarding@resend.dev';
          emailSettings.reset_password.options.fromName = 'RIP - Rest in Pixel';
          changed = true;
        }

        if (changed) {
          await upStore.set({ value: emailSettings });
          strapi.log.info('Updated Users-Permissions email settings to use onboarding@resend.dev');
        }
      }

      // Also ensure email confirmation is ENABLED in advanced settings
      const advStore = strapi.store({ type: 'plugin', name: 'users-permissions', key: 'advanced' });
      const advancedSettings = await advStore.get() as any;
      if (advancedSettings && !advancedSettings.email_confirmation) {
        advancedSettings.email_confirmation = true;
        // Set a reasonable redirect URL if missing
        if (!advancedSettings.email_confirmation_redirection_url) {
          advancedSettings.email_confirmation_redirection_url = 'http://localhost:8081/backoffice';
        }
        await advStore.set({ value: advancedSettings });
        strapi.log.info('Enabled email confirmation in Users-Permissions advanced settings');
      }
    } catch (err) {
      strapi.log.error('Failed to auto-configure email settings:', err);
    }

    // Ensure user-agency association
    const firstUser = await strapi.entityService.findMany('plugin::users-permissions.user', { limit: 1 });
    const firstAgency = await strapi.entityService.findMany('api::agency.agency', { limit: 1 });

    if (firstUser.length > 0 && firstAgency.length > 0) {
      const user = firstUser[0];
      const agency = firstAgency[0];
      await strapi.entityService.update('plugin::users-permissions.user', user.id, {
        data: {
          managed_agency: agency.id,
          agencies: [agency.id]
        }
      });
    }
  },
};
