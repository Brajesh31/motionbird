import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Text,
  Box,
  Button,
  Badge,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Flex,
} from '@chakra-ui/react';
import { ExerciseDefinition } from '../../lib/types/exercise';
import { WorkoutPlan } from '../../lib/types/session';
import { PRESET_WORKOUT_PLANS } from '../../lib/workouts/preset-plans';

interface WorkoutBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  exercises: ExerciseDefinition[];
  onStartPlan: (plan: WorkoutPlan) => void;
  onStartSingleExercise: (exercise: ExerciseDefinition, sets: number, reps: number, rest: number) => void;
}

export const WorkoutBuilderModal: React.FC<WorkoutBuilderModalProps> = ({
  isOpen,
  onClose,
  exercises,
  onStartPlan,
  onStartSingleExercise,
}) => {
  const [selectedExId, setSelectedExId] = useState<string>(exercises[0]?.id || 'squat');
  const [sets, setSets] = useState<number>(3);
  const [reps, setReps] = useState<number>(10);
  const [rest, setRest] = useState<number>(60);

  const selectedExercise = exercises.find((e) => e.id === selectedExId) || exercises[0];

  const handleSelectPreset = (plan: WorkoutPlan) => {
    onStartPlan(plan);
    onClose();
  };

  const handleStartCustom = () => {
    if (selectedExercise) {
      onStartSingleExercise(selectedExercise, sets, reps, rest);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" isCentered>
      <ModalOverlay bg="rgba(8, 12, 20, 0.85)" backdropFilter="blur(8px)" />
      <ModalContent bg="surface.card" border="1px solid" borderColor="surface.border" borderRadius="2xl" color="white">
        <ModalHeader borderBottom="1px solid" borderColor="surface.border" pb={4}>
          <Text fontSize="lg" fontWeight="800">
            Choose Your Workout
          </Text>
          <Text fontSize="xs" color="gray.400" fontWeight="400">
            Select a structured routine or configure individual exercise targets
          </Text>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody p={6}>
          <Tabs variant="soft-rounded" colorScheme="cyan">
            <TabList mb={4} bg="surface.elevated" p={1} borderRadius="xl">
              <Tab fontSize="xs" fontWeight="700" color="gray.400" _selected={{ color: '#080C14', bg: '#00F2FE' }}>
                Preset Workouts
              </Tab>
              <Tab fontSize="xs" fontWeight="700" color="gray.400" _selected={{ color: '#080C14', bg: '#00F2FE' }}>
                Single Exercise Focus
              </Tab>
            </TabList>

            <TabPanels>
              {/* Presets Tab */}
              <TabPanel p={0}>
                <VStack spacing={3} align="stretch">
                  {PRESET_WORKOUT_PLANS.map((plan) => (
                    <Box
                      key={plan.id}
                      p={4}
                      borderRadius="xl"
                      bg="surface.elevated"
                      border="1px solid"
                      borderColor="surface.border"
                      _hover={{ borderColor: '#00F2FE', cursor: 'pointer' }}
                      transition="all 0.15s ease"
                      onClick={() => handleSelectPreset(plan)}
                    >
                      <Flex justify="space-between" align="center" mb={1.5}>
                        <HStack spacing={2}>
                          <Text fontSize="md" fontWeight="800" color="white">
                            {plan.name}
                          </Text>
                          <Badge colorScheme="cyan" variant="subtle" fontSize="2xs">
                            {plan.level}
                          </Badge>
                        </HStack>
                        <Text fontSize="xs" color="#00F2FE" fontWeight="700">
                          ~{plan.estimatedDurationMinutes} mins
                        </Text>
                      </Flex>
                      <Text fontSize="xs" color="gray.400" mb={3}>
                        {plan.description}
                      </Text>
                      <HStack spacing={2} wrap="wrap">
                        {plan.items.map((item, idx) => (
                          <Badge key={idx} variant="outline" borderColor="surface.border" color="gray.300" fontSize="2xs">
                            {item.exerciseId.replace('-', ' ')} ({item.sets}×{item.targetReps})
                          </Badge>
                        ))}
                      </HStack>
                    </Box>
                  ))}
                </VStack>
              </TabPanel>

              {/* Single Exercise Tab */}
              <TabPanel p={0}>
                <VStack spacing={4} align="stretch">
                  <Box>
                    <Text fontSize="xs" fontWeight="700" color="gray.400" mb={1.5}>
                      SELECT EXERCISE
                    </Text>
                    <Select
                      value={selectedExId}
                      onChange={(e) => setSelectedExId(e.target.value)}
                      bg="surface.elevated"
                      borderColor="surface.border"
                      borderRadius="xl"
                    >
                      {exercises.map((ex) => (
                        <option key={ex.id} value={ex.id} style={{ background: '#0F1624' }}>
                          {ex.name} ({ex.category.replace('_', ' ')})
                        </option>
                      ))}
                    </Select>
                  </Box>

                  {/* Exercise Quick Metadata Card */}
                  {selectedExercise && (
                    <Box p={4} borderRadius="xl" bg="surface.elevated" border="1px solid" borderColor="surface.border">
                      <Flex justify="space-between" align="baseline" mb={2}>
                        <Text fontSize="xs" fontWeight="700" color="#00F2FE" textTransform="uppercase">
                          {selectedExercise.name} Overview
                        </Text>
                        <Badge colorScheme="purple" fontSize="2xs">
                          {selectedExercise.cameraOrientation} View
                        </Badge>
                      </Flex>
                      <Text fontSize="xs" color="gray.300" mb={2}>
                        {selectedExercise.description}
                      </Text>
                      <Text fontSize="2xs" color="gray.400">
                        <Text as="span" fontWeight="700" color="white">Target Muscles: </Text>
                        {selectedExercise.targetMuscles.join(', ')}
                      </Text>
                    </Box>
                  )}

                  {/* Target Sets, Reps, Rest Config */}
                  <HStack spacing={4}>
                    <Box flex="1">
                      <Text fontSize="2xs" color="gray.400" fontWeight="700" mb={1}>
                        TARGET SETS
                      </Text>
                      <NumberInput min={1} max={10} value={sets} onChange={(_, val) => setSets(val || 3)}>
                        <NumberInputField bg="surface.elevated" borderColor="surface.border" borderRadius="lg" />
                        <NumberInputStepper>
                          <NumberIncrementStepper color="gray.400" />
                          <NumberDecrementStepper color="gray.400" />
                        </NumberInputStepper>
                      </NumberInput>
                    </Box>

                    <Box flex="1">
                      <Text fontSize="2xs" color="gray.400" fontWeight="700" mb={1}>
                        REPS PER SET
                      </Text>
                      <NumberInput min={1} max={50} value={reps} onChange={(_, val) => setReps(val || 10)}>
                        <NumberInputField bg="surface.elevated" borderColor="surface.border" borderRadius="lg" />
                        <NumberInputStepper>
                          <NumberIncrementStepper color="gray.400" />
                          <NumberDecrementStepper color="gray.400" />
                        </NumberInputStepper>
                      </NumberInput>
                    </Box>

                    <Box flex="1">
                      <Text fontSize="2xs" color="gray.400" fontWeight="700" mb={1}>
                        REST (SECS)
                      </Text>
                      <NumberInput min={15} max={180} step={15} value={rest} onChange={(_, val) => setRest(val || 60)}>
                        <NumberInputField bg="surface.elevated" borderColor="surface.border" borderRadius="lg" />
                        <NumberInputStepper>
                          <NumberIncrementStepper color="gray.400" />
                          <NumberDecrementStepper color="gray.400" />
                        </NumberInputStepper>
                      </NumberInput>
                    </Box>
                  </HStack>

                  <Button size="lg" colorScheme="cyan" mt={2} onClick={handleStartCustom}>
                    Start {selectedExercise?.name} Routine →
                  </Button>
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
