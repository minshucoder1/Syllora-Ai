export interface User {
  id: string;
  name: string;
  email: string;
  college?: string;
  course?: string;
  branch?: string;
  year?: string;
  semester?: string;
  preferredLanguage?: 'English' | 'Hindi' | 'Hinglish';
  phoneCountryCode?: string;
  phoneNumber?: string;
  phone?: string;
  examDate?: string;
  avatar?: string;
  xp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  activeDates: string[];
  createdAt: string;
  privacyShareStats: boolean;
  emailVerified?: boolean;
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
  score?: number;
  attempts?: number;
  lastAccessed?: string;
  orderNumber: number;
}

export interface Unit {
  id: string;
  subjectId: string;
  name: string;
  weightage?: number;
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
