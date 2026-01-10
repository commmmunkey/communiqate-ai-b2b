import { create } from 'zustand';

// Types for Assessment Progress
export interface Question {
  queID: number;
  moduleID?: number;
  queQuestion?: string;
  question?: string;
  queType?: string;
  queCorrectAns?: string;
  queSolution?: string;
  queVerificationRequred?: string;
  queFile?: string;
  lessionID?: string;
  correctoption?: string;
  questiontype?: string;
  option1?: string;
  option2?: string;
  option3?: string;
  option4?: string;
  queOption1?: string;
  queOption2?: string;
  queOption3?: string;
  queOption4?: string;
  queOptions?: Array<{ optionID: string; optionText: string }>;
}

export interface Answer {
  answerIsCorrect: string;
  answerIsVerified: string;
  queID: number;
  answerAnswer: string;
  answerCorrectAnswer: string;
  score?: number;
}

export type SectionType = 'general' | 'reading' | 'listening' | 'writing' | 'speaking';

// Separate state and actions interfaces for Assessment Progress
interface AssessmentProgressState {
  // Navigation state
  currentSection: SectionType;
  currentQuestionIndex: number;
  
  // Answer state
  answers: Record<number, string>;
  selectedOptions: Record<number, number>;
  arrAnswers: Answer[];
  arrGeneralAnswers: Answer[];
  
  // Questions state
  arrGeneralQuestions: Question[];
  
  // Progress tracking
  isAssessmentInProgress: boolean;
  timeRemaining: number;
  assessmentStartedAt: number | null;
}

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
  // Assessment Progress State
  assessmentProgress: AssessmentProgressState;
  setAssessmentProgress: (state: AssessmentProgressState | ((prev: AssessmentProgressState) => AssessmentProgressState)) => void;
  // Assessment Progress Actions (separated from state to avoid losing methods on updates)
  setCurrentSection: (section: SectionType) => void;
  setCurrentQuestionIndex: (index: number) => void;
  setAnswers: (answers: Record<number, string>) => void;
  updateAnswer: (questionId: number, answer: string) => void;
  setSelectedOptions: (options: Record<number, number>) => void;
  updateSelectedOption: (questionId: number, optionIndex: number) => void;
  setArrAnswers: (answers: Answer[]) => void;
  addAnswer: (answer: Answer) => void;
  setArrGeneralAnswers: (answers: Answer[]) => void;
  addGeneralAnswer: (answer: Answer) => void;
  setArrGeneralQuestions: (questions: Question[]) => void;
  setTimeRemaining: (time: number | ((prev: number) => number)) => void;
  startAssessment: () => void;
  resetAssessment: () => void;
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
  // Assessment Progress State (state only, no actions)
  assessmentProgress: {
    currentSection: 'general',
    currentQuestionIndex: 0,
    answers: {},
    selectedOptions: {},
    arrAnswers: [],
    arrGeneralAnswers: [],
    arrGeneralQuestions: [],
    isAssessmentInProgress: false,
    timeRemaining: 1200,
    assessmentStartedAt: null,
  },
  
  setAssessmentProgress: (state) => set((prev) => ({
    assessmentProgress: typeof state === 'function' 
      ? state(prev.assessmentProgress) 
      : state
  })),
  
  // Assessment Progress Actions (separated from state)
  setCurrentSection: (section) => set((state) => ({
    assessmentProgress: {
      ...state.assessmentProgress,
      currentSection: section,
      // Reset question index when section changes
      currentQuestionIndex: 0
    }
  })),
  
  setCurrentQuestionIndex: (index) => set((state) => ({
    assessmentProgress: {
      ...state.assessmentProgress,
      currentQuestionIndex: index
    }
  })),
  
  setAnswers: (answers) => set((state) => ({
    assessmentProgress: {
      ...state.assessmentProgress,
      answers
    }
  })),
  
  updateAnswer: (questionId, answer) => set((state) => ({
    assessmentProgress: {
      ...state.assessmentProgress,
      answers: {
        ...state.assessmentProgress.answers,
        [questionId]: answer
      }
    }
  })),
  
  setSelectedOptions: (options) => set((state) => ({
    assessmentProgress: {
      ...state.assessmentProgress,
      selectedOptions: options
    }
  })),
  
  updateSelectedOption: (questionId, optionIndex) => set((state) => ({
    assessmentProgress: {
      ...state.assessmentProgress,
      selectedOptions: {
        ...state.assessmentProgress.selectedOptions,
        [questionId]: optionIndex
      }
    }
  })),
  
  setArrAnswers: (answers) => set((state) => ({
    assessmentProgress: {
      ...state.assessmentProgress,
      arrAnswers: answers
    }
  })),
  
  addAnswer: (answer) => set((state) => {
    const existingIndex = state.assessmentProgress.arrAnswers.findIndex(
      (a) => a.queID === answer.queID
    );
    if (existingIndex !== -1) {
      const updated = [...state.assessmentProgress.arrAnswers];
      updated[existingIndex] = answer;
      return {
        assessmentProgress: {
          ...state.assessmentProgress,
          arrAnswers: updated
        }
      };
    }
    return {
      assessmentProgress: {
        ...state.assessmentProgress,
        arrAnswers: [...state.assessmentProgress.arrAnswers, answer]
      }
    };
  }),
  
  setArrGeneralAnswers: (answers) => set((state) => ({
    assessmentProgress: {
      ...state.assessmentProgress,
      arrGeneralAnswers: answers
    }
  })),
  
  addGeneralAnswer: (answer) => set((state) => {
    const existingIndex = state.assessmentProgress.arrGeneralAnswers.findIndex(
      (a) => a.queID === answer.queID
    );
    if (existingIndex !== -1) {
      const updated = [...state.assessmentProgress.arrGeneralAnswers];
      updated[existingIndex] = answer;
      return {
        assessmentProgress: {
          ...state.assessmentProgress,
          arrGeneralAnswers: updated
        }
      };
    }
    return {
      assessmentProgress: {
        ...state.assessmentProgress,
        arrGeneralAnswers: [...state.assessmentProgress.arrGeneralAnswers, answer]
      }
    };
  }),
  
  setArrGeneralQuestions: (questions) => set((state) => ({
    assessmentProgress: {
      ...state.assessmentProgress,
      arrGeneralQuestions: questions
    }
  })),
  
  setTimeRemaining: (time) => set((state) => ({
    assessmentProgress: {
      ...state.assessmentProgress,
      timeRemaining: typeof time === 'function' 
        ? time(state.assessmentProgress.timeRemaining)
        : time
    }
  })),
  
  startAssessment: () => set((state) => ({
    assessmentProgress: {
      ...state.assessmentProgress,
      isAssessmentInProgress: true,
      assessmentStartedAt: Date.now()
    }
  })),
  
  resetAssessment: () => set((state) => ({
    assessmentProgress: {
      currentSection: 'general',
      currentQuestionIndex: 0,
      answers: {},
      selectedOptions: {},
      arrAnswers: [],
      arrGeneralAnswers: [],
      arrGeneralQuestions: [],
      isAssessmentInProgress: false,
      timeRemaining: 1200,
      assessmentStartedAt: null
    }
  })),
}));