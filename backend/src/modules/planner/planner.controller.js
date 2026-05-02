const PlannerService = require('./planner.service');
const { success, created } = require('../../utils/response');

const PlannerController = {
  // ── Plans ──────────────────────────────────────────────────
  async getAll(req, res, next) {
    try {
      const data = await PlannerService.getAll(req.tenantId);
      return success(res, data);
    } catch (err) { next(err); }
  },

  async getByEvent(req, res, next) {
    try {
      const data = await PlannerService.getByEvent(req.params.eventId, req.tenantId);
      return success(res, data);
    } catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try {
      const data = await PlannerService.getById(req.params.planId, req.tenantId);
      return success(res, data);
    } catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      const data = await PlannerService.create({ ...req.body, tenant_id: req.tenantId });
      return created(res, data, 'Plan created');
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      const data = await PlannerService.update(req.params.planId, req.tenantId, req.body);
      return success(res, data, 'Plan updated');
    } catch (err) { next(err); }
  },

  async delete(req, res, next) {
    try {
      await PlannerService.delete(req.params.planId, req.tenantId);
      return success(res, null, 'Plan deleted');
    } catch (err) { next(err); }
  },

  // ── Tasks ──────────────────────────────────────────────────
  async getTasks(req, res, next) {
    try {
      const data = await PlannerService.getTasks(req.params.planId, req.tenantId);
      return success(res, data);
    } catch (err) { next(err); }
  },

  async createTask(req, res, next) {
    try {
      const data = await PlannerService.createTask(req.params.planId, req.tenantId, req.body);
      return created(res, data, 'Task created');
    } catch (err) { next(err); }
  },

  async updateTask(req, res, next) {
    try {
      const data = await PlannerService.updateTask(req.params.taskId, req.params.planId, req.tenantId, req.body);
      return success(res, data, 'Task updated');
    } catch (err) { next(err); }
  },

  async deleteTask(req, res, next) {
    try {
      await PlannerService.deleteTask(req.params.taskId, req.params.planId, req.tenantId);
      return success(res, null, 'Task deleted');
    } catch (err) { next(err); }
  },

  // ── Budget ─────────────────────────────────────────────────
  async getBudget(req, res, next) {
    try {
      const data = await PlannerService.getBudget(req.params.planId, req.tenantId);
      return success(res, data);
    } catch (err) { next(err); }
  },

  async createBudgetItem(req, res, next) {
    try {
      const data = await PlannerService.createBudgetItem(req.params.planId, req.tenantId, req.body);
      return created(res, data, 'Budget item created');
    } catch (err) { next(err); }
  },

  async updateBudgetItem(req, res, next) {
    try {
      const data = await PlannerService.updateBudgetItem(req.params.itemId, req.params.planId, req.tenantId, req.body);
      return success(res, data, 'Budget item updated');
    } catch (err) { next(err); }
  },

  async deleteBudgetItem(req, res, next) {
    try {
      await PlannerService.deleteBudgetItem(req.params.itemId, req.params.planId, req.tenantId);
      return success(res, null, 'Budget item deleted');
    } catch (err) { next(err); }
  },

  // ── Vendors ────────────────────────────────────────────────
  async getVendors(req, res, next) {
    try {
      const data = await PlannerService.getVendors(req.params.planId, req.tenantId);
      return success(res, data);
    } catch (err) { next(err); }
  },

  async createVendor(req, res, next) {
    try {
      const data = await PlannerService.createVendor(req.params.planId, req.tenantId, req.body);
      return created(res, data, 'Vendor created');
    } catch (err) { next(err); }
  },

  async updateVendor(req, res, next) {
    try {
      const data = await PlannerService.updateVendor(req.params.vendorId, req.params.planId, req.tenantId, req.body);
      return success(res, data, 'Vendor updated');
    } catch (err) { next(err); }
  },

  async deleteVendor(req, res, next) {
    try {
      await PlannerService.deleteVendor(req.params.vendorId, req.params.planId, req.tenantId);
      return success(res, null, 'Vendor deleted');
    } catch (err) { next(err); }
  },

  // ── Timeline ───────────────────────────────────────────────
  async getTimeline(req, res, next) {
    try {
      const data = await PlannerService.getTimeline(req.params.planId, req.tenantId);
      return success(res, data);
    } catch (err) { next(err); }
  },

  async createTimelineItem(req, res, next) {
    try {
      const data = await PlannerService.createTimelineItem(req.params.planId, req.tenantId, req.body);
      return created(res, data, 'Timeline item created');
    } catch (err) { next(err); }
  },

  async updateTimelineItem(req, res, next) {
    try {
      const data = await PlannerService.updateTimelineItem(req.params.itemId, req.params.planId, req.tenantId, req.body);
      return success(res, data, 'Timeline item updated');
    } catch (err) { next(err); }
  },

  async deleteTimelineItem(req, res, next) {
    try {
      await PlannerService.deleteTimelineItem(req.params.itemId, req.params.planId, req.tenantId);
      return success(res, null, 'Timeline item deleted');
    } catch (err) { next(err); }
  },

  // ── Calendar ───────────────────────────────────────────────
  async getCalendarEntries(req, res, next) {
    try {
      const data = await PlannerService.getCalendarEntries(req.params.planId, req.tenantId);
      return success(res, data);
    } catch (err) { next(err); }
  },

  async createCalendarEntry(req, res, next) {
    try {
      const data = await PlannerService.createCalendarEntry(req.params.planId, req.tenantId, req.body);
      return created(res, data, 'Calendar entry created');
    } catch (err) { next(err); }
  },

  async updateCalendarEntry(req, res, next) {
    try {
      const data = await PlannerService.updateCalendarEntry(req.params.entryId, req.params.planId, req.tenantId, req.body);
      return success(res, data, 'Calendar entry updated');
    } catch (err) { next(err); }
  },

  async deleteCalendarEntry(req, res, next) {
    try {
      await PlannerService.deleteCalendarEntry(req.params.entryId, req.params.planId, req.tenantId);
      return success(res, null, 'Calendar entry deleted');
    } catch (err) { next(err); }
  },

  async getActiveAlerts(req, res, next) {
    try {
      const data = await PlannerService.getActiveAlerts(req.tenantId);
      return success(res, data);
    } catch (err) { next(err); }
  },

  async dismissAlert(req, res, next) {
    try {
      const data = await PlannerService.dismissAlert(req.params.entryId, req.tenantId);
      return success(res, data, 'Alert dismissed');
    } catch (err) { next(err); }
  },

  // ── Seating ────────────────────────────────────────────────
  async getSeatingTables(req, res, next) {
    try {
      const data = await PlannerService.getSeatingTables(req.params.planId, req.tenantId);
      return success(res, data);
    } catch (err) { next(err); }
  },

  async createSeatingTable(req, res, next) {
    try {
      const data = await PlannerService.createSeatingTable(req.params.planId, req.tenantId, req.body);
      return created(res, data, 'Table created');
    } catch (err) { next(err); }
  },

  async updateSeatingTable(req, res, next) {
    try {
      const data = await PlannerService.updateSeatingTable(req.params.tableId, req.params.planId, req.tenantId, req.body);
      return success(res, data, 'Table updated');
    } catch (err) { next(err); }
  },

  async deleteSeatingTable(req, res, next) {
    try {
      await PlannerService.deleteSeatingTable(req.params.tableId, req.params.planId, req.tenantId);
      return success(res, null, 'Table deleted');
    } catch (err) { next(err); }
  },

  async assignSeat(req, res, next) {
    try {
      const { guest_id, is_companion, companion_index } = req.body;
      const data = await PlannerService.assignSeat(
        req.params.seatId, 
        req.params.tableId, 
        req.params.planId, 
        req.tenantId, 
        guest_id,
        is_companion || false,
        companion_index || null
      );
      return success(res, data, 'Seat assigned');
    } catch (err) { next(err); }
  },

  async unassignSeat(req, res, next) {
    try {
      const data = await PlannerService.unassignSeat(req.params.seatId, req.params.tableId, req.params.planId, req.tenantId);
      return success(res, data, 'Seat unassigned');
    } catch (err) { next(err); }
  },
};

module.exports = PlannerController;
