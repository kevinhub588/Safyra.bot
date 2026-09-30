const {
  Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
} = require('discord.js');
const config = require('../config');
const scriptsData = require('../scripts.json');

function getCategoria(id) {
  return scriptsData.categorias.find(c => c.id === id);
}

function menuPrincipalEmbed() {
  const total = scriptsData.categorias.reduce((a, c) => a + c.scripts.length, 0);
  return new EmbedBuilder()
    .setColor(config.colors.primary)
    .setTitle(`📜 Scripts - ${config.brand.name}`)
    .setDescription(
      'Olá! Escolha uma **categoria** abaixo.\n\n' +
      '📩 O script será enviado no seu **PV (DM)**.\n\n' +
      `📦 **Total disponível:** ${total} script(s)`
    )
    .setFooter({ text: config.brand.footer })
    .setTimestamp();
}

function menuPrincipalComponents() {
  const categorias = scriptsData.categorias;
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
  return rows;
}

function paginaCategoriaComponents(catId, paginaAtual, totalPaginas) {
  const navRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`prev_${catId}_${paginaAtual}`)
      .setEmoji('⬅️')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(paginaAtual === 0),
    new ButtonBuilder()
      .setCustomId(`page_${catId}`)
      .setLabel(`Página ${paginaAtual + 1}/${totalPaginas}`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId(`next_${catId}_${paginaAtual}`)
      .setEmoji('➡️')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(paginaAtual >= totalPaginas - 1),
    new ButtonBuilder()
      .setCustomId('voltar_menu')
      .setLabel('Voltar')
      .setEmoji('🔙')
      .setStyle(ButtonStyle.Danger),
  );
  return [navRow];
}

function paginaCategoriaEmbed(cat, paginaAtual, totalPaginas, perPage) {
  const inicio = paginaAtual * perPage;
  const lista = cat.scripts.slice(inicio, inicio + perPage);
  const descricao = lista.length
    ? lista.map((s, i) => `**${inicio + i + 1}.** ${s.emoji} **${s.nome}**\n> ${s.descricao}`).join('\n\n')
    : '😴 Nenhum script nessa categoria ainda.';
  return new EmbedBuilder()
    .setColor(config.colors.primary)
    .setTitle(`${cat.nome} - ${config.brand.name}`)
    .setDescription(descricao)
    .setFooter({ text: `${config.brand.footer} • Página ${paginaAtual + 1}/${totalPaginas}` });
}

async function enviarScriptPV(interaction, script) {
  const embed = new EmbedBuilder()
    .setColor(config.colors.primary)
    .setTitle(`${script.emoji} ${script.nome}`)
    .setDescription(script.descricao || 'Sem descrição')
    .addFields({ name: '📜 Script:', value: script.conteudo?.slice(0, 1024) || 'Sem conteúdo' })
    .setFooter({ text: config.brand.footer });
  try {
    await interaction.user.send({ embeds: [embed] });
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: `✅ Script **${script.nome}** enviado no PV! 📩`, ephemeral: true });
    }
  } catch {
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: '❌ Abre suas DMs! Configurações → Privacidade → permitir mensagens diretas.', ephemeral: true });
    }
  }
}

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction, client) {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction, client);
      } catch (err) {
        console.error(err);
        const embed = new EmbedBuilder().setColor(config.colors.error).setDescription('❌ Erro no comando.');
        if (interaction.replied || interaction.deferred) await interaction.followUp({ embeds: [embed], ephemeral: true });
        else await interaction.reply({ embeds: [embed], ephemeral: true });
      }
      return;
    }

    if (interaction.isButton()) {
      const id = interaction.customId;

      if (id.startsWith('cat_')) {
        const [, catId, paginaStr] = id.split('_');
        const pagina = parseInt(paginaStr) || 0;
        const cat = getCategoria(catId);
        if (!cat) return interaction.reply({ content: '❌ Categoria não encontrada.', ephemeral: true });
        if (cat.scripts.length === 1) return enviarScriptPV(interaction, cat.scripts[0]);
        const perPage = config.scriptsPerPage;
        const totalPaginas = Math.max(1, Math.ceil(cat.scripts.length / perPage));
        return interaction.update({
          embeds: [paginaCategoriaEmbed(cat, pagina, totalPaginas, perPage)],
          components: paginaCategoriaComponents(catId, pagina, totalPaginas),
        });
      }

      if (id.startsWith('prev_')) {
        const [, catId, p] = id.split('_');
        const nova = Math.max(0, parseInt(p) - 1);
        const cat = getCategoria(catId);
        const perPage = config.scriptsPerPage;
        const total = Math.max(1, Math.ceil(cat.scripts.length / perPage));
        return interaction.update({
          embeds: [paginaCategoriaEmbed(cat, nova, total, perPage)],
          components: paginaCategoriaComponents(catId, nova, total),
        });
      }

      if (id.startsWith('next_')) {
        const [, catId, p] = id.split('_');
        const cat = getCategoria(catId);
        const perPage = config.scriptsPerPage;
        const total = Math.max(1, Math.ceil(cat.scripts.length / perPage));
        const nova = Math.min(total - 1, parseInt(p) + 1);
        return interaction.update({
          embeds: [paginaCategoriaEmbed(cat, nova, total, perPage)],
          components: paginaCategoriaComponents(catId, nova, total),
        });
      }

      if (id === 'voltar_menu') {
        return interaction.update({
          embeds: [menuPrincipalEmbed()],
          components: menuPrincipalComponents(),
        });
      }
    }
  },
};