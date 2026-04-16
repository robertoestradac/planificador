const { Router } = require('express');
const TemplatesController = require('./templates.controller');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const validate = require('../../middlewares/validate');
const { createTemplateSchema, updateTemplateSchema } = require('./templates.validation');

const router = Router();

// Public: list active templates
router.get('/public', TemplatesController.getAll);
router.get('/public/:id', TemplatesController.getById);

router.use(authenticate);

router.get('/',     TemplatesController.getAll);
router.get('/:id',  TemplatesController.getById);
router.post('/',    authorize('manage_templates'), validate(createTemplateSchema), TemplatesController.create);
router.put('/:id',    authorize('manage_templates'), validate(updateTemplateSchema), TemplatesController.update);
router.patch('/:id/builder', authorize('manage_templates'),                        TemplatesController.saveBuilder);
router.delete('/:id', authorize('manage_templates'),                               TemplatesController.delete);

module.exports = router;
