export type UserSummary = {
  accountId: string;
  email: string;
  firstName: string;
  lastName: string;
  /** Family name then given name (Vietnamese order), for display. */
  fullName: string;
  phone?: string;
  role: string;
};

export type UserProfile = UserSummary & {
  birthday?: string;
  gender?: string;
  avatarFileId?: string;
  avatarUrl?: string;
};

export type UploadedImage = {
  id: string;
  url: string;
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
