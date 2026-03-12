/**
 * Permission Seeding Script for Memora.life
 * 
 * Defines the complete permission map for Public and Authenticated roles.
 * Called from bootstrap in src/index.ts on every server start.
 */

// ────────────────────────────────────────────
// PERMISSION MAP
// ────────────────────────────────────────────

interface PermissionEntry {
  action: string;
  public: boolean;
  authenticated: boolean;
}

const PERMISSION_MAP: PermissionEntry[] = [
  // ── Tombstones ──
  { action: 'api::tombstone.tombstone.find',       public: true,  authenticated: true  },
  { action: 'api::tombstone.tombstone.findOne',    public: true,  authenticated: true  },
  { action: 'api::tombstone.tombstone.create',     public: false, authenticated: true  },
  { action: 'api::tombstone.tombstone.update',     public: false, authenticated: true  },
  { action: 'api::tombstone.tombstone.delete',     public: false, authenticated: true  },

  // ── Contributions ──
  { action: 'api::contribution.contribution.find',     public: true,  authenticated: true  },
  { action: 'api::contribution.contribution.findOne',  public: true,  authenticated: true  },
  { action: 'api::contribution.contribution.create',   public: true,  authenticated: true  },
  { action: 'api::contribution.contribution.update',   public: false, authenticated: true  },
  { action: 'api::contribution.contribution.delete',   public: false, authenticated: true  },

  // ── Agencies ──
  { action: 'api::agency.agency.find',     public: true,  authenticated: true  },
  { action: 'api::agency.agency.findOne',  public: true,  authenticated: true  },
  { action: 'api::agency.agency.create',   public: false, authenticated: true  },
  { action: 'api::agency.agency.update',   public: false, authenticated: true  },

  // ── Tombstone Permissions (ACL) ──
  { action: 'api::tombstone-permission.tombstone-permission.find',     public: false, authenticated: true },
  { action: 'api::tombstone-permission.tombstone-permission.findOne',  public: false, authenticated: true },
  { action: 'api::tombstone-permission.tombstone-permission.create',   public: false, authenticated: true },
  { action: 'api::tombstone-permission.tombstone-permission.update',   public: false, authenticated: true },
  { action: 'api::tombstone-permission.tombstone-permission.delete',   public: false, authenticated: true },

  // ── Upload ──
  { action: 'plugin::upload.content-api.upload',   public: false, authenticated: true },
  { action: 'plugin::upload.content-api.find',     public: false, authenticated: true },
  { action: 'plugin::upload.content-api.findOne',  public: false, authenticated: true },

  // ── Users ──
  { action: 'plugin::users-permissions.user.me',       public: false, authenticated: true },
  { action: 'plugin::users-permissions.user.update',   public: false, authenticated: true },
  { action: 'plugin::users-permissions.user.find',     public: false, authenticated: true },
  { action: 'plugin::users-permissions.user.findOne',  public: false, authenticated: true },

  // ── Documentation ──
  { action: 'plugin::documentation.public.index', public: true, authenticated: true },
];

// ────────────────────────────────────────────
// SEED FUNCTION
// ────────────────────────────────────────────

export async function seedPermissions(strapi: any) {
  console.log('🔐 [SEED] Starting permission sync...');

  const roleService = strapi.plugin('users-permissions').service('role');
  const roles = await roleService.find();
  const publicRole = roles.find((r: any) => r.type === 'public');
  const authenticatedRole = roles.find((r: any) => r.type === 'authenticated');

  if (!publicRole || !authenticatedRole) {
    console.error('🔐 [SEED] ERROR: Could not find public or authenticated roles!');
    return;
  }

  const rolesToProcess = [
    { role: publicRole, key: 'public' as const },
    { role: authenticatedRole, key: 'authenticated' as const },
  ];

  let created = 0;
  let skipped = 0;

  for (const { role, key } of rolesToProcess) {
    const actionsForRole = PERMISSION_MAP.filter(p => p[key]);

    for (const perm of actionsForRole) {
      try {
        const exists = await strapi.query('plugin::users-permissions.permission').findOne({
          where: { action: perm.action, role: role.id },
        });

        if (!exists) {
          await strapi.query('plugin::users-permissions.permission').create({
            data: { action: perm.action, role: role.id },
          });
          console.log(`  ✅ GRANTED ${perm.action} → ${key}`);
          created++;
        } else {
          skipped++;
        }
      } catch (err: any) {
        console.warn(`  ⚠️  SKIP ${perm.action} → ${key} (${err.message})`);
        skipped++;
      }
    }
  }

  console.log(`🔐 [SEED] Done! Created: ${created}, Skipped (already exist): ${skipped}`);
}
