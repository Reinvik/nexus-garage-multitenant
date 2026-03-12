import React, { useState, useEffect } from 'react';
import { GarageSettings } from '../types';
import { Save, Building2, MapPin, Phone, MessageSquare, Loader2, CheckCircle } from 'lucide-react';

interface SettingsFormProps {
    settings: GarageSettings | null;
    onUpdate: (updates: Partial<GarageSettings>) => Promise<void>;
}

export function SettingsForm({ settings, onUpdate }: SettingsFormProps) {
    const [formData, setFormData] = useState({
        workshop_name: '',
        address: '',
        phone: '',
        whatsapp_template: '',
        logo_url: ''
    });
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (settings) {
            setFormData({
                workshop_name: settings.workshop_name || '',
                address: settings.address || '',
                phone: settings.phone || '',
                whatsapp_template: settings.whatsapp_template || '',
                logo_url: settings.logo_url || ''
            });
        }
    }, [settings]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onUpdate(formData);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            console.error('Error saving settings:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden font-sans">
            <div className="p-6 border-b border-zinc-100 bg-zinc-50/50">
                <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                    Configuración del Taller
                </h2>
                <p className="text-zinc-500 text-sm mt-1">Personaliza la información de tu taller y las comunicaciones con los clientes.</p>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8 max-w-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-zinc-400" />
                            Nombre del Taller
                        </label>
                        <input
                            required
                            type="text"
                            placeholder="Ej: Nexus Garage"
                            className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-zinc-800"
                            value={formData.workshop_name}
                            onChange={e => setFormData({ ...formData, workshop_name: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
                            <Phone className="w-4 h-4 text-zinc-400" />
                            Teléfono del Taller
                        </label>
                        <input
                            type="text"
                            placeholder="+569 1234 5678"
                            className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-zinc-800 font-mono"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>

                    <div className="md:col-span-2 space-y-2">
                        <label className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-zinc-400" />
                            URL del Logo
                        </label>
                        <input
                            type="text"
                            placeholder="https://ejemplo.com/mi-logo.png"
                            className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-zinc-800"
                            value={formData.logo_url}
                            onChange={e => setFormData({ ...formData, logo_url: e.target.value })}
                        />
                    </div>

                    <div className="md:col-span-2 space-y-2">
                        <label className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-zinc-400" />
                            Dirección
                        </label>
                        <input
                            type="text"
                            placeholder="Av. Principal #123, Ciudad"
                            className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-zinc-800"
                            value={formData.address}
                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                        />
                    </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-zinc-100">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-zinc-400" />
                            Plantilla de WhatsApp
                        </label>
                        <textarea
                            rows={3}
                            placeholder="Mensaje que se enviará a los clientes..."
                            className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-zinc-800 resize-none"
                            value={formData.whatsapp_template}
                            onChange={e => setFormData({ ...formData, whatsapp_template: e.target.value })}
                        />
                        <div className="flex gap-2 flex-wrap mt-2">
                            <span className="text-[10px] px-2 py-0.5 bg-zinc-100 text-zinc-500 rounded border border-zinc-200">Variables: </span>
                            <code className="text-[10px] px-1.5 py-0.5 bg-zinc-100 text-emerald-600 rounded border border-zinc-200">{"{{cliente}}"}</code>
                            <code className="text-[10px] px-1.5 py-0.5 bg-zinc-100 text-emerald-600 rounded border border-zinc-200">{"{{vehiculo}}"}</code>
                            <code className="text-[10px] px-1.5 py-0.5 bg-zinc-100 text-emerald-600 rounded border border-zinc-200">{"{{estado}}"}</code>
                            <code className="text-[10px] px-1.5 py-0.5 bg-zinc-100 text-emerald-600 rounded border border-zinc-200">{"{{nombre_taller}}"}</code>
                            <code className="text-[10px] px-1.5 py-0.5 bg-zinc-100 text-emerald-600 rounded border border-zinc-200">{"{{telefono_taller}}"}</code>
                        </div>
                    </div>
                </div>

                <div className="pt-6 flex items-center justify-between border-t border-zinc-100">
                    {saved && (
                        <span className="text-emerald-600 text-sm font-medium flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2">
                            <CheckCircle className="w-4 h-4" />
                            Configuración guardada correctamente
                        </span>
                    )}
                    <button
                        type="submit"
                        disabled={loading}
                        className="ml-auto flex items-center gap-2 px-8 py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {loading ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </div>
            </form>
        </div>
    );
}
