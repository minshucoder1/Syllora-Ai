import fs from 'fs';
import path from 'path';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  passwordSalt?: string;
  googleId?: string;
  college?: string;
  course?: string;
  branch?: string;
  year?: string;
  semester?: string;
  preferredLanguage?: 'English' | 'Hindi' | 'Hinglish';
  phoneCountryCode?: string; // e.g. "+91"
  phoneNumber?: string;      // e.g. "9876543210"
  phone?: string;            // Normalized international: e.g. "+919876543210"
  examDate?: string;
  avatar?: string;
  xp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  activeDates: string[]; // ['2026-10-07', ...]
  createdAt: string;
  privacyShareStats: boolean;
  emailVerified?: boolean;
  verificationCode?: string;
  verificationExpiresAt?: number;
  resetToken?: string;
  resetExpiresAt?: number;
  lastVerificationSentAt?: number;
}

export interface SessionRecord {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: number;
  rememberMe: boolean;
}

export interface Topic {
  id: string;
  unitId: string;
  subjectId: string;
  name: string;
  description?: string;
  priority?: 'very_important' | 'important' | 'moderate' | 'low';
  priorityReason?: string;
  completed: boolean;
  score?: number; // accuracy percentage
  attempts?: number;
  lastAccessed?: string;
  orderNumber: number;
}

export interface Unit {
  id: string;
  subjectId: string;
  name: string;
  weightage?: number; // e.g. 25%
  topics: Topic[];
  orderNumber: number;
}

export interface Subject {
  id: string;
  userId: string;
  name: string;
  code?: string;
  description?: string;
  examDate?: string;
  rawSyllabusText?: string;
  syllabusText?: string;
  syllabusFileName?: string;
  syllabusFilePath?: string;
  syllabusFileType?: string;
  analysisStatus?: 'pending' | 'analyzing' | 'completed' | 'failed';
  course?: string;
  semester?: string;
  createdAt: string;
  updatedAt?: string;
  units: Unit[];
  archived?: boolean;
  archivedAt?: string;
  uploadedFileName?: string;
  uploadedFilePath?: string;
}

export interface Note {
  id: string;
  topicId: string;
  subjectId: string;
  title: string;
  definition: string;
  introduction: string;
  keyConcepts: string[];
  explanation: string;
  realLifeExample?: string;
  formula?: string;
  algorithm?: string;
  complexity?: string;
  applications: string[];
  advantages: string[];
  limitations: string[];
  examPoints: string[];
  quickRevision: string;
  diagramSvgOrAscii?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  id: string;
  topicId: string;
  unitId?: string;
  subjectId: string;
  topicName?: string;
  unitName?: string;
  batchNumber?: number;
  questionNumber?: number;
  question: string;
  answer: string;
  marks: 2 | 5 | 10 | number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  priority: '🔥 Very Important' | '⭐ Important' | '🟡 Moderate' | '⚪ Normal';
  importanceBadge?: '🔥 Repeated' | '⭐ High Probability' | '🟡 Standard' | string;
  frequencyIndicator?: string;
  stepByStep?: string[];
  markingScheme?: string;
  commonMistakes?: string;
  type: string;
  category?: '2_marks' | '5_marks' | '10_marks' | 'numerical' | 'general';
  isNumerical?: boolean;
  given?: string;
  required?: string;
  formula?: string;
  booleanEquation?: string;
  truthTable?: string;
  kMap?: string;
  steps?: string[];
  finalAnswer?: string;
  verification?: string;
  diagramAscii?: string;
  saved?: boolean;
  createdAt?: string;
}

export interface MCQ {
  id: string;
  topicId: string;
  subjectId: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface Flashcard {
  id: string;
  topicId: string;
  subjectId: string;
  front: string;
  back: string;
  keyTakeaway: string;
  learned: boolean;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface MindMapNode {
  id: string;
  label: string;
  category?: string;
  description?: string;
  children?: MindMapNode[];
}

export interface MindMapData {
  id: string;
  subjectId: string;
  topicOrUnitName: string;
  root: MindMapNode;
  createdAt: string;
}

export interface CheatSheet {
  id: string;
  subjectId: string;
  unitId?: string;
  title: string;
  definitions: { term: string; definition: string }[];
  formulas: { name: string; formula: string; note: string }[];
  keyDifferences: { aspect: string; itemA: string; itemB: string }[];
  keyPoints: string[];
  algorithms: { name: string; summary: string; complexity: string }[];
  createdAt: string;
}

export interface VivaQuestionItem {
  id: string;
  subjectId: string;
  topic?: string;
  question: string;
  answer: string;
  followUp?: string;
  commonMisconception?: string;
  createdAt: string;
}

export interface StudyPlanItem {
  id: string;
  userId: string;
  subjectId: string;
  date: string;
  timeSlot?: string;
  title: string;
  topics: string[];
  durationMinutes: number;
  priority: '🔥 High' | '⭐ Medium' | 'Normal';
  completed: boolean;
}

export interface PreviousPaperAnalysis {
  id: string;
  userId: string;
  subjectId: string;
  fileName: string;
  analyzedAt: string;
  unitWeightages: { unitName: string; percentage: number; isHot: boolean }[];
  frequentlyAskedQuestions: { question: string; marks: number; frequency: number; priority: string }[];
  frequentlyAskedTopics: { topic: string; frequency: number; priority: string; reason: string }[];
  questionPatterns: { section: string; pattern: string; marks: number }[];
  difficultyTrend: string;
  keyRecommendations: string[];
}

export interface ExamPredictionData {
  id: string;
  subjectId: string;
  predictedAt: string;
  highPriorityTopics: { topic: string; probability: number; rationale: string; priority: string }[];
  likelyQuestionTypes: { question: string; expectedMarks: number; topic: string; confidence: string }[];
  criticalConcepts: string[];
  revisionStrategy: string[];
}

export interface QuestionPaperGenerated {
  id: string;
  subjectId: string;
  title: string;
  totalMarks: number;
  durationMinutes: number;
  difficulty: string;
  sections: {
    sectionName: string;
    instructions: string;
    totalMarks: number;
    questions: {
      questionNumber: string;
      text: string;
      marks: number;
      orOption?: string;
      topic?: string;
    }[];
  }[];
  generatedAt: string;
}

export interface AnswerEvaluation {
  id: string;
  userId: string;
  subjectId: string;
  topicName: string;
  question: string;
  totalMarks: number;
  userAnswer: string;
  estimatedScore: number;
  rubric: {
    concept: number;
    accuracy: number;
    completeness: number;
    presentation: number;
  };
  missingPoints: string[];
  mistakes: string[];
  whatYouDidWell: string[];
  howToImprove: string[];
  improvedAnswer: string;
  evaluatedAt: string;
}

export interface StudySession {
  id: string;
  userId: string;
  subjectId?: string;
  topicName?: string;
  durationMinutes: number;
  completedAt: string;
}

export interface Achievement {
  id: string;
  key: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string;
}

export interface StudyGroup {
  id: string;
  name: string;
  subjectName: string;
  inviteCode: string;
  createdById: string;
  members: {
    userId: string;
    userName: string;
    topicsCount: number;
    quizAccuracy: number;
    streak: number;
    joinedAt: string;
  }[];
  discussions: {
    id: string;
    userId: string;
    userName: string;
    message: string;
    createdAt: string;
  }[];
}

export interface RoadmapTopicItem {
  topicName: string;
  unitName?: string;
  priority: '🔥 Very High' | '⭐ High' | '🟡 Medium' | '⚪ Low';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  durationMinutes: number;
  completed: boolean;
}

export interface RoadmapTaskItem {
  id: string;
  type: 'learn' | 'practice' | 'mcq' | 'revision' | 'quiz' | 'mock';
  title: string;
  description: string;
  targetTopic: string;
  durationMinutes: number;
  completed: boolean;
  actionType: 'learn' | 'questions' | 'mcq' | 'flashcards' | 'answer-checker';
}

export interface RoadmapDailyPlan {
  dayNumber: number;
  date: string;
  studyDurationFormatted: string;
  summary: string;
  topics: RoadmapTopicItem[];
  tasks: RoadmapTaskItem[];
  completed: boolean;
}

export interface RoadmapAnalysis {
  analyzedTopicCount: number;
  weakTopics: string[];
  strongTopics: string[];
  estimatedDaysNeeded: number;
  recommendedDailyMinutes: number;
  difficultyBreakdown: { easy: number; medium: number; hard: number };
  criticalDependencies: string[];
  performanceSummary: string;
  examReadinessScore: number;
}

export interface StudyRoadmap {
  id: string;
  userId: string;
  subjectId?: string;
  subjectName: string;
  targetScope: 'complete_subject' | 'selected_units' | 'selected_topics' | 'specific_topic';
  selectedUnits?: string[];
  selectedTopics: string[];
  examDate: string;
  dailyStudyMinutes: number;
  currentLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  preferredLanguage: 'English' | 'Hindi' | 'Hinglish';
  analysis: RoadmapAnalysis;
  days: RoadmapDailyPlan[];
  overallProgress: number;
  adaptationHistory?: { date: string; trigger: string; modificationSummary: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface CodingProblem {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  language: 'C' | 'C++' | 'Java' | 'Python' | 'JavaScript';
  type: 'Programming Problems' | 'Debugging' | 'Output Prediction' | 'Code Completion' | 'Algorithm Problems' | 'Complexity Analysis';
  description: string;
  initialCode: string;
  testCases: { input: string; expectedOutput: string; isHidden?: boolean }[];
  solutionExplanation: string;
}

// ----------------- FEATURE 1: MY AI LIBRARY & RAG -----------------
export interface LibraryChunk {
  id: string;
  chunkIndex: number;
  pageNumber?: number;
  sectionHeading?: string;
  content: string;
}

export interface LibraryDocument {
  id: string;
  userId: string;
  name: string;
  fileType: 'pdf' | 'docx' | 'txt' | 'pptx' | 'image' | string;
  mimeType: string;
  sizeBytes: number;
  storagePath?: string;
  collectionName: string; // e.g. "General", "Math Notes", "Exam Prep"
  status: 'uploading' | 'processing' | 'ready' | 'failed';
  errorMessage?: string;
  pageCount?: number;
  extractedText?: string;
  chunks: LibraryChunk[];
  uploadedAt: string;
  updatedAt: string;
}

export interface LibraryCitation {
  docId: string;
  docName: string;
  pageNumber?: number;
  sectionHeading?: string;
  excerpt: string;
}

export interface LibraryMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: LibraryCitation[];
  timestamp: string;
}

export interface LibraryConversation {
  id: string;
  userId: string;
  title: string;
  selectedDocumentIds: string[]; // empty means entire library
  collectionName?: string;
  createdAt: string;
  updatedAt: string;
  messages: LibraryMessage[];
}

// ----------------- FEATURE 2: HANDWRITTEN PROBLEM SOLVER -----------------
export interface SolvedProblem {
  id: string;
  userId: string;
  subjectId?: string;
  subjectName: string;
  problemType: 'Mathematics' | 'Statistics' | 'Physics' | 'Digital Electronics' | 'Engineering Numerical' | 'Programming' | string;
  question: string;
  originalImageBase64?: string;
  originalImageName?: string;
  given: string;
  required: string;
  formula?: string;
  steps: string[];
  explanation: string;
  finalAnswer: string;
  verification?: string;
  diagramOrTruthTable?: string;
  codeSolution?: {
    language: string;
    code: string;
    explanation: string;
    timeComplexity?: string;
    spaceComplexity?: string;
  };
  solvedAt: string;
  savedToLibrary: boolean;
}

// ----------------- FEATURE 3: PREVIOUS YEAR PAPER INTELLIGENCE -----------------
export interface PaperQuestionItem {
  id: string;
  questionNumber: string;
  section?: string;
  text: string;
  marks: number;
  unitName?: string;
  topicName?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  isRepeated?: boolean;
  frequencyCount?: number;
  repeatedInYears?: number[];
  pageReference?: number;
}

export interface PreviousYearPaper {
  id: string;
  userId: string;
  subjectId?: string;
  subjectName: string;
  university: string;
  course: string;
  branch: string;
  semester: string;
  year: number;
  examType: 'Midterm' | 'End-Semester' | 'Backlog' | 'Supplementary' | string;
  maxMarks: number;
  fileName: string;
  fileMimeType?: string;
  status: 'processing' | 'ready' | 'failed';
  errorMessage?: string;
  uploadedAt: string;
  sections: {
    sectionName: string;
    instructions?: string;
    totalMarks?: number;
    questions: PaperQuestionItem[];
  }[];
}

export interface PaperAnalysisReport {
  id: string;
  userId: string;
  subjectId: string;
  subjectName: string;
  analyzedAt: string;
  includedPaperIds: string[];
  totalQuestionsAnalyzed: number;
  yearRange: string;
  unitDistribution: { unitName: string; questionCount: number; percentage: number; marks: number }[];
  topicFrequencies: { topicName: string; count: number; marksTotal: number; priority: string; yearsAppeared: number[] }[];
  repeatedQuestions: { text: string; marks: number; occurrences: number; years: number[] }[];
  uncoveredSyllabusTopics: string[];
  recommendedPriorities: string[];
  aiStudyPlan: { day: number; topic: string; rationale: string; practiceQuestions: string[] }[];
}

// ----------------- FEATURE 4: OFFLINE SYNC RECORDS -----------------
export interface OfflineSyncRecord {
  id: string;
  userId: string;
  operationType: 'quiz_attempt' | 'flashcard_learned' | 'note_read' | 'problem_saved';
  contentId: string;
  payload: any;
  syncedAt: string;
  status: 'pending' | 'synced' | 'failed';
}

// ----------------- FEATURE 5: CHAT WITH FRIENDS (ROOM CODE) -----------------
export interface ChatRoom {
  id: string;
  roomCode: string; // e.g. "SYL-7K9P2X"
  name?: string;
  topic?: string;
  subjectId?: string;
  createdBy: string; // user id
  status: 'active' | 'closed';
  maxMembers: number; // default 10
  createdAt: string;
  expiresAt?: string;
  lastActivityAt: string;
}

export interface ChatRoomMember {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userCollege?: string;
  role: 'owner' | 'member';
  joinedAt: string;
  lastSeenAt: string;
  isOnline?: boolean;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  messageType: 'text' | 'system' | 'code' | 'file';
  createdAt: string;
  editedAt?: string;
  deletedAt?: string;
  deletedForAll?: boolean;
}

export interface DatabaseSchema {
  users: User[];
  subjects: Subject[];
  notes: Note[];
  questions: Question[];
  mcqs: MCQ[];
  flashcards: Flashcard[];
  mindmaps: MindMapData[];
  cheatsheets: CheatSheet[];
  vivaQuestions: VivaQuestionItem[];
  studyPlans: StudyPlanItem[];
  previousPapers: PreviousPaperAnalysis[];
  examPredictions: ExamPredictionData[];
  generatedPapers: QuestionPaperGenerated[];
  evaluations: AnswerEvaluation[];
  studySessions: StudySession[];
  achievements: Achievement[];
  studyGroups: StudyGroup[];
  chatHistory: { id: string; userId: string; subjectId?: string; role: 'user' | 'assistant'; content: string; timestamp: string }[];
  roadmaps: StudyRoadmap[];
  sessions: SessionRecord[];
  // Advanced AI Features Collections
  libraryDocuments: LibraryDocument[];
  libraryConversations: LibraryConversation[];
  solvedProblems: SolvedProblem[];
  previousYearPapers: PreviousYearPaper[];
  paperAnalysisReports: PaperAnalysisReport[];
  offlineSyncRecords: OfflineSyncRecord[];
  // Friend Chat Collections
  chatRooms: ChatRoom[];
  chatRoomMembers: ChatRoomMember[];
  chatMessages: ChatMessage[];
}

const DB_FILE = path.resolve(process.cwd(), 'data', 'db.json');

function ensureDbFile(): DatabaseSchema {
  const dataDir = path.resolve(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const defaultUser: User = {
      id: 'usr_default',
      name: 'Minshu Kumar',
      email: 'minshukumar20078@gmail.com',
      college: 'National Institute of Technology',
      course: 'B.Tech',
      branch: 'Computer Science & Engineering',
      year: '2nd Year',
      semester: '4th Semester',
      preferredLanguage: 'English',
      examDate: '2026-11-15',
      xp: 280,
      level: 2,
      currentStreak: 7,
      longestStreak: 14,
      lastActiveDate: new Date().toISOString().split('T')[0],
      activeDates: [
        new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0],
        new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
        new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0],
        new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
        new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
        new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0],
        new Date().toISOString().split('T')[0],
      ],
      createdAt: new Date().toISOString(),
      privacyShareStats: true,
    };

    const initialDb: DatabaseSchema = {
      users: [defaultUser],
      subjects: [],
      notes: [],
      questions: [],
      mcqs: [],
      flashcards: [],
      mindmaps: [],
      cheatsheets: [],
      vivaQuestions: [],
      studyPlans: [],
      previousPapers: [],
      examPredictions: [],
      generatedPapers: [],
      evaluations: [],
      studySessions: [],
      achievements: [
        {
          id: 'ach_1',
          key: 'FIRST_TOPIC',
          title: 'First Topic Completed',
          description: 'Completed your very first syllabus topic revision',
          icon: '🏆',
          unlockedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
        },
        {
          id: 'ach_2',
          key: '7_DAY_STREAK',
          title: '7-Day Streak',
          description: 'Maintained a consistent 7-day daily study momentum',
          icon: '🔥',
          unlockedAt: new Date().toISOString(),
        },
      ],
      studyGroups: [
        {
          id: 'grp_cse_core',
          name: 'CSE Core Warriors',
          subjectName: 'Data Structures & Algorithms',
          inviteCode: 'DSA2026',
          createdById: 'usr_default',
          members: [
            {
              userId: 'usr_default',
              userName: 'Minshu Kumar',
              topicsCount: 16,
              quizAccuracy: 88,
              streak: 7,
              joinedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
            },
            {
              userId: 'usr_partner1',
              userName: 'Aarav Sharma',
              topicsCount: 14,
              quizAccuracy: 82,
              streak: 5,
              joinedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
            },
            {
              userId: 'usr_partner2',
              userName: 'Rhea Patel',
              topicsCount: 19,
              quizAccuracy: 91,
              streak: 9,
              joinedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
            },
          ],
          discussions: [
            {
              id: 'disc_1',
              userId: 'usr_partner1',
              userName: 'Aarav Sharma',
              message: 'Hey everyone, check out the unit 2 circular queue numericals generated by StudyAI!',
              createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
            },
            {
              id: 'disc_2',
              userId: 'usr_default',
              userName: 'Minshu Kumar',
              message: 'Yes! The step-by-step formula and verification makes expression conversion so easy to grasp.',
              createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
            },
          ],
        },
      ],
      chatHistory: [],
      roadmaps: [],
      sessions: [],
      libraryDocuments: [],
      libraryConversations: [],
      solvedProblems: [],
      previousYearPapers: [],
      paperAnalysisReports: [],
      offlineSyncRecords: [],
      chatRooms: [],
      chatRoomMembers: [],
      chatMessages: [],
    };

    fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), 'utf-8');
    return initialDb;
  }

  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as DatabaseSchema;
    if (!parsed.roadmaps) parsed.roadmaps = [];
    if (!parsed.vivaQuestions) parsed.vivaQuestions = [];
    if (!parsed.sessions) parsed.sessions = [];
    if (!parsed.libraryDocuments) parsed.libraryDocuments = [];
    if (!parsed.libraryConversations) parsed.libraryConversations = [];
    if (!parsed.solvedProblems) parsed.solvedProblems = [];
    if (!parsed.previousYearPapers) parsed.previousYearPapers = [];
    if (!parsed.paperAnalysisReports) parsed.paperAnalysisReports = [];
    if (!parsed.offlineSyncRecords) parsed.offlineSyncRecords = [];
    if (!parsed.chatRooms) parsed.chatRooms = [];
    if (!parsed.chatRoomMembers) parsed.chatRoomMembers = [];
    if (!parsed.chatMessages) parsed.chatMessages = [];
    return parsed;
  } catch {
    const fallback: DatabaseSchema = {
      users: [],
      subjects: [],
      notes: [],
      questions: [],
      mcqs: [],
      flashcards: [],
      mindmaps: [],
      cheatsheets: [],
      vivaQuestions: [],
      studyPlans: [],
      previousPapers: [],
      examPredictions: [],
      generatedPapers: [],
      evaluations: [],
      studySessions: [],
      achievements: [],
      studyGroups: [],
      chatHistory: [],
      roadmaps: [],
      sessions: [],
      libraryDocuments: [],
      libraryConversations: [],
      solvedProblems: [],
      previousYearPapers: [],
      paperAnalysisReports: [],
      offlineSyncRecords: [],
      chatRooms: [],
      chatRoomMembers: [],
      chatMessages: [],
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(fallback, null, 2), 'utf-8');
    return fallback;
  }
}

/**
 * Generates an unpredictable, human-readable room code (e.g. SYL-7K9P2X)
 * Ensures code uniqueness against existing active/closed rooms
 */
export function generateRoomCode(existingRooms: ChatRoom[]): string {
  // Characters excluding ambiguous 0, O, 1, I
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let attempts = 0;
  while (attempts < 100) {
    attempts++;
    let randomPart = '';
    for (let i = 0; i < 6; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const code = `SYL-${randomPart}`;
    const collision = existingRooms.some((r) => r.roomCode.toUpperCase() === code);
    if (!collision) {
      return code;
    }
  }
  // Secondary fallback if high density
  return `SYL-${Date.now().toString(36).toUpperCase().slice(-6)}`;
}

export function readDb(): DatabaseSchema {
  return ensureDbFile();
}

export function writeDb(data: DatabaseSchema): void {
  const dataDir = path.resolve(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const tempFile = path.resolve(dataDir, `db.${Date.now()}.${Math.random().toString(36).substring(7)}.tmp`);
  fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tempFile, DB_FILE);
}
