import React, { useState } from 'react';
import {
  Box,
  Flex,
  Text,
  VStack,
  HStack,
  Badge,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  SimpleGrid,
} from '@chakra-ui/react';
import { WorkoutSession } from '../../lib/types/session';

interface SessionHistoryViewProps {
  sessions: WorkoutSession[];
  onStartNewWorkout: () => void;
}

export const SessionHistoryView: React.FC<SessionHistoryViewProps> = ({
  sessions,
  onStartNewWorkout,
}) => {
  const [selectedSession, setSelectedSession] = useState<WorkoutSession | null>(null);

  if (sessions.length === 0) {
    return (
      <Box
        p={{ base: 6, md: 12 }}
        textAlign="center"
        bg="surface.card"
        borderRadius="2xl"
        border="1px solid"
        borderColor="surface.border"
      >
        <VStack spacing={4} maxW="md" mx="auto">
          <Box
            w={12}
            h={12}
            borderRadius="full"
            bg="surface.elevated"
            display="flex"
            alignItems="center"
            justifyContent="center"
            color="#00F2FE"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 8v4l3 3" />
              <circle cx="12" cy="12" r="10" />
            </svg>
          </Box>
          <Text fontSize="lg" fontWeight="800" color="white">
            No Workouts Recorded Yet
          </Text>
          <Text fontSize="sm" color="gray.400">
            Complete your first exercise session with MotionBird to begin tracking reps, movement tempo, and form quality history.
          </Text>
          <Button colorScheme="cyan" size="md" onClick={onStartNewWorkout} mt={2}>
            Start Your First Workout →
          </Button>
        </VStack>
      </Box>
    );
  }

  return (
    <VStack spacing={4} align="stretch">
      <Flex justify="space-between" align="center" mb={1}>
        <Text fontSize="md" fontWeight="800" color="white">
          Session History ({sessions.length})
        </Text>
      </Flex>

      <VStack spacing={3} align="stretch">
        {sessions.map((s) => {
          const durationMin = Math.round(s.durationSeconds / 60);
          const dateStr = new Date(s.startedAt).toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          });

          return (
            <Box
              key={s.id}
              p={4}
              borderRadius="xl"
              bg="surface.card"
              border="1px solid"
              borderColor="surface.border"
              _hover={{ borderColor: '#00F2FE', cursor: 'pointer' }}
              transition="all 0.15s ease"
              onClick={() => setSelectedSession(s)}
            >
              <Flex justify="space-between" align="center" flexWrap="wrap" gap={3}>
                <Box>
                  <HStack spacing={2} mb={1}>
                    <Text fontSize="md" fontWeight="800" color="white">
                      {s.name}
                    </Text>
                    <Badge
                      colorScheme={s.averageFormScore >= 80 ? 'green' : 'cyan'}
                      fontSize="2xs"
                    >
                      {s.averageFormScore}% Form Score
                    </Badge>
                  </HStack>
                  <Text fontSize="xs" color="gray.400">
                    {dateStr} &bull; {durationMin} mins &bull; {s.exercises.length} exercises
                  </Text>
                </Box>

                <HStack spacing={4}>
                  <Box textAlign="right">
                    <Text fontSize="xl" fontWeight="900" color="#00F2FE">
                      {s.totalReps}
                    </Text>
                    <Text fontSize="2xs" color="gray.500" textTransform="uppercase">
                      Total Reps
                    </Text>
                  </Box>
                  <Text color="gray.600" fontSize="lg">
                    ›
                  </Text>
                </HStack>
              </Flex>
            </Box>
          );
        })}
      </VStack>

      {/* Session Detail Modal */}
      {selectedSession && (
        <Modal isOpen={!!selectedSession} onClose={() => setSelectedSession(null)} size="xl" isCentered>
          <ModalOverlay bg="rgba(8, 12, 20, 0.85)" backdropFilter="blur(8px)" />
          <ModalContent bg="surface.card" border="1px solid" borderColor="surface.border" borderRadius="2xl" color="white">
            <ModalHeader borderBottom="1px solid" borderColor="surface.border" pb={4}>
              <Text fontSize="lg" fontWeight="800">
                {selectedSession.name}
              </Text>
              <Text fontSize="xs" color="gray.400" fontWeight="400">
                {new Date(selectedSession.startedAt).toLocaleString()}
              </Text>
            </ModalHeader>
            <ModalCloseButton />

            <ModalBody p={6}>
              <VStack spacing={4} align="stretch">
                <SimpleGrid columns={3} spacing={3}>
                  <Box p={3} borderRadius="lg" bg="surface.elevated" textAlign="center">
                    <Text fontSize="2xs" color="gray.500">REPS</Text>
                    <Text fontSize="xl" fontWeight="800" color="#00F2FE">{selectedSession.totalReps}</Text>
                  </Box>
                  <Box p={3} borderRadius="lg" bg="surface.elevated" textAlign="center">
                    <Text fontSize="2xs" color="gray.500">DURATION</Text>
                    <Text fontSize="xl" fontWeight="800" color="white">
                      {Math.floor(selectedSession.durationSeconds / 60)}m {selectedSession.durationSeconds % 60}s
                    </Text>
                  </Box>
                  <Box p={3} borderRadius="lg" bg="surface.elevated" textAlign="center">
                    <Text fontSize="2xs" color="gray.500">FORM SCORE</Text>
                    <Text fontSize="xl" fontWeight="800" color="#10B981">{selectedSession.averageFormScore}%</Text>
                  </Box>
                </SimpleGrid>

                <Text fontSize="xs" fontWeight="700" color="gray.400" textTransform="uppercase" mt={2}>
                  Exercises Completed
                </Text>

                <VStack spacing={2.5} align="stretch">
                  {selectedSession.exercises.map((ex, idx) => (
                    <Box key={idx} p={3.5} borderRadius="lg" bg="surface.elevated" border="1px solid" borderColor="surface.border">
                      <Flex justify="space-between" align="center">
                        <Text fontSize="sm" fontWeight="700" color="white">{ex.exerciseName}</Text>
                        <Text fontSize="xs" fontWeight="800" color="#00F2FE">{ex.totalReps} Reps ({ex.completedSets.length} sets)</Text>
                      </Flex>
                      <Text fontSize="2xs" color="gray.400" mt={1}>
                        Avg ROM: {ex.averageRomDegrees}° &bull; Quality: {ex.qualityBreakdown.clean} Clean, {ex.qualityBreakdown.good} Good, {ex.qualityBreakdown.partial} Partial
                      </Text>
                      {ex.commonFaults.length > 0 && (
                        <Text fontSize="2xs" color="#FDE68A" mt={1}>
                          Cues noted: {ex.commonFaults.join(', ')}
                        </Text>
                      )}
                    </Box>
                  ))}
                </VStack>
              </VStack>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </VStack>
  );
};
