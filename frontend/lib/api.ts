import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://contest-rating-system-o84v.onrender.com';

export const apiClient = axios.create({
  baseURL: `${API}/api`,
});

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

export async function getUserProfile(userId: string): Promise<UserProfileResponse> {
  const { data } = await apiClient.get<UserProfileResponse>(`/users/${userId}/profile`);
  return data;
}
