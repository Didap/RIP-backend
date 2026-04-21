export default {
  routes: [
    {
      method: 'POST',
      path: '/agencies/:id/recharge',
      handler: 'agency.recharge',
      config: {
        auth: false // Depending on how auth works with Strapi, maybe `auth: false` and we handle logic if we just want a test endpoint. Or omit for default behavior. Let's omit `auth` to require standard authenticated user, we can set permission in UI.
      }
    }
  ]
};
