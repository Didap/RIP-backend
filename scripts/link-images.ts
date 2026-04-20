
/**
 * Links uploaded Cloudinary images to existing tombstones.
 * Uses the correct file IDs from the latest upload batch.
 */
export const linkImages = async (strapi: any) => {
  console.log('🖼️ [LINK IMAGES] Starting...');

  // Correct mapping: slug → { profileFileId, coverFileId }
  // Using the HIGHEST IDs (latest upload batch)
  const IMAGE_MAP: Record<string, { profile: number; cover: number }> = {
    'elena-fabbri-seed':       { profile: 10, cover: 11 },
    'giovanni-rossi-seed':     { profile: 12, cover: 13 },
    'marco-bianchi-seed':      { profile: 14, cover: 15 },
    'margherita-conti-seed':   { profile: 16, cover: 17 },
    'luca-moretti-seed':       { profile: 18, cover: 19 },
    'sofia-colombo-seed':      { profile: 20, cover: 21 },
    'antonio-greco-seed':      { profile: 22, cover: 23 },
    'argo-seed':               { profile: 24, cover: 25 },
    'luna-seed':               { profile: 26, cover: 27 },
    'micio-seed':              { profile: 28, cover: 29 },
  };

  let linked = 0;

  for (const [slug, fileIds] of Object.entries(IMAGE_MAP)) {
    try {
      const tombstones = await strapi.entityService.findMany('api::tombstone.tombstone', {
        filters: { slug },
      });

      if (!tombstones || tombstones.length === 0) {
        console.log(`  ⚠️ "${slug}" not found`);
        continue;
      }

      const tombstone = tombstones[0];

      await strapi.entityService.update('api::tombstone.tombstone', tombstone.id, {
        data: {
          profile_image: fileIds.profile,
          cover_image: fileIds.cover,
        },
      });

      console.log(`  🔗 ${slug} → profile:${fileIds.profile} cover:${fileIds.cover}`);
      linked++;
    } catch (err: any) {
      console.error(`  ❌ ${slug}: ${err.message}`);
    }
  }

  console.log(`🖼️ [LINK IMAGES] Done! Linked: ${linked}`);
};
