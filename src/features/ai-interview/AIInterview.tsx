import React, { useState, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import StreamingAvatar, {
  AvatarQuality,
  StreamingEvents,
  TaskType,
  VoiceEmotion,
} from "@heygen/streaming-avatar";
import OpenAI from "openai";
// import { Mic, MicOff, Download, Play, Pause } from "lucide-react";
import { API_BASE_URL } from "@/lib/constants";
import WelcomeDialog from "./WelcomeDialog";
// import MobileNavbar from '../components/MobileNavbar';
import { useNavigate } from "react-router";
import apiClient from "@/lib/axios";
import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";

const SpeechToText = () => {
  const navigate = useNavigate();
  // State management
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [responseText, setResponseText] = useState("");
  const [conversationHistory, setConversationHistory] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);

  // Interview specific states
  const [questionCount, setQuestionCount] = useState(0);
  const [totalQuestions] = useState(10); // 5 questions for interview
  const [assessmentComplete, setAssessmentComplete] = useState(false);
  const [assessmentScore, setAssessmentScore] = useState(null);
  const [assessmentFeedback, setAssessmentFeedback] = useState("");
  const [userVideoStream, setUserVideoStream] = useState(null);
  // Refs
  const videoRef = useRef(null);
  const sessionTokenRef = useRef(null);
  const openaiRef = useRef(null);
  const isProcessingSpeechRef = useRef(false);
  const autoListenTimeoutRef = useRef(null);
  const userVideoRef = useRef(null);
  // Add new state and refs for video recording
  const screenRecorderRef = useRef(null);
  const videoChunksRef = useRef([]);

  // Add speech recognition ref
  const recognitionRef = useRef(null);

  // Add silence detection state
  const silenceTimeoutRef = useRef(null);
  const currentTranscriptRef = useRef("");

  // Add new refs for speech control
  const avatarSpeakingTimeoutRef = useRef(null);
  const lastAvatarSpeakTimeRef = useRef(null);
  const recognitionActiveRef = useRef(false);
  const manualStopRef = useRef(false);
  const speechTimeoutRef = useRef(null);
  const lastTranscriptRef = useRef("");

  // Add new state for recognition status
  const [isRecognitionEnabled, setIsRecognitionEnabled] = useState(true);
  const recognitionStartingRef = useRef(false);

  // Add new refs for audio recording
  const audioRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  // Add these new refs and state at the top of your component
  const recognitionRestartCountRef = useRef(0);
  const recognitionCooldownRef = useRef(false);
  // Add new state for welcome dialog
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);
  const [isAudioRecording, setIsAudioRecording] = useState(false);
  const [isVideoRecording, setIsVideoRecording] = useState(false);
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);
  const [isConfigLoading, setIsConfigLoading] = useState(true);
  const [assessmentInstructions, setAssessmentInstructions] = useState("");
  const [initialInstructions, setInitialInstructions] = useState("");
  const [isAvatarInitialized, setIsAvatarInitialized] = useState(false);
  const [isAvatarLoading, setIsAvatarLoading] = useState(false);
  const [isVideoElementReady, setIsVideoElementReady] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection ✅
  useEffect(() => {
    const checkMobileSize = () => {
      const isMobileSize = window.innerWidth <= 768;
      const isMobileUserAgent =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent,
        );
      const isMobileDevice = isMobileSize || isMobileUserAgent;
      setIsMobile(isMobileDevice);
    };

    checkMobileSize();
    window.addEventListener("resize", checkMobileSize);

    return () => {
      window.removeEventListener("resize", checkMobileSize);
    };
  }, []);

  // Event handlers for avatar ✅
  const handleStreamReady = (event: StreamReadyEvent) => {
    const stream = event.detail;

    // CRITICAL: Ensure we have the stream
    if (!stream) {
      console.error("Stream ready event missing stream detail");
      return;
    }

    const videoEl = videoRef.current;

    // CRITICAL: Ensure video element exists
    if (!videoEl) {
      console.error(
        "Stream ready but video ref is not available - this should never happen!",
      );
      return;
    }

    try {
      // Attach the stream
      videoEl.srcObject = stream;

      videoEl.onloadedmetadata = () => {
        videoEl
          .play()
          .then(() => {
            setTimeout(() => {
              if (videoEl.readyState < 2) {
                console.warn("Video may not be playing properly");
              }
            }, 1000);
          })
          .catch((error) => {
            console.error("Error playing video:", error);
          });
      };

      videoEl.onerror = (error) => {
        console.error("Video element error:", error);
      };

      videoEl.onstalled = () => {
        console.warn("Video stream stalled");
      };

      // onwaiting / oncanplay intentionally silent
    } catch (error) {
      console.error("Error setting video stream:", error);
    }
  };

  // ✅
  const handleAvatarStartTalking = (event: AvatarStartTalkingEvent) => {
    setIsSpeaking(true);
    setIsListening(false);
    setIsRecognitionEnabled(false);

    // CRITICAL: Reset restart counter when avatar speaks
    recognitionRestartCountRef.current = 0;
    recognitionCooldownRef.current = false;

    // Ensure audio is enabled when avatar starts talking
    const videoEl = videoRef.current;
    if (videoEl && videoEl.muted) {
      videoEl.muted = false;
      videoEl.volume = 1.0;
    }

    // Stop speech recognition and clear timeouts
    stopRecognition();
    clearSpeechTimeouts();

    // Update last speak time
    lastAvatarSpeakTimeRef.current = Date.now();
  };

  // ✅
  const handleAvatarTalkingMessage = (event: AvatarTalkingMessageEvent) => {
    // Update last speak time to maintain accurate tracking
    lastAvatarSpeakTimeRef.current = Date.now();

    // Update response text with current message if available
    if (event.detail?.text) {
      setResponseText(event.detail.text);
    }
  };

  // ✅
  const handleAvatarEndMessage = (event: AvatarEndMessageEvent) => {
    lastAvatarSpeakTimeRef.current = Date.now();

    setIsSpeaking(false);

    // 🔒 Browser audio settle guard
    speechBlockedUntilRef.current = Date.now() + 1500;

    if (event.detail?.text) {
      setResponseText(event.detail.text);
    }
  };

  // ✅
  const handleAvatarStopTalking = () => {
    setIsSpeaking(false);

    // Clear any existing timeouts
    clearSpeechTimeouts();

    // Wait for a moment to ensure avatar has completely finished
    avatarSpeakingTimeoutRef.current = setTimeout(() => {
      // Double check that we should start listening
      if (
        !isThinking &&
        !assessmentComplete &&
        !isProcessingSpeechRef.current
      ) {
        setIsRecognitionEnabled(true);

        // Add a small delay before starting recognition
        setTimeout(() => {
          if (
            !isSpeaking &&
            !isThinking &&
            !recognitionStartingRef.current &&
            !isProcessingSpeechRef.current
          ) {
            // Clear any existing transcript
            currentTranscriptRef.current = "";
            setTranscription("");
            startRecognition();
          }
        }, 500);
      }
    }, 1000);
  };

  // ✅
  const handleStreamDisconnected = () => {
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsSessionActive(false);
    setIsListening(false);
  };

  // ✅
  const handleUserStart = () => {
    // Only set listening if we're not in avatar speech cooldown
    const timeSinceLastSpeak =
      Date.now() - (lastAvatarSpeakTimeRef.current || 0);

    if (timeSinceLastSpeak >= 1000) {
      setIsListening(true);
    }
  };

  // ✅
  const handleUserTalkingMessage = (event: UserTalkingMessageEvent) => {
    // Update transcript if we're in a valid listening state
    const timeSinceLastSpeak =
      Date.now() - (lastAvatarSpeakTimeRef.current || 0);

    if (timeSinceLastSpeak >= 1000 && !isSpeaking && !isThinking) {
      setTranscription(event.detail?.text || "");
    }
  };

  // ✅
  const handleUserStop = () => {
    // Only process stop if we were actually listening
    if (isListening) {
      setIsListening(false);
    }
  };

  // ✅
  const handleUserEndMessage = async (event: UserEndMessageEvent) => {
    const transcript = event.detail?.text;

    // Verify this is a valid user message
    if (
      transcript &&
      !isProcessingSpeechRef.current &&
      !isSpeaking &&
      !isThinking
    ) {
      isProcessingSpeechRef.current = true;
      setTranscription(transcript);

      try {
        // Process the user's message
        await handleUserMessage(transcript);
      } catch (error) {
        console.error("Error processing user message:", error);

        isProcessingSpeechRef.current = false;

        // Attempt to restart recognition after error
        setTimeout(() => {
          if (isRecognitionEnabled && !isSpeaking && !isThinking) {
            startRecognition();
          }
        }, 1000);
      }
    }
  };
  // ✅
  const handleUserMessage = async (transcript: string) => {
    if (!transcript || isProcessingSpeechRef.current) return;

    // Stop listening while processing
    if (recognitionRef.current) {
      stopRecognition();
    }

    clearSilenceTimeout(silenceTimeoutRef);

    isProcessingSpeechRef.current = true;
    setIsThinking(true);
    setIsListening(false);

    try {
      // Add user message to conversation history
      const updatedHistory = [
        ...conversationHistory,
        { role: "user", content: transcript },
      ];
      setConversationHistory(updatedHistory);

      // If we've reached our question limit, generate final assessment
      if (questionCount >= totalQuestions) {
        await generateAssessment();
        return;
      }

      // Get AI response - use interview-specific model if set, otherwise fall back to general model or gpt-4o
      const model =
        import.meta.env.VITE_OPENAI_MODEL_INTERVIEW ||
        import.meta.env.VITE_OPENAI_MODEL ||
        "gpt-4o";
      const completion = await openaiRef.current.chat.completions.create({
        model: model,
        messages: updatedHistory,
        max_tokens: 150,
        temperature: 0.7,
      });

      const response = completion.choices[0].message.content;

      // Update response text with latest response
      setResponseText(response);

      // Add response to conversation history
      setConversationHistory([
        ...updatedHistory,
        { role: "assistant", content: response },
      ]);

      // Increment question count
      setQuestionCount((prevCount) => prevCount + 1);

      // Clear the current transcript
      currentTranscriptRef.current = "";
      setTranscription("");

      // Speak the response
      if (avatar) {
        try {
          await avatar.speak({
            text: response,
            taskType: TaskType.REPEAT,
          });
        } catch (error) {
          console.error("Error speaking response:", error);
        }
      }
    } catch (error) {
      console.error("Error processing user message:", error);
    } finally {
      setIsThinking(false);
      isProcessingSpeechRef.current = false;

      // Restart listening after a short delay
      if (isSessionActive && !assessmentComplete) {
        setTimeout(() => {
          if (
            recognitionRef.current &&
            !isSpeaking &&
            !isThinking &&
            !isProcessingSpeechRef.current
          ) {
            startRecognition();
          }
        }, 1000);
      }
    }
  };

  // Initialize Avatar ✅
  const { data: token } = useHeygenAccessToken();
  const initializeAvatarMutation = useInitializeAvatar({
    videoRef,
    avatar,
    handleStreamReady,
    handleAvatarStartTalking,
    handleAvatarStopTalking,
    handleStreamDisconnected,
    handleAvatarTalkingMessage,
    handleAvatarEndMessage,
    handleUserStart,
    handleUserStop,
    handleUserEndMessage,
    handleUserTalkingMessage,
  });

  const initializeAvatar = async () => {
    // Guard: Prevent multiple simultaneous initializations
    if (isAvatarLoading || isAvatarInitialized || avatar !== null) {
      console.log("Avatar initialization already in progress or completed");
      return;
    }

    setIsAvatarLoading(true);

    try {
      if (!videoRef.current) {
        toast.error("Video element not available. Please refresh.");
        setIsAvatarLoading(false);
        return;
      }

      if (!token) {
        toast.error("Failed to initialize avatar: Could not get access token");
        setIsAvatarLoading(false);
        return;
      }

      sessionTokenRef.current = token;

      const streamingAvatar = await initializeAvatarMutation.mutateAsync(token);

      setAvatar(streamingAvatar);
      setIsAvatarInitialized(true);

      setTimeout(() => {
        if (videoRef.current && !videoRef.current.srcObject) {
          forceAvatarRefresh();
        }
      }, 3000);
    } catch (error: any) {
      let errorMessage = "Failed to initialize avatar";

      if (error.message?.includes("timeout")) {
        errorMessage = "Avatar initialization timed out.";
      } else if (error.message?.includes("token")) {
        errorMessage = "Failed to get avatar access token.";
      }

      toast.error(errorMessage);
    } finally {
      setIsAvatarLoading(false);
    }
  };

  // Initialize OpenAI ✅
  useInitializeOpenAI({
    openaiRef,
    setConversationHistory,
    setAssessmentInstructions,
    setInitialInstructions,
    setIsConfigLoaded,
    setIsConfigLoading,
    videoRef,
    isVideoElementReady,
    initializeAvatar,
  });

  // CRITICAL: Initialize avatar when video element becomes ready (if config is already loaded) ✅
  useEffect(() => {
    // Guard: Only initialize if all conditions are met and not already initialized
    if (
      isConfigLoaded &&
      !isConfigLoading &&
      videoRef.current &&
      isVideoElementReady &&
      !isAvatarInitialized &&
      !isAvatarLoading &&
      token && // Ensure token is available
      avatar === null // Ensure avatar is not already set
    ) {
      initializeAvatar();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isConfigLoaded,
    isConfigLoading,
    isVideoElementReady,
    isAvatarInitialized,
    isAvatarLoading,
    token, // Add token as dependency
    // Note: initializeAvatar and avatar are intentionally excluded to prevent infinite loops
  ]);

  // ✅
  const retryAvatarInitialization = async () => {
    await initializeAvatar();
  };

  // Add force refresh function for avatar ✅
  const forceAvatarRefresh = async () => {
    try {
      if (avatar) {
        await avatar.stopAvatar();
      }

      setAvatar(null);
      setIsAvatarInitialized(false);
      setIsAvatarLoading(false);

      // Wait a moment then reinitialize
      setTimeout(() => {
        initializeAvatar().catch((error) => {
          console.error("Error reinitializing avatar:", error);
        });
      }, 1000);
    } catch (error) {
      console.error("Error in force refresh:", error);
    }
  };

  const lastRestartAtRef = useRef<number>(0);
  const consecutiveErrorCountRef = useRef<number>(0);
  const speechBlockedUntilRef = useRef<number>(0);

  // CRITICAL MOBILE FIXES FOR SPEECH RECOGNITION ✅
  useEffect(() => {
    if (
      !("webkitSpeechRecognition" in window || "SpeechRecognition" in window)
    ) {
      console.error("❌ Speech recognition NOT supported in this browser");
      toast.error(
        "Speech recognition not supported. Please use Chrome or Safari.",
      );
      return;
    }

    const SpeechRecognition =
      window.webkitSpeechRecognition || window.SpeechRecognition;

    const recognition = new SpeechRecognition();

    const clearSpeechTimeout = () => {
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
        speechTimeoutRef.current = null;
      }
    };

    const clearSilenceTimeout = () => {
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
    };

    const canAutoRestart = () => {
      const now = Date.now();
      if (now - lastRestartAtRef.current < 3000) {
        return false;
      }
      lastRestartAtRef.current = now;
      return true;
    };

    // Configuration
    recognition.continuous = !isMobile;
    recognition.interimResults = !isMobile;
    recognition.maxAlternatives = 1;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      recognitionStartingRef.current = false;
      recognitionActiveRef.current = true;
      setIsListening(true);

      // Successful start resets error counter
      consecutiveErrorCountRef.current = 0;

      clearSpeechTimeout();

      // Mobile: auto-stop if no speech detected
      if (isMobile) {
        speechTimeoutRef.current = setTimeout(() => {
          if (
            recognitionActiveRef.current &&
            !lastTranscriptRef.current &&
            recognitionRef.current
          ) {
            try {
              recognitionRef.current.stop();
            } catch (e) {
              console.error("Error stopping recognition:", e);
            }
          }
        }, 10000);
      }
    };

    recognition.onend = () => {
      recognitionActiveRef.current = false;
      recognitionStartingRef.current = false;

      clearSpeechTimeout();
      clearSilenceTimeout();

      // Process pending transcript
      if (lastTranscriptRef.current && !isProcessingSpeechRef.current) {
        const transcript = lastTranscriptRef.current;
        lastTranscriptRef.current = "";
        handleUserMessage(transcript);
        manualStopRef.current = false;
        return;
      }

      const shouldAutoRestart =
        !manualStopRef.current &&
        isRecognitionEnabled &&
        isSessionActive &&
        !isSpeaking &&
        !isThinking &&
        !isProcessingSpeechRef.current &&
        !assessmentComplete;

      if (shouldAutoRestart) {
        if (!canAutoRestart()) {
          manualStopRef.current = false;
          return;
        }

        const delay = isMobile ? 1000 : 500;

        setTimeout(() => {
          if (
            isRecognitionEnabled &&
            !recognitionStartingRef.current &&
            !recognitionActiveRef.current &&
            !isSpeaking &&
            !isThinking &&
            !isProcessingSpeechRef.current
          ) {
            startRecognition();
          }
        }, delay);
      } else {
        setIsListening(false);
      }

      manualStopRef.current = false;
    };

    recognition.onerror = (event) => {
      console.error("❌ Speech recognition ERROR:", event.error);

      recognitionActiveRef.current = false;
      recognitionStartingRef.current = false;
      setIsListening(false);

      clearSpeechTimeout();
      clearSilenceTimeout();

      consecutiveErrorCountRef.current += 1;

      // Hard stop after repeated failures (browser instability)
      if (consecutiveErrorCountRef.current >= 5) {
        console.error("Speech recognition disabled due to repeated errors");
        return;
      }

      if (!canAutoRestart()) {
        return;
      }

      switch (event.error) {
        case "no-speech":
          if (isMobile && isRecognitionEnabled && !isSpeaking) {
            setTimeout(() => startRecognition(), 1000);
          }
          break;

        case "aborted":
          // Normal during avatar speech
          break;

        case "audio-capture":
          toast.error("Cannot access microphone. Please check permissions.");
          break;

        case "not-allowed":
          toast.error(
            "Microphone permission denied. Please allow and refresh.",
          );
          break;

        case "network":
          if (isRecognitionEnabled && !isSpeaking) {
            setTimeout(() => startRecognition(), 2000);
          }
          break;

        default:
          if (isRecognitionEnabled && !isSpeaking && !isThinking) {
            setTimeout(() => startRecognition(), 2000);
          }
      }
    };

    recognition.onresult = (event) => {
      let transcript = "";
      let isFinal = false;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        transcript += result[0].transcript;
        if (result.isFinal) {
          isFinal = true;
        }
      }

      setTranscription(transcript);
      currentTranscriptRef.current = transcript;
      lastTranscriptRef.current = transcript;

      clearSilenceTimeout();

      // Mobile: process immediately
      if (isMobile && isFinal && transcript.trim()) {
        lastTranscriptRef.current = "";

        if (recognitionRef.current && recognitionActiveRef.current) {
          try {
            manualStopRef.current = true;
            recognitionRef.current.stop();
          } catch (e) {
            console.error("Error stopping recognition:", e);
          }
        }

        handleUserMessage(transcript.trim());
      }
      // Desktop: silence detection
      else if (
        !isMobile &&
        !isSpeaking &&
        !isThinking &&
        !isProcessingSpeechRef.current
      ) {
        silenceTimeoutRef.current = setTimeout(() => {
          if (
            currentTranscriptRef.current.trim() &&
            !isProcessingSpeechRef.current
          ) {
            handleUserMessage(currentTranscriptRef.current.trim());
          }
        }, 2000);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        stopRecognition();
      }
      clearSpeechTimeout();
      clearSilenceTimeout();
    };
  }, [
    isSessionActive,
    isSpeaking,
    isThinking,
    assessmentComplete,
    isRecognitionEnabled,
    isMobile,
  ]);

  // Cleanup on unmount ✅
  useEffect(() => {
    return () => {
      void cleanupSession();
    };
  }, []);

  // Monitor avatar initialization status ✅
  // useEffect(() => {
  //   if (!isAvatarInitialized || !avatar) return;

  //   const timeoutId = window.setTimeout(() => {
  //     if (videoRef.current && !videoRef.current.srcObject) {
  //       // intentionally left silent; this is a diagnostic check only
  //     }
  //   }, 2000);

  //   return () => {
  //     clearTimeout(timeoutId);
  //   };
  // }, [isAvatarInitialized, avatar]);

  // Monitor video element for issues ✅
  // useEffect(() => {
  //   if (!isAvatarInitialized || !videoRef.current) return;

  //   const checkVideoHealth = () => {
  //     const video = videoRef.current;
  //     if (!video) return;

  //     if (video.readyState === 0 && video.srcObject) {
  //       // diagnostic check only – intentionally silent
  //     }
  //   };

  //   const timeoutId = window.setTimeout(checkVideoHealth, 3000);

  //   return () => {
  //     clearTimeout(timeoutId);
  //   };
  // }, [isAvatarInitialized]);

  // Ensure video ref is properly set up ✅
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.autoplay = true;
    video.playsInline = true;
    video.muted = true; // Mute to avoid audio feedback
  }, []);

  // Add video ref callback to handle mounting ✅
  const setVideoRef = (element: HTMLVideoElement | null) => {
    // Unmount case
    if (!element) {
      videoRef.current = null;
      setIsVideoElementReady(false);
      return;
    }

    videoRef.current = element;

    // Initial video configuration
    element.autoplay = true;
    element.playsInline = true;
    element.volume = 1.0;

    setIsVideoElementReady(true);

    const ensureAudioEnabled = () => {
      if (element.muted) {
        element.muted = false;
        element.volume = 1.0;
      }
    };

    const handleLoadedMetadata = () => {
      ensureAudioEnabled();
    };

    const handleCanPlay = () => {
      ensureAudioEnabled();
    };

    const handleError = (error: Event) => {
      console.error("Video element error:", error);
    };

    // Attach listeners
    element.addEventListener("loadedmetadata", handleLoadedMetadata);
    element.addEventListener("canplay", handleCanPlay);
    element.addEventListener("error", handleError);
    element.addEventListener("click", ensureAudioEnabled);
    document.addEventListener("click", ensureAudioEnabled, { once: true });

    // Cleanup when ref changes or unmounts
    const cleanup = () => {
      element.removeEventListener("loadedmetadata", handleLoadedMetadata);
      element.removeEventListener("canplay", handleCanPlay);
      element.removeEventListener("error", handleError);
      element.removeEventListener("click", ensureAudioEnabled);
      document.removeEventListener("click", ensureAudioEnabled);
    };

    // Store cleanup on the element to allow manual invocation if needed
    (element as any).__cleanup__ = cleanup;
  };

  // Guard: prevent avatar loading when video element is not ready ✅
  useEffect(() => {
    if (isAvatarLoading && (!videoRef.current || !isVideoElementReady)) {
      console.error(
        "Avatar loading started but video element is not ready - stopping avatar loading",
      );
      setIsAvatarLoading(false);
      // toast.error("Video element not ready. Please refresh the page.");
    }
  }, [isAvatarLoading, isVideoElementReady]);

  //  ✅
  const cleanupUserCamera = () => {
    if (!userVideoStream) return;

    try {
      userVideoStream.getTracks().forEach((track) => track.stop());

      if (userVideoRef.current) {
        userVideoRef.current.srcObject = null;
      }

      setUserVideoStream(null);
    } catch (error) {
      console.error("Error cleaning up user camera:", error);
    }
  };

  //  ✅
  const cleanupAudio = () => {
    stopAudioRecording();
    clearSpeechTimeouts();
  };

  //  ✅
  const cleanupSpeechRecognition = () => {
    if (!recognitionRef.current) return;
    stopRecognition();
  };

  //  ✅
  const cleanupVideoRecording = () => {
    stopVideoRecording();
  };

  //  ✅
  const resetSessionState = () => {
    setAvatar(null);
    setIsSessionActive(false);
    setIsLoading(false);
    setIsSpeaking(false);
    setIsListening(false);
    setIsAvatarInitialized(false);
    lastAvatarSpeakTimeRef.current = null;
  };

  //  ✅
  const cleanupSession = async () => {
    await cleanupAvatar();
    cleanupUserCamera();
    cleanupAudio();
    cleanupSpeechRecognition();
    cleanupVideoRecording();
    resetSessionState();
  };

  //  ✅
  const cleanupAvatar = async () => {
    if (!avatar) return;

    try {
      avatar.off(StreamingEvents.STREAM_READY, handleStreamReady);
      avatar.off(
        StreamingEvents.AVATAR_START_TALKING,
        handleAvatarStartTalking,
      );
      avatar.off(StreamingEvents.AVATAR_STOP_TALKING, handleAvatarStopTalking);
      avatar.off(StreamingEvents.STREAM_DISCONNECTED, handleStreamDisconnected);
      avatar.off(
        StreamingEvents.AVATAR_TALKING_MESSAGE,
        handleAvatarTalkingMessage,
      );
      avatar.off(StreamingEvents.AVATAR_END_MESSAGE, handleAvatarEndMessage);
      avatar.off(StreamingEvents.USER_START, handleUserStart);
      avatar.off(StreamingEvents.USER_STOP, handleUserStop);
      avatar.off(StreamingEvents.USER_END_MESSAGE, handleUserEndMessage);
      avatar.off(
        StreamingEvents.USER_TALKING_MESSAGE,
        handleUserTalkingMessage,
      );

      await avatar.stopAvatar();
    } catch (error) {
      console.error("Error stopping avatar:", error);
    }
  };

  // Improved user camera initialization ✅
  const initUserCamera = async (): Promise<boolean> => {
    try {
      // Request user video stream for local preview
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
      });

      setUserVideoStream(stream);

      const videoElement = userVideoRef.current;
      if (videoElement) {
        videoElement.srcObject = stream;

        videoElement.onloadedmetadata = () => {
          videoElement
            .play()
            .catch((err) => console.error("Error playing user video:", err));
        };
      }

      return true;
    } catch (error) {
      console.error("Error accessing user camera:", error);
      alert(
        "Could not access your camera. Please check permissions and try again.",
      );
      return false;
    }
  };

  // Initialize session with voice chat ✅
  const initializeSession = async (): Promise<void> => {
    try {
      // Ensure configuration is loaded
      if (!isConfigLoaded) {
        // toast.error("Interview configuration is not loaded. Please wait or refresh the page.");
        return;
      }

      // Ensure avatar is ready
      if (!isAvatarInitialized) {
        // toast.error("Avatar is not ready. Please wait for avatar to load.");
        return;
      }

      // Start the session
      await startActualSession();
    } catch (error) {
      console.error("Error initializing session:", error);
      // toast.error("Failed to start interview session");
      cleanupSession();
      setIsLoading(false);
    }
  };

  // Add new function to actually start the session after forms are completed
  const startActualSession = async () => {
    try {
      // Check if configuration is loaded
      if (!isConfigLoaded) {
        // toast.error("Interview configuration is not loaded. Please wait or refresh the page.");
        return;
      }

      setIsLoading(true);

      // Request microphone permission (mobile-aware)
      console.log("Requesting microphone permission", { isMobile });
      try {
        const audioConstraints = isMobile
          ? {
              audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                // Mobile browsers need these additional constraints
                sampleRate: 44100,
                channelCount: 1,
              },
            }
          : {
              audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
              },
            };

        const stream =
          await navigator.mediaDevices.getUserMedia(audioConstraints);
        // Stop the stream immediately as we just needed permission
        stream.getTracks().forEach((track) => track.stop());
        console.log("Microphone permission granted", { isMobile });

        // Mobile browsers need a small delay after permission
        if (isMobile) {
          console.log("Mobile: Adding delay after permission grant");
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.error("Microphone permission denied:", error);
        toast.error(
          "Microphone access is required. Please allow microphone access and try again.",
        );
        setIsLoading(false);
        return;
      }

      // Initialize user camera first
      const cameraInitialized = await initUserCamera();
      if (!cameraInitialized) {
        setIsLoading(false);
        return;
      }

      // Start audio recording
      await startAudioRecording();

      // Start video recording (different approach for mobile vs desktop)
      if (isMobile) {
        console.log("Mobile device - starting mobile video recording");
        await startMobileVideoRecording();
      } else {
        console.log("Desktop device - starting desktop video recording");
        await startVideoRecording();
      }

      // Reset interview states
      setQuestionCount(0);
      setAssessmentComplete(false);
      setAssessmentScore(null);
      setAssessmentFeedback("");

      // Set session as active
      setIsSessionActive(true);
      setIsLoading(false);

      // Initial greeting
      const initialGreeting = initialInstructions;
      // Add the initial greeting to conversation history
      const updatedHistory = [
        ...conversationHistory.slice(0, 1), // Keep only the system message
        { role: "assistant", content: initialGreeting },
      ];
      setConversationHistory(updatedHistory);

      setResponseText(initialGreeting);
      setQuestionCount(1);

      // Speak greeting
      if (avatar) {
        try {
          await avatar.speak({
            text: initialGreeting,
            taskType: TaskType.REPEAT,
          });
        } catch (error) {
          console.error("Error speaking greeting:", error);
          // toast.error("Error speaking greeting");
        }
      }
    } catch (error) {
      console.error("Error starting actual session:", error);
      // toast.error("Failed to start interview session");
      cleanupSession();
      setIsLoading(false);
    }
  };

  // Mobile video recording - only user camera (no screen recording)
  const startMobileVideoRecording = async () => {
    try {
      console.log("Starting mobile video recording (user camera only)...");

      // Check if user camera is available
      if (!userVideoStream) {
        console.error("User camera stream not available for mobile recording");
        throw new Error("User camera not available");
      }

      // Create MediaRecorder for user camera only
      const mediaRecorder = new MediaRecorder(userVideoStream, {
        mimeType: "video/webm",
        videoBitsPerSecond: 1500000, // Lower bitrate for mobile
      });

      videoChunksRef.current = [];

      // Handle recording data
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          videoChunksRef.current.push(event.data);
        }
      };

      // Start recording
      mediaRecorder.start(1000); // Capture chunks every second

      // Store references for cleanup
      screenRecorderRef.current = mediaRecorder;
      screenRecorderRef.current.userVideoStream = userVideoStream;

      setIsVideoRecording(true);
      console.log("Mobile video recording started (user camera only)");
    } catch (error) {
      console.error("Error starting mobile video recording:", error);
      // Don't throw error - just log it and continue without video recording
      console.log("Continuing without video recording on mobile");
      setIsVideoRecording(false);
    }
  };

  // Desktop video recording - screen + user camera
  const startVideoRecording = async () => {
    try {
      // Get the current tab for recording
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: "browser",
          selfBrowserSurface: "include",
          systemAudio: "exclude",
          surfaceSwitching: "exclude",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 },
        },
        audio: false,
        preferCurrentTab: true,
      });

      // Create a composite canvas to combine screen and user camera
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // Set canvas size based on screen stream
      const videoTrack = screenStream.getVideoTracks()[0];
      const { width, height } = videoTrack.getSettings();
      canvas.width = width;
      canvas.height = height;

      // Create video elements for both streams
      const screenVideo = document.createElement("video");
      const userVideo = document.createElement("video");

      // Set up screen video
      screenVideo.srcObject = screenStream;
      await screenVideo.play();

      // Set up user video if available
      if (userVideoStream) {
        userVideo.srcObject = userVideoStream;
        await userVideo.play();
      }

      // Create MediaRecorder with WebM format (we'll convert to MP4 later)
      const canvasStream = canvas.captureStream(30); // 30 FPS
      const recorder = new MediaRecorder(canvasStream, {
        mimeType: "video/webm",
        videoBitsPerSecond: 3000000, // 3 Mbps for good quality
      });

      videoChunksRef.current = [];

      // Handle recording data
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          videoChunksRef.current.push(event.data);
        }
      };

      // Draw function to combine both videos
      const drawFrame = () => {
        // Draw screen content
        ctx.drawImage(screenVideo, 0, 0, canvas.width, canvas.height);

        // Draw user camera in top-right corner if available
        if (userVideoStream && userVideo.videoWidth) {
          const userWidth = canvas.width * 0.2; // 20% of screen width
          const userHeight =
            (userVideo.videoHeight / userVideo.videoWidth) * userWidth;
          ctx.drawImage(
            userVideo,
            canvas.width - userWidth - 20, // 20px padding from right
            20, // 20px padding from top
            userWidth,
            userHeight,
          );
        }

        // Continue animation if recording
        if (recorder.state === "recording") {
          requestAnimationFrame(drawFrame);
        }
      };

      // Start recording process
      recorder.start(1000); // Capture chunks every second
      drawFrame(); // Start the drawing loop

      // Store references for cleanup
      screenRecorderRef.current = recorder;
      screenRecorderRef.current.screenStream = screenStream;
      screenRecorderRef.current.canvasStream = canvasStream;
      screenRecorderRef.current.screenVideo = screenVideo;
      screenRecorderRef.current.userVideo = userVideo;
      screenRecorderRef.current.canvas = canvas;

      setIsVideoRecording(true);
      console.log("Started recording with combined video feeds");
    } catch (error) {
      console.error("Error starting video recording:", error);
      // toast.error('Failed to start video recording');
      throw error;
    }
  };

  // Stop video recording (handles both mobile and desktop)
  const stopVideoRecording = () => {
    if (screenRecorderRef.current) {
      try {
        // Stop the MediaRecorder if still recording
        if (screenRecorderRef.current.state !== "inactive") {
          screenRecorderRef.current.stop();
        }

        // Desktop recording cleanup
        if (screenRecorderRef.current.screenStream) {
          screenRecorderRef.current.screenStream
            .getTracks()
            .forEach((track) => track.stop());
        }

        if (screenRecorderRef.current.canvasStream) {
          screenRecorderRef.current.canvasStream
            .getTracks()
            .forEach((track) => track.stop());
        }

        // Clean up video elements
        if (screenRecorderRef.current.screenVideo) {
          screenRecorderRef.current.screenVideo.srcObject = null;
        }
        if (screenRecorderRef.current.userVideo) {
          screenRecorderRef.current.userVideo.srcObject = null;
        }

        // Mobile recording cleanup
        if (screenRecorderRef.current.userVideoStream) {
          // Don't stop user video stream as it's still being used for display
          console.log(
            "Mobile video recording stopped (user camera stream preserved)",
          );
        }

        setIsVideoRecording(false);
        console.log("Video recording stopped and cleaned up");
      } catch (error) {
        console.error("Error stopping video recording:", error);
      }
    }
  };

  // Add audio recording functions
  const startAudioRecording = async () => {
    try {
      console.log("Starting audio recording...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream);
      audioRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(1000); // Collect chunks every second
      setIsAudioRecording(true);
      console.log("Audio recording started");
    } catch (error) {
      console.error("Error starting audio recording:", error);
      toast.error(
        "Failed to start audio recording. Please make sure to grant microphone permission.",
      );
      throw error;
    }
  };

  const stopAudioRecording = () => {
    if (
      audioRecorderRef.current &&
      audioRecorderRef.current.state !== "inactive"
    ) {
      audioRecorderRef.current.stop();
      audioRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
      setIsAudioRecording(false);
      console.log("Audio recording stopped");
    }
  };

  const getRecordedAudioBlob = () => {
    if (audioChunksRef.current.length === 0) {
      throw new Error("No audio recording available");
    }
    return new Blob(audioChunksRef.current, { type: "audio/webm" });
  };

  // Modify generateAssessment to ensure recording stops
  const generateAssessment = async () => {
    try {
      setIsLoading(true);

      // Stop recordings first (only stop video recording if it was started)
      if (!isMobile) {
        stopVideoRecording();
      }
      stopAudioRecording();

      // Create assessment prompt using the instructions from the API
      const assessmentPrompt = {
        role: "system",
        content: assessmentInstructions,
      };

      console.log(
        "Using assessment instructions:",
        assessmentInstructions ? "From API" : "Fallback",
      );
      console.log("Assessment instructions :", assessmentInstructions);

      // Get complete conversation history
      const updatedHistory = [...conversationHistory, assessmentPrompt];

      // Generate assessment - use interview-specific model if set, otherwise fall back to general model or gpt-4o
      const model =
        import.meta.env.VITE_OPENAI_MODEL_INTERVIEW ||
        import.meta.env.VITE_OPENAI_MODEL ||
        "gpt-4o";
      const completion = await openaiRef.current.chat.completions.create({
        model: model,
        messages: updatedHistory,
        max_tokens: 500,
        temperature: 0.7,
      });

      // Get response
      const assessmentText = completion.choices[0].message.content;

      console.log("=== ASSESSMENT TEXT DEBUG ===");
      console.log(
        "Assessment text length:",
        assessmentText.length,
        "characters",
      );
      console.log(
        "Assessment text preview:",
        assessmentText.substring(0, 300) + "...",
      );
      console.log("=== END ASSESSMENT TEXT DEBUG ===");

      // Extract overall score (find number between 1-10)
      const scoreMatch =
        assessmentText.match(
          /Overall Business Readiness Score:?\s*(\d+\.?\d*)/i,
        ) ||
        assessmentText.match(/Overall Score:?\s*(\d+\.?\d*)/i) ||
        assessmentText.match(/Overall:?\s*(\d+\.?\d*)/i) ||
        assessmentText.match(/\boverall\b.{0,20}(\d+\.?\d*)\/10/i);
      const score = scoreMatch ? parseFloat(scoreMatch[1]) : null;

      // Set assessment states
      setAssessmentFeedback(assessmentText);
      setAssessmentScore(score);
      setAssessmentComplete(true);

      // Add to conversation history
      setConversationHistory([
        ...updatedHistory,
        { role: "assistant", content: assessmentText },
      ]);

      // Get user data from localStorage
      const userDataString = localStorage.getItem("USER_DATA");
      const userData = userDataString ? JSON.parse(userDataString) : {};
      const firstName =
        userData.userFirstName ||
        localStorage.getItem("USER_NAME")?.split(" ")[0] ||
        "Test";
      const lastName =
        userData.userLastName ||
        localStorage.getItem("USER_NAME")?.split(" ")[1] ||
        "User";
      const candidateId = userData.userID || "UNKNOWN";

      // Get assessment data from localStorage if available
      const assessmentDataString = localStorage.getItem("ASSESSMENT_DATA");
      const assessmentData = assessmentDataString
        ? JSON.parse(assessmentDataString)
        : null;

      // Get all assessment scores from localStorage
      const assessmentScoresString = localStorage.getItem(
        "ASSESSMENT_FINAL_SCORES",
      );
      const assessmentScores = assessmentScoresString
        ? JSON.parse(assessmentScoresString)
        : {};

      // Get actual writing text content and speaking audio URL from localStorage
      const assessmentWritingTextContent =
        localStorage.getItem("ASSESSMENT_WRITING_TEXT_CONTENT") || "";
      const assessmentSpeakingAudioUrl =
        localStorage.getItem("ASSESSMENT_SPEAKING_AUDIO_URL") || "";
      const assessmentSpeakingServerUrl =
        localStorage.getItem("ASSESSMENT_SPEAKING_SERVER_URL") || "";

      console.log("Assessment scores from localStorage:", assessmentScores);
      console.log(
        "Assessment writing text content:",
        assessmentWritingTextContent,
      );
      console.log("Assessment speaking audio URL:", assessmentSpeakingAudioUrl);
      console.log(
        "Assessment speaking server URL:",
        assessmentSpeakingServerUrl,
      );

      // Verify all required scores are present
      const requiredScores = [
        "assessment_speakingScore",
        "assessment_writingScore",
        "assessment_listeningScore",
        "assessment_readingScore",
        "assessment_generalScore",
        "assessment_decisionMaking_generalScore",
        "assessment_businessEtiquette_generalScore",
        "assessment_communicationSkills_generalScore",
      ];

      console.log("=== ASSESSMENT SCORES VERIFICATION BEFORE UPLOAD ===");
      requiredScores.forEach((scoreKey) => {
        const value = assessmentScores[scoreKey];
        console.log(
          `${scoreKey}: ${value} (${value !== undefined && value !== null ? "Present" : "Missing"})`,
        );
      });
      console.log("=== END ASSESSMENT SCORES VERIFICATION ===");

      // Upload interview files AFTER we have the score
      let fileUrls = {};
      try {
        // Get recorded audio blob from our own recording
        const audioBlob = getRecordedAudioBlob();

        // Create transcript text from conversation history
        const transcriptText = conversationHistory
          .map(
            (msg) =>
              `${msg.role === "system" ? "System" : msg.role === "assistant" ? "Interviewer" : "Candidate"}: ${msg.content}`,
          )
          .join("\n\n");

        // Upload files - on mobile, skip video file
        if (isMobile) {
          console.log("Mobile detected - uploading without video file");
          fileUrls = await uploadInterviewFilesMobile(
            audioBlob,
            transcriptText,
          );
        } else {
          console.log("Desktop detected - uploading with video file");
          fileUrls = await uploadInterviewFiles(audioBlob, transcriptText);
        }

        // Create interview data object with actual file URLs and score
        const interviewData = {
          candidateId: candidateId,
          firstName: firstName,
          lastName: lastName,
          audioUrl: fileUrls.audioUrl,
          interviewVideo:
            fileUrls.videoUrl ||
            (isMobile ? "Mobile - No Video Recording" : ""),
          interviewText: fileUrls.textUrl,
          communiqateAiScore: score,
          score: score,
          // Add explanation and interview transcript - use assessmentText directly for explanation
          explanation: assessmentText || "",
          interviewTranscript: transcriptText || "",
          // Add assessment URLs and content - use server URL for speaking, actual content for writing
          speakingURL:
            assessmentSpeakingServerUrl ||
            assessmentSpeakingAudioUrl ||
            assessmentData?.speakingURL ||
            "",
          writingText:
            assessmentWritingTextContent || assessmentData?.writingText || "",
          // Add scores from assessment if available - use localStorage scores as primary source
          assessment_speakingScore:
            assessmentScores.assessment_speakingScore ||
            assessmentData?.assessment_speakingScore ||
            0,
          assessment_writingScore:
            assessmentScores.assessment_writingScore ||
            assessmentData?.assessment_writingScore ||
            0,
          assessment_readingScore:
            assessmentScores.assessment_readingScore ||
            assessmentData?.assessment_readingScore ||
            0,
          assessment_listeningScore:
            assessmentScores.assessment_listeningScore ||
            assessmentData?.assessment_listeningScore ||
            0,
          assessment_generalScore:
            assessmentScores.assessment_generalScore ||
            assessmentData?.assessment_generalScore ||
            0,
          // Add category-specific general scores
          assessment_decisionMaking_generalScore:
            assessmentScores.assessment_decisionMaking_generalScore || 0,
          assessment_businessEtiquette_generalScore:
            assessmentScores.assessment_businessEtiquette_generalScore || 0,
          assessment_communicationSkills_generalScore:
            assessmentScores.assessment_communicationSkills_generalScore || 0,
        };

        console.log("Complete interview data to be uploaded:", interviewData);

        // Debug: Log all assessment scores specifically
        console.log("=== ASSESSMENT SCORES DEBUG ===");
        console.log(
          "assessment_speakingScore:",
          interviewData.assessment_speakingScore,
        );
        console.log(
          "assessment_writingScore:",
          interviewData.assessment_writingScore,
        );
        console.log(
          "assessment_readingScore:",
          interviewData.assessment_readingScore,
        );
        console.log(
          "assessment_listeningScore:",
          interviewData.assessment_listeningScore,
        );
        console.log(
          "assessment_generalScore:",
          interviewData.assessment_generalScore,
        );
        console.log(
          "assessment_decisionMaking_generalScore:",
          interviewData.assessment_decisionMaking_generalScore,
        );
        console.log(
          "assessment_businessEtiquette_generalScore:",
          interviewData.assessment_businessEtiquette_generalScore,
        );
        console.log(
          "assessment_communicationSkills_generalScore:",
          interviewData.assessment_communicationSkills_generalScore,
        );
        console.log("=== END ASSESSMENT SCORES DEBUG ===");

        // Debug: Log assessment content specifically
        console.log("=== ASSESSMENT CONTENT DEBUG ===");
        console.log("speakingURL:", interviewData.speakingURL);
        console.log("writingText:", interviewData.writingText);
        console.log("=== END ASSESSMENT CONTENT DEBUG ===");

        // Debug: Log explanation and transcript content
        console.log("=== EXPLANATION AND TRANSCRIPT DEBUG ===");
        console.log(
          "explanation length:",
          interviewData.explanation.length,
          "characters",
        );
        console.log(
          "interviewTranscript length:",
          interviewData.interviewTranscript.length,
          "characters",
        );
        console.log(
          "explanation preview:",
          interviewData.explanation.substring(0, 200) + "...",
        );
        console.log(
          "interviewTranscript preview:",
          interviewData.interviewTranscript.substring(0, 200) + "...",
        );
        console.log("=== END EXPLANATION AND TRANSCRIPT DEBUG ===");

        // Save to Google Spreadsheet after we have all data including score
        await saveToGoogleSpreadsheet(interviewData);
      } catch (error) {
        console.error("Error processing interview files:", error);
        toast.error("Failed to process interview files");
      }

      // Speak the assessment in proper chunks to ensure nothing is missed
      if (avatar) {
        try {
          // Better sentence splitting with regex that handles various punctuation
          const sentenceRegex = /[^.!?…]+[.!?…]+\s*/g;
          const sentences = assessmentText.match(sentenceRegex) || [
            assessmentText,
          ];

          // Group very short sentences together for more natural speech
          const speechChunks = [];
          let currentChunk = "";

          for (const sentence of sentences) {
            // If adding this sentence would make the chunk too long, finalize current chunk
            if (currentChunk.length + sentence.length > 100) {
              if (currentChunk) {
                speechChunks.push(currentChunk.trim());
              }
              currentChunk = sentence;
            } else {
              // Otherwise add to current chunk
              currentChunk += sentence;
            }
          }

          // Add any remaining text
          if (currentChunk.trim()) {
            speechChunks.push(currentChunk.trim());
          }

          // Speak each chunk with proper awaiting to ensure everything is spoken
          for (const chunk of speechChunks) {
            try {
              setResponseText(chunk); // Update UI with current chunk
              await avatar.speak({
                text: chunk,
                taskType: TaskType.REPEAT,
              });
            } catch (error) {
              console.error("Error speaking assessment chunk:", error);
              // Try again once more with this chunk
              try {
                await avatar.speak({
                  text: chunk,
                  taskType: TaskType.REPEAT,
                });
              } catch (retryError) {
                console.error(
                  "Failed retry speaking assessment chunk:",
                  retryError,
                );
              }
            }
          }

          // Update the full response after all chunks are spoken
          setResponseText(assessmentText);
        } catch (error) {
          console.error("Error processing assessment speech:", error);
          // Fallback to a simpler attempt if the chunking approach fails
          try {
            await avatar.speak({
              text: "Here is my assessment of your communication proficiency in this interview.",
              taskType: TaskType.REPEAT,
            });
          } catch (fallbackError) {
            console.error("Error with fallback speech:", fallbackError);
          }
        }
      }
      localStorage.removeItem("ASSESSMENT_DATA");
      setIsLoading(false);
    } catch (error) {
      console.error("Error generating assessment:", error);
      toast.error("Failed to generate assessment");
      setIsLoading(false);
    }
  };

  // Function to save interview data to Google Spreadsheet
  const saveToGoogleSpreadsheet = async (interviewData) => {
    try {
      // Google Sheets URL
      const url =
        "https://docs.google.com/spreadsheets/u/1/d/1LGwXDB3ZIzuxrkRFCsaT5t8gZpC4mMsFHzCbiaVYq78/edit?usp=sharing";

      // Convert to spreadsheet web app URL
      // Note: You need to deploy the Google Sheet as a web app and use that URL instead
      // This is a placeholder URL that would need to be replaced with your actual web app URL
      // const webAppUrl = url.replace('/edit?usp=sharing', '/exec');
      const webAppUrl =
        "https://script.google.com/macros/s/AKfycbzYqO3-LWBk3Nso7B6W7-LTqx_FAA-HNBIVzpVDtxqnBenwvTLBdAHArEBuA2g0Q9zu5A/exec";
      // Format data as URL-encoded string for the spreadsheet
      const formBody =
        `candidateId=${encodeURIComponent(interviewData.candidateId)}&` +
        `firstName=${encodeURIComponent(interviewData.firstName)}&` +
        `lastName=${encodeURIComponent(interviewData.lastName)}&` +
        `audioUrl=${encodeURIComponent(interviewData.audioUrl)}&` +
        `interviewVideo=${encodeURIComponent(interviewData.interviewVideo)}&` +
        `interviewText=${encodeURIComponent(interviewData.interviewText)}&` +
        `speakingURL=${encodeURIComponent(interviewData.speakingURL)}&` +
        `writingText=${encodeURIComponent(interviewData.writingText)}&` +
        `communiqateAiScore=${encodeURIComponent(interviewData.communiqateAiScore)}&` +
        `score=${encodeURIComponent(interviewData.score)}&` +
        `explanation=${encodeURIComponent(interviewData.explanation)}&` +
        `interviewTranscript=${encodeURIComponent(interviewData.interviewTranscript)}&` +
        `assessment_speakingScore=${encodeURIComponent(interviewData.assessment_speakingScore)}&` +
        `assessment_writingScore=${encodeURIComponent(interviewData.assessment_writingScore)}&` +
        `assessment_readingScore=${encodeURIComponent(interviewData.assessment_readingScore)}&` +
        `assessment_listeningScore=${encodeURIComponent(interviewData.assessment_listeningScore)}&` +
        `assessment_generalScore=${encodeURIComponent(interviewData.assessment_generalScore)}&` +
        `assessment_decisionMaking_generalScore=${encodeURIComponent(interviewData.assessment_decisionMaking_generalScore)}&` +
        `assessment_businessEtiquette_generalScore=${encodeURIComponent(interviewData.assessment_businessEtiquette_generalScore)}&` +
        `assessment_communicationSkills_generalScore=${encodeURIComponent(interviewData.assessment_communicationSkills_generalScore)}`;

      // Make direct POST request to Google Sheets
      const response = await fetch(webAppUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formBody,
      });

      const result = await response.text();
      console.log("Spreadsheet update result:", result);

      // Log data that was sent for debugging
      console.log("Sent to Google Spreadsheet:", interviewData);
      console.log("Form body sent to Google Sheets:", formBody);
      console.log("Spreadsheet URL:", url);

      // Debug: Log each field being sent
      console.log("=== GOOGLE SHEETS UPLOAD DEBUG ===");
      console.log("candidateId:", interviewData.candidateId);
      console.log("firstName:", interviewData.firstName);
      console.log("lastName:", interviewData.lastName);
      console.log("audioUrl:", interviewData.audioUrl);
      console.log("interviewVideo:", interviewData.interviewVideo);
      console.log("interviewText:", interviewData.interviewText);
      console.log("speakingURL:", interviewData.speakingURL);
      console.log("writingText:", interviewData.writingText);
      console.log("communiqateAiScore:", interviewData.communiqateAiScore);
      console.log("score:", interviewData.score);
      console.log("explanation:", interviewData.explanation);
      console.log("interviewTranscript:", interviewData.interviewTranscript);
      console.log(
        "assessment_speakingScore:",
        interviewData.assessment_speakingScore,
      );
      console.log(
        "assessment_writingScore:",
        interviewData.assessment_writingScore,
      );
      console.log(
        "assessment_readingScore:",
        interviewData.assessment_readingScore,
      );
      console.log(
        "assessment_listeningScore:",
        interviewData.assessment_listeningScore,
      );
      console.log(
        "assessment_generalScore:",
        interviewData.assessment_generalScore,
      );
      console.log(
        "assessment_decisionMaking_generalScore:",
        interviewData.assessment_decisionMaking_generalScore,
      );
      console.log(
        "assessment_businessEtiquette_generalScore:",
        interviewData.assessment_businessEtiquette_generalScore,
      );
      console.log(
        "assessment_communicationSkills_generalScore:",
        interviewData.assessment_communicationSkills_generalScore,
      );
      console.log("=== END GOOGLE SHEETS UPLOAD DEBUG ===");

      toast.success("Interview data saved to spreadsheet");
    } catch (error) {
      console.error("Error saving to spreadsheet:", error);
      toast.error("Failed to save interview data to spreadsheet");

      // Fallback: Log what would have been saved
      console.log("Would have saved to Google Spreadsheet:", interviewData);
      console.log(
        "Spreadsheet URL: https://docs.google.com/spreadsheets/u/1/d/1LGwXDB3ZIzuxrkRFCsaT5t8gZpC4mMsFHzCbiaVYq78/edit",
      );
    }
  };

  // Mobile version of uploadInterviewFiles (without video)
  const uploadInterviewFilesMobile = async (audioBlob, transcriptText) => {
    try {
      const BASE_URL =
        "https://stage.englishmonkapp.com/englishmonk-staging/backend/web/";

      // Create FormData object
      const formData = new FormData();

      // Create JSON data
      const jsonData = [
        {
          templateConstantCode: "000018",
          apiType: "Android",
          apiVersion: "1.0",
          subpath: "interviews",
        },
      ];

      // Append JSON string
      formData.append("json", JSON.stringify(jsonData));

      // Create file objects (no video file for mobile)
      const audioFile = new File([audioBlob], "interview_audio.mp3");
      const textFile = new File([transcriptText], "interview_transcript.txt");

      formData.append("audioFile", audioFile);
      formData.append("textFile", textFile);

      // Use environment-based URL for API call
      const apiUrl = `${API_BASE_URL}users/upload-multiple-media`;

      // Send upload request
      const response = await fetch(apiUrl, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Mobile upload result:", JSON.stringify(result));

      // Extract the first result from the array
      const uploadResult = result[0];

      if (!uploadResult || uploadResult.status !== "true") {
        throw new Error(uploadResult?.message || "Upload failed");
      }

      // Prepend base URL to file paths (no video URL for mobile)
      return {
        audioUrl: BASE_URL + uploadResult.audiofilepath,
        videoUrl: "", // No video for mobile
        textUrl: BASE_URL + uploadResult.textfilepath,
      };
    } catch (error) {
      console.error("Error uploading mobile files:", error);
      toast.error("Failed to upload interview files");
      throw error;
    }
  };

  // Modify uploadInterviewFiles to handle MP4 conversion
  const uploadInterviewFiles = async (audioBlob, transcriptText) => {
    try {
      const BASE_URL =
        "https://stage.englishmonkapp.com/englishmonk-staging/backend/web/";

      // Ensure video recording is stopped and get the video data
      if (
        screenRecorderRef.current &&
        screenRecorderRef.current.state !== "inactive"
      ) {
        screenRecorderRef.current.stop();
        // Wait for the last chunk of data
        await new Promise((resolve) => {
          screenRecorderRef.current.addEventListener(
            "dataavailable",
            (event) => {
              if (event.data.size > 0) {
                videoChunksRef.current.push(event.data);
              }
            },
            { once: true },
          );

          screenRecorderRef.current.addEventListener("stop", resolve, {
            once: true,
          });
        });
      }

      // Create FormData object
      const formData = new FormData();

      // Create JSON data
      const jsonData = [
        {
          templateConstantCode: "000018",
          apiType: "Android",
          apiVersion: "1.0",
          subpath: "interviews",
        },
      ];

      // Append JSON string
      formData.append("json", JSON.stringify(jsonData));

      // Create file objects
      const audioFile = new File([audioBlob], "interview_audio.mp3");
      const textFile = new File([transcriptText], "interview_transcript.txt");

      // Handle video file creation (different for mobile vs desktop)
      if (videoChunksRef.current.length > 0) {
        const webmBlob = new Blob(videoChunksRef.current, {
          type: "video/webm",
        });

        if (isMobile) {
          // For mobile, use WebM directly (no conversion needed)
          console.log("Mobile video recording - using WebM format");
          const videoFile = new File([webmBlob], "interview_video.webm");
          formData.append("videoFile", videoFile);
        } else {
          // For desktop, try to convert to MP4
          try {
            console.log("Desktop video recording - converting WebM to MP4");
            // Create a video element to play the WebM
            const videoElement = document.createElement("video");
            videoElement.src = URL.createObjectURL(webmBlob);
            await videoElement.load();

            // Create a canvas to draw the video frames
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            // Set canvas size to match video
            canvas.width = 1920; // Match the recording resolution
            canvas.height = 1080;

            // Create a MediaRecorder for MP4
            const stream = canvas.captureStream();
            const mp4Recorder = new MediaRecorder(stream, {
              mimeType: "video/mp4;codecs=h264",
              videoBitsPerSecond: 3000000, // 3 Mbps
            });

            const mp4Chunks = [];
            mp4Recorder.ondataavailable = (e) => {
              if (e.data.size > 0) {
                mp4Chunks.push(e.data);
              }
            };

            // Create promise to wait for conversion
            const conversionPromise = new Promise((resolve, reject) => {
              mp4Recorder.onstop = () => {
                const mp4Blob = new Blob(mp4Chunks, { type: "video/mp4" });
                resolve(mp4Blob);
              };
              mp4Recorder.onerror = reject;
            });

            // Start recording
            mp4Recorder.start();

            // Play and capture frames
            videoElement.play();
            const drawFrame = () => {
              if (videoElement.ended) {
                mp4Recorder.stop();
                return;
              }
              ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
              requestAnimationFrame(drawFrame);
            };
            drawFrame();

            // Wait for conversion to complete
            const mp4Blob = await conversionPromise;
            const videoFile = new File([mp4Blob], "interview_video.mp4");

            // Clean up
            URL.revokeObjectURL(videoElement.src);
            videoElement.remove();
            canvas.remove();

            formData.append("videoFile", videoFile);
          } catch (conversionError) {
            console.error("Error converting video format:", conversionError);
            // Fallback: use WebM directly
            const videoFile = new File([webmBlob], "interview_video.webm");
            formData.append("videoFile", videoFile);
          }
        }
      } else {
        console.log("No video recording available");
      }

      formData.append("audioFile", audioFile);
      formData.append("textFile", textFile);

      // Use environment-based URL for API call
      const apiUrl = `${API_BASE_URL}users/upload-multiple-media`;

      // Send upload request
      const response = await fetch(apiUrl, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Upload result:", JSON.stringify(result));

      // Extract the first result from the array
      const uploadResult = result[0];

      if (!uploadResult || uploadResult.status !== "true") {
        throw new Error(uploadResult?.message || "Upload failed");
      }

      // Clean up video chunks after successful upload
      videoChunksRef.current = [];

      // Prepend base URL to file paths
      return {
        audioUrl: BASE_URL + uploadResult.audiofilepath,
        videoUrl: BASE_URL + uploadResult.videofilepath,
        textUrl: BASE_URL + uploadResult.textfilepath,
      };
    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error("Failed to upload interview files");
      throw error;
    }
  };

  // Clear all speech-related timeouts ✅
  const clearSpeechTimeouts = () => {
    if (avatarSpeakingTimeoutRef.current) {
      clearTimeout(avatarSpeakingTimeoutRef.current);
      avatarSpeakingTimeoutRef.current = null;
    }
    clearSilenceTimeout(silenceTimeoutRef);
    clearAutoListenTimeout(autoListenTimeoutRef);
  };

  // REPLACE startRecognition function with improved mobile handling ✅
  const startRecognition = () => {
    // 🔒 HARD BLOCK: browser audio not settled yet
    if (Date.now() < speechBlockedUntilRef.current) {
      recognitionStartingRef.current = false;
      return;
    }

    if (recognitionActiveRef.current || recognitionStartingRef.current) {
      return;
    }

    if (!recognitionRef.current) {
      console.error("Recognition ref not available");
      return;
    }

    if (
      !isRecognitionEnabled ||
      isSpeaking ||
      isThinking ||
      isProcessingSpeechRef.current
    ) {
      return;
    }

    try {
      recognitionStartingRef.current = true;
      lastTranscriptRef.current = "";

      if (isMobile) {
        navigator.mediaDevices
          .getUserMedia({ audio: true })
          .then((stream) => {
            stream.getTracks().forEach((track) => track.stop());

            setTimeout(() => {
              // 🔒 RE-CHECK BLOCK AFTER PERMISSION
              if (Date.now() < speechBlockedUntilRef.current) {
                recognitionStartingRef.current = false;
                return;
              }

              try {
                recognitionRef.current?.start();
              } catch (error) {
                console.error("Error starting mobile recognition:", error);
                recognitionStartingRef.current = false;

                if (
                  error instanceof Error &&
                  error.message.includes("already")
                ) {
                  recognitionActiveRef.current = true;
                  setIsListening(true);
                }
              }
            }, 300);
          })
          .catch((error) => {
            console.error("Microphone permission error:", error);
            recognitionStartingRef.current = false;
            toast.error("Please allow microphone access to continue");
          });
      } else {
        recognitionRef.current.start();
      }
    } catch (error) {
      console.error("Error in startRecognition:", error);
      recognitionStartingRef.current = false;

      if (error instanceof Error && error.message.includes("already")) {
        recognitionActiveRef.current = true;
        setIsListening(true);
      } else {
        setTimeout(() => {
          if (isRecognitionEnabled && !isSpeaking && !isThinking) {
            startRecognition();
          }
        }, 2000);
      }
    }
  };

  // REPLACE stopRecognition function with improved mobile handling ✅
  const stopRecognition = () => {
    if (recognitionRef.current && recognitionActiveRef.current) {
      try {
        manualStopRef.current = true;

        // Prevent race with onend/onerror handlers
        recognitionActiveRef.current = false;

        recognitionRef.current.stop();
      } catch (error) {
        console.error("Error stopping recognition:", error);
      }
    }

    recognitionStartingRef.current = false;
    recognitionActiveRef.current = false;
    setIsListening(false);

    // Clear timeouts
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = null;
    }
  };

  // Handle dialog closing
  const handleDialogClose = () => {
    setShowWelcomeDialog(false);
    navigate("/"); // Navigate to home
  };

  // Handle continue from welcome dialog
  const handleContinue = () => {
    setShowWelcomeDialog(false);
    // Start the actual session directly
    startActualSession();
  };

  return (
    <>
      <WelcomeDialog
        open={showWelcomeDialog}
        onContinue={handleContinue}
        onClose={handleDialogClose}
      />
      {/* Mobile Navigation */}
      {/* <MobileNavbar setShowLogoutDialog={() => {}} /> */}

      <div className="flex flex-col min-h-dvh bg-gray-100 p-8 mobile-responsive">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">
            Professional Job Interview{" "}
            {assessmentComplete &&
              assessmentScore !== null &&
              `(Score: ${assessmentScore.toFixed(1)}/10)`}
          </h1>
        </div>

        {/* Configuration Error Message */}
        {!isConfigLoaded && !isConfigLoading && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Failed to Load Interview Configuration
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>
                    Unable to fetch interview instructions from the server.
                    Please refresh the page to try again.
                  </p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => window.location.reload()}
                    className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
                  >
                    Refresh Page
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Avatar Display */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="relative bg-gray-800 aspect-video">
              {/* Always render the video element to ensure ref is available */}
              <video
                ref={setVideoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
              />

              {/* Overlay for loading and error states */}
              {!isAvatarInitialized && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                  {isAvatarLoading ? (
                    <div className="text-center">
                      <div className="w-16 h-16 border-4 border-t-transparent border-white rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-white text-lg">Loading Avatar...</p>
                      <p className="text-white text-sm mt-2">
                        This may take a few moments
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-white text-lg mb-4">
                        Avatar not initialized
                      </p>
                      <div className="space-y-2">
                        <button
                          onClick={retryAvatarInitialization}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium block w-full"
                        >
                          Retry Avatar Loading
                        </button>
                        <button
                          onClick={forceAvatarRefresh}
                          className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium block w-full"
                        >
                          Force Refresh Avatar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {isLoading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="w-16 h-16 border-4 border-t-transparent border-white rounded-full animate-spin"></div>
                </div>
              )}

              {/* Status Overlay */}
              {(isSpeaking || isListening || isThinking) && (
                <div className="absolute bottom-4 left-4 right-4 bg-black/70 p-3 rounded">
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-1">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          isSpeaking
                            ? "bg-blue-500 animate-pulse"
                            : isListening
                              ? "bg-green-500 animate-pulse"
                              : "bg-yellow-500 animate-pulse"
                        }`}
                      ></div>
                      <div
                        className={`w-2 h-2 rounded-full ${
                          isSpeaking
                            ? "bg-blue-500 animate-pulse delay-150"
                            : isListening
                              ? "bg-green-500 animate-pulse delay-150"
                              : "bg-yellow-500 animate-pulse delay-150"
                        }`}
                      ></div>
                      <div
                        className={`w-2 h-2 rounded-full ${
                          isSpeaking
                            ? "bg-blue-500 animate-pulse delay-300"
                            : isListening
                              ? "bg-green-500 animate-pulse delay-300"
                              : "bg-yellow-500 animate-pulse delay-300"
                        }`}
                      ></div>
                    </div>
                    <span className="text-white">
                      {isSpeaking
                        ? "Speaking..."
                        : isListening
                          ? "Listening..."
                          : "Thinking..."}
                    </span>
                  </div>
                  {responseText && (
                    <p className="text-white mt-1">{responseText}</p>
                  )}
                </div>
              )}
            </div>

            <div className="p-4">
              <div className="flex flex-col gap-4">
                <div className="flex gap-4 mb-4">
                  <button
                    onClick={initializeSession}
                    disabled={
                      !isAvatarInitialized ||
                      isSessionActive ||
                      isLoading ||
                      isConfigLoading ||
                      !isConfigLoaded
                    }
                    className={`px-4 py-2 rounded-lg font-medium ${
                      !isAvatarInitialized || isSessionActive || !isConfigLoaded
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                  >
                    {isConfigLoading
                      ? "Loading Configuration..."
                      : isAvatarLoading
                        ? "Loading Avatar..."
                        : !isAvatarInitialized
                          ? "Avatar Not Ready"
                          : "Start Interview"}
                  </button>

                  <button
                    onClick={cleanupSession}
                    disabled={!isSessionActive || isLoading}
                    className={`px-4 py-2 rounded-lg font-medium ${
                      !isSessionActive
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-red-600 hover:bg-red-700 text-white"
                    }`}
                  >
                    End Interview
                  </button>
                </div>

                {/* Avatar Status Info */}
                {isAvatarInitialized && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-green-800 font-medium">
                        Avatar Ready
                      </span>
                    </div>
                    <p className="text-green-700 text-sm mt-1">
                      You can now start the interview
                    </p>
                  </div>
                )}

                {/* Mobile Camera Preview */}
                {isMobile && (
                  <div className="bg-gray-100 border border-gray-300 rounded-lg p-3">
                    <h4 className="font-medium text-gray-800 mb-2">
                      Your Camera
                    </h4>
                    <div className="relative w-full h-32 rounded-lg overflow-hidden bg-gray-900">
                      <video
                        ref={userVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      {userVideoStream ? (
                        <div className="absolute bottom-1 left-1 bg-green-500 px-1 py-0.5 rounded-full text-xs text-white">
                          Live
                        </div>
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 to-purple-900 text-white">
                          <div className="mb-1 rounded-full bg-blue-500/30 p-2">
                            <MicIcon className="w-4 h-4 text-blue-200" />
                          </div>
                          <p className="text-xs font-medium text-center">
                            Click "Start Session"
                          </p>
                          <p className="text-xs text-blue-200 text-center">
                            to enable camera
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Mobile Speech Recognition Status */}
                    <div className="mt-2 text-xs text-gray-600">
                      <div className="flex items-center justify-between">
                        <span>Speech Recognition:</span>
                        <span
                          className={`px-2 py-1 rounded text-xs ${recognitionRef.current ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                        >
                          {recognitionRef.current
                            ? "Available"
                            : "Not Available"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span>Status:</span>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            isListening
                              ? "bg-blue-100 text-blue-800"
                              : isSpeaking
                                ? "bg-purple-100 text-purple-800"
                                : isThinking
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {isListening
                            ? "Listening"
                            : isSpeaking
                              ? "Speaking"
                              : isThinking
                                ? "Thinking"
                                : "Waiting"}
                        </span>
                      </div>
                      {isSessionActive && (
                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={() => {
                              console.log("=== SPEECH RECOGNITION DEBUG ===");
                              console.log("Mobile:", isMobile);
                              console.log(
                                "Recognition exists:",
                                !!recognitionRef.current,
                              );
                              console.log(
                                "Recognition enabled:",
                                isRecognitionEnabled,
                              );
                              console.log(
                                "Recognition active:",
                                recognitionActiveRef.current,
                              );
                              console.log("Is listening:", isListening);
                              console.log("Is speaking:", isSpeaking);
                              console.log("Is thinking:", isThinking);
                              console.log("Session active:", isSessionActive);
                              console.log(
                                "Last transcript:",
                                lastTranscriptRef.current,
                              );
                              console.log(
                                "Current transcript:",
                                currentTranscriptRef.current,
                              );
                              console.log(
                                "Browser support:",
                                "webkitSpeechRecognition" in window,
                              );
                            }}
                            className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
                          >
                            Debug Info
                          </button>

                          <button
                            onClick={() => {
                              stopRecognition();
                              setTimeout(() => startRecognition(), 500);
                            }}
                            className="px-3 py-1 bg-green-500 text-white rounded text-sm"
                          >
                            Restart Mic
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {isSessionActive && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">Progress:</span>
                    <div className="flex-1 mx-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${(questionCount / totalQuestions) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-semibold">
                      {questionCount}/{totalQuestions}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recording Controls and Assessment */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Your Response</h2>

              <div className="mb-6">
                {isSessionActive && !isSpeaking && !assessmentComplete ? (
                  <div className="relative">
                    <div
                      className={`flex items-center justify-center py-4 px-6 rounded-lg border-2 ${
                        isListening
                          ? "border-green-500 bg-green-50"
                          : "border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {isListening ? (
                          <>
                            <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="font-medium">
                              {isMobile
                                ? "Listening... (Mobile)"
                                : "Listening to your response..."}
                            </span>
                          </>
                        ) : (
                          <>
                            <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
                            <span className="font-medium">
                              {isMobile
                                ? "Waiting... (Mobile)"
                                : "Waiting for the interviewer..."}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="mt-2 flex justify-center">
                      <div className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-500">
                        {isListening
                          ? "Listening..."
                          : "Waiting for interviewer"}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-100 p-4 rounded-lg text-center text-gray-500">
                    {assessmentComplete
                      ? "Interview complete"
                      : isSpeaking
                        ? "Please wait while the interviewer is speaking..."
                        : "Click 'Start Interview' to begin"}
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-medium mb-2">Your Transcribed Response:</h3>
                <div className="bg-gray-100 p-4 rounded-lg min-h-[100px]">
                  {transcription || (
                    <span className="text-gray-500 italic">
                      Your response will appear here after speaking...
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Conversation History */}
            {conversationHistory.length > 1 && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4">
                  Interview Conversation
                </h2>
                <div className="max-h-[400px] overflow-y-auto pr-2">
                  {conversationHistory.slice(1).map((message, index) => (
                    <div
                      key={index}
                      className={`mb-4 ${message.role === "user" ? "pl-4 border-l-4 border-blue-500" : ""}`}
                    >
                      <div className="font-semibold mb-1">
                        {message.role === "user" ? "You:" : "Interviewer:"}
                      </div>
                      <div
                        className={`${message.role === "user" ? "text-blue-800" : "text-gray-800"}`}
                      >
                        {message.content}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Assessment Results */}
            {assessmentComplete && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-4">
                  Communication Assessment
                </h2>
                <div className="whitespace-pre-line mb-6">
                  {assessmentFeedback}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={initializeSession}
                    className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium"
                  >
                    Start New Interview
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        {!assessmentComplete && (
          <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Instructions</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>
                Click <b>Start Interview</b> to begin the job interview session
              </li>
              <li>Listen to the virtual interviewer's questions</li>
              <li>
                The system will automatically detect and transcribe your voice
              </li>
              <li>Speak naturally when responding to questions</li>
              <li>
                The interviewer will ask you a series of professional questions
              </li>
              <li>
                After all questions, you'll receive a detailed assessment of
                your communication skills
              </li>
            </ol>
          </div>
        )}
      </div>
    </>
  );
};

export default SpeechToText;

// Custom icon component
const MicIcon = ({ className = "w-6 h-6", ...props }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
    />
  </svg>
);

// Function to verify assessment scores are stored
const verifyAssessmentScores = () => {
  const assessmentScoresString = localStorage.getItem(
    "ASSESSMENT_FINAL_SCORES",
  );
  const assessmentScores = assessmentScoresString
    ? JSON.parse(assessmentScoresString)
    : {};

  return assessmentScores;
};

// Default avatar configuration
const DEFAULT_CONFIG = {
  quality: AvatarQuality.High,
  avatarName: "Elenora_IT_Sitting_public",
  voice: {
    voice_id: "en-US-Neural2-F",
    rate: 1.2,
    emotion: VoiceEmotion.NEUTRAL,
  },
  version: "v2",
  video_encoding: "H264",
  low_latency: true,
  buffer_threshold: 0.05,
  chunk_size: 4,
  preload_audio: false,
  cache_enabled: false,
  realtime_streaming: true,
};

const setThemeColor = () => {
  const primaryColor =
    localStorage.getItem("corporate_primary_color") || "#0000ff";
  const secondaryColor =
    localStorage.getItem("corporate_secondary_color") || "#f5914a";
  const backgroundColor =
    localStorage.getItem("corporate_background_color") || "#fddaa7";
  const accentColor =
    localStorage.getItem("corporate_accent_color") || "#e0d4bc";

  document.documentElement.style.setProperty("--primary-color", primaryColor);
  document.documentElement.style.setProperty(
    "--secondary-color",
    secondaryColor,
  );
  document.documentElement.style.setProperty(
    "--background-color",
    backgroundColor,
  );
  document.documentElement.style.setProperty("--accent-color", accentColor);
};

// 1. Extract the fetcher function outside the component or hook
const fetchInterviewConfigData = async () => {
  const dictParameter = JSON.stringify([
    {
      languageID: "1",
      apiType: "Android",
      apiVersion: "1.0",
    },
  ]);

  // apiClient already has baseURL configured, so use relative path
  const { data } = await apiClient.post(
    "assessment/get-ai-interview-config",
    `json=${dictParameter}`, // Legacy body format preserved
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded", // Override default JSON header
      },
    },
  );

  // Handle custom API error structure (status: false)
  if (data.status === false) {
    throw new Error(data.message || "Failed to fetch interview configuration");
  }

  // Return the specific data object required
  return data[0].data;
};

const useInitializeOpenAI = ({
  openaiRef,
  setConversationHistory,
  setAssessmentInstructions,
  setInitialInstructions,
  setIsConfigLoaded,
  setIsConfigLoading,
  videoRef,
  isVideoElementReady,
  initializeAvatar,
}) => {
  const {
    data: interviewConfig,
    isLoading: isQueryLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["interviewConfig"],
    queryFn: fetchInterviewConfigData,
    staleTime: Infinity, // Configuration is unlikely to change during the session
    refetchOnWindowFocus: false,
    retry: 1,
  });

  useEffect(() => {
    // Set theme colors
    setThemeColor();

    // Verify assessment scores are stored
    verifyAssessmentScores();

    // Initialize OpenAI with validation
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey || apiKey.trim() === "") {
      throw new Error(
        "OpenAI API key is not configured. Please set VITE_OPENAI_API_KEY environment variable.",
      );
    }

    openaiRef.current = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true,
    });

    const isBrave =
      (navigator as any).brave?.isBrave ||
      navigator.userAgent.includes("Brave");

    if (isBrave) {
      toast.warning(
        "Your browser may limit speech recognition features. For the best experience, please use Chrome, Edge, or Safari.",
      );
    }
  }, []);

  useEffect(() => {
    if (interviewConfig) {
      const {
        intrw_conducting_instrctn,
        intrw_scoring_instrctn,
        initial_instructions,
      } = interviewConfig;

      // Update Local State
      setConversationHistory([
        {
          role: "system",
          content: intrw_conducting_instrctn,
        },
      ]);
      setAssessmentInstructions(intrw_scoring_instrctn || "");
      setInitialInstructions(initial_instructions);

      // Update Loading/Loaded flags to maintain compatibility with UI
      setIsConfigLoaded(true);
      setIsConfigLoading(false);

      // Initialize Avatar Logic - REMOVED: This is handled by the useEffect hook below
      // Don't call initializeAvatar here to avoid duplicate calls
      // The useEffect hook will handle initialization when conditions are met
    }
  }, [interviewConfig, isVideoElementReady]);

  useEffect(() => {
    if (isError) {
      console.error("Error fetching interview configuration:", error);
      toast.error("Failed to load interview configuration. Please try again.");
      setIsConfigLoaded(false);
      setIsConfigLoading(false);
    }
  }, [isError, error]);

  // Sync loading state from Query to Local State (if strictly needed for UI)
  useEffect(() => {
    setIsConfigLoading(isQueryLoading);
  }, [isQueryLoading]);
};

// initialize avatar
const HEYGEN_API_KEY = import.meta.env.VITE_HEYGEN_API_KEY;

export const fetchAccessToken = async (): Promise<string | undefined> => {
  try {
    const response = await axios.post(
      "https://api.heygen.com/v1/streaming.create_token",
      null,
      {
        headers: {
          "x-api-key": HEYGEN_API_KEY,
        },
      },
    );

    return response.data?.data?.token;
  } catch (error) {
    console.error("Error fetching token:", error);
    return undefined; // IMPORTANT: preserve original behavior
  }
};

const useHeygenAccessToken = () => {
  return useQuery({
    queryKey: ["heygen", "streaming-token"],
    queryFn: async () => {
      const token = await fetchAccessToken();

      if (!token) {
        throw new Error("token_missing");
      }

      return token;
    },
    retry: 3,
    retryDelay: 2000,
    staleTime: 1000 * 60 * 30, // Token is fresh for 30 minutes
    gcTime: 1000 * 60 * 60, // Keep in cache for 1 hour
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Don't refetch if data exists
    refetchOnReconnect: false, // Don't refetch on reconnect
  });
};

const useInitializeAvatar = ({
  videoRef,
  avatar,
  handleStreamReady,
  handleAvatarStartTalking,
  handleAvatarStopTalking,
  handleStreamDisconnected,
  handleAvatarTalkingMessage,
  handleAvatarEndMessage,
  handleUserStart,
  handleUserStop,
  handleUserEndMessage,
  handleUserTalkingMessage,
}) => {
  return useMutation({
    mutationFn: async (token: string) => {
      if (!videoRef.current) {
        throw new Error("video_not_ready");
      }

      if (avatar) {
        try {
          await avatar.stopAvatar();
        } catch {
          // preserve original behavior
        }
      }

      const streamingAvatar = new StreamingAvatar({ token });

      streamingAvatar.on(StreamingEvents.STREAM_READY, handleStreamReady);
      streamingAvatar.on(
        StreamingEvents.AVATAR_START_TALKING,
        handleAvatarStartTalking,
      );
      streamingAvatar.on(
        StreamingEvents.AVATAR_STOP_TALKING,
        handleAvatarStopTalking,
      );
      streamingAvatar.on(
        StreamingEvents.STREAM_DISCONNECTED,
        handleStreamDisconnected,
      );
      streamingAvatar.on(
        StreamingEvents.AVATAR_TALKING_MESSAGE,
        handleAvatarTalkingMessage,
      );
      streamingAvatar.on(
        StreamingEvents.AVATAR_END_MESSAGE,
        handleAvatarEndMessage,
      );
      streamingAvatar.on(StreamingEvents.USER_START, handleUserStart);
      streamingAvatar.on(StreamingEvents.USER_STOP, handleUserStop);
      streamingAvatar.on(
        StreamingEvents.USER_END_MESSAGE,
        handleUserEndMessage,
      );
      streamingAvatar.on(
        StreamingEvents.USER_TALKING_MESSAGE,
        handleUserTalkingMessage,
      );

      const avatarConfigs = [
        DEFAULT_CONFIG,
        {
          ...DEFAULT_CONFIG,
          avatarName: "Elenora_IT_Sitting_public",
          quality: AvatarQuality.Medium,
        },
        {
          ...DEFAULT_CONFIG,
          avatarName: "default",
          quality: AvatarQuality.Low,
        },
      ];

      let lastError: unknown;

      for (const config of avatarConfigs) {
        try {
          await Promise.race([
            streamingAvatar.createStartAvatar(config),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error("timeout")), 20000),
            ),
          ]);
          return streamingAvatar;
        } catch (err) {
          lastError = err;
          await new Promise((r) => setTimeout(r, 1000));
        }
      }

      throw lastError ?? new Error("avatar_creation_failed");
    },
  });
};

// Clear auto-listen timeout
const clearAutoListenTimeout = (autoListenTimeoutRef) => {
  if (autoListenTimeoutRef.current) {
    clearTimeout(autoListenTimeoutRef.current);
    autoListenTimeoutRef.current = null;
  }
};

// Helper function to clear silence timeout
const clearSilenceTimeout = (silenceTimeoutRef) => {
  if (silenceTimeoutRef.current) {
    clearTimeout(silenceTimeoutRef.current);
    silenceTimeoutRef.current = null;
  }
};

type StreamReadyEvent = CustomEvent<MediaStream>;
type AvatarStartTalkingEvent = CustomEvent<unknown>;
type AvatarTalkingMessageEvent = CustomEvent<{
  text?: string;
}>;
type AvatarEndMessageEvent = CustomEvent<{
  text?: string;
}>;
type UserTalkingMessageEvent = CustomEvent<{
  text?: string;
}>;
type UserEndMessageEvent = CustomEvent<{
  text?: string;
}>;
