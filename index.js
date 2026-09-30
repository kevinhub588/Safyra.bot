require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();

const loadCommands = (dir) => {
  for (const file of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) loadCommands(fullPath);
    else if (file.endsWith('.js')) {
      const cmd = require(fullPath);
      if (cmd.data && cmd.execute) {
        client.commands.set(cmd.data.name, cmd);
        console.log(`✅ Comando: ${cmd.data.name}`);
      }
    }
  }
};
loadCommands(path.join(__dirname, 'commands'));

const eventsPath = path.join(__dirname, 'events');
for (const file of fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'))) {
  const ev = require(path.join(eventsPath, file));
  if (ev.once) client.once(ev.name, (...a) => ev.execute(...a, client));
  else client.on(ev.name, (...a) => ev.execute(...a, client));
}

client.login(process.env.TOKEN);