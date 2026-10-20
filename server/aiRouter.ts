import { GoogleGenAI } from '@google/genai';
import mammoth from 'mammoth';

// Environment variables with validated Gemini models
export const PRIMARY_MODEL = process.env.AI_PRIMARY_MODEL || 'gemini-3.5-flash-lite';
export const FALLBACK_MODEL = process.env.AI_FALLBACK_MODEL || 'gemini-flash-lite-latest';
export const SECONDARY_FALLBACK_MODEL = process.env.AI_SECONDARY_FALLBACK_MODEL || 'gemini-3.8-flash';
export const TERTIARY_FALLBACK_MODEL = process.env.AI_TERTIARY_FALLBACK_MODEL || 'gemini-3-flash-preview';

export function getConfiguredModels(preferBackup = false): string[] {
  const primary = process.env.AI_PRIMARY_MODEL || PRIMARY_MODEL;
  const fallback = process.env.AI_FALLBACK_MODEL || FALLBACK_MODEL;
  const secondary = process.env.AI_SECONDARY_FALLBACK_MODEL || SECONDARY_FALLBACK_MODEL;
  const tertiary = process.env.AI_TERTIARY_FALLBACK_MODEL || TERTIARY_FALLBACK_MODEL;

  let pool: string[];
  if (preferBackup) {
    // When requesting backup model, skip primary and start with fallback model
    pool = [fallback, secondary, tertiary, 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
  } else {
    pool = [primary, fallback, secondary, tertiary, 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
  }
  return Array.from(new Set(pool.filter(Boolean)));
}

export const CONFIGURED_MODELS = getConfiguredModels(false);

const apiKey = process.env.GEMINI_API_KEY || '';

const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Circuit breaker map: modelName -> unavailableUntil timestamp
const circuitBreaker = new Map<string, number>();
const COOLDOWN_MS = 60_000; // 60 seconds cooldown for 503-failing models
let currentHealthyModel: string | null = null;

interface ErrorAnalysis {
  isTransient: boolean;
  status: number | string;
  category: 'UNAVAILABLE' | 'RATE_LIMIT' | 'TIMEOUT' | 'BAD_REQUEST' | 'AUTH' | 'OTHER';
  message: string;
}

function analyzeError(err: any): ErrorAnalysis {
  const errMsg = (err?.message || err?.toString() || '').toLowerCase();
  const status = err?.status || err?.code || err?.statusCode || 500;

  // Check 503 / High demand / UNAVAILABLE
  if (
    status === 503 ||
    status === 'UNAVAILABLE' ||
    errMsg.includes('503') ||
    errMsg.includes('high demand') ||
    errMsg.includes('spikes in demand') ||
    errMsg.includes('unavailable') ||
    errMsg.includes('overloaded')
  ) {
    return {
      isTransient: true,
      status: 503,
      category: 'UNAVAILABLE',
      message: 'Model is temporarily experiencing high demand.',
    };
  }

  // Check 429 / Rate limit
  if (
    status === 429 ||
    status === 'RESOURCE_EXHAUSTED' ||
    errMsg.includes('429') ||
    errMsg.includes('rate limit') ||
    errMsg.includes('quota') ||
    errMsg.includes('resource_exhausted')
  ) {
    return {
      isTransient: true,
      status: 429,
      category: 'RATE_LIMIT',
      message: 'Rate limit / quota exceeded.',
    };
  }

  // Check Timeout / Network transient
  if (
    errMsg.includes('timeout') ||
    errMsg.includes('deadline exceeded') ||
    errMsg.includes('econnreset') ||
    errMsg.includes('etimedout') ||
    errMsg.includes('fetch failed') ||
    errMsg.includes('network')
  ) {
    return {
      isTransient: true,
      status: 'TIMEOUT',
      category: 'TIMEOUT',
      message: 'Network timeout connecting to AI provider.',
    };
  }

  // Permanent Auth / Bad Request errors - DO NOT RETRY
  if (
    status === 400 ||
    status === 401 ||
    status === 403 ||
    errMsg.includes('api_key_invalid') ||
    errMsg.includes('invalid api key') ||
    errMsg.includes('permission_denied')
  ) {
    return {
      isTransient: false,
      status,
      category: status === 400 ? 'BAD_REQUEST' : 'AUTH',
      message: 'Invalid API key or unauthorized request.',
    };
  }

  // Permanent Model Not Found
  if (status === 404 || errMsg.includes('not found') || errMsg.includes('unsupported model')) {
    return {
      isTransient: false,
      status: 404,
      category: 'BAD_REQUEST',
      message: 'Requested model not found or unsupported.',
    };
  }

  // Default: treat 5xx as transient, others as permanent
  const is5xx = typeof status === 'number' && status >= 500 && status < 600;
  return {
    isTransient: is5xx,
    status,
    category: 'OTHER',
    message: err?.message || 'Unexpected AI service error',
  };
}

// Sleep helper with jitter
function wait(ms: number): Promise<void> {
  const jitter = Math.floor(Math.random() * 400);
  return new Promise((resolve) => setTimeout(resolve, ms + jitter));
}

export interface AIRouteResult {
  text: string;
  usedModel: string;
  attempts: number;
  switchedToFallback: boolean;
  warnings?: string[];
}

/**
 * Execute AI generateContent with automatic retry and model fallback cascade
 */
export async function executeWithFallback(params: {
  contents: any;
  config?: any;
  timeoutMs?: number;
  operationName?: string;
  preferBackup?: boolean;
  onStatusUpdate?: (status: string) => void;
}): Promise<AIRouteResult> {
  const { contents, config, timeoutMs = 35_000, operationName = 'AI Request', preferBackup = false } = params;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server. Please check environment configuration.');
  }

  const modelPool = getConfiguredModels(preferBackup);
  const now = Date.now();
  // Filter models prioritizing ones not currently in circuit-breaker cooldown
  let candidateModels = modelPool.filter((m) => {
    const cooldown = circuitBreaker.get(m) || 0;
    return now >= cooldown;
  });

  // If a healthy model is known and not in cooldown, prioritize it so subsequent requests avoid overloaded models
  if (currentHealthyModel && candidateModels.includes(currentHealthyModel)) {
    candidateModels = [
      currentHealthyModel,
      ...candidateModels.filter((m) => m !== currentHealthyModel),
    ];
  }

  // If all models are in cooldown, reset cooldown to avoid total lockout
  if (candidateModels.length === 0) {
    console.log(`[AI Router] Resetting model cooldowns across pool.`);
    circuitBreaker.clear();
    candidateModels = [...modelPool];
  }

  const errorsLogged: string[] = [];
  let totalAttempts = 0;
  let switchedToFallback = preferBackup;

  for (let modelIndex = 0; modelIndex < candidateModels.length; modelIndex++) {
    const model = candidateModels[modelIndex];
    const isPrimary = modelIndex === 0;

    if (!isPrimary) {
      switchedToFallback = true;
      console.log(`[AI Router] (${operationName}) Cascading to backup model: ${model}`);
    }

    // For UNAVAILABLE (high demand), 1 attempt is sufficient before immediate failover.
    // For transient timeouts, allow up to 2 attempts.
    const maxRetriesForModel = 2;

    for (let attempt = 1; attempt <= maxRetriesForModel; attempt++) {
      totalAttempts++;
      const attemptStart = Date.now();

      try {
        console.log(
          `[AI Router] [${new Date().toISOString()}] ${operationName} | Model: ${model} | Attempt: ${attempt}`
        );

        // Run with timeout
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error(`AI generation timed out after ${timeoutMs}ms`)), timeoutMs);
        });

        const apiPromise = ai.models.generateContent({
          model,
          contents,
          config,
        });

        const response: any = await Promise.race([apiPromise, timeoutPromise]);
        const text = response?.text || '';

        if (!text || text.trim().length === 0) {
          throw new Error('Empty response received from AI model');
        }

        // Successfully got real response
        console.log(
          `[AI Router] SUCCESS with ${model} in ${Date.now() - attemptStart}ms`
        );

        // Clear circuit breaker for this model and mark as currently healthy
        circuitBreaker.delete(model);
        currentHealthyModel = model;

        return {
          text,
          usedModel: model,
          attempts: totalAttempts,
          switchedToFallback,
        };
      } catch (err: any) {
        const analysis = analyzeError(err);
        const duration = Date.now() - attemptStart;
        const logEntry = `[Model: ${model}, Attempt: ${attempt}, Status: ${analysis.status}, Category: ${analysis.category}, Duration: ${duration}ms, Error: ${analysis.message}]`;
        errorsLogged.push(logEntry);

        // Permanent errors: immediately fail without retrying or fallback
        if (!analysis.isTransient) {
          console.error(`[AI Router] Permanent error encountered (${analysis.status}): ${analysis.message}`);
          throw new Error(`AI configuration/request error: ${analysis.message}`);
        }

        // 503 / High Demand / UNAVAILABLE / Rate Limit:
        // Do NOT burn multiple retries on the overloaded model. Immediately set cooldown and cascade to next model!
        if (analysis.category === 'UNAVAILABLE' || analysis.category === 'RATE_LIMIT') {
          circuitBreaker.set(model, Date.now() + COOLDOWN_MS);
          if (currentHealthyModel === model) {
            currentHealthyModel = null;
          }
          console.log(
            `[AI Router] Notice: ${model} reported high demand. Instantly cascading to next fallback model...`
          );
          break; // Break inner loop immediately to try next model in candidateModels
        }

        // Transient network blip or timeout: retry once with quick backoff
        if (attempt < maxRetriesForModel) {
          const backoffDelay = 600 + Math.floor(Math.random() * 300);
          console.log(`[AI Router] Brief retry backoff (${backoffDelay}ms) for ${model}...`);
          await wait(backoffDelay);
        } else {
          console.log(`[AI Router] Retries exhausted for ${model}. Cascading to next fallback model...`);
          break;
        }
      }
    }
  }

  // If we reach here, all candidate models have failed
  console.error(`[AI Router] All models (${CONFIGURED_MODELS.join(', ')}) temporarily unavailable. Summary:`, errorsLogged);
  const error = new Error('ALL_MODELS_UNAVAILABLE');
  (error as any).status = 503;
  (error as any).details = errorsLogged;
  throw error;
}

/**
 * Clean & Extract text from DOCX files using mammoth
 */
export async function extractTextFromDocx(base64Data: string): Promise<string> {
  try {
    if (!base64Data || typeof base64Data !== 'string') {
      throw new Error("We couldn't extract text from this document. Please upload a readable DOCX or PDF.");
    }
    const buffer = Buffer.from(base64Data, 'base64');
    if (!buffer || buffer.length === 0) {
      throw new Error("We couldn't extract text from this document. Please upload a readable DOCX or PDF.");
    }

    const result = await (mammoth as any).extractRawText({ buffer });
    const text = (result?.value || '').trim();

    // Clean whitespace and normalize line breaks
    const cleaned = text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    if (!cleaned || cleaned.length < 10) {
      throw new Error("We couldn't extract text from this document. Please upload a readable DOCX or PDF.");
    }

    return cleaned;
  } catch (err: any) {
    console.error('Error extracting text from DOCX via mammoth:', err);
    throw new Error("We couldn't extract text from this document. Please upload a readable DOCX or PDF.");
  }
}

/**
 * Safe JSON parser with recovery regex
 */
export function safeParseJson<T>(rawText: string, fallback: T): T {
  try {
    let cleaned = rawText.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/i, '').replace(/\s*```$/i, '');
    }
    return JSON.parse(cleaned) as T;
  } catch (err) {
    console.warn('[AI Router] Direct JSON parse failed, attempting regex extraction...', err);
    try {
      const match = rawText.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
      if (match) {
        return JSON.parse(match[0]) as T;
      }
    } catch {
      // Fall through to fallback
    }
    return fallback;
  }
}
