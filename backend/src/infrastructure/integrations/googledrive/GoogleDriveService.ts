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

      const targetWords = folderName.toLowerCase().replace(/[^a-z0-9áéíóúâêîôûãõç]/g, ' ').split(/\s+/).filter(w => w.length > 0);
      
      let bestMatchId: string | null = null;
      let highestScore = 0;

      for (const f of files) {
        if (!f.name) continue;
        
        // Se for exato, retorna imediatamente
        if (f.name.trim().toLowerCase() === folderName.trim().toLowerCase()) {
          return f.id || null;
        }

        const folderWords = f.name.toLowerCase().replace(/[^a-z0-9áéíóúâêîôûãõç]/g, ' ').split(/\s+/).filter(w => w.length > 0);
        
        const targetSet = new Set(targetWords);
        const folderSet = new Set(folderWords);
        
        let intersection = 0;
        for (const w of folderSet) {
          if (targetSet.has(w)) intersection++;
        }
        
        // Sørensen–Dice coefficient on words
        const score = (2 * intersection) / (targetSet.size + folderSet.size);
        
        if (score > highestScore) {
          highestScore = score;
          bestMatchId = f.id || null;
        }
      }

      // Se a similaridade for maior que 40%, consideramos um match aceitável
      if (highestScore > 0.4) {
        return bestMatchId;
      }

      return null;
    } catch (error: any) {
      console.error(`Erro ao buscar pasta '${folderName}' no Google Drive:`, error);
      throw new Error(`Erro API Google Drive: ${error.message}. Pasta Base: ${parentFolderId}. Verifique permissões.`);
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
    } catch (error: any) {
      console.error(`Erro ao listar imagens na pasta '${folderId}' do Google Drive:`, error);
      throw new Error(`Erro API Google Drive: ${error.message}. Pasta Produto: ${folderId}. Verifique permissões.`);
    }
  }
}
