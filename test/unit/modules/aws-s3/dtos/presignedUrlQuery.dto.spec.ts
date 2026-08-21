import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PresignedUrlQueryDto } from '../../../../../src/modules/aws-s3/dtos/presignedUrlQuery.dto';

const validQuery = {
  filename: 'photo.png',
  mimetype: 'image/png',
  folder: 'avatars',
};

describe('PresignedUrlQueryDto', () => {
  it('should pass validation with a valid query', async () => {
    const dto = plainToInstance(PresignedUrlQueryDto, validQuery);

    const errors = await validate(dto);

    expect(errors.length).toBe(0);
  });

  it.each(['image/png', 'image/jpeg', 'image/webp', 'image/gif'])(
    'should accept the allowlisted mimetype %s',
    async (mimetype) => {
      const dto = plainToInstance(PresignedUrlQueryDto, {
        ...validQuery,
        mimetype,
      });

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    },
  );

  it.each(['application/pdf', 'text/html', 'application/javascript'])(
    'should reject a non-image mimetype %s',
    async (mimetype) => {
      const dto = plainToInstance(PresignedUrlQueryDto, {
        ...validQuery,
        mimetype,
      });

      const errors = await validate(dto);

      expect(errors.length).toBe(1);
      expect(errors[0].property).toBe('mimetype');
    },
  );

  it('should reject a filename containing path separators', async () => {
    const dto = plainToInstance(PresignedUrlQueryDto, {
      ...validQuery,
      filename: '../../etc/passwd',
    });

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('filename');
  });

  it('should reject an empty folder', async () => {
    const dto = plainToInstance(PresignedUrlQueryDto, {
      ...validQuery,
      folder: '',
    });

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('folder');
  });

  it('should reject a folder containing path traversal characters', async () => {
    const dto = plainToInstance(PresignedUrlQueryDto, {
      ...validQuery,
      folder: '../secrets',
    });

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('folder');
  });
});
