import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Text,
  Badge,
  Box,
  SimpleGrid,
  Flex,
} from '@chakra-ui/react';
import { ExerciseDefinition } from '../../lib/types/exercise';

interface ExerciseDetailModalProps {
  exercise: ExerciseDefinition | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectExercise: (exercise: ExerciseDefinition) => void;
}

export const ExerciseDetailModal: React.FC<ExerciseDetailModalProps> = ({
  exercise,
  isOpen,
  onClose,
  onSelectExercise,
}) => {
  if (!exercise) return null;

  const difficultyColorScheme =
    exercise.difficulty === 'Beginner'
      ? 'green'
      : exercise.difficulty === 'Intermediate'
      ? 'cyan'
      : 'purple';

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" isCentered scrollBehavior="inside">
      <ModalOverlay bg="rgba(8, 12, 20, 0.85)" backdropFilter="blur(8px)" />
      <ModalContent bg="surface.card" border="1px solid" borderColor="surface.border" borderRadius="2xl" color="white">
        <ModalHeader borderBottom="1px solid" borderColor="surface.border" pb={4}>
          <HStack justify="space-between" align="center" pr={8}>
            <VStack align="flex-start" spacing={1}>
              <HStack spacing={2}>
                <Badge colorScheme={difficultyColorScheme} fontSize="xs" px={2} py={0.5} borderRadius="md">
                  {exercise.difficulty}
                </Badge>
                <Badge colorScheme="cyan" variant="subtle" fontSize="xs" px={2} py={0.5} borderRadius="md">
                  {exercise.category.replace('_', ' ').toUpperCase()}
                </Badge>
              </HStack>
              <Text fontSize="xl" fontWeight="800" color="white">
                {exercise.name}
              </Text>
            </VStack>
          </HStack>
        </ModalHeader>
        <ModalCloseButton color="gray.400" top={4} right={4} />

        <ModalBody py={5}>
          <VStack spacing={5} align="stretch">
            {/* Description */}
            <Box>
              <Text fontSize="xs" fontWeight="700" color="#00F2FE" letterSpacing="wider" textTransform="uppercase" mb={1}>
                Biomechanics Overview
              </Text>
              <Text fontSize="sm" color="gray.300" lineHeight="tall">
                {exercise.description}
              </Text>
            </Box>

            {/* Camera Setup Recommendations */}
            <Box bg="surface.elevated" p={4} borderRadius="xl" border="1px solid" borderColor="surface.border">
              <Text fontSize="xs" fontWeight="700" color="gray.400" textTransform="uppercase" mb={3}>
                Camera & Kinematic Guidance
              </Text>
              <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
                <Box>
                  <Text fontSize="2xs" color="gray.500">OPTIMAL ORIENTATION</Text>
                  <HStack spacing={2} mt={0.5}>
                    <Box w={2} h={2} borderRadius="full" bg="#00F2FE" />
                    <Text fontSize="xs" fontWeight="700" color="white">
                      {exercise.cameraOrientation}
                    </Text>
                  </HStack>
                </Box>
                <Box>
                  <Text fontSize="2xs" color="gray.500">RECOMMENDED DISTANCE</Text>
                  <HStack spacing={2} mt={0.5}>
                    <Box w={2} h={2} borderRadius="full" bg="cyan.400" />
                    <Text fontSize="xs" fontWeight="700" color="white">
                      {exercise.recommendedDistance}
                    </Text>
                  </HStack>
                </Box>
              </SimpleGrid>
            </Box>

            {/* Step-by-Step Instructions */}
            <Box>
              <Text fontSize="xs" fontWeight="700" color="#00F2FE" letterSpacing="wider" textTransform="uppercase" mb={2}>
                Step-by-Step Execution
              </Text>
              <VStack align="stretch" spacing={2.5}>
                {exercise.instructions.map((inst, idx) => (
                  <HStack key={idx} align="flex-start" spacing={3}>
                    <Flex
                      w={5}
                      h={5}
                      borderRadius="full"
                      bg="rgba(0, 242, 254, 0.15)"
                      color="#00F2FE"
                      fontSize="2xs"
                      fontWeight="800"
                      align="center"
                      justify="center"
                      flexShrink={0}
                    >
                      {idx + 1}
                    </Flex>
                    <Text fontSize="xs" color="gray.300" pt={0.5}>
                      {inst}
                    </Text>
                  </HStack>
                ))}
              </VStack>
            </Box>

            {/* Common Mistakes */}
            <Box>
              <Text fontSize="xs" fontWeight="700" color="yellow.400" letterSpacing="wider" textTransform="uppercase" mb={2}>
                Common Form Faults Detected
              </Text>
              <VStack align="stretch" spacing={2}>
                {exercise.commonMistakes.map((fault, idx) => (
                  <HStack key={idx} align="flex-start" spacing={2} fontSize="xs" color="gray.300">
                    <Text color="yellow.400" fontWeight="bold">⚠</Text>
                    <Text>{fault}</Text>
                  </HStack>
                ))}
              </VStack>
            </Box>

            {/* Target Muscles */}
            <Box>
              <Text fontSize="xs" fontWeight="700" color="gray.400" letterSpacing="wider" textTransform="uppercase" mb={2}>
                Primary Muscles Engaged
              </Text>
              <Flex wrap="wrap" gap={2}>
                {exercise.targetMuscles.map((muscle) => (
                  <Box
                    key={muscle}
                    px={2.5}
                    py={1}
                    borderRadius="md"
                    bg="rgba(0, 242, 254, 0.08)"
                    border="1px solid"
                    borderColor="rgba(0, 242, 254, 0.2)"
                    fontSize="xs"
                    color="#00F2FE"
                    fontWeight="600"
                  >
                    {muscle}
                  </Box>
                ))}
              </Flex>
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter borderTop="1px solid" borderColor="surface.border" pt={4}>
          <HStack spacing={3}>
            <Button size="sm" variant="ghost" color="gray.400" onClick={onClose}>
              Close
            </Button>
            <Button
              size="sm"
              bg="#00F2FE"
              color="#080C14"
              fontWeight="700"
              _hover={{ bg: '#22d3ee', transform: 'translateY(-1px)' }}
              onClick={() => {
                onSelectExercise(exercise);
                onClose();
              }}
            >
              Start Training Now
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
