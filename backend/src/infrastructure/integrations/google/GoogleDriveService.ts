import { google, drive_v3, Auth } from 'googleapis';
import { PassThrough } from 'stream';

export class GoogleDriveService {
  private oauth2Client: Auth.OAuth2Client;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  getAuthUrl(userId: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/drive.readonly',
    ];
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: scopes,
      state: userId, // Passa o userId no state para saber de quem é o token no callback
    });
  }

  async getTokens(code: string) {
    const { tokens } = await this.oauth2Client.getToken(code);
    return tokens;
  }

  private getDrive(tokens: any): drive_v3.Drive {
    const client = new google.auth.OAuth2();
    client.setCredentials(tokens);
    return google.drive({ version: 'v3', auth: client });
  }

  async searchFolderByName(tokens: any, folderName: string, rootFolderId?: string): Promise<string | null> {
    const drive = this.getDrive(tokens);
    let query = `name = '${folderName.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    
    if (rootFolderId) {
      // Opcional: restringir a busca apenas aos filhos da root folder
      // Se a estrutura for muito aninhada, essa query pode não encontrar a pasta se ela estiver em sub-sub-pastas.
      // O ideal é deixar global ou usar rootFolderId dependendo da organização.
      // query += ` and '${rootFolderId}' in parents`;
    }

    const res = await drive.files.list({
      q: query,
      fields: 'files(id, name)',
      spaces: 'drive',
    });

    if (res.data.files && res.data.files.length > 0) {
      return res.data.files[0].id!;
    }
    return null;
  }

  async listImagesInFolder(tokens: any, folderId: string): Promise<drive_v3.Schema$File[]> {
    const drive = this.getDrive(tokens);
    const query = `'${folderId}' in parents and (mimeType = 'image/jpeg' or mimeType = 'image/png') and trashed = false`;

    const res = await drive.files.list({
      q: query,
      fields: 'files(id, name, mimeType)',
      spaces: 'drive',
    });

    return res.data.files || [];
  }

  async downloadImage(tokens: any, fileId: string): Promise<{ stream: PassThrough; mimeType: string }> {
    const drive = this.getDrive(tokens);
    const fileMetadata = await drive.files.get({ fileId, fields: 'mimeType' });
    
    const res = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'stream' }
    );

    const stream = new PassThrough();
    res.data.pipe(stream);

    return { 
      stream, 
      mimeType: fileMetadata.data.mimeType || 'image/jpeg' 
    };
  }
}
