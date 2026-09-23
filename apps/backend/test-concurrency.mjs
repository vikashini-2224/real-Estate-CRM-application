import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:3001/api';

async function main() {
  console.log('--- Double-Booking Concurrency Test ---');

  // 1. Get Admin user
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  
  // 2. Login to get cookie
  const loginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: admin.email, password: 'password123' })
  });
  
  const cookieHeader = loginRes.headers.get('set-cookie');
  if (!cookieHeader) throw new Error('Failed to get auth cookie');

  // 3. Find 2 leads without bookings
  const leads = await prisma.lead.findMany({
    where: { booking: null },
    take: 2
  });
  if (leads.length < 2) throw new Error('Need at least 2 leads without bookings');

  // 4. Find 1 available unit
  const unit = await prisma.unit.findFirst({
    where: { status: 'AVAILABLE' }
  });
  if (!unit) throw new Error('Need at least 1 available unit');

  console.log(`Target Unit: ${unit.unitNumber} (ID: ${unit.id})`);
  console.log(`Lead A: ${leads[0].name}`);
  console.log(`Lead B: ${leads[1].name}`);

  // 5. Fire two concurrent booking requests for the exact same unit
  const makeBookingRequest = async (lead) => {
    const start = Date.now();
    const res = await fetch(`${API_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader
      },
      body: JSON.stringify({
        leadId: lead.id,
        unitId: unit.id,
        bookingAmount: 100000,
        finalPrice: unit.price
      })
    });
    
    const body = await res.json();
    return {
      leadName: lead.name,
      status: res.status,
      timeMs: Date.now() - start,
      response: body
    };
  };

  console.log('\nFiring concurrent requests...');
  const results = await Promise.all([
    makeBookingRequest(leads[0]),
    makeBookingRequest(leads[1])
  ]);

  console.log('\n--- Results ---');
  let successCount = 0;
  let conflictCount = 0;

  results.forEach(res => {
    console.log(`Request from ${res.leadName} -> HTTP ${res.status} (took ${res.timeMs}ms)`);
    if (res.status === 201) {
      console.log('  SUCCESS! Booking created.');
      successCount++;
    } else if (res.status === 409) {
      console.log('  BLOCKED! Caught by double-booking protection:', res.response.error);
      conflictCount++;
    } else {
      console.log('  UNEXPECTED RESULT:', res);
    }
  });

  console.log('\nSummary:');
  console.log(`Total Successes: ${successCount} (Expected: 1)`);
  console.log(`Total Conflicts: ${conflictCount} (Expected: 1)`);

  if (successCount === 1 && conflictCount === 1) {
    console.log('\n✅ TEST PASSED: Database concurrency protection successfully prevented double-booking.');
  } else {
    console.log('\n❌ TEST FAILED: Concurrency violation detected!');
    process.exit(1);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
