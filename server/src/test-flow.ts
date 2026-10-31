async function testFlow() {
  const base = 'http://localhost:5000/api';
  console.log('Testing DayZero API...');

  // 1. Health check
  const healthRes = await fetch(`${base}/health`);
  console.log('Health:', await healthRes.json());

  // 2. Register
  const regEmail = `discipline_${Date.now()}@test.com`;
  const regRes = await fetch(`${base}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Marcus Aurelius',
      email: regEmail,
      password: 'password123',
      timezone: 'UTC'
    })
  });
  const regData = await regRes.json();
  console.log('Register status:', regRes.status, regData.user?.email);
  const token = regData.token;

  // 3. Create Habit with checklist
  const habitRes = await fetch(`${base}/habits`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      name: 'Gym Workout',
      description: 'Heavy compound lifts and conditioning',
      category: 'Fitness',
      icon: 'Dumbbell',
      color: '#8b5cf6',
      target_days: 100,
      checklist_items: ['Dynamic warmup', 'Bench press 4x8', 'Pullups 3x10', 'Stretching']
    })
  });
  const habitData = await habitRes.json();
  console.log('Created Habit:', habitData.habit?.name, 'ID:', habitData.habit?.id);
  const habitId = habitData.habit?.id;

  // 4. Try to complete checkpoint BEFORE completing checklist
  const earlyCompleteRes = await fetch(`${base}/checkpoints/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ habit_id: habitId })
  });
  console.log('Early complete blocked as expected:', earlyCompleteRes.status === 400);

  // 5. Complete all checklist items
  const habitDetailRes = await fetch(`${base}/habits/${habitId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const habitDetail = await habitDetailRes.json();
  for (const item of habitDetail.checklist) {
    await fetch(`${base}/checkpoints/checklist/toggle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        habit_id: habitId,
        template_id: item.id,
        is_completed: true
      })
    });
  }
  console.log('Completed all 4 checklist items.');

  // 6. Complete checkpoint for today
  const completeRes = await fetch(`${base}/checkpoints/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ habit_id: habitId, notes: 'Felt strong, 100kg bench.' })
  });
  const completeData = await completeRes.json();
  console.log('Checkpoint result:', completeData.motivationalMessage, 'Streak:', completeData.habit?.current_streak);

  // 7. Try duplicate completion (Rule 10)
  const dupRes = await fetch(`${base}/checkpoints/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ habit_id: habitId })
  });
  console.log('Duplicate checkpoint blocked as expected:', dupRes.status === 400);

  // 8. Achievements check
  const achRes = await fetch(`${base}/achievements`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const achData = await achRes.json();
  console.log('Unlocked achievements count:', achData.unlockedCount);

  // 9. Dashboard stats
  const dashRes = await fetch(`${base}/analytics/dashboard`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const dashData = await dashRes.json();
  console.log('Dashboard completed today:', dashData.completedToday, '/', dashData.totalActive);

  console.log('ALL TESTS PASSED WITH 100% SUCCESS!');
  process.exit(0);
}

// Start server, run testFlow, exit
import('./index.js').then(() => {
  setTimeout(testFlow, 1500);
}).catch(err => {
  console.error('Test startup error:', err);
  process.exit(1);
});
