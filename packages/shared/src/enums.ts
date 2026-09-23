export enum Role {
  ADMIN = 'ADMIN',
  SALES_EMPLOYEE = 'SALES_EMPLOYEE',
}

export enum LeadStage {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  SITE_VISIT = 'SITE_VISIT',
  INTERESTED = 'INTERESTED',
  NEGOTIATION = 'NEGOTIATION',
  BOOKED = 'BOOKED',
  LOST = 'LOST',
}

export enum UnitType {
  STUDIO = 'STUDIO',
  ONE_BHK = 'ONE_BHK',
  TWO_BHK = 'TWO_BHK',
  THREE_BHK = 'THREE_BHK',
  FOUR_BHK = 'FOUR_BHK',
  PENTHOUSE = 'PENTHOUSE',
  VILLA = 'VILLA',
}

export enum UnitStatus {
  AVAILABLE = 'AVAILABLE',
  RESERVED = 'RESERVED',
  BOOKED = 'BOOKED',
}

export enum BookingStatus {
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
}
