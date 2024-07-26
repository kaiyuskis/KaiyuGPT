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
    console.log('Bot is ready and connected to Discord!');
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    // ボットがメンションされたかどうかを確認
    if (message.mentions.has(client.user)) {
        const query = message.content.replace(`<@${client.user.id}>`, '').trim();
        console.log(`Processing query: ${query}`);

        try {
            const completion = await openai.chat.completions.create({
                messages: [{ role: "user", content: query }],
                model: "gpt-4o-mini",
            });

            const replyContent = completion.choices[0].message.content.trim();
            console.log(`Replying with: ${replyContent}`);

            message.reply(replyContent);
        } catch (error) {
            if (error.code === 'insufficient_quota') {
                const errorMessage = 'Sorry, I have reached my request limit. Please try again later.';
                console.error('OpenAI API error: insufficient_quota');
                message.reply(errorMessage);
            } else {
                console.error('Error with OpenAI API:', error);
                message.reply('Sorry, there was an error processing your request.');
            }
        }
    }
});

// 終了シグナルをキャッチしてクリーンアップ処理を行う
const cleanup = () => {
    console.log('Cleaning up before exit...');
    client.destroy();
    process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

client.login(process.env.DISCORD_TOKEN);