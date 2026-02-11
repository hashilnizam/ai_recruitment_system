const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

class SocketHandler {
  constructor() {
    this.wss = null;
    this.clients = new Map(); // userId -> WebSocket connection
  }

  initialize(server) {
    this.wss = new WebSocket.Server({ 
      server,
      path: '/ws'
    });

    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });

    console.log('🔌 WebSocket server initialized');
  }

  async handleConnection(ws, req) {
    try {
      // Extract token from query parameters or headers
      const token = this.extractToken(req);
      
      if (!token) {
        ws.close(1008, 'Authentication token required');
        return;
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.id;
      const userRole = decoded.role;

      // Store client connection
      this.clients.set(userId, {
        ws,
        userId,
        userRole,
        connectedAt: new Date()
      });

      console.log(`👤 User ${userId} (${userRole}) connected via WebSocket`);

      // Send welcome message
      this.sendToUser(userId, {
        type: 'connection',
        message: 'Connected successfully',
        timestamp: new Date().toISOString()
      });

      // Handle messages from client
      ws.on('message', (data) => {
        this.handleMessage(userId, data);
      });

      // Handle disconnection
      ws.on('close', () => {
        this.handleDisconnection(userId);
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error(`WebSocket error for user ${userId}:`, error);
        this.handleDisconnection(userId);
      });

    } catch (error) {
      console.error('WebSocket authentication error:', error);
      ws.close(1008, 'Invalid authentication token');
    }
  }

  extractToken(req) {
    // Try to get token from query parameters
    const url = new URL(req.url, 'http://localhost');
    const token = url.searchParams.get('token');
    
    if (token) return token;

    // Try to get token from headers
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return null;
  }

  handleMessage(userId, data) {
    try {
      const message = JSON.parse(data);
      
      switch (message.type) {
        case 'ping':
          this.sendToUser(userId, {
            type: 'pong',
            timestamp: new Date().toISOString()
          });
          break;
        
        case 'subscribe':
          this.handleSubscription(userId, message);
          break;
        
        case 'unsubscribe':
          this.handleUnsubscription(userId, message);
          break;
        
        default:
          console.log(`Unknown message type from user ${userId}:`, message.type);
      }
    } catch (error) {
      console.error(`Error handling message from user ${userId}:`, error);
    }
  }

  handleSubscription(userId, message) {
    const client = this.clients.get(userId);
    if (!client) return;

    client.subscriptions = client.subscriptions || new Set();
    
    if (message.channel) {
      client.subscriptions.add(message.channel);
      
      this.sendToUser(userId, {
        type: 'subscribed',
        channel: message.channel,
        message: `Subscribed to ${message.channel}`,
        timestamp: new Date().toISOString()
      });
    }
  }

  handleUnsubscription(userId, message) {
    const client = this.clients.get(userId);
    if (!client || !client.subscriptions) return;

    if (message.channel) {
      client.subscriptions.delete(message.channel);
      
      this.sendToUser(userId, {
        type: 'unsubscribed',
        channel: message.channel,
        message: `Unsubscribed from ${message.channel}`,
        timestamp: new Date().toISOString()
      });
    }
  }

  handleDisconnection(userId) {
    this.clients.delete(userId);
    console.log(`👋 User ${userId} disconnected from WebSocket`);
  }

  sendToUser(userId, message) {
    const client = this.clients.get(userId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  }

  // Broadcast to all users with a specific role
  broadcastToRole(role, message) {
    for (const [userId, client] of this.clients) {
      if (client.userRole === role && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(message));
      }
    }
  }

  // Broadcast to all users subscribed to a specific channel
  broadcastToChannel(channel, message) {
    for (const [userId, client] of this.clients) {
      if (client.subscriptions && client.subscriptions.has(channel) && 
          client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(message));
      }
    }
  }

  // Send notification to specific recruiter about new application
  notifyNewApplication(recruiterId, applicationData) {
    this.sendToUser(recruiterId, {
      type: 'new_application',
      data: applicationData,
      message: `New application received for ${applicationData.job_title}`,
      timestamp: new Date().toISOString()
    });
  }

  // Send notification to candidate about application status change
  notifyApplicationStatusChange(candidateId, applicationData) {
    this.sendToUser(candidateId, {
      type: 'application_status_change',
      data: applicationData,
      message: `Your application status has been updated to: ${applicationData.status}`,
      timestamp: new Date().toISOString()
    });
  }

  // Send notification about AI ranking completion
  notifyRankingCompleted(recruiterId, jobId, rankingData) {
    this.sendToUser(recruiterId, {
      type: 'ranking_completed',
      data: {
        jobId,
        ...rankingData
      },
      message: `AI ranking completed for job ID: ${jobId}`,
      timestamp: new Date().toISOString()
    });
  }

  // Get connection statistics
  getStats() {
    const roleStats = {};
    let totalConnections = 0;

    for (const [userId, client] of this.clients) {
      totalConnections++;
      roleStats[client.userRole] = (roleStats[client.userRole] || 0) + 1;
    }

    return {
      totalConnections,
      roleStats,
      connectedUsers: Array.from(this.clients.keys())
    };
  }
}

module.exports = new SocketHandler();
