require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commands = [];
const load = (dir) => {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) load(p);
    else if (f.endsWith('.js')) {
      const c = require(p);
      if (c.data) commands.push(c.data.toJSON());
    }
  }
};
load(path.join(__dirname, 'commands'));

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log(`🚀 Registrando ${commands.length} comando(s)...`);
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );
    console.log('✅ Comandos registrados!');
  } catch (err) {
    console.error(err);
  }
})();