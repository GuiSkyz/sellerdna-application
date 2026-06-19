import { OptimizeListingUseCase } from './src/application/useCases/OptimizeListingUseCase';
import { GeminiService } from './src/infrastructure/integrations/gemini/GeminiService';
import * as dotenv from 'dotenv';
dotenv.config();

async function test() {
  const aiService = new GeminiService();
  const useCase = new OptimizeListingUseCase(aiService);
  try {
    const result = await useCase.execute({
      name: 'Perfume Rasasi Hawas Kobra',
      brand: 'Rasasi',
      sizeMl: '100ml',
      productType: 'Perfume'
    });
    console.log('SUCESSO:', result);
  } catch(err) {
    console.error('ERRO:', err);
  }
}
test();
