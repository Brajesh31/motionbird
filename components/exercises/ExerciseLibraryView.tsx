import React, { useState } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  Button,
  Badge,
  Input,
  InputGroup,
  InputLeftElement,
} from '@chakra-ui/react';
import { ExerciseDefinition } from '../../lib/types/exercise';
import { exerciseRegistry } from '../../lib/exercises/registry';
import { ExerciseDetailModal } from './ExerciseDetailModal';

interface ExerciseLibraryViewProps {
  onSelectExercise: (exercise: ExerciseDefinition) => void;
}

export const ExerciseLibraryView: React.FC<ExerciseLibraryViewProps> = ({ onSelectExercise }) => {
  const allExercises = exerciseRegistry.getAll();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeModalExercise, setActiveModalExercise] = useState<ExerciseDefinition | null>(null);

  const categories = [
    { id: 'all', label: 'All Exercises' },
    { id: 'upper_body', label: 'Upper Body' },
    { id: 'lower_body', label: 'Lower Body' },
    { id: 'core', label: 'Core & Full Body' },
  ];

  const filteredExercises = allExercises.filter((ex) => {
    const matchesCategory =
      selectedCategory === 'all' ||
      ex.category === selectedCategory ||
      (selectedCategory === 'core' && (ex.category === 'core' || ex.category === 'full_body'));
    const matchesSearch =
      ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.targetMuscles.some((m) => m.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <Box w="100%" maxW="7xl" mx="auto" px={{ base: 4, md: 8 }} py={6}>
      {/* Header */}
      <VStack align="flex-start" spacing={2} mb={6}>
        <HStack spacing={2}>
          <Box w={2.5} h={2.5} borderRadius="full" bg="#00F2FE" />
          <Text fontSize="xs" fontWeight="700" color="#00F2FE" letterSpacing="wider" textTransform="uppercase">
            Movement Intelligence Engine
          </Text>
        </HStack>
        <Heading size="lg" color="white" fontWeight="800">
          Exercise Biomechanics Library
        </Heading>
        <Text fontSize="sm" color="gray.400" maxW="2xl">
          Real-time kinematic tracking models. Each exercise features specialized joint-angle state machines, depth thresholds, and form fault heuristics.
        </Text>
      </VStack>

      {/* Filter & Search Bar */}
      <Flex
        direction={{ base: 'column', md: 'row' }}
        justify="space-between"
        align={{ base: 'stretch', md: 'center' }}
        gap={4}
        mb={8}
      >
        <HStack spacing={2} overflowX="auto" pb={{ base: 2, md: 0 }}>
          {categories.map((cat) => (
            <Button
              key={cat.id}
              size="sm"
              variant={selectedCategory === cat.id ? 'solid' : 'outline'}
              bg={selectedCategory === cat.id ? '#00F2FE' : 'transparent'}
              color={selectedCategory === cat.id ? '#080C14' : 'gray.300'}
              borderColor={selectedCategory === cat.id ? '#00F2FE' : 'surface.border'}
              fontWeight="600"
              fontSize="xs"
              borderRadius="full"
              _hover={{
                bg: selectedCategory === cat.id ? '#22d3ee' : 'surface.elevated',
                borderColor: '#00F2FE',
              }}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.label}
            </Button>
          ))}
        </HStack>

        <Box w={{ base: '100%', md: '280px' }}>
          <InputGroup size="sm">
            <InputLeftElement pointerEvents="none" color="gray.500">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </InputLeftElement>
            <Input
              placeholder="Filter by exercise or muscle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              bg="surface.card"
              border="1px solid"
              borderColor="surface.border"
              borderRadius="full"
              color="white"
              _focus={{ borderColor: '#00F2FE' }}
            />
          </InputGroup>
        </Box>
      </Flex>

      {/* Exercise Cards Grid */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 2 }} spacing={6}>
        {filteredExercises.map((exercise) => {
          const difficultyColorScheme =
            exercise.difficulty === 'Beginner'
              ? 'green'
              : exercise.difficulty === 'Intermediate'
              ? 'cyan'
              : 'purple';

          return (
            <Box
              key={exercise.id}
              bg="surface.card"
              border="1px solid"
              borderColor="surface.border"
              borderRadius="2xl"
              p={6}
              transition="all 0.2s ease"
              _hover={{
                borderColor: 'rgba(0, 242, 254, 0.4)',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
              }}
              display="flex"
              flexDirection="column"
              justifyContent="space-between"
            >
              <Box>
                {/* Header & Badges */}
                <Flex justify="space-between" align="flex-start" mb={3}>
                  <VStack align="flex-start" spacing={1}>
                    <HStack spacing={2}>
                      <Badge colorScheme={difficultyColorScheme} fontSize="2xs" px={2} py={0.5} borderRadius="md">
                        {exercise.difficulty}
                      </Badge>
                      <Badge colorScheme="cyan" variant="subtle" fontSize="2xs" px={2} py={0.5} borderRadius="md">
                        {exercise.cameraOrientation}
                      </Badge>
                    </HStack>
                    <Heading size="md" color="white" fontWeight="700">
                      {exercise.name}
                    </Heading>
                  </VStack>
                </Flex>

                {/* Description */}
                <Text fontSize="xs" color="gray.400" mb={4} lineHeight="tall">
                  {exercise.description}
                </Text>

                {/* Tracking Specs */}
                <Box bg="surface.elevated" p={3} borderRadius="xl" border="1px solid" borderColor="surface.border" mb={4}>
                  <SimpleGrid columns={2} spacing={2} fontSize="2xs">
                    <Box>
                      <Text color="gray.500">CAMERA DISTANCE</Text>
                      <Text color="gray.200" fontWeight="600">{exercise.recommendedDistance}</Text>
                    </Box>
                    <Box>
                      <Text color="gray.500">KEY CRITERIA</Text>
                      <Text color="#00F2FE" fontWeight="600">
                        {exercise.id === 'squat'
                          ? 'Knee Angle ≤ 95°'
                          : exercise.id === 'bicep-curl'
                          ? 'Elbow Curl ≤ 60°'
                          : exercise.id === 'overhead-press'
                          ? 'Elbow Lockout ≥ 155°'
                          : 'Horizontal Plank Gate'}
                      </Text>
                    </Box>
                  </SimpleGrid>
                </Box>

                {/* Target Muscles */}
                <Box mb={5}>
                  <Text fontSize="2xs" fontWeight="700" color="gray.500" textTransform="uppercase" mb={2}>
                    Engaged Musculature
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
                        color="gray.300"
                        fontWeight="500"
                      >
                        {muscle}
                      </Box>
                    ))}
                  </Flex>
                </Box>
              </Box>

              {/* Action Buttons */}
              <HStack spacing={3} pt={2} borderTop="1px solid" borderColor="surface.border">
                <Button
                  size="sm"
                  variant="outline"
                  borderColor="surface.border"
                  color="gray.300"
                  fontSize="xs"
                  fontWeight="600"
                  flex="1"
                  _hover={{ bg: 'surface.elevated', color: 'white', borderColor: 'gray.600' }}
                  onClick={() => setActiveModalExercise(exercise)}
                >
                  Form Guide
                </Button>
                <Button
                  size="sm"
                  bg="#00F2FE"
                  color="#080C14"
                  fontSize="xs"
                  fontWeight="700"
                  flex="1"
                  _hover={{ bg: '#22d3ee', transform: 'translateY(-1px)' }}
                  onClick={() => onSelectExercise(exercise)}
                >
                  Train Now
                </Button>
              </HStack>
            </Box>
          );
        })}
      </SimpleGrid>

      {/* Detail Modal */}
      <ExerciseDetailModal
        exercise={activeModalExercise}
        isOpen={Boolean(activeModalExercise)}
        onClose={() => setActiveModalExercise(null)}
        onSelectExercise={onSelectExercise}
      />
    </Box>
  );
};
