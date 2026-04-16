const PlannerModel = require('./planner.model');
const EventsModel  = require('../events/events.model');
const AppError     = require('../../utils/AppError');

const PlannerService = {
  // ── Plans ──────────────────────────────────────────────────
  async getAll(tenantId) {
    return PlannerModel.findAllByTenant(tenantId);
  },

  async getByEvent(eventId, tenantId) {
    const event = await EventsModel.findById(eventId, tenantId);
    if (!event) throw new AppError('Event not found', 404);
    return PlannerModel.findPlanByEvent(eventId, tenantId);
  },

  async getById(planId, tenantId) {
    const plan = await PlannerModel.findPlanById(planId, tenantId);
    if (!plan) throw new AppError('Plan not found', 404);
    return plan;
  },

  async create({ event_id, tenant_id, event_type, budget_total, notes }) {
    const event = await EventsModel.findById(event_id, tenant_id);
    if (!event) throw new AppError('Event not found', 404);
    const existing = await PlannerModel.findPlanByEvent(event_id, tenant_id);
    if (existing) throw new AppError('This event already has a plan', 409);
    return PlannerModel.createPlan({ event_id, tenant_id, event_type, budget_total, notes });
  },

  async update(planId, tenantId, data) {
    const plan = await PlannerModel.findPlanById(planId, tenantId);
    if (!plan) throw new AppError('Plan not found', 404);
    return PlannerModel.updatePlan(planId, tenantId, data);
  },

  async delete(planId, tenantId) {
    const plan = await PlannerModel.findPlanById(planId, tenantId);
    if (!plan) throw new AppError('Plan not found', 404);
    await PlannerModel.deletePlan(planId, tenantId);
  },

  // ── Tasks ──────────────────────────────────────────────────
  async getTasks(planId, tenantId) {
    await this.getById(planId, tenantId);
    return PlannerModel.getTasks(planId);
  },

  async createTask(planId, tenantId, data) {
    await this.getById(planId, tenantId);
    return PlannerModel.createTask(planId, data);
  },

  async updateTask(taskId, planId, tenantId, data) {
    await this.getById(planId, tenantId);
    const updated = await PlannerModel.updateTask(taskId, planId, data);
    if (!updated) throw new AppError('Task not found', 404);
    return updated;
  },

  async deleteTask(taskId, planId, tenantId) {
    await this.getById(planId, tenantId);
    await PlannerModel.deleteTask(taskId, planId);
  },

  // ── Budget ─────────────────────────────────────────────────
  async getBudget(planId, tenantId) {
    await this.getById(planId, tenantId);
    const items = await PlannerModel.getBudgetItems(planId);
    const plan  = await PlannerModel.findPlanById(planId, tenantId);
    const totalEstimated = items.reduce((s, i) => s + Number(i.estimated_cost), 0);
    const totalActual    = items.reduce((s, i) => s + Number(i.actual_cost || 0), 0);
    return {
      budget_total: plan.budget_total,
      total_estimated: totalEstimated,
      total_actual: totalActual,
      balance: plan.budget_total ? plan.budget_total - totalEstimated : null,
      items,
    };
  },

  async createBudgetItem(planId, tenantId, data) {
    await this.getById(planId, tenantId);
    return PlannerModel.createBudgetItem(planId, data);
  },

  async updateBudgetItem(itemId, planId, tenantId, data) {
    await this.getById(planId, tenantId);
    const updated = await PlannerModel.updateBudgetItem(itemId, planId, data);
    if (!updated) throw new AppError('Budget item not found', 404);
    return updated;
  },

  async deleteBudgetItem(itemId, planId, tenantId) {
    await this.getById(planId, tenantId);
    await PlannerModel.deleteBudgetItem(itemId, planId);
  },

  // ── Vendors ────────────────────────────────────────────────
  async getVendors(planId, tenantId) {
    await this.getById(planId, tenantId);
    return PlannerModel.getVendors(planId);
  },

  async createVendor(planId, tenantId, data) {
    await this.getById(planId, tenantId);
    return PlannerModel.createVendor(planId, data);
  },

  async updateVendor(vendorId, planId, tenantId, data) {
    await this.getById(planId, tenantId);
    const updated = await PlannerModel.updateVendor(vendorId, planId, data);
    if (!updated) throw new AppError('Vendor not found', 404);
    return updated;
  },

  async deleteVendor(vendorId, planId, tenantId) {
    await this.getById(planId, tenantId);
    await PlannerModel.deleteVendor(vendorId, planId);
  },

  // ── Timeline ───────────────────────────────────────────────
  async getTimeline(planId, tenantId) {
    await this.getById(planId, tenantId);
    return PlannerModel.getTimeline(planId);
  },

  async createTimelineItem(planId, tenantId, data) {
    await this.getById(planId, tenantId);
    return PlannerModel.createTimelineItem(planId, data);
  },

  async updateTimelineItem(itemId, planId, tenantId, data) {
    await this.getById(planId, tenantId);
    const updated = await PlannerModel.updateTimelineItem(itemId, planId, data);
    if (!updated) throw new AppError('Timeline item not found', 404);
    return updated;
  },

  async deleteTimelineItem(itemId, planId, tenantId) {
    await this.getById(planId, tenantId);
    await PlannerModel.deleteTimelineItem(itemId, planId);
  },

  // ── Calendar ───────────────────────────────────────────────
  async getCalendarEntries(planId, tenantId) {
    await this.getById(planId, tenantId);
    return PlannerModel.getCalendarEntries(planId);
  },

  async createCalendarEntry(planId, tenantId, { title, type, date, description }) {
    await this.getById(planId, tenantId);
    if (!title || !title.trim()) throw new AppError('title is required', 422);
    if (!date || isNaN(Date.parse(date))) throw new AppError('date must be a valid ISO 8601 date', 422);
    return PlannerModel.createCalendarEntry(planId, { title: title.trim(), type, date, description });
  },

  async updateCalendarEntry(entryId, planId, tenantId, data) {
    await this.getById(planId, tenantId);
    const updated = await PlannerModel.updateCalendarEntry(entryId, planId, data);
    if (!updated) throw new AppError('Calendar entry not found', 404);
    return updated;
  },

  async deleteCalendarEntry(entryId, planId, tenantId) {
    await this.getById(planId, tenantId);
    await PlannerModel.deleteCalendarEntry(entryId, planId);
  },

  async getActiveAlerts(tenantId) {
    return PlannerModel.getActiveAlerts(tenantId);
  },

  async dismissAlert(entryId, tenantId) {
    const updated = await PlannerModel.dismissAlert(entryId, tenantId);
    if (!updated) throw new AppError('Alert not found', 404);
    return updated;
  },

  // ── Seating ────────────────────────────────────────────────
  async getSeatingTables(planId, tenantId) {
    await this.getById(planId, tenantId);
    return PlannerModel.getSeatingTables(planId);
  },

  async createSeatingTable(planId, tenantId, data) {
    await this.getById(planId, tenantId);
    if (data.is_bride_table) {
      const tables = await PlannerModel.getSeatingTables(planId);
      if (tables.some(t => t.is_bride_table)) throw new AppError('A bride table already exists for this plan', 409);
    }
    return PlannerModel.createSeatingTable(planId, data);
  },

  async updateSeatingTable(tableId, planId, tenantId, data) {
    await this.getById(planId, tenantId);
    const updated = await PlannerModel.updateSeatingTable(tableId, planId, data);
    if (!updated) throw new AppError('Table not found', 404);
    return updated;
  },

  async deleteSeatingTable(tableId, planId, tenantId) {
    await this.getById(planId, tenantId);
    await PlannerModel.deleteSeatingTable(tableId, planId);
  },

  async assignSeat(seatId, tableId, planId, tenantId, guestId) {
    await this.getById(planId, tenantId);
    // Check guest not already assigned in this plan
    const tables = await PlannerModel.getSeatingTables(planId);
    for (const table of tables) {
      for (const seat of table.seats) {
        if (seat.assignment && seat.assignment.guest_id === guestId && seat.id !== seatId) {
          throw new AppError('Guest is already assigned to a seat in this plan', 409);
        }
      }
    }
    return PlannerModel.assignSeat(seatId, tableId, planId, guestId);
  },

  async unassignSeat(seatId, tableId, planId, tenantId) {
    await this.getById(planId, tenantId);
    return PlannerModel.unassignSeat(seatId, tableId, planId);
  },
};

module.exports = PlannerService;
