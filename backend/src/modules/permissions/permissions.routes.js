const { Router } = require('express');
const PermissionsController = require('./permissions.controller');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const validate = require('../../middlewares/validate');
const { createPermissionSchema, updatePermissionSchema } = require('./permissions.validation');

// Permission modules definition — used by admin UI for checkbox grouping
const PERMISSION_MODULES = [
  { module: 'Eventos',       keys: ['view_events','create_event','edit_event','delete_event'] },
  { module: 'Invitaciones',  keys: ['view_invitations','create_invitation','edit_invitation','delete_invitation','publish_invitation'] },
  { module: 'Builder',       keys: ['use_builder','builder_block_hero','builder_block_gallery','builder_block_video','builder_block_music','builder_block_rsvp','builder_block_map','builder_block_countdown','builder_block_schedule','builder_block_couple','builder_block_gifts','builder_block_dresscode','builder_block_photos','builder_block_text','builder_block_gif','builder_block_misc'] },
  { module: 'Invitados',     keys: ['view_guests','manage_guests'] },
  { module: 'Fotos',         keys: ['view_photos','delete_photos'] },
  { module: 'Analiticas',    keys: ['view_analytics'] },
  { module: 'Planificador',  keys: ['use_planner','planner_checklist','planner_budget','planner_vendors','planner_timeline','planner_calendar','planner_calendar_alerts','planner_seating','planner_seating_assign'] },
  { module: 'Equipo',        keys: ['view_users','manage_users'] },
  { module: 'Suscripcion',   keys: ['manage_plan'] },
  { module: 'SaaS Admin',    keys: ['manage_tenants','manage_plans','manage_templates','manage_roles','view_global_stats'] },
];

const router = Router();

router.use(authenticate);

// Grouped permissions for admin UI checkboxes
router.get('/grouped', async (req, res, next) => {
  try {
    const { pool } = require('../../database/connection');
    const [allPerms] = await pool.query('SELECT id, key_name, description FROM permissions ORDER BY key_name');
    const permMap = Object.fromEntries(allPerms.map(p => [p.key_name, p]));

    const grouped = PERMISSION_MODULES.map(({ module, keys }) => ({
      module,
      permissions: keys.map(k => permMap[k]).filter(Boolean),
    }));

    res.json({ success: true, data: grouped });
  } catch (err) { next(err); }
});

router.get('/',     PermissionsController.getAll);
router.get('/:id',  PermissionsController.getById);
router.post('/',    authorize('manage_roles'), validate(createPermissionSchema), PermissionsController.create);
router.put('/:id',  authorize('manage_roles'), validate(updatePermissionSchema), PermissionsController.update);
router.delete('/:id', authorize('manage_roles'),                                 PermissionsController.delete);

module.exports = router;
