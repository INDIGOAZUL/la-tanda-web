// packages/sdk/src/modules/lottery.ts

import axios from 'axios';

interface Game {
  id: string;
  name: string;
  status: 'active' | 'inactive';
}

interface Draw {
  id: string;
  game: Game;
  number: number;
  result: boolean;
}

interface Ticket {
  id: string;
  user: string;
  game: Game;
  price: number;
}

interface Prediction {
  id: string;
  user: string;
  game: Game;
  prediction: string;
  timestamp: Date;
}

interface LeaderboardUser {
  name: string;
  wins: number;
}

interface LeaderboardGlobal extends LeaderboardUser {
  game: Game;
}

interface LeaderboardPerGame extends LeaderboardUser {
  game: Game;
}

interface PredictionHistory extends Prediction {
  winner: boolean;
}

interface HitRateStats {
  hits: number;
  total: number;
}

interface LotteryModule {
  async listGames(): Promise<Game[]>;
  async getGameDetails(gameId: string): Promise<Game>;
  async listDraws(gameId: string): Promise<Draw[]>;
  async buyTicket(gameId: string, price: number): Promise<Ticket>;
  async getUserTickets(user: string): Promise<Ticket[]>;
  async getTicketDetails(ticketId: string): Promise<Ticket>;
  async submitPrediction(user: string, gameId: string, prediction: string): Promise<Prediction>;
  async getUserPredictions(user: string): Promise<Prediction[]>;
  async predictionHistory(user: string, gameId: string): Promise<PredictionHistory[]>;
  async hitRateStats(gameId: string): Promise<HitRateStats>;
}

const lotteryModule: LotteryModule = {
  async listGames() {
    const response = await axios.get('https://latanda.online/api/lottery/game');
    return response.data;
  },

  async getGameDetails(gameId: string) {
    const response = await axios.get(`https://latanda.online/api/lottery/game/${gameId}`);
    return response.data;
  },

  async listDraws(gameId: string) {
    const response = await axios.get(`https://latanda.online/api/lottery/draw/${gameId}`);
    return response.data;
  },

  async buyTicket(gameId: string, price: number) {
    const data = { gameId, price };
    const response = await axios.post('https://latanda.online/api/lottery/ticket', data);
    return response.data;
  },

  async getUserTickets(user: string) {
    const response = await axios.get(`https://latanda.online/api/lottery/user/${user}/ticket`);
    return response.data;
  },

  async getTicketDetails(ticketId: string) {
    const response = await axios.get(`https://latanda.online/api/lottery/ticket/${ticketId}`);
    return response.data;
  },

  async submitPrediction(user: string, gameId: string, prediction: string) {
    const data = { user, gameId, prediction };
    const response = await axios.post('https://latanda.online/api/lottery/prediction', data);
    return response.data;
  },

  async getUserPredictions(user: string) {
    const response = await axios.get(`https://latanda.online/api/lottery/user/${user}/prediction`);
    return response.data;
  },

  async predictionHistory(user: string, gameId: string) {
    const response = await axios.get(`https://latanda.online/api/lottery/user/${user}/prediction/history?gameId=${gameId}`);
    return response.data;
  },

  async hitRateStats(gameId: string) {
    const response = await axios.get(`https://latanda.online/api/lottery/game/${gameId}/hit-rate-stats`);
    return response.data;
  },
};

export default lotteryModule;