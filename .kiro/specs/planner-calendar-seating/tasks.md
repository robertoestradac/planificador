# Implementation Plan: Planner Calendar & Seating

## Overview

Add two new tabs to `/dashboard/planner/[planId]`: a monthly calendar with notes/alerts, and an interactive seating chart with HTML5 drag & drop. Includes 4 new DB tables, full backend CRUD, a dashboard alert badge, and property-based tests with fast-check.

## Tasks

- [ ] 1. DB migration — add 4 new tables
  - Add `plan_calendar_entries`, `plan_seating_tables`, `plan_seats`, and `plan_seat_assignments` table definitions to the `schema` string in `backend/src/database/migrate.js`, following the exact DDL from the design document.
  - Add the same 4 tables to `backend/src/database/migrate_fresh.js` (drop + recreate order must respect FK dependencies: drop assignments → seats → tables → calendar entries before recreating).
  - Run `npm run migrate:fresh` inside the backend container / locally to apply the schema.
  - _Requirements: 4.1, 10.1_

- [x] 2. Backend model — calendar methods
  - Add the following methods to `PlannerModel` in `backend/src/modules/planner/planner.model.js`:
    - `getCalendarEntries(planId)` — SELECT all entries for plan ordered by date ASC.
    - `createCalendarEntry(planId, { title, type, date, description })` — INSERT + return created row.
    - `updateCalendarEntry(entryId, planId, fields)` — dynamic UPDATE (title, description, dismissed_at) + return updated row.
    - `deleteCalendarEntry(entryId, planId)` — DELETE WHERE id AND plan_id.
    - `getActiveAlerts(tenantId)` — JOIN event_plans ON tenant_id, WHERE type='alerta' AND date <= CURDATE() AND dismissed_at IS NULL.
    - `dismissAlert(entryId, tenantId)` — UPDATE dismissed_at = NOW() via JOIN to verify tenant ownership.
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ]* 2.1 Write property test — Property 7: calendar entries returned in ascending date order
    - Use `fc.array(fc.record({ date: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }) }))` to generate entry sets.
    - Verify that `getCalendarEntries` result dates are sorted ascending.
    - **Property 7: Calendar entries are returned in ascending date order**
    - **Validates: Requirements 4.3**

  - [ ]* 2.2 Write property test — Property 8: alerts endpoint filters correctly
    - Use `fc.array(fc.record({ type: fc.constantFrom('nota','alerta'), date: fc.date(), dismissed_at: fc.option(fc.date()) }))` to generate entry sets.
    - Verify that `getActiveAlerts` returns only entries where type='alerta', date <= today, dismissed_at IS NULL.
    - **Property 8: Alerts endpoint filters correctly**
    - **Validates: Requirements 4.4**

- [x] 3. Backend model — seating methods
  - Add the following methods to `PlannerModel`:
    - `getSeatingTables(planId)` — SELECT tables with nested seats and assignments (JOIN plan_seats LEFT JOIN plan_seat_assignments LEFT JOIN guests LEFT JOIN rsvps), return array matching the response shape in the design.
    - `createSeatingTable(planId, { seat_count, is_bride_table, position_x, position_y })` — INSERT table, bulk INSERT seats (seat_index 0..N-1), return full table with seats via `getSeatingTables` filtered by new id.
    - `updateSeatingTable(tableId, planId, fields)` — dynamic UPDATE (position_x, position_y, seat_count); when seat_count changes call `adjustSeats`.
    - `deleteSeatingTable(tableId, planId)` — DELETE (cascades to seats and assignments via FK).
    - `adjustSeats(tableId, planId, newCount)` — if newCount > current: INSERT new seats; if newCount < current: DELETE only unassigned seats (preserve assigned), reject if remaining free seats < reduction needed.
    - `assignSeat(seatId, tableId, planId, guestId)` — INSERT INTO plan_seat_assignments (upsert pattern: delete existing for seat then insert).
    - `unassignSeat(seatId, tableId, planId)` — DELETE FROM plan_seat_assignments WHERE seat_id.
    - `getNextTableNumber(planId)` — SELECT table_number FROM plan_seating_tables WHERE plan_id, return lowest positive integer not in set.
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

  - [ ]* 3.1 Write property test — Property 10: table numbering assigns lowest available number
    - Use `fc.array(fc.nat({ max: 20 }))` to generate sets of existing table numbers.
    - Verify that `getNextTableNumber` logic returns `min({ 1..∞ } \ existingSet)`.
    - **Property 10: Table numbering assigns the lowest available number**
    - **Validates: Requirements 6.1, 6.2**

  - [ ]* 3.2 Write property test — Property 12: seat count adjustment preserves assigned seats
    - Use `fc.record({ N: fc.nat({ min: 1, max: 20 }), A: fc.nat({ min: 0, max: 20 }) }).filter(({ N, A }) => A <= N)` to generate (total seats, assigned seats) pairs.
    - Verify that reducing to M >= A succeeds with M seats and A assignments intact; reducing to M < A is rejected.
    - **Property 12: Seat count adjustment preserves assigned seats**
    - **Validates: Requirements 6.5, 10.5**

- [x] 4. Backend service — calendar and seating service methods
  - Add to `PlannerService` in `backend/src/modules/planner/planner.service.js`:
    - `getCalendarEntries(planId, tenantId)` — verify plan ownership (reuse `getById`), then call model.
    - `createCalendarEntry(planId, tenantId, data)` — validate title non-empty/non-whitespace (throw AppError 422), validate date is valid ISO date (throw AppError 422), call model.
    - `updateCalendarEntry(entryId, planId, tenantId, data)` — verify plan ownership, call model, throw 404 if not found.
    - `deleteCalendarEntry(entryId, planId, tenantId)` — verify plan ownership, call model.
    - `getActiveAlerts(tenantId)` — call model directly (tenant-scoped).
    - `dismissAlert(entryId, tenantId)` — call model, throw 404 if not found.
    - `getSeatingTables(planId, tenantId)` — verify plan ownership, call model.
    - `createSeatingTable(planId, tenantId, data)` — verify plan ownership; if is_bride_table check for existing bride table (409); call model.
    - `updateSeatingTable(tableId, planId, tenantId, data)` — verify plan ownership, call model, throw 404 if not found.
    - `deleteSeatingTable(tableId, planId, tenantId)` — verify plan ownership, call model.
    - `assignSeat(seatId, tableId, planId, tenantId, guestId)` — verify plan ownership; check guest not already assigned in plan (409); call model.
    - `unassignSeat(seatId, tableId, planId, tenantId)` — verify plan ownership, call model.
  - _Requirements: 4.6, 4.7, 4.8, 6.5, 7.3, 10.8, 10.9, 10.10_

- [x] 5. Backend controller — calendar and seating controller methods
  - Add to `PlannerController` in `backend/src/modules/planner/planner.controller.js`:
    - `getCalendarEntries`, `createCalendarEntry`, `updateCalendarEntry`, `deleteCalendarEntry`
    - `getActiveAlerts`, `dismissAlert`
    - `getSeatingTables`, `createSeatingTable`, `updateSeatingTable`, `deleteSeatingTable`
    - `assignSeat`, `unassignSeat`
  - Each method follows the existing pattern: `try { const data = await PlannerService.method(...); return success/created(res, data, msg); } catch(err) { next(err); }`.
  - `createCalendarEntry` and `createSeatingTable` use `created(res, data, msg)` (201).
  - `assignSeat` uses `success(res, data, msg)` (200) per design spec.
  - _Requirements: 4.1, 10.1_

- [x] 6. Backend routes — calendar, seating, and dashboard alerts
  - Add to `backend/src/modules/planner/planner.routes.js`:
    ```
    // Calendar
    GET    /:planId/calendar              → ctrl.getCalendarEntries
    POST   /:planId/calendar              → ctrl.createCalendarEntry
    PUT    /:planId/calendar/:entryId     → ctrl.updateCalendarEntry
    DELETE /:planId/calendar/:entryId     → ctrl.deleteCalendarEntry

    // Seating
    GET    /:planId/seating/tables                              → ctrl.getSeatingTables
    POST   /:planId/seating/tables                             → ctrl.createSeatingTable
    PUT    /:planId/seating/tables/:tableId                    → ctrl.updateSeatingTable
    DELETE /:planId/seating/tables/:tableId                    → ctrl.deleteSeatingTable
    POST   /:planId/seating/tables/:tableId/seats/:seatId/assign   → ctrl.assignSeat
    DELETE /:planId/seating/tables/:tableId/seats/:seatId/assign   → ctrl.unassignSeat
    ```
  - All routes use the existing `authorize('use_planner')` middleware already applied to the router.
  - Add a new route file `backend/src/modules/planner/dashboard.routes.js` with:
    - `GET  /alerts`  → `ctrl.getActiveAlerts`
    - `PUT  /alerts/:entryId/dismiss` → `ctrl.dismissAlert`
    - Both behind `authenticate` + `attachTenant(true)` + `authorize('use_planner')`.
  - Register in `backend/src/app.js`: `app.use(\`${API}/dashboard\`, dashboardRoutes)`.
  - _Requirements: 4.1, 4.4, 4.5, 10.1_

- [ ] 7. Checkpoint — backend complete
  - Ensure all backend routes respond correctly (manual curl or Postman smoke test).
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Frontend — `CalendarTab` component
  - Create `frontend/src/app/dashboard/planner/[planId]/CalendarTab.jsx`.
  - State: `entries` (array), `currentMonth` (Date), `selectedDate` (Date|null), `showPanel` (bool), `editId` (string|null), `form` ({ title, type, description, date }).
  - On mount / month change: `GET /planner/:planId/calendar`, store entries in state.
  - Render a 7-column CSS grid calendar for `currentMonth`:
    - Header row: Mon–Sun labels.
    - Day cells: show day number; if entries exist for that date render a colored dot (violet for nota, red for alerta).
    - Previous/next month navigation buttons.
  - Click on a day cell: set `selectedDate`, open slide-in panel.
  - Panel content:
    - List of entries for `selectedDate` with inline edit (pencil icon) and delete (trash icon) buttons.
    - Add/edit form: `title` (required), `type` select (nota | alerta), `description` textarea (optional), `date` pre-filled from `selectedDate`.
    - On save: POST or PUT to backend, update local `entries` state, close form.
    - On delete: DELETE to backend, remove from local `entries` state.
  - Validation: show inline error if title is empty on submit; do not call backend.
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 8.1 Write property test — Property 4: empty/whitespace title is rejected
    - Use `fc.string().filter(s => s.trim() === '')` to generate whitespace-only strings.
    - Verify that submitting as title triggers the 422 error from the backend (or frontend validation blocks the request).
    - **Property 4: Empty/whitespace title is rejected**
    - **Validates: Requirements 2.5, 4.7**

- [x] 9. Frontend — `SeatingTab` and `SeatingCanvas` components
  - Create `frontend/src/app/dashboard/planner/[planId]/SeatingTab.jsx`.
  - On mount: `GET /planner/:planId/seating/tables`, store tables in state.
  - Toolbar:
    - "Agregar mesa" button → POST `{ seat_count: 4, is_bride_table: false, position_x: 450, position_y: 300 }`.
    - "Agregar mesa de novios" button → POST `{ seat_count: 8, is_bride_table: true, ... }`; disabled if any table has `is_bride_table = true`.
    - Summary stats bar: total seats, occupied (RSVP confirmed), pending (maybe/no RSVP), free (declined/unassigned), occupancy %.
  - Empty state: when `tables.length === 0`, show centered message + "Agregar primera mesa" button.
  - Table config panel (slide-in, opens on table click):
    - Seat count slider/input (min 1, max 20), current value pre-filled.
    - "Guardar" → PUT `/:tableId` with `{ seat_count }`.
    - "Eliminar mesa" → DELETE `/:tableId`, remove from state.
  - Render `<SeatingCanvas>` passing `tables`, `onTableMove`, `onSeatClick`, `onTableClick`.
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.4, 6.5, 6.6, 7.1, 7.2, 7.3, 9.3, 9.4_

  - Create `SeatingCanvas` as a sub-component (same file or separate `SeatingCanvas.jsx`):
    - Outer `<div>` with `position: relative`, fixed size 900×600px, overflow hidden, light gray background.
    - For each table: absolutely-positioned `<div>` at `(position_x, position_y)`, `draggable="true"`.
      - Table circle: diameter ~72px, violet for regular, pink/rose for bride table, shows table number.
      - Seats: rendered as absolutely-positioned children using `calcSeatPositions(N, R=52, cx=36, cy=36)`.
        - Seat circle: diameter ~24px, colored by Seat_Status (green=occupied, yellow=pending, gray=free).
        - Shows guest initials or name tooltip on hover if assigned.
    - HTML5 Drag API on the canvas `<div>`:
      - `onDragStart`: store `{ tableId, offsetX, offsetY }` in a ref.
      - `onDragOver`: `e.preventDefault()`.
      - `onDrop`: compute new `(x, y)` clamped to canvas bounds, update local state immediately, debounce PUT `/:tableId { position_x, position_y }` by 300ms.
    - Click on empty seat → open guest selector dropdown (fetch `GET /planner/:planId/seating/tables` to derive unassigned guests from event guests list; or fetch event guests separately and filter out assigned ones).
    - Click on occupied seat → show popover with guest name + "Remover" button → DELETE assign endpoint.
  - _Requirements: 6.3, 6.7, 7.2, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 9.1_

  - [ ]* 9.1 Write property test — Property 13: seat positions are evenly distributed on a circle
    - Extract `calcSeatPositions` as a pure function in a utility file (e.g. `frontend/src/lib/seatLayout.js`).
    - Use `fc.integer({ min: 1, max: 20 })` for N and `fc.float({ min: 10, max: 200 })` for R.
    - Verify all N positions are at distance R from center (within floating-point epsilon), and angular gap between consecutive seats equals 2π/N.
    - **Property 13: Seat positions are evenly distributed on a circle**
    - **Validates: Requirements 6.7**

  - [ ]* 9.2 Write property test — Property 19: seat summary counts are accurate
    - Use `fc.array(fc.constantFrom('occupied', 'pending', 'free'))` to generate seat status arrays.
    - Verify that the summary computation (occupied count, pending count, free count, total, occupancy %) matches the actual array contents.
    - **Property 19: Seat summary counts are accurate**
    - **Validates: Requirements 9.3, 9.4**

- [x] 10. Frontend — `AlertBadge` component integrated into `ClientSidebar`
  - Create `frontend/src/components/layout/AlertBadge.jsx`:
    - On mount: `GET /api/v1/dashboard/alerts`, store `alerts` array in state; silently suppress errors (catch → set alerts to []).
    - Render nothing when `alerts.length === 0`.
    - When `alerts.length > 0`: render a red circular badge with the count.
    - Click on badge → open a popover/dropdown panel listing each alert (title, description, date).
    - Each alert row has a "Descartar" button → PUT `/dashboard/alerts/:entryId/dismiss`, remove from local state.
  - Modify `frontend/src/components/layout/ClientSidebar.jsx`:
    - Import `AlertBadge`.
    - On the "Planificador" nav item, render `<AlertBadge>` positioned absolutely (top-right of the nav item) so the badge overlays the icon/label.
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 11. Wire new tabs into the Planner page
  - Modify `frontend/src/app/dashboard/planner/[planId]/page.jsx`:
    - Add two entries to the `TABS` array: `{ id: 'calendar', label: 'Calendario', Icon: CalendarDays }` and `{ id: 'seating', label: 'Mesas', Icon: LayoutGrid }` (import icons from `lucide-react`).
    - Import `CalendarTab` and `SeatingTab`.
    - Add `case 'calendar': return <CalendarTab planId={planId} />` and `case 'seating': return <SeatingTab planId={planId} />` to the tab render switch/conditional.
  - _Requirements: 1.1, 5.1_

- [ ] 12. Final checkpoint — ensure all tests pass
  - Run `npm test -- --run` (or equivalent) in the backend to execute all property-based tests.
  - Verify the four new DB tables exist after `migrate:fresh`.
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP.
- Property tests use **fast-check** (`fc`) — install with `npm install --save-dev fast-check` if not already present.
- The `calcSeatPositions` pure function should be extracted to `frontend/src/lib/seatLayout.js` so it can be unit/property tested independently of React.
- All backend errors follow the existing `AppError` pattern; 403 is thrown by the existing `getById` ownership check already in `PlannerService`.
- The `/dashboard/alerts` route is registered separately in `app.js` under `${API}/dashboard` to keep it decoupled from per-plan planner routes.
