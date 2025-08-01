import { Client, EmbedBuilder, TextChannel } from 'discord.js';
import logger from './logger';

interface TwitchStream {
  id: string;
  user_id: string;
  user_login: string;
  user_name: string;
  game_id: string;
  game_name: string;
  type: string;
  title: string;
  viewer_count: number;
  started_at: string;
  language: string;
  thumbnail_url: string;
}

interface TwitchUser {
  id: string;
  login: string;
  display_name: string;
  type: string;
  broadcaster_type: string;
  description: string;
  profile_image_url: string;
  offline_image_url: string;
  view_count: number;
  created_at: string;
}

interface TwitchGame {
  id: string;
  name: string;
  box_art_url: string;
  igdb_id: string;
}

class TwitchNotificationManager {
  private client: Client;
  private accessToken: string | null = null;
  private monitoredStreamers: Set<string> = new Set();
  private liveStreamers: Set<string> = new Set();
  private notificationChannelId = '1397724929033764906';
  private checkInterval: NodeJS.Timeout | null = null;

  constructor(client: Client) {
    this.client = client;
    this.setupMonitoring();
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken) return this.accessToken;

    const clientId = process.env.TWITCH_CLIENT_ID;
    const clientSecret = process.env.TWITCH_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('Twitch API credentials not found');
    }

    try {
      const response = await fetch('https://id.twitch.tv/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'client_credentials',
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Failed to get access token: ${data.message}`);
      }

      this.accessToken = data.access_token;
      logger.info('Successfully obtained Twitch access token');
      return this.accessToken || '';
    } catch (error) {
      logger.error('Error getting Twitch access token:', error);
      throw error;
    }
  }

  private async makeAPIRequest<T>(endpoint: string, params: URLSearchParams = new URLSearchParams()): Promise<T> {
    const token = await this.getAccessToken();
    const clientId = process.env.TWITCH_CLIENT_ID;

    const url = `https://api.twitch.tv/helix/${endpoint}?${params.toString()}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Client-Id': clientId || '',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired, reset and retry
        this.accessToken = null;
        return this.makeAPIRequest(endpoint, params);
      }
      throw new Error(`Twitch API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async addStreamer(username: string): Promise<boolean> {
    try {
      // Validate streamer exists
      const userResponse = await this.makeAPIRequest<{ data: TwitchUser[] }>('users', 
        new URLSearchParams({ login: username.toLowerCase() })
      );

      if (userResponse.data.length === 0) {
        return false;
      }

      this.monitoredStreamers.add(username.toLowerCase());
      logger.info(`Added ${username} to stream monitoring`);
      return true;
    } catch (error) {
      logger.error(`Error adding streamer ${username}:`, error);
      return false;
    }
  }

  removeStreamer(username: string): boolean {
    const removed = this.monitoredStreamers.delete(username.toLowerCase());
    if (removed) {
      this.liveStreamers.delete(username.toLowerCase());
      logger.info(`Removed ${username} from stream monitoring`);
    }
    return removed;
  }

  getMonitoredStreamers(): string[] {
    return Array.from(this.monitoredStreamers);
  }

  private async checkStreams(): Promise<void> {
    if (this.monitoredStreamers.size === 0) return;

    try {
      const streamersArray = Array.from(this.monitoredStreamers);
      const params = new URLSearchParams();
      streamersArray.forEach(streamer => params.append('user_login', streamer));

      const streamResponse = await this.makeAPIRequest<{ data: TwitchStream[] }>('streams', params);
      const liveStreams = streamResponse.data;

      // Check for new live streams
      for (const stream of liveStreams) {
        const username = stream.user_login.toLowerCase();
        
        if (!this.liveStreamers.has(username)) {
          // New stream started
          this.liveStreamers.add(username);
          await this.sendStreamNotification(stream);
        }
      }

      // Remove streamers who went offline
      const currentlyLive = new Set(liveStreams.map(s => s.user_login.toLowerCase()));
      for (const liveStreamer of this.liveStreamers) {
        if (!currentlyLive.has(liveStreamer)) {
          this.liveStreamers.delete(liveStreamer);
          logger.info(`${liveStreamer} went offline`);
        }
      }

    } catch (error) {
      logger.error('Error checking streams:', error);
    }
  }

  private async sendStreamNotification(stream: TwitchStream): Promise<void> {
    try {
      const channel = this.client.channels.cache.get(this.notificationChannelId) as TextChannel;
      if (!channel) {
        logger.error(`Notification channel ${this.notificationChannelId} not found`);
        return;
      }

      // Get user info for profile picture
      const userResponse = await this.makeAPIRequest<{ data: TwitchUser[] }>('users', 
        new URLSearchParams({ id: stream.user_id })
      );
      
      const user = userResponse.data[0];
      if (!user) {
        logger.error(`User info not found for stream ${stream.id}`);
        return;
      }

      // Format stream start time
      const startTime = new Date(stream.started_at);
      const formattedTime = startTime.toLocaleString('en-US', {
        timeZone: 'UTC',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      // Create embed
      const embed = new EmbedBuilder()
        .setAuthor({ 
          name: user.display_name, 
          iconURL: user.profile_image_url,
          url: `https://twitch.tv/${user.login}`
        })
        .setTitle(stream.title)
        .setURL(`https://twitch.tv/${user.login}`)
        .setDescription(`🎮 Playing **${stream.game_name || 'Just Chatting'}**\n👥 ${stream.viewer_count} viewers`)
        .setImage(stream.thumbnail_url.replace('{width}', '1280').replace('{height}', '720'))
        .setColor(0x9146FF) // Twitch purple
        .setFooter({ 
          text: `Stream started on ${formattedTime} UTC`,
          iconURL: 'https://cdn.discordapp.com/attachments/1208254470916673547/1400554562329374771/twitch-icon.png'
        })
        .setTimestamp();

      await channel.send({ 
        content: `🔴 **${user.display_name}** is now live on Twitch!`,
        embeds: [embed] 
      });

      logger.info(`Sent stream notification for ${user.display_name}`);

    } catch (error) {
      logger.error('Error sending stream notification:', error);
    }
  }

  private setupMonitoring(): void {
    // Check for streams every 2 minutes
    this.checkInterval = setInterval(() => {
      this.checkStreams();
    }, 2 * 60 * 1000);

    logger.info('Twitch stream monitoring started');
  }

  // Test method to manually trigger a notification
  async testNotification(username: string): Promise<boolean> {
    try {
      const userResponse = await this.makeAPIRequest<{ data: TwitchUser[] }>('users', 
        new URLSearchParams({ login: username.toLowerCase() })
      );

      if (userResponse.data.length === 0) {
        return false;
      }

      const user = userResponse.data[0];

      // Check if actually live
      const streamResponse = await this.makeAPIRequest<{ data: TwitchStream[] }>('streams', 
        new URLSearchParams({ user_login: username.toLowerCase() })
      );

      if (streamResponse.data.length > 0) {
        // Actually live, send real notification
        const stream = streamResponse.data[0];
        await this.sendStreamNotification(stream);
        return true;
      } else {
        // Not live, send test notification
        const channel = this.client.channels.cache.get(this.notificationChannelId) as TextChannel;
        if (!channel) return false;

        const testEmbed = new EmbedBuilder()
          .setAuthor({ 
            name: user.display_name, 
            iconURL: user.profile_image_url,
            url: `https://twitch.tv/${user.login}`
          })
          .setTitle('🧪 Test Stream Notification')
          .setURL(`https://twitch.tv/${user.login}`)
          .setDescription(`🎮 Playing **Test Game**\n👥 1337 viewers`)
          .setColor(0x9146FF)
          .setFooter({ 
            text: `Test notification - ${new Date().toLocaleString('en-US', { timeZone: 'UTC' })} UTC`,
            iconURL: 'https://cdn.discordapp.com/attachments/1208254470916673547/1400554562329374771/twitch-icon.png'
          })
          .setTimestamp();

        await channel.send({ 
          content: `🧪 **TEST:** ${user.display_name} notification system`,
          embeds: [testEmbed] 
        });

        return true;
      }
    } catch (error) {
      logger.error(`Error testing notification for ${username}:`, error);
      return false;
    }
  }

  destroy(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    logger.info('Twitch stream monitoring stopped');
  }
}

export { TwitchNotificationManager };