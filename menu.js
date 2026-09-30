const {
  SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
} = require('discord.js');
const config = require('../../config');
const scriptsData = require('../../scripts.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('scripts')
    .setDescription('📜 Abre o menu de scripts da Safyra Community'),

  async execute(interaction) {
    const categorias = scriptsData.categorias;
    const total = categorias.reduce((a, c) => a + c.scripts.length, 0);

    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle(`📜 Scripts - ${config.brand.name}`)
      .setDescription(
        'Olá! Escolha uma **categoria** abaixo.\n\n' +
        '📩 O script será enviado no seu **PV (DM)**.\n\n' +
        `📦 **Total disponível:** ${total} script(s)`
      )
      .setFooter({ text: config.brand.footer })
      .setTimestamp();

    const rows = [];
    let currentRow = new ActionRowBuilder();
    categorias.slice(0, 25).forEach((cat, i) => {
      const btn = new ButtonBuilder()
        .setCustomId(`cat_${cat.id}_0`)
        .setLabel(`${cat.nome} (${cat.scripts.length})`)
        .setStyle(ButtonStyle.Primary)
        .setDisabled(cat.scripts.length === 0);
      currentRow.addComponents(btn);
      if ((i + 1) % 5 === 0 || i === categorias.length - 1) {
        rows.push(currentRow);
        currentRow = new ActionRowBuilder();
      }
    });

    await interaction.reply({ embeds: [embed], components: rows });
  },
};