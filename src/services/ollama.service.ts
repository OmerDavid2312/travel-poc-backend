import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface OllamaOptions {
  ollamaModel?: string;
  ollamaUrl?: string;
}

@Injectable()
export class OllamaService {
  private readonly logger = new Logger(OllamaService.name);
  private ollamaModel: string;
  private ollamaUrl: string;

  constructor(options: OllamaOptions = {}) {
    this.ollamaModel = options.ollamaModel || 'llama3.2:3b';
    this.ollamaUrl = options.ollamaUrl || 'http://localhost:11434';
    
    // Check connection on initialization
    this.checkOllamaConnection();
  }

  async checkOllamaConnection(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.ollamaUrl}/api/version`);
      this.logger.log(`✅ Ollama connected! Version: ${response.data.version}`);
      await this.ensureModelExists();
      return true;
    } catch (error) {
      this.logger.error('❌ Ollama not running! Please start Ollama first.');
      this.logger.error('Run in your terminal: `ollama serve`');
      this.logger.error(`Then download the model: \`ollama pull ${this.ollamaModel}\``);
      return false;
    }
  }

  async ensureModelExists(): Promise<void> {
    try {
      const response = await axios.get(`${this.ollamaUrl}/api/tags`);
      const models = response.data.models || [];
      const hasModel = models.some(model => 
        model.name === this.ollamaModel || 
        model.name.startsWith(this.ollamaModel.split(':')[0])
      );

      if (!hasModel) {
        this.logger.log(`📥 Model ${this.ollamaModel} not found locally. Downloading...`);
        this.logger.log('This may take a few minutes for the first time.');
        await this.pullModel();
      } else {
        this.logger.log(`✅ Model ${this.ollamaModel} ready!`);
      }
    } catch (error) {
      this.logger.error('Error checking models:', error.message);
    }
  }

  async pullModel(): Promise<void> {
    try {
      await axios.post(`${this.ollamaUrl}/api/pull`, {
        name: this.ollamaModel,
        stream: false
      }, {
        timeout: 600000, // 10 minutes timeout for download
      });
      this.logger.log(`✅ Model ${this.ollamaModel} downloaded successfully!`);
    } catch (error) {
      this.logger.error(`❌ Failed to download model: ${error.message}`);
      this.logger.error('Try running manually: `ollama pull ' + this.ollamaModel + '`');
    }
  }

  async generateResponse(prompt: string): Promise<string> {
    try {
      const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
        model: this.ollamaModel,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          num_predict: 800 // Max tokens for weather responses
        }
      }, {
        timeout: 60000 // 60 seconds timeout for generation
      });

      return response.data.response.trim();
    } catch (error) {
      this.logger.error('Ollama API Error during generation:', error.message);
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Ollama not running. Please start with: `ollama serve`');
      }
      throw error;
    }
  }

  async listModels(): Promise<any[]> {
    try {
      const response = await axios.get(`${this.ollamaUrl}/api/tags`);
      return response.data.models || [];
    } catch (error) {
      this.logger.error('Error listing models:', error.message);
      return [];
    }
  }

  async switchModel(newModel: string): Promise<boolean> {
    try {
      const models = await this.listModels();
      const modelExists = models.some(model => model.name === newModel);

      if (!modelExists) {
        this.logger.error(`Model "${newModel}" not found locally`);
        return false;
      }

      this.ollamaModel = newModel;
      this.logger.log(`✅ Switched to model: ${newModel}`);
      return true;
    } catch (error) {
      this.logger.error('Could not switch model:', error.message);
      return false;
    }
  }

  getCurrentModel(): string {
    return this.ollamaModel;
  }

  getOllamaUrl(): string {
    return this.ollamaUrl;
  }
}
