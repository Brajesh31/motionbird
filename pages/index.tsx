import React, { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { Box, Container, Flex, Text, Spinner, Center } from '@chakra-ui/react';
import { Header, ActiveTab } from '../components/layout/Header';
import { exerciseRegistry } from '../lib/exercises/registry';
import { ExerciseDefinition } from '../lib/types/exercise';
import { UserGoal, UserProfile, WorkoutPlan, WorkoutSession } from '../lib/types/session';
import { audioCue } from '../lib/feedback/audio-cue';
import { voiceCoach } from '../lib/feedback/voice-coach';
import { workoutStorage } from '../lib/storage/workout-storage';
import { WorkoutBuilderModal } from '../components/workout/WorkoutBuilderModal';
import { SessionHistoryView } from '../components/history/SessionHistoryView';
import { ProgressDashboard } from '../components/progress/ProgressDashboard';
import { UserProfileModal } from '../components/profile/UserProfileModal';
import { OnboardingModal } from '../components/onboarding/OnboardingModal';
import { LandingHero } from '../components/landing/LandingHero';
import { ExerciseLibraryView } from '../components/exercises/ExerciseLibraryView';

// Dynamic import with ssr: false for camera & MediaPipe pose engine
const MotionTracker = dynamic(
  () => import('../components/vision/MotionTracker').then((mod) => mod.MotionTracker),
  {
    ssr: false,
    loading: () => (
      <Center minH="450px" w="100%">
        <Flex direction="column" align="center" gap={3}>
          <Spinner size="xl" color="#00F2FE" thickness="3px" />
          <Text fontSize="sm" color="gray.400" fontWeight="600">
            Initializing MotionBird Movement Engine...
          </Text>
        </Flex>
      </Center>
    ),
  }
);

export default function MotionBirdApp() {
  const exercises = useMemo(() => exerciseRegistry.getAll(), []);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>(
    exercises[0]?.id || 'bicep-curl'
  );

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [targetSets, setTargetSets] = useState<number>(3);
  const [targetReps, setTargetReps] = useState<number>(10);
  const [restSeconds, setRestSeconds] = useState<number>(60);
  const [workoutName, setWorkoutName] = useState<string>('Standard Routine');

  // Modals state
  const [isBuilderOpen, setIsBuilderOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);

  // Audio & Voice Coach state
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState<boolean>(false);

  // Persistence data state
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [profile, setProfile] = useState<UserProfile>(workoutStorage.getProfile());
  const [goals, setGoals] = useState<UserGoal[]>(workoutStorage.getGoals());

  // Load persistence data on client mount
  useEffect(() => {
    const loadedSessions = workoutStorage.getSessions();
    setSessions(loadedSessions);
    const loadedProfile = workoutStorage.getProfile();
    setProfile(loadedProfile);
    setGoals(workoutStorage.getGoals());

    // Prompt lightweight onboarding if brand new user
    if (loadedSessions.length === 0 && loadedProfile.completedWorkoutsCount === 0) {
      const hasSeenOnboarding = localStorage.getItem('motionbird_has_seen_onboarding');
      if (!hasSeenOnboarding) {
        setIsOnboardingOpen(true);
      }
    }
  }, []);

  const activeExercise = useMemo(() => {
    return exerciseRegistry.get(selectedExerciseId) || exerciseRegistry.getDefault();
  }, [selectedExerciseId]);

  const handleToggleAudio = () => {
    const nextMuted = audioCue.toggleMute();
    setIsAudioMuted(nextMuted);
  };

  const handleToggleVoice = () => {
    const nextVoice = voiceCoach.toggle();
    setIsVoiceEnabled(nextVoice);
  };

  const handleStartPresetPlan = (plan: WorkoutPlan) => {
    setWorkoutName(plan.name);
    const firstItem = plan.items[0];
    if (firstItem) {
      setSelectedExerciseId(firstItem.exerciseId);
      setTargetSets(firstItem.sets);
      setTargetReps(firstItem.targetReps);
      setRestSeconds(firstItem.restSeconds);
    }
    setActiveTab('workout');
  };

  const handleStartSingleExercise = (
    exercise: ExerciseDefinition,
    sets: number,
    reps: number,
    rest: number
  ) => {
    setSelectedExerciseId(exercise.id);
    setTargetSets(sets);
    setTargetReps(reps);
    setRestSeconds(rest);
    setWorkoutName(`${exercise.name} Focus`);
    setActiveTab('workout');
  };

  const handleSessionSaved = (newSession: WorkoutSession) => {
    setSessions(workoutStorage.getSessions());
    setProfile(workoutStorage.getProfile());
    setGoals(workoutStorage.getGoals());
  };

  const handleSaveProfile = (updates: Partial<UserProfile>) => {
    const updated = workoutStorage.updateProfile(updates);
    setProfile(updated);
    localStorage.setItem('motionbird_has_seen_onboarding', 'true');
  };

  return (
    <>
      <Head>
        <title>MotionBird — Real-Time Movement Intelligence</title>
        <meta
          name="description"
          content="MotionBird — Real-time computer-vision fitness movement intelligence platform for tracking exercise performance, repetitions, and form."
        />
      </Head>

      <Flex direction="column" minH="100vh" bg="surface.base">
        {/* Navigation & Header */}
        <Header
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          activeExercise={activeExercise}
          onOpenWorkoutBuilder={() => setIsBuilderOpen(true)}
          onOpenProfile={() => setIsProfileOpen(true)}
          isAudioMuted={isAudioMuted}
          onToggleAudio={handleToggleAudio}
          isVoiceEnabled={isVoiceEnabled}
          onToggleVoice={handleToggleVoice}
        />

        {/* Primary Content View Switcher */}
        <Box as="main" flex="1" py={{ base: 4, md: 6 }}>
          <Container maxW="7xl" px={{ base: 3, md: 6 }}>
            {activeTab === 'dashboard' && (
              <LandingHero
                onStartTraining={() => setActiveTab('workout')}
                onExploreExercises={() => setActiveTab('exercises')}
                onOpenWorkoutBuilder={() => setIsBuilderOpen(true)}
              />
            )}

            {activeTab === 'workout' && (
              <MotionTracker
                exercise={activeExercise}
                targetSets={targetSets}
                targetReps={targetReps}
                restSeconds={restSeconds}
                workoutName={workoutName}
                onSessionSaved={handleSessionSaved}
                onRestartWorkout={() => {}}
              />
            )}

            {activeTab === 'exercises' && (
              <ExerciseLibraryView
                onSelectExercise={(ex) => {
                  setSelectedExerciseId(ex.id);
                  setWorkoutName(`${ex.name} Focus`);
                  setActiveTab('workout');
                }}
              />
            )}

            {activeTab === 'history' && (
              <SessionHistoryView
                sessions={sessions}
                onStartNewWorkout={() => setActiveTab('workout')}
              />
            )}

            {activeTab === 'progress' && (
              <ProgressDashboard
                profile={profile}
                goals={goals}
                sessions={sessions}
              />
            )}
          </Container>
        </Box>

        {/* Workout Builder & Exercise Selector Modal */}
        <WorkoutBuilderModal
          isOpen={isBuilderOpen}
          onClose={() => setIsBuilderOpen(false)}
          exercises={exercises}
          onStartPlan={handleStartPresetPlan}
          onStartSingleExercise={handleStartSingleExercise}
        />

        {/* User Profile Modal */}
        <UserProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          profile={profile}
          onSaveProfile={handleSaveProfile}
        />

        {/* First-Time Onboarding Modal */}
        <OnboardingModal
          isOpen={isOnboardingOpen}
          onClose={() => {
            setIsOnboardingOpen(false);
            localStorage.setItem('motionbird_has_seen_onboarding', 'true');
          }}
          onSaveProfile={handleSaveProfile}
        />

        {/* Technical Footer */}
        <Box
          as="footer"
          py={4}
          px={6}
          borderTop="1px solid"
          borderColor="surface.border"
          bg="surface.card"
        >
          <Flex
            maxW="7xl"
            mx="auto"
            justify="space-between"
            align="center"
            direction={{ base: 'column', sm: 'row' }}
            gap={2}
          >
            <Text fontSize="xs" color="gray.500">
              MotionBird &copy; {new Date().getFullYear()} &bull; Movement Intelligence Platform
            </Text>
            <Text fontSize="xs" color="gray.600">
              On-Device Inference &bull; Zero Video Uploaded &bull; Privacy First
            </Text>
          </Flex>
        </Box>
      </Flex>
    </>
  );
}
