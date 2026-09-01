import type {
  AuthResponseDto,
  UserProfileDto,
  UserSummaryDto,
} from "@/features/auth/contracts/dto";
import type {AuthResponse, UserProfile, UserSummary} from "@/features/auth/models";

const text = (value?: string) => value?.trim() ?? "";

export function mapUserSummary(dto: UserSummaryDto): UserSummary {
  return {
    accountId: text(dto.accountId),
    id: text(dto.id),
    email: dto.email,
    fullName: dto.fullName,
    phone: dto.phone,
    role: dto.role,
  };
}

export function mapUserProfile(dto: UserProfileDto): UserProfile {
  return {
    ...mapUserSummary(dto),
    address: dto.address,
    avatarFileId: dto.avatarFileId,
    birthday: dto.birthday,
    createdAt: dto.createdAt,
    gender: dto.gender,
    status: dto.status,
  };
}

export function mapAuthResponse(dto: AuthResponseDto): AuthResponse {
  return {
    accessToken: dto.accessToken,
    expiresIn: dto.expiresIn ?? 0,
    refreshToken: dto.refreshToken,
    tokenType: dto.tokenType,
    user: dto.user ? mapUserSummary(dto.user) : undefined,
  };
}
