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
        title: "MEMORA.LIFE API",
        description: "Documentazione per Postman/Swagger",
      },
    },
  },
});

export default config;
