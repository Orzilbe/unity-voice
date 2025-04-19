//apps/web/src/services/openai.ts
import { Word, Quiz, WritingContent, ConversationContent } from '@unity-voice/types';
import cache, { CACHE_KEYS } from '../utils/cache';
import { handleOpenAIError, withRetry } from '../utils/openai-error';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Vocabulary Challenge Generation
export async function generateVocabularyChallenge(words: Word[]): Promise<Quiz> {
  const cacheKey = CACHE_KEYS.vocabularyQuiz(words);
  const cached = cache.get<Quiz>(cacheKey);
  if (cached) return cached;

  const prompt = `Create a multiple-choice quiz for the following English words. For each word, provide:
1. A question that tests understanding of the word's meaning
2. 4 options (A, B, C, D) where only one is correct
3. The correct answer

Words:
${words.map(word => `${word.word} (${word.translation})`).join('\n')}

Format the response as JSON with this structure:
{
  "questions": [
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correctAnswer": "string"
    }
  ]
}`;

  try {
    const completion = await withRetry(async () => {
      return await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });
    });

    const quiz = JSON.parse(completion.choices[0].message.content || '{}');
    const result = {
      questions: quiz.questions,
      correctAnswers: 0,
      totalQuestions: quiz.questions.length,
    };

    cache.set(cacheKey, result);
    return result;
  } catch (error) {
    throw await handleOpenAIError(error);
  }
}

// Writing Challenge Generation
export async function generateWritingPrompt(words: Word[]): Promise<WritingContent> {
  const cacheKey = CACHE_KEYS.writingPrompt(words);
  const cached = cache.get<WritingContent>(cacheKey);
  if (cached) return cached;

  const prompt = `Create a writing prompt that incorporates the following English words naturally. The prompt should:
1. Be engaging and relevant to language learning
2. Require a response of 100-150 words
3. Include context for using the words
4. Provide an example response

Words to include: ${words.map(word => word.word).join(', ')}

Format the response as JSON with this structure:
{
  "prompt": "string",
  "exampleResponse": "string"
}`;

  try {
    const completion = await withRetry(async () => {
      return await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    cache.set(cacheKey, result);
    return result;
  } catch (error) {
    throw await handleOpenAIError(error);
  }
}

// Conversation Challenge Generation
export async function generateConversationScenario(writingContext: string): Promise<ConversationContent> {
  const cacheKey = CACHE_KEYS.conversationScenario(writingContext);
  const cached = cache.get<ConversationContent>(cacheKey);
  if (cached) return cached;

  const prompt = `Create a conversation scenario based on the following writing context. The scenario should:
1. Be a natural continuation of the writing topic
2. Include 3-4 conversation turns
3. Be appropriate for English language practice
4. Include cultural context where relevant

Writing Context: ${writingContext}

Format the response as JSON with this structure:
{
  "scenario": "string",
  "context": "string"
}`;

  try {
    const completion = await withRetry(async () => {
      return await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    cache.set(cacheKey, result);
    return result;
  } catch (error) {
    throw await handleOpenAIError(error);
  }
}

// Writing Feedback Generation
export async function generateWritingFeedback(response: string): Promise<{
  spelling: number;
  grammar: number;
  content: number;
  wordUsage: number;
  overallScore: number;
  comments: string;
}> {
  const cacheKey = CACHE_KEYS.writingFeedback(response);
  const cached = cache.get<{
    spelling: number;
    grammar: number;
    content: number;
    wordUsage: number;
    overallScore: number;
    comments: string;
  }>(cacheKey);
  if (cached) return cached;

  const prompt = `Evaluate the following English writing response. Provide:
1. Spelling accuracy (0-100)
2. Grammar accuracy (0-100)
3. Content quality (0-100)
4. Word usage (0-100)
5. Overall score (0-100)
6. Detailed feedback comments

Response: ${response}

Format the response as JSON with this structure:
{
  "spelling": number,
  "grammar": number,
  "content": number,
  "wordUsage": number,
  "overallScore": number,
  "comments": "string"
}`;

  try {
    const completion = await withRetry(async () => {
      return await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    cache.set(cacheKey, result);
    return result;
  } catch (error) {
    throw await handleOpenAIError(error);
  }
}

// Conversation Feedback Generation
export async function generateConversationFeedback(messages: string[]): Promise<{
  fluency: number;
  accuracy: number;
  vocabulary: number;
  overallScore: number;
  summary: string;
}> {
  const cacheKey = CACHE_KEYS.conversationFeedback(messages);
  const cached = cache.get<{
    fluency: number;
    accuracy: number;
    vocabulary: number;
    overallScore: number;
    summary: string;
  }>(cacheKey);
  if (cached) return cached;

  const prompt = `Evaluate the following English conversation. Provide:
1. Fluency score (0-100)
2. Accuracy score (0-100)
3. Vocabulary usage score (0-100)
4. Overall score (0-100)
5. Summary of performance

Conversation:
${messages.join('\n')}

Format the response as JSON with this structure:
{
  "fluency": number,
  "accuracy": number,
  "vocabulary": number,
  "overallScore": number,
  "summary": "string"
}`;

  try {
    const completion = await withRetry(async () => {
      return await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    cache.set(cacheKey, result);
    return result;
  } catch (error) {
    throw await handleOpenAIError(error);
  }
} 