import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Box,
  Flex,
  HStack,
  Text,
  VStack,
  Button,
  Spinner,
  IconButton,
  Tooltip,
} from '@chakra-ui/react';
import { CameraEngine } from '../../lib/vision/camera-engine';
import { PoseEngine } from '../../lib/vision/pose-engine';
import { LandmarkProcessor } from '../../lib/vision/landmark-processor';
import { CanvasRenderer } from '../../lib/vision/canvas-renderer';
import { ExerciseDefinition, ExerciseMetrics, FormFeedback, MovementPhase, RepRecord } from '../../lib/types/exercise';
import { CameraState } from '../../lib/types/camera';
import { PoseResults, TrackingQuality } from '../../lib/types/pose';
import { SetRecord, WorkoutSession, DebugMetrics } from '../../lib/types/session';
import { audioCue } from '../../lib/feedback/audio-cue';
import { voiceCoach } from '../../lib/feedback/voice-coach';
import { readinessEvaluator, TrackingReadiness } from '../../lib/vision/readiness-evaluator';
import { workoutStorage } from '../../lib/storage/workout-storage';
import { TrackingStatusBadge } from '../ui/TrackingStatusBadge';
import { RepCounterCard } from '../ui/RepCounterCard';
import { FormFeedbackAlert } from '../ui/FormFeedbackAlert';
import { SetupCheckScreen } from '../workout/SetupCheckScreen';
import { CalibrationScreen } from '../workout/CalibrationScreen';
import { RestTimerCard } from '../workout/RestTimerCard';
import { WorkoutSummaryCard } from '../workout/WorkoutSummaryCard';
import { DebugOverlay } from '../debug/DebugOverlay';

interface MotionTrackerProps {
  exercise: ExerciseDefinition;
  targetSets?: number;
  targetReps?: number;
  restSeconds?: number;
  workoutName?: string;
  onSessionSaved?: (session: WorkoutSession) => void;
  onRestartWorkout?: () => void;
}

export const MotionTracker: React.FC<MotionTrackerProps> = ({
  exercise,
  targetSets = 3,
  targetReps = 10,
  restSeconds = 60,
  workoutName,
  onSessionSaved,
  onRestartWorkout,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Vision pipeline instances maintained across renders
  const cameraEngineRef = useRef<CameraEngine | null>(null);
  const poseEngineRef = useRef<PoseEngine | null>(null);
  const landmarkProcessorRef = useRef<LandmarkProcessor | null>(null);
  const canvasRendererRef = useRef<CanvasRenderer | null>(null);

  // Active exercise ref for high-frequency access without closure staleness
  const exerciseRef = useRef<ExerciseDefinition>(exercise);
  useEffect(() => {
    exerciseRef.current = exercise;
    exercise.init();
    if (landmarkProcessorRef.current) {
      landmarkProcessorRef.current.reset();
    }
  }, [exercise]);

  // Workout Session State Machine
  const [workflowStatus, setWorkflowStatus] = useState<'setup' | 'calibrating' | 'active' | 'resting' | 'completed'>('setup');
  const [currentSetIndex, setCurrentSetIndex] = useState<number>(1);
  const [completedSets, setCompletedSets] = useState<SetRecord[]>([]);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [completedSession, setCompletedSession] = useState<WorkoutSession | null>(null);

  const sessionStartTimeRef = useRef<number>(Date.now());
  const currentSetStartTimeRef = useRef<number>(Date.now());
  const currentSetRepsRef = useRef<RepRecord[]>([]);

  // Telemetry & Debug metrics
  const [isDebugOpen, setIsDebugOpen] = useState<boolean>(false);
  const [debugMetrics, setDebugMetrics] = useState<DebugMetrics>({
    fps: 0,
    inferenceMs: 0,
    trackingConfidence: 0,
    canvasResolution: '0x0',
    activeJointAngles: {},
    trackingStatus: 'INITIALIZING',
  });
  const frameTimestampsRef = useRef<number[]>([]);
  const lastSendTimeRef = useRef<number>(0);

  // Keyboard shortcut (Shift + D) to toggle CV Debug HUD
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        setIsDebugOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Readiness state during setup
  const [readiness, setReadiness] = useState<TrackingReadiness>({
    isReady: false,
    status: 'NOT_READY',
    checks: [],
    guidanceMessage: 'Position yourself in front of the camera.',
  });

  // UI state updated at low frequency
  const [cameraState, setCameraState] = useState<CameraState>({
    status: 'INITIALIZING',
    videoWidth: 0,
    videoHeight: 0,
    isStreaming: false,
  });

  const [trackingQuality, setTrackingQuality] = useState<TrackingQuality>({
    status: 'INITIALIZING',
    confidence: 0,
    missingLandmarks: [],
    detectedLandmarkCount: 0,
  });

  const [reps, setReps] = useState<number>(0);
  const [phase, setPhase] = useState<MovementPhase>('READY');
  const [metrics, setMetrics] = useState<ExerciseMetrics>({
    primaryMetricLabel: 'Joint Angle',
    primaryMetricValue: '--',
  });
  const [feedback, setFeedback] = useState<FormFeedback | null>(null);
  const [mirrored, setMirrored] = useState<boolean>(true);

  // Throttling ref for high-frequency metrics UI updates
  const lastUiUpdateRef = useRef<number>(0);

  // High-frequency Pose Results Callback
  const handlePoseResults = useCallback((results: PoseResults) => {
    if (!canvasRendererRef.current || !landmarkProcessorRef.current || !exerciseRef.current) {
      return;
    }

    const now = performance.now();
    const currentEx = exerciseRef.current;

    // Measure FPS
    const stamps = frameTimestampsRef.current;
    stamps.push(now);
    while (stamps.length > 0 && stamps[0] < now - 1000) {
      stamps.shift();
    }
    const currentFps = stamps.length;
    const inferenceMs = lastSendTimeRef.current > 0 ? Math.max(1, now - lastSendTimeRef.current) : 16;

    // 1. Process and smooth landmarks
    const { quality, smoothedLandmarks, rawLandmarks } =
      landmarkProcessorRef.current.process(results.poseLandmarks, currentEx.requiredLandmarks);

    // 2. Evaluate tracking readiness
    const currentCameraState = cameraEngineRef.current ? cameraEngineRef.current.getState() : cameraState;
    const currentReadiness = readinessEvaluator.evaluate(currentCameraState, quality, smoothedLandmarks, currentEx);

    // 3. Render canvas overlay
    canvasRendererRef.current.render(results.image, smoothedLandmarks, {
      mirrored,
      activeLandmarks: currentEx.requiredLandmarks,
      showSkeleton: quality.status !== 'TRACKING_LOST',
    });

    // 4. In setup or calibrating mode: evaluate readiness & tracking
    if (workflowStatus === 'setup' || workflowStatus === 'calibrating') {
      if (now - lastUiUpdateRef.current > 120) {
        lastUiUpdateRef.current = now;
        setReadiness(currentReadiness);
        setTrackingQuality(quality);
        setDebugMetrics({
          fps: currentFps,
          inferenceMs,
          trackingConfidence: quality.confidence,
          canvasResolution: `${currentCameraState.videoWidth}x${currentCameraState.videoHeight}`,
          activeJointAngles: {},
          trackingStatus: quality.status,
        });
      }
      return;
    }

    // 5. In active workout mode: evaluate exercise kinematics
    if (workflowStatus === 'active' && !isPaused) {
      const exResult = currentEx.processFrame({
        timestamp: now,
        smoothedLandmarks,
        rawLandmarks,
        trackingConfidence: quality.confidence,
      });

      // Rep completion handling
      if (exResult.isRepCompleted && exResult.completedRep) {
        currentSetRepsRef.current.push(exResult.completedRep);
        audioCue.playRepSuccess();
        voiceCoach.announceRep(exResult.reps);
      } else if (exResult.feedback) {
        if (exResult.feedback.severity === 'warning') {
          audioCue.playWarning();
        }
        if (exResult.feedback.priority === 'critical') {
          voiceCoach.announceFormCue(exResult.feedback.message);
        }
      }

      // Throttled UI State Update
      const shouldUpdateUi =
        exResult.isRepCompleted ||
        exResult.feedback !== null ||
        now - lastUiUpdateRef.current > 120;

      if (shouldUpdateUi) {
        lastUiUpdateRef.current = now;
        setReps(exResult.reps);
        setPhase(exResult.phase);
        setMetrics(exResult.metrics);
        setTrackingQuality(quality);

        if (exResult.feedback) {
          setFeedback(exResult.feedback);
        }

        setDebugMetrics({
          fps: currentFps,
          inferenceMs,
          trackingConfidence: quality.confidence,
          canvasResolution: `${currentCameraState.videoWidth}x${currentCameraState.videoHeight}`,
          activeJointAngles: exResult.metrics.angleBreakdown || {},
          trackingStatus: quality.status,
        });
      }
    }
  }, [mirrored, workflowStatus, isPaused, cameraState]);

  // Lifecycle initialization and cleanup
  useEffect(() => {
    let isCancelled = false;

    const initPipeline = async () => {
      if (typeof window === 'undefined') return;

      const videoEl = videoRef.current;
      const canvasEl = canvasRef.current;
      if (!videoEl || !canvasEl) return;

      const renderer = new CanvasRenderer(canvasEl);
      canvasRendererRef.current = renderer;

      const processor = new LandmarkProcessor();
      landmarkProcessorRef.current = processor;

      const pose = new PoseEngine({
        modelComplexity: 1,
        smoothLandmarks: true,
      });
      poseEngineRef.current = pose;
      pose.setOnResults(handlePoseResults);

      const camera = new CameraEngine({
        width: 1280,
        height: 720,
        mirrored: true,
      });
      cameraEngineRef.current = camera;

      camera.setCallbacks({
        onStatusChange: (newState) => {
          if (!isCancelled) {
            setCameraState(newState);
            if (newState.videoWidth > 0 && newState.videoHeight > 0) {
              renderer.setDimensions(newState.videoWidth, newState.videoHeight);
            }
          }
        },
        onFrame: async (video) => {
          if (pose.ready) {
            lastSendTimeRef.current = performance.now();
            await pose.send(video);
          }
        },
      });

      try {
        await pose.initialize();
        if (isCancelled) return;
        await camera.start(videoEl);
      } catch (err) {
        if (!isCancelled) {
          console.error('MotionTracker initialization error:', err);
        }
      }
    };

    initPipeline();

    return () => {
      isCancelled = true;
      if (cameraEngineRef.current) {
        cameraEngineRef.current.stop();
        cameraEngineRef.current = null;
      }
      if (poseEngineRef.current) {
        poseEngineRef.current.close();
        poseEngineRef.current = null;
      }
      if (canvasRendererRef.current) {
        canvasRendererRef.current.clear();
        canvasRendererRef.current = null;
      }
      landmarkProcessorRef.current = null;
    };
  }, [handlePoseResults]);

  // Workout Flow Handlers
  const handleInitiateCalibration = () => {
    setWorkflowStatus('calibrating');
  };

  const handleCalibrationComplete = () => {
    handleStartSet();
  };

  const handleStartSet = () => {
    exerciseRef.current?.reset();
    setReps(0);
    setPhase('READY');
    setFeedback(null);
    currentSetStartTimeRef.current = Date.now();
    currentSetRepsRef.current = [];
    setWorkflowStatus('active');
  };

  const handleCompleteSet = () => {
    const setDurationMs = Date.now() - currentSetStartTimeRef.current;
    const completedSetRecord: SetRecord = {
      setNumber: currentSetIndex,
      exerciseId: exercise.id,
      targetReps,
      completedReps: reps,
      reps: [...currentSetRepsRef.current],
      startedAt: currentSetStartTimeRef.current,
      completedAt: Date.now(),
      durationMs: setDurationMs,
      restDurationSeconds: restSeconds,
    };

    const newCompletedSets = [...completedSets, completedSetRecord];
    setCompletedSets(newCompletedSets);

    if (currentSetIndex < targetSets) {
      voiceCoach.announceSetComplete(currentSetIndex, restSeconds);
      setWorkflowStatus('resting');
    } else {
      finishWorkoutSession(newCompletedSets);
    }
  };

  const finishWorkoutSession = (sets: SetRecord[]) => {
    const totalRepsCount = sets.reduce((sum, s) => sum + s.completedReps, 0);
    const sessionDurationSec = Math.round((Date.now() - sessionStartTimeRef.current) / 1000);

    // Calculate quality breakdown and average form score
    let clean = 0;
    let good = 0;
    let partial = 0;
    let totalRom = 0;
    let countedReps = 0;
    const faults: string[] = [];

    for (const s of sets) {
      for (const r of s.reps) {
        countedReps++;
        totalRom += r.romDegrees;
        if (r.quality === 'Clean') clean++;
        else if (r.quality === 'Good') good++;
        else partial++;
        for (const f of r.formFaults) {
          if (!faults.includes(f)) faults.push(f);
        }
      }
    }

    const formScore = countedReps > 0
      ? Math.round(((clean * 100 + good * 80 + partial * 50) / (countedReps * 100)) * 100)
      : 80;

    const avgRom = countedReps > 0 ? Math.round(totalRom / countedReps) : 90;
    const bestSet = Math.max(...sets.map((s) => s.completedReps), 0);

    const fullSession: WorkoutSession = {
      id: `session-${Date.now()}`,
      name: workoutName || `${exercise.name} Training`,
      startedAt: sessionStartTimeRef.current,
      completedAt: Date.now(),
      durationSeconds: sessionDurationSec,
      status: 'completed',
      currentExerciseIndex: 0,
      currentSetIndex: sets.length,
      restTimeRemainingSeconds: 0,
      activeRestDurationSeconds: restSeconds,
      exercises: [
        {
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          targetSets,
          targetRepsPerSet: targetReps,
          completedSets: sets,
          totalReps: totalRepsCount,
          averageRomDegrees: avgRom,
          bestSetReps: bestSet,
          qualityBreakdown: { clean, good, partial },
          commonFaults: faults,
        },
      ],
      totalReps: totalRepsCount,
      averageFormScore: formScore,
      bestExerciseName: exercise.name,
    };

    workoutStorage.saveSession(fullSession);
    setCompletedSession(fullSession);
    setWorkflowStatus('completed');

    if (onSessionSaved) {
      onSessionSaved(fullSession);
    }
  };

  const handleFinishRest = () => {
    setCurrentSetIndex((prev) => prev + 1);
    handleStartSet();
  };

  const handleRestart = () => {
    setCompletedSets([]);
    setCurrentSetIndex(1);
    setCompletedSession(null);
    sessionStartTimeRef.current = Date.now();
    setWorkflowStatus('setup');
    if (onRestartWorkout) {
      onRestartWorkout();
    }
  };

  return (
    <Flex
      w="100%"
      maxW="7xl"
      mx="auto"
      direction={{ base: 'column', lg: 'row' }}
      gap={6}
      p={{ base: 3, md: 6 }}
      alignItems="flex-start"
    >
      {/* Video & Canvas Viewport */}
      <Box
        flex="1"
        w="100%"
        position="relative"
        bg="surface.card"
        border="1px solid"
        borderColor="surface.border"
        borderRadius="2xl"
        overflow="hidden"
        boxShadow="0 8px 32px rgba(0, 0, 0, 0.4)"
      >
        <video ref={videoRef} style={{ display: 'none' }} playsInline muted />

        <Box position="relative" w="100%" pb="56.25%" bg="#080C14">
          <canvas
            ref={canvasRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
          />

          {/* Top HUD Controls */}
          <Flex position="absolute" top={3} left={3} right={3} justify="space-between" align="center" pointerEvents="none" zIndex={15}>
            <Box pointerEvents="auto">
              <TrackingStatusBadge quality={trackingQuality} />
            </Box>

            <HStack spacing={2} pointerEvents="auto">
              <DebugOverlay
                metrics={debugMetrics}
                phase={phase}
                reps={reps}
                isOpen={isDebugOpen}
                onToggle={() => setIsDebugOpen(!isDebugOpen)}
              />
              <Tooltip label={mirrored ? 'Mirror View Active' : 'Normal View'}>
                <IconButton
                  size="xs"
                  aria-label="Toggle Camera Mirror"
                  variant="solid"
                  bg="rgba(15, 22, 36, 0.75)"
                  color="#00F2FE"
                  border="1px solid"
                  borderColor="surface.border"
                  backdropFilter="blur(6px)"
                  _hover={{ bg: 'surface.elevated' }}
                  onClick={() => setMirrored(!mirrored)}
                  icon={
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="15 3 21 3 21 9" />
                      <polyline points="9 21 3 21 3 15" />
                      <line x1="21" y1="3" x2="14" y2="10" />
                      <line x1="3" y1="21" x2="10" y2="14" />
                    </svg>
                  }
                />
              </Tooltip>
            </HStack>
          </Flex>

          {/* Tracking Recovery Overlay */}
          {workflowStatus === 'active' && trackingQuality.status === 'TRACKING_LOST' && (
            <Flex
              position="absolute"
              top="40%"
              left="50%"
              transform="translate(-50%, -50%)"
              bg="rgba(15, 22, 36, 0.94)"
              border="1px solid"
              borderColor="red.500"
              borderRadius="xl"
              px={5}
              py={3}
              align="center"
              gap={3}
              boxShadow="0 8px 32px rgba(239, 68, 68, 0.35)"
              zIndex={20}
              pointerEvents="none"
            >
              <Box w={3} h={3} borderRadius="full" bg="red.500" />
              <VStack align="flex-start" spacing={0}>
                <Text fontSize="sm" fontWeight="700" color="white">
                  Tracking Lost
                </Text>
                <Text fontSize="xs" color="gray.400">
                  Step back into camera frame to resume counting
                </Text>
              </VStack>
            </Flex>
          )}

          {/* Bottom HUD: Real-time Form Feedback Alert */}
          {workflowStatus === 'active' && (
            <Box position="absolute" bottom={4} left={4} right={4} pointerEvents="none" zIndex={15}>
              <FormFeedbackAlert feedback={feedback} />
            </Box>
          )}

          {/* Setup / Camera Positioning Overlay */}
          {workflowStatus === 'setup' && cameraState.status === 'READY' && (
            <SetupCheckScreen
              exercise={exercise}
              readiness={readiness}
              onStartSet={handleInitiateCalibration}
              targetReps={targetReps}
              currentSet={currentSetIndex}
              totalSets={targetSets}
            />
          )}

          {/* Calibration Overlay */}
          {workflowStatus === 'calibrating' && (
            <CalibrationScreen
              exerciseName={exercise.name}
              trackingQuality={trackingQuality}
              onCalibrationComplete={handleCalibrationComplete}
              onCancel={() => setWorkflowStatus('setup')}
            />
          )}

          {/* Rest Timer Overlay */}
          {workflowStatus === 'resting' && (
            <RestTimerCard
              initialSeconds={restSeconds}
              nextExerciseName={exercise.name}
              nextSetNumber={currentSetIndex + 1}
              totalSets={targetSets}
              nextTargetReps={targetReps}
              onFinishRest={handleFinishRest}
            />
          )}

          {/* Workout Completed Summary Overlay */}
          {workflowStatus === 'completed' && completedSession && (
            <Box position="absolute" inset={0} bg="rgba(8, 12, 20, 0.96)" overflowY="auto" p={4} zIndex={30}>
              <WorkoutSummaryCard
                session={completedSession}
                onFinishAndSave={handleRestart}
                onRestart={handleRestart}
              />
            </Box>
          )}

          {/* Camera Loading & Permission Overlays */}
          {cameraState.status !== 'READY' && (
            <Flex
              position="absolute"
              inset={0}
              bg="rgba(8, 12, 20, 0.92)"
              backdropFilter="blur(8px)"
              direction="column"
              align="center"
              justify="center"
              p={6}
              textAlign="center"
              zIndex={40}
            >
              {cameraState.status === 'INITIALIZING' ? (
                <VStack spacing={4}>
                  <Spinner size="xl" color="#00F2FE" thickness="3px" speed="0.8s" />
                  <Text fontSize="md" fontWeight="600" color="gray.200">
                    Initializing MotionBird Movement Engine...
                  </Text>
                  <Text fontSize="xs" color="gray.500" maxW="sm">
                    Loading MediaPipe pose models and configuring camera stream.
                  </Text>
                </VStack>
              ) : cameraState.status === 'PERMISSION_DENIED' ? (
                <VStack spacing={4} maxW="md">
                  <Text fontSize="lg" fontWeight="700" color="white">
                    Camera Permission Required
                  </Text>
                  <Text fontSize="sm" color="gray.400">
                    MotionBird runs computer vision locally on your device to analyze posture. Please allow camera access in your browser permissions bar.
                  </Text>
                  <Button size="sm" colorScheme="cyan" onClick={() => cameraEngineRef.current?.start(videoRef.current!)}>
                    Retry Access
                  </Button>
                </VStack>
              ) : (
                <VStack spacing={4} maxW="md">
                  <Text fontSize="lg" fontWeight="700" color="#EF4444">
                    Camera Unavailable
                  </Text>
                  <Text fontSize="sm" color="gray.400">
                    {cameraState.errorMessage || 'Unable to connect to camera device.'}
                  </Text>
                  <Button size="sm" variant="outline" borderColor="surface.border" onClick={() => cameraEngineRef.current?.start(videoRef.current!)}>
                    Retry Connection
                  </Button>
                </VStack>
              )}
            </Flex>
          )}
        </Box>
      </Box>

      {/* Side HUD Panel: Rep Counter, Phase, and Exercise Details */}
      <Box w={{ base: '100%', lg: '340px' }} flexShrink={0}>
        <VStack spacing={4} align="stretch">
          <RepCounterCard
            reps={reps}
            targetReps={targetReps}
            currentSet={currentSetIndex}
            totalSets={targetSets}
            phase={phase}
            metrics={metrics}
            exerciseName={exercise.name}
            isPaused={isPaused}
            onTogglePause={() => setIsPaused(!isPaused)}
            onCompleteSet={handleCompleteSet}
            onFinishWorkout={() => finishWorkoutSession(completedSets)}
          />

          {/* Exercise Info & Instructions */}
          <Box bg="surface.card" border="1px solid" borderColor="surface.border" borderRadius="2xl" p={4}>
            <Text fontSize="xs" fontWeight="700" color="gray.400" textTransform="uppercase" mb={2}>
              Form Guide & Checklist
            </Text>
            <VStack align="stretch" spacing={2}>
              {exercise.instructions.slice(0, 3).map((inst, idx) => (
                <HStack key={idx} align="flex-start" spacing={2} fontSize="2xs" color="gray.300">
                  <Text color="#00F2FE" fontWeight="800">&bull;</Text>
                  <Text>{inst}</Text>
                </HStack>
              ))}
            </VStack>

            <Text fontSize="2xs" fontWeight="700" color="gray.500" textTransform="uppercase" mt={3} mb={1.5}>
              Target Muscles
            </Text>
            <Flex wrap="wrap" gap={1.5}>
              {exercise.targetMuscles.map((muscle) => (
                <Box
                  key={muscle}
                  px={2}
                  py={0.5}
                  borderRadius="md"
                  bg="surface.elevated"
                  border="1px solid"
                  borderColor="surface.border"
                  fontSize="2xs"
                  color="#00F2FE"
                  fontWeight="600"
                >
                  {muscle}
                </Box>
              ))}
            </Flex>
          </Box>
        </VStack>
      </Box>
    </Flex>
  );
};
