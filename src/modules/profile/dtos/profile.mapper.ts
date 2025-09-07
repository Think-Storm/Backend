import { instanceToPlain, plainToInstance } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ProfileResponseDto } from './profileResponse.dto';

export class ProfileMapper {
  /**
   * Maps a Profile entity to a ProfileResponseDto
   * @param profile - The Profile entity to be mapped
   * @returns A ProfileResponseDto with the mapped data
   */
  @ApiProperty({ type: ProfileResponseDto })
  profileToProfileResponseDto(profile: any): ProfileResponseDto {
    const plainProfile = instanceToPlain(profile);
    // Transform domain labels to string array if they exist and have the complex structure
    if (profile.interests?.length > 0) {
      plainProfile.domainLabels = profile.interests.map((dl) => dl.labelName);
    }

    // Transform technical labels to string array if they exist and have the complex structure
    if (profile.skills?.length > 0) {
      plainProfile.technicalLabels = profile.skills.map((tl) => tl.labelName);
    }

    // Transform languages to string array if they exist and have the complex structure
    if (profile.languages?.length > 0) {
      plainProfile.languages = profile.languages.map((lg) => lg.languageName);
    }

    // Transform preferred roles to string array if they exist and have the complex structure
    if (profile.preferredRole?.length > 0) {
      plainProfile.preferredRole = profile.preferredRole.map((r) => r.roleName);
    }

    return plainToInstance(ProfileResponseDto, plainProfile, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Maps an array of Profile entities to ProfileResponseDto[]
   * @param profiles - Array of Profile entities
   * @returns Array of ProfileResponseDto
   */
  @ApiProperty({ type: ProfileResponseDto })
  profilesToProfileResponseDtos(profiles: any[]): ProfileResponseDto[] {
    return profiles.map((profile) => this.profileToProfileResponseDto(profile));
  }
}
