import { Role, LeadStage, UnitType, UnitStatus, BookingStatus } from './enums';

export interface UserDTO {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

export interface NoteDTO {
  id: string;
  content: string;
  leadId: string;
  authorId: string;
  author: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
  createdAt: string;
}

export interface LeadDTO {
  id: string;
  name: string;
  email?: string | null;
  phone: string;
  stage: LeadStage;
  budget?: number | null;
  requirement?: string | null;
  followUpDate?: string | null;
  assignedToId?: string | null;
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  } | null;
  notes?: NoteDTO[];
  booking?: BookingDTO | null;
  interestedProjectId?: string | null;
  interestedProject?: { id: string; name: string; location: string } | null;
  interestedBuildingId?: string | null;
  interestedBuilding?: { id: string; name: string } | null;
  interestedUnitId?: string | null;
  interestedUnit?: { id: string; unitNumber: string; type: UnitType; price: number } | null;
  createdAt: string;
  updatedAt: string;
}

export interface UnitDTO {
  id: string;
  unitNumber: string;
  type: UnitType;
  price: number;
  status: UnitStatus;
  buildingId: string;
  building?: {
    id: string;
    name: string;
    projectId: string;
    project?: {
      id: string;
      name: string;
      location: string;
    };
  };
  booking?: BookingDTO | null;
  createdAt: string;
  updatedAt: string;
}

export interface BuildingDTO {
  id: string;
  name: string;
  projectId: string;
  units?: UnitDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectDTO {
  id: string;
  name: string;
  location: string;
  description?: string | null;
  buildingsCount?: number;
  totalUnits?: number;
  availableUnits?: number;
  bookedUnits?: number;
  buildings?: (BuildingDTO & { _count?: { units: number }; unitsCount?: number })[];
  _count?: {
    buildings: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface BookingDTO {
  id: string;
  leadId: string;
  lead?: {
    id: string;
    name: string;
    email?: string | null;
    phone: string;
  };
  unitId: string;
  unit?: {
    id: string;
    unitNumber: string;
    type: UnitType;
    price: number;
    building: {
      name: string;
      project: {
        name: string;
        location: string;
      };
    };
  };
  bookingAmount: number;
  finalPrice: number;
  status: BookingStatus;
  createdById: string;
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
  bookingDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStatsDTO {
  totalLeads: number;
  leadsByStage: Record<LeadStage, number>;
  followUpsCount: number;
  siteVisitsCount: number;
  totalBookings: number;
  totalRevenue: number;
  availableUnits: number;
  totalUnits: number;
  recentLeads: LeadDTO[];
  upcomingFollowUps: LeadDTO[];
}
