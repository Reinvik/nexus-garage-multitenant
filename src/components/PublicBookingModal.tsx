import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, Car, ArrowRight, ArrowLeft, CheckCircle, Building2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../lib/utils';

interface PublicBookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    fetchCompanies: () => Promise<{ id: string, name: string }[]>;
    onAddReminder: (reminder: any) => Promise<void>;
    fetchOccupied?: (companyId: string, date: string) => Promise<string[]>;
    fetchVehicleInfo?: (patente: string, company_id: string) => Promise<any>;
    branding?: any;
}

const TIME_SLOTS = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'
];

export function PublicBookingModal({ isOpen, onClose, fetchCompanies, onAddReminder, fetchOccupied, fetchVehicleInfo, branding }: PublicBookingModalProps) {
    const [step, setStep] = useState(1);
    const [companies, setCompanies] = useState<{ id: string, name: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [occupiedSlots, setOccupiedSlots] = useState<string[]>([]);
    
    const [formData, setFormData] = useState({
        company_id: '',
        company_name: '',
        planned_date: format(new Date(), 'yyyy-MM-dd'),
        planned_time: '',
        customer_name: '',
        customer_phone: '',
        vehicle_id: '', // Patente
        vehicle_model: '',
        notes: ''
    });

    // Branding Colors
    const primaryColor = branding?.theme_menu_highlight || '#10b981';
    const primaryBg = `${primaryColor}15`;

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            fetchCompanies().then(data => {
                setCompanies(data);
                // Si ya hay un company_id (venimos de un link), seleccionarlo
                const tParam = new URLSearchParams(window.location.search).get('t');
                if (tParam) {
                    const company = data.find(c => (c as any).slug === tParam);
                    if (company) {
                        setFormData(prev => ({ ...prev, company_id: company.id, company_name: company.name }));
                        // Solo saltamos al paso 2 si estamos en el 1
                        setStep(s => s === 1 ? 2 : s);
                    }
                }
                setLoading(false);
            }).catch(err => {
                console.error(err);
                setLoading(false);
            });
        }
    }, [isOpen, fetchCompanies]);

    // Auto-completado por patente
    useEffect(() => {
        const patente = formData.vehicle_id;
        if (patente.length >= 6 && fetchVehicleInfo && formData.company_id) {
            // Solo autocompletar si los campos están vacíos para no sobreescribir si el usuario está editando
            fetchVehicleInfo(patente, formData.company_id).then(info => {
                if (info) {
                    setFormData(prev => ({
                        ...prev,
                        customer_name: prev.customer_name || info.owner_name,
                        customer_phone: prev.customer_phone || info.owner_phone,
                        vehicle_model: prev.vehicle_model || info.model
                    }));
                }
            });
        }
    }, [formData.vehicle_id, formData.company_id, fetchVehicleInfo]);

    // Cargar disponibilidad cuando cambia la fecha o taller
    useEffect(() => {
        if (formData.company_id && formData.planned_date && fetchOccupied) {
            fetchOccupied(formData.company_id, formData.planned_date).then(slots => {
                setOccupiedSlots(slots);
            });
        }
    }, [formData.company_id, formData.planned_date, fetchOccupied]);

    const handleNext = () => setStep(s => s + 1);
    const handleBack = () => setStep(s => s - 1);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await onAddReminder({
                company_id: formData.company_id,
                title: `Cita: ${formData.vehicle_model} (${formData.vehicle_id})`,
                description: `Cliente: ${formData.customer_name}\nMotivo: ${formData.notes}`,
                planned_date: formData.planned_date,
                planned_time: formData.planned_time,
                type: 'Cita Taller',
                completed: false
            });
            setSuccess(true);
        } catch (error) {
            console.error(error);
            alert('Error al agendar la visita. Por favor intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    if (success) {
        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                <div className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-300">
                    <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: primaryBg }}>
                        <CheckCircle className="w-10 h-10" style={{ color: primaryColor }} />
                    </div>
                    <h2 className="text-2xl font-bold text-zinc-900 mb-2">¡Cita Agendada!</h2>
                    <p className="text-zinc-500 mb-8 leading-relaxed">
                        Tu visita a <strong>{formData.company_name}</strong> ha sido registrada para el <span className="text-zinc-900 font-semibold">{format(new Date(formData.planned_date + 'T00:00:00'), "EEEE d 'de' MMMM", { locale: es })}</span> a las <span className="text-zinc-900 font-semibold">{formData.planned_time} hrs</span>.
                    </p>
                    <button
                        onClick={onClose}
                        className="w-full py-4 text-white rounded-2xl font-black transition-all shadow-lg active:scale-95"
                        style={{ backgroundColor: primaryColor }}
                    >
                        LISTO
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                {/* Header */}
                <div className="p-8 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                    <div>
                        <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Agendar Visita</h2>
                        <div className="flex gap-2 mt-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className={cn("h-1.5 w-10 rounded-full transition-all", step >= i ? "" : "bg-zinc-200")} style={{ backgroundColor: step >= i ? primaryColor : undefined }} />
                            ))}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-zinc-200 rounded-2xl transition-all text-zinc-400">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-8">
                    {/* STEP 1: Selección de Empresa */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-sm font-bold text-zinc-500 flex items-center gap-2 uppercase tracking-widest">
                                    <Building2 className="w-4 h-4" style={{ color: primaryColor }} />
                                    Selecciona tu Taller
                                </label>
                                {loading ? (
                                    <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin" style={{ color: primaryColor }} /></div>
                                ) : (
                                    <div className="grid gap-3 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                                        {companies.map(company => (
                                            <button
                                                key={company.id}
                                                onClick={() => {
                                                    setFormData({ ...formData, company_id: company.id, company_name: company.name });
                                                    handleNext();
                                                }}
                                                className={cn(
                                                    "w-full p-5 rounded-2xl border-2 text-left transition-all active:scale-[0.98]",
                                                    formData.company_id === company.id ? "bg-white shadow-xl" : "border-zinc-50 bg-zinc-50 hover:bg-white hover:border-zinc-200"
                                                )}
                                                style={{ borderColor: formData.company_id === company.id ? primaryColor : undefined }}
                                            >
                                                <span className="font-extrabold text-zinc-900 text-lg">{company.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* STEP 2: Fecha y Hora Inteligente */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-sm font-bold text-zinc-500 flex items-center gap-2 uppercase tracking-widest">
                                    <Calendar className="w-4 h-4" style={{ color: primaryColor }} />
                                    Fecha de Visita
                                </label>
                                <input
                                    type="date"
                                    min={format(new Date(), 'yyyy-MM-dd')}
                                    className="w-full p-4 rounded-2xl border-2 border-zinc-100 focus:border-zinc-400 outline-none transition-all font-bold text-zinc-900 bg-zinc-50"
                                    value={formData.planned_date}
                                    onChange={e => setFormData({ ...formData, planned_date: e.target.value, planned_time: '' })}
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-bold text-zinc-500 flex items-center gap-2 uppercase tracking-widest">
                                    <Clock className="w-4 h-4" style={{ color: primaryColor }} />
                                    Horarios Disponibles
                                </label>
                                <div className="grid grid-cols-4 gap-2">
                                    {TIME_SLOTS.map(slot => {
                                        const isOccupied = occupiedSlots.includes(slot);
                                        const isSelected = formData.planned_time === slot;
                                        
                                        return (
                                            <button
                                                key={slot}
                                                disabled={isOccupied}
                                                onClick={() => setFormData({ ...formData, planned_time: slot })}
                                                className={cn(
                                                    "py-3 rounded-xl font-bold text-sm transition-all border-2",
                                                    isOccupied ? "bg-zinc-50 border-zinc-50 text-zinc-300 cursor-not-allowed" :
                                                    isSelected ? "text-white shadow-lg scale-105" : "bg-white border-zinc-100 text-zinc-600 hover:border-zinc-300"
                                                )}
                                                style={{ 
                                                    backgroundColor: isSelected ? primaryColor : undefined,
                                                    borderColor: isSelected ? primaryColor : undefined
                                                }}
                                            >
                                                {slot}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="pt-4 flex gap-4">
                                <button onClick={handleBack} className="flex-1 py-4 bg-zinc-100 text-zinc-600 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all">
                                    <ArrowLeft className="w-5 h-5" /> Atrás
                                </button>
                                <button 
                                    onClick={handleNext}
                                    disabled={!formData.planned_date || !formData.planned_time}
                                    className="flex-[2] py-4 text-white rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50 active:scale-95"
                                    style={{ backgroundColor: primaryColor }}
                                >
                                    DATOS DE CONTACTO <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Datos de contacto */}
                    {step === 3 && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-zinc-400 tracking-tighter">Patente</label>
                                    <div className="relative">
                                        <Car className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                        <input
                                            type="text"
                                            placeholder="AB CD 12"
                                            className="w-full pl-10 pr-4 py-4 rounded-xl border-2 border-zinc-100 focus:border-zinc-400 outline-none font-black text-zinc-900 uppercase bg-zinc-50/50"
                                            value={formData.vehicle_id}
                                            onChange={e => setFormData({ ...formData, vehicle_id: e.target.value.toUpperCase() })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-zinc-400 tracking-tighter">Modelo del Auto</label>
                                    <input
                                        type="text"
                                        placeholder="Ej: Ford Raptor"
                                        className="w-full px-5 py-4 rounded-xl border-2 border-zinc-100 focus:border-zinc-400 outline-none font-bold bg-zinc-50/50"
                                        value={formData.vehicle_model}
                                        onChange={e => setFormData({ ...formData, vehicle_model: e.target.value })}
                                    />
                                </div>
                            </div>
                            
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-tighter">Tu Nombre Completo</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                    <input
                                        type="text"
                                        className="w-full pl-10 pr-4 py-4 rounded-xl border-2 border-zinc-100 focus:border-zinc-400 outline-none font-bold bg-zinc-50/50"
                                        value={formData.customer_name}
                                        onChange={e => setFormData({ ...formData, customer_name: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-tighter">WhatsApp (Importante)</label>
                                <input
                                    type="text"
                                    placeholder="+56 9..."
                                    className="w-full px-5 py-4 rounded-xl border-2 border-zinc-100 focus:border-zinc-400 outline-none font-bold bg-zinc-50/50"
                                    value={formData.customer_phone}
                                    onChange={e => setFormData({ ...formData, customer_phone: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-tighter">¿Cómo podemos ayudarte?</label>
                                <textarea
                                    className="w-full px-5 py-4 rounded-xl border-2 border-zinc-100 focus:border-zinc-400 outline-none resize-none font-medium bg-zinc-50/50"
                                    rows={2}
                                    placeholder="Cuéntanos brevemente el motivo..."
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                />
                            </div>

                            <div className="pt-4 flex gap-4">
                                <button onClick={handleBack} className="flex-1 py-4 bg-zinc-50 text-zinc-500 rounded-2xl font-bold hover:bg-zinc-100 transition-all">
                                    Atrás
                                </button>
                                <button 
                                    onClick={handleSubmit}
                                    disabled={loading || !formData.customer_name || !formData.vehicle_id}
                                    className="flex-[2] py-4 text-white rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl transition-all disabled:opacity-50 active:scale-95"
                                    style={{ backgroundColor: primaryColor }}
                                >
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                                    CONFIRMAR CITA
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

const Save = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/><path d="M7 3v4a1 1 0 0 0 1 1h7"/></svg>
);
