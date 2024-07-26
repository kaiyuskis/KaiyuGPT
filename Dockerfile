# ベースイメージとして公式のNode.jsイメージを使用
FROM node:20-alpine

# 作業ディレクトリを設定
WORKDIR /usr/src/app

# package.jsonとpackage-lock.jsonをコピー
COPY package*.json ./

# 依存関係をインストール
RUN npm install

# ソースコードをコピー
COPY . .

# 環境変数を設定
ENV DISCORD_TOKEN=your_discord_bot_token
ENV OPENAI_API_KEY=your_openai_api_key

# アプリケーションを起動
CMD ["node", "index.js"]
