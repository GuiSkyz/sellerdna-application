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
   * Search for a specific folder inside a parent folder using high-precision assertive matching
   */
  async findSubfolderByName(parentFolderId: string, folderName: string, brand?: string): Promise<string | null> {
    try {
      const response = await this.drive.files.list({
        q: `'${parentFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
        fields: 'files(id, name)',
        spaces: 'drive',
        pageSize: 1000,
      });

      const files = response.data.files;
      if (!files || files.length === 0) return null;

      let bestMatchId: string | null = null;
      let highestScore = 0;

      for (const f of files) {
        if (!f.name) continue;
        
        // Se for exato, retorna imediatamente
        if (f.name.trim().toLowerCase() === folderName.trim().toLowerCase()) {
          return f.id || null;
        }

        // Calcula a pontuação usando o algoritmo assertivo
        const { score } = this.calculateAssertiveScore(folderName, brand || '', f.name);
        
        if (score > highestScore) {
          highestScore = score;
          bestMatchId = f.id || null;
        }
      }

      // Pontuação de corte segura (80+ garantida para matches assertivos ou 75+ se não houver conflito distintivo)
      if (highestScore >= 75) {
        return bestMatchId;
      }

      return null;
    } catch (error: any) {
      console.error(`Erro ao buscar pasta '${folderName}' no Google Drive:`, error);
      throw new Error(`Erro API Google Drive: ${error.message}. Pasta Base: ${parentFolderId}. Verifique permissões.`);
    }
  }

  private normalizeString(str: string): string {
    if (!str) return '';
    const synonyms: { [key: string]: string } = {
      'lataffa': 'lattafa',
      'latafa': 'lattafa',
      'fackar': 'fakhar',
      'platinum': 'platin',
      'rabbane': 'rabanne',
      'rabane': 'rabanne',
      'araaf': 'araaf',
      'alhambra': 'alhambra',
      'vurv': 'vurv',
      'asdaaf': 'asdaaf',
      'watani': 'wataniah',
      'wataniah': 'watani',
      'leonie': 'leonie',
      'elliur': 'elliur',
      'bidaya': 'bidaya',
      'dirham': 'dirham',
      'ameerat': 'ameerat',
      'shahrazad': 'shahrazad',
      'tharwah': 'tharwah',
      'jasoor': 'jasoor'
    };

    const clean = str
      .replace(/^Perfume\s*-\s*/i, '')
      .replace(/^Perfume\s+/i, '')
      .replace(/^Kit\s*-\s*/i, '')
      .replace(/VENDIDO\s*-\s*/gi, '')
      .replace(/VENDIDO\s*/gi, '')
      .replace(/\b\d+\s*(ml|g|mg|kg|oz)\b/gi, '')
      .replace(/\(.*?\)/g, ' ')
      .replace(/[^a-zA-Z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();

    return clean.split(' ').map(w => synonyms[w] || w).join(' ');
  }

  private getDistinctiveTokens(str: string): string[] {
    const distinctiveKeywords = [
      'rose', 'rosa', 'gold', 'ouro', 'dourado', 'black', 'preto', 'platin', 'platinum', 'silver', 'prata',
      'intense', 'extrait', 'elixir', 'cherry', 'cereja', 'blue', 'azul', 'red', 'vermelho', 'yellow', 'amarelo',
      'white', 'branco', 'green', 'verde', 'leather', 'couro', 'oud', 'wood', 'floral', 'bouquet', 'tropical',
      'kobra', 'ice', 'fresh', 'sport', 'night', 'women', 'pour femme', 'pour homme', 'man', 'men', 'body cream', 'cream'
    ];

    const lower = str.toLowerCase();
    return distinctiveKeywords.filter(kw => {
      const regex = new RegExp(`\\b${kw}\\b`, 'i');
      return regex.test(lower);
    });
  }

  private calculateAssertiveScore(prodName: string, prodBrand: string, folderName: string): { score: number, reason: string } {
    const fuzz = require('fuzzball');
    
    const normProd = this.normalizeString(prodName);
    const normFolder = this.normalizeString(folderName);
    const normBrand = this.normalizeString(prodBrand || '');

    if (!normProd || !normFolder) return { score: 0, reason: 'vazio' };

    if (normProd === normFolder) {
      return { score: 100, reason: 'Match Exato Normalizado' };
    }

    const prodKeywords = this.getDistinctiveTokens(prodName);
    const folderKeywords = this.getDistinctiveTokens(folderName);

    const conflictsGroup = [
      ['rose', 'rosa', 'platin', 'platinum', 'gold', 'ouro', 'black', 'preto', 'silver', 'prata'],
      ['blue', 'azul', 'red', 'vermelho', 'yellow', 'amarelo', 'white', 'branco', 'green', 'verde'],
      ['women', 'pour femme', 'men', 'pour homme', 'man']
    ];

    for (const pk of prodKeywords) {
      for (const group of conflictsGroup) {
        if (group.includes(pk)) {
          const conflictingInFolder = group.filter(g => g !== pk && folderKeywords.includes(g));
          if (conflictingInFolder.length > 0) {
            return { score: 0, reason: `Conflito de palavra-chave distintiva (${pk} vs ${conflictingInFolder.join(', ')})` };
          }
        }
      }
    }

    let prodCleanNoBrand = normProd;
    let folderCleanNoBrand = normFolder;
    
    if (normBrand && normBrand.length > 2) {
      prodCleanNoBrand = normProd.replace(new RegExp(`\\b${normBrand}\\b`, 'gi'), '').trim();
      folderCleanNoBrand = normFolder.replace(new RegExp(`\\b${normBrand}\\b`, 'gi'), '').trim();
    }

    const baseScore = fuzz.token_set_ratio(prodCleanNoBrand, folderCleanNoBrand);
    const fullTokenScore = fuzz.token_set_ratio(normProd, normFolder);
    const score = Math.max(baseScore, fullTokenScore);

    const prodTokens = prodCleanNoBrand.split(' ').filter(w => w.length > 2);
    const folderTokens = folderCleanNoBrand.split(' ').filter(w => w.length > 2);
    
    const allProdInFolder = prodTokens.length > 0 && prodTokens.every(t => folderTokens.includes(t));
    const allFolderInProd = folderTokens.length > 0 && folderTokens.every(t => prodTokens.includes(t));

    if (allProdInFolder) {
      return { score: Math.max(score, 88), reason: 'Todos os tokens do produto estão na pasta' };
    }
    if (allFolderInProd) {
      return { score: Math.max(score, 85), reason: 'Todos os tokens da pasta estão no produto' };
    }

    return { score, reason: `Fuzzy score ${score}` };
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
