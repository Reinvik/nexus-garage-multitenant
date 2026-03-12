import React, { useState } from 'react';
import { Ticket, TicketStatus, Mechanic, Reminder } from '../types';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Clock, User, MoreVertical, Plus, Car, Trash2, Search, CalendarCheck } from 'lucide-react';
import { cn } from '../lib/utils';
import { ConfirmModal } from './ConfirmModal';
import { KanbanTicketCard } from './KanbanTicketCard';
import { TicketHistoryModal } from './TicketHistoryModal';
import { VehicleCRMModal } from './VehicleCRMModal'; // Added import
import { GarageSettings } from '../types';

interface KanbanBoardProps {
  tickets: Ticket[];
  mechanics: Mechanic[];
  onUpdateStatus: (id: string, status: TicketStatus, changedBy?: string) => void;
  onShowHistory?: (ticket: Ticket) => void; // Added prop
  onShowCRM?: (ticket: Ticket) => void;     // Added prop
  onEditTicket: (ticket: Ticket) => void;
  onAddTicket: () => void;
  onClearFinished: () => Promise<void>;
  onUpdateNotes: (id: string, notes: string) => Promise<void>;
  reminders?: Reminder[];
  settings: GarageSettings | null;
}

const COLUMNS: { id: TicketStatus; label: string; color: string }[] = [
  { id: 'Ingresado', label: 'Ingresado', color: 'bg-zinc-200 text-zinc-700' },
  { id: 'En Espera', label: 'En Espera', color: 'bg-amber-100 text-amber-800' },
  { id: 'En Reparación', label: 'En Reparación', color: 'bg-blue-100 text-blue-800' },
  { id: 'Listo para Entrega', label: 'Listo para Entrega', color: 'bg-emerald-100 text-emerald-800' },
  { id: 'Finalizado', label: 'Finalizado', color: 'bg-zinc-800 text-zinc-300' },
];

export function KanbanBoard({ 
  tickets, 
  mechanics, 
  onUpdateStatus, 
  onEditTicket, 
  onAddTicket, 
  onClearFinished, 
  onUpdateNotes,
  reminders = [],
  settings
}: KanbanBoardProps) {
  const [draggedTicketId, setDraggedTicketId] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [selectedMechanic, setSelectedMechanic] = useState<string | null>(null);
  const [historyTicket, setHistoryTicket] = useState<Ticket | null>(null);
  const [crmTicket, setCrmTicket] = useState<Ticket | null>(null);

  const filteredTickets = tickets.filter(t => {
    return t.owner_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           t.owner_phone.includes(searchTerm) ||
           t.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
           t.id.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const [softLockPending, setSoftLockPending] = useState<{id: string, status: TicketStatus, mechanic: string} | null>(null);

  const matchedReminders = searchTerm.length >= 2 ? reminders.filter(r =>
    r.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.customer_phone.includes(searchTerm) ||
    r.patente.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedTicketId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, status: TicketStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    const userAction = selectedMechanic || 'Recepción/Admin';
    if (id && draggedTicketId === id) {
      const ticket = tickets.find(t => t.id === id);
      if (ticket && selectedMechanic && ticket.mechanic !== selectedMechanic && ticket.mechanic !== 'Sin asignar') {
        // Soft Lock
        setSoftLockPending({ id, status, mechanic: ticket.mechanic });
      } else {
        onUpdateStatus(id, status, userAction);
      }
    }
    setDraggedTicketId(null);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 flex-1 w-full">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Flujo de Trabajo</h2>
          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar cliente, patente o cita..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-zinc-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          
          {searchTerm && matchedReminders.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-emerald-50 border border-emerald-100 rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto w-full max-w-md ml-0 md:ml-32">
              <div className="flex items-center gap-2 mb-2">
                <CalendarCheck className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Citas Agendadas</span>
              </div>
              <div className="space-y-2">
                {matchedReminders.map(r => (
                  <div key={r.id} className="flex items-center justify-between bg-white p-2 rounded-lg border border-emerald-100 shadow-sm">
                    <div>
                      <div className="text-xs font-bold text-zinc-900">{r.customer_name}</div>
                      <div className="text-[10px] text-zinc-500">{r.patente} • {new Date(r.planned_date).toLocaleDateString()}</div>
                    </div>
                    <div className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full capitalize">
                      {r.reminder_type}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <button
          onClick={onAddTicket}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors shadow-sm w-full md:w-auto justify-center"
        >
          <Plus className="w-5 h-5" />
          Nuevo Ingreso
        </button>
      </div>

      {/* Filtros de Mecánicos */}
      {mechanics.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-4 mb-2 scrollbar-hide">
          <button
            onClick={() => setSelectedMechanic(null)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 border",
              selectedMechanic === null 
                ? "bg-zinc-900 text-white border-zinc-900 shadow-sm" 
                : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50"
            )}
          >
            Todos
          </button>
          {mechanics.map(m => (
            <button
              key={m.id}
              onClick={() => setSelectedMechanic(selectedMechanic === m.name ? null : m.name)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 border",
                selectedMechanic === m.name 
                  ? "bg-zinc-900 text-white border-zinc-900 shadow-sm" 
                  : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50"
              )}
            >
              <div className={cn(
                "w-4 h-4 rounded-full flex items-center justify-center text-[8px]",
                selectedMechanic === m.name ? "bg-zinc-800 text-zinc-300" : "bg-zinc-100 text-zinc-500"
              )}>
                {m.name.charAt(0).toUpperCase()}
              </div>
              {m.name}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-3 overflow-x-auto pb-4 flex-1">
        {COLUMNS.map((column) => {
          const columnTickets = filteredTickets.filter((t) => t.status === column.id);

          return (
            <div
              key={column.id}
              className="flex-1 min-w-[180px] bg-zinc-100 rounded-2xl p-3 flex flex-col border border-zinc-200/60"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div className="flex items-center justify-between mb-3 px-0.5">
                <div className="flex items-center gap-1.5">
                  <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wide uppercase", column.color)}>
                    {column.label}
                  </span>
                  <span className="text-xs font-medium text-zinc-500 bg-white px-1.5 py-0.5 rounded-full shadow-sm border border-zinc-200">
                    {columnTickets.length}
                  </span>
                </div>
                {column.id === 'Finalizado' && columnTickets.length > 0 && (
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    disabled={clearing}
                    title="Limpiar finalizados"
                    className="p-1 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                  >
                    <Trash2 className={cn("w-3.5 h-3.5", clearing && "animate-spin")} />
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 min-h-[150px]">
                {columnTickets.map((ticket) => (
                  <KanbanTicketCard
                    key={ticket.id}
                    ticket={ticket}
                    settings={settings}
                    selectedMechanic={selectedMechanic}
                    isDragged={draggedTicketId === ticket.id}
                    onDragStart={handleDragStart}
                    onEdit={onEditTicket}
                    onShowHistory={setHistoryTicket}
                    onShowCRM={setCrmTicket}
                  />
                ))}
                {columnTickets.length === 0 && (
                  <div className="h-full flex items-center justify-center border-2 border-dashed border-zinc-300/50 rounded-xl text-zinc-400 text-xs font-medium">
                    Arrastra aquí
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmModal
        isOpen={showClearConfirm}
        title="Limpiar Finalizados"
        message={`¿Estás seguro que deseas eliminar los tickets finalizados? Esta acción no se puede deshacer.`}
        onConfirm={async () => {
          setClearing(true);
          try {
            await onClearFinished();
          } finally {
            setClearing(false);
          }
        }}
        onCancel={() => setShowClearConfirm(false)}
      />

      <ConfirmModal
        isOpen={!!softLockPending}
        title="Confirmar Movimiento"
        message={`Este vehículo está asignado a ${softLockPending?.mechanic}. ¿Confirmas el movimiento?`}
        onConfirm={() => {
          if (softLockPending) {
            onUpdateStatus(softLockPending.id, softLockPending.status, selectedMechanic || 'Recepción/Admin');
            setSoftLockPending(null);
          }
        }}
        onCancel={() => setSoftLockPending(null)}
      />

      <TicketHistoryModal
        isOpen={historyTicket !== null}
        onClose={() => setHistoryTicket(null)}
        ticket={historyTicket}
      />

      <VehicleCRMModal
        isOpen={crmTicket !== null}
        onClose={() => setCrmTicket(null)}
        ticket={crmTicket}
        onUpdateNotes={onUpdateNotes}
      />
    </div>
  );
}
