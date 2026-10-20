import { executeWithFallback, safeParseJson } from './aiRouter.js';

export interface TutorRequestParams {
  action?: 'doubt_solver' | 'create_roadmap' | 'generate_study_plan' | 'generate_short_notes' | 'important_questions' | 'smart_chat';
  query?: string;
  subjectName?: string;
  unitName?: string;
  topicName?: string;
  level?: 'beginner' | 'easy' | 'exam_oriented' | 'advanced';
  language?: 'hinglish' | 'english';
  style?: 'general' | 'step_by_step_derivation' | 'numerical' | 'programming' | 'conceptual';
  
  // Roadmap params
  topicOrUnit?: string;
  knowledgeLevel?: string;
  availableTime?: string;
  roadmapMode?: 'quick' | 'detailed';

  // Study plan params
  examDate?: string;
  unitsToCover?: string[];
  dailyHours?: number | string;
  prepLevel?: string;
  targetMarks?: string;
  completedTopics?: string[];
  isCrashPlan?: boolean;

  // Notes params
  noteFormat?: 'quick_revision' | 'detailed' | 'last_minute';

  // Important questions params
  examType?: string;
  syllabusContext?: string;

  // Chat conversation history
  history?: { role: 'user' | 'assistant'; content: string }[];
}

/**
 * Handle AI Study Chat Tutor suite actions with multi-model fallback
 */
export async function handleTutorSuiteAI(params: TutorRequestParams): Promise<{
  action: string;
  result: any;
  markdown: string;
  usedModel: string;
}> {
  const {
    action = 'smart_chat',
    query = '',
    subjectName = 'General Engineering',
    unitName = '',
    topicName = '',
    level = 'exam_oriented',
    language = 'hinglish',
    style = 'general',
    roadmapMode = 'detailed',
    noteFormat = 'detailed',
    history = [],
  } = params;

  const isHinglish = language === 'hinglish' || (query && /kaise|kya|batao|samjhao|padhu|padhe|nahi|chahiye|mein|bhai|sir/i.test(query));

  // Determine system instruction & prompt based on intent/action
  if (action === 'doubt_solver' || style === 'step_by_step_derivation' || style === 'numerical') {
    const prompt = `You are Syllora AI's Chief Academic Tutor — an expert professor and friendly mentor specialized in college & university academics (especially B.Tech, CSE, Engineering, and Science).

SUBJECT: ${subjectName}
${unitName ? `UNIT / CHAPTER: ${unitName}` : ''}
${topicName ? `SPECIFIC TOPIC: ${topicName}` : ''}
EXPLANATION LEVEL: ${level.toUpperCase()} (Beginner = simple layman analogies, Easy = clear step-by-step with simple examples, Exam-Oriented = standard university marking scheme with points and diagrams, Advanced = deep theoretical rigor, edge cases, mathematical completeness)
LANGUAGE PREFERENCE: ${isHinglish ? 'HINGLISH (A natural, engaging blend of Hindi and English, keeping technical and scientific terms in English while explaining the intuition in conversational Hindi)' : 'ENGLISH (Clear, precise, professional)'}
STYLE: ${style.toUpperCase()}

STUDENT'S DOUBT / QUESTION:
"${query || topicName || 'Explain this topic in full detail'}"

REQUIREMENTS:
1. Direct, clear explanation matching the student's selected level (${level}).
2. Provide step-by-step mathematical derivation or numerical solution if applicable (clearly show: Given, Formula Used, Step 1, Step 2, Substitution, Final Answer with Units, and Physical Meaning).
3. If programming related, provide clean code (C/C++, Java, or Python) with time/space complexity analysis and line-by-line comments.
4. Include an intuitive real-world analogy or visual ASCII diagram where useful.
5. Highlight "Exam Tip / Must-Include Keywords" so the student scores full marks in university exams.
6. Address common misconceptions or traps students make.

Format with clear Markdown headers, bold terms, code blocks, and bullet points.`;

    const aiResult = await executeWithFallback({
      contents: prompt,
      operationName: `AI Doubt Solver (${subjectName})`,
    });

    return {
      action: 'doubt_solver',
      result: { query, answer: aiResult.text },
      markdown: aiResult.text,
      usedModel: aiResult.usedModel,
    };
  }

  if (action === 'create_roadmap') {
    const isQuick = roadmapMode === 'quick';
    const prompt = `You are Syllora AI's Autonomous Learning Architect. Create a structured study roadmap for a student.

SUBJECT: ${subjectName}
UNIT / CHAPTER: ${unitName || params.topicOrUnit || 'Current Unit'}
SPECIFIC FOCUS: ${topicName || params.topicOrUnit || 'Complete Unit Mastery'}
STUDENT'S CURRENT LEVEL: ${params.knowledgeLevel || 'Beginner to Intermediate'}
AVAILABLE TIME: ${params.availableTime || '1 Week'}
ROADMAP MODE: ${isQuick ? 'QUICK ROADMAP (High-impact checklist format)' : 'DETAILED ROADMAP (Exhaustive step-by-step mastery path)'}
LANGUAGE: ${isHinglish ? 'Hinglish with English technical terms' : 'English'}

Provide a structured, beautifully formatted roadmap covering:
1. Prerequisites & Foundational Knowledge Required
2. Topic Progression Sequence (ordered by logical prerequisite dependencies)
3. Difficulty Tiering:
   - 🟢 Easy Topics (Quick Wins)
   - 🟡 Moderate Topics (Core Understanding)
   - 🔴 Difficult / High-Weightage Topics (Exam Deciders)
4. Key Formulas, Core Algorithms & Definitions to Master
5. Day-by-Day or Session-by-Session Learning Milestones
6. Targeted Practice Tasks & Hands-on Problems
7. Final Revision & Self-Assessment Checkpoints

${isQuick ? 'Keep it concise, bulleted, and ready to check off.' : 'Provide thorough milestones, estimated study times in hours/minutes, and clear learning goals.'}

Format using clean Markdown with badges (🟢, 🟡, 🔴), checkboxes (- [ ]), and clear timeline headers.`;

    const aiResult = await executeWithFallback({
      contents: prompt,
      operationName: `Study Roadmap (${subjectName})`,
    });

    return {
      action: 'create_roadmap',
      result: { roadmap: aiResult.text },
      markdown: aiResult.text,
      usedModel: aiResult.usedModel,
    };
  }

  if (action === 'generate_study_plan') {
    const prompt = `You are Syllora AI's Personal Academic Strategist. Create a realistic, highly effective Study Plan for a college student.

SUBJECT: ${subjectName}
UNITS / TOPICS TO COVER: ${params.unitsToCover ? params.unitsToCover.join(', ') : unitName || 'Full Syllabus'}
EXAM DATE / DEADLINE: ${params.examDate || 'Next 10 Days'}
DAILY STUDY HOURS AVAILABLE: ${params.dailyHours || '3 Hours / Day'}
CURRENT PREPARATION LEVEL: ${params.prepLevel || 'Intermediate'}
TARGET GOAL: ${params.targetMarks || 'Top Grade / 85%+ Marks'}
COMPLETED TOPICS: ${params.completedTopics?.length ? params.completedTopics.join(', ') : 'None yet'}
CRASH PLAN REQUESTED: ${params.isCrashPlan ? 'YES - High intensity priority triage' : 'NO - Balanced pacing'}
LANGUAGE: ${isHinglish ? 'Hinglish' : 'English'}

Generate an actionable, day-by-day study schedule with:
1. Executive Strategy Summary (High-weightage focus areas)
2. Topic-Wise Study Sessions with exact recommended minutes (e.g., 45 mins study + 10 mins active recall)
3. Dedicated Problem Solving & Numerical Practice slots
4. Daily Short Breaks & Cognitive Rest guidelines
5. End-of-Day 15-Minute Recall & Summary session
6. Weekly Mock Test & Backlog Recovery buffer day
7. Final 48-Hour Exam Sprint & Formula sheet review

Ensure the timetable is practical, balanced, and avoids burnout while guaranteeing syllabus coverage.
Format with clean Markdown tables, daily timeline headers, and clear milestones.`;

    const aiResult = await executeWithFallback({
      contents: prompt,
      operationName: `Study Plan (${subjectName})`,
    });

    return {
      action: 'generate_study_plan',
      result: { plan: aiResult.text },
      markdown: aiResult.text,
      usedModel: aiResult.usedModel,
    };
  }

  if (action === 'generate_short_notes') {
    const prompt = `You are Syllora AI's Expert Note Maker. Create ultra-high-yield, exam-oriented notes.

SUBJECT: ${subjectName}
UNIT: ${unitName || 'Core Unit'}
TOPIC: ${topicName || 'Main Concept'}
NOTE FORMAT: ${noteFormat.toUpperCase()} (Quick Revision = 1-page condensed matrix; Detailed Notes = comprehensive modular explanations; Last-Minute = essential definitions, formulas, and emergency highlights)
LANGUAGE: ${isHinglish ? 'Hinglish with English technical terms' : 'English'}

STRUCTURE REQUIREMENTS:
1. 📌 Crisp, 1-2 sentence core definitions (examiner-approved)
2. 🔑 Core Concepts & Key Principles (in tight bullet points)
3. 📐 Essential Formulas & Mathematical Relations (with symbol legends & SI units)
4. ⚡ Step-by-Step Derivation / Workflow (if applicable, with intermediate steps)
5. ⚖️ Comparison / Difference Table (Format: Feature | Concept A | Concept B)
6. 💡 Real-World Application & Engineering Context
7. 🧠 Memory Tricks, Mnemonics & Acronyms for easy recall
8. ⚠️ Common Student Pitfalls & Mistakes to Avoid in Exams
9. 🚀 One-Line Rapid Fire Revision Summary (10 golden bullets)

Make the notes visually clean, formatted with tables, ASCII boxes, and bold takeaways.`;

    const aiResult = await executeWithFallback({
      contents: prompt,
      operationName: `Short Notes (${subjectName})`,
    });

    return {
      action: 'generate_short_notes',
      result: { notes: aiResult.text },
      markdown: aiResult.text,
      usedModel: aiResult.usedModel,
    };
  }

  if (action === 'important_questions') {
    const prompt = `You are an experienced University Chief Examiner for ${subjectName}.
Generate categorized, exam-oriented questions with high-scoring model answers for:
SUBJECT: ${subjectName}
UNIT: ${unitName || 'All Units'}
TOPIC: ${topicName || 'Core Syllabus'}
EXAM TYPE: ${params.examType || 'Semester Finals'}
LANGUAGE: ${isHinglish ? 'Hinglish for explanations, English for formal question statements and technical keywords' : 'English'}

CATEGORIES TO GENERATE (with complete, high-quality model answers):
1. 🎯 Very Short Answer Questions (1 - 2 Marks, 3-4 questions)
   - Question, Suggested Marks, Ideal 2-line Answer with key terms underlined
2. 📝 Short Answer Questions (3 - 5 Marks, 2-3 questions)
   - Question, Suggested Marks, Point-by-point Model Answer, Key Diagram/Formula
3. 🏆 Long Answer / Essay Questions (6 - 10 Marks, 2 questions)
   - Question, Suggested Marks, Comprehensive Structure: Introduction, Detailed Explanation, Equation/Derivation, Applications, and "Key Points For Full Marks"
4. 📐 High-Probability Derivation or Numerical Problem (with full step-by-step solution)
5. 🔘 3 Targeted Multiple Choice Questions (with correct option and distractor explanation)
6. 🎙️ 2 Oral Viva Questions with crisp 1-sentence answers
7. 💻 1 Coding / Algorithm Question (if CSE/IT related) with clean code and explanation

NOTE: Clearly label these as AI-curated practice questions designed to cover high-yield syllabus concepts.
Format cleanly with Markdown headers and expandable/collapsible details.`;

    const aiResult = await executeWithFallback({
      contents: prompt,
      operationName: `Important Questions (${subjectName})`,
    });

    return {
      action: 'important_questions',
      result: { questions: aiResult.text },
      markdown: aiResult.text,
      usedModel: aiResult.usedModel,
    };
  }

  // Default: Smart AI Study Chat with Intent Detection & Context Awareness
  const systemInstruction = `You are StudyAI — the ultimate All-in-One AI Study Companion and Personal Academic Tutor for Syllora AI.
You assist university and college students (especially Engineering, B.Tech CSE, and Science).
You are fluent in both English and natural conversational Hinglish.

CONTEXT:
Active Subject: ${subjectName}
Active Unit: ${unitName || 'None selected'}
Active Topic: ${topicName || 'None selected'}
Level: ${level}
Language: ${isHinglish ? 'Hinglish' : 'English'}

SMART INTENT RECOGNITION RULES:
- If student asks "Unit 2 ka roadmap batao" or asks how to study a unit: Generate a structured sequence with prerequisites, easy/hard tags, and milestones.
- If student says "Kal exam hai, kya padhu?" or mentions exam tomorrow: Create an emergency 1-day sprint plan prioritizing high-yield topics, formulas, and rapid recall.
- If student asks for "Short notes" or "Summary": Generate high-yield notes with definitions, formulas, comparison tables, and mnemonics.
- If student asks for "Important questions": Provide categorized 2-mark, 5-mark, and 10-mark questions with model answers.
- If student asks "Derive" or "Derivation samjhao": Break down every derivation line by line with clear reasons for each substitution.
- If student says "Mujhe ye samajh nahi aaya" or "I don't understand": Start from simple first-principles, use a daily life analogy, and build up step-by-step.
- If student asks for code/algorithm: Provide clean, commented code with time and space complexity.

Tone: Enthusiastic, deeply knowledgeable, patient, encouraging, and razor-sharp. Use clear Markdown formatting with bold terms, bullet points, and code blocks.`;

  const chatContents: any[] = [];
  for (const h of history.slice(-8)) {
    chatContents.push({
      role: h.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: h.content }],
    });
  }

  const queryWithContext = `${query}
${unitName ? `[Context Unit: ${unitName}]` : ''}
${topicName ? `[Context Topic: ${topicName}]` : ''}
${level ? `[Context Level: ${level}]` : ''}`;

  chatContents.push({
    role: 'user',
    parts: [{ text: queryWithContext }],
  });

  const aiResult = await executeWithFallback({
    contents: chatContents,
    config: { systemInstruction },
    operationName: `AI Study Chat (${subjectName})`,
  });

  return {
    action: 'smart_chat',
    result: { reply: aiResult.text },
    markdown: aiResult.text,
    usedModel: aiResult.usedModel,
  };
}
