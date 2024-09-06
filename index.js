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

// ユーザーごとの会話履歴を保持するMap
const conversationHistories = new Map();

client.once('ready', () => {
    console.log('KaiyuGPT is ready and connected to Discord!');
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    // ボットがメンションされたかどうかを確認
    if (message.mentions.has(client.user)) {
        const userId = message.author.id;
        const query = message.content.replace(`<@${client.user.id}>`, '').trim();
        console.log(`Processing query from ${userId}: ${query}`);

        // ユーザーごとの会話履歴を取得または初期化
        if (!conversationHistories.has(userId)) {
            conversationHistories.set(userId, []);
        }

        // 新しいメッセージを履歴に追加
        conversationHistories.get(userId).push({ role: "user", content: query });

        // システムメッセージを追加して、KaiyuGPTとしてのキャラクターを設定
        const messages = [
            { 
                role: "system", 
                content: "You are KaiyuGPT, an elegant and sophisticated AI assistant who speaks like a refined lady from a noble family. Always end sentences with 'ですわ' or similar polite expressions." 
            },
            ...conversationHistories.get(userId)
        ];

        try {
            // 会話履歴を元にOpenAI APIにリクエスト
            const completion = await openai.chat.completions.create({
                messages: messages,
                model: "gpt-4o-mini",
            });

            let replyContent = completion.choices[0].message.content.trim();
            console.log(`Original reply to ${userId}: ${replyContent}`);

            console.log(`Replying with converted tone to ${userId}: ${replyContent}`);

            // ボットの応答を会話履歴に追加
            conversationHistories.get(userId).push({ role: "assistant", content: replyContent });

            message.reply(replyContent);
        } catch (error) {
            if (error.code === 'insufficient_quota') {
                const errorMessage = 'Sorry, I have reached my request limit. Please try again later. ですわ';
                console.error('OpenAI API error: insufficient_quota');
                message.reply(errorMessage);
            } else {
                console.error('Error with OpenAI API:', error);
                message.reply('Sorry, there was an error processing your request. ですわ');
            }
        }

        // 会話履歴が長くなりすぎないように調整
        const MAX_HISTORY_LENGTH = 10; // 例えば、最大10メッセージ
        const history = conversationHistories.get(userId);
        if (history.length > MAX_HISTORY_LENGTH) {
            history.shift(); // 最も古いメッセージを削除
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
