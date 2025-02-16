require('dotenv').config();

const { Client, EmbedBuilder , GatewayIntentBits } = require('discord.js');

const PREFIX = "$";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

async function getRandomCardWithFlavor() {
    const response = await fetch("https://api.scryfall.com/cards/random?q=ft:/.+/");
    const card = await response.json();

    if (!card.flavor_text) {
        return getRandomCardWithFlavor(); // Recursive retry
    }

    return card;
}


async function handleCommand(message, command, args){
    switch (command){
        case 'help':
            break;
        case 'flavor':
            const card = await getRandomCardWithFlavor();

            const embed = new EmbedBuilder()
                .setColor(0x0099FF) // Set a color (Magic Blue)
                .setTitle(card.name) // Card name
                .setURL(card.scryfall_uri) // Hyperlink to Scryfall
                .setDescription(`***${card.flavor_text}***`)
                .setThumbnail(card.image_uris.normal)
                .setFooter({ text: "Sourced from Scryfall", iconURL: "https://scryfall.com/favicon.ico" });

            message.reply({ embeds: [embed] });
            break;
        default:
            return;
    }
}

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}.`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (message.content.startsWith(PREFIX)) {
        const [CMD_NAME, ...args] = message.content
            .trim()
            .substring(PREFIX.length)
            .split(/\s+/);

        await handleCommand(message, CMD_NAME, args);
    }
});

client.login(process.env.DISCORDJS_BOT_TOKEN);
