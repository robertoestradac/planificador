/**
 * seatingPdf.js — Professional seating chart PDF generator
 * Uses auto-fit: scales all table positions to fill the available drawing area,
 * so ALL tables are always visible regardless of canvas position.
 */
import { jsPDF } from 'jspdf';
import { calcSeatPositions, getSeatStatus } from './seatLayout';

const PAGE_W = 297; // A4 landscape mm
const PAGE_H = 210;
const HEADER_H = 14;
const FOOTER_H = 12;
const LIST_W   = 58;  // right panel width
const MARGIN   = 12;

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
}

const STATUS_COLORS = {
  occupied: [16, 185, 129],
  pending:  [245, 158, 11],
  free:     [148, 163, 184],
};

export function generateSeatingPdf(tables, eventName = 'Evento', specialConfig = null) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // ── Drawing area for the diagram (left of the list panel) ────
  const drawX1 = MARGIN;
  const drawY1 = HEADER_H + 4;
  const drawX2 = PAGE_W - LIST_W - MARGIN - 4;
  const drawY2 = PAGE_H - FOOTER_H - 4;
  const drawW  = drawX2 - drawX1;
  const drawH  = drawY2 - drawY1;

  // ── Auto-fit: find bounding box of all tables ────────────────
  const TABLE_R_PX = 40; // pixels in canvas
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  tables.forEach(t => {
    const cx = parseFloat(t.position_x) + TABLE_R_PX;
    const cy = parseFloat(t.position_y) + TABLE_R_PX;
    minX = Math.min(minX, cx); minY = Math.min(minY, cy);
    maxX = Math.max(maxX, cx); maxY = Math.max(maxY, cy);
  });
  // Add padding around bounding box
  const PAD_PX = TABLE_R_PX + 20;
  minX -= PAD_PX; minY -= PAD_PX;
  maxX += PAD_PX; maxY += PAD_PX;
  const rangeX = Math.max(maxX - minX, 1);
  const rangeY = Math.max(maxY - minY, 1);

  // Scale factor: fit bounding box into drawing area
  const scaleF = Math.min(drawW / rangeX, drawH / rangeY);

  function toMm(px, py) {
    return {
      x: drawX1 + (px - minX) * scaleF,
      y: drawY1 + (py - minY) * scaleF,
    };
  }

  const tableRMm   = TABLE_R_PX * scaleF * 0.95;
  const seatRMm    = Math.max(2.2, Math.min(3.5, 10 * scaleF * 0.9));
  const seatDistMm = (TABLE_R_PX + 14) * scaleF;

  // ── Background ───────────────────────────────────────────────
  doc.setFillColor(250, 250, 255);
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F');

  // Dot grid in drawing area
  doc.setFillColor(220, 220, 235);
  for (let gx = drawX1 + 7; gx < drawX2; gx += 7) {
    for (let gy = drawY1 + 7; gy < drawY2; gy += 7) {
      doc.circle(gx, gy, 0.3, 'F');
    }
  }

  // Drawing area border
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.4);
  doc.roundedRect(drawX1 - 1, drawY1 - 1, drawW + 2, drawH + 2, 3, 3, 'D');

  // ── Header ───────────────────────────────────────────────────
  doc.setFillColor(109, 40, 217);
  doc.rect(0, 0, PAGE_W, HEADER_H, 'F');
  // Accent stripe
  doc.setFillColor(139, 92, 246);
  doc.rect(0, HEADER_H - 2, PAGE_W, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Diagrama de Mesas — ${eventName}`, MARGIN, 9);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  const dateStr = new Date().toLocaleDateString('es-GT', { day: 'numeric', month: 'long', year: 'numeric' });
  doc.text(dateStr, PAGE_W - MARGIN, 9, { align: 'right' });

  // ── Draw tables ──────────────────────────────────────────────
  tables.forEach(table => {
    const isBride = table.is_bride_table;
    const baseColor = isBride && specialConfig
      ? hexToRgb(specialConfig.color)
      : isBride ? [244, 63, 94] : [109, 40, 217];
    const lightColor = baseColor.map(c => Math.min(255, c + 40));

    const cx = parseFloat(table.position_x) + TABLE_R_PX;
    const cy = parseFloat(table.position_y) + TABLE_R_PX;
    const { x: mx, y: my } = toMm(cx, cy);

    // Shadow
    doc.setFillColor(0, 0, 0);
    doc.setGState && doc.setGState(doc.GState({ opacity: 0.08 }));
    doc.circle(mx + 0.6, my + 0.8, tableRMm + 0.5, 'F');
    doc.setGState && doc.setGState(doc.GState({ opacity: 1 }));

    // Table circle (outer lighter ring)
    doc.setFillColor(...lightColor);
    doc.circle(mx, my, tableRMm + 0.8, 'F');

    // Table circle (main)
    doc.setFillColor(...baseColor);
    doc.circle(mx, my, tableRMm, 'F');

    // White inner ring
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.5);
    doc.circle(mx, my, tableRMm - 1, 'D');

    // Table number
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(Math.max(7, tableRMm * 2.2));
    doc.setFont('helvetica', 'bold');
    doc.text(String(table.table_number), mx, my + (isBride && specialConfig ? -1 : 0.5), {
      align: 'center', baseline: 'middle',
    });

    // Special label
    if (isBride && specialConfig) {
      doc.setFontSize(Math.max(4.5, tableRMm * 1.1));
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(255, 220, 230);
      doc.text(specialConfig.tableLabel, mx, my + tableRMm * 0.55, { align: 'center' });
    }

    // Seats
    const N = table.seats?.length || 0;
    const seatPositions = calcSeatPositions(N, seatDistMm, 0, 0);

    table.seats?.forEach((seat, i) => {
      const pos = seatPositions[i];
      if (!pos) return;
      const sx = mx + pos.x;
      const sy = my + pos.y;

      const specialLabel = isBride && specialConfig ? (specialConfig.specialSeats[i] || null) : null;
      const isSpecial = !!specialLabel;
      const status = isSpecial ? 'occupied' : getSeatStatus(seat.assignment);
      const sColor = isSpecial ? hexToRgb(specialConfig.color) : STATUS_COLORS[status];
      const sLightColor = sColor.map(c => Math.min(255, c + 50));

      // Seat shadow
      doc.setFillColor(0, 0, 0);
      doc.circle(sx + 0.3, sy + 0.4, seatRMm + 0.2, 'F');

      // Seat outer
      doc.setFillColor(...sLightColor);
      doc.circle(sx, sy, seatRMm + 0.3, 'F');

      // Seat main
      doc.setFillColor(...sColor);
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.4);
      doc.circle(sx, sy, seatRMm, 'FD');

      // Name/initials
      const name = isSpecial ? specialLabel : (seat.assignment?.guest_name || '');
      if (name) {
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(Math.max(3.5, seatRMm * 1.1));
        doc.setFont('helvetica', 'bold');
        const short = name.length > 5 ? name.slice(0, 4) + '.' : name;
        doc.text(short, sx, sy + 0.4, { align: 'center', baseline: 'middle' });
      }
    });
  });

  // ── Right panel: guest list ──────────────────────────────────
  const listX = PAGE_W - LIST_W - MARGIN + 2;
  const listY1 = HEADER_H + 4;
  const listH  = PAGE_H - HEADER_H - FOOTER_H - 8;

  doc.setFillColor(245, 243, 255);
  doc.setDrawColor(221, 214, 254);
  doc.setLineWidth(0.4);
  doc.roundedRect(listX, listY1, LIST_W, listH, 3, 3, 'FD');

  // Panel header
  doc.setFillColor(109, 40, 217);
  doc.roundedRect(listX, listY1, LIST_W, 7, 3, 3, 'F');
  doc.rect(listX, listY1 + 4, LIST_W, 3, 'F'); // square bottom corners
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Lista de invitados', listX + LIST_W / 2, listY1 + 4.5, { align: 'center' });

  let ly = listY1 + 10;
  const maxLy = listY1 + listH - 4;

  tables.forEach(table => {
    if (ly > maxLy - 6) return;
    const isBride = table.is_bride_table;
    const tColor = isBride && specialConfig
      ? hexToRgb(specialConfig.color)
      : isBride ? [244, 63, 94] : [109, 40, 217];

    // Table row
    doc.setFillColor(...tColor);
    doc.roundedRect(listX + 2, ly, LIST_W - 4, 5, 1, 1, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    const tLabel = isBride && specialConfig
      ? specialConfig.tableLabel
      : `Mesa ${table.table_number}`;
    doc.text(tLabel, listX + 4, ly + 3.3);
    ly += 6;

    // Guests
    const hasGuests = table.seats?.some((s, i) => {
      const sl = isBride && specialConfig ? (specialConfig.specialSeats[i] || null) : null;
      return sl || s.assignment?.guest_name;
    });

    if (!hasGuests) {
      if (ly > maxLy) return;
      doc.setTextColor(160, 160, 180);
      doc.setFontSize(5.5);
      doc.setFont('helvetica', 'italic');
      doc.text('(sin invitados)', listX + 5, ly + 1);
      ly += 4;
    } else {
      table.seats?.forEach((seat, i) => {
        if (ly > maxLy) return;
        const sl = isBride && specialConfig ? (specialConfig.specialSeats[i] || null) : null;
        const name = sl || seat.assignment?.guest_name;
        if (!name) return;
        const status = sl ? 'occupied' : getSeatStatus(seat.assignment);
        const sc = STATUS_COLORS[status];
        doc.setFillColor(...sc);
        doc.circle(listX + 4.5, ly + 1.2, 1.4, 'F');
        doc.setTextColor(55, 55, 75);
        doc.setFontSize(5.5);
        doc.setFont('helvetica', 'normal');
        const short = name.length > 20 ? name.slice(0, 19) + '.' : name;
        doc.text(short, listX + 7, ly + 1.8);
        ly += 4;
      });
    }
    ly += 2;
  });

  // ── Footer ───────────────────────────────────────────────────
  const fy = PAGE_H - FOOTER_H + 2;
  doc.setFillColor(245, 243, 255);
  doc.rect(0, PAGE_H - FOOTER_H, PAGE_W, FOOTER_H, 'F');
  doc.setDrawColor(221, 214, 254);
  doc.setLineWidth(0.3);
  doc.line(0, PAGE_H - FOOTER_H, PAGE_W, PAGE_H - FOOTER_H);

  // Legend
  const legend = [
    { label: 'Confirmado', color: STATUS_COLORS.occupied },
    { label: 'Pendiente',  color: STATUS_COLORS.pending  },
    { label: 'Libre',      color: STATUS_COLORS.free     },
  ];
  let lx2 = MARGIN;
  legend.forEach(({ label, color }) => {
    doc.setFillColor(...color);
    doc.circle(lx2 + 2, fy + 3, 2, 'F');
    doc.setTextColor(80, 80, 100);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(label, lx2 + 5.5, fy + 3.8);
    lx2 += 30;
  });

  doc.setTextColor(160, 160, 180);
  doc.setFontSize(6.5);
  doc.text('InvitApp — Planificador de eventos', PAGE_W - MARGIN, fy + 3.8, { align: 'right' });

  // ── Save ─────────────────────────────────────────────────────
  const filename = `mesas-${eventName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.pdf`;
  doc.save(filename);
}
