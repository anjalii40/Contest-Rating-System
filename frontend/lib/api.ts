import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://contest-rating-system-o84v.onrender.com';

export const apiClient = axios.create({
  baseURL: `${API}/api`,
});

export const API_BASE_URL = API;

export interface User {
  id: number;
  name: string;
  current_rating: number;
  max_rating: number;
  contests_played: number;
  tier: string;
  created_at: string;
}

export interface RatingHistory {
  id: number;
  user_id: number;
  contest_id: number;
  contest_name: string;
  contest_date: string;
  old_rating: number;
  new_rating: number;
  performance_rating: number;
  rank: number;
  percentile: number;
  rating_change: number;
  created_at: string;
}

export interface UserProfileResponse {
  user: User;
  history: RatingHistory[];
}

export interface Contest {
  id: number;
  name: string;
  date: string;
  total_participants: number;
  created_at: string;
  updated_at: string;
}

export interface CreateContestPayload {
  name: string;
  total_participants: number;
}

export interface SubmitContestResultPayload {
  user_id: number;
  rank: number;
}

export interface GenerateDemoContestPayload {
  participant_count?: number;
}

export interface GenerateDemoContestResponse {
  contest_id: number;
  contest_name: string;
  total_participants: number;
  updated_users: number;
  winner_user_id: number;
  redirect_path: string;
}

export interface Standing {
  rank: number;
  user_id: number;
  username: string;
  old_rating: number;
  new_rating: number;
  rating_change: number;
  percentile: number;
}

export interface ContestWithStandingsResponse {
  contest: Contest;
  standings: Standing[];
}

export async function getUserProfile(userId: string): Promise<UserProfileResponse> {
  const { data } = await apiClient.get<UserProfileResponse>(`/users/${userId}/profile`);
  return data;
}

export async function createContest(payload: CreateContestPayload): Promise<Contest> {
  const { data } = await apiClient.post<Contest>('/contests', payload);
  return data;
}

export async function submitContestResults(contestId: number, payload: SubmitContestResultPayload[]): Promise<void> {
  await apiClient.post(`/contests/${contestId}/submit-results`, payload);
}

export async function generateDemoContest(payload: GenerateDemoContestPayload = {}): Promise<GenerateDemoContestResponse> {
  const { data } = await apiClient.post<GenerateDemoContestResponse>('/contests/generate-demo', payload);
  return data;
}

export async function getContestWithStandings(contestId: string): Promise<ContestWithStandingsResponse> {
  const { data } = await apiClient.get<ContestWithStandingsResponse>(`/contests/${contestId}`);
  return data;
}
