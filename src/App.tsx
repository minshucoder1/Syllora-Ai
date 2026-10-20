import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AnimatedWaveBackground } from './components/AnimatedWaveBackground';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { AuthModal } from './components/AuthModal';
import { RemoveSubjectModal } from './components/RemoveSubjectModal';
import { EditSubjectModal } from './components/EditSubjectModal';

import {
  LayoutDashboard,
  BookOpen,
  MessageCircle,
  PlusCircle,
  Compass,
} from 'lucide-react';

// Views
import { LandingPage } from './views/LandingPage';
import { DashboardHome } from './views/DashboardHome';
import { MySubjectsView } from './views/MySubjectsView';
import { AddSyllabusView } from './views/AddSyllabusView';
import { SubjectDetailView } from './views/SubjectDetailView';
import { NotesView } from './views/NotesView';
import { ImportantQuestionsView } from './views/ImportantQuestionsView';
import { NumericalsView } from './views/NumericalsView';
import { MCQQuizView } from './views/MCQQuizView';
import { FlashcardsView } from './views/FlashcardsView';
import { PreviousPapersView } from './views/PreviousPapersView';
import { ExamPredictionView } from './views/ExamPredictionView';
import { QuestionPaperGeneratorView } from './views/QuestionPaperGeneratorView';
import { AnswerCheckerView } from './views/AnswerCheckerView';
import { AdaptiveLearningView } from './views/AdaptiveLearningView';
import { LastMinuteRevisionView } from './views/LastMinuteRevisionView';
import { CheatSheetView } from './views/CheatSheetView';
import { MindMapView } from './views/MindMapView';
import { VoiceStudyView } from './views/VoiceStudyView';
import { AIStudyChatTutorView } from './views/AIStudyChatTutorView';
import { CodingLabView } from './views/CodingLabView';
import { FocusModeView } from './views/FocusModeView';
import { StudyPlannerView } from './views/StudyPlannerView';
import { StudyRoadmapView } from './views/StudyRoadmapView';
import { StudyGroupsView } from './views/StudyGroupsView';
import { FriendChatView } from './views/FriendChatView';
import { CompleteStudyPackView } from './views/CompleteStudyPackView';
import { AIToolsCatalogView } from './views/AIToolsCatalogView';
import { ProfileAchievementsView } from './views/ProfileAchievementsView';
import { SettingsView } from './views/SettingsView';
import { LoginView } from './views/LoginView';
import { RegisterView } from './views/RegisterView';
import { ForgotPasswordView } from './views/ForgotPasswordView';
import { ResetPasswordView } from './views/ResetPasswordView';
import { EmailVerificationView } from './views/EmailVerificationView';
import { OnboardingView } from './views/OnboardingView';

const MainLayout: React.FC = () => {
  const {
    user,
    activeTab,
    setActiveTab,
    openSyllabusFlow,
    isRestoringSession,
    navigateTo,
    toast,
    subjectToRemove,
    setSubjectToRemove,
    subjectToEdit,
    setSubjectToEdit,
  } = useApp();

  const isAuthPage = [
    'login',
    'register',
    'forgot-password',
    'reset-password',
    'verify-email',
    'onboarding',
  ].includes(activeTab);

  const isLanding = (activeTab === 'landing' || activeTab === '') && !user;

  // Mandatory Dashboard & Route Protection:
  // Automatically redirects logged-out users opening dashboard or any private route directly to /login
  React.useEffect(() => {
    if (!isRestoringSession && !user && !isAuthPage && !isLanding) {
      try {
        sessionStorage.setItem('syllora_intended_destination', `/${activeTab}`);
      } catch {}
      navigateTo('/login');
    }
  }, [isRestoringSession, user, isAuthPage, isLanding, activeTab, navigateTo]);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'login':
        return <LoginView />;
      case 'register':
        return <RegisterView />;
      case 'forgot-password':
        return <ForgotPasswordView />;
      case 'reset-password':
        return <ResetPasswordView />;
      case 'verify-email':
        return <EmailVerificationView />;
      case 'onboarding':
        return <OnboardingView />;
      case 'landing':
        return <LandingPage />;
      case 'dashboard':
        return <DashboardHome />;
      case 'subjects':
        return <MySubjectsView />;
      case 'subject-detail':
        return <SubjectDetailView />;
      case 'add-syllabus':
        return <AddSyllabusView />;
      case 'notes':
        return <NotesView />;
      case 'priority-topics':
        return <SubjectDetailView />;
      case 'important-questions':
        return <ImportantQuestionsView />;
      case 'numericals':
        return <NumericalsView />;
      case 'mcqs':
        return <MCQQuizView />;
      case 'flashcards':
        return <FlashcardsView />;
      case 'previous-papers':
        return <PreviousPapersView />;
      case 'exam-prediction':
        return <ExamPredictionView />;
      case 'paper-generator':
        return <QuestionPaperGeneratorView />;
      case 'answer-checker':
        return <AnswerCheckerView />;
      case 'adaptive':
        return <AdaptiveLearningView />;
      case 'last-minute':
        return <LastMinuteRevisionView />;
      case 'cheatsheets':
        return <CheatSheetView />;
      case 'mindmaps':
        return <MindMapView />;
      case 'viva':
        return <VoiceStudyView />;
      case 'ask-ai':
      case 'study-tutor':
      case 'tutor':
        return <AIStudyChatTutorView />;
      case 'coding-lab':
        return <CodingLabView />;
      case 'focus-mode':
        return <FocusModeView />;
      case 'planner':
        return <StudyPlannerView />;
      case 'roadmap':
        return <StudyRoadmapView />;
      case 'study-pack':
        return <CompleteStudyPackView />;
      case 'groups':
        return <StudyGroupsView />;
      case 'friend-chat':
      case 'chat':
        return <FriendChatView />;
      case 'achievements':
      case 'profile':
        return <ProfileAchievementsView />;
      case 'settings':
        return <SettingsView />;
      case 'ai-tools':
        return <AIToolsCatalogView />;
      default:
        return <DashboardHome />;
    }
  };

  return (
    <div className="relative min-h-screen bg-[#FFF9F2] text-[#28263A] flex flex-col font-sans selection:bg-[#EAE5FF] selection:text-[#7C6EE6]">
      {/* Full-Site Pastel Ambient Background */}
      <AnimatedWaveBackground intensity="normal" />

      {/* Global Navbar */}
      <Navbar />

      {/* Main Body with Sidebar */}
      <div className="flex-1 flex overflow-hidden relative z-10 pb-16 md:pb-0">
        {!isLanding && !isAuthPage && !!user && <Sidebar />}

        <main className="flex-1 overflow-y-auto min-h-full">
          {renderActiveView()}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar - Pastel Bloom Theme */}
      {!isLanding && !isAuthPage && !!user && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FFFDF9]/95 backdrop-blur-xl border-t border-[#EEEAF4] px-2 py-2 flex items-center justify-around shadow-[0_-4px_20px_rgba(40,38,58,0.06)]">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
              activeTab === 'dashboard'
                ? 'text-[#7C6EE6] font-bold'
                : 'text-[#777589] hover:text-[#28263A]'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="text-[10px]">Home</span>
          </button>

          <button
            onClick={() => setActiveTab('subjects')}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
              activeTab === 'subjects' || activeTab === 'subject-detail'
                ? 'text-[#7C6EE6] font-bold'
                : 'text-[#777589] hover:text-[#28263A]'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span className="text-[10px]">Subjects</span>
          </button>

          <button
            onClick={() => setActiveTab('ask-ai')}
            className={`relative flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
              activeTab === 'ask-ai'
                ? 'text-[#7C6EE6] bg-[#EAE5FF] font-bold shadow-sm'
                : 'text-[#777589] hover:text-[#7C6EE6]'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            <span className="text-[10px] tracking-tight">AI Tutor</span>
          </button>

          <button
            onClick={() => openSyllabusFlow()}
            className="flex flex-col items-center gap-0.5 px-3 py-1 text-[#777589] hover:text-[#7C6EE6] transition-all"
          >
            <PlusCircle className="w-4 h-4 text-[#7C6EE6]" />
            <span className="text-[10px]">+ Syllabus</span>
          </button>

          <button
            onClick={() => setActiveTab('ai-tools')}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
              activeTab === 'ai-tools'
                ? 'text-[#7C6EE6] font-bold'
                : 'text-[#777589] hover:text-[#28263A]'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span className="text-[10px]">AI Tools</span>
          </button>
        </div>
      )}

      {/* Global Modals */}
      <GlobalSearchModal />
      <AuthModal />
      <RemoveSubjectModal
        subject={subjectToRemove}
        isOpen={!!subjectToRemove}
        onClose={() => setSubjectToRemove(null)}
      />
      <EditSubjectModal
        subject={subjectToEdit}
        isOpen={!!subjectToEdit}
        onClose={() => setSubjectToEdit(null)}
      />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-white border border-[#EEEAF4] shadow-[0_8px_30px_rgba(40,38,58,0.12)] text-xs text-[#28263A] font-medium flex items-center gap-3 animate-slide-up">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              toast.type === 'error'
                ? 'bg-rose-500'
                : toast.type === 'info'
                ? 'bg-[#7C6EE6]'
                : 'bg-[#319B78]'
            }`}
          />
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
