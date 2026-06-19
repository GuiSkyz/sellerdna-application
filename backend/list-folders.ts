import * as dotenv from 'dotenv';
dotenv.config();
import { GoogleDriveService } from './src/infrastructure/integrations/googledrive/GoogleDriveService';

async function run() {
  const gs = new GoogleDriveService();
  const folderId = '18sPmJsNW4-rpzPH_gyOS4BtLFwgudO92';
  
  const response = await gs['drive'].files.list({
    q: `'${folderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id, name)',
    pageSize: 1000,
  });
  
  const folders = response.data.files || [];
  console.log(`Total pastas: ${folders.length}`);
  
  for (const f of folders) {
    if (f.name && f.name.toLowerCase().includes('bling')) {
      console.log(`[FOUND BLING] -> ${f.name}`);
    }
  }
}

run();
