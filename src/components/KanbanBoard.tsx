import React, { useState } from 'react';
import { Ticket, TicketStatus, Mechanic } from '../types';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Clock, User, MoreVertical, Plus, Car, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface KanbanBoardProps {
  tickets: Ticket[];
  mechanics: Mechanic[];
  onUpdateStatus: (id: string, status: TicketStatus) => void;
  onEditTicket: (ticket: Ticket) => void;
  onAddTicket: () => void;
  onClearFinished: () => Promise<void>;
}

const COLUMNS: { id: TicketStatus; label: string; color: string }[] = [
  { id: 'Ingresado', label: 'Ingresado', color: 'bg-zinc-200 text-zinc-700' },
  { id: 'En Espera', label: 'En Espera', color: 'bg-amber-100 text-amber-800' },
  { id: 'En Reparación', label: 'En Reparación', color: 'bg-blue-100 text-blue-800' },
  { id: 'Listo para Entrega', label: 'Listo para Entrega', color: 'bg-emerald-100 text-emerald-800' },
  { id: 'Finalizado', label: 'Finalizado', color: 'bg-zinc-800 text-zinc-300' },
];

export function KanbanBoard({ tickets, mechanics, onUpdateStatus, onEditTicket, onAddTicket, onClearFinished }: KanbanBoardProps) {
  const [draggedTicketId, setDraggedTicketId] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);

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
    if (id && draggedTicketId === id) {
      onUpdateStatus(id, status);
    }
    setDraggedTicketId(null);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Flujo de Trabajo</h2>
        <button
          onClick={onAddTicket}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Nuevo Ingreso
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4 flex-1">
        {COLUMNS.map((column) => {
          const columnTickets = tickets.filter((t) => t.status === column.id);

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
                    onClick={async () => {
                      if (window.confirm(`¿Eliminar ${columnTickets.length} ticket(s) finalizado(s)? Esta acción no se puede deshacer.`)) {
                        setClearing(true);
                        try { await onClearFinished(); } finally { setClearing(false); }
                      }
                    }}
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
                  <div
                    key={ticket.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, ticket.id)}
                    className={cn(
                      "bg-white p-3 rounded-xl shadow-sm border border-zinc-200 cursor-grab active:cursor-grabbing hover:shadow-md transition-all group",
                      draggedTicketId === ticket.id ? "opacity-50" : "opacity-100"
                    )}
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-mono font-bold text-zinc-700 bg-zinc-100 px-1.5 py-0.5 rounded-md w-fit mb-1 border border-zinc-200/60 tracking-wide truncate">
                          {ticket.id}
                        </span>
                        <h3 className="font-semibold text-zinc-900 leading-tight flex items-center gap-1 text-xs">
                          <Car className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                          <span className="truncate">{ticket.model}</span>
                        </h3>
                      </div>
                      <button
                        onClick={() => onEditTicket(ticket)}
                        className="text-zinc-400 hover:text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-zinc-100 rounded-md flex-shrink-0"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-[11px] text-zinc-500 line-clamp-2 mb-2 leading-snug">
                      {ticket.notes}
                    </p>

                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-zinc-100">
                      <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-medium truncate">
                        <User className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{ticket.mechanic}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-zinc-400 flex-shrink-0">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(parseISO(ticket.entry_date), { addSuffix: true, locale: es })}
                      </div>
                    </div>
                  </div>
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
    </div>
  );
}
