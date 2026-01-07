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

interface WritingEvaluationState {
  isLoading: boolean;
  isEvaluating: boolean;
  evaluationProgress: number;
  scores: any | null;
  feedback: any | null;
  error: string | null;
  submission: {
    prompt: string;
    response: string;
    lessonId: number;
    moduleId: number;
  };
}

interface SpeakingEvaluationState {
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
    lessonId: number;
    moduleId: number;
  };
}

interface WritingModuleState {
  currentQuestion: any | null;
  userResponse: string;
  wordCount: number;
  characterCount: number;
  timeSpent: number;
  isSubmitted: boolean;
}

interface SpeakingModuleState {
  currentQuestion: any | null;
  isRecording: boolean;
  recordingTime: number;
  audioBlob: Blob | null;
  audioUrl: string;
  isSubmitted: boolean;
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
  // NewHome state
  arrFreeCourseHome: any[];
  setArrFreeCourseHome: (courses: any[]) => void;
  arrCorporateCourseHome: any[];
  setArrCorporateCourseHome: (courses: any[]) => void;
  arrPremiumCourseHome: any[];
  setArrPremiumCourseHome: (courses: any[]) => void;
  arrHomeBanners: any[];
  setArrHomeBanners: (banners: any[]) => void;
  watchHowToUseApp: boolean;
  setWatchHowToUseApp: (value: boolean) => void;
  lessonId: number;
  setLessonId: (id: number) => void;
  moduleId: number;
  setModuleId: (id: number) => void;
  moduleIds: number[];
  setModuleIds: (ids: number[]) => void;
  arrQuestions: any[];
  setArrQuestions: (questions: any[]) => void;
  // LU state
  writingEvaluation: WritingEvaluationState;
  setWritingEvaluation: (state: WritingEvaluationState | ((prev: WritingEvaluationState) => WritingEvaluationState)) => void;
  speakingEvaluation: SpeakingEvaluationState;
  setSpeakingEvaluation: (state: SpeakingEvaluationState | ((prev: SpeakingEvaluationState) => SpeakingEvaluationState)) => void;
  writingModule: WritingModuleState;
  setWritingModule: (state: WritingModuleState | ((prev: WritingModuleState) => WritingModuleState)) => void;
  speakingModule: SpeakingModuleState;
  setSpeakingModule: (state: SpeakingModuleState | ((prev: SpeakingModuleState) => SpeakingModuleState)) => void;
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
  // NewHome state
  arrFreeCourseHome: [],
  setArrFreeCourseHome: (courses) => set({ arrFreeCourseHome: courses }),
  arrCorporateCourseHome: [],
  setArrCorporateCourseHome: (courses) => set({ arrCorporateCourseHome: courses }),
  arrPremiumCourseHome: [],
  setArrPremiumCourseHome: (courses) => set({ arrPremiumCourseHome: courses }),
  arrHomeBanners: [],
  setArrHomeBanners: (banners) => set({ arrHomeBanners: banners }),
  watchHowToUseApp: true,
  setWatchHowToUseApp: (value) => set({ watchHowToUseApp: value }),
  lessonId: 0,
  setLessonId: (id) => set({ lessonId: id }),
  moduleId: 0,
  setModuleId: (id) => set({ moduleId: id }),
  moduleIds: [],
  setModuleIds: (ids) => set({ moduleIds: ids }),
  arrQuestions: [],
  setArrQuestions: (questions) => set({ arrQuestions: questions }),
  // LU state
  writingEvaluation: {
    isLoading: false,
    isEvaluating: false,
    evaluationProgress: 0,
    scores: null,
    feedback: null,
    error: null,
    submission: {
      prompt: '',
      response: '',
      lessonId: 0,
      moduleId: 0
    }
  },
  setWritingEvaluation: (state) => set((prev) => ({
    writingEvaluation: typeof state === 'function' ? state(prev.writingEvaluation) : state
  })),
  speakingEvaluation: {
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
      lessonId: 0,
      moduleId: 0
    }
  },
  setSpeakingEvaluation: (state) => set((prev) => ({
    speakingEvaluation: typeof state === 'function' ? state(prev.speakingEvaluation) : state
  })),
  writingModule: {
    currentQuestion: null,
    userResponse: '',
    wordCount: 0,
    characterCount: 0,
    timeSpent: 0,
    isSubmitted: false
  },
  setWritingModule: (state) => set((prev) => ({
    writingModule: typeof state === 'function' ? state(prev.writingModule) : state
  })),
  speakingModule: {
    currentQuestion: null,
    isRecording: false,
    recordingTime: 0,
    audioBlob: null,
    audioUrl: '',
    isSubmitted: false
  },
  setSpeakingModule: (state) => set((prev) => ({
    speakingModule: typeof state === 'function' ? state(prev.speakingModule) : state
  })),
}));