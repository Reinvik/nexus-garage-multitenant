export type TicketStatus =
  | 'Ingresado'
  | 'En Espera'
  | 'En Reparación'
  | 'Listo para Entrega'
  | 'Finalizado';

export interface Ticket {
  id: string; // Patente
  model: string;
  status: TicketStatus;
  mechanic_id: string | null;
  mechanic?: string; // Virtual field from join or local fallback
  entry_date: string; // ISO string
  last_status_change: string; // ISO string
  owner_name: string;
  owner_phone: string;
  notes: string;
  photo_url?: string;
  cost?: number; // Total real final
  quotation_total?: number;
  quotation_accepted?: boolean;
  parts_needed?: string[];
  close_date?: string; // ISO string
  vin?: string;
  engine_id?: string;
  mileage?: number;
}

export interface Mechanic {
  id: string;
  name: string;
}

export interface Part {
  id: string;
  name: string;
  stock: number;
  min_stock: number;
  price: number;
  assigned_to?: string; // Patente (Ticket ID)
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  vehicles: string[]; // Array of Patentes
  last_visit: string; // ISO string
}

export interface Reminder {
  id: string;
  customer_name: string;
  customer_phone: string;
  vehicle_model: string;
  patente: string;
  reminder_type: string;
  planned_date: string; // ISO string
  completed: boolean;
  created_at: string;
}

export interface GarageNotification {
  id: string;
  ticket_id: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface GarageSettings {
  id: string;
  workshop_name: string;
  address: string;
  phone: string;
  whatsapp_template: string;
  logo_url?: string;
}
