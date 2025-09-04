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

const subreddits = ["MTGmemes", "magicthecirclejerking"]
var subredditIndex = 0;
async function getRandomRedditMeme() {
    const subreddit = subreddits[subredditIndex];
    subredditIndex = (subredditIndex + 1) % subreddits.length;

    const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=100`
    console.log(`Calling ${url}`);
    const response = await fetch(url);
    const posts = (await response.json()).data.children.filter(post => post.data.post_hint === "image");

    if (posts.length === 0) {
        return getRandomRedditMeme();
    }

    return posts[Math.floor(Math.random() * posts.length)].data;
}

async function getRandomCommander(fromDate, colorCount) {
    const response = await fetch(`https://api.scryfall.com/cards/random?q=is:commander+id=${colorCount}+date%3E${fromDate}+f:pioneer`);
    return await response.json();
}


async function handleCommand(message, command, args){
    switch (command){
        case 'help':
            break;
        case 'flavor':
            const card = await getRandomCardWithFlavor();

            let flavorEmbed = new EmbedBuilder()
            flavorEmbed = flavorEmbed
                .setColor(0x0099FF)
                .setTitle(card.name)
                .setURL(card.scryfall_uri)
                .setDescription(`***${card.flavor_text}***`)
                .setThumbnail(card.image_uris.normal)
                .setFooter({ text: "Sourced from Scryfall", iconURL: "https://scryfall.com/favicon.ico" });

            message.reply({ embeds: [flavorEmbed] });
            break;
        case 'meme':
            const post = await getRandomRedditMeme();

            let memeEmbed = new EmbedBuilder()
            memeEmbed = memeEmbed
                .setColor(0x570bb5)
                .setTitle(post.title)
                .setURL(`https://www.reddit.com${post.permalink}`)
                .setImage(post.url)
                .setFooter({ text: "Sourced from Reddit", iconURL: "https://www.redditstatic.com/desktop2x/img/favicon/favicon-32x32.png" });

            message.reply({ embeds: [memeEmbed] });
            break;
        case 'randomcmd':
            if (args.length <= 1) {
                message.reply("Use: $randomcmd [from yyyy-mm-dd] [color count]...");
                return;
            }
            const regex = /^\d{4}-\d{2}-\d{2}$/;
            if (!regex.test(args[0])) {
                message.reply("Date must be in the format yyyy-mm-dd");
                return;
            }
            var colorArgsValid = args.slice(1).every(arg => {
                const num = Number(arg);
                return Number.isInteger(num) && num >= 1 && num <= 5;
            });
            if (!colorArgsValid) {
                message.reply("Color arguments have to be between 1 to 5");
                return;
            }

            cards = []
            for (const colorCount of args.slice(1)) {
                const card = await getRandomCommander(args[0], colorCount);
                cards.push(card);
            }

            embeds = []
            for (const card of cards) {
                let cmdEmbed = new EmbedBuilder()
                cmdEmbed = cmdEmbed
                    .setColor(0x0099FF)
                    .setTitle(card.name)
                    .setURL(card.scryfall_uri)
                    .setImage(card.image_uris.small)
                    .setFooter({ text: "Sourced from Scryfall", iconURL: "https://scryfall.com/favicon.ico" });
                embeds.push(cmdEmbed);
            }

            message.reply({ embeds: embeds });

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
