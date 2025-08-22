// File: fpl-hub-backend/src/services/databaseService.js
// Database connection and utilities

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Create a single instance of PrismaClient
const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

// User Services
const UserService = {
  // Create new user
  async createUser(userData) {
    const { email, username, password, phone } = userData;
    
    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    });
    
    if (existingUser) {
      throw new Error('User with this email or username already exists');
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        phone
      },
      select: {
        id: true,
        email: true,
        username: true,
        phone: true,
        createdAt: true
      }
    });
    
    return user;
  },
  
  // Login user
  async loginUser(email, password) {
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );
    
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        phone: user.phone
      }
    };
  },
  
  // Get user by ID
  async getUserById(userId) {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        phone: true,
        createdAt: true,
        teams: true
      }
    });
  }
};

// Team Services
const TeamService = {
  // Create team
  async createTeam(teamData) {
    const { name, userId, players, captain, viceCaptain, budget, totalCost } = teamData;
    
    const team = await prisma.team.create({
      data: {
        name,
        userId,
        players, // This will be stored as JSON
        captain,
        viceCaptain,
        budget: budget || 100,
        totalCost: totalCost || 0
      }
    });
    
    return team;
  },
  
  // Get all teams
  async getAllTeams() {
    return await prisma.team.findMany({
      include: {
        user: {
          select: {
            username: true,
            email: true
          }
        }
      }
    });
  },
  
  // Get team by ID
  async getTeamById(teamId) {
    return await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        user: {
          select: {
            username: true,
            email: true
          }
        }
      }
    });
  },
  
  // Get teams by user
  async getTeamsByUser(userId) {
    return await prisma.team.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  },
  
  // Update team
  async updateTeam(teamId, updates) {
    return await prisma.team.update({
      where: { id: teamId },
      data: updates
    });
  },
  
  // Delete team
  async deleteTeam(teamId) {
    // First delete all league entries for this team
    await prisma.leagueEntry.deleteMany({
      where: { teamId }
    });
    
    // Then delete the team
    return await prisma.team.delete({
      where: { id: teamId }
    });
  }
};

// League Services
const LeagueService = {
  // Create league
  async createLeague(leagueData) {
    const { name, type, entryFee, maxTeams, createdBy } = leagueData;
    
    const league = await prisma.league.create({
      data: {
        name,
        type: type || 'classic',
        entryFee: parseFloat(entryFee) || 0,
        maxTeams: parseInt(maxTeams) || 100,
        createdBy,
        status: 'open'
      }
    });
    
    return league;
  },
  
  // Get all leagues
  async getAllLeagues() {
    return await prisma.league.findMany({
      include: {
        entries: {
          include: {
            team: true,
            user: {
              select: {
                username: true
              }
            }
          }
        }
      }
    });
  },
  
  // Get open leagues
  async getOpenLeagues() {
    return await prisma.league.findMany({
      where: {
        status: 'open'
      },
      include: {
        entries: {
          include: {
            team: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });
  },
  
  // Get league by ID
  async getLeagueById(leagueId) {
    return await prisma.league.findUnique({
      where: { id: leagueId },
      include: {
        entries: {
          include: {
            team: true,
            user: {
              select: {
                username: true,
                email: true
              }
            }
          },
          orderBy: {
            points: 'desc'
          }
        }
      }
    });
  },
  
  // Join league
  async joinLeague(leagueId, teamId, userId) {
    // Check if league exists and is open
    const league = await prisma.league.findUnique({
      where: { id: leagueId },
      include: {
        entries: true
      }
    });
    
    if (!league) {
      throw new Error('League not found');
    }
    
    if (league.status !== 'open') {
      throw new Error('League is not open for joining');
    }
    
    if (league.entries.length >= league.maxTeams) {
      throw new Error('League is full');
    }
    
    // Check if team already in league
    const existingEntry = await prisma.leagueEntry.findFirst({
      where: {
        leagueId,
        teamId
      }
    });
    
    if (existingEntry) {
      throw new Error('Team already in this league');
    }
    
    // Create league entry
    const entry = await prisma.leagueEntry.create({
      data: {
        leagueId,
        teamId,
        userId
      }
    });
    
    // Update prize pool
    await prisma.league.update({
      where: { id: leagueId },
      data: {
        prizePool: {
          increment: league.entryFee
        }
      }
    });
    
    // Check if league should start
    const updatedLeague = await prisma.league.findUnique({
      where: { id: leagueId },
      include: { entries: true }
    });
    
    if (updatedLeague.entries.length >= updatedLeague.maxTeams) {
      await prisma.league.update({
        where: { id: leagueId },
        data: { status: 'in-progress' }
      });
    }
    
    return entry;
  },
  
  // Leave league
  async leaveLeague(leagueId, teamId) {
    const entry = await prisma.leagueEntry.findFirst({
      where: {
        leagueId,
        teamId
      }
    });
    
    if (!entry) {
      throw new Error('Team not in this league');
    }
    
    // Delete entry
    await prisma.leagueEntry.delete({
      where: { id: entry.id }
    });
    
    // Update prize pool
    const league = await prisma.league.findUnique({
      where: { id: leagueId }
    });
    
    await prisma.league.update({
      where: { id: leagueId },
      data: {
        prizePool: Math.max(0, league.prizePool - league.entryFee)
      }
    });
    
    return true;
  },
  
  // Get league standings
  async getLeagueStandings(leagueId) {
    const league = await prisma.league.findUnique({
      where: { id: leagueId },
      include: {
        entries: {
          include: {
            team: true,
            user: {
              select: {
                username: true
              }
            }
          },
          orderBy: {
            points: 'desc'
          }
        }
      }
    });
    
    if (!league) {
      throw new Error('League not found');
    }
    
    // Add rank to each entry
    const standings = league.entries.map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));
    
    return {
      league,
      standings
    };
  }
};

// Transaction Services
const TransactionService = {
  // Create transaction
  async createTransaction(transactionData) {
    const { userId, leagueId, type, amount, paymentMethod } = transactionData;
    
    // Generate unique reference
    const reference = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        leagueId,
        type,
        amount,
        reference,
        paymentMethod,
        status: 'pending'
      }
    });
    
    return transaction;
  },
  
  // Update transaction status
  async updateTransactionStatus(transactionId, status) {
    return await prisma.transaction.update({
      where: { id: transactionId },
      data: { status }
    });
  },
  
  // Get user transactions
  async getUserTransactions(userId) {
    return await prisma.transaction.findMany({
      where: { userId },
      include: {
        league: {
          select: {
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
};

module.exports = {
  prisma,
  UserService,
  TeamService,
  LeagueService,
  TransactionService
};