import { google, drive_v3 } from 'googleapis';

export class GoogleDriveService {
  private drive: drive_v3.Drive;

  constructor() {
    // Auth using Service Account from environment variables
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });

    this.drive = google.drive({ version: 'v3', auth });
  }

  /**
   * Search for a specific folder inside a parent folder
   */
  async findSubfolderByName(parentFolderId: string, folderName: string): Promise<string | null> {
    try {
      const response = await this.drive.files.list({
        q: `'${parentFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
        fields: 'files(id, name)',
        spaces: 'drive',
        pageSize: 1000,
      });

      const files = response.data.files;
      if (!files || files.length === 0) return null;

      const target = folderName.trim().toLowerCase();
      
      const matchedFolder = files.find(f => {
        if (!f.name) return false;
        return f.name.trim().toLowerCase() === target;
      });

      return matchedFolder?.id || null;
    } catch (error) {
      console.error(`Erro ao buscar pasta '${folderName}' no Google Drive:`, error);
      throw new Error(`Não foi possível acessar a pasta base do Google Drive. Verifique se ela foi compartilhada corretamente com o email de serviço.`);
    }
  }

  /**
   * Get all images inside a folder and return their direct download URLs
   */
  async getImagesInFolder(folderId: string): Promise<string[]> {
    try {
      const response = await this.drive.files.list({
        q: `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`,
        fields: 'files(id, name)',
        spaces: 'drive',
        orderBy: 'name',
      });

      const files = response.data.files;
      if (!files || files.length === 0) {
        return [];
      }

      // Convert to direct download URLs
      return files.map(file => `https://drive.google.com/uc?export=download&id=${file.id}`);
    } catch (error) {
      console.error(`Erro ao listar imagens na pasta '${folderId}' do Google Drive:`, error);
      throw new Error('Falha ao obter imagens do Google Drive.');
    }
  }
}
