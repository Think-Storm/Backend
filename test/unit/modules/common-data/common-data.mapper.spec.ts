import { LanguageCode, LanguageName } from '@think-storm/contracts';
import { CommonDataMapper } from '../../../../src/modules/common-data/dto/common-data.mapper';

describe('CommonDataMapper', () => {
  let mapper: CommonDataMapper;

  beforeEach(() => {
    mapper = new CommonDataMapper();
  });

  it('should map languages to LanguageResponseDto[]', () => {
    const input = [
      { code: LanguageCode.EN, name: LanguageName.English },
      { code: LanguageCode.KR, name: LanguageName.Korean },
    ];
    const result = mapper.mapLanguages(input);
    expect(result).toEqual([
      { code: LanguageCode.EN, name: LanguageName.English },
      { code: LanguageCode.KR, name: LanguageName.Korean },
    ]);
  });

  it('should return empty array if input is empty', () => {
    const result = mapper.mapLanguages([]);
    expect(result).toEqual([]);
  });
});
