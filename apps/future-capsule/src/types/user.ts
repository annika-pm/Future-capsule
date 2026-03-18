export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: number;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}
