import React from 'react';
import { Ticket, TicketStatus, GarageSettings } from '../types';
import { parseISO, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Car, Clock, ArrowLeft, CheckCircle2, Wrench, Package, AlertCircle, MapPin } from 'lucide-react';
import { cn } from '../lib/utils';

interface CustomerPortalProps {
  ticket: Ticket | null;
  settings: GarageSettings | null;
  onBack: () => void;
  onAcceptQuotation: (id: string, model: string) => Promise<void>;
}

export function CustomerPortal({ ticket, settings, onBack, onAcceptQuotation }: CustomerPortalProps) {
  const [loading, setLoading] = React.useState(false);

  if (!ticket) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4 font-sans">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-zinc-100">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 mb-2">Vehículo no encontrado</h2>
          <p className="text-zinc-500 mb-8">
            No encontramos ningún vehículo con esa patente en nuestro sistema. Por favor, verifica e intenta nuevamente.
          </p>
          <button
            onClick={onBack}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-xl font-bold transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver
          </button>
        </div>
      </div>
    );
  }

  const statusOrder: TicketStatus[] = [
    'Ingresado',
    'En Espera',
    'En Reparación',
    'Listo para Entrega',
    'Finalizado'
  ];

  const currentIndex = Math.max(0, statusOrder.indexOf(ticket.status));

  const safeFormatDate = (dateStr: string | undefined | null) => {
    try {
      if (!dateStr) return 'N/A';
      return format(parseISO(dateStr), "dd 'de' MMMM, yyyy", { locale: es });
    } catch (e) {
      return 'Fecha inválida';
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center py-8 px-4 font-sans">
      <div className="w-full max-w-3xl">
        {/* Banner del Taller */}
        {settings && (
          <div className="text-center mb-6">
            {settings.logo_url && (
              <img src={settings.logo_url} alt={settings.workshop_name} className="w-14 h-14 rounded-2xl mx-auto mb-3 border border-zinc-200 shadow-sm object-cover" />
            )}
            <h1 className="text-2xl font-black tracking-tight text-zinc-900 uppercase">
              {settings.workshop_name}
            </h1>
            {settings.address && (
              <p className="text-sm text-zinc-500 font-medium flex items-center justify-center gap-1 mt-1">
                <MapPin className="w-3.5 h-3.5" />
                {settings.address}
              </p>
            )}
          </div>
        )}

        <button
          onClick={onBack}
          className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 font-medium mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver al inicio
        </button>

        <div className="bg-white rounded-3xl shadow-xl border border-zinc-100 overflow-hidden">
          {/* Header */}
          <div className="bg-zinc-900 p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center">
                  <Car className="w-6 h-6 text-emerald-400" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight">{ticket.model}</h1>
              </div>
              <p className="text-zinc-400 font-medium flex items-center gap-2">
                Patente: <span className="font-mono text-emerald-400 bg-zinc-800 px-2 py-0.5 rounded-md tracking-wider">{ticket.id}</span>
              </p>
            </div>

            <div className="bg-zinc-800/50 p-4 rounded-2xl border border-zinc-700/50 min-w-[200px]">
              <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-1">Estado Actual</p>
              <p className="text-xl font-bold text-emerald-400 flex items-center gap-2">
                {ticket.status === 'Finalizado' ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                {ticket.status}
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            <h3 className="text-lg font-bold text-zinc-900 mb-6">Progreso de la Reparación</h3>

            {/* Timeline */}
            <div className="relative mb-12">
              <div className="absolute top-1/2 left-0 w-full h-1 bg-zinc-100 -translate-y-1/2 rounded-full"></div>
              <div
                className="absolute top-1/2 left-0 h-1 bg-emerald-500 -translate-y-1/2 rounded-full transition-all duration-500"
                style={{ width: `${(currentIndex / (statusOrder.length - 1)) * 100}%` }}
              ></div>

              <div className="relative flex justify-between">
                {statusOrder.map((status, index) => {
                  const isCompleted = index <= currentIndex;
                  const isCurrent = index === currentIndex;

                  return (
                    <div key={status} className="flex flex-col items-center gap-3 w-24">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors z-10 bg-white",
                        isCompleted ? "border-emerald-500 text-emerald-500" : "border-zinc-200 text-zinc-300",
                        isCurrent && "bg-emerald-50 border-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.1)]"
                      )}>
                        {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <div className="w-2.5 h-2.5 rounded-full bg-current"></div>}
                      </div>
                      <span className={cn(
                        "text-xs font-semibold text-center leading-tight",
                        isCurrent ? "text-emerald-700" : (isCompleted ? "text-zinc-700" : "text-zinc-400")
                      )}>
                        {status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-100">
                <div className="flex items-center gap-2 mb-4 text-zinc-900 font-bold">
                  <Wrench className="w-5 h-5 text-zinc-500" />
                  Detalles del Ingreso
                </div>
                <p className="text-sm text-zinc-600 mb-4 leading-relaxed">
                  {ticket.notes}
                </p>
                <div className="text-xs text-zinc-500 font-medium flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  Ingresado el {safeFormatDate(ticket.entry_date)}
                </div>
              </div>

              <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-100">
                <div className="flex items-center gap-2 mb-4 text-zinc-900 font-bold">
                  <Package className="w-5 h-5 text-zinc-500" />
                  Repuestos Necesarios
                </div>
                {ticket.parts_needed && ticket.parts_needed.length > 0 ? (
                  <ul className="space-y-2">
                    {ticket.parts_needed.map((part, idx) => (
                      <li key={idx} className="text-sm text-zinc-600 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                        {part}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-zinc-500 italic">
                    Aún no se han definido repuestos o no son necesarios.
                  </p>
                )}
              </div>
            </div>

            {/* Quotation Section */}
            {ticket.status === 'En Espera' && ticket.quotation_total !== undefined && ticket.quotation_total > 0 && (
              <div className="mt-8 p-8 bg-emerald-50 rounded-3xl border-2 border-emerald-100 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h4 className="text-emerald-900 font-bold text-xl mb-1">Cotización del Servicio</h4>
                  <p className="text-emerald-700 font-medium">El diagnóstico está listo. Puedes autorizar el trabajo ahora.</p>
                </div>
                <div className="flex flex-col items-center md:items-end gap-3">
                  <div className="text-3xl font-black text-emerald-900">
                    ${ticket.quotation_total.toLocaleString('es-CL')}
                  </div>
                  {ticket.quotation_accepted ? (
                    <div className="flex items-center gap-2 text-emerald-600 font-bold bg-white px-4 py-2 rounded-xl border border-emerald-200 shadow-sm">
                      <CheckCircle2 className="w-5 h-5" />
                      Cotización Aceptada
                    </div>
                  ) : (
                    <button
                      onClick={async () => {
                        setLoading(true);
                        try {
                          await onAcceptQuotation(ticket.id, ticket.model);
                        } finally {
                          setLoading(false);
                        }
                      }}
                      disabled={loading}
                      className="w-full md:w-auto px-8 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Clock className="w-5 h-5 animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          Aceptar y Comenzar Reparación
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
