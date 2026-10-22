import React from 'react';
import {
  Box,
  Flex,
  Text,
  VStack,
  HStack,
  Button,
  Badge,
} from '@chakra-ui/react';
import { ExerciseDefinition } from '../../lib/types/exercise';
import { TrackingReadiness } from '../../lib/vision/readiness-evaluator';

interface SetupCheckScreenProps {
  exercise: ExerciseDefinition;
  readiness: TrackingReadiness;
  onStartSet: () => void;
  targetReps: number;
  currentSet: number;
  totalSets: number;
}

export const SetupCheckScreen: React.FC<SetupCheckScreenProps> = ({
  exercise,
  readiness,
  onStartSet,
  targetReps,
  currentSet,
  totalSets,
}) => {
  return (
    <Box
      position="absolute"
      inset={0}
      bg="rgba(8, 12, 20, 0.88)"
      backdropFilter="blur(6px)"
      display="flex"
      flexDirection="column"
      justifyContent="space-between"
      p={{ base: 4, md: 6 }}
      zIndex={20}
    >
      {/* Top Banner: Exercise & Camera Guidance */}
      <Flex justify="space-between" align="flex-start" flexWrap="wrap" gap={3}>
        <Box>
          <HStack spacing={2} mb={1}>
            <Text fontSize="lg" fontWeight="800" color="white">
              {exercise.name}
            </Text>
            <Badge colorScheme="cyan" variant="subtle" px={2} borderRadius="md" fontSize="xs">
              Set {currentSet} of {totalSets}
            </Badge>
          </HStack>
          <Text fontSize="xs" color="gray.400">
            Target: <Text as="span" color="#00F2FE" fontWeight="700">{targetReps} reps</Text> &bull; Recommended: {exercise.recommendedDistance}
          </Text>
        </Box>

        <Badge
          px={3}
          py={1}
          borderRadius="full"
          colorScheme={readiness.isReady ? 'green' : 'yellow'}
          variant="solid"
          fontSize="xs"
          fontWeight="700"
        >
          {readiness.isReady ? '✓ Tracking Ready' : 'Position Camera'}
        </Badge>
      </Flex>

      {/* Center Box: Tracking Readiness Checklist */}
      <VStack
        maxW="md"
        mx="auto"
        spacing={3}
        bg="rgba(15, 22, 36, 0.95)"
        p={5}
        borderRadius="2xl"
        border="1px solid"
        borderColor={readiness.isReady ? 'rgba(16, 185, 129, 0.4)' : 'surface.border'}
        boxShadow="0 8px 32px rgba(0, 0, 0, 0.5)"
        align="stretch"
      >
        <Text fontSize="xs" fontWeight="700" textTransform="uppercase" letterSpacing="0.05em" color="gray.400">
          Camera Positioning Checklist
        </Text>

        <VStack spacing={2.5} align="stretch">
          {readiness.checks.map((chk) => (
            <Flex key={chk.id} justify="space-between" align="center" fontSize="xs">
              <HStack spacing={2.5}>
                <Box
                  w={5}
                  h={5}
                  borderRadius="full"
                  bg={chk.passed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.15)'}
                  color={chk.passed ? '#10B981' : '#EF4444'}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  fontWeight="bold"
                  fontSize="2xs"
                >
                  {chk.passed ? '✓' : '✕'}
                </Box>
                <Text fontWeight="600" color={chk.passed ? 'white' : 'gray.400'}>
                  {chk.label}
                </Text>
              </HStack>
              {chk.hint && (
                <Text fontSize="2xs" color="gray.500" maxW="180px" textAlign="right">
                  {chk.hint}
                </Text>
              )}
            </Flex>
          ))}
        </VStack>

        <Box
          p={3}
          mt={2}
          borderRadius="lg"
          bg={readiness.isReady ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)'}
          border="1px solid"
          borderColor={readiness.isReady ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}
        >
          <Text fontSize="xs" fontWeight="600" color={readiness.isReady ? '#A7F3D0' : '#FDE68A'}>
            {readiness.guidanceMessage}
          </Text>
        </Box>
      </VStack>

      {/* Bottom Action: Start Set Button */}
      <Flex justify="center" pt={4}>
        <Button
          size="lg"
          colorScheme="cyan"
          isDisabled={!readiness.isReady}
          onClick={onStartSet}
          px={8}
          py={6}
          fontSize="md"
          fontWeight="800"
          boxShadow={readiness.isReady ? '0 0 24px rgba(0, 242, 254, 0.4)' : 'none'}
          _hover={{ transform: readiness.isReady ? 'scale(1.02)' : 'none' }}
          transition="all 0.15s ease"
        >
          {readiness.isReady ? `Start Set ${currentSet} →` : 'Position to Begin...'}
        </Button>
      </Flex>
    </Box>
  );
};
