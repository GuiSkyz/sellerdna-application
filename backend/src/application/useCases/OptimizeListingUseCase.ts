import { GeminiService } from '../../infrastructure/integrations/gemini/GeminiService';

export class OptimizeListingUseCase {
  constructor(private aiService: GeminiService) {}

  async execute(productData: any): Promise<{ optimizedTitle: string, optimizedDescription: string }> {
    const [optimizedTitle, optimizedDescription] = await Promise.all([
      this.aiService.generateOptimizedTitle(
        productData.name, 
        productData.brand, 
        productData.sizeMl, 
        productData.perfumeType
      ),
      this.aiService.generateDescription(productData)
    ]);

    // TODO: Salvar registro de geração na tabela AI_GENERATIONS para auditoria e histórico

    return {
      optimizedTitle,
      optimizedDescription
    };
  }
}
