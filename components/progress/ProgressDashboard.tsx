import React from 'react';
import {
  Box,
  Flex,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  Progress,
  Badge,
} from '@chakra-ui/react';
import { UserGoal, UserProfile, WorkoutSession } from '../../lib/types/session';
import { workoutStorage } from '../../lib/storage/workout-storage';

interface ProgressDashboardProps {
  profile: UserProfile;
  goals: UserGoal[];
  sessions: WorkoutSession[];
}

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({
  profile,
  goals,
  sessions,
}) => {
  // Deterministic recommendation
  const getRecommendation = () => {
    if (sessions.length === 0) {
      return 'Welcome to MotionBird! Start with the Full Body Foundation to calibrate your movement range.';
    }
    const lastSession = sessions[0];
    const hasLower = lastSession.exercises.some((e) => e.exerciseId === 'squat');
    if (hasLower) {
      return 'Great lower body work last session! Focus on Upper Body Power (Overhead Press & Push-ups) today.';
    } else {
      return 'You focused on upper body recently. Incorporate Bodyweight Squats today for balanced full-body training.';
    }
  };

  const hasEnoughChartData = sessions.length >= 2;

  return (
    <VStack spacing={6} align="stretch">
      {/* Recommendation Banner */}
      <Box
        p={4}
        borderRadius="xl"
        bg="rgba(0, 242, 254, 0.08)"
        border="1px solid"
        borderColor="rgba(0, 242, 254, 0.25)"
      >
        <HStack spacing={3} align="flex-start">
          <Box color="#00F2FE" mt={0.5}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          </Box>
          <Box>
            <Text fontSize="xs" fontWeight="800" color="#00F2FE" textTransform="uppercase" letterSpacing="0.05em">
              Training Recommendation
            </Text>
            <Text fontSize="sm" color="white" mt={0.5} fontWeight="500">
              {getRecommendation()}
            </Text>
          </Box>
        </HStack>
      </Box>

      {/* High-Level Overview Metrics */}
      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
        <Box p={4} borderRadius="xl" bg="surface.card" border="1px solid" borderColor="surface.border">
          <Text fontSize="2xs" color="gray.500" fontWeight="700" textTransform="uppercase">
            Completed Workouts
          </Text>
          <Text fontSize="3xl" fontWeight="900" color="white" mt={1}>
            {profile.completedWorkoutsCount}
          </Text>
        </Box>

        <Box p={4} borderRadius="xl" bg="surface.card" border="1px solid" borderColor="surface.border">
          <Text fontSize="2xs" color="gray.500" fontWeight="700" textTransform="uppercase">
            Total Reps Logged
          </Text>
          <Text fontSize="3xl" fontWeight="900" color="#00F2FE" mt={1}>
            {profile.totalRepsLogged}
          </Text>
        </Box>

        <Box p={4} borderRadius="xl" bg="surface.card" border="1px solid" borderColor="surface.border">
          <Text fontSize="2xs" color="gray.500" fontWeight="700" textTransform="uppercase">
            Current Streak
          </Text>
          <HStack spacing={2} align="baseline" mt={1}>
            <Text fontSize="3xl" fontWeight="900" color="#10B981">
              {profile.currentStreakDays}
            </Text>
            <Text fontSize="xs" color="gray.400" fontWeight="600">
              Days (Best: {profile.longestStreakDays})
            </Text>
          </HStack>
        </Box>

        <Box p={4} borderRadius="xl" bg="surface.card" border="1px solid" borderColor="surface.border">
          <Text fontSize="2xs" color="gray.500" fontWeight="700" textTransform="uppercase">
            Form Consistency
          </Text>
          <Text fontSize="3xl" fontWeight="900" color="#F59E0B" mt={1}>
            {profile.personalRecords.highestFormScore > 0 ? `${profile.personalRecords.highestFormScore}%` : '--'}
          </Text>
        </Box>
      </SimpleGrid>

      {/* Personal Records (PRs) */}
      <Box p={5} borderRadius="xl" bg="surface.card" border="1px solid" borderColor="surface.border">
        <Text fontSize="xs" fontWeight="700" color="gray.400" textTransform="uppercase" mb={3}>
          Legitimate Personal Records
        </Text>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
          <Box p={3.5} borderRadius="lg" bg="surface.elevated" border="1px solid" borderColor="surface.border">
            <Text fontSize="2xs" color="gray.500" fontWeight="700">MAX REPS IN A SINGLE SET</Text>
            <Text fontSize="xl" fontWeight="800" color="white" mt={1}>
              {profile.personalRecords.maxRepsInSet.reps > 0
                ? `${profile.personalRecords.maxRepsInSet.reps} Reps`
                : '--'}
            </Text>
            {profile.personalRecords.maxRepsInSet.reps > 0 && (
              <Text fontSize="2xs" color="#00F2FE" mt={0.5}>
                {profile.personalRecords.maxRepsInSet.exerciseName}
              </Text>
            )}
          </Box>

          <Box p={3.5} borderRadius="lg" bg="surface.elevated" border="1px solid" borderColor="surface.border">
            <Text fontSize="2xs" color="gray.500" fontWeight="700">LONGEST WORKOUT DURATION</Text>
            <Text fontSize="xl" fontWeight="800" color="white" mt={1}>
              {profile.personalRecords.longestSessionMinutes > 0
                ? `${profile.personalRecords.longestSessionMinutes} Minutes`
                : '--'}
            </Text>
            <Text fontSize="2xs" color="gray.400" mt={0.5}>Full session completion</Text>
          </Box>

          <Box p={3.5} borderRadius="lg" bg="surface.elevated" border="1px solid" borderColor="surface.border">
            <Text fontSize="2xs" color="gray.500" fontWeight="700">HIGHEST SESSION FORM SCORE</Text>
            <Text fontSize="xl" fontWeight="800" color="#10B981" mt={1}>
              {profile.personalRecords.highestFormScore > 0
                ? `${profile.personalRecords.highestFormScore}%`
                : '--'}
            </Text>
            <Text fontSize="2xs" color="gray.400" mt={0.5}>Measured pose accuracy</Text>
          </Box>
        </SimpleGrid>
      </Box>

      {/* Goal Tracking Section */}
      <Box p={5} borderRadius="xl" bg="surface.card" border="1px solid" borderColor="surface.border">
        <Text fontSize="xs" fontWeight="700" color="gray.400" textTransform="uppercase" mb={3}>
          Current Fitness Goals
        </Text>
        <VStack spacing={3} align="stretch">
          {goals.map((goal) => {
            const percent = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
            return (
              <Box key={goal.id} p={3.5} borderRadius="lg" bg="surface.elevated" border="1px solid" borderColor="surface.border">
                <Flex justify="space-between" align="center" mb={1.5}>
                  <Text fontSize="sm" fontWeight="700" color="white">{goal.title}</Text>
                  <HStack spacing={2}>
                    <Text fontSize="xs" color="#00F2FE" fontWeight="800">
                      {goal.currentValue} / {goal.targetValue}
                    </Text>
                    {goal.completed && (
                      <Badge colorScheme="green" fontSize="2xs">Completed</Badge>
                    )}
                  </HStack>
                </Flex>
                <Progress value={percent} size="xs" colorScheme="cyan" borderRadius="full" bg="surface.border" />
              </Box>
            );
          })}
        </VStack>
      </Box>

      {/* Performance Trends Chart */}
      {hasEnoughChartData ? (
        <Box p={5} borderRadius="xl" bg="surface.card" border="1px solid" borderColor="surface.border">
          <Text fontSize="xs" fontWeight="700" color="gray.400" textTransform="uppercase" mb={4}>
            Reps Per Workout Trend
          </Text>
          <Box h="140px" w="100%">
            <svg width="100%" height="100%" viewBox="0 0 400 120" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00F2FE" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#00F2FE" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {(() => {
                const recent = sessions.slice(0, 7).reverse();
                const maxReps = Math.max(...recent.map((s) => s.totalReps), 10);
                const points = recent.map((s, idx) => {
                  const x = (idx / (recent.length - 1)) * 380 + 10;
                  const y = 110 - (s.totalReps / maxReps) * 90;
                  return `${x},${y}`;
                });
                const pathStr = `M ${points.join(' L ')}`;
                const areaStr = `${pathStr} L 390,120 L 10,120 Z`;

                return (
                  <>
                    <path d={areaStr} fill="url(#chartGrad)" />
                    <path d={pathStr} fill="none" stroke="#00F2FE" strokeWidth="2.5" strokeLinecap="round" />
                    {recent.map((s, idx) => {
                      const x = (idx / (recent.length - 1)) * 380 + 10;
                      const y = 110 - (s.totalReps / maxReps) * 90;
                      return (
                        <circle key={s.id} cx={x} cy={y} r="4" fill="#080C14" stroke="#00F2FE" strokeWidth="2" />
                      );
                    })}
                  </>
                );
              })()}
            </svg>
          </Box>
        </Box>
      ) : (
        <Box p={6} borderRadius="xl" bg="surface.card" border="1px solid" borderColor="surface.border" textAlign="center">
          <Text fontSize="xs" color="gray.500">
            Performance charts will appear once at least 2 workout sessions are completed.
          </Text>
        </Box>
      )}

      {/* Kinematic Achievements */}
      <Box p={5} borderRadius="xl" bg="surface.card" border="1px solid" borderColor="surface.border">
        <HStack justify="space-between" align="center" mb={4}>
          <Text fontSize="xs" fontWeight="700" color="gray.400" textTransform="uppercase">
            Kinematic Achievements & Milestones
          </Text>
          <Badge colorScheme="cyan" variant="subtle" fontSize="2xs">
            {(profile.achievements || []).filter((a) => a.isUnlocked).length} / {(profile.achievements || []).length} Unlocked
          </Badge>
        </HStack>

        <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} spacing={3}>
          {(profile.achievements || []).map((ach) => (
            <Box
              key={ach.id}
              p={3.5}
              borderRadius="xl"
              bg={ach.isUnlocked ? 'rgba(0, 242, 254, 0.06)' : 'surface.elevated'}
              border="1px solid"
              borderColor={ach.isUnlocked ? 'rgba(0, 242, 254, 0.3)' : 'surface.border'}
              opacity={ach.isUnlocked ? 1 : 0.55}
              transition="all 0.2s ease"
            >
              <HStack spacing={2} mb={1.5}>
                <Box
                  w={6}
                  h={6}
                  borderRadius="full"
                  bg={ach.isUnlocked ? '#00F2FE' : 'surface.border'}
                  color="#080C14"
                  fontSize="2xs"
                  fontWeight="900"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  {ach.isUnlocked ? '✓' : '•'}
                </Box>
                <Text fontSize="xs" fontWeight="700" color={ach.isUnlocked ? 'white' : 'gray.400'}>
                  {ach.title}
                </Text>
              </HStack>
              <Text fontSize="2xs" color="gray.400" lineHeight="normal">
                {ach.description}
              </Text>
            </Box>
          ))}
        </SimpleGrid>
      </Box>

      {/* Data Portability & Privacy Controls */}
      <Box p={5} borderRadius="xl" bg="surface.card" border="1px solid" borderColor="surface.border">
        <HStack justify="space-between" align="center" mb={3} wrap="wrap" gap={2}>
          <Box>
            <Text fontSize="xs" fontWeight="700" color="gray.400" textTransform="uppercase">
              Data Sovereignty & Local Backups
            </Text>
            <Text fontSize="2xs" color="gray.500" mt={0.5}>
              100% offline-first. Export your workout logs as CSV or create portable JSON backups.
            </Text>
          </Box>
          <HStack spacing={2}>
            <button
              onClick={() => {
                const csv = workoutStorage.exportDataAsCSV();
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `motionbird-history-${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              style={{
                background: 'transparent',
                border: '1px solid #2D3748',
                color: '#CBD5E1',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Export CSV
            </button>
            <button
              onClick={() => {
                const json = workoutStorage.exportDataAsJSON();
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `motionbird-backup-${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              style={{
                background: 'rgba(0, 242, 254, 0.1)',
                border: '1px solid rgba(0, 242, 254, 0.3)',
                color: '#00F2FE',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Export JSON Backup
            </button>
          </HStack>
        </HStack>
      </Box>
    </VStack>
  );
};
