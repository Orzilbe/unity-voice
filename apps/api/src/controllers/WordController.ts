
// apps/api/src/controllers/WordController.ts
import { Request, Response } from 'express';
import { openai } from '../services/openai';
import { WordGenerationParams, WordGenerationError } from '../models/Word';

export class WordController {
  private openai: openai;

  constructor(openai: openai) {
    this.openai = openai;
  }

  async generateWords(req: Request, res: Response) {
    try {
      const params: WordGenerationParams = {
        topic: req.body.topic,
        languageLevel: req.body.languageLevel,
        count: req.body.count || 5,
        excludeWords: req.body.excludeWords,
        learningObjectives: req.body.learningObjectives
      };

      this.validateParams(params);

      const result = await this.openai.generateWords(params);
      res.json(result);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private validateParams(params: WordGenerationParams) {
    if (!params.topic) {
      throw new Error('Topic is required');
    }

    if (!params.languageLevel) {
      throw new Error('Language level is required');
    }

    if (!['beginner', 'intermediate', 'advanced'].includes(params.languageLevel)) {
      throw new Error('Invalid language level');
    }

    if (params.count < 1 || params.count > 10) {
      throw new Error('Word count must be between 1 and 10');
    }
  }

  private handleError(error: any, res: Response) {
    console.error('Word generation error:', error);

    if (error instanceof Error) {
      res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: error.message
      });
      return;
    }

    const openAIError = error as WordGenerationError;
    res.status(500).json({
      code: openAIError.code || 'INTERNAL_SERVER_ERROR',
      message: openAIError.message || 'An error occurred during word generation'
    });
  }
} 