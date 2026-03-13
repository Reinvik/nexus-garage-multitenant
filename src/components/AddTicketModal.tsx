import React, { useState, useEffect, useMemo } from 'react';
import { Mechanic, TicketStatus, Customer, Ticket, GarageSettings } from '../types';
import { X, Search, Info, UserPlus, History } from 'lucide-react';
import { CAR_BRANDS, CAR_MODELS } from '../lib/carData';

interface AddTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (ticket: any) => void;
  mechanics: Mechanic[];
  customers: Customer[];
  tickets: Ticket[];
  settings: GarageSettings | null;
}

export function AddTicketModal({ isOpen, onClose, onAdd, mechanics, customers, tickets, settings }: AddTicketModalProps) {
  const [formData, setFormData] = useState({
    id: '',
    model: '',
    status: 'Ingresado' as TicketStatus,
    mechanic_id: 'Sin asignar',
    owner_name: '',
    owner_phone: '',
    notes: '',
    vin: '',
    engine_id: '',
    mileage: 0,
  });

  const [brandSearch, setBrandSearch] = useState('');
  const [modelSuggestions, setModelSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const systemModels = useMemo(() => {
    const models = new Set<string>();
    tickets.forEach(t => t.model && models.add(t.model));
    customers.forEach(c => c.last_model && models.add(c.last_model));
    return Array.from(models).sort();
  }, [tickets, customers]);

  // Branding Colors
  const primaryColor = settings?.theme_menu_highlight || '#10b981';
  const primaryBg = `${primaryColor}15`;

  // Customer search state
  const [customerSearch, setCustomerSearch] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [isCustomerFilled, setIsCustomerFilled] = useState(false);

  useEffect(() => {
    if (customerSearch.length >= 3 && !isCustomerFilled) {
      const filtered = customers.filter(c => 
        c.phone.includes(customerSearch) || 
        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        (c.vehicles && c.vehicles.some(v => v.toUpperCase().includes(customerSearch.toUpperCase())))
      );
      setFilteredCustomers(filtered);
      setShowCustomerSearch(filtered.length > 0);
    } else {
      setShowCustomerSearch(false);
    }
  }, [customerSearch, customers, isCustomerFilled]);

  const selectCustomer = (customer: Customer) => {
    setFormData(prev => ({
      ...prev,
      id: customer.vehicles?.[0] || prev.id,
      owner_name: customer.name,
      owner_phone: customer.phone,
      vin: customer.last_vin || prev.vin,
      engine_id: customer.last_engine_id || prev.engine_id,
      mileage: customer.last_mileage || prev.mileage,
      model: customer.last_model || prev.model
    }));
    setCustomerSearch(customer.phone);
    setIsCustomerFilled(true);
    setShowCustomerSearch(false);
  };

  useEffect(() => {
    if (formData.model.length > 1) {
      const match = CAR_BRANDS.find(b => formData.model.toLowerCase().includes(b.toLowerCase()));
      if (match) {
        setBrandSearch(match);
        setModelSuggestions(CAR_MODELS[match] || []);
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  }, [formData.model]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(formData);
    onClose();
    setFormData({
      id: '',
      model: '',
      status: 'Ingresado',
      mechanic_id: 'Sin asignar',
      owner_name: '',
      owner_phone: '',
      notes: '',
      vin: '',
      engine_id: '',
      mileage: 0,
    });
  };

  return (
    <div className="fixed inset-0 bg-zinc-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[95vh]">
        <div className="flex justify-between items-center p-6 border-b border-zinc-100 bg-zinc-50/50">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-zinc-900">Nuevo Ingreso de Vehículo</h2>
            <p className="text-xs text-zinc-500 mt-0.5 font-medium">Completa la ficha técnica para iniciar la recepción.</p>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-600 rounded-full hover:bg-white transition-colors border border-transparent hover:border-zinc-200 shadow-none hover:shadow-sm">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-8">
          {/* Sección 1: Datos del Vehículo */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-4 rounded-full" style={{ backgroundColor: primaryColor }}></div>
              <h3 className="text-sm font-black text-zinc-900 uppercase tracking-widest">Información Básica</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Patente / ID</label>
                <input
                  required
                  type="text"
                  placeholder="AB·CD·12"
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 outline-none transition-all font-mono font-black uppercase text-lg bg-zinc-50/30 focus:ring-4"
                  style={{ 
                    borderColor: formData.id ? primaryColor : undefined,
                    boxShadow: formData.id ? `0 0 0 4px ${primaryColor}15` : undefined
                  }}
                  value={formData.id}
                  onChange={e => setFormData({ ...formData, id: e.target.value.toUpperCase() })}
                />
              </div>
              <div className="space-y-2 relative">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Marca y Modelo</label>
                <div className="relative group">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300 transition-colors" style={{ color: formData.model ? primaryColor : undefined }} />
                  <input
                    required
                    list="car-models"
                    type="text"
                    placeholder="Eje: Toyota Yaris"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 outline-none transition-all font-bold text-zinc-800 focus:ring-4"
                    style={{ 
                      borderColor: formData.model ? primaryColor : undefined,
                      boxShadow: formData.model ? `0 0 0 4px ${primaryColor}15` : undefined
                    }}
                    value={formData.model}
                    onChange={e => setFormData({ ...formData, model: e.target.value })}
                  />
                  <datalist id="car-models">
                    {systemModels.map(m => (
                      <option key={m} value={m} />
                    ))}
                    {CAR_BRANDS.map(brand => (
                      <option key={brand} value={brand} />
                    ))}
                    {brandSearch && CAR_MODELS[brandSearch]?.map(model => (
                      <option key={model} value={`${brandSearch} ${model}`} />
                    ))}
                  </datalist>
                </div>
              </div>
            </div>
          </div>

          {/* Sección 2: Ficha Técnica */}
          <div className="space-y-4 pt-4 border-t border-zinc-50">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
              <h3 className="text-sm font-black text-zinc-900 uppercase tracking-widest">Especificaciones Técnicas</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">N° Chasis (VIN)</label>
                <input
                  type="text"
                  placeholder="17 caracteres..."
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 outline-none transition-all font-mono text-sm uppercase bg-zinc-50/30 focus:ring-4"
                  style={{ 
                    borderColor: formData.vin ? primaryColor : undefined,
                    boxShadow: formData.vin ? `0 0 0 4px ${primaryColor}15` : undefined
                  }}
                  value={formData.vin}
                  onChange={e => setFormData({ ...formData, vin: e.target.value.toUpperCase() })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">N° Motor</label>
                <input
                  type="text"
                  placeholder="ID del motor..."
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 outline-none transition-all font-mono text-sm uppercase bg-zinc-50/30 focus:ring-4"
                  style={{ 
                    borderColor: formData.engine_id ? primaryColor : undefined,
                    boxShadow: formData.engine_id ? `0 0 0 4px ${primaryColor}15` : undefined
                  }}
                  value={formData.engine_id}
                  onChange={e => setFormData({ ...formData, engine_id: e.target.value.toUpperCase() })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Kilometraje (KM)</label>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="0"
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 outline-none transition-all font-bold text-zinc-800 pr-12 bg-zinc-50/30 focus:ring-4"
                    style={{ 
                      borderColor: formData.mileage ? primaryColor : undefined,
                      boxShadow: formData.mileage ? `0 0 0 4px ${primaryColor}15` : undefined
                    }}
                    value={formData.mileage || ''}
                    onChange={e => setFormData({ ...formData, mileage: parseInt(e.target.value) || 0 })}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-400">KM</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sección 3: Datos del Propietario */}
          <div className="space-y-4 pt-4 border-t border-zinc-50">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-4 bg-amber-500 rounded-full"></div>
              <h3 className="text-sm font-black text-zinc-900 uppercase tracking-widest">Información Propietario</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 relative">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider" style={{ color: primaryColor }}>Buscar por Teléfono o Nombre</label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: primaryColor }} />
                  <input
                    type="text"
                    placeholder="Ej: +569..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl outline-none transition-all font-medium border"
                    style={{ 
                        backgroundColor: primaryBg,
                        borderColor: `${primaryColor}40`,
                        boxShadow: customerSearch.length >= 3 ? `0 0 0 4px ${primaryColor}15` : undefined
                    }}
                    value={customerSearch}
                    onChange={e => {
                      setCustomerSearch(e.target.value);
                      setIsCustomerFilled(false);
                      setFormData(prev => ({ ...prev, owner_phone: e.target.value }));
                    }}
                  />
                  {showCustomerSearch && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto">
                      {filteredCustomers.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => selectCustomer(c)}
                          className="w-full px-4 py-3 text-left transition-colors flex items-center justify-between border-b border-zinc-100 last:border-0"
                          style={{ '--hover-bg': primaryBg } as any}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = primaryBg)}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                        >
                          <div>
                            <div className="font-bold text-zinc-900 text-sm">{c.name}</div>
                            <div className="text-xs text-zinc-500">{c.phone}</div>
                          </div>
                          {c.last_model && (
                            <div className="flex items-center gap-1 text-[10px] bg-zinc-100 px-2 py-0.5 rounded-full font-bold text-zinc-600">
                              <History className="w-3 h-3" /> {c.last_model}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Nombre del Cliente</label>
                <input
                  required
                  type="text"
                  placeholder="Nombre completo"
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 outline-none transition-all font-medium focus:ring-4"
                  style={{ 
                    borderColor: formData.owner_name ? primaryColor : undefined,
                    boxShadow: formData.owner_name ? `0 0 0 4px ${primaryColor}15` : undefined
                  }}
                  value={formData.owner_name}
                  onChange={e => setFormData({ ...formData, owner_name: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Mecánico Asignado</label>
              <select
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 outline-none transition-all bg-white font-bold text-zinc-700 focus:ring-4"
                style={{ 
                    borderColor: formData.mechanic_id !== 'Sin asignar' ? primaryColor : undefined,
                    boxShadow: formData.mechanic_id !== 'Sin asignar' ? `0 0 0 4px ${primaryColor}15` : undefined
                }}
                value={formData.mechanic_id}
                onChange={e => setFormData({ ...formData, mechanic_id: e.target.value })}
              >
                <option value="Sin asignar">Sin asignar por ahora</option>
                {mechanics.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Observaciones / Motivo Ingreso</label>
            <textarea
              required
              rows={3}
              placeholder="Describe el síntoma o el trabajo solicitado..."
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all resize-none font-medium"
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="pt-6 flex justify-end gap-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-sm font-bold text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 rounded-xl transition-all"
            >
              Cerrar
            </button>
            <button
              type="submit"
              className="px-8 py-3 text-sm font-black text-white rounded-xl transition-all shadow-lg active:scale-95 flex items-center gap-2"
              style={{ 
                  backgroundColor: primaryColor,
                  shadowColor: `${primaryColor}40`
              }}
            >
              Registrar Vehículo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
