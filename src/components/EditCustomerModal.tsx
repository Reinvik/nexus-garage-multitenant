import React, { useState, useEffect } from 'react';
import { Customer } from '../types';
import { X, Save, User, Phone, Mail, Loader2 } from 'lucide-react';

interface EditCustomerModalProps {
    isOpen: boolean;
    onClose: () => void;
    customer: Customer | null;
    onUpdate: (id: string, updates: Partial<Customer>) => Promise<void>;
    suggestedModels?: string[];
}

export function EditCustomerModal({ isOpen, onClose, customer, onUpdate, suggestedModels = [] }: EditCustomerModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        last_mileage: 0,
        last_vin: '',
        last_model: '',
        last_engine_id: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (customer) {
            setFormData({
                name: customer.name,
                phone: customer.phone,
                email: customer.email || '',
                last_mileage: customer.last_mileage || 0,
                last_vin: customer.last_vin || '',
                last_model: customer.last_model || '',
                last_engine_id: customer.last_engine_id || ''
            });
        }
    }, [customer]);

    if (!isOpen || !customer) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onUpdate(customer.id, formData);
            onClose();
        } catch (error) {
            console.error('Error updating customer:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-zinc-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
                <div className="flex justify-between items-center p-6 border-b border-zinc-100">
                    <h2 className="text-xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
                        Editar Cliente
                    </h2>
                    <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-600 rounded-full hover:bg-zinc-100 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
                            <User className="w-4 h-4 text-zinc-400" />
                            Nombre Completo
                        </label>
                        <input
                            required
                            type="text"
                            className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-zinc-800"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
                            <Phone className="w-4 h-4 text-zinc-400" />
                            Teléfono (WhatsApp)
                        </label>
                        <input
                            required
                            type="text"
                            className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-zinc-800 font-mono"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
                            <Mail className="w-4 h-4 text-zinc-400" />
                            Email (Opcional)
                        </label>
                        <input
                            type="email"
                            className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-zinc-800"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
                            Marca y Modelo Principal
                        </label>
                        <input
                            type="text"
                            list="edit-customer-vehicle-models"
                            placeholder="Ej: Toyota Hilux"
                            className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-zinc-800 font-bold"
                            value={formData.last_model}
                            onChange={e => setFormData({ ...formData, last_model: e.target.value })}
                        />
                        <datalist id="edit-customer-vehicle-models">
                            {suggestedModels.map(m => (
                                <option key={m} value={m} />
                            ))}
                        </datalist>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-zinc-700">N° Motor</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-zinc-800 font-mono uppercase"
                                value={formData.last_engine_id}
                                onChange={e => setFormData({ ...formData, last_engine_id: e.target.value.toUpperCase() })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-zinc-700">VIN / Chasis</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-zinc-800 font-mono uppercase"
                                value={formData.last_vin}
                                onChange={e => setFormData({ ...formData, last_vin: e.target.value.toUpperCase() })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-zinc-700">Kilometraje (KM)</label>
                        <input
                            type="number"
                            className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-zinc-800"
                            value={formData.last_mileage || ''}
                            onChange={e => setFormData({ ...formData, last_mileage: parseInt(e.target.value) || 0 })}
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t border-zinc-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-sm font-semibold text-zinc-600 hover:bg-zinc-100 rounded-xl transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-sm disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {loading ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
