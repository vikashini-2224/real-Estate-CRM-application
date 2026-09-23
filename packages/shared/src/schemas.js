import { z } from "zod";
import { Role, LeadStage, UnitType, UnitStatus } from "./enums";

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const CreateUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.nativeEnum(Role).default(Role.SALES_EMPLOYEE),
});

export const UpdateUserSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.nativeEnum(Role).optional(),
  isActive: z.boolean().optional(),
});

export const CreateLeadSchema = z.object({
  name: z.string().min(2, "Lead name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().min(7, "Valid phone number is required"),
  stage: z.nativeEnum(LeadStage).default(LeadStage.NEW),
  budget: z.coerce
    .number()
    .positive("Budget must be positive")
    .optional()
    .nullable(),
  requirement: z.string().optional().nullable(),
  followUpDate: z.string().datetime().optional().nullable(),
  assignedToId: z.string().uuid().optional().nullable().or(z.literal("")),
  interestedProjectId: z
    .string()
    .uuid()
    .optional()
    .nullable()
    .or(z.literal("")),
  interestedBuildingId: z
    .string()
    .uuid()
    .optional()
    .nullable()
    .or(z.literal("")),
  interestedUnitId: z.string().uuid().optional().nullable().or(z.literal("")),
});

export const UpdateLeadSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  phone: z.string().min(7).optional(),
  stage: z.nativeEnum(LeadStage).optional(),
  budget: z.coerce.number().positive().optional().nullable(),
  requirement: z.string().optional().nullable(),
  followUpDate: z.string().datetime().optional().nullable(),
  assignedToId: z.string().uuid().optional().nullable().or(z.literal("")),
  interestedProjectId: z
    .string()
    .uuid()
    .optional()
    .nullable()
    .or(z.literal("")),
  interestedBuildingId: z
    .string()
    .uuid()
    .optional()
    .nullable()
    .or(z.literal("")),
  interestedUnitId: z.string().uuid().optional().nullable().or(z.literal("")),
});

export const CreateNoteSchema = z.object({
  content: z.string().min(1, "Note content cannot be empty"),
});

export const CreateProjectSchema = z.object({
  name: z.string().min(2, "Project name is required"),
  location: z.string().min(2, "Location is required"),
  description: z.string().optional().nullable(),
});

export const CreateBuildingSchema = z.object({
  name: z.string().min(1, "Building name is required"),
  projectId: z.string().uuid("Valid project ID is required"),
});

export const CreateUnitSchema = z.object({
  unitNumber: z.string().min(1, "Unit number is required"),
  type: z.nativeEnum(UnitType),
  price: z.coerce.number().positive("Price must be greater than 0"),
  buildingId: z.string().uuid("Valid building ID is required"),
  status: z.nativeEnum(UnitStatus).default(UnitStatus.AVAILABLE),
});

export const UpdateUnitSchema = z.object({
  type: z.nativeEnum(UnitType).optional(),
  price: z.coerce.number().positive().optional(),
  status: z.nativeEnum(UnitStatus).optional(),
});

export const CreateBookingSchema = z.object({
  leadId: z.string().uuid("Valid lead ID is required"),
  unitId: z.string().uuid("Valid unit ID is required"),
  bookingAmount: z.coerce
    .number()
    .positive("Booking amount must be greater than 0"),
  finalPrice: z.coerce.number().positive("Final price must be greater than 0"),
});
