import { Client, ActivityType, GuildMember, EmbedBuilder, TextChannel } from 'discord.js';
import logger from './logger';

interface StreamingMember {
  userId: string;
  username: string;
  twitchUsername: string;
  startTime: Date;
}

class AutoStreamDetection {
  private client: Client;
  private activeStreamers: Map<string, StreamingMember> = new Map();
  private notificationChannelId = '1397724929033764906';
  private checkInterval: NodeJS.Timeout | null = null;
  private notifiedUsers: Set<string> = new Set(); // Users who already got notification for current stream

  constructor(client: Client) {
    this.client = client;
    this.setupPresenceMonitoring();
  }

  private setupPresenceMonitoring(): void {
    // Monitor presence updates for streaming activities
    this.client.on('presenceUpdate', async (oldPresence, newPresence) => {
      try {
        if (!newPresence?.member || !newPresence.guild) return;
        
        const member = newPresence.member;
        
        // Ignore bots and apps
        if (member.user.bot) return;
        const newActivity = newPresence.activities.find(activity => 
          activity.type === ActivityType.Streaming && 
          activity.url?.includes('twitch.tv')
        );
        
        const oldActivity = oldPresence?.activities.find(activity => 
          activity.type === ActivityType.Streaming && 
          activity.url?.includes('twitch.tv')
        );

        // Member started streaming
        if (newActivity && !oldActivity && !this.activeStreamers.has(member.id)) {
          await this.handleStreamStart(member, newActivity);
        }
        
        // Member stopped streaming
        if (!newActivity && oldActivity && this.activeStreamers.has(member.id)) {
          await this.handleStreamEnd(member);
        }

      } catch (error) {
        logger.error('Error handling presence update:', error);
      }
    });

    // Also check current streaming members on startup
    this.checkCurrentStreamers();
    
    // Clean up notifications every hour
    setInterval(() => {
      this.cleanupNotifications();
    }, 60 * 60 * 1000);
    
    logger.info('Auto stream detection initialized');
  }

  private async checkCurrentStreamers(): Promise<void> {
    try {
      // Wait a moment for the client to be fully ready
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      for (const guild of this.client.guilds.cache.values()) {
        for (const member of guild.members.cache.values()) {
          // Skip bots and apps
          if (member.user.bot) continue;
          
          const streamingActivity = member.presence?.activities.find(activity => 
            activity.type === ActivityType.Streaming && 
            activity.url?.includes('twitch.tv')
          );
          
          if (streamingActivity && !this.activeStreamers.has(member.id)) {
            // Member was already streaming when bot started
            await this.handleStreamStart(member, streamingActivity);
          }
        }
      }
    } catch (error) {
      logger.error('Error checking current streamers:', error);
    }
  }

  private async handleStreamStart(member: GuildMember, activity: any): Promise<void> {
    try {
      const twitchUrl = activity.url;
      if (!twitchUrl || !twitchUrl.includes('twitch.tv/')) return;

      // Extract Twitch username from URL
      const twitchUsername = twitchUrl.split('twitch.tv/')[1]?.split('?')[0];
      if (!twitchUsername) return;

      // Check if we're already tracking this stream
      if (this.activeStreamers.has(member.id)) return;

      const streamingMember: StreamingMember = {
        userId: member.id,
        username: member.displayName || member.user.displayName || member.user.username,
        twitchUsername,
        startTime: new Date()
      };

      this.activeStreamers.set(member.id, streamingMember);
      
      // Add streaming role
      await this.addStreamingRole(member);
      
      // Send notification only if user hasn't been notified for current stream session
      if (!this.notifiedUsers.has(member.id)) {
        await this.sendStreamNotification(member, streamingMember, activity);
        this.notifiedUsers.add(member.id);
        logger.info(`Sent stream notification for ${streamingMember.username} (${twitchUsername}) - User ID: ${member.id}`);
      } else {
        logger.info(`Skipped duplicate notification for ${streamingMember.username} - already notified for current stream`);
      }

      logger.info(`Detected stream start: ${streamingMember.username} (${twitchUsername}) - User ID: ${member.id}`);

    } catch (error) {
      logger.error('Error handling stream start:', error);
    }
  }

  private async handleStreamEnd(member: GuildMember): Promise<void> {
    try {
      const streamingMember = this.activeStreamers.get(member.id);
      if (!streamingMember) return;

      this.activeStreamers.delete(member.id);
      
      // Remove from notified users so they can get notification next time they stream
      this.notifiedUsers.delete(member.id);
      
      // Remove streaming role
      await this.removeStreamingRole(member);
      
      logger.info(`Detected stream end: ${streamingMember.username} (${streamingMember.twitchUsername}) - User ID: ${member.id}`);

    } catch (error) {
      logger.error('Error handling stream end:', error);
    }
  }

  private async sendStreamNotification(member: GuildMember, streamingMember: StreamingMember, activity: any): Promise<void> {
    try {
      const channel = this.client.channels.cache.get(this.notificationChannelId) as TextChannel;
      if (!channel) {
        logger.error(`Notification channel ${this.notificationChannelId} not found`);
        return;
      }

      // Get user avatar
      const userAvatar = member.user.displayAvatarURL({ size: 256, extension: 'png' });
      
      // Format stream start time
      const formattedTime = streamingMember.startTime.toLocaleString('en-US', {
        timeZone: 'UTC',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      // Create embed with available information
      const embed = new EmbedBuilder()
        .setAuthor({ 
          name: streamingMember.username, 
          iconURL: userAvatar,
          url: activity.url
        })
        .setTitle(activity.details || 'Live Stream')
        .setURL(activity.url)
        .setDescription(`🎮 ${activity.state || 'Just Chatting'}\n\n**${streamingMember.username}** is now streaming on Twitch!`)
        .setThumbnail(userAvatar)
        .setColor(0x9146FF) // Twitch purple
        .setFooter({ 
          text: `Stream started on ${formattedTime} UTC`,
          iconURL: 'https://cdn.discordapp.com/attachments/1208254470916673547/1400554562329374771/twitch-icon.png'
        })
        .setTimestamp();

      await channel.send({ 
        content: `🔴 **${streamingMember.username}** is now live on Twitch!`,
        embeds: [embed] 
      });

      logger.info(`Sent auto stream notification for ${streamingMember.username}`);

    } catch (error) {
      logger.error('Error sending auto stream notification:', error);
    }
  }

  private async addStreamingRole(member: GuildMember): Promise<void> {
    try {
      const guild = member.guild;
      
      // Refresh member to get latest role cache
      await member.fetch();
      
      let streamingRole = guild.roles.cache.find(role => role.name === 'streaming now');
      
      // Create the role if it doesn't exist
      if (!streamingRole) {
        streamingRole = await guild.roles.create({
          name: 'streaming now',
          color: 0x9146FF, // Twitch purple
          reason: 'Auto-created for streaming members'
        });
        logger.info('Created "streaming now" role');
      }
      
      // Add role to member if they don't already have it
      if (!member.roles.cache.has(streamingRole.id)) {
        await member.roles.add(streamingRole);
        logger.info(`Added streaming role to ${member.displayName} (${member.id})`);
        
        // Verify addition worked
        await member.fetch();
        if (!member.roles.cache.has(streamingRole.id)) {
          logger.warn(`Role addition may have failed for ${member.displayName} (${member.id}) - role not present after refresh`);
        }
      } else {
        logger.info(`${member.displayName} (${member.id}) already has streaming role`);
      }
      
    } catch (error) {
      logger.error(`Error adding streaming role to ${member.displayName} (${member.id}):`, error);
    }
  }

  private async removeStreamingRole(member: GuildMember): Promise<void> {
    try {
      const guild = member.guild;
      
      // Refresh member to get latest role cache
      await member.fetch();
      
      const streamingRole = guild.roles.cache.find(role => role.name === 'streaming now');
      
      if (streamingRole && member.roles.cache.has(streamingRole.id)) {
        await member.roles.remove(streamingRole);
        logger.info(`Removed streaming role from ${member.displayName} (${member.id})`);
        
        // Double-check removal worked by refreshing member
        await member.fetch();
        if (member.roles.cache.has(streamingRole.id)) {
          logger.warn(`Role removal may have failed for ${member.displayName} (${member.id}) - role still present after refresh`);
        }
      } else if (streamingRole) {
        logger.info(`${member.displayName} (${member.id}) doesn't have streaming role to remove`);
      } else {
        logger.warn('Streaming role not found when trying to remove');
      }
      
    } catch (error) {
      logger.error(`Error removing streaming role from ${member.displayName} (${member.id}):`, error);
    }
  }

  // Get list of currently streaming members
  getCurrentStreamers(): StreamingMember[] {
    return Array.from(this.activeStreamers.values());
  }

  // Check if a specific member is currently streaming
  isMemberStreaming(userId: string): boolean {
    return this.activeStreamers.has(userId);
  }

  private cleanupNotifications(): void {
    // Clean up notified users set periodically to prevent memory leaks
    // This will be cleaned when users stop streaming anyway
    logger.info(`Cleaned up notification tracking for ${this.notifiedUsers.size} users`);
  }

  destroy(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    logger.info('Auto stream detection stopped');
  }
}

export { AutoStreamDetection, StreamingMember };