/**
 * Automated Concurrency Test Script
 * Verifies that when 5 simultaneous requests attempt to book the exact same unit,
 * strictly 1 request succeeds (HTTP 201) and exactly 4 fail (HTTP 409 Conflict).
 */

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

async function runConcurrencyTest() {
  console.log('🧪 Starting Booking Concurrency Stress Test...');

  // 1. Login as Admin to obtain session cookie
  const loginRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@realestatecrm.com',
      password: 'password123',
    }),
  });

  if (!loginRes.ok) {
    console.error('❌ Failed to login:', await loginRes.text());
    process.exit(1);
  }

  const cookieHeader = loginRes.headers.get('set-cookie');
  if (!cookieHeader) {
    console.error('❌ No session cookie received');
    process.exit(1);
  }
  const cookie = cookieHeader.split(';')[0];
  console.log('✅ Authenticated session cookie established.');

  // 2. Fetch available units
  const unitsRes = await fetch(`${BACKEND_URL}/api/properties/units?status=AVAILABLE`, {
    headers: { Cookie: cookie },
  });
  const { units } = await unitsRes.json();

  if (!units || units.length === 0) {
    console.error('❌ No available units found for test');
    process.exit(1);
  }

  const targetUnit = units[0];
  console.log(`🎯 Target Unit for concurrent test: Unit #${targetUnit.unitNumber} (ID: ${targetUnit.id})`);

  // 3. Create 5 dummy leads to test concurrent bookings
  const leadIds = [];
  for (let i = 1; i <= 5; i++) {
    const leadRes = await fetch(`${BACKEND_URL}/api/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie,
      },
      body: JSON.stringify({
        name: `Concurrent Lead #${i} - ${Date.now()}`,
        phone: `+1-555-010${i}`,
        email: `concurrent_${i}_${Date.now()}@test.com`,
        budget: targetUnit.price,
      }),
    });
    const { lead } = await leadRes.json();
    leadIds.push(lead.id);
  }
  console.log(`👥 Created ${leadIds.length} test leads.`);

  // 4. Dispatch 5 simultaneous booking requests for the EXACT SAME UNIT
  console.log('⚡ Firing 5 simultaneous booking requests at target unit in parallel...');
  const promises = leadIds.map((leadId, idx) =>
    fetch(`${BACKEND_URL}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie,
      },
      body: JSON.stringify({
        leadId,
        unitId: targetUnit.id,
        bookingAmount: 1500000,
        finalPrice: targetUnit.price,
      }),
    }).then(async (res) => {
      const data = await res.json();
      return { index: idx + 1, status: res.status, data };
    })
  );

  const results = await Promise.all(promises);

  console.log('\n--- Concurrent Test Results ---');
  let successCount = 0;
  let conflictCount = 0;

  results.forEach((r) => {
    console.log(`Request #${r.index}: HTTP ${r.status} - ${JSON.stringify(r.data)}`);
    if (r.status === 201) successCount++;
    if (r.status === 409) conflictCount++;
  });

  console.log('-------------------------------');
  console.log(`Total Successes (HTTP 201): ${successCount}`);
  console.log(`Total Conflicts (HTTP 409): ${conflictCount}`);

  if (successCount === 1 && conflictCount === 4) {
    console.log('\n🎉 PASS: Strict Database-Level ACID Concurrency Test SUCCEEDED! Zero double-booking occurred.');
  } else {
    console.error(`\n❌ FAIL: Expected 1 success and 4 conflicts, but got ${successCount} successes and ${conflictCount} conflicts.`);
    process.exit(1);
  }
}

runConcurrencyTest().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
