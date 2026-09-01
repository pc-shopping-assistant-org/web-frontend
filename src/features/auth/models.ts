export type UserSummary = {
  accountId: string;
  id: string;
  email?: string;
  fullName?: string;
  phone?: string;
  role?: string;
};

export type UserProfile = UserSummary & {
  address?: string;
  avatarFileId?: string;
  birthday?: string;
  createdAt?: string;
  gender?: string;
  status?: string;
};

export type AuthResponse = {
  accessToken?: string;
  expiresIn: number;
  refreshToken?: string;
  tokenType?: string;
  user?: UserSummary;
};

export type AuthTokenPair = Pick<
  AuthResponse,
  "accessToken" | "refreshToken" | "expiresIn" | "tokenType"
>;
