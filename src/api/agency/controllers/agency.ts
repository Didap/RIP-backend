/**
 * agency controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::agency.agency', ({ strapi }) => ({
  async recharge(ctx) {
    const { id } = ctx.params;
    const { amount = 1000 } = ctx.request.body as any; // default recharge of 1000
    
    const agency = await strapi.entityService.findOne('api::agency.agency', id);
    if (!agency) {
      return ctx.notFound('Agenzia non trovata');
    }
    
    const newCredits = (agency.credits || 0) + amount;
    
    await strapi.entityService.update('api::agency.agency', id, {
      data: { credits: newCredits }
    });
    
    // log transaction
    await strapi.entityService.create('api::credit-transaction.credit-transaction', {
      data: {
        amount,
        type: 'recharge',
        description: `Ricarica simulata pacchetto ${amount} crediti`,
        agency: id
      }
    });

    return ctx.send({ message: 'Ricarica effettuata', credits: newCredits });
  },

  async addStaff(ctx) {
    const { id: agencyId } = ctx.params;
    const { username, email, password, first_name, last_name } = ctx.request.body as any;

    if (!username || !email || !password) {
      return ctx.badRequest('Missing mandatory fields (username, email, password)');
    }

    try {
      // 1. Get default "Authenticated" role
      const defaultRole = await strapi.query('plugin::users-permissions.role').findOne({
        where: { type: 'authenticated' }
      });

      if (!defaultRole) {
        throw new Error('Default role not found');
      }

      // 2. Create the user manually
      const newUser = await strapi.entityService.create('plugin::users-permissions.user', {
        data: {
          username,
          email: email.toLowerCase(),
          password,
          first_name,
          last_name,
          role_type: 'agency_staff',
          managed_agency: agencyId,
          role: defaultRole.id,
          confirmed: true,
          provider: 'local',
        },
      });

      return ctx.send({ 
        message: 'Membro dello staff creato con successo', 
        user: { id: newUser.id, username: newUser.username, email: newUser.email } 
      });
    } catch (err: any) {
      return ctx.badRequest(err.message);
    }
  }
}));

