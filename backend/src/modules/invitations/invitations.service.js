const InvitationsModel = require('./invitations.model');
const SubscriptionsModel = require('../subscriptions/subscriptions.model');
const TemplatesModel = require('../templates/templates.model');
const EventsModel = require('../events/events.model');
const AppError = require('../../utils/AppError');
const { assertCredit } = require('../../utils/credits');
const { slugify } = require('../../utils/slugify');
const { v4: uuidv4 } = require('uuid');

const InvitationsService = {
  async create({ tenant_id, event_id, template_id, title, slug, builder_json, html, css, user }) {
    // 1. Verify active subscription exists (unless Owner)
    const isOwner = user && user.role_name === 'Owner' && user.tenant_id === tenant_id;
    
    if (!isOwner) {
      const sub = await SubscriptionsModel.findActiveByTenant(tenant_id);
      if (!sub) throw new AppError('No active subscription found', 403);
    }

    // 2. Verify event exists and belongs to tenant
    const event = await EventsModel.findById(event_id, tenant_id);
    if (!event) throw new AppError('Event not found', 404);

    // 3. Check if event already has an invitation (1 invitation per event rule)
    const existing = await InvitationsModel.findAllByTenant(tenant_id, { event_id, limit: 1 });
    if (existing.data && existing.data.length > 0) {
      throw new AppError('Este evento ya tiene una invitación. Cada evento puede tener solo 1 invitación.', 400);
    }

    // 4. Verify invitation limit (based on events limit: 1 invitation per event)
    // Owner bypasses this check
    if (!isOwner) {
      await assertCredit(tenant_id, 'invitations');
    }

    // Generate slug if not provided
    let finalSlug = slug ? slugify(slug) : slugify(title) + '-' + uuidv4().slice(0, 8);

    const slugTaken = await InvitationsModel.slugExists(finalSlug);
    if (slugTaken) {
      finalSlug = finalSlug + '-' + uuidv4().slice(0, 6);
    }

    // If a template is selected and no builder_json provided, clone template's base_json
    let finalBuilderJson = builder_json || null;
    if (template_id && !finalBuilderJson) {
      const template = await TemplatesModel.findById(template_id);
      if (template && template.base_json) {
        finalBuilderJson = template.base_json;
      }
    }

    return InvitationsModel.create({ tenant_id, event_id, template_id, title, slug: finalSlug, builder_json: finalBuilderJson, html, css });
  },

  async getAll(tenantId, filters) {
    return InvitationsModel.findAllByTenant(tenantId, filters);
  },

  async getById(id, tenantId) {
    const inv = await InvitationsModel.findById(id, tenantId);
    if (!inv) throw new AppError('Invitation not found', 404);
    return inv;
  },

  async getBySlug(slug) {
    const inv = await InvitationsModel.findBySlug(slug);
    if (!inv) throw new AppError('Invitation not found', 404);
    return inv;
  },

  async update(id, tenantId, data) {
    const inv = await InvitationsModel.findById(id, tenantId);
    if (!inv) throw new AppError('Invitation not found', 404);

    if (data.slug && data.slug !== inv.slug) {
      const newSlug = slugify(data.slug);
      const taken = await InvitationsModel.slugExists(newSlug, id);
      if (taken) throw new AppError('Slug already in use', 409);
      data.slug = newSlug;
    }

    return InvitationsModel.update(id, tenantId, data);
  },

  async saveBuilder(id, tenantId, { builder_json, html, css }) {
    const inv = await InvitationsModel.findById(id, tenantId);
    if (!inv) throw new AppError('Invitation not found', 404);
    return InvitationsModel.update(id, tenantId, { builder_json, html, css });
  },

  async publish(id, tenantId) {
    const inv = await InvitationsModel.findById(id, tenantId);
    if (!inv) throw new AppError('Invitation not found', 404);
    
    // Allow publishing if either HTML (legacy/GrapesJS) or builder_json (Custom Builder) exists
    if (!inv.html && !inv.builder_json) {
      throw new AppError('Cannot publish: invitation has no content. Use the builder first.', 400);
    }

    return InvitationsModel.update(id, tenantId, {
      status: 'published',
      published_at: new Date(),
    });
  },

  async unpublish(id, tenantId) {
    const inv = await InvitationsModel.findById(id, tenantId);
    if (!inv) throw new AppError('Invitation not found', 404);
    return InvitationsModel.update(id, tenantId, { status: 'draft' });
  },

  async delete(id, tenantId) {
    const inv = await InvitationsModel.findById(id, tenantId);
    if (!inv) throw new AppError('Invitation not found', 404);
    await InvitationsModel.softDelete(id, tenantId);
  },
};

module.exports = InvitationsService;
