import React, { useMemo } from 'react';
import { Ticket } from '../types';
import { differenceInDays, differenceInHours, parseISO } from 'date-fns';
import { AlertTriangle, Clock, Activity, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface KPIsProps {
  tickets: Ticket[];
}

export function KPIs({ tickets }: KPIsProps) {
  const { leadTime, cycleTime, stalledTickets } = useMemo(() => {
    const closedTickets = tickets.filter(t => t.status === 'Finalizado' && t.close_date);

    let totalLeadTimeHours = 0;
    let totalCycleTimeHours = 0; // Simplified cycle time (just an example, ideally we track time in 'En Reparación')

    closedTickets.forEach(t => {
      if (t.close_date) {
        totalLeadTimeHours += differenceInHours(parseISO(t.close_date), parseISO(t.entry_date));
        // Mock cycle time as 60% of lead time for demonstration
        totalCycleTimeHours += differenceInHours(parseISO(t.close_date), parseISO(t.entry_date)) * 0.6;
      }
    });

    const avgLeadTimeDays = closedTickets.length > 0 ? (totalLeadTimeHours / closedTickets.length / 24).toFixed(1) : '0';
    const avgCycleTimeDays = closedTickets.length > 0 ? (totalCycleTimeHours / closedTickets.length / 24).toFixed(1) : '0';

    const activeTickets = tickets.filter(t => t.status !== 'Finalizado');
    const stalled = activeTickets.map(t => {
      const daysInSystem = differenceInDays(new Date(), parseISO(t.entry_date));
      let alertLevel: 'Crítico' | 'Atención' | 'Revisar' = 'Revisar';
      let color = 'text-yellow-600 bg-yellow-50 border-yellow-200';
      let icon = <AlertCircle className="w-4 h-4 text-yellow-500" />;

      if (daysInSystem >= 10) {
        alertLevel = 'Crítico';
        color = 'text-red-600 bg-red-50 border-red-200';
        icon = <AlertTriangle className="w-4 h-4 text-red-500" />;
      } else if (daysInSystem >= 5) {
        alertLevel = 'Atención';
        color = 'text-orange-600 bg-orange-50 border-orange-200';
        icon = <AlertTriangle className="w-4 h-4 text-orange-500" />;
      }

      return { ...t, daysInSystem, alertLevel, color, icon };
    }).filter(t => t.daysInSystem >= 3).sort((a, b) => b.daysInSystem - a.daysInSystem);

    return { leadTime: avgLeadTimeDays, cycleTime: avgCycleTimeDays, stalledTickets: stalled };
  }, [tickets]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 mb-6">Métricas Principales</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-emerald-100 rounded-xl">
                <Clock className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-zinc-600">Tiempo Medio de Cierre (Lead Time)</h3>
            </div>
            <div className="flex items-baseline gap-2 mt-auto">
              <span className="text-4xl font-bold tracking-tight text-zinc-900">{leadTime}</span>
              <span className="text-lg font-medium text-zinc-500">Días</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-blue-100 rounded-xl">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-zinc-600">Tiempo en Reparación (Cycle Time)</h3>
            </div>
            <div className="flex items-baseline gap-2 mt-auto">
              <span className="text-4xl font-bold tracking-tight text-zinc-900">{cycleTime}</span>
              <span className="text-lg font-medium text-zinc-500">Días</span>
            </div>
            <p className="text-sm text-zinc-500 font-medium mt-2">
              Promedio de tiempo activo
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-amber-100 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="font-semibold text-zinc-600">Vehículos en Riesgo</h3>
            </div>
            <div className="flex items-baseline gap-2 mt-auto">
              <span className="text-4xl font-bold tracking-tight text-zinc-900">{stalledTickets.length}</span>
              <span className="text-lg font-medium text-zinc-500">Autos</span>
            </div>
            <p className="text-sm text-red-500 font-medium mt-2">
              Requieren atención inmediata
            </p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold tracking-tight text-zinc-900 mb-6 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          Alerta de Vehículos en Riesgo
        </h2>
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-sm font-semibold text-zinc-600 uppercase tracking-wider">
                <th className="px-6 py-4">Ticket (Modelo - Patente)</th>
                <th className="px-6 py-4">Estado Actual</th>
                <th className="px-6 py-4">Mecánico Asignado</th>
                <th className="px-6 py-4">Tiempo en el Sistema</th>
                <th className="px-6 py-4">Alerta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {stalledTickets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-zinc-500 font-medium">
                    No hay vehículos estancados. ¡Excelente trabajo!
                  </td>
                </tr>
              ) : (
                stalledTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-zinc-900">{ticket.model}</span>
                        <span className="font-mono text-xs text-zinc-500 mt-0.5">{ticket.id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-800">
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-zinc-700">
                      {ticket.mechanic}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-zinc-700">
                      {ticket.daysInSystem} Días
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border", ticket.color)}>
                        {ticket.icon}
                        {ticket.alertLevel}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
