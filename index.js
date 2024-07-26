require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const OpenAI = require('openai');

const client = new Client({ intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
] });

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

client.once('ready', () => {
    console.log('Ready!');
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (message.content.startsWith('!ask ')) {
        const query = message.content.replace('!ask ', '');

        try {
            const completion = await openai.chat.completions.create({
                messages: [{ role: "user", content: query }],
                model: "gpt-4o-mini",
            });

            message.reply(completion.choices[0].message.content.trim());
        } catch (error) {
            if (error.code === 'insufficient_quota') {
                message.reply('Sorry, I have reached my request limit. Please try again later.');
            } else {
                console.error('Error with OpenAI API:', error);
                message.reply('Sorry, there was an error processing your request.');
            }
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
