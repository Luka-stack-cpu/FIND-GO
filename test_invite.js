const { Invite, User } = require('./src/models');
const db = require('./src/models');

async function run() {
  await db.sequelize.sync();
  try {
     const invite = await Invite.create({ fromUserId: 1, toUserId: 5, eventId: null, placeName: 'Test Place 2', placeId: 1 });
     console.log('Created invite:', invite.id);
  } catch(e) { console.error('Error:', e.message); }
}
run();
