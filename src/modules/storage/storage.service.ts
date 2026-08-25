import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ServiceException } from '../../common/exception-filter/serviceException';
import { errorMessages } from '../../common/enums/errorMessages';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly supabase: SupabaseClient;
  private readonly bucket: string;

  constructor(private configService: ConfigService) {
    // Service-role key: server-side only. It bypasses row level security and
    // must never be handed to a browser.
    this.supabase = createClient(
      this.configService.get<string>('SUPABASE_URL'),
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY'),
      { auth: { persistSession: false } },
    );
    this.bucket = this.configService.get<string>('SUPABASE_STORAGE_BUCKET');
  }

  /**
   * Mints a short-lived upload URL so bytes go straight from the browser to
   * storage and never through this API.
   *
   * Note: unlike the S3 presigned PUT this replaces, the content type is not
   * bound at signing time — the client sets it on the upload request.
   */
  async generatePresignedUrl(folder: string, filename: string) {
    const key = `${folder}/${filename}`;

    const { data, error } = await this.supabase.storage
      .from(this.bucket)
      .createSignedUploadUrl(key);

    if (error) {
      this.logger.error(`Could not sign upload for ${key}: ${error.message}`);
      throw new ServiceException(errorMessages.UPLOAD_URL_FAILED, 502, error);
    }

    const {
      data: { publicUrl },
    } = this.supabase.storage.from(this.bucket).getPublicUrl(key);

    // Response shape kept identical to the S3 implementation so any client
    // written against the old endpoint keeps working.
    return {
      uploadUrl: data.signedUrl,
      key,
      fileUrl: publicUrl,
    };
  }
}
