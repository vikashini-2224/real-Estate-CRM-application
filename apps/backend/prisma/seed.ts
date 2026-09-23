import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Clean existing records in reverse order
  await prisma.booking.deleteMany();
  await prisma.note.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.building.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 10);

  // 2. Create Users
  const admin = await prisma.user.create({
    data: {
      email: 'admin@realestatecrm.com',
      passwordHash,
      name: 'Victoria Vance (Admin)',
      role: 'ADMIN',
    },
  });

  const agentJohn = await prisma.user.create({
    data: {
      email: 'john@realestatecrm.com',
      passwordHash,
      name: 'John Miller (Sales)',
      role: 'SALES_EMPLOYEE',
    },
  });

  const agentSarah = await prisma.user.create({
    data: {
      email: 'sarah@realestatecrm.com',
      passwordHash,
      name: 'Sarah Connor (Sales)',
      role: 'SALES_EMPLOYEE',
    },
  });

  console.log('✅ Created users:', { admin: admin.email, agentJohn: agentJohn.email, agentSarah: agentSarah.email });

  // 3. Create Projects
  const skyviewHeights = await prisma.project.create({
    data: {
      name: 'Skyview Heights Residences',
      location: 'Downtown Financial District, New York',
      description: 'Ultra-luxury high-rise residential towers featuring panoramic skyline views and 5-star amenities.',
    },
  });

  const oasisVillas = await prisma.project.create({
    data: {
      name: 'The Oasis Luxury Villas',
      location: 'Palm Valley Greens, California',
      description: 'Exclusive private gated community with sprawling contemporary villas, infinity pools, and golf course access.',
    },
  });

  const horizonBay = await prisma.project.create({
    data: {
      name: 'Horizon Bayfront Marina',
      location: 'Waterfront Promenade, Miami',
      description: 'Modern coastal waterfront apartments with private yacht slips, spa, and rooftop sunset decks.',
    },
  });

  // 4. Create Buildings
  const towerA = await prisma.building.create({
    data: {
      name: 'Tower Alpha (East Wing)',
      projectId: skyviewHeights.id,
    },
  });

  const towerB = await prisma.building.create({
    data: {
      name: 'Tower Beta (West Wing)',
      projectId: skyviewHeights.id,
    },
  });

  const villaClusterOne = await prisma.building.create({
    data: {
      name: 'Boulevard Enclave 1',
      projectId: oasisVillas.id,
    },
  });

  const marinaBlockA = await prisma.building.create({
    data: {
      name: 'Seaside Pavilion A',
      projectId: horizonBay.id,
    },
  });

  // 5. Create Units
  const unitsData = [
    // Tower A (Skyview)
    { unitNumber: '101', type: 'ONE_BHK', price: 6500000, status: 'AVAILABLE', buildingId: towerA.id },
    { unitNumber: '102', type: 'TWO_BHK', price: 9200000, status: 'AVAILABLE', buildingId: towerA.id },
    { unitNumber: '201', type: 'TWO_BHK', price: 9500000, status: 'AVAILABLE', buildingId: towerA.id },
    { unitNumber: '301', type: 'THREE_BHK', price: 14500000, status: 'AVAILABLE', buildingId: towerA.id },
    { unitNumber: 'PH-01', type: 'PENTHOUSE', price: 32000000, status: 'AVAILABLE', buildingId: towerA.id },

    // Tower B (Skyview)
    { unitNumber: 'B-101', type: 'STUDIO', price: 4500000, status: 'AVAILABLE', buildingId: towerB.id },
    { unitNumber: 'B-102', type: 'TWO_BHK', price: 8900000, status: 'AVAILABLE', buildingId: towerB.id },
    { unitNumber: 'B-201', type: 'THREE_BHK', price: 13800000, status: 'AVAILABLE', buildingId: towerB.id },
    { unitNumber: 'B-PH', type: 'PENTHOUSE', price: 31000000, status: 'AVAILABLE', buildingId: towerB.id },

    // Oasis Villas
    { unitNumber: 'V-01', type: 'VILLA', price: 28500000, status: 'AVAILABLE', buildingId: villaClusterOne.id },
    { unitNumber: 'V-02', type: 'VILLA', price: 32000000, status: 'AVAILABLE', buildingId: villaClusterOne.id },
    { unitNumber: 'V-03', type: 'VILLA', price: 36000000, status: 'AVAILABLE', buildingId: villaClusterOne.id },

    // Horizon Bay
    { unitNumber: 'MB-101', type: 'ONE_BHK', price: 7200000, status: 'AVAILABLE', buildingId: marinaBlockA.id },
    { unitNumber: 'MB-202', type: 'TWO_BHK', price: 11000000, status: 'AVAILABLE', buildingId: marinaBlockA.id },
    { unitNumber: 'MB-303', type: 'THREE_BHK', price: 17500000, status: 'AVAILABLE', buildingId: marinaBlockA.id },
  ];

  const createdUnits = [];
  for (const u of unitsData) {
    const unit = await prisma.unit.create({ data: u });
    createdUnits.push(unit);
  }

  console.log(`✅ Created ${createdUnits.length} property units across 3 projects.`);

  // 6. Create Leads in various stages
  const lead1 = await prisma.lead.create({
    data: {
      name: 'Robert Langdon',
      email: 'robert.langdon@harvard.edu',
      phone: '+1 (555) 234-5678',
      stage: 'NEW',
      budget: 10000000,
      requirement: 'Looking for a 2BHK with modern architecture near downtown.',
      followUpDate: new Date(Date.now() + 24 * 3600 * 1000), // Tomorrow
      assignedToId: agentJohn.id,
    },
  });

  const lead2 = await prisma.lead.create({
    data: {
      name: 'Elena Rostova',
      email: 'elena.rostova@globalcapital.com',
      phone: '+1 (555) 987-6543',
      stage: 'SITE_VISIT',
      budget: 35000000,
      requirement: 'Interested in Skyview Penthouse or California Villa for family retreat.',
      followUpDate: new Date(Date.now() + 2 * 24 * 3600 * 1000),
      assignedToId: agentSarah.id,
    },
  });

  const lead3 = await prisma.lead.create({
    data: {
      name: 'David Chen',
      email: 'dchen.tech@venture.io',
      phone: '+1 (555) 345-6789',
      stage: 'NEGOTIATION',
      budget: 15000000,
      requirement: 'Negotiating final discount for Tower A 3BHK unit 301.',
      followUpDate: new Date(Date.now() + 3 * 24 * 3600 * 1000),
      assignedToId: agentJohn.id,
    },
  });

  const lead4 = await prisma.lead.create({
    data: {
      name: 'Amara Okafor',
      email: 'amara.okafor@creativestudios.co',
      phone: '+1 (555) 456-7890',
      stage: 'CONTACTED',
      budget: 7500000,
      requirement: 'First-time home buyer looking for 1BHK in Downtown or Miami Bayfront.',
      followUpDate: new Date(Date.now() + 4 * 24 * 3600 * 1000),
      assignedToId: agentSarah.id,
    },
  });

  const lead5 = await prisma.lead.create({
    data: {
      name: 'Alexander Wright',
      email: 'awright@wrightadvisory.com',
      phone: '+1 (555) 567-8901',
      stage: 'BOOKED',
      budget: 29000000,
      requirement: 'Booked Oasis Villa V-01.',
      assignedToId: agentJohn.id,
    },
  });

  const lead6 = await prisma.lead.create({
    data: {
      name: 'Marcus Brody',
      email: 'marcus.brody@museum.org',
      phone: '+1 (555) 678-9012',
      stage: 'LOST',
      budget: 5000000,
      requirement: 'Budget was below current available inventory.',
      assignedToId: agentSarah.id,
    },
  });

  // 7. Add Notes to Leads
  await prisma.note.createMany({
    data: [
      {
        content: 'Initial intake call completed. Robert prefers higher floors with morning sunlight.',
        leadId: lead1.id,
        authorId: agentJohn.id,
      },
      {
        content: 'Scheduled private weekend site tour for Elena at Skyview PH-01 at 2:00 PM.',
        leadId: lead2.id,
        authorId: agentSarah.id,
      },
      {
        content: 'Elena loved the panoramic skyline terrace. Requested brochure for California Oasis Villas too.',
        leadId: lead2.id,
        authorId: agentSarah.id,
      },
      {
        content: 'Client requested a 3% waiver on parking spot fees. Escalated to Admin for pricing approval.',
        leadId: lead3.id,
        authorId: agentJohn.id,
      },
      {
        content: 'Booking contract signed and initial token payment of ₹15,00,000 received successfully.',
        leadId: lead5.id,
        authorId: agentJohn.id,
      },
    ],
  });

  // 8. Create Booking for lead5 with Villa V-01 (createdUnits[9])
  const bookedUnit = createdUnits.find((u) => u.unitNumber === 'V-01')!;
  await prisma.unit.update({
    where: { id: bookedUnit.id },
    data: { status: 'BOOKED' },
  });

  await prisma.booking.create({
    data: {
      leadId: lead5.id,
      unitId: bookedUnit.id,
      bookingAmount: 1500000,
      finalPrice: 28500000,
      status: 'CONFIRMED',
      createdById: agentJohn.id,
    },
  });

  console.log('✅ Initialized confirmed booking and lead records.');
  console.log('🚀 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
