import { create } from 'zustand';

interface EvaluationLoadingState {
  isVisible: boolean;
  message: string;
  progress: number;
  estimatedTime: number;
}

interface AssessmentWritingEvaluationState {
  isLoading: boolean;
  isEvaluating: boolean;
  evaluationProgress: number;
  scores: any | null;
  feedback: any | null;
  error: string | null;
  submission: {
    prompt: string;
    response: string;
    assessmentId: number;
    questionId: number;
    moduleId: number;
  };
}

interface AssessmentSpeakingEvaluationState {
  isLoading: boolean;
  isEvaluating: boolean;
  evaluationProgress: number;
  scores: any | null;
  feedback: any | null;
  error: string | null;
  submission: {
    prompt: string;
    audioBlob: Blob | null;
    transcription: string;
    assessmentId: number;
    questionId: number;
    moduleId: number;
  };
}

interface AssessmentModuleState {
  currentQuestion: any | null;
  userResponse: string;
  wordCount: number;
  characterCount: number;
  timeSpent: number;
  isSubmitted: boolean;
  assessmentId: number;
  currentSection: 'writing' | 'speaking';
}

interface StoreState {
  aiassistantName: string;
  setAiassistantName: (name: string) => void;
  arrAssesmentQuestion: any[];
  setArrAssesmentQuestion: (questions: any[]) => void;
  evaluationLoading: EvaluationLoadingState;
  setEvaluationLoading: (state: EvaluationLoadingState) => void;
  assessmentWritingEvaluation: AssessmentWritingEvaluationState;
  setAssessmentWritingEvaluation: (state: AssessmentWritingEvaluationState | ((prev: AssessmentWritingEvaluationState) => AssessmentWritingEvaluationState)) => void;
  assessmentSpeakingEvaluation: AssessmentSpeakingEvaluationState;
  setAssessmentSpeakingEvaluation: (state: AssessmentSpeakingEvaluationState | ((prev: AssessmentSpeakingEvaluationState) => AssessmentSpeakingEvaluationState)) => void;
  assessmentModule: AssessmentModuleState;
  setAssessmentModule: (state: AssessmentModuleState | ((prev: AssessmentModuleState) => AssessmentModuleState)) => void;
  assessmentSpeakingModule: AssessmentModuleState;
  setAssessmentSpeakingModule: (state: AssessmentModuleState | ((prev: AssessmentModuleState) => AssessmentModuleState)) => void;
}

export const useStore = create<StoreState>((set) => ({
  aiassistantName: "",
  setAiassistantName: (name) => set({ aiassistantName: name }),
  arrAssesmentQuestion: [],
  setArrAssesmentQuestion: (questions) => set({ arrAssesmentQuestion: questions }),
  evaluationLoading: {
    isVisible: false,
    message: '',
    progress: 0,
    estimatedTime: 0
  },
  setEvaluationLoading: (state) => set((prev) => ({
    evaluationLoading: typeof state === 'function' ? state(prev.evaluationLoading) : state
  })),
  assessmentWritingEvaluation: {
    isLoading: false,
    isEvaluating: false,
    evaluationProgress: 0,
    scores: null,
    feedback: null,
    error: null,
    submission: {
      prompt: '',
      response: '',
      assessmentId: 0,
      questionId: 0,
      moduleId: 9
    }
  },
  setAssessmentWritingEvaluation: (state) => set((prev) => ({
    assessmentWritingEvaluation: typeof state === 'function' ? state(prev.assessmentWritingEvaluation) : state
  })),
  assessmentSpeakingEvaluation: {
    isLoading: false,
    isEvaluating: false,
    evaluationProgress: 0,
    scores: null,
    feedback: null,
    error: null,
    submission: {
      prompt: '',
      audioBlob: null,
      transcription: '',
      assessmentId: 0,
      questionId: 0,
      moduleId: 13
    }
  },
  setAssessmentSpeakingEvaluation: (state) => set((prev) => ({
    assessmentSpeakingEvaluation: typeof state === 'function' ? state(prev.assessmentSpeakingEvaluation) : state
  })),
  assessmentModule: {
    currentQuestion: null,
    userResponse: '',
    wordCount: 0,
    characterCount: 0,
    timeSpent: 0,
    isSubmitted: false,
    assessmentId: 0,
    currentSection: 'writing'
  },
  setAssessmentModule: (state) => set((prev) => ({
    assessmentModule: typeof state === 'function' ? state(prev.assessmentModule) : state
  })),
  assessmentSpeakingModule: {
    currentQuestion: null,
    userResponse: '',
    wordCount: 0,
    characterCount: 0,
    timeSpent: 0,
    isSubmitted: false,
    assessmentId: 0,
    currentSection: 'speaking'
  },
  setAssessmentSpeakingModule: (state) => set((prev) => ({
    assessmentSpeakingModule: typeof state === 'function' ? state(prev.assessmentSpeakingModule) : state
  })),
}));