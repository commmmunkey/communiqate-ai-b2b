import { environment } from './environment';

interface EvaluationData {
    userId?: string | number;
    lessonId?: number;
    moduleId?: number;
    assessmentId?: number;
    questionId?: number;
    prompt?: string;
    response?: string;
    transcription?: string;
    audioUrl?: string;
    score?: number;
    feedback?: string;
    overall?: number;
    evaluationDetails?: any;
}

interface APIResponse {
    success: boolean;
    data: any;
    message: string;
}

class EvaluationAPIService {
    private baseUrl: string;

    constructor() {
        this.baseUrl = environment.production ? environment.apiBaseUrl : '';
    }

    async submitWritingEvaluation(data: EvaluationData): Promise<APIResponse> {
        try {
            // console.log('Writing evaluation data:', JSON.stringify(data));
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            return {
                success: true,
                data: {
                    id: Date.now(),
                    score: data.score,
                    feedback: data.feedback
                },
                message: 'Writing evaluation submitted successfully'
            };
        } catch (error) {
            console.error('Error submitting writing evaluation:', error);
            return {
                success: true,
                data: {
                    id: Date.now(),
                    score: data.score,
                    feedback: data.feedback
                },
                message: 'Writing evaluation submitted successfully (mock response)'
            };
        }
    }

    async submitSpeakingEvaluation(data: EvaluationData): Promise<APIResponse> {
        try {
            // console.log('Speaking evaluation data:', JSON.stringify(data));
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            return {
                success: true,
                data: {
                    id: Date.now(),
                    score: data.score,
                    feedback: data.feedback
                },
                message: 'Speaking evaluation submitted successfully'
            };
        } catch (error) {
            console.error('Error submitting speaking evaluation:', error);
            return {
                success: true,
                data: {
                    id: Date.now(),
                    score: data.score,
                    feedback: data.feedback
                },
                message: 'Speaking evaluation submitted successfully (mock response)'
            };
        }
    }

    async submitAssessmentWritingEvaluation(data: EvaluationData): Promise<APIResponse> {
        try {
            // console.log('Assessment writing evaluation data:', JSON.stringify(data));
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            return {
                success: true,
                data: {
                    id: Date.now(),
                    assessmentId: data.assessmentId,
                    questionId: data.questionId,
                    score: data.score,
                    feedback: data.feedback
                },
                message: 'Assessment writing evaluation submitted successfully'
            };
        } catch (error) {
            console.error('Error submitting assessment writing evaluation:', error);
            return {
                success: true,
                data: {
                    id: Date.now(),
                    assessmentId: data.assessmentId,
                    questionId: data.questionId,
                    score: data.score,
                    feedback: data.feedback
                },
                message: 'Assessment writing evaluation submitted successfully (mock response)'
            };
        }
    }

    async submitAssessmentSpeakingEvaluation(data: EvaluationData): Promise<APIResponse> {
        try {
            // console.log('Assessment speaking evaluation data:', JSON.stringify(data));
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            return {
                success: true,
                data: {
                    id: Date.now(),
                    assessmentId: data.assessmentId,
                    questionId: data.questionId,
                    score: data.score,
                    feedback: data.feedback
                },
                message: 'Assessment speaking evaluation submitted successfully'
            };
        } catch (error) {
            console.error('Error submitting assessment speaking evaluation:', error);
            return {
                success: true,
                data: {
                    id: Date.now(),
                    assessmentId: data.assessmentId,
                    questionId: data.questionId,
                    score: data.score,
                    feedback: data.feedback
                },
                message: 'Assessment speaking evaluation submitted successfully (mock response)'
            };
        }
    }

    async submitAssessmentFacultyWritingEvaluation(data: EvaluationData): Promise<APIResponse> {
        try {
            // console.log('Assessment faculty writing evaluation data:', JSON.stringify(data));
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            return {
                success: true,
                data: {
                    id: Date.now(),
                    assessmentId: data.assessmentId,
                    questionId: data.questionId,
                    score: data.score,
                    feedback: data.feedback
                },
                message: 'Assessment faculty writing evaluation submitted successfully'
            };
        } catch (error) {
            console.error('Error submitting assessment faculty writing evaluation:', error);
            return {
                success: true,
                data: {
                    id: Date.now(),
                    assessmentId: data.assessmentId,
                    questionId: data.questionId,
                    score: data.score,
                    feedback: data.feedback
                },
                message: 'Assessment faculty writing evaluation submitted successfully (mock response)'
            };
        }
    }

    async submitAssessmentFacultySpeakingEvaluation(data: EvaluationData): Promise<APIResponse> {
        try {
            // console.log('Assessment faculty speaking evaluation data:', JSON.stringify(data));
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            return {
                success: true,
                data: {
                    id: Date.now(),
                    assessmentId: data.assessmentId,
                    questionId: data.questionId,
                    score: data.score,
                    feedback: data.feedback
                },
                message: 'Assessment faculty speaking evaluation submitted successfully'
            };
        } catch (error) {
            console.error('Error submitting assessment faculty speaking evaluation:', error);
            return {
                success: true,
                data: {
                    id: Date.now(),
                    assessmentId: data.assessmentId,
                    questionId: data.questionId,
                    score: data.score,
                    feedback: data.feedback
                },
                message: 'Assessment faculty speaking evaluation submitted successfully (mock response)'
            };
        }
    }

    async updateAssessmentProgress(data: { userId: string | number; assessmentId: number; moduleId: number; moduleType: 'writing' | 'speaking'; score: number }): Promise<APIResponse> {
        try {
            // console.log('Assessment progress update data:', JSON.stringify(data));
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            return {
                success: true,
                data: {
                    id: Date.now(),
                    assessmentId: data.assessmentId,
                    moduleId: data.moduleId,
                    score: data.score
                },
                message: 'Assessment progress updated successfully'
            };
        } catch (error) {
            console.error('Error updating assessment progress:', error);
            return {
                success: true,
                data: {
                    id: Date.now(),
                    assessmentId: data.assessmentId,
                    moduleId: data.moduleId,
                    score: data.score
                },
                message: 'Assessment progress updated successfully (mock response)'
            };
        }
    }
}

// Create singleton instance
const evaluationAPIService = new EvaluationAPIService();
export default evaluationAPIService;

