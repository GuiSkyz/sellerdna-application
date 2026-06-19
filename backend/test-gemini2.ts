import { GeminiService } from './src/infrastructure/integrations/gemini/GeminiService';
import * as dotenv from 'dotenv';
dotenv.config();

async function test() {
  const service = new GeminiService();
  
  console.log('Testing generateOptimizedTitle...');
  const title = await service.generateOptimizedTitle('Yara Moi', 'Lattafa', '100ml', 'Perfume');
  console.log('Title result:', title);
  
  console.log('\nTesting generateDescription...');
  const desc = await service.generateDescription({ name: 'Yara Moi', brand: 'Lattafa', productType: 'Perfume' });
  console.log('Description result:', desc);
}

test().catch(console.error);
