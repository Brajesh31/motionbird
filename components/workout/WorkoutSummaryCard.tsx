import React from 'react';
import {
  Box,
  Flex,
  Text,
  VStack,
  HStack,
  Button,
  Badge,
  SimpleGrid,
} from '@chakra-ui/react';
import { WorkoutSession } from '../../lib/types/session';

interface WorkoutSummaryCardProps {
  session: WorkoutSession;
  onFinishAndSave: () => void;
  onRestart: () => void;
}

export const WorkoutSummaryCard: React.FC<WorkoutSummaryCardProps> = ({
  session,
  onFinishAndSave,
  onRestart,
}) => {
  const durationMin = Math.floor(session.durationSeconds / 60);
  const durationSec = session.durationSeconds % 60;

  // Aggregate quality counts across all exercises
  let cleanReps = 0;
  let goodReps = 0;
  let partialReps = 0;
  const allFaults: string[] = [];

  for (const ex of session.exercises) {
    cleanReps += ex.qualityBreakdown.clean;
    goodReps += ex.qualityBreakdown.good;
    partialReps += ex.qualityBreakdown.partial;
    for (const fault of ex.commonFaults) {
      if (!allFaults.includes(fault)) {
        allFaults.push(fault);
      }
    }
  }

  const formRating =
    session.averageFormScore >= 85
      ? { label: 'Excellent Form', colorScheme: 'green' }
      : session.averageFormScore >= 70
      ? { label: 'Good Form', colorScheme: 'cyan' }
      : { label: 'Needs Improvement', colorScheme: 'yellow' };

  return (
    <Box
      w="100%"
      maxW="4xl"
      mx="auto"
      bg="surface.card"
      border="1px solid"
      borderColor="surface.border"
      borderRadius="2xl"
      p={{ base: 5, md: 8 }}
      boxShadow="0 12px 48px rgba(0, 0, 0, 0.6)"
    >
      <VStack spacing={6} align="stretch">
        {/* Header Title */}
        <Flex justify="space-between" align="center" flexWrap="wrap" gap={3}>
          <Box>
            <HStack spacing={2} mb={1}>
              <Text fontSize="2xl" fontWeight="900" color="white">
                Workout Complete!
              </Text>
              <Badge colorScheme={formRating.colorScheme} px={2.5} py={0.5} borderRadius="md">
                {formRating.label}
              </Badge>
            </HStack>
            <Text fontSize="xs" color="gray.400">
              {session.name} &bull; {new Date(session.startedAt).toLocaleDateString()}
            </Text>
          </Box>
        </Flex>

        {/* Primary Metrics Row */}
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
          <Box p={4} borderRadius="xl" bg="surface.elevated" border="1px solid" borderColor="surface.border">
            <Text fontSize="2xs" color="gray.500" fontWeight="700" textTransform="uppercase">
              Total Reps
            </Text>
            <Text fontSize="3xl" fontWeight="900" color="white" mt={1}>
              {session.totalReps}
            </Text>
          </Box>

          <Box p={4} borderRadius="xl" bg="surface.elevated" border="1px solid" borderColor="surface.border">
            <Text fontSize="2xs" color="gray.500" fontWeight="700" textTransform="uppercase">
              Duration
            </Text>
            <Text fontSize="3xl" fontWeight="900" color="#00F2FE" mt={1}>
              {durationMin}m {durationSec}s
            </Text>
          </Box>

          <Box p={4} borderRadius="xl" bg="surface.elevated" border="1px solid" borderColor="surface.border">
            <Text fontSize="2xs" color="gray.500" fontWeight="700" textTransform="uppercase">
              Exercises
            </Text>
            <Text fontSize="3xl" fontWeight="900" color="white" mt={1}>
              {session.exercises.length}
            </Text>
          </Box>

          <Box p={4} borderRadius="xl" bg="surface.elevated" border="1px solid" borderColor="surface.border">
            <Text fontSize="2xs" color="gray.500" fontWeight="700" textTransform="uppercase">
              Form Score
            </Text>
            <Text fontSize="3xl" fontWeight="900" color="#10B981" mt={1}>
              {session.averageFormScore}%
            </Text>
          </Box>
        </SimpleGrid>

        {/* Rep Quality Breakdown */}
        <Box p={4} borderRadius="xl" bg="surface.elevated" border="1px solid" borderColor="surface.border">
          <Text fontSize="xs" fontWeight="700" color="gray.300" textTransform="uppercase" mb={3}>
            Repetition Quality Breakdown
          </Text>
          <HStack spacing={6} flexWrap="wrap">
            <HStack spacing={2}>
              <Box w={3} h={3} borderRadius="full" bg="#10B981" />
              <Text fontSize="sm" color="gray.200">
                <Text as="span" fontWeight="800">{cleanReps}</Text> Clean (Full ROM)
              </Text>
            </HStack>
            <HStack spacing={2}>
              <Box w={3} h={3} borderRadius="full" bg="#00F2FE" />
              <Text fontSize="sm" color="gray.200">
                <Text as="span" fontWeight="800">{goodReps}</Text> Good
              </Text>
            </HStack>
            <HStack spacing={2}>
              <Box w={3} h={3} borderRadius="full" bg="#F59E0B" />
              <Text fontSize="sm" color="gray.200">
                <Text as="span" fontWeight="800">{partialReps}</Text> Partial / Short ROM
              </Text>
            </HStack>
          </HStack>
        </Box>

        {/* Exercise Breakdown Cards */}
        <VStack spacing={3} align="stretch">
          <Text fontSize="xs" fontWeight="700" color="gray.400" textTransform="uppercase">
            Exercise Breakdown
          </Text>

          {session.exercises.map((ex) => (
            <Flex
              key={ex.exerciseId}
              p={4}
              borderRadius="xl"
              bg="surface.elevated"
              border="1px solid"
              borderColor="surface.border"
              justify="space-between"
              align="center"
              flexWrap="wrap"
              gap={3}
            >
              <Box>
                <Text fontSize="md" fontWeight="800" color="white">
                  {ex.exerciseName}
                </Text>
                <Text fontSize="xs" color="gray.400">
                  {ex.completedSets.length} sets completed &bull; Avg ROM: {ex.averageRomDegrees}°
                </Text>
              </Box>

              <HStack spacing={4}>
                <Box textAlign="right">
                  <Text fontSize="lg" fontWeight="900" color="#00F2FE">
                    {ex.totalReps} Reps
                  </Text>
                  <Text fontSize="2xs" color="gray.500">
                    Best Set: {ex.bestSetReps}
                  </Text>
                </Box>
              </HStack>
            </Flex>
          ))}
        </VStack>

        {/* Coaching Takeaway based on recorded faults */}
        {allFaults.length > 0 && (
          <Box p={4} borderRadius="xl" bg="rgba(245, 158, 11, 0.1)" border="1px solid" borderColor="rgba(245, 158, 11, 0.3)">
            <Text fontSize="xs" fontWeight="700" color="#F59E0B" textTransform="uppercase" mb={1}>
              Focus Areas for Next Session
            </Text>
            <VStack align="stretch" spacing={1} mt={2}>
              {allFaults.map((fault, i) => (
                <Text key={i} fontSize="xs" color="#FDE68A">
                  &bull; {fault}
                </Text>
              ))}
            </VStack>
          </Box>
        )}

        {/* Actions */}
        <HStack spacing={4} pt={2}>
          <Button flex="1" size="lg" colorScheme="cyan" onClick={onFinishAndSave}>
            Save Session & View Dashboard →
          </Button>
          <Button size="lg" variant="outline" borderColor="surface.border" onClick={onRestart}>
            New Workout
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};
