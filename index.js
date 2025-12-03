require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { 
  joinVoiceChannel, 
  createAudioPlayer, 
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState
} = require('@discordjs/voice');
const play = require('play-dl');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

// Queue for each server
const queues = new Map();

client.once('ready', () => {
  console.log(`🎵 Bot is ready! Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const content = message.content.trim();

  // Handle !play command
  if (content.startsWith('!play ')) {
    const args = content.slice(6).trim();
    
    if (!args) {
      return message.reply('❌ Vui lòng cung cấp danh sách bài hát!');
    }

    // Check if user is in a voice channel
    const voiceChannel = message.member?.voice.channel;
    if (!voiceChannel) {
      return message.reply('❌ Bạn cần vào voice channel trước!');
    }

    // Parse songs from the command
    // Format: !play Song1 của Artist1 | Song2 của Artist2 | ...
    const songStrings = args.split('|').map(s => s.trim()).filter(s => s);
    
    if (songStrings.length === 0) {
      return message.reply('❌ Không tìm thấy bài hát nào!');
    }

    const songs = songStrings.map(str => {
      // Try to extract song and artist
      const match = str.match(/(.+?)\s+của\s+(.+)/i);
      if (match) {
        return { title: match[1].trim(), artist: match[2].trim() };
      }
      return { title: str, artist: '' };
    });

    message.reply(`🎵 Đang thêm ${songs.length} bài hát vào hàng đợi...`);

    // Get or create queue for this server
    let serverQueue = queues.get(message.guild.id);
    
    if (!serverQueue) {
      serverQueue = {
        voiceChannel,
        textChannel: message.channel,
        connection: null,
        player: createAudioPlayer(),
        songs: [],
        playing: false
      };
      queues.set(message.guild.id, serverQueue);
    }

    // Add songs to queue
    for (const song of songs) {
      serverQueue.songs.push(song);
    }

    // Start playing if not already
    if (!serverQueue.playing) {
      await playNext(message.guild.id);
    }
  }

  // Handle !skip command
  if (content === '!skip') {
    const serverQueue = queues.get(message.guild.id);
    if (serverQueue && serverQueue.player) {
      serverQueue.player.stop();
      message.reply('⏭️ Đã skip bài hiện tại!');
    }
  }

  // Handle !stop command
  if (content === '!stop') {
    const serverQueue = queues.get(message.guild.id);
    if (serverQueue) {
      serverQueue.songs = [];
      if (serverQueue.player) {
        serverQueue.player.stop();
      }
      if (serverQueue.connection) {
        serverQueue.connection.destroy();
      }
      queues.delete(message.guild.id);
      message.reply('⏹️ Đã dừng phát và xóa hàng đợi!');
    }
  }

  // Handle !queue command
  if (content === '!queue') {
    const serverQueue = queues.get(message.guild.id);
    if (!serverQueue || serverQueue.songs.length === 0) {
      return message.reply('📋 Hàng đợi trống!');
    }

    const queueList = serverQueue.songs.slice(0, 10).map((song, index) => 
      `${index + 1}. ${song.title}${song.artist ? ` - ${song.artist}` : ''}`
    ).join('\n');

    message.reply(`📋 **Hàng đợi:**\n${queueList}${serverQueue.songs.length > 10 ? `\n...và ${serverQueue.songs.length - 10} bài nữa` : ''}`);
  }
});

async function playNext(guildId) {
  const serverQueue = queues.get(guildId);
  
  if (!serverQueue || serverQueue.songs.length === 0) {
    if (serverQueue?.connection) {
      serverQueue.connection.destroy();
    }
    queues.delete(guildId);
    return;
  }

  const song = serverQueue.songs.shift();
  serverQueue.playing = true;

  try {
    // Connect to voice channel if not connected
    if (!serverQueue.connection) {
      serverQueue.connection = joinVoiceChannel({
        channelId: serverQueue.voiceChannel.id,
        guildId: guildId,
        adapterCreator: serverQueue.voiceChannel.guild.voiceAdapterCreator,
      });

      serverQueue.connection.on(VoiceConnectionStatus.Disconnected, async () => {
        try {
          await Promise.race([
            entersState(serverQueue.connection, VoiceConnectionStatus.Signalling, 5_000),
            entersState(serverQueue.connection, VoiceConnectionStatus.Connecting, 5_000),
          ]);
        } catch (error) {
          serverQueue.connection.destroy();
          queues.delete(guildId);
        }
      });
    }

    // Search for the song on YouTube
    const searchQuery = `${song.title} ${song.artist}`.trim();
    serverQueue.textChannel.send(`🔍 Đang tìm: **${searchQuery}**`);

    const searchResults = await play.search(searchQuery, { limit: 1 });
    
    if (searchResults.length === 0) {
      serverQueue.textChannel.send(`❌ Không tìm thấy: ${searchQuery}`);
      return playNext(guildId);
    }

    const video = searchResults[0];
    const stream = await play.stream(video.url);
    
    const resource = createAudioResource(stream.stream, {
      inputType: stream.type
    });

    serverQueue.player.play(resource);
    serverQueue.connection.subscribe(serverQueue.player);

    serverQueue.textChannel.send(`🎵 Đang phát: **${video.title}**`);

    serverQueue.player.on(AudioPlayerStatus.Idle, () => {
      playNext(guildId);
    });

    serverQueue.player.on('error', error => {
      console.error('Player error:', error);
      serverQueue.textChannel.send(`❌ Lỗi phát nhạc: ${error.message}`);
      playNext(guildId);
    });

  } catch (error) {
    console.error('Error playing song:', error);
    serverQueue.textChannel.send(`❌ Lỗi: ${error.message}`);
    playNext(guildId);
  }
}

// Login to Discord
const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error('❌ DISCORD_TOKEN không được cấu hình!');
  process.exit(1);
}

client.login(token);
