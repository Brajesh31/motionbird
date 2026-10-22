import React from 'react';
import {
  Box,
  Flex,
  Text,
  Badge,
  HStack,
  VStack,
  Progress,
  Button,
} from '@chakra-ui/react';
import { ExerciseMetrics, MovementPhase } from '../../lib/types/exercise';

interface RepCounterCardProps {
  reps: number;
  targetReps: number;
  currentSet: number;
  totalSets: number;
  phase: MovementPhase;
  metrics: ExerciseMetrics;
  exerciseName: string;
  isPaused: boolean;
  onTogglePause: () => void;
  onCompleteSet: () => void;
  onFinishWorkout: () => void;
}

export const RepCounterCard: React.FC<RepCounterCardProps> = ({
  reps,
  targetReps,
  currentSet,
  totalSets,
  phase,
  metrics,
  exerciseName,
  isPaused,
  onTogglePause,
  onCompleteSet,
  onFinishWorkout,
}) => {
  const getPhaseBadge = (p: MovementPhase) => {
    switch (p) {
      case 'READY':
        return { colorScheme: 'blue', label: 'READY' };
      case 'STARTING':
      case 'CONCENTRIC':
        return { colorScheme: 'purple', label: 'LIFT (CONCENTRIC)' };
      case 'PEAK':
        return { colorScheme: 'green', label: 'PEAK SQUEEZE' };
      case 'ECCENTRIC':
        return { colorScheme: 'orange', label: 'LOWER (ECCENTRIC)' };
      case 'VALID_REP':
        return { colorScheme: 'teal', label: 'REP COUNTED' };
      default:
        return { colorScheme: 'gray', label: p };
    }
  };

  const badge = getPhaseBadge(phase);
  const repProgress = Math.min(100, Math.round((reps / Math.max(1, targetReps)) * 100));

  return (
    <Box
      w="100%"
      bg="surface.card"
      border="1px solid"
      borderColor="surface.border"
      borderRadius="2xl"
      p={{ base: 4, md: 5 }}
      boxShadow="0 4px 20px rgba(0, 0, 0, 0.4)"
    >
      <VStack spacing={4} align="stretch">
        {/* Top Header Row: Exercise, Set Badge, Phase */}
        <Flex justify="space-between" align="center" flexWrap="wrap" gap={2}>
          <Box>
            <Text fontSize="sm" fontWeight="800" color="white" textTransform="uppercase" letterSpacing="0.05em">
              {exerciseName}
            </Text>
            <Text fontSize="2xs" color="gray.400" fontWeight="600">
              Set {currentSet} of {totalSets} &bull; Target: {targetReps} reps
            </Text>
          </Box>
          <Badge
            colorScheme={badge.colorScheme}
            px={2.5}
            py={0.8}
            borderRadius="md"
            fontSize="2xs"
            fontWeight="800"
          >
            {isPaused ? 'PAUSED' : badge.label}
          </Badge>
        </Flex>

        {/* Big Rep Counter & Target Progress */}
        <Box textAlign="center" py={1}>
          <Flex align="baseline" justify="center">
            <Text
              fontSize={{ base: '6xl', md: '7xl' }}
              fontWeight="900"
              lineHeight="1"
              color={reps >= targetReps ? '#10B981' : 'white'}
              letterSpacing="-0.03em"
              textShadow={reps >= targetReps ? '0 0 24px rgba(16, 185, 129, 0.4)' : '0 0 24px rgba(0, 242, 254, 0.3)'}
            >
              {reps}
            </Text>
            <Text fontSize="md" fontWeight="800" color="gray.400" ml={2}>
              / {targetReps} REPS
            </Text>
          </Flex>

          <Progress
            value={repProgress}
            size="xs"
            borderRadius="full"
            colorScheme={reps >= targetReps ? 'green' : 'cyan'}
            bg="surface.elevated"
            mt={2}
          />
        </Box>

        {/* Real-time Metric Indicators & Tempo */}
        <Box
          p={3}
          bg="surface.elevated"
          borderRadius="xl"
          border="1px solid"
          borderColor="surface.border"
        >
          <Flex justify="space-between" align="center" mb={1.5}>
            <Text fontSize="xs" color="gray.400" fontWeight="600">
              {metrics.primaryMetricLabel || 'Current Angle'}
            </Text>
            <Text fontSize="sm" fontWeight="800" color="#00F2FE">
              {metrics.primaryMetricValue ?? '--'}
            </Text>
          </Flex>

          {metrics.rangeOfMotionScore !== undefined && (
            <VStack align="stretch" spacing={1} mt={2}>
              <Flex justify="space-between" fontSize="2xs" color="gray.500">
                <span>Range of Motion</span>
                <span>{metrics.rangeOfMotionScore}%</span>
              </Flex>
              <Progress
                value={metrics.rangeOfMotionScore}
                size="xs"
                borderRadius="full"
                colorScheme="cyan"
                bg="surface.border"
              />
            </VStack>
          )}

          {/* Tempo Display */}
          {(metrics.concentricSeconds !== undefined || metrics.eccentricSeconds !== undefined) && (
            <Flex justify="space-between" align="center" mt={2} pt={2} borderTop="1px solid" borderColor="surface.border">
              <Text fontSize="2xs" color="gray.400" fontWeight="600">
                Tempo (Con / Ecc)
              </Text>
              <Text fontSize="2xs" fontWeight="700" color="gray.300">
                {metrics.concentricSeconds ?? 0}s &bull; {metrics.eccentricSeconds ?? 0}s
              </Text>
            </Flex>
          )}

          {metrics.secondaryMetricLabel && (
            <Flex justify="space-between" align="center" mt={1.5} pt={1.5} borderTop="1px solid" borderColor="surface.border">
              <Text fontSize="2xs" color="gray.400" fontWeight="600">
                {metrics.secondaryMetricLabel}
              </Text>
              <Text fontSize="2xs" fontWeight="700" color="gray.200">
                {metrics.secondaryMetricValue}
              </Text>
            </Flex>
          )}
        </Box>

        {/* Set & Workout Flow Actions */}
        <VStack spacing={2} pt={1}>
          <Button
            size="md"
            colorScheme="cyan"
            fontWeight="800"
            w="100%"
            onClick={onCompleteSet}
          >
            {reps >= targetReps ? 'Target Reached — Complete Set →' : 'Complete Set & Rest →'}
          </Button>

          <HStack spacing={2} w="100%">
            <Button
              size="sm"
              variant="outline"
              borderColor="surface.border"
              color="gray.300"
              flex="1"
              onClick={onTogglePause}
            >
              {isPaused ? 'Resume' : 'Pause'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              color="gray.500"
              _hover={{ color: '#EF4444' }}
              onClick={onFinishWorkout}
            >
              End Workout
            </Button>
          </HStack>
        </VStack>
      </VStack>
    </Box>
  );
};
