import type { Core } from "@strapi/strapi";

const config = ({
  env,
}: Core.Config.Shared.ConfigParams): Core.Config.Plugin => ({
  upload: {
    config: {
      provider: "cloudinary",
      providerOptions: {
        cloud_name: env("CLOUDINARY_NAME"),
        api_key: env("CLOUDINARY_KEY"),
        api_secret: env("CLOUDINARY_SECRET"),
      },
      actionOptions: {
        upload: {
          folder: env("CLOUDINARY_FOLDER", "Rip"),
        },
        uploadStream: {
          folder: env("CLOUDINARY_FOLDER", "Rip"),
        },
        delete: {},
      },
    },
  },
  documentation: {
    enabled: true,
    config: {
      info: {
        version: "1.0.0",
        title: "RIP API",
        description: "Documentazione per Postman/Swagger",
      },
    },
  },
  email: {
    config: {
      provider: 'strapi-provider-email-resend',
      providerOptions: {
        apiKey: env('RESEND_API_KEY'),
      },
      settings: {
        defaultFrom: 'onboarding@resend.dev',
        defaultReplyTo: 'onboarding@resend.dev',
      },
    },
  },
});

export default config;
