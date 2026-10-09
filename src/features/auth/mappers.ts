import type {AuthResponseDto, MediaFileDto, UserSummaryDto} from "@/features/auth/contracts/dto";
import type {AuthResponse, UploadedImage, UserProfile, UserSummary} from "@/features/auth/models";

export function mapUserSummary(dto: UserSummaryDto): UserSummary {
  return {
    accountId: dto.accountId,
    email: dto.email,
    firstName: dto.firstName,
    lastName: dto.lastName,
    fullName: `${dto.lastName} ${dto.firstName}`.trim(),
    phone: dto.phone ?? undefined,
    role: dto.role,
  };
}

export function mapUserProfile(dto: UserSummaryDto): UserProfile {
  return {
    ...mapUserSummary(dto),
    birthday: dto.birthday ?? undefined,
    gender: dto.gender ?? undefined,
    avatarFileId: dto.avatarFileId ?? undefined,
    avatarUrl: dto.avatarUrl ?? undefined,
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

export function mapUploadedImage(dto: MediaFileDto): UploadedImage {
  return {id: dto.id, url: dto.url};
}
