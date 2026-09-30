const { Events, ActivityType } = require('discord.js');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    console.log(`✅ Safyra Bot online como ${client.user.tag}`);
    client.user.setPresence({
      activities: [{ name: '📜 /scripts | Safyra', type: ActivityType.Watching }],
      status: 'online',
    });
  },
};