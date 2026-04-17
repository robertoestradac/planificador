require('dotenv').config();
const mysql  = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');

// ── All system permissions ────────────────────────────────────
// Format: key_name → description
// Grouped by module for clarity
const ALL_PERMISSIONS = [
  // ── Dashboard / Eventos ──────────────────────────────────
  { key_name: 'view_events',        description: 'Ver eventos' },
  { key_name: 'create_event',       description: 'Crear eventos' },
  { key_name: 'edit_event',         description: 'Editar eventos' },
  { key_name: 'delete_event',       description: 'Eliminar eventos' },

  // ── Invitaciones ─────────────────────────────────────────
  { key_name: 'view_invitations',   description: 'Ver invitaciones' },
  { key_name: 'create_invitation',  description: 'Crear invitaciones' },
  { key_name: 'edit_invitation',    description: 'Editar invitaciones' },
  { key_name: 'delete_invitation',  description: 'Eliminar invitaciones' },
  { key_name: 'publish_invitation', description: 'Publicar/despublicar invitaciones' },

  // ── Builder ──────────────────────────────────────────────
  { key_name: 'use_builder',           description: 'Acceder al builder de invitaciones' },
  { key_name: 'builder_block_hero',    description: 'Builder: bloque Portada/Hero' },
  { key_name: 'builder_block_gallery', description: 'Builder: bloque Galería de fotos' },
  { key_name: 'builder_block_video',   description: 'Builder: bloque Video' },
  { key_name: 'builder_block_music',   description: 'Builder: bloque Reproductor de música' },
  { key_name: 'builder_block_rsvp',    description: 'Builder: bloque RSVP' },
  { key_name: 'builder_block_map',     description: 'Builder: bloque Mapa/Ubicación' },
  { key_name: 'builder_block_countdown', description: 'Builder: bloque Cuenta regresiva' },
  { key_name: 'builder_block_schedule', description: 'Builder: bloque Itinerario' },
  { key_name: 'builder_block_couple',  description: 'Builder: bloque Pareja/Presentación' },
  { key_name: 'builder_block_gifts',   description: 'Builder: bloque Mesa de regalos' },
  { key_name: 'builder_block_dresscode', description: 'Builder: bloque Código de vestimenta' },
  { key_name: 'builder_block_photos',  description: 'Builder: bloque Subir fotos (invitados)' },
  { key_name: 'builder_block_text',    description: 'Builder: bloque Texto/Cita' },
  { key_name: 'builder_block_misc',    description: 'Builder: bloques Utilidad (divider, hospedaje, menú)' },

  // ── Invitados ────────────────────────────────────────────
  { key_name: 'view_guests',        description: 'Ver invitados' },
  { key_name: 'manage_guests',      description: 'Gestionar invitados y RSVPs' },

  // ── Fotos del evento ─────────────────────────────────────
  { key_name: 'view_photos',        description: 'Ver fotos del evento' },
  { key_name: 'delete_photos',      description: 'Eliminar fotos del evento' },

  // ── Analíticas ───────────────────────────────────────────
  { key_name: 'view_analytics',     description: 'Ver analíticas del tenant' },

  // ── Planificador ─────────────────────────────────────────
  { key_name: 'use_planner',              description: 'Acceder al planificador de eventos' },
  { key_name: 'planner_checklist',        description: 'Planificador: módulo Checklist de tareas' },
  { key_name: 'planner_budget',           description: 'Planificador: módulo Presupuesto' },
  { key_name: 'planner_vendors',          description: 'Planificador: módulo Proveedores' },
  { key_name: 'planner_timeline',         description: 'Planificador: módulo Cronograma del día' },
  { key_name: 'planner_calendar',         description: 'Planificador: módulo Calendario y alertas' },
  { key_name: 'planner_calendar_alerts',  description: 'Planificador: crear alertas en el calendario' },
  { key_name: 'planner_seating',          description: 'Planificador: módulo Mesas (seating chart)' },
  { key_name: 'planner_seating_assign',   description: 'Planificador: asignar invitados a asientos' },

  // ── Equipo / Usuarios del tenant ─────────────────────────
  { key_name: 'view_users',         description: 'Ver usuarios del equipo' },
  { key_name: 'manage_users',       description: 'Gestionar usuarios del equipo' },

  // ── Suscripción ──────────────────────────────────────────
  { key_name: 'manage_plan',        description: 'Ver y gestionar suscripción' },

  // ── SaaS Admin (solo roles globales) ─────────────────────
  { key_name: 'manage_tenants',     description: 'Gestionar todos los tenants (SaaS admin)' },
  { key_name: 'manage_plans',       description: 'Gestionar planes de suscripción (SaaS admin)' },
  { key_name: 'manage_templates',   description: 'Gestionar plantillas globales (SaaS admin)' },
  { key_name: 'manage_roles',       description: 'Gestionar roles del sistema (SaaS admin)' },
  { key_name: 'view_global_stats',  description: 'Ver estadísticas globales del SaaS' },
];

// ── Permission groups for UI display ─────────────────────────
// Used by admin roles/plans pages to render checkboxes by module
const PERMISSION_MODULES = [
  {
    module: 'Eventos',
    keys: ['view_events','create_event','edit_event','delete_event'],
  },
  {
    module: 'Invitaciones',
    keys: ['view_invitations','create_invitation','edit_invitation','delete_invitation','publish_invitation'],
  },
  {
    module: 'Builder',
    keys: ['use_builder','builder_block_hero','builder_block_gallery','builder_block_video',
           'builder_block_music','builder_block_rsvp','builder_block_map','builder_block_countdown',
           'builder_block_schedule','builder_block_couple','builder_block_gifts',
           'builder_block_dresscode','builder_block_photos','builder_block_text','builder_block_misc'],
  },
  {
    module: 'Invitados',
    keys: ['view_guests','manage_guests'],
  },
  {
    module: 'Fotos',
    keys: ['view_photos','delete_photos'],
  },
  {
    module: 'Analíticas',
    keys: ['view_analytics'],
  },
  {
    module: 'Planificador',
    keys: ['use_planner','planner_checklist','planner_budget','planner_vendors','planner_timeline',
           'planner_calendar','planner_calendar_alerts','planner_seating','planner_seating_assign'],
  },
  {
    module: 'Equipo',
    keys: ['view_users','manage_users'],
  },
  {
    module: 'Suscripción',
    keys: ['manage_plan'],
  },
  {
    module: 'SaaS Admin',
    keys: ['manage_tenants','manage_plans','manage_templates','manage_roles','view_global_stats'],
  },
];

async function assignPerms(conn, table, idField, id, keys) {
  for (const key of keys) {
    const [[perm]] = await conn.query('SELECT id FROM permissions WHERE key_name = ?', [key]);
    if (perm) {
      await conn.query(`INSERT IGNORE INTO ${table} (${idField}, permission_id) VALUES (?, ?)`, [id, perm.id]);
    }
  }
}

async function seed() {
  const conn = await mysql.createConnection({
    host: config.db.host, port: config.db.port,
    user: config.db.user, password: config.db.password,
    database: config.db.name,
  });

  try {
    console.log('Seeding database...');

    // ── 1. Permissions ────────────────────────────────────────
    for (const p of ALL_PERMISSIONS) {
      await conn.query(
        'INSERT IGNORE INTO permissions (id, key_name, description) VALUES (?, ?, ?)',
        [uuidv4(), p.key_name, p.description]
      );
    }
    console.log(`Permissions seeded (${ALL_PERMISSIONS.length} total).`);

    // ── 2. Global Roles ───────────────────────────────────────
    const superAdminRoleId = uuidv4();
    const adminRoleId      = uuidv4();
    const supportRoleId    = uuidv4();
    const salesRoleId      = uuidv4();
    const designerRoleId   = uuidv4();

    // Tenant roles
    const ownerRoleId      = uuidv4();
    const memberRoleId     = uuidv4();

    const globalRoles = [
      { id: superAdminRoleId, name: 'SuperAdmin', is_global: 1 },
      { id: adminRoleId,      name: 'Admin',      is_global: 1 },
      { id: supportRoleId,    name: 'Soporte',    is_global: 1 },
      { id: salesRoleId,      name: 'Ventas',     is_global: 1 },
      { id: designerRoleId,   name: 'Diseñador',  is_global: 1 },
    ];
    const tenantRoles = [
      { id: ownerRoleId,  name: 'Owner',  is_global: 0 },
      { id: memberRoleId, name: 'Member', is_global: 0 },
    ];

    for (const r of [...globalRoles, ...tenantRoles]) {
      await conn.query(
        'INSERT IGNORE INTO roles (id, tenant_id, name, is_global) VALUES (?, NULL, ?, ?)',
        [r.id, r.name, r.is_global]
      );
    }
    console.log('Roles seeded.');

    // ── 3. Role permissions ───────────────────────────────────

    // SuperAdmin — everything
    const [allPerms] = await conn.query('SELECT id FROM permissions');
    for (const p of allPerms) {
      await conn.query('INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)', [superAdminRoleId, p.id]);
    }

    // Admin — manage templates, roles, view global stats + read tenant data
    await assignPerms(conn, 'role_permissions', 'role_id', adminRoleId, [
      'manage_templates', 'manage_roles', 'view_global_stats', 'view_analytics',
      'manage_tenants', 'manage_plans',
    ]);

    // Soporte — read-only: view tenants, analytics, stats
    await assignPerms(conn, 'role_permissions', 'role_id', supportRoleId, [
      'view_analytics', 'view_global_stats',
    ]);

    // Ventas — manage tenants + plans (sales operations)
    await assignPerms(conn, 'role_permissions', 'role_id', salesRoleId, [
      'manage_tenants', 'manage_plans', 'view_global_stats', 'view_analytics',
    ]);

    // Diseñador — manage templates only
    await assignPerms(conn, 'role_permissions', 'role_id', designerRoleId, [
      'manage_templates', 'view_analytics',
    ]);

    // Owner — full tenant control (all permissions)
    for (const p of allPerms) {
      await conn.query('INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)', [ownerRoleId, p.id]);
    }

    // Member — collaborator: no delete, no team/plan management
    await assignPerms(conn, 'role_permissions', 'role_id', memberRoleId, [
      'view_events','create_event','edit_event',
      'view_invitations','create_invitation','edit_invitation','publish_invitation',
      'use_builder',
      'builder_block_hero','builder_block_gallery','builder_block_rsvp','builder_block_map',
      'builder_block_countdown','builder_block_schedule','builder_block_text',
      'view_guests','manage_guests',
      'view_photos',
      'view_analytics',
      'use_planner','planner_checklist','planner_budget','planner_vendors','planner_timeline',
      'planner_calendar','planner_calendar_alerts','planner_seating','planner_seating_assign',
      'view_users',
    ]);

    console.log('Role permissions seeded.');

    // ── 4. Plans ──────────────────────────────────────────────
    const freePlanId   = uuidv4();
    const basicPlanId  = uuidv4();
    const proPlanId    = uuidv4();
    const agencyPlanId = uuidv4();

    const plans = [
      {
        id: freePlanId, name: 'Gratuito',
        price_usd: 0, price_gtq: 0,
        max_events: 1, max_guests: 50, max_users: 1,
        perms: [
          // Full permissions for free plan (Owner bypasses plan checks anyway)
          'view_events','create_event','edit_event','delete_event',
          'view_invitations','create_invitation','edit_invitation','delete_invitation','publish_invitation',
          'use_builder',
          'builder_block_hero','builder_block_gallery','builder_block_video','builder_block_music',
          'builder_block_rsvp','builder_block_map','builder_block_countdown','builder_block_schedule',
          'builder_block_couple','builder_block_gifts','builder_block_dresscode',
          'builder_block_photos','builder_block_text','builder_block_misc',
          'view_guests','manage_guests',
          'view_photos','delete_photos',
          'view_analytics',
          'use_planner','planner_checklist','planner_budget','planner_vendors','planner_timeline',
          'planner_calendar','planner_calendar_alerts','planner_seating','planner_seating_assign',
          'view_users','manage_users','manage_plan',
        ],
      },
      {
        id: basicPlanId, name: 'Basic',
        price_usd: 19, price_gtq: 150,
        max_events: 1, max_guests: 200, max_users: 1,
        perms: [
          // Events: create & edit only
          'view_events','create_event','edit_event',
          // Invitations: create, edit, publish — no delete
          'view_invitations','create_invitation','edit_invitation','publish_invitation',
          // Builder: core blocks only
          'use_builder',
          'builder_block_hero','builder_block_text','builder_block_rsvp',
          'builder_block_map','builder_block_countdown',
          // Guests
          'view_guests','manage_guests',
          // Photos: view only
          'view_photos',
          // Planner: checklist + calendar (view only, no alerts)
          'use_planner','planner_checklist','planner_calendar',
        ],
      },
      {
        id: proPlanId, name: 'Pro',
        price_usd: 39, price_gtq: 300,
        max_events: 5, max_guests: 1000, max_users: 3,
        perms: [
          // Events: full CRUD
          'view_events','create_event','edit_event','delete_event',
          // Invitations: full CRUD
          'view_invitations','create_invitation','edit_invitation','delete_invitation','publish_invitation',
          // Builder: all blocks
          'use_builder',
          'builder_block_hero','builder_block_gallery','builder_block_video','builder_block_music',
          'builder_block_rsvp','builder_block_map','builder_block_countdown','builder_block_schedule',
          'builder_block_couple','builder_block_gifts','builder_block_dresscode',
          'builder_block_photos','builder_block_text','builder_block_misc',
          // Guests
          'view_guests','manage_guests',
          // Photos
          'view_photos','delete_photos',
          // Analytics
          'view_analytics',
          // Planner: checklist + budget + vendors + calendar con alertas + mesas
          'use_planner','planner_checklist','planner_budget','planner_vendors',
          'planner_calendar','planner_calendar_alerts','planner_seating','planner_seating_assign',
          // Team
          'view_users','manage_users','manage_plan',
        ],
      },
      {
        id: agencyPlanId, name: 'Agency',
        price_usd: 89, price_gtq: 685,
        max_events: null, max_guests: null, max_users: null,
        perms: [
          // Everything Pro has + timeline planner
          'view_events','create_event','edit_event','delete_event',
          'view_invitations','create_invitation','edit_invitation','delete_invitation','publish_invitation',
          'use_builder',
          'builder_block_hero','builder_block_gallery','builder_block_video','builder_block_music',
          'builder_block_rsvp','builder_block_map','builder_block_countdown','builder_block_schedule',
          'builder_block_couple','builder_block_gifts','builder_block_dresscode',
          'builder_block_photos','builder_block_text','builder_block_misc',
          'view_guests','manage_guests',
          'view_photos','delete_photos',
          'view_analytics',
          'use_planner','planner_checklist','planner_budget','planner_vendors','planner_timeline',
          'planner_calendar','planner_calendar_alerts','planner_seating','planner_seating_assign',
          'view_users','manage_users','manage_plan',
        ],
      },
    ];

    for (const plan of plans) {
      await conn.query(
        'INSERT IGNORE INTO plans (id, name, price_usd, price_gtq, max_events, max_guests, max_users) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [plan.id, plan.name, plan.price_usd, plan.price_gtq, plan.max_events, plan.max_guests, plan.max_users]
      );
      await assignPerms(conn, 'plan_permissions', 'plan_id', plan.id, plan.perms);
    }
    console.log('Plans seeded.');

    // ── 5. SuperAdmin user ────────────────────────────────────
    const superAdminId   = uuidv4();
    const superAdminHash = await bcrypt.hash('roberto@140682', 12);
    await conn.query(
      `INSERT IGNORE INTO users (id, tenant_id, role_id, name, email, password_hash, status)
       VALUES (?, NULL, ?, 'Super Admin', 'roberto.estrada.c@gmail.com', ?, 'active')`,
      [superAdminId, superAdminRoleId, superAdminHash]
    );
    //console.log('SuperAdmin seeded — superadmin@invitaciones.app / Admin@1234!');

    // ── 6. Demo tenant (Pro plan) ─────────────────────────────
    const demoTenantId = uuidv4();
    await conn.query(
      `INSERT IGNORE INTO tenants (id, name, subdomain, status) VALUES (?, 'Demo Company', 'demo', 'active')`,
      [demoTenantId]
    );

    const demoOwnerId = uuidv4();
    const demoHash    = await bcrypt.hash('MAjo@2026@', 12);
    await conn.query(
      `INSERT IGNORE INTO users (id, tenant_id, role_id, name, email, password_hash, status)
       VALUES (?, ?, ?, 'Maria Jose', 'majocrm1@gmail.com', ?, 'active')`,
      [demoOwnerId, demoTenantId, ownerRoleId, demoHash]
    );

    const now = new Date();
    const expires = new Date(now);
    expires.setFullYear(expires.getFullYear() + 1);
    await conn.query(
      `INSERT IGNORE INTO subscriptions (id, tenant_id, plan_id, starts_at, expires_at, status)
       VALUES (?, ?, ?, ?, ?, 'active')`,
      [uuidv4(), demoTenantId, proPlanId, now, expires]
    );
    //console.log('Demo tenant seeded — owner@demo.com / Demo@1234! (Pro plan)');

    console.log('\nSeed completed successfully!');
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

seed();
