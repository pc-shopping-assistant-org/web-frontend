/** Transport shapes of identity-service, kept inside the auth adapters. */
export type UserSummaryDto = {
  accountId: string;
  email: string;
  phone?: string | null;
  role: string;
  firstName: string;
  lastName: string;
  gender?: string | null;
  birthday?: string | null;
  avatarFileId?: string | null;
  avatarUrl?: string | null;
};

export type AuthResponseDto = {
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  expiresIn: number;
  user: UserSummaryDto;
};

/** A file registered in media-service. */
export type MediaFileDto = {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
};
