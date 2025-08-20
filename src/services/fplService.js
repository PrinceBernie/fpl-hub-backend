// File: fpl-hub-backend/src/services/fplService.js
// This service handles all FPL API interactions

const axios = require('axios');

class FPLService {
  constructor() {
    this.baseURL = 'https://fantasy.premierleague.com/api';
    this.cache = {
      bootstrap: null,
      lastFetch: null,
      cacheTime: 5 * 60 * 1000 // 5 minutes cache
    };
  }

  // Get all FPL data (players, teams, gameweeks)
  async getBootstrapData() {
    try {
      // Check cache first
      if (this.cache.bootstrap && this.cache.lastFetch) {
        const now = Date.now();
        if (now - this.cache.lastFetch < this.cache.cacheTime) {
          console.log('📦 Returning cached FPL data');
          return this.cache.bootstrap;
        }
      }

      console.log('🔄 Fetching fresh FPL data...');
      const response = await axios.get(`${this.baseURL}/bootstrap-static/`);
      
      // Update cache
      this.cache.bootstrap = response.data;
      this.cache.lastFetch = Date.now();
      
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching FPL data:', error.message);
      throw error;
    }
  }

  // Get all players with formatted data
  async getPlayers() {
    try {
      const data = await this.getBootstrapData();
      
      // Format player data for easier use
      const players = data.elements.map(player => ({
        id: player.id,
        firstName: player.first_name,
        lastName: player.second_name,
        displayName: player.web_name,
        team: data.teams.find(t => t.id === player.team)?.name,
        teamId: player.team,
        position: this.getPositionName(player.element_type),
        positionId: player.element_type,
        price: player.now_cost / 10, // Convert to millions
        points: player.total_points,
        form: player.form,
        selectedBy: `${player.selected_by_percent}%`,
        news: player.news || '',
        status: player.status,
        photo: `https://resources.premierleague.com/premierleague/photos/players/110x140/p${player.code}.png`
      }));

      return players;
    } catch (error) {
      console.error('❌ Error getting players:', error.message);
      throw error;
    }
  }

  // Get players filtered by position
  async getPlayersByPosition(positionId) {
    const players = await this.getPlayers();
    return players.filter(p => p.positionId === positionId);
  }

  // Get players filtered by team
  async getPlayersByTeam(teamId) {
    const players = await this.getPlayers();
    return players.filter(p => p.teamId === teamId);
  }

  // Get players within budget
  async getPlayersByBudget(maxPrice) {
    const players = await this.getPlayers();
    return players.filter(p => p.price <= maxPrice);
  }

  // Get current gameweek
  async getCurrentGameweek() {
    try {
      const data = await this.getBootstrapData();
      const currentGW = data.events.find(event => event.is_current);
      
      if (!currentGW) {
        // If no current gameweek, get the next one
        const nextGW = data.events.find(event => event.is_next);
        return nextGW || data.events[0];
      }
      
      return currentGW;
    } catch (error) {
      console.error('❌ Error getting gameweek:', error.message);
      throw error;
    }
  }

  // Get all teams (Premier League clubs)
  async getTeams() {
    try {
      const data = await this.getBootstrapData();
      return data.teams.map(team => ({
        id: team.id,
        name: team.name,
        shortName: team.short_name,
        strength: team.strength,
        code: team.code
      }));
    } catch (error) {
      console.error('❌ Error getting teams:', error.message);
      throw error;
    }
  }

  // Get live gameweek data
  async getLiveGameweekData(gameweekId) {
    try {
      const response = await axios.get(`${this.baseURL}/event/${gameweekId}/live/`);
      return response.data;
    } catch (error) {
      console.error('❌ Error getting live data:', error.message);
      throw error;
    }
  }

  // Get fixtures
  async getFixtures(gameweekId = null) {
    try {
      let url = `${this.baseURL}/fixtures/`;
      if (gameweekId) {
        url += `?event=${gameweekId}`;
      }
      
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('❌ Error getting fixtures:', error.message);
      throw error;
    }
  }

  // Helper function to get position name
  getPositionName(positionId) {
    const positions = {
      1: 'GKP',
      2: 'DEF', 
      3: 'MID',
      4: 'FWD'
    };
    return positions[positionId] || 'Unknown';
  }

  // Validate team according to FPL rules
  validateTeam(players) {
    const validation = {
      valid: true,
      errors: [],
      teamCount: {},
      positionCount: { 1: 0, 2: 0, 3: 0, 4: 0 },
      totalCost: 0,
      playerCount: players.length
    };

    // Check total players
    if (players.length !== 15) {
      validation.valid = false;
      validation.errors.push(`Team must have exactly 15 players (current: ${players.length})`);
    }

    // Count positions and teams
    players.forEach(player => {
      // Count positions
      validation.positionCount[player.positionId]++;
      
      // Count teams
      if (!validation.teamCount[player.teamId]) {
        validation.teamCount[player.teamId] = 0;
      }
      validation.teamCount[player.teamId]++;
      
      // Add to total cost
      validation.totalCost += player.price;
    });

    // Check position requirements (2 GKP, 5 DEF, 5 MID, 3 FWD)
    if (validation.positionCount[1] !== 2) {
      validation.valid = false;
      validation.errors.push(`Must have exactly 2 goalkeepers (current: ${validation.positionCount[1]})`);
    }
    if (validation.positionCount[2] !== 5) {
      validation.valid = false;
      validation.errors.push(`Must have exactly 5 defenders (current: ${validation.positionCount[2]})`);
    }
    if (validation.positionCount[3] !== 5) {
      validation.valid = false;
      validation.errors.push(`Must have exactly 5 midfielders (current: ${validation.positionCount[3]})`);
    }
    if (validation.positionCount[4] !== 3) {
      validation.valid = false;
      validation.errors.push(`Must have exactly 3 forwards (current: ${validation.positionCount[4]})`);
    }

    // Check max 3 players from same team
    Object.entries(validation.teamCount).forEach(([teamId, count]) => {
      if (count > 3) {
        validation.valid = false;
        validation.errors.push(`Maximum 3 players from same team (Team ${teamId} has ${count} players)`);
      }
    });

    // Check budget (100M)
    if (validation.totalCost > 100) {
      validation.valid = false;
      validation.errors.push(`Team cost exceeds £100M budget (current: £${validation.totalCost.toFixed(1)}M)`);
    }

    return validation;
  }
}

module.exports = new FPLService();