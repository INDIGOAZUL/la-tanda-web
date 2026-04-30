// packages/sdk/src/modules/lottery.ts
import { axios } from 'axios';
import { GameListResponse, GameDetailResponse, DrawRoundResponse } from './types';

export async function listGames(): Promise<GameListResponse> {
  try {
    const response = await axios.get('https://latanda.online/api/lottery/games');
    return response.data;
  } catch (error) {
    throw new Error(`Failed to get game catalog: ${error.message}`);
  }
}

export async function getGameDetail(id: string): Promise<GameDetailResponse> {
  try {
    const response = await axios.get(`https://latanda.online/api/lottery/games/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to get game detail: ${error.message}`);
  }
}

export async function listDraws(): Promise<Array<DrawRoundResponse>> {
  try {
    const response = await axios.get('https://latanda.online/api/lottery/draws');
    return response.data;
  } catch (error) {
    throw new Error(`Failed to get list of draws: ${error.message}`);
  }
}

export async function buyTicket(gameId: string, amount: number): Promise<void> {
  try {
    const response = await axios.post('https://latanda.online/api/lottery/tickets', { gameId, amount });
    console.log(response.data);
  } catch (error) {
    throw new Error(`Failed to buy ticket: ${error.message}`);
  }
}

export async function listUserTickets(userId: string): Promise<Array<string>> {
  try {
    const response = await axios.get(`https://latanda.online/api/lottery/tickets/${userId}`);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to get user tickets: ${error.message}`);
  }
}

export async function getTicketDetail(ticketId: string): Promise<any> {
  try {
    const response = await axios.get(`https://latanda.online/api/lottery/tickets/${ticketId}`);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to get ticket detail: ${error.message}`);
  }
}

export async function claimWinnings(ticketIds: Array<string>): Promise<void> {
  try {
    const response = await axios.post('https://latanda.online/api/lottery/tickets', { ticketIds });
    console.log(response.data);
  } catch (error) {
    throw new Error(`Failed to claim winnings: ${error.message}`);
  }
}

export async function submitPrediction(gameId: string, prediction: string): Promise<void> {
  try {
    const response = await axios.post('https://latanda.online/api/lottery/predictions', { gameId, prediction });
    console.log(response.data);
  } catch (error) {
    throw new Error(`Failed to submit prediction: ${error.message}`);
  }
}

export async function listUserPredictions(userId: string): Promise<Array<any>> {
  try {
    const response = await axios.get(`https://latanda.online/api/lottery/predictions/${userId}`);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to get user predictions: ${error.message}`);
  }
}

export async function predictionHistory(gameId: string): Promise<any> {
  try {
    const response = await axios.get(`https://latanda.online/api/lottery/predictions/history/${gameId}`);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to get prediction history: ${error.message}`);
  }
}

export async function hitRateStats(gameId: string): Promise<any> {
  try {
    const response = await axios.get(`https://latanda.online/api/lottery/predictions/stats/${gameId}`);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to get hit rate stats: ${error.message}`);
  }
}

export async function globalLeaderboard(): Promise<Array<any>> {
  try {
    const response = await axios.get('https://latanda.online/api/lottery/global-leaderboard');
    return response.data;
  } catch (error) {
    throw new Error(`Failed to get global leaderboard: ${error.message}`);
  }
}

export async function perGameLeaderboard(gameId: string): Promise<Array<any>> {
  try {
    const response = await axios.get(`https://latanda.online/api/lottery/per-game-leaderboard/${gameId}`);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to get per-game leaderboard: ${error.message}`);
  }
}

export async function stats(): Promise<any> {
  try {
    const response = await axios.get('https://latanda.online/api/lottery/stats');
    return response.data;
  } catch (error) {
    throw new Error(`Failed to get latest results: ${error.message}`);
  }
}