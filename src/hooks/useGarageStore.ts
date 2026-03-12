import { useState, useEffect, useCallback } from 'react';
import { Ticket, TicketStatus, Mechanic, Part, Customer, GarageSettings, Reminder, GarageNotification } from '../types';
import { supabase, supabaseGarage } from '../lib/supabase';

export function useGarageStore() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [notifications, setNotifications] = useState<GarageNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<GarageSettings | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const [
        { data: ticketsData },
        { data: mechanicsData },
        { data: partsData },
        { data: customersData },
        { data: settingsData },
        { data: remindersData },
        { data: notificationsData }
      ] = await Promise.all([
        supabaseGarage.from('tickets').select('*').order('entry_date', { ascending: false }),
        supabaseGarage.from('mechanics').select('*').order('name', { ascending: true }),
        supabaseGarage.from('parts').select('*').order('name', { ascending: true }),
        supabaseGarage.from('customers').select('*').order('name', { ascending: true }),
        supabaseGarage.from('settings').select('*').maybeSingle(),
        supabaseGarage.from('reminders').select('*').order('planned_date', { ascending: true }),
        supabaseGarage.from('notifications').select('*').order('created_at', { ascending: false }).limit(20)
      ]);

      // Map mechanic names to tickets if mechanic_id is present and mechanicsData is available
      const enrichedTickets = (ticketsData || []).map((t: any) => {
        const mechanic = (mechanicsData || []).find(m => m.id === t.mechanic);
        return {
          ...t,
          mechanic_id: t.mechanic,
          mechanic: mechanic ? mechanic.name : 'Sin asignar'
        };
      });

      setTickets(enrichedTickets as Ticket[]);
      if (mechanicsData) setMechanics(mechanicsData as Mechanic[]);
      if (partsData) setParts(partsData as Part[]);
      if (customersData) setCustomers(customersData as Customer[]);
      if (settingsData) setSettings(settingsData as GarageSettings);
      if (remindersData) setReminders(remindersData as Reminder[]);
      if (notificationsData) setNotifications(notificationsData as GarageNotification[]);
    } catch (error) {
      console.error('Error fetching garage data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // Suscribirse a cambios en tiempo real
    const channels = [
      supabase.channel('garage_tickets_changes').on('postgres_changes', { event: '*', schema: 'garage', table: 'tickets' }, () => fetchData()).subscribe(),
      supabase.channel('garage_mechanics_changes').on('postgres_changes', { event: '*', schema: 'garage', table: 'mechanics' }, () => fetchData()).subscribe(),
      supabase.channel('garage_parts_changes').on('postgres_changes', { event: '*', schema: 'garage', table: 'parts' }, () => fetchData()).subscribe(),
      supabase.channel('garage_customers_changes').on('postgres_changes', { event: '*', schema: 'garage', table: 'customers' }, () => fetchData()).subscribe(),
      supabase.channel('garage_settings_changes').on('postgres_changes', { event: '*', schema: 'garage', table: 'settings' }, () => fetchData()).subscribe(),
      supabase.channel('garage_reminders_changes').on('postgres_changes', { event: '*', schema: 'garage', table: 'reminders' }, () => fetchData()).subscribe(),
      supabase.channel('garage_notifications_changes').on('postgres_changes', { event: '*', schema: 'garage', table: 'notifications' }, () => fetchData()).subscribe(),
    ];

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [fetchData]);

  const addTicket = async (ticket: Partial<Ticket>) => {
    try {
      // 1. Registrar/Actualizar Cliente automáticamente
      if (ticket.owner_name && ticket.owner_phone) {
        const { data: existingCustomer } = await supabaseGarage.from('customers')
          .select('id, vehicles')
          .or(`phone.eq.${ticket.owner_phone},name.eq.${ticket.owner_name}`)
          .maybeSingle();

        if (existingCustomer) {
          // Actualizar lista de vehículos si es necesario
          const vehicles = existingCustomer.vehicles || [];
          if (ticket.id && !vehicles.includes(ticket.id)) {
            await supabaseGarage.from('customers')
              .update({
                vehicles: [...vehicles, ticket.id],
                last_visit: new Date().toISOString()
              })
              .eq('id', existingCustomer.id);
          }
        } else {
          // Crear nuevo cliente
          await supabaseGarage.from('customers').insert([{
            name: ticket.owner_name,
            phone: ticket.owner_phone,
            vehicles: ticket.id ? [ticket.id] : [],
            last_visit: new Date().toISOString()
          }]);
        }
      }

      // 2. Registrar el Ticket
      const { error } = await supabaseGarage.from('tickets').insert([{
        id: ticket.id,
        model: ticket.model,
        status: ticket.status || 'Ingresado',
        mechanic: ticket.mechanic_id === 'Sin asignar' ? null : ticket.mechanic_id,
        owner_name: ticket.owner_name,
        owner_phone: ticket.owner_phone,
        notes: ticket.notes,
        parts_needed: ticket.parts_needed || [],
        entry_date: new Date().toISOString(),
        last_status_change: new Date().toISOString(),
        vin: ticket.vin,
        engine_id: ticket.engine_id,
        mileage: ticket.mileage
      }]);

      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error adding ticket:', error);
      throw error;
    }
  };

  const updateTicketStatus = async (ticketId: string, status: TicketStatus) => {
    try {
      const now = new Date().toISOString();
      const { error } = await supabaseGarage.from('tickets')
        .update({
          status,
          last_status_change: now,
          close_date: status === 'Finalizado' ? now : null
        })
        .eq('id', ticketId);

      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error updating ticket status:', error);
    }
  };

  const addMechanic = async (name: string) => {
    try {
      const { error } = await supabaseGarage.from('mechanics').insert([{ name }]);
      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error adding mechanic:', error);
      throw error;
    }
  };

  const deleteMechanic = async (id: string) => {
    try {
      const { error } = await supabaseGarage.from('mechanics').delete().eq('id', id);
      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error deleting mechanic:', error);
    }
  };

  const addPart = async (part: Partial<Part>) => {
    try {
      const { error } = await supabaseGarage.from('parts').insert([{
        id: part.id,
        name: part.name,
        stock: part.stock,
        min_stock: part.min_stock,
        price: part.price
      }]);
      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error adding part:', error);
      throw error;
    }
  };

  const addCustomer = async (customer: Partial<Customer>) => {
    try {
      const { error } = await supabaseGarage.from('customers').insert([{
        name: customer.name,
        phone: customer.phone,
        email: customer.email || null,
        vehicles: customer.vehicles || [],
        last_visit: new Date().toISOString()
      }]);
      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error adding customer:', error);
      throw error;
    }
  };

  const updateCustomer = async (customerId: string, updates: Partial<Customer>) => {
    try {
      const { error } = await supabaseGarage.from('customers')
        .update({
          name: updates.name,
          phone: updates.phone,
          email: updates.email,
          last_visit: new Date().toISOString()
        })
        .eq('id', customerId);
      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  };

  const updateSettings = async (updates: Partial<GarageSettings>) => {
    try {
      if (settings?.id) {
        const { error } = await supabaseGarage.from('settings')
          .update(updates)
          .eq('id', settings.id);
        if (error) throw error;
      } else {
        // Fallback for companies created before the trigger
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('No session');
        
        // Obtenemos el profile para saber el company_id
        const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', session.user.id).single();
        if (!profile?.company_id) throw new Error('Usuario sin empresa asginada');

        const { error } = await supabaseGarage.from('settings').insert([{
           ...updates,
           company_id: profile.company_id
        }]);
        if (error) throw error;
      }
      await fetchData();
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  };

  const updatePart = async (partId: string, updates: Partial<Part>) => {
    try {
      const { error } = await supabaseGarage.from('parts')
        .update(updates)
        .eq('id', partId);
      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error updating part:', error);
      throw error;
    }
  };

  const updateTicket = async (ticketId: string, updates: Partial<Ticket>) => {
    try {
      // 1. Obtener el estado actual del ticket para comparar repuestos
      const { data: currentTicket, error: fetchError } = await supabaseGarage.from('tickets')
        .select('parts_needed')
        .eq('id', ticketId)
        .single();

      if (fetchError) throw fetchError;

      const dbUpdates: any = {
        last_status_change: new Date().toISOString()
      };

      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.model !== undefined) dbUpdates.model = updates.model;
      if (updates.owner_name !== undefined) dbUpdates.owner_name = updates.owner_name;
      if (updates.owner_phone !== undefined) dbUpdates.owner_phone = updates.owner_phone;
      if (updates.parts_needed !== undefined) dbUpdates.parts_needed = updates.parts_needed;
      if (updates.close_date !== undefined) dbUpdates.close_date = updates.close_date;
      if (updates.quotation_total !== undefined) dbUpdates.quotation_total = updates.quotation_total;
      if (updates.quotation_accepted !== undefined) dbUpdates.quotation_accepted = updates.quotation_accepted;
      if (updates.vin !== undefined) dbUpdates.vin = updates.vin;
      if (updates.engine_id !== undefined) dbUpdates.engine_id = updates.engine_id;
      if (updates.mileage !== undefined) dbUpdates.mileage = updates.mileage;

      if (updates.mechanic_id !== undefined) {
        dbUpdates.mechanic = updates.mechanic_id === 'Sin asignar' ? null : updates.mechanic_id;
      }

      // 2. Lógica de deducción de stock
      if (updates.parts_needed) {
        const oldParts = currentTicket.parts_needed || [];
        const newParts = updates.parts_needed;

        // Encontrar repuestos recién añadidos
        const addedParts = newParts.filter(p => !oldParts.includes(p));

        for (const partName of addedParts) {
          // Buscar el repuesto por nombre en el inventario actual (cargado en el store)
          const partToUpdate = parts.find(p => p.name === partName);
          if (partToUpdate && partToUpdate.stock > 0) {
            await supabaseGarage.from('parts')
              .update({ stock: partToUpdate.stock - 1 })
              .eq('id', partToUpdate.id);
          }
        }
      }

      const { error } = await supabaseGarage.from('tickets')
        .update(dbUpdates)
        .eq('id', ticketId);

      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error updating ticket:', error);
      throw error;
    }
  };

  const searchTicket = (patente: string) => {
    const normalizedInput = patente.replace(/[\s\.\-·]/g, '').toUpperCase();
    return tickets.find(t => {
      const normalizedTicketId = t.id.replace(/[\s\.\-·]/g, '').toUpperCase();
      return normalizedTicketId === normalizedInput;
    }) || null;
  };

  const addReminder = async (reminder: Partial<Reminder>) => {
    try {
      const { error } = await supabaseGarage.from('reminders').insert([reminder]);
      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error adding reminder:', error);
      throw error;
    }
  };

  const updateReminder = async (id: string, updates: Partial<Reminder>) => {
    try {
      const { error } = await supabaseGarage.from('reminders').update(updates).eq('id', id);
      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error updating reminder:', error);
      throw error;
    }
  };

  const deleteReminder = async (id: string) => {
    try {
      const { error } = await supabaseGarage.from('reminders').delete().eq('id', id);
      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error deleting reminder:', error);
      throw error;
    }
  };

  const markNotificationAsRead = async (id: string) => {
    try {
      const { error } = await supabaseGarage.from('notifications').update({ read: true }).eq('id', id);
      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  return {
    tickets,
    mechanics,
    parts,
    customers,
    settings,
    reminders,
    notifications,
    loading,
    addTicket,
    updateTicketStatus,
    addMechanic,
    deleteMechanic,
    addPart,
    updatePart,
    addCustomer,
    updateCustomer,
    updateSettings,
    updateTicket,
    addReminder,
    updateReminder,
    deleteReminder,
    markNotificationAsRead,
    acceptQuotation: async (id: string, ticketModel: string) => {
      await updateTicket(id, {
        quotation_accepted: true,
        status: 'En Reparación',
        last_status_change: new Date().toISOString()
      });
      // Insert notification
      await supabaseGarage.from('notifications').insert([{
        ticket_id: id,
        message: `¡Cotización Aceptada! El vehículo ${ticketModel} (${id}) ha pasado a reparación.`
      }]);
    },
    searchTicket,
    refreshData: fetchData,
    clearFinishedTickets: async () => {
      try {
        const { error } = await supabaseGarage.from('tickets')
          .delete()
          .eq('status', 'Finalizado');
        if (error) throw error;
        await fetchData();
      } catch (error) {
        console.error('Error clearing finished tickets:', error);
        throw error;
      }
    }
  };
}
