'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { X, Trash2, Plus, Users, Check, FileDown, ChevronDown } from 'lucide-react';
import api from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { calcSeatPositions, getSeatStatus, SEAT_COLORS } from '@/lib/seatLayout';
import { generateSeatingPdf } from '@/lib/seatingPdf';

const CANVAS_W = 900;
const CANVAS_H = 600;
const TABLE_DIV = 104;
const TABLE_R   = 40;
const SEAT_R    = 12;
const SEAT_MARGIN = SEAT_R + 8;

// Professional color palette
const TABLE_GRADIENT_REGULAR = 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)';
const SEAT_STATUS_COLORS = {
  occupied: '#10b981',
  pending:  '#f59e0b',
  free:     '#94a3b8',
};

// ── SeatingCanvas — mouse-based drag for real-time position ────
function SeatingCanvas({ planId, tables, specialConfig, onTableMove, onSeatClick, onTableClick }) {
  const canvasRef  = useRef(null);
  const dragRef    = useRef(null);
  const saveRef    = useRef(null);
  const didDragRef = useRef(false); // true if mouse moved enough to be a drag
  const [isDragging, setIsDragging] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [saved,  setSaved]    = useState(false);

  const persistPosition = useCallback((tableId, x, y) => {
    if (saveRef.current) clearTimeout(saveRef.current);
    setSaving(true);
    setSaved(false);
    saveRef.current = setTimeout(async () => {
      try {
        await api.put(`/planner/${planId}/seating/tables/${tableId}`, {
          position_x: x,
          position_y: y,
        });
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch {
        setSaving(false);
      }
    }, 400);
  }, [planId]);

  const handleMouseDown = (e, table) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const canvasRect = canvasRef.current.getBoundingClientRect();
    didDragRef.current = false;
    dragRef.current = {
      tableId: table.id,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      origX: parseFloat(table.position_x) || 0,
      origY: parseFloat(table.position_y) || 0,
      canvasLeft: canvasRect.left,
      canvasTop:  canvasRect.top,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!dragRef.current) return;
      const { tableId, startMouseX, startMouseY, origX, origY } = dragRef.current;
      const dx = e.clientX - startMouseX;
      const dy = e.clientY - startMouseY;
      if (Math.abs(dx) >= 4 || Math.abs(dy) >= 4) {
        didDragRef.current = true;
        setIsDragging(true);
      }
      let newX = origX + dx;
      let newY = origY + dy;
      newX = Math.max(SEAT_MARGIN, Math.min(CANVAS_W - TABLE_DIV - SEAT_MARGIN, newX));
      newY = Math.max(SEAT_MARGIN, Math.min(CANVAS_H - TABLE_DIV - SEAT_MARGIN, newY));
      onTableMove(tableId, newX, newY);
    };

    const handleMouseUp = (e) => {
      if (!dragRef.current) return;
      const { tableId, startMouseX, startMouseY, origX, origY } = dragRef.current;
      const dx = e.clientX - startMouseX;
      const dy = e.clientY - startMouseY;
      const wasDrag = Math.abs(dx) >= 4 || Math.abs(dy) >= 4;
      dragRef.current = null;
      setIsDragging(false);
      if (!wasDrag) {
        didDragRef.current = false;
        return; // treat as click — onTableClick fires via onClick
      }
      let newX = origX + dx;
      let newY = origY + dy;
      newX = Math.max(SEAT_MARGIN, Math.min(CANVAS_W - TABLE_DIV - SEAT_MARGIN, newX));
      newY = Math.max(SEAT_MARGIN, Math.min(CANVAS_H - TABLE_DIV - SEAT_MARGIN, newY));
      persistPosition(tableId, newX, newY);
      // Keep didDragRef true briefly so onClick on the circle is suppressed
      setTimeout(() => { didDragRef.current = false; }, 50);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup',   handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup',   handleMouseUp);
    };
  }, [onTableMove, persistPosition]);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Auto-save indicator */}
      <div style={{
        position: 'absolute', top: -28, right: 0,
        fontSize: 11, color: saving ? '#7c3aed' : saved ? '#22c55e' : 'transparent',
        display: 'flex', alignItems: 'center', gap: 4, transition: 'color 0.3s',
        userSelect: 'none',
      }}>
        {saving && <span>Guardando...</span>}
        {saved   && <><Check size={11} /> Guardado</>}
      </div>

      <div
        ref={canvasRef}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: CANVAS_W,
          height: CANVAS_H,
          overflow: 'hidden',
          background: '#ffffff',
          backgroundImage: 'radial-gradient(circle, #ddd6fe 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          border: '1px solid #e5e7eb',
          borderRadius: 16,
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          cursor: isDragging ? 'grabbing' : 'default',
          userSelect: 'none',
        }}
      >
        {tables.map(table => {
          const seatPositions = calcSeatPositions(table.seats?.length || 0, TABLE_R + SEAT_R + 8, TABLE_DIV / 2, TABLE_DIV / 2);
          const isBride = table.is_bride_table;
          const tableColor = isBride && specialConfig ? specialConfig.color : (isBride ? '#f43f5e' : null);
          const tableGradient = tableColor
            ? `linear-gradient(135deg, ${tableColor} 0%, ${tableColor}cc 100%)`
            : TABLE_GRADIENT_REGULAR;
          const tableShadow = tableColor
            ? `0 4px 16px ${tableColor}55`
            : '0 4px 16px rgba(124,58,237,0.35)';

          return (
            <div
              key={table.id}
              onMouseDown={e => handleMouseDown(e, table)}
              style={{
                position: 'absolute',
                left: parseFloat(table.position_x) || 0,
                top:  parseFloat(table.position_y) || 0,
                width: TABLE_DIV,
                height: TABLE_DIV,
                cursor: 'grab',
                userSelect: 'none',
              }}
            >
              {/* Table circle — suppress click if it was a drag */}
              <div
                onClick={() => { if (!didDragRef.current) onTableClick(table); }}
                style={{
                  position: 'absolute',
                  left: '50%', top: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: TABLE_R * 2, height: TABLE_R * 2,
                  borderRadius: '50%',
                  background: tableGradient,
                  border: '3px solid rgba(255,255,255,0.35)',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', zIndex: 2,
                  boxShadow: tableShadow,
                }}
              >
                <span style={{ color: '#fff', fontSize: 15, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.5px' }}>
                  {table.table_number}
                </span>
                {isBride && specialConfig && (
                  <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 8, lineHeight: 1, marginTop: 3, fontWeight: 600 }}>
                    {specialConfig.tableLabel}
                  </span>
                )}
              </div>

              {/* Seats */}
              {(table.seats || []).map((seat, i) => {
                const pos = seatPositions[i];
                if (!pos) return null;

                const isSpecialTable = isBride && specialConfig;
                const specialLabel   = isSpecialTable ? (specialConfig.specialSeats[i] || null) : null;
                const isSpecialSeat  = !!specialLabel;

                const status = isSpecialSeat ? 'occupied' : getSeatStatus(seat.assignment);
                const color  = isSpecialSeat ? specialConfig.color : SEAT_STATUS_COLORS[status];
                
                // Determinar el label a mostrar
                let displayLabel = '';
                if (isSpecialSeat) {
                  displayLabel = specialLabel.slice(0, 2).toUpperCase();
                } else if (seat.assignment?.guest_name) {
                  if (seat.assignment.is_companion) {
                    // Mostrar +1, +2, etc. para acompañantes
                    displayLabel = `+${seat.assignment.companion_index || '1'}`;
                  } else {
                    displayLabel = seat.assignment.guest_name.slice(0, 2).toUpperCase();
                  }
                }

                // Tooltip mejorado
                let tooltipText = '';
                if (isSpecialSeat) {
                  tooltipText = specialLabel;
                } else if (seat.assignment?.guest_name) {
                  if (seat.assignment.is_companion) {
                    tooltipText = `${seat.assignment.guest_name} (Acompañante ${seat.assignment.companion_index})`;
                  } else {
                    tooltipText = seat.assignment.guest_name;
                    if (seat.assignment.party_size > 1) {
                      tooltipText += ` (${seat.assignment.party_size} personas)`;
                    }
                  }
                } else {
                  tooltipText = 'Libre';
                }

                return (
                  <div
                    key={seat.id}
                    onMouseDown={e => e.stopPropagation()}
                    onClick={e => { e.stopPropagation(); if (!isSpecialSeat) onSeatClick(seat, table); }}
                    title={tooltipText}
                    style={{
                      position: 'absolute',
                      left: pos.x - SEAT_R, top: pos.y - SEAT_R,
                      width: SEAT_R * 2, height: SEAT_R * 2,
                      borderRadius: '50%',
                      background: color,
                      border: seat.assignment?.is_companion ? '2.5px dashed #fff' : '2.5px solid #fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: isSpecialSeat ? 'default' : 'pointer',
                      fontSize: seat.assignment?.is_companion ? 7 : 8, 
                      fontWeight: 700, 
                      color: '#fff',
                      zIndex: 3,
                      boxShadow: `0 2px 6px ${color}55`,
                      transition: 'transform 0.15s',
                    }}
                    onMouseEnter={e => { if (!isSpecialSeat) e.currentTarget.style.transform = 'scale(1.15)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                  >
                    {displayLabel}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── AccordionTable — collapsible table row in guest list ──────
function AccordionTable({ table, tColor, tLabel, assignedSeats, specialConfig, getSeatStatus, SEAT_STATUS_COLORS }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-lg overflow-hidden border border-gray-200">
      {/* Header — click to toggle */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left transition-opacity hover:opacity-90"
        style={{ background: tColor }}
      >
        <span className="text-white text-xs font-bold flex-1 truncate">{tLabel}</span>
        <span className="text-white/70 text-xs">{assignedSeats.length}/{table.seat_count}</span>
        <ChevronDown
          className="w-3.5 h-3.5 text-white/80 flex-shrink-0 transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>
      {/* Body */}
      {open && (
        <div className="bg-white divide-y divide-gray-50">
          {assignedSeats.length === 0 ? (
            <p className="text-xs text-gray-400 px-3 py-2 italic">Sin invitados asignados</p>
          ) : (table.seats || []).map((seat, i) => {
            const sl = table.is_bride_table && specialConfig ? (specialConfig.specialSeats[i] || null) : null;
            const assignment = seat.assignment;
            
            if (!sl && !assignment) return null;
            
            const name = sl || assignment?.guest_name;
            const status = sl ? 'occupied' : getSeatStatus(assignment);
            const dotColor = SEAT_STATUS_COLORS[status];
            const isCompanion = assignment?.is_companion;
            const companionIndex = assignment?.companion_index;
            
            return (
              <div key={seat.id} className="flex items-center gap-2 px-3 py-1.5">
                <span 
                  className="w-2 h-2 rounded-full flex-shrink-0" 
                  style={{ 
                    background: dotColor,
                    border: isCompanion ? '1px dashed rgba(0,0,0,0.2)' : 'none'
                  }} 
                />
                <span className={`text-xs truncate ${isCompanion ? 'text-gray-500 italic' : 'text-gray-700'}`}>
                  {isCompanion ? `↳ Acompañante ${companionIndex}` : name}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Config for special tables by event type ───────────────────
const SPECIAL_TABLE_CONFIG = {
  boda: {
    buttonLabel: 'Mesa de novios',
    tableLabel:  'Novios',
    specialSeats: ['Novio', 'Novia'],
    color: '#f43f5e',
  },
  xv_anos: {
    buttonLabel: 'Mesa de quinceañera',
    tableLabel:  'Quinceañera',
    specialSeats: ['Quinceañera'],
    color: '#a855f7',
  },
};

// ── SeatingTab ─────────────────────────────────────────────────
export default function SeatingTab({ planId }) {
  const [tables, setTables]               = useState([]);
  const [loading, setLoading]             = useState(true);
  const [eventType, setEventType]         = useState(null);
  const [eventName, setEventName]         = useState('Evento');
  const [selectedTable, setSelectedTable] = useState(null);
  const [seatCountInput, setSeatCountInput] = useState(4);
  const [selectedSeat, setSelectedSeat]   = useState(null);
  const [selectedSeatTable, setSelectedSeatTable] = useState(null);
  const [guests, setGuests]               = useState([]);
  const [showGuestSelector, setShowGuestSelector] = useState(false);

  const loadTables = useCallback(async () => {
    try {
      const { data } = await api.get(`/planner/${planId}/seating/tables`);
      setTables(data.data || []);
    } catch {
      toast({ variant: 'destructive', title: 'Error al cargar mesas' });
    } finally {
      setLoading(false);
    }
  }, [planId]);

  const loadGuests = useCallback(async () => {
    try {
      // Wait for token to be available (avoids 401 on initial mount)
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      if (!token) return;

      const { data: planData } = await api.get(`/planner/${planId}`);
      const plan = planData.data;
      const eventId = plan?.event_id;
      setEventType(plan?.event_type || null);
      setEventName(plan?.event_name || 'Evento');
      if (!eventId) return;
      const { data: invData } = await api.get(`/invitations?event_id=${eventId}&limit=100`);
      const invitations = invData.data?.data || [];
      const allGuests = [];
      for (const inv of invitations) {
        try {
          const { data: gData } = await api.get(`/guests/invitation/${inv.id}?limit=500`);
          const guestList = gData.data?.data || [];
          guestList.forEach(g => allGuests.push(g));
        } catch { /* skip */ }
      }
      setGuests(allGuests);
    } catch { /* silently ignore */ }
  }, [planId]);

  useEffect(() => {
    loadTables();
    loadGuests();
  }, [loadTables, loadGuests]);

  // Compute assigned guest IDs across all tables
  const assignedGuestIds = new Set(
    tables.flatMap(t => (t.seats || [])
      .filter(s => s.assignment?.guest_id)
      .map(s => s.assignment.guest_id)
    )
  );

  const unassignedGuests = guests.filter(g => !assignedGuestIds.has(g.id));

  // Summary stats
  const allSeats = tables.flatMap(t => t.seats || []);
  const occupied = allSeats.filter(s => getSeatStatus(s.assignment) === 'occupied').length;
  const pending  = allSeats.filter(s => getSeatStatus(s.assignment) === 'pending').length;
  const free     = allSeats.filter(s => getSeatStatus(s.assignment) === 'free').length;
  const total    = allSeats.length;
  const pct      = total ? Math.round((occupied / total) * 100) : 0;

  const specialConfig = SPECIAL_TABLE_CONFIG[eventType] || null;
  const hasBrideTable = tables.some(t => t.is_bride_table);

  const addTable = async (isBride = false) => {
    try {
      const { data } = await api.post(`/planner/${planId}/seating/tables`, {
        seat_count: isBride ? Math.max(2, specialConfig?.specialSeats?.length || 2) : 4,
        is_bride_table: isBride,
        position_x: isBride ? 380 : 100 + (tables.length % 5) * 160,
        position_y: isBride ? 60  : 80  + Math.floor(tables.length / 5) * 160,
      });
      setTables(prev => [...prev, data.data]);
      toast({ title: isBride ? `${specialConfig?.tableLabel || 'Mesa especial'} creada` : 'Mesa creada' });
    } catch (err) {
      toast({ variant: 'destructive', title: err.response?.data?.message || 'Error al crear mesa' });
    }
  };

  const handleTableMove = (tableId, x, y) => {
    setTables(prev => prev.map(t => t.id === tableId ? { ...t, position_x: x, position_y: y } : t));
  };

  const handleTableClick = (table) => {
    setSelectedTable(table);
    setSeatCountInput(table.seat_count);
    setShowGuestSelector(false);
    setSelectedSeat(null);
  };

  const handleSeatClick = (seat, table) => {
    setSelectedSeat(seat);
    setSelectedSeatTable(table);
    setShowGuestSelector(true);
    setSelectedTable(null);
  };

  const saveTableConfig = async () => {
    if (!selectedTable) return;
    try {
      const { data } = await api.put(`/planner/${planId}/seating/tables/${selectedTable.id}`, {
        seat_count: seatCountInput,
      });
      setTables(prev => prev.map(t => t.id === selectedTable.id ? data.data : t));
      setSelectedTable(null);
      toast({ title: 'Mesa actualizada' });
    } catch (err) {
      toast({ variant: 'destructive', title: err.response?.data?.message || 'Error al actualizar' });
    }
  };

  const deleteTable = async () => {
    if (!selectedTable) return;
    if (!confirm('¿Eliminar esta mesa?')) return;
    try {
      await api.delete(`/planner/${planId}/seating/tables/${selectedTable.id}`);
      setTables(prev => prev.filter(t => t.id !== selectedTable.id));
      setSelectedTable(null);
      toast({ title: 'Mesa eliminada' });
    } catch {
      toast({ variant: 'destructive', title: 'Error al eliminar' });
    }
  };

  const assignGuest = async (guestId) => {
    if (!selectedSeat || !selectedSeatTable) return;
    
    const guest = guests.find(g => g.id === guestId);
    if (!guest) return;

    const partySize = guest.party_size || 1;

    // Si el invitado tiene acompañantes, mostrar diálogo de confirmación
    if (partySize > 1) {
      const availableSeats = (selectedSeatTable.seats || []).filter(s => !s.assignment);
      const seatsNeeded = partySize;
      
      if (availableSeats.length < seatsNeeded) {
        toast({
          variant: 'warning',
          title: 'Asientos insuficientes',
          description: `Este invitado necesita ${seatsNeeded} asientos pero solo hay ${availableSeats.length} disponibles en esta mesa.`,
        });
        
        // Preguntar si quiere asignar solo al invitado principal
        const shouldContinue = confirm(
          `${guest.name} tiene ${partySize} personas en su grupo pero solo hay ${availableSeats.length} asientos disponibles.\n\n¿Deseas asignar solo al invitado principal en este asiento?`
        );
        
        if (!shouldContinue) return;
      }
    }

    try {
      // Asignar al invitado principal
      await api.post(
        `/planner/${planId}/seating/tables/${selectedSeatTable.id}/seats/${selectedSeat.id}/assign`,
        { guest_id: guestId }
      );

      // Si tiene acompañantes, intentar asignarlos automáticamente
      if (partySize > 1) {
        const availableSeats = (selectedSeatTable.seats || [])
          .filter(s => !s.assignment && s.id !== selectedSeat.id)
          .slice(0, partySize - 1);

        let assignedCompanions = 0;
        for (const seat of availableSeats) {
          try {
            // Crear un registro virtual para el acompañante
            await api.post(
              `/planner/${planId}/seating/tables/${selectedSeatTable.id}/seats/${seat.id}/assign`,
              { 
                guest_id: guestId,
                is_companion: true,
                companion_index: assignedCompanions + 1
              }
            );
            assignedCompanions++;
          } catch (err) {
            console.error('Error asignando acompañante:', err);
          }
        }

        if (assignedCompanions > 0) {
          toast({
            title: 'Invitado y acompañantes asignados',
            description: `Se asignó a ${guest.name} + ${assignedCompanions} acompañante(s)`,
            variant: 'success',
          });
        } else {
          toast({
            title: 'Invitado asignado',
            description: 'No se pudieron asignar los acompañantes automáticamente',
            variant: 'warning',
          });
        }
      } else {
        toast({ 
          title: 'Invitado asignado',
          variant: 'success',
        });
      }

      await loadTables();
      setShowGuestSelector(false);
      setSelectedSeat(null);
    } catch (err) {
      toast({ 
        variant: 'destructive', 
        title: err.response?.data?.message || 'Error al asignar' 
      });
    }
  };

  const unassignGuest = async () => {
    if (!selectedSeat || !selectedSeatTable) return;
    try {
      await api.delete(
        `/planner/${planId}/seating/tables/${selectedSeatTable.id}/seats/${selectedSeat.id}/assign`
      );
      await loadTables();
      setShowGuestSelector(false);
      setSelectedSeat(null);
      toast({ title: 'Asignación removida' });
    } catch {
      toast({ variant: 'destructive', title: 'Error al remover' });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <button
          onClick={() => addTable(false)}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Agregar mesa</span>
          <span className="sm:hidden">Mesa</span>
        </button>

        {specialConfig && !hasBrideTable && (
          <button
            onClick={() => addTable(true)}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors"
            style={{ background: specialConfig.color }}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{specialConfig.buttonLabel}</span>
            <span className="sm:hidden">{specialConfig.tableLabel}</span>
          </button>
        )}

        {tables.length > 0 && (
          <button
            onClick={() => generateSeatingPdf(tables, eventName, specialConfig)}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <FileDown className="w-4 h-4" />
            <span className="hidden sm:inline">Descargar PDF</span>
          </button>
        )}

        {total > 0 && (
          <div className="flex flex-wrap items-center gap-3 ml-auto text-xs sm:text-sm text-gray-600">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span className="hidden sm:inline">{occupied} confirmados</span>
              <span className="sm:hidden">{occupied}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
              <span className="hidden sm:inline">{pending} pendientes</span>
              <span className="sm:hidden">{pending}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
              <span className="hidden sm:inline">{free} libres</span>
              <span className="sm:hidden">{free}</span>
            </span>
            <span className="font-semibold text-violet-700">{pct}%</span>
          </div>
        )}
      </div>

      {/* Canvas + config panel side by side */}
      {tables.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Users className="w-12 h-12 text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium mb-2">Sin mesas configuradas</p>
          <p className="text-gray-400 text-sm mb-4">Agrega tu primera mesa para comenzar</p>
          <button
            onClick={() => addTable(false)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Agregar primera mesa
          </button>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-4 items-start">
          {/* Canvas */}
          <div className="flex-1 min-w-0 overflow-x-auto w-full">
            <SeatingCanvas
              planId={planId}
              tables={tables}
              specialConfig={specialConfig}
              onTableMove={handleTableMove}
              onSeatClick={handleSeatClick}
              onTableClick={handleTableClick}
            />
          </div>

          {/* Right panel: table config OR guest list */}
          <div className="w-full lg:w-64 flex-shrink-0">
            {selectedTable ? (
              /* Table config */
              <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900 text-sm">
                    {selectedTable.is_bride_table
                      ? (specialConfig?.tableLabel || 'Mesa especial')
                      : `Mesa ${selectedTable.table_number}`}
                  </h3>
                  <button onClick={() => setSelectedTable(null)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Asientos (1–20)</label>
                    <input
                      type="number" min={1} max={20} value={seatCountInput}
                      onChange={e => setSeatCountInput(Number(e.target.value))}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                    />
                  </div>
                  <button onClick={saveTableConfig} className="w-full h-9 rounded-md bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors">
                    Guardar
                  </button>
                  <button onClick={deleteTable} className="w-full h-9 rounded-md border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
                    <Trash2 className="w-4 h-4" /> Eliminar mesa
                  </button>
                </div>
              </div>
            ) : (
              /* Guest list with accordion */
              <div className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden" style={{ maxHeight: CANVAS_H, overflowY: 'auto' }}>
                <div className="bg-violet-600 px-4 py-3 sticky top-0 z-10">
                  <p className="text-white text-sm font-semibold">Lista de invitados</p>
                </div>
                <div className="p-3 space-y-1.5">
                  {tables.map(table => {
                    const isBride = table.is_bride_table;
                    const tColor = isBride && specialConfig ? specialConfig.color : (isBride ? '#f43f5e' : '#7c3aed');
                    const tLabel = isBride && specialConfig ? specialConfig.tableLabel : `Mesa ${table.table_number}`;
                    const assignedSeats = (table.seats || []).filter((s, i) => {
                      const sl = isBride && specialConfig ? (specialConfig.specialSeats[i] || null) : null;
                      return sl || s.assignment?.guest_name;
                    });
                    return (
                      <AccordionTable
                        key={table.id}
                        table={table}
                        tColor={tColor}
                        tLabel={tLabel}
                        assignedSeats={assignedSeats}
                        specialConfig={specialConfig}
                        getSeatStatus={getSeatStatus}
                        SEAT_STATUS_COLORS={SEAT_STATUS_COLORS}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Guest selector */}
      {showGuestSelector && selectedSeat && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30" onClick={() => { setShowGuestSelector(false); setSelectedSeat(null); }}>
          <div
            className="bg-white rounded-xl shadow-2xl w-96 max-h-[32rem] overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-100 flex-shrink-0">
              <h3 className="font-semibold text-gray-900 text-sm">
                {selectedSeat.assignment ? 'Asiento ocupado' : 'Asignar invitado'}
              </h3>
              <button onClick={() => { setShowGuestSelector(false); setSelectedSeat(null); }} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 space-y-1 overflow-y-auto flex-1">
              {selectedSeat.assignment && (
                <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{selectedSeat.assignment.guest_name}</p>
                      <p className="text-xs text-gray-500 capitalize">{selectedSeat.assignment.rsvp_status || 'Sin RSVP'}</p>
                      {selectedSeat.assignment.party_size > 1 && (
                        <p className="text-xs text-violet-600 font-medium mt-1">
                          <Users className="w-3 h-3 inline mr-1" />
                          {selectedSeat.assignment.party_size} personas
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={unassignGuest}
                    className="mt-2 w-full h-8 rounded-md border border-red-200 text-red-600 text-xs font-medium hover:bg-red-50 transition-colors"
                  >
                    Remover
                  </button>
                </div>
              )}
              {!selectedSeat.assignment && unassignedGuests.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">Sin invitados disponibles</p>
              )}
              {!selectedSeat.assignment && unassignedGuests.map(g => (
                <button
                  key={g.id}
                  onClick={() => assignGuest(g.id)}
                  className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-violet-50 transition-colors border border-transparent hover:border-violet-200"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{g.name || g.full_name || g.id}</p>
                      {g.group_name && (
                        <p className="text-xs text-gray-500 truncate">{g.group_name}</p>
                      )}
                    </div>
                    {g.party_size > 1 && (
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 text-xs font-semibold flex-shrink-0">
                        <Users className="w-3 h-3" />
                        <span>{g.party_size}</span>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
