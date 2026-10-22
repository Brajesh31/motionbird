import React from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  SimpleGrid,
  Badge,
} from '@chakra-ui/react';

interface LandingHeroProps {
  onStartTraining: () => void;
  onExploreExercises: () => void;
  onOpenWorkoutBuilder: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onStartTraining,
  onExploreExercises,
  onOpenWorkoutBuilder,
}) => {
  const pipelineSteps = [
    { title: 'Camera', desc: 'Secure local video stream with zero cloud upload' },
    { title: 'Movement', desc: '33 landmark 3D pose tracking via MediaPipe WASM' },
    { title: 'Analysis', desc: 'Joint angle state machines & range-of-motion verification' },
    { title: 'Feedback', desc: 'Real-time auditory tones and visual form corrections' },
    { title: 'Progress', desc: 'Deterministic overload metrics, streaks, and PR records' },
  ];

  return (
    <Box w="100%" maxW="7xl" mx="auto" px={{ base: 4, md: 8 }} py={{ base: 6, md: 12 }}>
      {/* Hero Header */}
      <VStack spacing={6} textAlign="center" maxW="4xl" mx="auto" mb={12}>
        <HStack spacing={2} px={3} py={1} borderRadius="full" bg="surface.card" border="1px solid" borderColor="surface.border">
          <Box w={2} h={2} borderRadius="full" bg="#00F2FE" />
          <Text fontSize="xs" fontWeight="700" color="#00F2FE" letterSpacing="widest" textTransform="uppercase">
            REAL-TIME COMPUTER VISION FITNESS
          </Text>
        </HStack>

        <Heading
          size="2xl"
          fontWeight="900"
          lineHeight="shorter"
          color="white"
          letterSpacing="tight"
          fontSize={{ base: '2.5rem', md: '3.75rem' }}
        >
          Train with a camera.{' '}
          <Text as="span" color="#00F2FE">
            Move naturally.
          </Text>{' '}
          Get real-time feedback.
        </Heading>

        <Text fontSize={{ base: 'md', md: 'lg' }} color="gray.400" maxW="2xl" lineHeight="tall">
          MotionBird analyzes exercise kinematics directly in your browser. Count authentic repetitions, detect subtle form breakdowns, and track verified overload without wearable sensors.
        </Text>

        <HStack spacing={4} pt={2} wrap="wrap" justify="center">
          <Button
            size="lg"
            bg="#00F2FE"
            color="#080C14"
            fontWeight="800"
            fontSize="sm"
            px={8}
            _hover={{ bg: '#22d3ee', transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(0, 242, 254, 0.3)' }}
            onClick={onStartTraining}
          >
            Start Training
          </Button>

          <Button
            size="lg"
            variant="outline"
            borderColor="surface.border"
            color="white"
            fontSize="sm"
            fontWeight="700"
            px={7}
            _hover={{ bg: 'surface.elevated', borderColor: 'gray.500', transform: 'translateY(-1px)' }}
            onClick={onExploreExercises}
          >
            Explore Exercises
          </Button>

          <Button
            size="lg"
            variant="ghost"
            color="gray.400"
            fontSize="sm"
            fontWeight="600"
            _hover={{ color: '#00F2FE', bg: 'transparent' }}
            onClick={onOpenWorkoutBuilder}
          >
            Custom Workout &rarr;
          </Button>
        </HStack>
      </VStack>

      {/* Product Workflow Architecture Bar */}
      <Box
        bg="surface.card"
        border="1px solid"
        borderColor="surface.border"
        borderRadius="2xl"
        p={6}
        mb={14}
        boxShadow="0 8px 32px rgba(0, 0, 0, 0.3)"
      >
        <Text fontSize="2xs" fontWeight="800" color="gray.500" letterSpacing="widest" textTransform="uppercase" mb={4} textAlign="center">
          DETERMINISTIC COMPUTER-VISION PIPELINE
        </Text>
        <SimpleGrid columns={{ base: 1, sm: 2, md: 5 }} spacing={4}>
          {pipelineSteps.map((step, idx) => (
            <Box key={step.title} position="relative" p={3} borderRadius="xl" bg="surface.elevated" border="1px solid" borderColor="surface.border">
              <HStack spacing={2} mb={1}>
                <Text fontSize="xs" fontWeight="800" color="#00F2FE">
                  0{idx + 1}
                </Text>
                <Text fontSize="xs" fontWeight="700" color="white">
                  {step.title}
                </Text>
              </HStack>
              <Text fontSize="2xs" color="gray.400" lineHeight="normal">
                {step.desc}
              </Text>
            </Box>
          ))}
        </SimpleGrid>
      </Box>

      {/* Visual Product Demonstration Mockup */}
      <Box
        bg="surface.card"
        border="1px solid"
        borderColor="surface.border"
        borderRadius="3xl"
        overflow="hidden"
        p={{ base: 4, md: 8 }}
        boxShadow="0 16px 48px rgba(0, 0, 0, 0.5)"
        mb={12}
      >
        <Flex justify="space-between" align="center" mb={6} wrap="wrap" gap={3}>
          <VStack align="flex-start" spacing={0}>
            <Text fontSize="xs" fontWeight="700" color="#00F2FE" letterSpacing="widest" textTransform="uppercase">
              LIVE VISION INTERFACE PREVIEW
            </Text>
            <Heading size="md" color="white" fontWeight="800">
              Kinematic Posture HUD & Form Analysis
            </Heading>
          </VStack>
          <HStack spacing={3}>
            <Badge colorScheme="green" variant="subtle" fontSize="2xs" px={2} py={1} borderRadius="full">
              TRACKING GOOD &bull; 60 FPS
            </Badge>
            <Badge colorScheme="cyan" variant="solid" fontSize="2xs" px={2} py={1} borderRadius="full">
              100% ON-DEVICE
            </Badge>
          </HStack>
        </Flex>

        <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6} alignContent="center">
          {/* Simulated Skeleton & Camera Viewport */}
          <Box
            gridColumn={{ base: 'span 1', lg: 'span 2' }}
            bg="#060910"
            border="1px solid"
            borderColor="surface.border"
            borderRadius="2xl"
            p={6}
            position="relative"
            minH="320px"
            display="flex"
            flexDirection="column"
            justifyContent="space-between"
          >
            {/* Top Bar inside Viewport */}
            <Flex justify="space-between" align="center">
              <HStack spacing={2} bg="rgba(15, 22, 36, 0.8)" px={3} py={1} borderRadius="full" border="1px solid" borderColor="surface.border">
                <Box w={2} h={2} borderRadius="full" bg="#00F2FE" />
                <Text fontSize="2xs" color="gray.300" fontWeight="600">
                  Squat Biomechanics Model Active
                </Text>
              </HStack>
              <Text fontSize="2xs" fontFamily="monospace" color="gray.500">
                1280 × 720 @ 60 Hz
              </Text>
            </Flex>

            {/* Visual SVG Skeleton Wireframe */}
            <Box alignSelf="center" my={4}>
              <svg width="220" height="200" viewBox="0 0 220 200" fill="none">
                {/* Head */}
                <circle cx="110" cy="30" r="14" stroke="#00F2FE" strokeWidth="2" fill="rgba(0, 242, 254, 0.1)" />
                {/* Torso & Spine */}
                <line x1="110" y1="44" x2="110" y2="105" stroke="#00F2FE" strokeWidth="3" />
                {/* Shoulders */}
                <line x1="80" y1="58" x2="140" y2="58" stroke="#00F2FE" strokeWidth="3" />
                {/* Left Arm */}
                <line x1="80" y1="58" x2="65" y2="90" stroke="#00F2FE" strokeWidth="2.5" />
                <line x1="65" y1="90" x2="60" y2="120" stroke="#00F2FE" strokeWidth="2.5" />
                {/* Right Arm */}
                <line x1="140" y1="58" x2="155" y2="90" stroke="#00F2FE" strokeWidth="2.5" />
                <line x1="155" y1="90" x2="160" y2="120" stroke="#00F2FE" strokeWidth="2.5" />
                {/* Hips */}
                <line x1="90" y1="105" x2="130" y2="105" stroke="#00F2FE" strokeWidth="3" />
                {/* Left Leg (Squat angle 92 deg) */}
                <line x1="90" y1="105" x2="70" y2="145" stroke="#22c55e" strokeWidth="3.5" />
                <line x1="70" y1="145" x2="70" y2="185" stroke="#22c55e" strokeWidth="3.5" />
                {/* Right Leg */}
                <line x1="130" y1="105" x2="150" y2="145" stroke="#22c55e" strokeWidth="3.5" />
                <line x1="150" y1="145" x2="150" y2="185" stroke="#22c55e" strokeWidth="3.5" />
                {/* Joint Glow Points */}
                <circle cx="70" cy="145" r="5" fill="#22c55e" />
                <circle cx="150" cy="145" r="5" fill="#22c55e" />
                <circle cx="110" cy="105" r="4" fill="#00F2FE" />
                <circle cx="80" cy="58" r="4" fill="#00F2FE" />
                <circle cx="140" cy="58" r="4" fill="#00F2FE" />
                {/* Angle Annotation Arc */}
                <text x="35" y="148" fill="#22c55e" fontSize="11" fontWeight="bold" fontFamily="monospace">
                  92° Knee
                </text>
              </svg>
            </Box>

            {/* Bottom Real-time Form Notification Banner */}
            <Box
              bg="rgba(34, 197, 94, 0.12)"
              border="1px solid"
              borderColor="rgba(34, 197, 94, 0.3)"
              p={3}
              borderRadius="xl"
            >
              <HStack spacing={2}>
                <Text color="green.400" fontWeight="800">&bull;</Text>
                <Text fontSize="xs" fontWeight="700" color="white">
                  Form Cue: Excellent depth achieved (Knee ≤ 95°). Drive straight upward.
                </Text>
              </HStack>
            </Box>
          </Box>

          {/* Right Metrics Panel */}
          <VStack spacing={4} align="stretch" justify="space-between">
            {/* Rep Counter Box */}
            <Box bg="surface.elevated" border="1px solid" borderColor="surface.border" borderRadius="2xl" p={5}>
              <Text fontSize="2xs" fontWeight="700" color="gray.400" textTransform="uppercase" mb={1}>
                SET 2 OF 3 &bull; SQUAT
              </Text>
              <Flex align="baseline" gap={2} mb={2}>
                <Text fontSize="5xl" fontWeight="900" color="white" lineHeight="1">
                  8
                </Text>
                <Text fontSize="lg" color="gray.500" fontWeight="700">
                  / 10 REPS
                </Text>
              </Flex>
              <Badge colorScheme="purple" fontSize="2xs" px={2} py={0.5} borderRadius="md">
                PHASE: INFLECTION / PEAK
              </Badge>
            </Box>

            {/* Biomechanical Telemetry */}
            <Box bg="surface.elevated" border="1px solid" borderColor="surface.border" borderRadius="2xl" p={5}>
              <Text fontSize="2xs" fontWeight="700" color="gray.400" textTransform="uppercase" mb={3}>
                KINEMATIC SENSORS
              </Text>
              <VStack align="stretch" spacing={2} fontSize="xs">
                <Flex justify="space-between">
                  <Text color="gray.400">Knee Angle:</Text>
                  <Text color="green.400" fontWeight="700">92° (Target ≤ 95°)</Text>
                </Flex>
                <Flex justify="space-between">
                  <Text color="gray.400">Torso Inclination:</Text>
                  <Text color="#00F2FE" fontWeight="700">71° (Stable)</Text>
                </Flex>
                <Flex justify="space-between">
                  <Text color="gray.400">Rep Pacing:</Text>
                  <Text color="gray.300" fontWeight="600">2.4s (Eccentric 1.5s)</Text>
                </Flex>
                <Flex justify="space-between">
                  <Text color="gray.400">Form Precision:</Text>
                  <Text color="cyan.300" fontWeight="700">94% Clean</Text>
                </Flex>
              </VStack>
            </Box>

            {/* Launch CTA */}
            <Button
              w="100%"
              size="md"
              bg="#00F2FE"
              color="#080C14"
              fontWeight="800"
              _hover={{ bg: '#22d3ee' }}
              onClick={onStartTraining}
            >
              Launch Live Tracker
            </Button>
          </VStack>
        </SimpleGrid>
      </Box>

      {/* Trust & Architecture Principles */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
        <Box bg="surface.card" border="1px solid" borderColor="surface.border" borderRadius="2xl" p={6}>
          <HStack spacing={2} mb={2}>
            <Box w={2} h={2} borderRadius="full" bg="#00F2FE" />
            <Text fontSize="xs" fontWeight="700" color="white">
              Zero Video Transmission
            </Text>
          </HStack>
          <Text fontSize="xs" color="gray.400" lineHeight="tall">
            Webcam frames never leave your computer. Pose extraction executes completely client-side in WebAssembly and WebGL shaders for complete privacy.
          </Text>
        </Box>

        <Box bg="surface.card" border="1px solid" borderColor="surface.border" borderRadius="2xl" p={6}>
          <HStack spacing={2} mb={2}>
            <Box w={2} h={2} borderRadius="full" bg="cyan.400" />
            <Text fontSize="xs" fontWeight="700" color="white">
              Kinematic State Machines
            </Text>
          </HStack>
          <Text fontSize="xs" color="gray.400" lineHeight="tall">
            No naive bounding boxes. MotionBird evaluates multi-joint vectors, velocity thresholds, hysteresis bounds, and inflection points to reject partial reps.
          </Text>
        </Box>

        <Box bg="surface.card" border="1px solid" borderColor="surface.border" borderRadius="2xl" p={6}>
          <HStack spacing={2} mb={2}>
            <Box w={2} h={2} borderRadius="full" bg="green.400" />
            <Text fontSize="xs" fontWeight="700" color="white">
              Auditory & Haptic Coaching
            </Text>
          </HStack>
          <Text fontSize="xs" color="gray.400" lineHeight="tall">
            Synthesized Web Audio tones and optional Web Speech coaching announce reps and call out critical form breakdown without breaking your focus.
          </Text>
        </Box>
      </SimpleGrid>
    </Box>
  );
};
