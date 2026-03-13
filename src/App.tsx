import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { KanbanBoard } from './components/KanbanBoard';
import { KPIs } from './components/KPIs';
import { AddTicketModal } from './components/AddTicketModal';
import { Login } from './components/Login';
import { CustomerPortal } from './components/CustomerPortal';
import { Inventory } from './components/Inventory';
import { Customers } from './components/Customers';
import { useGarageStore } from './hooks/useGarageStore';
import { useAuth } from './hooks/useAuth';
import { UsersAdmin } from './components/UsersAdmin';
import { Ticket } from './types';

import { Mechanics } from './components/Mechanics';
import { AddMechanicModal } from './components/AddMechanicModal';
import { EditTicketModal } from './components/EditTicketModal';
import { SettingsForm } from './components/SettingsForm';
import { Agenda } from './components/Agenda';
import { PublicBookingModal } from './components/PublicBookingModal';

type ViewState = 'login' | 'customer' | 'dashboard';

export default function App() {
  const [view, setView] = useState<ViewState>('login');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddMechanicModalOpen, setIsAddMechanicModalOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [publicBranding, setPublicBranding] = useState<any>(null);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [searchedPatente, setSearchedPatente] = useState<string | null>(null);

  const { isSuperAdmin, profile } = useAuth();

  const {
    // Garage operations
    tickets, mechanics, parts, customers, settings, loading, reminders, notifications,
    addTicket, updateTicketStatus, updateTicket, searchTicket,
    addPart, updatePart,
    addCustomer, updateCustomer, deleteCustomer,
    updateSettings,
    addMechanic, deleteMechanic,
    acceptQuotation, markNotificationAsRead,
    clearFinishedTickets, deleteTicket,
    fetchCompanies, addPublicReminder, fetchPublicSettingsBySlug, fetchOccupiedReminders, fetchPublicVehicleInfo
  } = useGarageStore(profile?.company_id);

  useEffect(() => {
    // Detect public branding from URL slug (?t=slug)
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('t');
    if (slug) {
      fetchPublicSettingsBySlug(slug).then(data => {
        setPublicBranding(data);
      }).catch(err => console.error('Error fetching public branding:', err));
    }
  }, [fetchPublicSettingsBySlug]);

  const currentCustomerTicket = searchedPatente ? searchTicket(searchedPatente) : null;

  const handleEditTicket = (ticket: Ticket) => {
    setEditingTicket(ticket);
    setIsEditModalOpen(true);
  };

  const handleLogin = () => {
    setView('dashboard');
  };

  const handleCustomerSearch = (patente: string) => {
    const ticket = searchTicket(patente);
    if (ticket) {
      setSearchedPatente(patente);
      setView('customer');
    } else {
      alert('No se encontró un vehículo con esa patente.');
    }
  };

  const handleBackToLogin = () => {
    setView('login');
    setSearchedPatente(null);
    setActiveTab('dashboard');
  };

  if (view === 'login') {
    return (
      <>
        <Login 
          onLogin={handleLogin} 
          onCustomerSearch={handleCustomerSearch} 
          onOpenBooking={() => setIsBookingModalOpen(true)}
          branding={publicBranding}
        />
        <PublicBookingModal
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          fetchCompanies={fetchCompanies}
          onAddReminder={addPublicReminder}
          fetchOccupied={fetchOccupiedReminders}
          fetchVehicleInfo={fetchPublicVehicleInfo}
          branding={publicBranding}
        />
      </>
    );
  }

  if (view === 'customer') {
    return (
      <CustomerPortal
        ticket={currentCustomerTicket}
        settings={settings}
        onBack={handleBackToLogin}
        onAcceptQuotation={acceptQuotation}
      />
    );
  }

  return (
    <Layout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onLogout={handleBackToLogin}
      notifications={notifications}
      markAsRead={markNotificationAsRead}
      settings={settings}
      isSuperAdmin={isSuperAdmin}
    >
      {activeTab === 'dashboard' && (
        <KanbanBoard
          tickets={tickets}
          mechanics={mechanics}
          reminders={reminders}
          settings={settings}
          onUpdateStatus={updateTicketStatus}
          onEditTicket={handleEditTicket}
          onAddTicket={() => setIsAddModalOpen(true)}
          onClearFinished={clearFinishedTickets}
          onUpdateNotes={async (id, notes) => {
            await updateTicket(id, { vehicle_notes: notes });
          }}
        />
      )}

      {activeTab === 'kpis' && (
        <KPIs tickets={tickets} />
      )}

      {activeTab === 'inventory' && (
        <Inventory parts={parts} settings={settings} onAddPart={addPart} onUpdatePart={updatePart} />
      )}

      {activeTab === 'agenda' && (
        <Agenda tickets={tickets} mechanics={mechanics} customers={customers} />
      )}

      {activeTab === 'customers' && (
        <Customers
          customers={customers}
          tickets={tickets}
          settings={settings}
          onAddCustomer={addCustomer}
          onUpdateCustomer={updateCustomer}
          deleteCustomer={deleteCustomer}
          onUpdateNotes={async (id, notes) => {
            await updateTicket(id, { vehicle_notes: notes });
          }}
        />
      )}

      {activeTab === 'mechanics' && (
        <Mechanics
          mechanics={mechanics}
          tickets={tickets}
          onAdd={() => setIsAddMechanicModalOpen(true)}
          onDelete={deleteMechanic}
        />
      )}

      {activeTab === 'settings' && (
        <div className="p-8">
          <SettingsForm settings={settings} onUpdate={updateSettings} />
        </div>
      )}

      {activeTab === 'users' && isSuperAdmin && (
        <div className="p-8">
          <UsersAdmin />
        </div>
      )}

      <AddTicketModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={addTicket}
        mechanics={mechanics}
        customers={customers}
        tickets={tickets}
        settings={settings}
      />

      <AddMechanicModal
        isOpen={isAddMechanicModalOpen}
        onClose={() => setIsAddMechanicModalOpen(false)}
        onAdd={addMechanic}
      />
      <EditTicketModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        ticket={editingTicket}
        mechanics={mechanics}
        parts={parts}
        onUpdate={updateTicket}
      />
    </Layout>
  );
}
