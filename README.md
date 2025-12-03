# Discord Music Bot

Bot Discord để phát playlist từ AI Playlist Generator.

## Yêu cầu

- Node.js 18+
- Discord Developer Account
- Discord Bot Token

## Cài đặt

### 1. Tạo Discord Bot

1. Truy cập [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" → đặt tên → Create
3. Vào tab "Bot" → Click "Add Bot"
4. Copy **Bot Token** (giữ bí mật!)
5. Bật các Intents:
   - MESSAGE CONTENT INTENT
   - SERVER MEMBERS INTENT
6. Vào tab "OAuth2" → "URL Generator":
   - Chọn "bot" scope
   - Chọn permissions: Send Messages, Connect, Speak, Use Voice Activity
7. Copy URL và mời bot vào server của bạn

### 2. Setup Bot

\`\`\`bash
cd discord-bot
npm install
\`\`\`

### 3. Cấu hình

Tạo file `.env`:

\`\`\`
DISCORD_TOKEN=your_bot_token_here
\`\`\`

### 4. Chạy Bot

\`\`\`bash
npm start
\`\`\`

## Sử dụng

Trong Discord, sử dụng lệnh:

\`\`\`
!play Tên bài 1 của Nghệ sĩ 1 | Tên bài 2 của Nghệ sĩ 2 | ...
\`\`\`

Ví dụ:
\`\`\`
!play Summertime Sadness của Lana Del Rey | Señorita của Shawn Mendes
\`\`\`

## Deploy

### Railway
1. Push code lên GitHub
2. Kết nối Railway với GitHub repo
3. Thêm environment variable `DISCORD_TOKEN`
4. Deploy!

### Heroku
1. Tạo app trên Heroku
2. Thêm buildpack Node.js
3. Set Config Vars: `DISCORD_TOKEN`
4. Deploy từ GitHub

## Lưu ý

Bot này sử dụng YouTube để tìm và phát nhạc. Đảm bảo tuân thủ các quy định của YouTube và Discord.
