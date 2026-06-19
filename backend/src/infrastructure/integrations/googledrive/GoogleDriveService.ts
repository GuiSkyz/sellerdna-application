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

      const fuzz = require('fuzzball');
      
      let bestMatchId: string | null = null;
      let highestScore = 0;

      for (const f of files) {
        if (!f.name) continue;
        
        // Se for exato, retorna imediatamente
        if (f.name.trim().toLowerCase() === folderName.trim().toLowerCase()) {
          return f.id || null;
        }

        // Calcula similaridade avançada focada em intersecção de tokens
        // Pega maravilhosamente: "Fackar Gold" vs "Lattafa Fakhar Gold"
        const score = fuzz.token_set_ratio(folderName.toLowerCase(), f.name.toLowerCase());
        
        if (score > highestScore) {
          highestScore = score;
          bestMatchId = f.id || null;
        }
      }

      // 65 é uma pontuação muito segura para token_set_ratio, evita matches falsos como Yara Moi x Ameerat Al Arab (score 43)
      if (highestScore > 65) {
        return bestMatchId;
      }

      return null;
    } catch (error: any) {
      console.error(`Erro ao buscar pasta '${folderName}' no Google Drive:`, error);
      throw new Error(`Erro API Google Drive: ${error.message}. Pasta Base: ${parentFolderId}. Verifique permissões.`);
    }
  }

  async getImagesFiles(folderId: string): Promise<Array<{ id: string, name: string, mimeType: string }>> {
    try {
      const response = await this.drive.files.list({
        q: `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`,
        fields: 'files(id, name, mimeType)',
        spaces: 'drive',
        orderBy: 'name',
      });

      const files = response.data.files;
      if (!files || files.length === 0) {
        return [];
      }

      return files as Array<{ id: string, name: string, mimeType: string }>;
    } catch (error: any) {
      console.error(`Erro ao listar imagens na pasta '${folderId}' do Google Drive:`, error);
      throw new Error(`Erro API Google Drive: ${error.message}. Pasta Produto: ${folderId}. Verifique permissões.`);
    }
  }

  /**
   * Faz o download de um arquivo do Google Drive como Buffer
   */
  async downloadFileAsBuffer(fileId: string): Promise<Buffer> {
    const response = await this.drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'arraybuffer' }
    );
    return Buffer.from(response.data as ArrayBuffer);
  }
}
