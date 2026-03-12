import React, { useState } from 'react';
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

type ViewState = 'login' | 'customer' | 'dashboard';

export default function App() {
  const [view, setView] = useState<ViewState>('login');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddMechanicModalOpen, setIsAddMechanicModalOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [searchedPatente, setSearchedPatente] = useState<string | null>(null);

  const { isSuperAdmin } = useAuth();

  const {
    // Garage operations
    tickets, mechanics, parts, customers, settings, loading, reminders, notifications,
    addTicket, updateTicketStatus, updateTicket, searchTicket,
    addPart, updatePart,
    addCustomer, updateCustomer,
    updateSettings,
    addMechanic, deleteMechanic,
    acceptQuotation, markNotificationAsRead,
    clearFinishedTickets
  } = useGarageStore();

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
    return <Login onLogin={handleLogin} onCustomerSearch={handleCustomerSearch} />;
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
          onUpdateStatus={updateTicketStatus}
          onEditTicket={handleEditTicket}
          onAddTicket={() => setIsAddModalOpen(true)}
          onClearFinished={clearFinishedTickets}
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
