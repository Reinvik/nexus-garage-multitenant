import React, { useState } from 'react';
import { Users, Search, Mail, Phone, Car, Calendar, X, Edit2, MessageCircle } from 'lucide-react';
import { formatDistanceToNow, parseISO, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../lib/utils';
import { AddCustomerModal } from './AddCustomerModal';
import { EditCustomerModal } from './EditCustomerModal';
import { Customer, Ticket, TicketStatus, GarageSettings } from '../types';

interface CustomersProps {
  customers: Customer[];
  tickets: Ticket[];
  settings: GarageSettings | null;
  onAddCustomer: (customer: any) => Promise<void>;
  onUpdateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>;
}

const statusMap: Record<TicketStatus, string> = {
  'Ingresado': 'ingresado',
  'En Espera': 'en espera',
  'En Reparación': 'en proceso',
  'Listo para Entrega': 'listo para entrega',
  'Finalizado': 'entregado'
};

export function Customers({ customers, tickets, settings, onAddCustomer, onUpdateCustomer }: CustomersProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsEditModalOpen(true);
  };

  const handleWhatsApp = (customer: Customer) => {
    if (!settings) return;

    // Buscar el último ticket de este cliente para obtener el estado real
    const customerTickets = tickets.filter(t => t.owner_phone === customer.phone || t.owner_name === customer.name);
    const lastTicket = customerTickets.length > 0 ? customerTickets[0] : null;

    const friendlyStatus = lastTicket ? statusMap[lastTicket.status] : 'en proceso';
    const vehicleModel = lastTicket ? lastTicket.model : (customer.vehicles[0] || 'su vehículo');

    const message = settings.whatsapp_template
      .replace(/{{cliente}}/g, customer.name)
      .replace(/{{vehiculo}}/g, vehicleModel)
      .replace(/{{estado}}/g, friendlyStatus)
      .replace(/{{nombre_taller}}/g, settings.workshop_name || 'nuestro taller')
      .replace(/{{telefono_taller}}/g, settings.phone || '');

    const encodedMessage = encodeURIComponent(message);
    const phone = customer.phone.replace(/\D/g, '');
    window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm) ||
    c.vehicles.some(v => v.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-8 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Directorio de Clientes</h2>
          <p className="text-zinc-500 mt-1">Administra la información de contacto y el historial de vehículos.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-medium transition-colors shadow-sm"
        >
          <Users className="w-5 h-5" />
          Nuevo Cliente
        </button>
      </div>

      <AddCustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={onAddCustomer}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
        <div className="p-4 border-b border-zinc-100 flex items-center gap-4 bg-zinc-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, teléfono o patente..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-sm"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Mobile View (Cards) */}
        <div className="md:hidden divide-y divide-zinc-100">
          {filteredCustomers.length === 0 ? (
            <div className="px-6 py-8 text-center text-zinc-500 font-medium">
              No se encontraron clientes.
            </div>
          ) : (
            filteredCustomers.map((customer) => (
              <div key={customer.id} className="p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center border border-emerald-200 text-emerald-700 font-extrabold">
                      {customer.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-900">{customer.name}</h4>
                      <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase">ID: {customer.id}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleWhatsApp(customer)}
                      className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl active:scale-95 transition-transform"
                    >
                      <MessageCircle className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleEdit(customer)}
                      className="p-2.5 bg-zinc-50 text-zinc-400 rounded-xl active:scale-95 transition-transform"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-center gap-2 text-sm text-zinc-600">
                    <Phone className="w-4 h-4 text-zinc-400" />
                    {customer.phone}
                  </div>
                  {customer.email && (
                    <div className="flex items-center gap-2 text-sm text-zinc-600">
                      <Mail className="w-4 h-4 text-zinc-400" />
                      <span className="truncate">{customer.email}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 font-mono">
                  <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Vehículos</p>
                  <div className="flex flex-wrap gap-2">
                    {customer.vehicles.map(v => (
                      <span key={v} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-zinc-100 text-zinc-700 border border-zinc-200">
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View (Table) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Contacto</th>
                <th className="px-6 py-4">Vehículos (Patentes)</th>
                <th className="px-6 py-4">Última Visita</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-zinc-500 font-medium">
                    No se encontraron clientes.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-zinc-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center border border-emerald-200 text-emerald-700 font-bold">
                          {customer.name.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-zinc-900">{customer.name}</span>
                          <span className="text-xs text-zinc-500 font-mono">{customer.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-sm text-zinc-700 font-medium">
                          <Phone className="w-4 h-4 text-zinc-400" />
                          {customer.phone}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                          <Mail className="w-3.5 h-3.5 text-zinc-400" />
                          {customer.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {customer.vehicles.map(v => (
                          <span key={v} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-zinc-100 text-zinc-700 border border-zinc-200">
                            <Car className="w-3.5 h-3.5 text-zinc-400" />
                            {v}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {customer.last_visit ? (
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-zinc-900 flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-zinc-400" />
                            {format(parseISO(customer.last_visit), "dd/MM/yyyy")}
                          </span>
                          <span className="text-xs text-zinc-500 mt-0.5">
                            Hace {formatDistanceToNow(parseISO(customer.last_visit), { locale: es })}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-400 italic">Nunca</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleWhatsApp(customer)}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors title='Enviar WhatsApp'"
                        >
                          <MessageCircle className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleEdit(customer)}
                          className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors title='Editar Cliente'"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <EditCustomerModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        customer={selectedCustomer}
        onUpdate={onUpdateCustomer}
      />
    </div>
  );
}
