/**
 * One-time script: downloads images from Unsplash, uploads via Strapi API,
 * and links them to all memorials.
 *
 * Usage: npx tsx scripts/seed-images.ts
 */

import http from 'http';
import https from 'https';
import { readFileSync } from 'fs';

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';

const MEMORIAL_IMAGES: Record<string, { profile: string; cover?: string }> = {
  'elena-fabbri-seed': {
    profile: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=500&fit=crop&crop=face',
    cover: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=800&h=600&fit=crop',
  },
  'giovanni-rossi-seed': {
    profile: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop&crop=face',
    cover: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&h=600&fit=crop',
  },
  'marco-bianchi-seed': {
    profile: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=500&fit=crop&crop=face',
    cover: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=800&h=600&fit=crop',
  },
  'margherita-conti-seed': {
    profile: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=500&fit=crop&crop=face',
    cover: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&h=600&fit=crop',
  },
  'luca-moretti-seed': {
    profile: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=500&fit=crop&crop=face',
    cover: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800&h=600&fit=crop',
  },
  'sofia-colombo-seed': {
    profile: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop&crop=face',
    cover: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&h=600&fit=crop',
  },
  'antonio-greco-seed': {
    profile: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop&crop=face',
    cover: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&h=600&fit=crop',
  },
  'argo-seed': {
    profile: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=500&fit=crop',
    cover: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&h=600&fit=crop',
  },
  'luna-seed': {
    profile: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400&h=500&fit=crop',
    cover: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&h=600&fit=crop',
  },
  'micio-seed': {
    profile: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=500&fit=crop',
    cover: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&h=600&fit=crop',
  },
};

function downloadImage(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, { headers: { 'User-Agent': 'RIP-Seed-Script/1.0' } }, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Download failed: ${res.statusCode} for ${url}`));
        res.resume();
        return;
      }
      const chunks: Buffer[] = [];
      res.on('data', (c: Buffer) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

function uploadToStrapi(imageBuffer: Buffer, filename: string, mimeType: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const boundary = '----RIPFormBoundary' + Math.random().toString(36).slice(2);

    const header = `--${boundary}\r\nContent-Disposition: form-data; name="files"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`;
    const footer = `\r\n--${boundary}--\r\n`;

    const body = Buffer.concat([
      Buffer.from(header),
      imageBuffer,
      Buffer.from(footer),
    ]);

    const options: http.RequestOptions = {
      hostname: 'localhost',
      port: 1337,
      path: '/api/upload',
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (Array.isArray(result) && result.length > 0) {
            resolve(result[0]);
          } else {
            reject(new Error('Unexpected upload response'));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function strapiRequest(method: string, path: string, body?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const url = new URL(STRAPI_URL + path);
    const options: http.RequestOptions = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname + url.search,
      method,
      headers: { 'Content-Type': 'application/json' },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    });

    req.on('error', reject);
    if (body && method !== 'GET') req.write(JSON.stringify(body));
    req.end();
  });
}

async function findTombstoneBySlug(slug: string): Promise<any> {
  const res = await strapiRequest('GET', `/api/tombstones?filters[slug][$eq]=${slug}&populate=*`);
  return res.data?.[0] || null;
}

async function updateTombstone(docId: string, data: any): Promise<void> {
  await strapiRequest('PUT', `/api/tombstones/${docId}`, { data });
}

async function main() {
  console.log('📸 [SEED IMAGES] Starting image download & upload...');

  const entries = Object.entries(MEMORIAL_IMAGES);
  let uploaded = 0;
  let skipped = 0;

  for (const [slug, images] of entries) {
    try {
      const tombstone = await findTombstoneBySlug(slug);
      if (!tombstone) {
        console.log(`  ⚠️  "${slug}" not found`);
        continue;
      }

      const docId = tombstone.documentId;
      const needsProfile = !tombstone.profile_image?.url;
      const needsCover = !tombstone.cover_image?.url;

      if (!needsProfile && !needsCover) {
        console.log(`  ✅ ${slug} — already has images`);
        skipped++;
        continue;
      }

      const updateData: any = {};

      // Upload profile image
      if (needsProfile) {
        console.log(`  📥 Downloading profile for ${slug}...`);
        const profileBuf = await downloadImage(images.profile);
        console.log(`  📤 Uploading ${profileBuf.length} bytes...`);
        const profileFile = await uploadToStrapi(profileBuf, `${slug}-profile.jpg`, 'image/jpeg');
        updateData.profile_image = profileFile.documentId;
        console.log(`  ✅ Profile: ${profileFile.url?.substring(0, 70)}...`);
      }

      // Upload cover image
      if (needsCover && images.cover) {
        console.log(`  📥 Downloading cover for ${slug}...`);
        const coverBuf = await downloadImage(images.cover);
        console.log(`  📤 Uploading ${coverBuf.length} bytes...`);
        const coverFile = await uploadToStrapi(coverBuf, `${slug}-cover.jpg`, 'image/jpeg');
        updateData.cover_image = coverFile.documentId;
        console.log(`  ✅ Cover: ${coverFile.url?.substring(0, 70)}...`);
      }

      // Update tombstone
      await updateTombstone(docId, updateData);
      console.log(`  🔄 Updated "${tombstone.full_name}"`);
      uploaded++;

      await new Promise((r) => setTimeout(r, 800));
    } catch (err: any) {
      console.error(`  ❌ ${slug}: ${err.message || JSON.stringify(err)}`);
    }
  }

  console.log(`\n📸 [SEED IMAGES] Done! Uploaded: ${uploaded}, Skipped: ${skipped}, Total: ${entries.length}`);
}

main().catch(console.error);
