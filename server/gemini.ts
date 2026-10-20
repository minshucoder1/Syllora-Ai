import {
  executeWithFallback,
  extractTextFromDocx,
  safeParseJson,
  CONFIGURED_MODELS,
} from './aiRouter.js';

export { CONFIGURED_MODELS };

export async function analyzeSyllabusAI(
  arg1: string | { syllabusText?: string; fileData?: { base64: string; mimeType: string; fileName?: string }; preferBackup?: boolean },
  arg2?: { base64: string; mimeType: string; fileName?: string },
  arg3?: { preferBackup?: boolean }
) {
  let syllabusText = '';
  let fileData: { base64: string; mimeType: string; fileName?: string } | undefined;
  let preferBackup = false;

  if (typeof arg1 === 'object' && arg1 !== null) {
    syllabusText = arg1.syllabusText || '';
    fileData = arg1.fileData || arg2;
    preferBackup = !!arg1.preferBackup || !!arg3?.preferBackup;
  } else {
    syllabusText = (arg1 as string) || '';
    fileData = arg2;
    preferBackup = !!arg3?.preferBackup;
  }

  let cleanedText = (syllabusText || '').trim();
  const inlineParts: any[] = [];

  // REAL DOCX & FILE TEXT EXTRACTION
  if (fileData && fileData.base64) {
    const fileName = (fileData.fileName || '').toLowerCase();
    const mimeType = (fileData.mimeType || '').toLowerCase();

    const isDocx =
      fileName.endsWith('.docx') ||
      mimeType.includes('wordprocessingml') ||
      mimeType.includes('docx') ||
      mimeType.includes('officedocument.word') ||
      (fileName.endsWith('.doc') && !mimeType.includes('pdf'));

    const isTxt =
      fileName.endsWith('.txt') ||
      mimeType.includes('text/plain') ||
      mimeType.includes('text/markdown') ||
      fileName.endsWith('.md');

    if (isDocx) {
      console.log(`[Syllabus Pipeline] Detected DOCX file (${fileData.fileName || 'document.docx'}). Extracting raw text via mammoth...`);
      const docxText = await extractTextFromDocx(fileData.base64);
      cleanedText = cleanedText ? `${cleanedText}\n\n${docxText}` : docxText;
      console.log(`[Syllabus Pipeline] Successfully extracted ${docxText.length} characters of clean text from DOCX.`);
    } else if (isTxt) {
      console.log(`[Syllabus Pipeline] Detected plain text file. Decoding UTF-8...`);
      const txtContent = Buffer.from(fileData.base64, 'base64').toString('utf-8');
      cleanedText = cleanedText ? `${cleanedText}\n\n${txtContent}` : txtContent;
    } else {
      // PDF or Image: pass natively via Gemini inlineData multimodal support
      console.log(`[Syllabus Pipeline] Passing multimodal document (${fileData.mimeType}) directly to Gemini.`);
      inlineParts.push({
        inlineData: {
          data: fileData.base64,
          mimeType: fileData.mimeType || 'application/pdf',
        },
      });
    }
  }

  if (!cleanedText && inlineParts.length === 0) {
    throw new Error("We couldn't extract text from this document. Please upload a readable DOCX or PDF.");
  }

  const prompt = `You are StudyAI's Lead Academic Curriculum Analyzer.
Analyze the following university syllabus in extreme detail.
Extract:
1. "subjectName": The official subject title (e.g., "Basic Mathematics", "Data Structures & Algorithms").
2. "subjectCode": Official course/subject code if found (e.g., "MATH101", "CS201"), or null.
3. "description": Academic summary of the syllabus scope, core objectives, and university prerequisites.
4. "units": Array of Units/Modules. For every Unit, identify:
   - "name": The Unit title (e.g., "Unit 1: Matrices & Differential Calculus").
   - "weightage": Estimated percentage marks weightage (integer, e.g., 20).
   - "topics": Array of discrete topics and subtopics:
     - "name": Topic Name (e.g., "Rank of a Matrix").
     - "description": Brief 1-line concept scope.
     - "priority": AUTOMATICALLY CLASSIFY into: "very_important" (🔥 Very Important), "important" (⭐ Important), "moderate" (🟡 Moderate), or "low" (⚪ Low Priority).
     - "priorityReason": Realistic academic justification based on prerequisite value, typical marks weightage, and standard university question frequency.
5. "importantTopics": Array of top exam priority topics with high probability of appearing in semester exams.
6. "keyConcepts": Array of foundational concepts and definitions essential for passing.
7. "examOrientedPriorities": Summary of high-yield units and scoring strategies for university examinations.
8. "formulasAndNumericals": Array of relevant formulas, equations, or numerical problem types if the subject contains mathematical, statistical, or quantitative content; or empty array if purely qualitative.

Return STRICT JSON matching this schema:
{
  "subjectName": "string",
  "subjectCode": "string or null",
  "description": "string",
  "units": [
    {
      "name": "string",
      "weightage": 20,
      "topics": [
        {
          "name": "string",
          "description": "string",
          "priority": "very_important" | "important" | "moderate" | "low",
          "priorityReason": "string"
        }
      ]
    }
  ],
  "importantTopics": ["string"],
  "keyConcepts": ["string"],
  "examOrientedPriorities": "string",
  "formulasAndNumericals": ["string"]
}

Syllabus Content:
${cleanedText || 'Please read and extract all details from the attached syllabus document.'}`;

  const contents: any[] = [...inlineParts, prompt];

  const aiResult = await executeWithFallback({
    contents,
    config: {
      responseMimeType: 'application/json',
      systemInstruction: 'You are an elite university professor and syllabus evaluator. Return valid structured JSON only.',
    },
    operationName: 'Syllabus Analysis',
    preferBackup,
  });

  const parsed = safeParseJson<any>(aiResult.text, null);
  if (!parsed || !parsed.subjectName || !Array.isArray(parsed.units)) {
    console.error('Invalid syllabus structure returned from AI:', aiResult.text);
    throw new Error('AI returned an invalid syllabus structure. Please try again.');
  }

  // Normalize units and topics
  parsed.units = parsed.units.map((u: any, uIdx: number) => ({
    name: u.name || `Unit ${uIdx + 1}`,
    weightage: Number(u.weightage) || 20,
    topics: Array.isArray(u.topics)
      ? u.topics.map((t: any, tIdx: number) => ({
          name: typeof t === 'string' ? t : t.name || `Topic ${tIdx + 1}`,
          description: t.description || '',
          priority: ['very_important', 'important', 'moderate', 'low'].includes(t.priority)
            ? t.priority
            : 'important',
          priorityReason: t.priorityReason || 'Core university syllabus topic',
        }))
      : [],
  }));

  if (!Array.isArray(parsed.importantTopics)) {
    parsed.importantTopics = [];
  }
  if (!Array.isArray(parsed.keyConcepts)) {
    parsed.keyConcepts = [];
  }
  if (!Array.isArray(parsed.formulasAndNumericals)) {
    parsed.formulasAndNumericals = [];
  }

  return {
    ...parsed,
    extractedText: cleanedText,
    _meta: {
      usedModel: aiResult.usedModel,
      attempts: aiResult.attempts,
      switchedToFallback: aiResult.switchedToFallback,
    },
  };
}

export async function generateNotesAI(params: {
  subjectName: string;
  unitName: string;
  topicName: string;
  language?: string;
  length?: string;
  examType?: string;
}) {
  const { subjectName, unitName, topicName, language = 'English', length = 'Detailed', examType = 'University Exam' } = params;

  const prompt = `Generate comprehensive, exam-ready university study notes for the following topic:
Subject: ${subjectName}
Unit: ${unitName}
Topic: ${topicName}
Target Exam: ${examType}
Notes Length: ${length}
Language: ${language} (If Hindi or Hinglish, explain in natural, engaging Hinglish/Hindi while keeping technical terms accurate)

Structure the notes with academic rigor:
1. Definition (Clear, textbook definition)
2. Introduction (Origin, context, purpose)
3. Key Concepts (Array of 3 to 6 essential points)
4. Explanation (Deep, thorough, step-by-step breakdown)
5. Real-Life Example (Relatable real-world application)
6. Formula (Formula if applicable, else empty string)
7. Algorithm (Pseudocode/procedure if applicable, else empty string)
8. Complexity (Time and Space complexity if applicable, else empty string)
9. Applications (Array of 3-5 real uses)
10. Advantages (Array of 3-4 benefits)
11. Limitations (Array of 2-3 trade-offs)
12. Exam Points (Key phrases and high-scoring highlights)
13. Quick Revision (A punchy 3-line memory hook)
14. DiagramSvgOrAscii (A clean ASCII diagram or ASCII table illustrating the concept)

Return STRICT JSON:
{
  "definition": "string",
  "introduction": "string",
  "keyConcepts": ["string"],
  "explanation": "string",
  "realLifeExample": "string",
  "formula": "string",
  "algorithm": "string",
  "complexity": "string",
  "applications": ["string"],
  "advantages": ["string"],
  "limitations": ["string"],
  "examPoints": ["string"],
  "quickRevision": "string",
  "diagramSvgOrAscii": "string"
}`;

  const aiResult = await executeWithFallback({
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      systemInstruction: 'You are an authoritative engineering and science professor producing top-grade university exam notes.',
    },
    operationName: `Notes Generation (${topicName})`,
  });

  const parsed = safeParseJson<any>(aiResult.text, null);
  if (!parsed) {
    throw new Error('Failed to generate structured notes. Please retry.');
  }
  return parsed;
}

export async function explainDifferentlyAI(params: {
  topicName: string;
  currentExplanation: string;
  mode: 'normal' | 'simple' | 'eli5' | 'real_life' | 'exam' | 'hinglish';
}) {
  const { topicName, currentExplanation, mode } = params;

  const styleGuide = {
    normal: 'Standard academic and balanced textbook explanation.',
    simple: 'Beginner-friendly, jargon-free explanation with gentle pacing.',
    eli5: 'Explain Like I\'m 5. Use simple analogies, toys, playground or kitchen metaphors that anyone can visualize instantly.',
    real_life: 'Anchor the concept entirely in modern real-world engineering or daily technology.',
    exam: 'Focus strictly on university exam scoring: definitions, keywords to underline, standard diagrams, marks breakdown, and high-scoring format.',
    hinglish: 'Explain warmly in conversational Hindi + English (Hinglish), keeping technical keywords intact.',
  }[mode] || 'Clear explanation';

  const prompt = `Topic: "${topicName}"
Existing context: "${currentExplanation.slice(0, 1000)}"

Task: Regenerate ONLY the explanation for this topic using mode: "${mode}".
Style instruction: ${styleGuide}
Keep facts accurate, impactful, and easy to memorize.

Return STRICT JSON:
{
  "mode": "${mode}",
  "explanation": "string",
  "summaryTip": "string"
}`;

  const aiResult = await executeWithFallback({
    contents: prompt,
    config: { responseMimeType: 'application/json' },
    operationName: `Explain Differently (${mode})`,
  });

  const parsed = safeParseJson<any>(aiResult.text, null);
  if (!parsed) {
    throw new Error('Failed to generate alternative explanation.');
  }
  return parsed;
}

export async function generateTopicQuestionsBatchAI(params: {
  subjectName: string;
  unitName: string;
  topicName: string;
  category: '2_marks' | '5_marks' | '10_marks' | 'all';
  batchNumber?: number;
  existingQuestions?: string[];
  difficultyFilter?: string;
  previousPaperContext?: string;
}) {
  const {
    subjectName,
    unitName,
    topicName,
    category = 'all',
    batchNumber = 1,
    existingQuestions = [],
    difficultyFilter = 'Mixed',
    previousPaperContext = '',
  } = params;

  const marksDirective = {
    '2_marks': `Generate EXACTLY 10 questions for 2 MARKS.
- Focus strictly on: precise textbook definitions, very short answers, core concept distinctions, terminology, properties, and short conceptual principles.
- Answer length requirement: Concise, highly accurate 2 to 5 bullet points with key phrases underlined.`,
    '5_marks': `Generate EXACTLY 10 questions for 5 MARKS.
- Focus strictly on: conceptual explanations, short derivations, working principles, algorithm steps, comparisons, working examples, and diagrams where applicable.
- Answer length requirement: Moderate explanation including introduction, structured 4-6 points, algorithm/steps or example, and concluding exam highlight.`,
    '10_marks': `Generate EXACTLY 10 questions for 10 MARKS.
- Focus strictly on: in-depth university semester exam questions, complete theoretical breakdowns, full derivations, detailed algorithms with complexity, design problems, applications, comparisons, and architecture diagrams.
- Answer length requirement: Comprehensive exam-ready answer with clear section headings, detailed algorithmic pseudocode/derivations, real-world examples, and high-scoring exam points.`,
    'all': `Generate EXACTLY 10 university examination questions distributed across marks:
- 4 questions of 2 Marks
- 3 questions of 5 Marks
- 3 questions of 10 Marks
- Follow the corresponding answer length requirements for each mark allocation.`,
  }[category];

  const historyPrompt =
    existingQuestions.length > 0
      ? `\nIMPORTANT: The following ${existingQuestions.length} questions were already generated in previous batches for this topic. You MUST NOT repeat them or produce slightly reworded copies of them. Generate 10 completely NEW and distinct questions covering different angles, edge cases, sub-concepts, or scenarios of the topic:
${existingQuestions.slice(-30).map((q, i) => `${i + 1}. ${q}`).join('\n')}\n`
      : '';

  const pyqDirective = previousPaperContext
    ? `\nPrevious-Year Exam Trends for this subject: ${previousPaperContext}\nIncorporate these recurring exam styles and depth expectations without copying verbatim.\n`
    : '';

  const prompt = `You are StudyAI's Senior University Examination Paper Setter.
Target Subject: ${subjectName}
Unit / Module: ${unitName}
Target Topic: ${topicName} (GENERATE QUESTIONS FOR THIS SPECIFIC TOPIC ONLY - DO NOT MIX OTHER TOPICS)
Batch Number: ${batchNumber} (Questions ${(batchNumber - 1) * 10 + 1} to ${batchNumber * 10})
Requested Category: ${category}
Difficulty Preference: ${difficultyFilter}

${marksDirective}
${historyPrompt}
${pyqDirective}

CRITICAL RULES:
1. Provide EXACTLY 10 questions in the array. Never less than 10, never more than 10.
2. Ground all questions directly in the topic "${topicName}".
3. Assign each question:
   - "marks": 2, 5, or 10 matching the requested category
   - "difficulty": "Easy", "Medium", or "Hard"
   - "type": "Definition" | "Conceptual" | "Derivation" | "Algorithm" | "Difference" | "Design" | "Application"
   - "priority": "🔥 Very Important" | "⭐ Important" | "🟡 Moderate" | "⚪ Normal"
   - "importanceBadge": "🔥 Repeated" | "⭐ High Probability" | "🟡 Standard"
   - "frequencyIndicator": e.g. "Asked 3 times in past exams" | "Appeared in recent semester papers" | "Frequent 2-mark question" | "Standard university question"
   - "markingScheme": Detailed point distribution, e.g. "1 Mark: Definition & Key Term | 1 Mark: Clear Diagram/Example" or "2 Marks: Architecture, 2 Marks: Algorithm, 1 Mark: Time Complexity"
   - "stepByStep": Array of 3 to 5 concise steps or structure points to achieve full marks
   - "commonMistakes": The most frequent student mistake or omission to avoid
4. For "answer": Provide an authentic, high-scoring university examination answer strictly calibrated to the marks. Never output placeholders.

Return STRICT JSON:
{
  "questions": [
    {
      "question": "string",
      "marks": 2 | 5 | 10,
      "difficulty": "Easy" | "Medium" | "Hard",
      "priority": "🔥 Very Important" | "⭐ Important" | "🟡 Moderate" | "⚪ Normal",
      "importanceBadge": "🔥 Repeated" | "⭐ High Probability" | "🟡 Standard",
      "frequencyIndicator": "string",
      "type": "string",
      "answer": "string",
      "stepByStep": ["string"],
      "markingScheme": "string",
      "commonMistakes": "string"
    }
  ]
}`;

  const aiResult = await executeWithFallback({
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      systemInstruction: 'You are an elite university professor composing authentic 10-question batches for university semester exams.',
    },
    operationName: `Topic Questions Generation (${topicName} - Batch ${batchNumber})`,
  });

  const parsed = safeParseJson<any>(aiResult.text, { questions: [] });
  return parsed.questions || [];
}

export async function generateTopicNumericalsBatchAI(params: {
  subjectName: string;
  unitName: string;
  topicName: string;
  batchNumber?: number;
  existingQuestions?: string[];
  previousPaperContext?: string;
}) {
  const {
    subjectName,
    unitName,
    topicName,
    batchNumber = 1,
    existingQuestions = [],
    previousPaperContext = '',
  } = params;

  const historyPrompt =
    existingQuestions.length > 0
      ? `\nThe following questions have already been generated in previous batches. Do NOT repeat them, do not repeat the exact numerical values or question patterns:
${existingQuestions.slice(-30).map((q, i) => `${i + 1}. ${q}`).join('\n')}\n`
      : '';

  const prompt = `You are StudyAI's Numerical & Problem-Solving Specialist.
Subject: ${subjectName}
Unit: ${unitName}
Topic: "${topicName}"
Batch Number: ${batchNumber}

TASK:
1. First, evaluate if "${topicName}" in "${subjectName}" is a quantitative, mathematical, computational, algorithmic, or design topic where numerical/problem-solving questions are ACTUALLY appropriate and tested in university exams.
   (Examples of applicable topics: Matrices, Calculus, Recurrence Relations, Time/Space calculations, Array indexing addresses, Memory address calculations, Infix/Postfix evaluation traces, Hash table collision calculations, Tree heights/rotations, Graph shortest path calculations, K-maps, Boolean minimization, Circuit timing/delays, Network subnetting/throughput, etc.)
   If the topic is purely theoretical or descriptive (e.g. Software Engineering Ethics, Introduction to Computers, History of Operating Systems, Legal/Social aspects), set "isApplicable": false. DO NOT force irrelevant numericals.

2. If "isApplicable": true:
   Generate EXACTLY 10 NUMERICAL PROBLEMS.
   Strictly distribute the 10 questions across difficulty:
   - Question 1 to 3: Easy (Straightforward application of formula/rules)
   - Question 4 to 7: Medium (Multi-step calculation or intermediate derivation)
   - Question 8 to 10: Hard (Comprehensive university examination level, edge cases, combined concepts)
   The difficulty must progressively increase from 1 to 10.

3. Each numerical problem MUST follow this structured format:
   - "question": Clear, realistic problem statement with specific numeric values
   - "marks": 5 or 10 marks
   - "difficulty": "Easy" (for Q1-3), "Medium" (for Q4-7), "Hard" (for Q8-10)
   - "priority": "🔥 Very Important" | "⭐ Important" | "🟡 Moderate" | "⚪ Normal"
   - "importanceBadge": "🔥 Repeated" | "⭐ High Probability" | "🟡 Standard"
   - "frequencyIndicator": e.g. "Asked 3 times in past exams" | "Standard numerical problem" | "Core exam derivation/calculation"
   - "markingScheme": Point allotment, e.g. "2 Marks: Formula & Given data, 2 Marks: Step execution, 1 Mark: Unit & Final Answer"
   - "commonMistakes": The most frequent calculation or unit error students make
   - "given": Given input values with proper units
   - "required": What needs to be computed/determined
   - "formula": Standard mathematical/engineering formula used
   - "booleanEquation": String (ONLY if relevant to topic like Digital Electronics, else null)
   - "truthTable": String (ONLY if relevant to topic, else null)
   - "kMap": String (ONLY if relevant to topic, else null)
   - "steps": Array of step-by-step mathematical calculations
   - "finalAnswer": Clear final boxed answer with proper scientific/computational units
   - "verification": Sanity check or verification calculation
   - "diagramAscii": ASCII diagram/table if helpful, else null
${historyPrompt}

Return STRICT JSON:
{
  "isApplicable": true,
  "message": "string",
  "numericals": [
    {
      "question": "string",
      "marks": 5 | 10,
      "difficulty": "Easy" | "Medium" | "Hard",
      "priority": "🔥 Very Important" | "⭐ Important" | "🟡 Moderate" | "⚪ Normal",
      "importanceBadge": "🔥 Repeated" | "⭐ High Probability" | "🟡 Standard",
      "frequencyIndicator": "string",
      "markingScheme": "string",
      "commonMistakes": "string",
      "given": "string",
      "required": "string",
      "formula": "string",
      "booleanEquation": "string or null",
      "truthTable": "string or null",
      "kMap": "string or null",
      "steps": ["Step 1: ...", "Step 2: ..."],
      "finalAnswer": "string",
      "verification": "string",
      "diagramAscii": "string or null"
    }
  ]
}`;

  const aiResult = await executeWithFallback({
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      systemInstruction: 'You are an expert engineering mathematics and computer science problem examiner.',
    },
    operationName: `Topic Numericals Batch (${topicName} - Batch ${batchNumber})`,
  });

  const parsed = safeParseJson<any>(aiResult.text, { isApplicable: false, numericals: [] });
  return parsed;
}

// Backward compatible aliases
export async function generateQuestionsAI(params: {
  subjectName: string;
  topicName: string;
}) {
  return generateTopicQuestionsBatchAI({
    subjectName: params.subjectName,
    unitName: 'Core Unit',
    topicName: params.topicName,
    category: 'all',
    batchNumber: 1,
  });
}

export async function generateNumericalsAI(params: {
  subjectName: string;
  topicName: string;
}) {
  const result = await generateTopicNumericalsBatchAI({
    subjectName: params.subjectName,
    unitName: 'Core Unit',
    topicName: params.topicName,
    batchNumber: 1,
  });
  return result.numericals || [];
}

export async function generateMCQsAI(params: {
  subjectName: string;
  topicName: string;
  count?: number;
  difficulty?: string;
}) {
  const { subjectName, topicName, count = 10, difficulty = 'Mixed' } = params;

  const prompt = `Generate ${count} university/competitive exam quality Multiple Choice Questions (MCQs) for:
Subject: ${subjectName}
Topic: ${topicName}
Difficulty preference: ${difficulty}

Each question must have 4 distinct options (A, B, C, D), exactly one correct answer, and an in-depth explanation describing why the correct option is right and why common distractors are wrong.

Return STRICT JSON:
{
  "mcqs": [
    {
      "question": "string",
      "optionA": "string",
      "optionB": "string",
      "optionC": "string",
      "optionD": "string",
      "correctAnswer": "A" | "B" | "C" | "D",
      "explanation": "string",
      "difficulty": "Easy" | "Medium" | "Hard"
    }
  ]
}`;

  const aiResult = await executeWithFallback({
    contents: prompt,
    config: { responseMimeType: 'application/json' },
    operationName: `MCQs Generation (${topicName})`,
  });

  const parsed = safeParseJson<any>(aiResult.text, { mcqs: [] });
  return parsed.mcqs || [];
}

export async function generateFlashcardsAI(params: {
  subjectName: string;
  topicName: string;
  count?: number;
}) {
  const { subjectName, topicName, count = 8 } = params;

  const prompt = `Generate ${count} active-recall flashcards for:
Subject: ${subjectName}
Topic: ${topicName}

Front: High-yield question, formula trigger, or scenario.
Back: Crisp, memorable, bullet-pointed answer.
Key Takeaway: 1-line golden rule.

Return STRICT JSON:
{
  "flashcards": [
    {
      "front": "string",
      "back": "string",
      "keyTakeaway": "string",
      "difficulty": "easy" | "medium" | "hard"
    }
  ]
}`;

  const aiResult = await executeWithFallback({
    contents: prompt,
    config: { responseMimeType: 'application/json' },
    operationName: `Flashcards Generation (${topicName})`,
  });

  const parsed = safeParseJson<any>(aiResult.text, { flashcards: [] });
  return parsed.flashcards || [];
}

export async function generateMindMapAI(params: {
  subjectName: string;
  topicOrUnitName: string;
}) {
  const { subjectName, topicOrUnitName } = params;

  const prompt = `Construct an educational visual mind map hierarchy for:
Subject: ${subjectName}
Focus Unit / Topic: ${topicOrUnitName}

The mind map should be a 3 to 4 level deep tree containing key concepts, operations, algorithms, properties, and applications.
Return STRICT JSON:
{
  "root": {
    "id": "node-1",
    "label": "${topicOrUnitName}",
    "category": "core",
    "description": "Root Concept",
    "children": [
      {
        "id": "node-1-1",
        "label": "Sub-concept",
        "category": "branch",
        "description": "Short explanation",
        "children": [
          {
            "id": "node-1-1-1",
            "label": "Detail / Technique",
            "category": "leaf",
            "description": "Key point"
          }
        ]
      }
    ]
  }
}`;

  const aiResult = await executeWithFallback({
    contents: prompt,
    config: { responseMimeType: 'application/json' },
    operationName: `Mind Map (${topicOrUnitName})`,
  });

  const parsed = safeParseJson<any>(aiResult.text, null);
  if (!parsed || !parsed.root) {
    throw new Error('Failed to generate mind map structure.');
  }
  return parsed.root;
}

export async function generateCheatSheetAI(params: {
  subjectName: string;
  unitName: string;
}) {
  const { subjectName, unitName } = params;

  const prompt = `Create a highly compressed "One-Page Pre-Exam Cheat Sheet" for:
Subject: ${subjectName}
Unit: ${unitName}

Must include:
1. Core Definitions (5-7 most tested definitions in 1-2 lines each)
2. Formulas & Equations (name, formula, quick note)
3. Key Differences Table (e.g. Stack vs Queue, BFS vs DFS)
4. Critical Algorithms & Complexities (Best, Average, Worst)
5. Golden Exam Highlights & Pitfalls to avoid

Return STRICT JSON:
{
  "title": "${unitName} - Cheat Sheet",
  "definitions": [
    { "term": "string", "definition": "string" }
  ],
  "formulas": [
    { "name": "string", "formula": "string", "note": "string" }
  ],
  "keyDifferences": [
    { "aspect": "Feature", "itemA": "X", "itemB": "Y" }
  ],
  "keyPoints": [
    "string"
  ],
  "algorithms": [
    { "name": "string", "summary": "string", "complexity": "string" }
  ]
}`;

  const aiResult = await executeWithFallback({
    contents: prompt,
    config: { responseMimeType: 'application/json' },
    operationName: `Cheat Sheet (${unitName})`,
  });

  const parsed = safeParseJson<any>(aiResult.text, null);
  if (!parsed) {
    throw new Error('Failed to generate cheat sheet.');
  }
  return parsed;
}

export async function analyzePreviousPaperAI(params: {
  subjectName: string;
  paperText: string;
  fileData?: { base64: string; mimeType: string; fileName?: string };
}) {
  const { subjectName, paperText, fileData } = params;
  let cleanedText = (paperText || '').trim();
  const inlineParts: any[] = [];

  if (fileData) {
    const isDocx =
      fileData.mimeType.includes('wordprocessingml') ||
      fileData.mimeType.includes('docx') ||
      (fileData.fileName && fileData.fileName.toLowerCase().endsWith('.docx'));

    if (isDocx) {
      const docxText = await extractTextFromDocx(fileData.base64);
      cleanedText = cleanedText ? `${cleanedText}\n\n${docxText}` : docxText;
    } else if (fileData.mimeType.includes('text/plain')) {
      const txt = Buffer.from(fileData.base64, 'base64').toString('utf-8');
      cleanedText = cleanedText ? `${cleanedText}\n\n${txt}` : txt;
    } else {
      inlineParts.push({
        inlineData: {
          data: fileData.base64,
          mimeType: fileData.mimeType,
        },
      });
    }
  }

  const prompt = `You are StudyAI's Previous-Year Question Paper Analyzer.
Analyze the provided previous-year university exam paper(s) for the subject: "${subjectName}".

Extract and calculate:
1. Unit-Wise Weightage:
   List each unit with percentage weightage (e.g. Unit 1: 18%, Unit 2: 27% 🔥, etc.) and mark if it is hot (isHot: true).
2. Frequently Asked Questions:
   Exact or recurring questions with marks, estimated frequency, and priority.
3. Frequently Asked Topics:
   Topics recurring across exams, why they are favorite examiners' topics.
4. Question Pattern & Section Structure:
   Breakdown of Section A, Section B, Section C, choice types.
5. Difficulty Trend & Overall Pattern Analysis.
6. Key Recommendations for students preparing for upcoming exams.

Return STRICT JSON:
{
  "unitWeightages": [
    { "unitName": "string", "percentage": 25, "isHot": true }
  ],
  "frequentlyAskedQuestions": [
    { "question": "string", "marks": 10, "frequency": 4, "priority": "🔥 High Priority" }
  ],
  "frequentlyAskedTopics": [
    { "topic": "string", "frequency": 5, "priority": "🔥 Very High", "reason": "string" }
  ],
  "questionPatterns": [
    { "section": "Section A", "pattern": "string", "marks": 20 }
  ],
  "difficultyTrend": "string",
  "keyRecommendations": [
    "string recommendation"
  ]
}

Paper content:
${cleanedText || 'See attached paper document.'}`;

  const contents = [...inlineParts, prompt];

  const aiResult = await executeWithFallback({
    contents,
    config: {
      responseMimeType: 'application/json',
      systemInstruction: 'You are an expert exam paper analytics engine. Identify genuine syllabus patterns and weightages.',
    },
    operationName: `Previous Paper Analysis (${subjectName})`,
  });

  const parsed = safeParseJson<any>(aiResult.text, null);
  if (!parsed) {
    throw new Error('Failed to analyze question paper. Please verify file content and retry.');
  }
  return parsed;
}

export async function predictExamAI(params: {
  subjectName: string;
  syllabusUnits: any[];
  previousPaperData?: any;
}) {
  const { subjectName, syllabusUnits, previousPaperData } = params;

  const prompt = `You are StudyAI's AI Exam Predictor.
Subject: ${subjectName}
Syllabus Units: ${JSON.stringify(syllabusUnits.map((u: any) => ({ name: u.name, topics: u.topics?.map((t: any) => t.name) })))}
Previous Paper Context: ${previousPaperData ? JSON.stringify(previousPaperData) : 'Standard university marks distribution'}

Synthesize the data and predict:
1. High-Priority Topics: Expected probability (percentage), clear academic rationale.
2. Likely Question Types & Expected Marks: Specific predicted questions with expected marks and confidence level.
3. Critical Concepts that must be mastered first.
4. Revision Priorities & Strategic Preparation Path.

IMPORTANT: You must keep predictions grounded in the confirmed syllabus.

Return STRICT JSON:
{
  "highPriorityTopics": [
    { "topic": "string", "probability": 88, "rationale": "string", "priority": "🔥 Very High" }
  ],
  "likelyQuestionTypes": [
    { "question": "string", "expectedMarks": 10, "topic": "string", "confidence": "92%" }
  ],
  "criticalConcepts": [
    "string"
  ],
  "revisionStrategy": [
    "string"
  ]
}`;

  const aiResult = await executeWithFallback({
    contents: prompt,
    config: { responseMimeType: 'application/json' },
    operationName: `Exam Prediction (${subjectName})`,
  });

  const parsed = safeParseJson<any>(aiResult.text, null);
  if (!parsed) {
    throw new Error('Failed to generate exam prediction.');
  }
  return parsed;
}

export async function generateQuestionPaperAI(params: {
  subjectName: string;
  units: string[];
  totalMarks: number;
  durationMinutes: number;
  difficulty: string;
  patternDetails?: string;
}) {
  const { subjectName, units, totalMarks, durationMinutes, difficulty, patternDetails } = params;

  const prompt = `Generate a complete university examination question paper:
Subject: ${subjectName}
Syllabus Units Covered: ${units.join(', ')}
Total Marks: ${totalMarks}
Duration: ${durationMinutes} Minutes (${durationMinutes / 60} Hours)
Difficulty Level: ${difficulty}
Section / Pattern Specifications: ${patternDetails || 'Section A (Short 2M), Section B (Medium 5M), Section C (Long 10M)'}

Structure the paper professionally into standard Sections with precise question numbers, sub-marks, and internal choices ("OR" option) matching total marks exactly.

Return STRICT JSON:
{
  "title": "${subjectName} - End Semester Examination",
  "totalMarks": ${totalMarks},
  "durationMinutes": ${durationMinutes},
  "difficulty": "${difficulty}",
  "sections": [
    {
      "sectionName": "Section A",
      "instructions": "Answer all questions. Each carries 2 marks.",
      "totalMarks": 20,
      "questions": [
        {
          "questionNumber": "Q1 (a)",
          "text": "string",
          "marks": 2,
          "topic": "string"
        }
      ]
    }
  ]
}`;

  const aiResult = await executeWithFallback({
    contents: prompt,
    config: { responseMimeType: 'application/json' },
    operationName: `Question Paper Generation (${subjectName})`,
  });

  const parsed = safeParseJson<any>(aiResult.text, null);
  if (!parsed) {
    throw new Error('Failed to generate question paper.');
  }
  return parsed;
}

export async function evaluateAnswerAI(params: {
  subjectName: string;
  topicName: string;
  question: string;
  totalMarks: number;
  userAnswer: string;
}) {
  const { subjectName, topicName, question, totalMarks, userAnswer } = params;

  const prompt = `You are a strict, constructive university professor evaluating a student's exam answer.
Subject: ${subjectName}
Topic: ${topicName}
Question: "${question}"
Max Marks: ${totalMarks}

Student's Submitted Answer:
"""${userAnswer}"""

Evaluate with rigor on 4 parameters:
1. Concept (out of 10)
2. Technical Accuracy (out of 10)
3. Completeness (out of 10)
4. Presentation & Structure (out of 10)

Calculate Estimated Score (out of ${totalMarks}).

Identify:
- Missing Points
- Mistakes
- What You Did Well
- How To Improve
- Improved Exam Answer (A model 10/10 exam response with headings and key points highlighted)

Return STRICT JSON:
{
  "estimatedScore": 7,
  "totalMarks": ${totalMarks},
  "rubric": {
    "concept": 8,
    "accuracy": 8,
    "completeness": 6,
    "presentation": 7
  },
  "missingPoints": ["string"],
  "mistakes": ["string"],
  "whatYouDidWell": ["string"],
  "howToImprove": ["string"],
  "improvedAnswer": "string"
}`;

  const aiResult = await executeWithFallback({
    contents: prompt,
    config: { responseMimeType: 'application/json' },
    operationName: `Answer Evaluation (${question.slice(0, 30)})`,
  });

  const parsed = safeParseJson<any>(aiResult.text, null);
  if (!parsed) {
    throw new Error('Unable to evaluate answer. Please try again.');
  }
  return parsed;
}

export async function lastMinuteRevisionAI(params: {
  subjectName: string;
  timeAvailable: string;
  units: any[];
}) {
  const { subjectName, timeAvailable, units } = params;

  const prompt = `CRITICAL EXAM TOMORROW 🚨 MODE.
Subject: ${subjectName}
Time Available: ${timeAvailable}
Syllabus: ${JSON.stringify(units.map((u: any) => ({ name: u.name, topics: u.topics?.map((t: any) => t.name) })))}

Create an emergency sprint revision pack optimized down to the minute:
1. Timed emergency revision schedule (e.g. "00:00 - 00:25: 🔥 Unit 2 — Stack", "00:25 - 00:50: ...")
2. Must-Revise Topics (Top 4 most critical topics)
3. Important Definitions (5 super quick definitions)
4. Key Formulas / Equations (3 essential formulas)
5. Core Algorithms / Logic (2 crucial workflows)
6. 5 Rapid Fire MCQs (High probability questions with answers)
7. Final 3-Question Mini Mock Test (with model answers)

Return STRICT JSON:
{
  "timeSchedule": [
    { "timeSlot": "string", "title": "string", "activity": "string" }
  ],
  "mustReviseTopics": [
    { "topic": "string", "reason": "string" }
  ],
  "quickDefinitions": [
    { "term": "string", "definition": "string" }
  ],
  "keyFormulas": [
    { "name": "string", "formula": "string" }
  ],
  "coreAlgorithms": [
    { "name": "string", "summary": "string" }
  ],
  "rapidMCQs": [
    { "question": "string", "answer": "string", "explanation": "string" }
  ],
  "miniMockTest": [
    { "question": "string", "marks": 5, "modelAnswer": "string" }
  ]
}`;

  const aiResult = await executeWithFallback({
    contents: prompt,
    config: { responseMimeType: 'application/json' },
    operationName: `Last Minute Revision (${subjectName})`,
  });

  const parsed = safeParseJson<any>(aiResult.text, null);
  if (!parsed) {
    throw new Error('Failed to generate emergency revision plan.');
  }
  return parsed;
}

export async function studyChatAI(params: {
  message: string;
  subjectContext?: string;
  syllabusContext?: string;
  history?: { role: 'user' | 'assistant'; content: string }[];
}) {
  const { message, subjectContext, syllabusContext, history = [] } = params;

  const systemPrompt = `You are StudyAI, an intelligent, energetic, and highly articulate university study tutor.
Subject Context: ${subjectContext || 'General Engineering and Science'}
Syllabus Context: ${syllabusContext || 'College Curriculum'}

Guidelines:
- Answer student doubts clearly with step-by-step logic.
- If asked in Hinglish, respond naturally in Hinglish while keeping technical terms intact.
- If asked for exam answers (e.g. 5 marks or 10 marks), format them cleanly with headers and bullet points.
- Provide practical analogies, examples, and pseudocode where helpful.
- Keep the tone encouraging, academic, and sharp.`;

  const chatContents: any[] = [];
  for (const h of history.slice(-6)) {
    chatContents.push({
      role: h.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: h.content }],
    });
  }
  chatContents.push({
    role: 'user',
    parts: [{ text: message }],
  });

  const aiResult = await executeWithFallback({
    contents: chatContents,
    config: { systemInstruction: systemPrompt },
    operationName: 'Study Chat',
  });

  return aiResult.text || 'I could not generate an answer. Please try again.';
}

export async function evaluateVoiceVivaAI(params: {
  question: string;
  spokenAnswer: string;
  expectedConcept: string;
}) {
  const { question, spokenAnswer, expectedConcept } = params;

  const prompt = `You are conducting an interactive university oral viva exam.
Question Asked: "${question}"
Core Concept Expected: "${expectedConcept}"
Student's Spoken Answer: "${spokenAnswer}"

Evaluate their verbal response:
1. Is it correct? (true/false)
2. Score out of 10
3. Completeness check
4. Missing concepts (what crucial terms or details were left out)
5. Clarity / delivery feedback
6. Follow-up viva question for the next turn

Return STRICT JSON:
{
  "isCorrect": boolean,
  "score": number,
  "feedback": "string",
  "missingConcepts": ["string"],
  "improvedVivaAnswer": "string",
  "nextFollowUpQuestion": "string"
}`;

  const aiResult = await executeWithFallback({
    contents: prompt,
    config: { responseMimeType: 'application/json' },
    operationName: `Voice Viva Evaluation`,
  });

  const parsed = safeParseJson<any>(aiResult.text, null);
  if (!parsed) {
    throw new Error('Failed to evaluate viva answer.');
  }
  return parsed;
}

export async function generateVivaQuestionsAI(params: {
  subjectName: string;
  units?: string[];
  count?: number;
  course?: string;
}) {
  const { subjectName, units = [], count = 10, course = 'University Course' } = params;

  const prompt = `You are a Senior University Oral Examination (Viva Voce) Board Examiner for ${course}.
Generate ${count} authentic, high-yield Viva Voce questions for:
Subject: ${subjectName}
Syllabus Units Covered: ${units.length > 0 ? units.join(', ') : 'All Core Syllabus Units'}

Requirements for every Viva Question:
1. Focus on core conceptual understanding, practical intuition, subtle edge-cases, common pitfalls, and real-world engineering/scientific rationale.
2. "question": Sharp, crisp oral examination question an external examiner asks.
3. "answer": Concise model verbal answer (3-5 sentences) with key technical terminology that scores full marks.
4. "followUp": The immediate follow-up probe the examiner throws when the student answers correctly.
5. "commonMisconception": The typical blunder or wrong intuition unprepared students give.
6. "topic": The associated syllabus unit or topic.

Return STRICT JSON:
{
  "vivaQuestions": [
    {
      "question": "string",
      "answer": "string",
      "followUp": "string",
      "commonMisconception": "string",
      "topic": "string"
    }
  ]
}`;

  const aiResult = await executeWithFallback({
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      systemInstruction: 'You are an elite university oral viva examiner. Return authentic oral examination Q&A in valid JSON.',
    },
    operationName: `Viva Questions (${subjectName})`,
  });

  const parsed = safeParseJson<any>(aiResult.text, { vivaQuestions: [] });
  return parsed.vivaQuestions || [];
}

export async function codingLabDebugAI(params: {
  language: string;
  problem: string;
  userCode: string;
  errorOrIssue?: string;
}) {
  const { language, problem, userCode, errorOrIssue } = params;

  const prompt = `You are StudyAI's CSE Coding Lab Specialist.
Language: ${language}
Problem Statement: ${problem}
User Submitted Code:
\`\`\`${language.toLowerCase()}
${userCode}
\`\`\`
Issue reported: ${errorOrIssue || 'Analyze for bugs, edge cases, time/space complexity'}

Analyze the code and return:
1. Is it bug-free?
2. Line-by-line identification of bugs, memory leaks, or syntax errors
3. Corrected optimal code
4. Time & Space Complexity analysis
5. Detailed explanation of the logic and edge cases

Return STRICT JSON:
{
  "isCorrect": boolean,
  "bugs": [
    { "line": "number or description", "issue": "string", "fix": "string" }
  ],
  "correctedCode": "string",
  "timeComplexity": "string",
  "spaceComplexity": "string",
  "explanation": "string"
}`;

  const aiResult = await executeWithFallback({
    contents: prompt,
    config: { responseMimeType: 'application/json' },
    operationName: `Coding Lab Debug (${language})`,
  });

  const parsed = safeParseJson<any>(aiResult.text, null);
  if (!parsed) {
    throw new Error('Failed to debug code.');
  }
  return parsed;
}

export async function generateStudyRoadmapAI(params: {
  subjectName: string;
  targetScope: 'complete_subject' | 'selected_units' | 'selected_topics' | 'specific_topic';
  selectedUnits?: string[];
  selectedTopics: string[];
  syllabusContext?: string;
  examDate: string;
  dailyStudyMinutes: number;
  currentLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  preferredLanguage: 'English' | 'Hindi' | 'Hinglish';
  performanceData?: {
    weakTopics: string[];
    strongTopics: string[];
    completedTopics: string[];
    recentScores: { topic: string; score: number; type: string }[];
    totalQuestionsSolved: number;
    mcqAccuracy?: number;
    answerCheckerScores?: { topic: string; score: number }[];
  };
}) {
  const {
    subjectName,
    targetScope,
    selectedUnits = [],
    selectedTopics = [],
    syllabusContext = '',
    examDate,
    dailyStudyMinutes,
    currentLevel,
    preferredLanguage,
    performanceData,
  } = params;

  const now = new Date();
  const exam = new Date(examDate);
  const diffDays = Math.max(1, Math.ceil((exam.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  // Number of days in roadmap: minimum 3 days, maximum 21 days for realistic milestone planning
  const targetDaysCount = Math.min(Math.max(3, diffDays), 21);

  const perfDescription = performanceData && (performanceData.weakTopics.length > 0 || performanceData.strongTopics.length > 0 || performanceData.recentScores.length > 0)
    ? `REAL USER PERFORMANCE DATA:
- Weak Topics identified: ${performanceData.weakTopics.length ? performanceData.weakTopics.join(', ') : 'None flagged so far'}
- Strong Topics identified: ${performanceData.strongTopics.length ? performanceData.strongTopics.join(', ') : 'None recorded yet'}
- Completed Topics: ${performanceData.completedTopics.length ? performanceData.completedTopics.join(', ') : 'None'}
- Total Questions Solved: ${performanceData.totalQuestionsSolved}
- Average MCQ Accuracy: ${performanceData.mcqAccuracy !== undefined ? `${performanceData.mcqAccuracy}%` : 'No MCQ data yet'}
- Recent Test / Answer Checker Scores: ${JSON.stringify(performanceData.recentScores || [])}`
    : `NO PAST TEST DATA: This is the user's initial baseline assessment. Do not invent fake previous test results or false past percentages. Structure the roadmap starting with foundational concepts according to the student's selected level (${currentLevel}).`;

  const prompt = `You are StudyAI's Master Academic Strategy & Learning Roadmap Architect.
Design a highly rigorous, structured, day-by-day AI Study Roadmap.

PARAMETERS:
- Subject / Goal: "${subjectName}"
- Target Scope: "${targetScope}"
- Selected Units: ${selectedUnits.length ? selectedUnits.join(', ') : 'All applicable units'}
- Selected Topics to master: ${selectedTopics.length ? selectedTopics.join(', ') : 'Comprehensive subject syllabus'}
- Additional Syllabus Context: ${syllabusContext ? syllabusContext.slice(0, 1500) : 'Standard university curriculum'}
- Target Exam Date: ${examDate} (${diffDays} days remaining until exam)
- Target Roadmap Days to generate: exactly ${targetDaysCount} days
- Available Study Time per Day: ${dailyStudyMinutes} minutes (${(dailyStudyMinutes / 60).toFixed(1)} hours/day)
- Student Proficiency Level: ${currentLevel}
- Preferred Explanation/Content Language: ${preferredLanguage}

${perfDescription}

STRICT ARCHITECTURAL REQUIREMENTS:
1. ORDERED ROADMAP & PREREQUISITES:
   - Order days from fundamental concepts -> core mechanisms -> numerical/problem-solving -> multi-concept synthesis -> full mock exam & speed revision.
   - For every topic, prioritize according to:
     * Exam importance / weightage
     * Previous frequency and prerequisite dependency
     * Student weakness (if weak, schedule earlier with reinforced drills)
     * Priority MUST be one of: "🔥 Very High", "⭐ High", "🟡 Medium", "⚪ Low".
   - DISCLAIMER: Do NOT claim any topic is guaranteed to appear in exams.

2. DAILY STUDY BUDGET & TIME SPLIT:
   - For EACH day, the sum of task durations MUST strictly match or be within 5-10 minutes of the requested ${dailyStudyMinutes} minutes.
   - For each day, include balanced pedagogical tasks:
     * "learn": Conceptual breakdown & understanding
     * "practice": 10 Important / numerical questions
     * "mcq": MCQ speed drills (e.g., 10-20 MCQs)
     * "revision": Flashcards / cheat sheet active recall
     * "quiz" or "mock": Mini-quiz or mock paper evaluation
   - Task actionType must be strictly one of: "learn", "questions", "mcq", "flashcards", "answer-checker".

3. REAL ANALYSIS SUMMARY:
   - Provide "analyzedTopicCount", "weakTopics", "strongTopics", "estimatedDaysNeeded", "recommendedDailyMinutes", "criticalDependencies", and a truthful "performanceSummary" based strictly on the provided data without hallucinating fake test history.

Return STRICT JSON format:
{
  "analysis": {
    "analyzedTopicCount": number,
    "weakTopics": ["string"],
    "strongTopics": ["string"],
    "estimatedDaysNeeded": number,
    "recommendedDailyMinutes": number,
    "difficultyBreakdown": { "easy": number, "medium": number, "hard": number },
    "criticalDependencies": ["string"],
    "performanceSummary": "string",
    "examReadinessScore": number
  },
  "days": [
    {
      "dayNumber": 1,
      "date": "YYYY-MM-DD",
      "studyDurationFormatted": "${(dailyStudyMinutes / 60).toFixed(1)} Hours",
      "summary": "1-line milestone objective for the day",
      "topics": [
        {
          "topicName": "string",
          "unitName": "string or undefined",
          "priority": "🔥 Very High" | "⭐ High" | "🟡 Medium" | "⚪ Low",
          "difficulty": "Easy" | "Medium" | "Hard",
          "durationMinutes": number,
          "completed": false
        }
      ],
      "tasks": [
        {
          "id": "task_1_1",
          "type": "learn" | "practice" | "mcq" | "revision" | "quiz" | "mock",
          "title": "e.g. Learn: Topic Name — 35 min",
          "description": "Specific focus and actionable instruction",
          "targetTopic": "Topic Name",
          "durationMinutes": 35,
          "completed": false,
          "actionType": "learn" | "questions" | "mcq" | "flashcards" | "answer-checker"
        }
      ],
      "completed": false
    }
  ]
}`;

  const aiResult = await executeWithFallback({
    contents: prompt,
    config: { responseMimeType: 'application/json' },
    operationName: `AI Study Roadmap (${subjectName})`,
  });

  const parsed = safeParseJson<any>(aiResult.text, null);
  if (!parsed || !Array.isArray(parsed.days)) {
    throw new Error('Failed to generate study roadmap from AI.');
  }

  // Format dates consecutively starting tomorrow or today
  const startDate = new Date();
  parsed.days.forEach((day: any, idx: number) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + idx);
    day.date = d.toISOString().split('T')[0];
    day.completed = false;
    if (Array.isArray(day.topics)) {
      day.topics.forEach((t: any) => {
        t.completed = false;
      });
    }
    if (Array.isArray(day.tasks)) {
      day.tasks.forEach((t: any, tIdx: number) => {
        t.id = `task_d${day.dayNumber}_${tIdx + 1}_${Math.random().toString(36).substring(7)}`;
        t.completed = false;
      });
    }
  });

  return parsed;
}

export async function adaptStudyRoadmapAI(params: {
  currentRoadmap: any;
  latestPerformance: {
    topicName: string;
    scorePercent: number;
    assessmentType: string;
    weakPoints?: string[];
  };
}) {
  const { currentRoadmap, latestPerformance } = params;

  const prompt = `You are StudyAI's Adaptive Roadmap Controller.
The user just completed a test or evaluation with the following outcome:
- Topic Tested: "${latestPerformance.topicName}"
- Score Achieved: ${latestPerformance.scorePercent}%
- Assessment Type: "${latestPerformance.assessmentType}"
- Weak Points identified: ${latestPerformance.weakPoints?.length ? latestPerformance.weakPoints.join('; ') : 'General concept gaps'}

Current Roadmap Summary:
- Subject: "${currentRoadmap.subjectName}"
- Daily Study Time: ${currentRoadmap.dailyStudyMinutes} min
- Days: ${currentRoadmap.days.length} days

ADAPTATION RULES:
1. IF SCORE < 65% (Weakness detected):
   - Immediately inject targeted remediation into upcoming incomplete days:
     * Add "Revise ${latestPerformance.topicName}"
     * Add "Practice 10 targeted questions for ${latestPerformance.topicName}"
     * Add "Solve numericals / proofs for ${latestPerformance.topicName}"
     * Add "Take mini-quiz on ${latestPerformance.topicName}"
   - Re-prioritize "${latestPerformance.topicName}" to "🔥 Very High".
   - Slightly rebalance other less critical tasks so the daily minute budget stays respected.

2. IF SCORE >= 80% (Mastery / Strength detected):
   - Accelerate pace: reduce repetitive revision for "${latestPerformance.topicName}".
   - Elevate to higher-order questions (edge cases, tricky university questions) or unlock subsequent advanced topics earlier.

Return the modified roadmap JSON with:
{
  "adaptationSummary": "Clear 2-sentence explanation of how the roadmap adapted to the student's ${latestPerformance.scorePercent}% score in ${latestPerformance.topicName}",
  "weakTopics": ["updated array of weak topics"],
  "strongTopics": ["updated array of strong topics"],
  "days": [/* complete updated days array keeping completed status intact */]
}`;

  const aiResult = await executeWithFallback({
    contents: prompt,
    config: { responseMimeType: 'application/json' },
    operationName: `Roadmap Adaptation (${latestPerformance.topicName})`,
  });

  const parsed = safeParseJson<any>(aiResult.text, null);
  if (!parsed || !Array.isArray(parsed.days)) {
    throw new Error('Failed to adapt study roadmap.');
  }

  return parsed;
}
