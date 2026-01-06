import React, { useEffect, useRef, useState } from "react";
import StreamingAvatar, { AvatarQuality, StreamingEvents, TaskType } from "@heygen/streaming-avatar";
// import { Mic, MicOff, Download, Play, Pause } from "lucide-react";
import { OpenAIAssistant } from "./openai-assistant";

// Custom icon components
const MicIcon = ({ className = "w-6 h-6", ...props }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
  </svg>
);

const PauseIcon = ({ className = "w-6 h-6", ...props }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const PlayIcon = ({ className = "w-6 h-6", ...props }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const DownloadIcon = ({ className = "w-6 h-6", ...props }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const AvatarControl = ({ assistantName }) => {
  const videoRef = useRef(null);
  const [avatar, setAvatar] = useState(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [displayedText, setDisplayedText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [ASSISTANT_ID, setASSISTANT_ID] = useState("");
  const [streamingResponse, setStreamingResponse] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [autoListen, setAutoListen] = useState(assistantName === '/ai-interview-auto-listen' ? true : false); // Auto-listen is enabled by default
  const recognitionRef = useRef(null);
  const openaiAssistantRef = useRef(null);
  const companyLogo = localStorage.getItem("corporate_companylogo");
  const listeningTimeoutRef = useRef(null);
  const listeningStartTimeRef = useRef(0);
  const spacebarPressedRef = useRef(false);
  const autoListenTimeoutRef = useRef(null);
  const isProcessingSpeechRef = useRef(false); // New ref to track if we are currently processing speech
  const speakingPromisesRef = useRef([]); // Track active speaking promises
  const [userVideoStream, setUserVideoStream] = useState(null);
  const userVideoRef = useRef(null);
  // Recording related states and refs
  const [isRecording, setIsRecording] = useState(false);
  const [recordedConversation, setRecordedConversation] = useState([]);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioPlayerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const audioDestinationRef = useRef(null);
  const audioSourceNodesRef = useRef([]);
  const [screenRecording, setScreenRecording] = useState(null);
  const [isScreenRecording, setIsScreenRecording] = useState(false);
  const screenRecorderRef = useRef(null);
  const videoChunksRef = useRef([]);
  const recordingContainerRef = useRef(null);

  useEffect(() => {
    terminateAvatarSession();
    if (assistantName === '/email-assistant') {
      setASSISTANT_ID("asst_ssU4hlyQkeamTeFpGi9a16zy");
    } else if (assistantName === '/interview-prep-assistant') {
      setASSISTANT_ID("asst_XDtFo3J5Q7v6h63W7qojjM9J");
    } else if (assistantName === '/cv-cover-letter-assistant') {
      setASSISTANT_ID("asst_WH2evt3U80YHKn7fmlBWls0i");
    } else if (assistantName === '/conversation-assistant') {
      setASSISTANT_ID("asst_1W1I6G8CUPmAXYoXrnRKhKPG");
    } else if (assistantName === '/presentation-assistant') {
      setASSISTANT_ID("asst_wtpVwBkrP9HXOtxPfpVr9ErS");
    } else if (assistantName === '/grammar-assistant') {
      setASSISTANT_ID("asst_eVmsZFcjcG9SVgGcdSO7V4vp");
    } else if (assistantName === '/report-generator-assistant') {
      setASSISTANT_ID("asst_eJQDFdC8qevlOJ0J5Kphgfx7");
    } else if (assistantName === '/business-phones-calls-assistant') {
      setASSISTANT_ID("asst_4ef2zHF5GkcZxw14W66VzESP");
    } else if (assistantName === '/meeting-notes-assistant') {
      setASSISTANT_ID("asst_zxilAA9ySjwHwLQqaYCfHOjw");
    } else if (assistantName === '/ai-interview-spacebar') {
      setASSISTANT_ID("asst_hPT2Q2vBLReSy69YAMkRTLFm");
    } else if (assistantName === '/ai-interview-auto-listen') {
      setASSISTANT_ID("asst_hPT2Q2vBLReSy69YAMkRTLFm");
    }
  }, [assistantName]);

  // Cleanup function for when the component unmounts
  useEffect(() => {
    return () => {
      cleanupListeningResources();
      terminateAvatarSession();
      stopRecording();
    };
  }, []);

  // Helper function to clean up all listening resources - improved for reliability
  const cleanupListeningResources = () => {
    console.log("Cleaning up all listening resources");

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error("Error stopping recognition:", e);
      }
      recognitionRef.current = null;
    }

    setIsListening(false);

    if (listeningTimeoutRef.current) {
      clearTimeout(listeningTimeoutRef.current);
      listeningTimeoutRef.current = null;
    }

    if (autoListenTimeoutRef.current) {
      clearTimeout(autoListenTimeoutRef.current);
      autoListenTimeoutRef.current = null;
    }
  };

  // Handle interruption of avatar speech
  const handleInterruptAvatar = async () => {
    if (avatar && isSpeaking) {
      console.log("Interrupting avatar speech");
      try {
        // Clear any pending speaking promises
        speakingPromisesRef.current = [];

        // Use the interrupt method from the HeyGen API
        await avatar.interrupt();

        // Update state to reflect speech has stopped
        setIsSpeaking(false);
        setStreamingResponse("");

        // Prepare for listening
        if (avatar) {
          avatar.unmuteInputAudio();
        }

        // Small delay before starting listening
        setTimeout(() => {
          startListening();
        }, 300);

      } catch (error) {
        console.error("Error interrupting avatar:", error);
      }
    }
  };

  // Add a new useEffect for spacebar handling with interruption support
  useEffect(() => {
    if (isSessionActive) {
      const handleKeyDown = (e) => {
        if (e.code === 'Space' &&
          e.target.tagName !== 'INPUT' &&
          e.target.tagName !== 'TEXTAREA') {

          e.preventDefault();
          spacebarPressedRef.current = true;

          // If avatar is speaking, interrupt it
          if (isSpeaking) {
            handleInterruptAvatar();
          }
          // If not speaking or thinking and auto-listen is off, start listening
          else if (!isListening && !isThinking && !autoListen) {
            startListening();
          }
        }
      };

      const handleKeyUp = (e) => {
        if (e.code === 'Space' &&
          e.target.tagName !== 'INPUT' &&
          e.target.tagName !== 'TEXTAREA') {

          e.preventDefault();
          spacebarPressedRef.current = false;

          // Only stop listening if we're in manual mode
          if (isListening && !autoListen) {
            stopListening();

            // Only process speech if we've been listening for more than a short threshold
            if (Date.now() - listeningStartTimeRef.current > 300) {
              // The recognition onend handler will take care of processing the result
            }
          }
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
      };
    }
  }, [isSessionActive, autoListen, isListening, isSpeaking, isThinking]);

  // Fetch Access Token
  const fetchAccessToken = async () => {
    try {
      const response = await fetch("https://api.heygen.com/v1/streaming.create_token", {
        method: "POST",
        headers: { "x-api-key": "NWViNzc3OTAyNGQ4NGFmYWE4YWUxNTljZWRiZjNjMWYtMTczODA5NjY2Mg==" },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch token: ${response.statusText}`);
      }

      const { data } = await response.json();
      return data.token;
    } catch (error) {
      console.error("Error fetching token:", error);
      alert("Failed to fetch token. Check the API key or network connection.");
    }
  };

  const startScreenRecording = async () => {
    try {
      // Get display media (screen)
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'window' },
        audio: false,
      });

      // Create a new MediaRecorder instance for the screen
      const screenRecorder = new MediaRecorder(screenStream);
      screenRecorderRef.current = screenRecorder;
      videoChunksRef.current = [];

      screenRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          videoChunksRef.current.push(event.data);
        }
      };

      screenRecorder.onstop = () => {
        const videoBlob = new Blob(videoChunksRef.current, { type: 'video/webm' });
        const videoUrl = URL.createObjectURL(videoBlob);
        setScreenRecording(videoUrl);

        // Release screen capture tracks
        screenStream.getTracks().forEach(track => track.stop());
      };

      // Start recording
      screenRecorder.start();
      setIsScreenRecording(true);
      console.log("Screen recording started");
    } catch (error) {
      console.error("Error starting screen recording:", error);
      alert("Failed to start screen recording. Please make sure to select the window that contains the avatar.");
    }
  };

  const stopScreenRecording = () => {
    if (screenRecorderRef.current && isScreenRecording) {
      screenRecorderRef.current.stop();
      setIsScreenRecording(false);
      console.log("Screen recording stopped");
    }
  };

  // Start recording function
  const startRecording = async () => {
    try {
      // Reset recording state
      setRecordedConversation([]);
      audioChunksRef.current = [];

      // Create AudioContext to capture all audio
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;

      // Create a MediaStreamDestination to collect all audio
      const destination = audioContext.createMediaStreamDestination();
      audioDestinationRef.current = destination;

      // Get user microphone stream for recording
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Connect mic audio to the destination
      const micSource = audioContext.createMediaStreamSource(micStream);
      micSource.connect(destination);
      audioSourceNodesRef.current.push(micSource);

      // If video element exists and has audio, capture that too
      if (videoRef.current && videoRef.current.srcObject) {
        try {
          const videoTracks = videoRef.current.srcObject.getAudioTracks();
          if (videoTracks && videoTracks.length > 0) {
            // Create a source from the video's audio
            const avatarAudioStream = new MediaStream([videoTracks[0]]);
            const avatarSource = audioContext.createMediaStreamSource(avatarAudioStream);
            avatarSource.connect(destination);
            audioSourceNodesRef.current.push(avatarSource);
          }
        } catch (err) {
          console.warn("Could not capture avatar audio:", err);
        }
      }

      // Create the media recorder using the combined streams
      const mediaRecorder = new MediaRecorder(destination.stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudio(audioUrl);

        // Close the media tracks to release the microphone
        micStream.getTracks().forEach(track => track.stop());

        // Clean up audio context resources
        cleanupAudioResources();
      };

      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
      console.log("Recording started with combined audio streams");

      // Also start screen recording
      startScreenRecording();
    } catch (error) {
      console.error("Error starting recording:", error);
      alert("Failed to start recording. Make sure microphone permissions are granted.");
    }
  }

  const cleanupAudioResources = () => {
    // Disconnect all audio nodes
    audioSourceNodesRef.current.forEach(node => {
      try {
        node.disconnect();
      } catch (e) {
        console.warn("Error disconnecting audio node:", e);
      }
    });
    audioSourceNodesRef.current = [];

    // Close audio context if it exists
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (e) {
        console.warn("Error closing audio context:", e);
      }
    }
    audioContextRef.current = null;
    audioDestinationRef.current = null;
  };


  // Stop recording function
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      console.log("Recording stopped");
    }
    stopScreenRecording();
  };

  // Download recording function
  const downloadRecording = () => {
    if (recordedAudio) {
      const a = document.createElement('a');
      document.body.appendChild(a);
      a.style.display = 'none';
      a.href = recordedAudio;
      a.download = `${assistantName.replace('/', '')}-conversation-recording.wav`;
      a.click();
      document.body.removeChild(a);
    }
  };

  // Toggle play/pause function
  const togglePlayPause = () => {
    if (audioPlayerRef.current) {
      if (isPlaying) {
        audioPlayerRef.current.pause();
      } else {
        audioPlayerRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Handle audio player ended event
  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  // Improved user camera initialization
  const initUserCamera = async () => {
    try {
      // Request both audio and video, but we'll only use video for the preview
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user" // Prefer front camera
        }
      });

      setUserVideoStream(stream);

      // Ensure the video element is properly set up
      if (userVideoRef.current) {
        userVideoRef.current.srcObject = stream;

        // Make sure video starts playing
        userVideoRef.current.onloadedmetadata = () => {
          userVideoRef.current.play()
            .then(() => console.log("User video started playing"))
            .catch(err => console.error("Error playing user video:", err));
        };
      }

      return true;
    } catch (error) {
      console.error("Error accessing user camera:", error);
      alert("Could not access your camera. Please check permissions and try again.");
      return false;
    }
  };

  // Initialize Avatar Session - improved reliability
  const initializeAvatarSession = async () => {
    try {
      setIsLoading(true);
      const token = await fetchAccessToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      // Initialize user camera
      await initUserCamera();

      const streamingAvatar = new StreamingAvatar({ token });

      // Initialize OpenAI Assistant
      const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
      openaiAssistantRef.current = new OpenAIAssistant(openaiApiKey, ASSISTANT_ID);
      await openaiAssistantRef.current.initialize();

      // Set up event listeners before creating the avatar
      streamingAvatar.on(StreamingEvents.STREAM_READY, handleStreamReady);
      streamingAvatar.on(StreamingEvents.AVATAR_START_TALKING, handleAvatarStartTalking);
      streamingAvatar.on(StreamingEvents.AVATAR_STOP_TALKING, handleAvatarStopTalking);
      streamingAvatar.on(StreamingEvents.STREAM_DISCONNECTED, handleStreamDisconnected);

      // Now create the avatar
      await streamingAvatar.createStartAvatar({
        quality: AvatarQuality.High,
        avatarName: "default",
      });

      setAvatar(streamingAvatar);
      setIsSessionActive(true);

      // Start recording when session begins
      startRecording();

    } catch (error) {
      console.error("Error initializing session:", error);
      alert("Failed to start the avatar session. Check the console for details.");
      setIsLoading(false);
    }
  };

  // Handler for when the stream is ready
  const handleStreamReady = (event) => {
    if (event.detail && videoRef.current) {
      console.log("Stream is ready, setting up video");
      videoRef.current.srcObject = event.detail;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current.play()
          .then(() => {
            console.log("Video started playing");
            setIsLoading(false);

            // Start listening with a proper delay to ensure everything's ready
            if (autoListen) {
              console.log("Setting up initial auto-listen timeout");
              clearAutoListenTimeout();

              autoListenTimeoutRef.current = setTimeout(() => {
                if (autoListen && isSessionActive && avatar && !isListening && !isSpeaking && !isThinking) {
                  console.log("Starting initial auto-listening");
                  // Make sure audio is unmuted
                  avatar.unmuteInputAudio();
                  startListening();
                }
              }, 2000);
            }
          })
          .catch((error) => console.error("Error playing video:", error));
      };
    }
  };

  // Handler for when the avatar starts talking
  const handleAvatarStartTalking = () => {
    console.log("Avatar started talking");
    setIsSpeaking(true);

    // Stop any active listening
    stopListening();

    // Ensure audio input is muted while avatar is talking
    if (avatar) {
      avatar.muteInputAudio();
    }

    // Clear any pending auto-listen timeouts
    clearAutoListenTimeout();
  };

  // Handler for when the avatar stops talking
  const handleAvatarStopTalking = () => {
    console.log("Avatar stopped talking");
    setIsSpeaking(false);

    // Clear any auto-listen timeouts first
    clearAutoListenTimeout();

    // Wait for a moment before starting to listen again
    if (autoListen && isSessionActive && avatar) {
      console.log("Setting up auto-listen after avatar stops talking");

      autoListenTimeoutRef.current = setTimeout(() => {
        // Make sure conditions are still valid
        if (autoListen && isSessionActive && !isListening && !isSpeaking && !isThinking && !isProcessingSpeechRef.current) {
          console.log("Auto-restarting listening after avatar finished talking");
          avatar.unmuteInputAudio();
          startListening();
        }
      }, 1000);
    }
  };

  // Handler for when the stream is disconnected
  const handleStreamDisconnected = () => {
    console.log("Stream disconnected");
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsSessionActive(false);
    cleanupListeningResources();
  };

  // Helper function to clear auto-listen timeout
  const clearAutoListenTimeout = () => {
    if (autoListenTimeoutRef.current) {
      clearTimeout(autoListenTimeoutRef.current);
      autoListenTimeoutRef.current = null;
    }
  };

  // Terminate Avatar Session
  const terminateAvatarSession = async () => {
    console.log("Terminating avatar session");
    cleanupListeningResources();
    // Stop user camera
    if (userVideoStream) {
      userVideoStream.getTracks().forEach(track => track.stop());
      setUserVideoStream(null);
    }

    // Clean up audio resources first
    cleanupAudioResources();
    // Stop recording if active
    if (isRecording) {
      stopRecording();
    }
    // Stop screen recording if active
    if (isScreenRecording) {
      stopScreenRecording();
    }

    if (avatar) {
      try {
        // First, remove event listeners
        avatar.off(StreamingEvents.STREAM_READY, handleStreamReady);
        avatar.off(StreamingEvents.AVATAR_START_TALKING, handleAvatarStartTalking);
        avatar.off(StreamingEvents.AVATAR_STOP_TALKING, handleAvatarStopTalking);
        avatar.off(StreamingEvents.STREAM_DISCONNECTED, handleStreamDisconnected);

        // Then stop the avatar
        await avatar.stopAvatar();

        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      } catch (error) {
        console.error("Error while stopping avatar:", error);
      }
    }

    setAvatar(null);
    setIsSessionActive(false);
    setDisplayedText("");
    setStreamingResponse("");
    isProcessingSpeechRef.current = false;
    speakingPromisesRef.current = [];
  };

  // Stop listening - simplified and more reliable
  const stopListening = () => {
    console.log("Stopping listening");

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error("Error stopping speech recognition:", error);
      }
      recognitionRef.current = null;
    }

    setIsListening(false);

    if (listeningTimeoutRef.current) {
      clearTimeout(listeningTimeoutRef.current);
      listeningTimeoutRef.current = null;
    }
  };

  // Toggle auto-listen with proper cleanup
  const toggleAutoListen = () => {
    setAutoListen(prev => {
      console.log(`Toggling auto-listen from ${prev} to ${!prev}`);

      // If turning off auto-listen, clean up any pending timeouts
      if (prev) {
        clearAutoListenTimeout();
        stopListening();
      } else if (isSessionActive && avatar && !isListening && !isSpeaking && !isThinking) {
        // If turning on auto-listen and not currently in an active state, start listening soon
        setTimeout(() => {
          if (isSessionActive && avatar && !isListening && !isSpeaking && !isThinking) {
            console.log("Starting listening after enabling auto-listen");
            startListening();
          }
        }, 1000);
      }

      return !prev;
    });
  };

  // Start Listening for Voice Input - completely rewritten for reliability
  const startListening = () => {
    console.log("Start listening called");

    // Safety checks
    if (isSpeaking || isThinking || isListening || isProcessingSpeechRef.current) {
      console.log("Cannot start listening: Already in an active state");
      return;
    }

    if (!isSessionActive || !avatar) {
      console.log("Cannot start listening: Session not active or avatar not initialized");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error("Speech Recognition is not supported in this browser");
      alert("Speech Recognition is not supported in your browser.");
      return;
    }

    // Clean up any existing recognition instance
    stopListening();

    // Create a new recognition instance
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = false;

    // Set up a timeout for auto-listen mode
    const setupTimeout = () => {
      if (autoListen && recognitionRef.current === recognition) {
        if (listeningTimeoutRef.current) {
          clearTimeout(listeningTimeoutRef.current);
        }

        listeningTimeoutRef.current = setTimeout(() => {
          console.log("Auto-listen timeout reached");
          if (recognitionRef.current === recognition && isListening) {
            stopListening();

            // Restart listening after a short delay
            if (autoListen && isSessionActive && !isSpeaking && !isThinking) {
              clearAutoListenTimeout();

              autoListenTimeoutRef.current = setTimeout(() => {
                if (autoListen && isSessionActive && !isListening && !isSpeaking && !isThinking) {
                  console.log("Restarting listening after timeout");
                  startListening();
                }
              }, 1000);
            }
          }
        }, 5000); // 5 seconds listening timeout
      }
    };

    recognition.onstart = () => {
      console.log("Speech recognition started");
      setIsListening(true);
      listeningStartTimeRef.current = Date.now();

      // Different timeout handling based on mode
      if (autoListen) {
        setupTimeout();
      } else {
        // Manual mode - check spacebar status
        checkSpacebarStatus();
      }
    };

    // Function to check if spacebar is still pressed
    const checkSpacebarStatus = () => {
      if (!spacebarPressedRef.current && recognitionRef.current === recognition) {
        console.log("Spacebar released - stopping recognition");
        stopListening();
      } else if (recognitionRef.current === recognition) {
        listeningTimeoutRef.current = setTimeout(checkSpacebarStatus, 100);
      }
    };

    recognition.onresult = (event) => {
      // Get the last result
      const lastResultIndex = event.results.length - 1;
      const transcript = event.results[lastResultIndex][0].transcript.trim();

      if (transcript) {
        // Avoid duplicate processing when we're already processing speech
        if (!isProcessingSpeechRef.current) {
          console.log("Recognized speech:", transcript);
          // Process the result
          handleRecognizedSpeech(transcript);
        }
      }
    };

    recognition.onend = () => {
      console.log("Speech recognition ended");
      setIsListening(false);

      if (listeningTimeoutRef.current) {
        clearTimeout(listeningTimeoutRef.current);
        listeningTimeoutRef.current = null;
      }

      // If auto-listen is on and we're not processing speech, try again after a delay
      if (autoListen && !isSpeaking && !isThinking && isSessionActive && !isProcessingSpeechRef.current) {
        clearAutoListenTimeout();

        autoListenTimeoutRef.current = setTimeout(() => {
          if (autoListen && !isSpeaking && !isThinking && isSessionActive && !isListening && !isProcessingSpeechRef.current) {
            console.log("Auto-restarting listening after recognition ended");
            startListening();
          }
        }, 1000);
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);

      if (listeningTimeoutRef.current) {
        clearTimeout(listeningTimeoutRef.current);
        listeningTimeoutRef.current = null;
      }

      // For recoverable errors, try again with auto-listen
      if (autoListen && (event.error === "no-speech" || event.error === "network") &&
        !isSpeaking && !isThinking && isSessionActive && !isProcessingSpeechRef.current) {

        clearAutoListenTimeout();

        autoListenTimeoutRef.current = setTimeout(() => {
          if (autoListen && !isSpeaking && !isThinking && isSessionActive && !isListening && !isProcessingSpeechRef.current) {
            console.log("Auto-restarting listening after error:", event.error);
            startListening();
          }
        }, 1500);
      }
    };

    try {
      // Final check before starting
      if (!isSpeaking && !isThinking && !isListening && !isProcessingSpeechRef.current) {
        recognition.start();
        console.log("Recognition started");
      }
    } catch (error) {
      console.error("Error starting speech recognition:", error);
      setIsListening(false);

      // Try again after delay if in auto-listen mode
      if (autoListen && isSessionActive) {
        clearAutoListenTimeout();

        autoListenTimeoutRef.current = setTimeout(() => {
          if (autoListen && !isSpeaking && !isThinking && isSessionActive && !isListening && !isProcessingSpeechRef.current) {
            console.log("Retrying speech recognition after error");
            startListening();
          }
        }, 2000);
      }
    }
  };

  // Handle recognized speech
  const handleRecognizedSpeech = (transcript) => {
    if (!transcript || isProcessingSpeechRef.current) return;

    // Set the processing flag to prevent multiple overlapping speech processing
    isProcessingSpeechRef.current = true;

    // Clean up listening resources
    stopListening();
    clearAutoListenTimeout();

    // Add user message to conversation log
    setRecordedConversation(prev => [...prev, { speaker: "user", text: transcript }]);

    // Now process the speech
    handleStreamingResponse(transcript);
  };

  // Handle streaming response with chunked speaking
  const handleStreamingResponse = async (inputText) => {
    if (!avatar || !openaiAssistantRef.current || !inputText) {
      isProcessingSpeechRef.current = false;
      return;
    }

    setIsThinking(true);
    setIsSpeaking(true);
    setDisplayedText(inputText);
    setStreamingResponse("");

    try {
      // Get streaming response
      const stream = await openaiAssistantRef.current.getStreamingResponse(inputText);

      let currentChunk = "";
      let speakingPromise = null;
      let allPromises = [];
      let fullResponse = "";

      // Clear any previous speaking promises
      speakingPromisesRef.current = [];

      // Process the stream
      for await (const chunk of stream) {
        if (chunk.event === 'thread.message.delta') {
          const deltaContent = chunk.data.delta.content[0]?.text?.value || '';

          // Add to the current chunk and the full response display
          currentChunk += deltaContent;
          fullResponse += deltaContent;
          setStreamingResponse(prevResponse => prevResponse + deltaContent);

          // Check if we have a complete sentence or reasonable chunk
          if (
            deltaContent.includes('.') ||
            deltaContent.includes('!') ||
            deltaContent.includes('?') ||
            currentChunk.length > 100
          ) {
            // Wait for previous speaking to finish before starting new chunk
            if (speakingPromise) {
              await speakingPromise;
            }

            // Speak the current chunk
            const textToSpeak = currentChunk.trim();
            if (textToSpeak) {
              speakingPromise = avatar.speak({
                text: textToSpeak,
                taskType: TaskType.REPEAT,
              });

              // Keep track of all promises for final cleanup
              allPromises.push(speakingPromise);
              speakingPromisesRef.current.push(speakingPromise);
              console.log("Speaking chunk:", textToSpeak.substring(0, 30) + (textToSpeak.length > 30 ? "..." : ""));

              // Reset the current chunk
              currentChunk = "";
            }
          }
        }
      }

      // Add assistant's full response to conversation log
      setRecordedConversation(prev => [...prev, { speaker: "assistant", text: fullResponse }]);

      // Speak any remaining text
      if (currentChunk.trim()) {
        if (speakingPromise) {
          await speakingPromise;
        }

        const finalPromise = avatar.speak({
          text: currentChunk.trim(),
          taskType: TaskType.REPEAT,
        });

        allPromises.push(finalPromise);
        speakingPromisesRef.current.push(finalPromise);
        await finalPromise;
        console.log("Final speaking chunk complete");
      }

      // Make sure ALL speaking is complete
      await Promise.all(allPromises);
      console.log("All speaking complete");

    } catch (error) {
      console.error("Error processing streaming response:", error);

      // Try to speak an error message
      if (avatar) {
        try {
          await avatar.speak({
            text: "Sorry, I encountered an error processing your request.",
            taskType: TaskType.REPEAT
          });
        } catch (e) {
          console.error("Failed to speak error message:", e);
        }
      }

      setStreamingResponse("Sorry, I encountered an error processing your request.");

      // Add error message to conversation log
      setRecordedConversation(prev => [...prev, {
        speaker: "assistant",
        text: "Sorry, I encountered an error processing your request."
      }]);
    } finally {
      setIsThinking(false);
      setIsSpeaking(false);
      setDisplayedText("");
      setStreamingResponse("");

      // Clear speaking promises array
      speakingPromisesRef.current = [];

      // Reset processing flag
      isProcessingSpeechRef.current = false;

      // Clear any existing timeouts
      clearAutoListenTimeout();

      // Set up a new auto-listen timeout if appropriate
      if (autoListen && isSessionActive && avatar) {
        console.log("Setting up post-response listening timer");

        autoListenTimeoutRef.current = setTimeout(() => {
          if (autoListen && isSessionActive && !isListening && !isSpeaking && !isThinking && !isProcessingSpeechRef.current) {
            console.log("Starting post-response listening");
            avatar.unmuteInputAudio();
            startListening();
          }
        }, 1000);
      }
    }
  };

  const downloadScreenRecording = () => {
    if (screenRecording) {
      const a = document.createElement('a');
      document.body.appendChild(a);
      a.style.display = 'none';
      a.href = screenRecording;
      a.download = `${assistantName.replace('/', '')}-session-video.webm`;
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="w-full max-w-4xl bg-white rounded-lg shadow-xl p-6 space-y-6">
      {/* Assistant Name Display */}
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">
          {assistantName.replace("/", "").replace(/-/g, " ").toUpperCase()}
        </h2>
      </div>

      {/* Auto-Listen Toggle */}
      <div className="flex justify-center items-center space-x-2">
        <span className="text-gray-700 font-medium">Auto-Listen:</span>
        <button
          onClick={toggleAutoListen}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${autoListen ? 'bg-blue-600' : 'bg-gray-300'
            }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoListen ? 'translate-x-6' : 'translate-x-1'
              }`}
          />
        </button>
      </div>

      {/* Video Section */}
      <div className="flex justify-center">
        <article className="relative border-4 border-gray-200 rounded-lg overflow-hidden shadow-md w-3/4 aspect-video bg-gray-100">
          {!isSessionActive ? (
            <img src={companyLogo} alt="Company Logo" className="absolute inset-0 w-full h-full object-contain" />
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className={`absolute inset-0 w-full h-full object-contain ${isLoading ? "hidden" : "block"}`}
            />
          )}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          {/* Display streaming response during thinking */}
          {isThinking && streamingResponse && (
            <div className="absolute bottom-4 left-4 right-4 bg-white/75 p-4 rounded-lg shadow-md text-black text-lg max-h-40 overflow-y-auto">
              {streamingResponse}
            </div>
          )}
          {/* Display user input during speaking */}
          {isSpeaking && displayedText && !streamingResponse && (
            <div className="absolute bottom-4 left-4 right-4 bg-white/75 p-4 rounded-lg shadow-md text-black text-lg">
              {displayedText}
            </div>
          )}
        </article>
      </div>

      {/* Status Indicator */}
      <div className="flex justify-center">
        {isListening && (
          <div className="flex items-center gap-2 px-6 py-2 bg-green-100 text-green-800 rounded-full">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span>Listening...</span>
          </div>
        )}
        {isThinking && (
          <div className="flex items-center gap-2 px-6 py-2 bg-blue-100 text-blue-800 rounded-full">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-150"></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-300"></div>
            </div>
            <span>Thinking...</span>
          </div>
        )}
        {isSpeaking && !isThinking && (
          <div className="flex items-center gap-2 px-6 py-2 bg-yellow-100 text-yellow-800 rounded-full">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-yellow-600 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-yellow-600 rounded-full animate-pulse delay-150"></div>
              <div className="w-2 h-2 bg-yellow-600 rounded-full animate-pulse delay-300"></div>
            </div>
            <span>Speaking...</span>
          </div>
        )}
      </div>

      {/* Spacebar Prompt (shown only when auto-listen is off) */}
      {isSessionActive && !isThinking && !isSpeaking && !autoListen && (
        <div className="flex justify-center">
          <div className={`flex items-center gap-2 px-6 py-3 text-lg font-semibold rounded-lg border-2 ${isListening
            ? "border-yellow-500 bg-yellow-100 text-yellow-800"
            : "border-gray-300 bg-gray-100 text-gray-700"
            }`}>
            <span className="inline-block px-2 py-1 bg-gray-200 rounded text-sm border border-gray-400 shadow-sm">Space</span>
            <span>{isListening ? "Release to stop listening" : "Press and hold to speak"}</span>
            {isListening && (
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
            )}
          </div>
        </div>
      )}

      {/* Start/End Session Buttons */}
      {!isThinking && !isSpeaking && (
        <div className="flex justify-center space-x-4">
          <button
            onClick={initializeAvatarSession}
            disabled={isSessionActive || isLoading}
            className={`px-6 py-3 text-lg font-semibold rounded-lg 
                        ${isSessionActive || isLoading ? "bg-blue-400 text-gray-200 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"}`}
          >
            Start Session
          </button>
          <button
            onClick={terminateAvatarSession}
            disabled={!isSessionActive}
            className={`px-6 py-3 text-lg font-semibold rounded-lg 
                        ${!isSessionActive ? "bg-red-400 text-gray-200 cursor-not-allowed" : "bg-red-600 text-white hover:bg-red-700"}`}
          >
            End Session
          </button>
        </div>
      )}
      {/* User video camera preview */}
      <div className="absolute top-4 right-4 w-64 h-48 rounded-lg overflow-hidden shadow-lg border-2 border-blue-500 z-20">
        <video
          ref={userVideoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover bg-gray-900"
        />
        {userVideoStream ? (
          <div className="absolute bottom-2 left-2 bg-green-500 px-2 py-1 rounded-full text-xs text-white">
            Live
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 to-purple-900 text-white">
            <div className="mb-2 rounded-full bg-blue-500/30 p-4">
              <MicIcon className="w-8 h-8 text-blue-200" />
            </div>
            <p className="text-sm font-medium">Click on "Start Session"</p>
            <p className="text-xs text-blue-200">to enable camera</p>
            <div className="mt-2 flex space-x-1">
              <div className="w-2 h-2 bg-blue-300 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-300 rounded-full animate-bounce delay-150"></div>
              <div className="w-2 h-2 bg-blue-300 rounded-full animate-bounce delay-300"></div>
            </div>
          </div>
        )}
      </div>
      {/* Recorded Audio Player (shows after session ends) */}
      {recordedAudio && !isSessionActive && (
        <div className="mt-6 p-4 bg-gray-100 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Session Recordings</h3>

          {/* Audio Recording */}
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-700 mb-2">Audio Recording</h4>
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex-grow w-full">
                <audio
                  ref={audioPlayerRef}
                  src={recordedAudio}
                  className="w-full"
                  controls
                  onEnded={handleAudioEnded}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={togglePlayPause}
                  className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <PauseIcon size={20} /> : <PlayIcon size={20} />}
                </button>
                <button
                  onClick={downloadRecording}
                  className="p-2 bg-green-600 text-white rounded-full hover:bg-green-700"
                  title="Download Audio Recording"
                >
                  <DownloadIcon size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Video Recording */}
          {screenRecording && (
            <div className="mb-6">
              <h4 className="text-md font-medium text-gray-700 mb-2">Video Recording</h4>
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  src={screenRecording}
                  className="w-full h-full object-contain"
                  controls
                />
              </div>
              <div className="mt-2 flex justify-end">
                <button
                  onClick={downloadScreenRecording}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
                  title="Download Video Recording"
                >
                  <DownloadIcon size={16} /> Download Video
                </button>
              </div>
            </div>
          )}

          {/* Conversation Transcript */}
          {recordedConversation.length > 0 && (
            <div className="mt-4">
              <h4 className="text-md font-medium text-gray-700 mb-2">Conversation Transcript:</h4>
              <div className="max-h-60 overflow-y-auto bg-white p-3 rounded border">
                {recordedConversation.map((entry, index) => (
                  <div key={index} className={`mb-2 p-2 rounded ${entry.speaker === "user" ? "bg-blue-50" : "bg-green-50"}`}>
                    <span className="font-bold">{entry.speaker === "user" ? "You: " : "Assistant: "}</span>
                    <span>{entry.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AvatarControl;