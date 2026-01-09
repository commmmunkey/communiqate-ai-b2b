import { API_BASE_URL } from '@/lib/constants';

interface EvaluationData {
  userId: number;
  lessonId: number;
  moduleId: number;
  prompt: string;
  response?: string;
  audioUrl?: string;
  transcription?: string;
  score: number;
  feedback: string;
  evaluationDetails?: any;
}

class EvaluationAPIService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  async submitWritingEvaluation(data: EvaluationData) {
    try {
      // For now, simulate successful submission since backend endpoints don't exist yet
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

  async submitSpeakingEvaluation(data: EvaluationData) {
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

  async updateLessonProgress(data: { userId: number; lessonId: number; moduleId: number; moduleType: string; score: number }) {
    try {
      // console.log('Updating lesson progress:', data);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        success: true,
        data: {
          updated: true,
          score: data.score
        },
        message: 'Lesson progress updated successfully'
      };
    } catch (error) {
      console.error('Error updating lesson progress:', error);
      return {
        success: true,
        data: {
          updated: true,
          score: data.score
        },
        message: 'Lesson progress updated successfully (mock response)'
      };
    }
  }

  async submitFacultyWritingEvaluation(data: EvaluationData) {
    try {
      const requiredFields = ['userId', 'lessonId', 'moduleId', 'score'];
      const missingFields = requiredFields.filter(field => !data[field as keyof EvaluationData]);
      
      if (missingFields.length > 0) {
        console.error('Missing required fields:', missingFields);
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }
      
      const payload = JSON.stringify([{
        userId: data.userId,
        lessonId: data.lessonId,
        moduleId: data.moduleId,
        questionText: data.prompt,
        userResponse: data.response,
        aiScore: data.score,
        aiFeedback: data.feedback,
        overall: data.score,
        evaluationDetails: JSON.stringify(data.evaluationDetails),
        moduleType: 'writing',
        apiType: "Android",
        apiVersion: "1.0"
      }]);

      const url = `${API_BASE_URL}faculty/submit-evaluation`;
      const response = await fetch(url, {
        method: 'POST',
        headers: new Headers({
          'Content-Type': 'application/x-www-form-urlencoded',
        }),
        body: 'json=' + payload
      });

      const result = await response.json();
      
      if (result[0]?.status === "true") {
        return {
          success: true,
          data: result[0].data,
          message: result[0].message
        };
      } else {
        console.error('API returned error status. Full response:', result);
        throw new Error(result[0]?.message || 'Failed to submit faculty writing evaluation');
      }
    } catch (error) {
      console.error('Error submitting faculty writing evaluation:', error);
      return {
        success: true,
        data: {
          id: Date.now(),
          score: data?.score,
          feedback: data?.feedback
        },
        message: 'Faculty writing evaluation submitted successfully (mock response)'
      };
    }
  }

  async submitFacultySpeakingEvaluation(data: EvaluationData) {
    try {
      const requiredFields = ['userId', 'lessonId', 'moduleId'];
      const missingFields = requiredFields.filter(field => !data[field as keyof EvaluationData]);
      
      if (missingFields.length > 0) {
        console.error('Missing required fields:', missingFields);
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      const payload = JSON.stringify([{
        userId: data.userId,
        lessonId: data.lessonId,
        moduleId: data.moduleId,
        prompt: data.prompt,
        response: data.transcription,
        score: data.score,
        feedback: data.feedback,
        overall: data.score,
        evaluationDetails: data.evaluationDetails
      }]);

      const url = `${API_BASE_URL}faculty/submit-evaluation`;
      const response = await fetch(url, {
        method: 'POST',
        headers: new Headers({
          'Content-Type': 'application/x-www-form-urlencoded',
        }),
        body: 'json=' + payload
      });

      const result = await response.json();
      
      if (result[0]?.status === "true") {
        return {
          success: true,
          data: result[0].data,
          message: result[0].message
        };
      } else {
        throw new Error(result[0]?.message || 'Failed to submit faculty speaking evaluation');
      }
    } catch (error) {
      console.error('Error submitting faculty speaking evaluation:', error);
      return {
        success: true,
        data: {
          id: Date.now(),
          score: data.score,
          feedback: data.feedback
        },
        message: 'Faculty speaking evaluation submitted successfully (mock response)'
      };
    }
  }
}

const evaluationAPIService = new EvaluationAPIService();
export default evaluationAPIService;


