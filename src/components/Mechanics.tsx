import React from 'react';
import { Mechanic, Ticket, TicketStatus } from '../types';
import { Wrench, UserMinus, Plus, UserCircle, Car, CheckCircle2, Clock, AlertTriangle, TrendingUp, BarChart3 } from 'lucide-react';
import { cn } from '../lib/utils';

interface MechanicsProps {
    mechanics: Mechanic[];
    tickets: Ticket[];
    onAdd: () => void;
    onDelete: (id: string) => void;
}

export function Mechanics({ mechanics, tickets, onAdd, onDelete }: MechanicsProps) {
    const getMechanicStats = (mechanicName: string) => {
        const mechanicTickets = tickets.filter(t => t.mechanic === mechanicName);
        const activeTickets = mechanicTickets.filter(t => t.status !== 'Finalizado');
        const completedTickets = mechanicTickets.filter(t => t.status === 'Finalizado');

        // Carga de trabajo basada en un máximo sugerido de 5 autos simultáneos
        const workloadPercentage = Math.min((activeTickets.length / 5) * 100, 100);

        return {
            total: mechanicTickets.length,
            active: activeTickets.length,
            completed: completedTickets.length,
            workload: workloadPercentage,
            list: activeTickets.slice(0, 3) // Mostrar solo los primeros 3 para no saturar la card
        };
    };

    const getStatusColor = (status: TicketStatus) => {
        switch (status) {
            case 'Ingresado': return 'text-zinc-500 bg-zinc-100';
            case 'En Espera': return 'text-amber-600 bg-amber-50';
            case 'En Reparación': return 'text-blue-600 bg-blue-50';
            case 'Listo para Entrega': return 'text-emerald-600 bg-emerald-50';
            default: return 'text-zinc-400 bg-zinc-50';
        }
    };

    return (
        <div className="space-y-8 font-sans">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Gestión de Mecánicos</h2>
                    <p className="text-zinc-500 mt-1">Monitoreo de carga técnica y rendimiento del equipo.</p>
                </div>
                <button
                    onClick={onAdd}
                    className="flex items-center gap-2 px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl font-bold transition-all shadow-lg shadow-zinc-200 active:scale-95"
                >
                    <Plus className="w-5 h-5" />
                    Registrar Técnico
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                {mechanics.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-zinc-200">
                        <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <UserCircle className="w-10 h-10 text-zinc-300" />
                        </div>
                        <h3 className="text-xl font-bold text-zinc-900 mb-2">Sin personal registrado</h3>
                        <p className="text-zinc-500 max-w-xs mx-auto">Comienza registrando a tu primer mecánico para gestionar sus asignaciones.</p>
                    </div>
                ) : (
                    mechanics.map((m) => {
                        const stats = getMechanicStats(m.name);
                        return (
                            <div key={m.id} className="bg-white rounded-3xl shadow-sm border border-zinc-100 hover:shadow-xl hover:border-emerald-100 transition-all duration-300 group flex flex-col">
                                {/* Header Card */}
                                <div className="p-6 pb-4 flex items-center justify-between border-b border-zinc-50">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-zinc-900 flex items-center justify-center shadow-lg shadow-zinc-200">
                                            <Wrench className="w-7 h-7 text-emerald-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-zinc-900 group-hover:text-emerald-700 transition-colors uppercase tracking-tight">{m.name}</h3>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-50 px-1.5 py-0.5 rounded border border-zinc-100">ID: {m.id.split('-')[0].toUpperCase()}</span>
                                                {stats.active > 3 && (
                                                    <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 uppercase">
                                                        <AlertTriangle className="w-3 h-3" /> Saturado
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => onDelete(m.id)}
                                        className="p-2.5 text-zinc-300 hover:text-red-500 rounded-xl hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                                        title="Eliminar técnico"
                                    >
                                        <UserMinus className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Body / Stats */}
                                <div className="p-6 flex-1 space-y-6">
                                    {/* Carga de Trabajo Visual */}
                                    <div>
                                        <div className="flex justify-between items-end mb-2">
                                            <span className="text-sm font-bold text-zinc-600 uppercase tracking-wider">Carga de Trabajo</span>
                                            <span className="text-sm font-black text-zinc-900">{stats.active} / 5</span>
                                        </div>
                                        <div className="h-3 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200/50 p-0.5">
                                            <div
                                                className={cn(
                                                    "h-full rounded-full transition-all duration-1000 ease-out",
                                                    stats.workload > 80 ? "bg-red-500" : (stats.workload > 50 ? "bg-amber-500" : "bg-emerald-500")
                                                )}
                                                style={{ width: `${stats.workload}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    {/* Mini Dashboard Autos Actuales */}
                                    <div>
                                        <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                            <Car className="w-3.5 h-3.5" /> Autos Asignados ({stats.active})
                                        </h4>
                                        <div className="space-y-2">
                                            {stats.list.length > 0 ? (
                                                stats.list.map((ticket) => (
                                                    <div key={ticket.id} className="bg-zinc-50/50 p-3 rounded-xl border border-zinc-100 flex items-center justify-between group/item hover:bg-white hover:border-emerald-100 transition-all">
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-bold text-zinc-900 truncate">{ticket.model}</p>
                                                            <p className="text-[10px] font-mono font-medium text-zinc-500">{ticket.id}</p>
                                                        </div>
                                                        <span className={cn(
                                                            "text-[10px] font-black px-2 py-1 rounded-lg uppercase border italic",
                                                            getStatusColor(ticket.status)
                                                        )}>
                                                            {ticket.status}
                                                        </span>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-sm text-zinc-400 italic text-center py-2 bg-zinc-50 rounded-xl border border-dashed border-zinc-200">Disponible para asignación.</p>
                                            )}
                                            {stats.active > 3 && (
                                                <p className="text-[10px] text-zinc-400 text-center font-bold">+ {stats.active - 3} vehículos adicionales...</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Rendimiento (KPIs) */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-emerald-50/30 p-4 rounded-2xl border border-emerald-100/50">
                                            <div className="flex items-center gap-2 text-emerald-700 mb-1">
                                                <CheckCircle2 className="w-4 h-4" />
                                                <span className="text-[10px] font-black uppercase tracking-wider">Entregados</span>
                                            </div>
                                            <div className="text-2xl font-black text-emerald-900">{stats.completed}</div>
                                        </div>
                                        <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                                            <div className="flex items-center gap-2 text-zinc-500 mb-1">
                                                <BarChart3 className="w-4 h-4" />
                                                <span className="text-[10px] font-black uppercase tracking-wider">Total Hist.</span>
                                            </div>
                                            <div className="text-2xl font-black text-zinc-900">{stats.total}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer KPI Score */}
                                <div className="p-4 bg-zinc-50 rounded-b-3xl border-t border-zinc-100 flex items-center justify-between">
                                    <span className="text-xs font-bold text-zinc-500">SCORE DE RENDIMIENTO</span>
                                    <div className="flex items-center gap-1.5 text-emerald-600 font-black">
                                        <TrendingUp className="w-4 h-4" />
                                        {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
