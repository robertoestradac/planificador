const { pool } = require('../../database/connection');
const { v4: uuidv4 } = require('uuid');

// ── Checklist templates por tipo de evento ────────────────────
const TASK_TEMPLATES = {
  boda: [
    { category: 'Lugar/Ubicación', title: 'Definir y reservar el lugar de la ceremonia' },
    { category: 'Lugar/Ubicación', title: 'Definir y reservar el lugar de la recepción' },
    { category: 'Lugar/Ubicación', title: 'Visitar y confirmar el lugar' },
    { category: 'Fotografía',      title: 'Contratar fotógrafo' },
    { category: 'Fotografía',      title: 'Contratar videógrafo' },
    { category: 'Fotografía',      title: 'Sesión de fotos pre-boda' },
    { category: 'Catering',        title: 'Seleccionar y contratar catering' },
    { category: 'Catering',        title: 'Cata de menú' },
    { category: 'Catering',        title: 'Definir pastel de bodas' },
    { category: 'Música',          title: 'Contratar DJ o banda' },
    { category: 'Música',          title: 'Definir playlist y canciones especiales' },
    { category: 'Decoración',      title: 'Contratar decorador floral' },
    { category: 'Decoración',      title: 'Definir centros de mesa' },
    { category: 'Decoración',      title: 'Arreglo floral para ceremonia' },
    { category: 'Vestuario',       title: 'Comprar/rentar vestido de novia' },
    { category: 'Vestuario',       title: 'Comprar/rentar traje del novio' },
    { category: 'Vestuario',       title: 'Vestidos de damas de honor' },
    { category: 'Invitaciones',    title: 'Diseñar y enviar invitaciones' },
    { category: 'Invitaciones',    title: 'Confirmar lista de invitados' },
    { category: 'Invitaciones',    title: 'Gestionar RSVPs' },
    { category: 'Transporte',      title: 'Contratar transporte para novios' },
    { category: 'Transporte',      title: 'Coordinar transporte de invitados' },
    { category: 'Legal/Documentos', title: 'Trámites legales del matrimonio civil' },
    { category: 'Legal/Documentos', title: 'Contratar seguro de evento' },
    { category: 'Otros',           title: 'Recuerdos para invitados' },
    { category: 'Otros',           title: 'Planificar luna de miel' },
    { category: 'Otros',           title: 'Lista de regalos / mesa de regalos' },
    { category: 'Otros',           title: 'Ensayo de la ceremonia' },
  ],
  xv_anos: [
    { category: 'Lugar/Ubicación', title: 'Reservar salón de eventos' },
    { category: 'Lugar/Ubicación', title: 'Visitar y confirmar el lugar' },
    { category: 'Vestuario',       title: 'Vestido de quinceañera' },
    { category: 'Vestuario',       title: 'Vestidos de chambelanes y damas' },
    { category: 'Vestuario',       title: 'Accesorios: corona, tiara, zapatos' },
    { category: 'Música',          title: 'Contratar DJ' },
    { category: 'Música',          title: 'Ensayar vals y coreografías' },
    { category: 'Música',          title: 'Seleccionar canciones especiales' },
    { category: 'Catering',        title: 'Contratar catering' },
    { category: 'Catering',        title: 'Pastel de XV años' },
    { category: 'Fotografía',      title: 'Contratar fotógrafo' },
    { category: 'Fotografía',      title: 'Contratar videógrafo' },
    { category: 'Fotografía',      title: 'Sesión de fotos previa' },
    { category: 'Decoración',      title: 'Decoración del salón' },
    { category: 'Decoración',      title: 'Mesa de dulces' },
    { category: 'Invitaciones',    title: 'Diseñar y enviar invitaciones' },
    { category: 'Invitaciones',    title: 'Confirmar lista de invitados' },
    { category: 'Otros',           title: 'Recuerdos para invitados' },
    { category: 'Otros',           title: 'Maquillaje y peinado' },
    { category: 'Otros',           title: 'Última muñeca y última muñeca' },
    { category: 'Otros',           title: 'Brindis y discursos' },
  ],
  baby_shower: [
    { category: 'Lugar/Ubicación', title: 'Definir lugar del evento (casa o salón)' },
    { category: 'Decoración',      title: 'Definir tema y paleta de colores' },
    { category: 'Decoración',      title: 'Comprar decoración temática' },
    { category: 'Decoración',      title: 'Globos y arreglos florales' },
    { category: 'Catering',        title: 'Definir menú de bocadillos' },
    { category: 'Catering',        title: 'Pastel temático' },
    { category: 'Catering',        title: 'Mesa de dulces' },
    { category: 'Invitaciones',    title: 'Diseñar y enviar invitaciones' },
    { category: 'Invitaciones',    title: 'Confirmar asistentes' },
    { category: 'Fotografía',      title: 'Contratar fotógrafo o designar responsable' },
    { category: 'Otros',           title: 'Preparar juegos y actividades' },
    { category: 'Otros',           title: 'Lista de regalos del bebé' },
    { category: 'Otros',           title: 'Recuerdos para invitadas' },
    { category: 'Otros',           title: 'Música y playlist' },
  ],
  graduacion: [
    { category: 'Lugar/Ubicación', title: 'Reservar salón o lugar de celebración' },
    { category: 'Vestuario',       title: 'Toga y birrete' },
    { category: 'Vestuario',       title: 'Outfit para la fiesta' },
    { category: 'Fotografía',      title: 'Contratar fotógrafo' },
    { category: 'Fotografía',      title: 'Sesión de fotos de graduación' },
    { category: 'Catering',        title: 'Contratar catering o buffet' },
    { category: 'Catering',        title: 'Pastel de graduación' },
    { category: 'Música',          title: 'Contratar DJ o playlist' },
    { category: 'Invitaciones',    title: 'Diseñar y enviar invitaciones' },
    { category: 'Invitaciones',    title: 'Confirmar lista de invitados' },
    { category: 'Decoración',      title: 'Decoración temática de graduación' },
    { category: 'Otros',           title: 'Recuerdos para invitados' },
    { category: 'Otros',           title: 'Discurso de graduación' },
    { category: 'Otros',           title: 'Coordinar traslado post-ceremonia' },
  ],
  corporativo: [
    { category: 'Lugar/Ubicación', title: 'Reservar venue o sala de conferencias' },
    { category: 'Lugar/Ubicación', title: 'Confirmar capacidad y layout' },
    { category: 'Lugar/Ubicación', title: 'Coordinar acceso y seguridad' },
    { category: 'Catering',        title: 'Contratar catering o coffee break' },
    { category: 'Catering',        title: 'Definir menú para almuerzo/cena' },
    { category: 'Tecnología',      title: 'Equipo AV: proyector, pantallas, micrófonos' },
    { category: 'Tecnología',      title: 'Conexión a internet y streaming' },
    { category: 'Tecnología',      title: 'Presentaciones y materiales digitales' },
    { category: 'Invitaciones',    title: 'Enviar invitaciones y agenda' },
    { category: 'Invitaciones',    title: 'Gestionar registro de asistentes' },
    { category: 'Invitaciones',    title: 'Confirmar speakers y ponentes' },
    { category: 'Fotografía',      title: 'Contratar fotógrafo corporativo' },
    { category: 'Decoración',      title: 'Señalización y branding del evento' },
    { category: 'Transporte',      title: 'Coordinar transporte de asistentes' },
    { category: 'Otros',           title: 'Materiales impresos y kits' },
    { category: 'Otros',           title: 'Ensayo general' },
    { category: 'Otros',           title: 'Plan de contingencia' },
  ],
  cumpleanos: [
    { category: 'Lugar/Ubicación', title: 'Definir lugar del evento' },
    { category: 'Catering',        title: 'Definir menú de comida' },
    { category: 'Catering',        title: 'Pastel de cumpleaños' },
    { category: 'Decoración',      title: 'Definir tema y decoración' },
    { category: 'Música',          title: 'Playlist o DJ' },
    { category: 'Invitaciones',    title: 'Enviar invitaciones' },
    { category: 'Fotografía',      title: 'Fotógrafo o responsable de fotos' },
    { category: 'Otros',           title: 'Juegos y actividades' },
    { category: 'Otros',           title: 'Recuerdos para invitados' },
  ],
  bautizo: [
    { category: 'Lugar/Ubicación', title: 'Coordinar con la iglesia o lugar de ceremonia' },
    { category: 'Lugar/Ubicación', title: 'Reservar salón para recepción' },
    { category: 'Vestuario',       title: 'Traje o vestido de bautizo' },
    { category: 'Catering',        title: 'Contratar catering' },
    { category: 'Catering',        title: 'Pastel de bautizo' },
    { category: 'Decoración',      title: 'Decoración del salón' },
    { category: 'Invitaciones',    title: 'Diseñar y enviar invitaciones' },
    { category: 'Fotografía',      title: 'Contratar fotógrafo' },
    { category: 'Otros',           title: 'Recuerdos para invitados' },
    { category: 'Otros',           title: 'Coordinar padrinos' },
  ],
  otro: [
    { category: 'Lugar/Ubicación', title: 'Definir y reservar el lugar' },
    { category: 'Catering',        title: 'Definir catering o comida' },
    { category: 'Decoración',      title: 'Planificar decoración' },
    { category: 'Invitaciones',    title: 'Enviar invitaciones' },
    { category: 'Fotografía',      title: 'Contratar fotógrafo' },
    { category: 'Otros',           title: 'Definir programa del evento' },
  ],
};

const PlannerModel = {
  // ── Plans ──────────────────────────────────────────────────
  async findPlanByEvent(eventId, tenantId) {
    const [rows] = await pool.query(
      `SELECT p.*, e.name AS event_name, e.date AS event_date
       FROM event_plans p
       JOIN events e ON e.id = p.event_id
       WHERE p.event_id = ? AND p.tenant_id = ?`,
      [eventId, tenantId]
    );
    return rows[0] || null;
  },

  async findAllByTenant(tenantId) {
    const [rows] = await pool.query(
      `SELECT p.id, p.event_id, p.event_type, p.budget_total, p.created_at,
              e.name AS event_name, e.date AS event_date,
              (SELECT COUNT(*) FROM plan_tasks WHERE plan_id = p.id) AS total_tasks,
              (SELECT COUNT(*) FROM plan_tasks WHERE plan_id = p.id AND status = 'completado') AS completed_tasks
       FROM event_plans p
       JOIN events e ON e.id = p.event_id
       WHERE p.tenant_id = ? AND e.deleted_at IS NULL
       ORDER BY e.date ASC`,
      [tenantId]
    );
    return rows;
  },

  async createPlan({ event_id, tenant_id, event_type, budget_total, notes }) {
    const id = uuidv4();
    await pool.query(
      'INSERT INTO event_plans (id, event_id, tenant_id, event_type, budget_total, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [id, event_id, tenant_id, event_type || 'otro', budget_total || null, notes || null]
    );
    // Auto-generate tasks from template
    const tasks = TASK_TEMPLATES[event_type] || TASK_TEMPLATES.otro;
    for (let i = 0; i < tasks.length; i++) {
      const t = tasks[i];
      await pool.query(
        'INSERT INTO plan_tasks (id, plan_id, category, title, sort_order) VALUES (?, ?, ?, ?, ?)',
        [uuidv4(), id, t.category, t.title, i]
      );
    }
    return this.findPlanById(id, tenant_id);
  },

  async findPlanById(id, tenantId) {
    const [rows] = await pool.query(
      `SELECT p.*, e.name AS event_name, e.date AS event_date
       FROM event_plans p JOIN events e ON e.id = p.event_id
       WHERE p.id = ? AND p.tenant_id = ?`,
      [id, tenantId]
    );
    return rows[0] || null;
  },

  async updatePlan(id, tenantId, { event_type, budget_total, notes }) {
    const updates = [];
    const values = [];
    if (event_type !== undefined)   { updates.push('event_type = ?');   values.push(event_type); }
    if (budget_total !== undefined) { updates.push('budget_total = ?'); values.push(budget_total); }
    if (notes !== undefined)        { updates.push('notes = ?');        values.push(notes); }
    if (!updates.length) return this.findPlanById(id, tenantId);
    values.push(id, tenantId);
    await pool.query(`UPDATE event_plans SET ${updates.join(', ')} WHERE id = ? AND tenant_id = ?`, values);
    return this.findPlanById(id, tenantId);
  },

  async deletePlan(id, tenantId) {
    await pool.query('DELETE FROM event_plans WHERE id = ? AND tenant_id = ?', [id, tenantId]);
  },

  // ── Tasks ──────────────────────────────────────────────────
  async getTasks(planId) {
    const [rows] = await pool.query(
      'SELECT * FROM plan_tasks WHERE plan_id = ? ORDER BY sort_order ASC, created_at ASC',
      [planId]
    );
    return rows;
  },

  async createTask(planId, { category, title, due_date, assignee, status, notes, sort_order }) {
    const id = uuidv4();
    await pool.query(
      'INSERT INTO plan_tasks (id, plan_id, category, title, due_date, assignee, status, notes, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, planId, category || 'Otros', title, due_date || null, assignee || null, status || 'pendiente', notes || null, sort_order ?? 0]
    );
    const [rows] = await pool.query('SELECT * FROM plan_tasks WHERE id = ?', [id]);
    return rows[0];
  },

  async updateTask(id, planId, fields) {
    const allowed = ['category', 'title', 'due_date', 'assignee', 'status', 'notes', 'sort_order'];
    const updates = [];
    const values = [];
    for (const key of allowed) {
      if (fields[key] !== undefined) { updates.push(`${key} = ?`); values.push(fields[key]); }
    }
    if (!updates.length) return;
    values.push(id, planId);
    await pool.query(`UPDATE plan_tasks SET ${updates.join(', ')} WHERE id = ? AND plan_id = ?`, values);
    const [rows] = await pool.query('SELECT * FROM plan_tasks WHERE id = ?', [id]);
    return rows[0];
  },

  async deleteTask(id, planId) {
    await pool.query('DELETE FROM plan_tasks WHERE id = ? AND plan_id = ?', [id, planId]);
  },

  // ── Budget ─────────────────────────────────────────────────
  async getBudgetItems(planId) {
    const [rows] = await pool.query(
      'SELECT * FROM plan_budget_items WHERE plan_id = ? ORDER BY category ASC, created_at ASC',
      [planId]
    );
    return rows;
  },

  async createBudgetItem(planId, { category, name, estimated_cost, actual_cost, payment_status, notes }) {
    const id = uuidv4();
    await pool.query(
      'INSERT INTO plan_budget_items (id, plan_id, category, name, estimated_cost, actual_cost, payment_status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, planId, category || 'Otros', name, estimated_cost || 0, actual_cost ?? null, payment_status || 'pendiente', notes || null]
    );
    const [rows] = await pool.query('SELECT * FROM plan_budget_items WHERE id = ?', [id]);
    return rows[0];
  },

  async updateBudgetItem(id, planId, fields) {
    const allowed = ['category', 'name', 'estimated_cost', 'actual_cost', 'payment_status', 'notes'];
    const updates = [];
    const values = [];
    for (const key of allowed) {
      if (fields[key] !== undefined) { updates.push(`${key} = ?`); values.push(fields[key]); }
    }
    if (!updates.length) return;
    values.push(id, planId);
    await pool.query(`UPDATE plan_budget_items SET ${updates.join(', ')} WHERE id = ? AND plan_id = ?`, values);
    const [rows] = await pool.query('SELECT * FROM plan_budget_items WHERE id = ?', [id]);
    return rows[0];
  },

  async deleteBudgetItem(id, planId) {
    await pool.query('DELETE FROM plan_budget_items WHERE id = ? AND plan_id = ?', [id, planId]);
  },

  // ── Vendors ────────────────────────────────────────────────
  async getVendors(planId) {
    const [rows] = await pool.query(
      'SELECT * FROM plan_vendors WHERE plan_id = ? ORDER BY service ASC, created_at ASC',
      [planId]
    );
    return rows;
  },

  async createVendor(planId, { service, name, phone, email, price, status, website, notes }) {
    const id = uuidv4();
    await pool.query(
      'INSERT INTO plan_vendors (id, plan_id, service, name, phone, email, price, status, website, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, planId, service, name, phone || null, email || null, price ?? null, status || 'contactado', website || null, notes || null]
    );
    const [rows] = await pool.query('SELECT * FROM plan_vendors WHERE id = ?', [id]);
    return rows[0];
  },

  async updateVendor(id, planId, fields) {
    const allowed = ['service', 'name', 'phone', 'email', 'price', 'status', 'website', 'notes'];
    const updates = [];
    const values = [];
    for (const key of allowed) {
      if (fields[key] !== undefined) { updates.push(`${key} = ?`); values.push(fields[key]); }
    }
    if (!updates.length) return;
    values.push(id, planId);
    await pool.query(`UPDATE plan_vendors SET ${updates.join(', ')} WHERE id = ? AND plan_id = ?`, values);
    const [rows] = await pool.query('SELECT * FROM plan_vendors WHERE id = ?', [id]);
    return rows[0];
  },

  async deleteVendor(id, planId) {
    await pool.query('DELETE FROM plan_vendors WHERE id = ? AND plan_id = ?', [id, planId]);
  },

  // ── Timeline ───────────────────────────────────────────────
  async getTimeline(planId) {
    const [rows] = await pool.query(
      'SELECT * FROM plan_timeline_items WHERE plan_id = ? ORDER BY start_time ASC, sort_order ASC',
      [planId]
    );
    return rows;
  },

  async createTimelineItem(planId, { start_time, end_time, activity, assignee, notes, sort_order }) {
    const id = uuidv4();
    await pool.query(
      'INSERT INTO plan_timeline_items (id, plan_id, start_time, end_time, activity, assignee, notes, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, planId, start_time, end_time || null, activity, assignee || null, notes || null, sort_order ?? 0]
    );
    const [rows] = await pool.query('SELECT * FROM plan_timeline_items WHERE id = ?', [id]);
    return rows[0];
  },

  async updateTimelineItem(id, planId, fields) {
    const allowed = ['start_time', 'end_time', 'activity', 'assignee', 'notes', 'sort_order'];
    const updates = [];
    const values = [];
    for (const key of allowed) {
      if (fields[key] !== undefined) { updates.push(`${key} = ?`); values.push(fields[key]); }
    }
    if (!updates.length) return;
    values.push(id, planId);
    await pool.query(`UPDATE plan_timeline_items SET ${updates.join(', ')} WHERE id = ? AND plan_id = ?`, values);
    const [rows] = await pool.query('SELECT * FROM plan_timeline_items WHERE id = ?', [id]);
    return rows[0];
  },

  async deleteTimelineItem(id, planId) {
    await pool.query('DELETE FROM plan_timeline_items WHERE id = ? AND plan_id = ?', [id, planId]);
  },

  // ── Calendar ───────────────────────────────────────────────
  async getCalendarEntries(planId) {
    const [rows] = await pool.query(
      'SELECT * FROM plan_calendar_entries WHERE plan_id = ? ORDER BY date ASC, created_at ASC',
      [planId]
    );
    return rows;
  },

  async createCalendarEntry(planId, { title, type, date, description }) {
    const id = uuidv4();
    await pool.query(
      'INSERT INTO plan_calendar_entries (id, plan_id, title, type, date, description) VALUES (?, ?, ?, ?, ?, ?)',
      [id, planId, title, type || 'nota', date, description || null]
    );
    const [rows] = await pool.query('SELECT * FROM plan_calendar_entries WHERE id = ?', [id]);
    return rows[0];
  },

  async updateCalendarEntry(entryId, planId, fields) {
    const allowed = ['title', 'description', 'dismissed_at', 'type', 'date'];
    const updates = [];
    const values = [];
    for (const key of allowed) {
      if (fields[key] !== undefined) { updates.push(`${key} = ?`); values.push(fields[key]); }
    }
    if (!updates.length) return null;
    values.push(entryId, planId);
    await pool.query(`UPDATE plan_calendar_entries SET ${updates.join(', ')} WHERE id = ? AND plan_id = ?`, values);
    const [rows] = await pool.query('SELECT * FROM plan_calendar_entries WHERE id = ?', [entryId]);
    return rows[0] || null;
  },

  async deleteCalendarEntry(entryId, planId) {
    await pool.query('DELETE FROM plan_calendar_entries WHERE id = ? AND plan_id = ?', [entryId, planId]);
  },

  async getActiveAlerts(tenantId) {
    const [rows] = await pool.query(
      `SELECT pce.* FROM plan_calendar_entries pce
       JOIN event_plans ep ON ep.id = pce.plan_id
       WHERE ep.tenant_id = ? AND pce.type = 'alerta' AND pce.date <= CURDATE() AND pce.dismissed_at IS NULL
       ORDER BY pce.date ASC`,
      [tenantId]
    );
    return rows;
  },

  async dismissAlert(entryId, tenantId) {
    await pool.query(
      `UPDATE plan_calendar_entries pce
       JOIN event_plans ep ON ep.id = pce.plan_id
       SET pce.dismissed_at = NOW()
       WHERE pce.id = ? AND ep.tenant_id = ?`,
      [entryId, tenantId]
    );
    const [rows] = await pool.query('SELECT * FROM plan_calendar_entries WHERE id = ?', [entryId]);
    return rows[0] || null;
  },

  // ── Seating ────────────────────────────────────────────────
  async getNextTableNumber(planId) {
    const [rows] = await pool.query(
      'SELECT table_number FROM plan_seating_tables WHERE plan_id = ? ORDER BY table_number ASC',
      [planId]
    );
    const existing = new Set(rows.map(r => r.table_number));
    let n = 1;
    while (existing.has(n)) n++;
    return n;
  },

  async getSeatingTables(planId) {
    const [tables] = await pool.query(
      'SELECT * FROM plan_seating_tables WHERE plan_id = ? ORDER BY table_number ASC',
      [planId]
    );
    if (!tables.length) return [];

    const tableIds = tables.map(t => t.id);
    const [seats] = await pool.query(
      `SELECT ps.id, ps.table_id, ps.seat_index,
              psa.id AS assignment_id, psa.guest_id, psa.is_companion, psa.companion_index,
              g.name AS guest_name, g.party_size,
              r.response AS rsvp_status
       FROM plan_seats ps
       LEFT JOIN plan_seat_assignments psa ON psa.seat_id = ps.id
       LEFT JOIN guests g ON g.id = psa.guest_id
       LEFT JOIN rsvps r ON r.guest_id = psa.guest_id
       WHERE ps.table_id IN (?)
       ORDER BY ps.seat_index ASC`,
      [tableIds]
    );

    const seatsByTable = {};
    for (const seat of seats) {
      if (!seatsByTable[seat.table_id]) seatsByTable[seat.table_id] = [];
      seatsByTable[seat.table_id].push({
        id: seat.id,
        seat_index: seat.seat_index,
        assignment: seat.assignment_id ? {
          id: seat.assignment_id,
          guest_id: seat.guest_id,
          guest_name: seat.guest_name,
          rsvp_status: seat.rsvp_status || null,
          party_size: seat.party_size || 1,
          is_companion: seat.is_companion || false,
          companion_index: seat.companion_index || null,
        } : null,
      });
    }

    return tables.map(t => ({
      ...t,
      seats: seatsByTable[t.id] || [],
    }));
  },

  async createSeatingTable(planId, { seat_count, is_bride_table, position_x, position_y }) {
    const tableNumber = await this.getNextTableNumber(planId);
    const tableId = uuidv4();
    const count = seat_count || 4;
    await pool.query(
      'INSERT INTO plan_seating_tables (id, plan_id, table_number, seat_count, is_bride_table, position_x, position_y) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [tableId, planId, tableNumber, count, is_bride_table ? 1 : 0, position_x || 0, position_y || 0]
    );
    for (let i = 0; i < count; i++) {
      await pool.query(
        'INSERT INTO plan_seats (id, table_id, seat_index) VALUES (?, ?, ?)',
        [uuidv4(), tableId, i]
      );
    }
    const tables = await this.getSeatingTables(planId);
    return tables.find(t => t.id === tableId) || null;
  },

  async updateSeatingTable(tableId, planId, fields) {
    const allowed = ['position_x', 'position_y', 'seat_count'];
    const updates = [];
    const values = [];
    for (const key of allowed) {
      if (fields[key] !== undefined && key !== 'seat_count') {
        updates.push(`${key} = ?`);
        values.push(fields[key]);
      }
    }
    if (fields.seat_count !== undefined) {
      await this.adjustSeats(tableId, planId, fields.seat_count);
      updates.push('seat_count = ?');
      values.push(fields.seat_count);
    }
    if (updates.length) {
      values.push(tableId, planId);
      await pool.query(`UPDATE plan_seating_tables SET ${updates.join(', ')} WHERE id = ? AND plan_id = ?`, values);
    }
    const tables = await this.getSeatingTables(planId);
    return tables.find(t => t.id === tableId) || null;
  },

  async deleteSeatingTable(tableId, planId) {
    await pool.query('DELETE FROM plan_seating_tables WHERE id = ? AND plan_id = ?', [tableId, planId]);
  },

  async adjustSeats(tableId, planId, newCount) {
    const [currentSeats] = await pool.query(
      `SELECT ps.id, ps.seat_index,
              psa.id AS assignment_id
       FROM plan_seats ps
       LEFT JOIN plan_seat_assignments psa ON psa.seat_id = ps.id
       WHERE ps.table_id = ?
       ORDER BY ps.seat_index ASC`,
      [tableId]
    );
    const current = currentSeats.length;
    if (newCount > current) {
      for (let i = current; i < newCount; i++) {
        await pool.query('INSERT INTO plan_seats (id, table_id, seat_index) VALUES (?, ?, ?)', [uuidv4(), tableId, i]);
      }
    } else if (newCount < current) {
      // Only delete unassigned seats from the end
      const unassigned = currentSeats.filter(s => !s.assignment_id).reverse();
      const toDelete = current - newCount;
      if (unassigned.length < toDelete) {
        const AppError = require('../../utils/AppError');
        throw new AppError(`Cannot reduce seats: ${current - unassigned.length} seats have assigned guests`, 409);
      }
      const idsToDelete = unassigned.slice(0, toDelete).map(s => s.id);
      for (const id of idsToDelete) {
        await pool.query('DELETE FROM plan_seats WHERE id = ?', [id]);
      }
    }
  },

  async assignSeat(seatId, tableId, planId, guestId, isCompanion = false, companionIndex = null) {
    // Remove any existing assignment for this seat
    await pool.query('DELETE FROM plan_seat_assignments WHERE seat_id = ?', [seatId]);
    await pool.query(
      'INSERT INTO plan_seat_assignments (id, seat_id, guest_id, plan_id, is_companion, companion_index) VALUES (?, ?, ?, ?, ?, ?)',
      [uuidv4(), seatId, guestId, planId, isCompanion ? 1 : 0, companionIndex]
    );
    const [rows] = await pool.query(
      `SELECT ps.id, ps.seat_index,
              psa.id AS assignment_id, psa.guest_id, psa.is_companion, psa.companion_index,
              g.name AS guest_name, g.party_size, r.response AS rsvp_status
       FROM plan_seats ps
       LEFT JOIN plan_seat_assignments psa ON psa.seat_id = ps.id
       LEFT JOIN guests g ON g.id = psa.guest_id
       LEFT JOIN rsvps r ON r.guest_id = psa.guest_id
       WHERE ps.id = ?`,
      [seatId]
    );
    return rows[0] || null;
  },

  async unassignSeat(seatId, tableId, planId) {
    await pool.query('DELETE FROM plan_seat_assignments WHERE seat_id = ?', [seatId]);
    const [rows] = await pool.query('SELECT * FROM plan_seats WHERE id = ?', [seatId]);
    return rows[0] || null;
  },
};

module.exports = PlannerModel;
