import React from 'react';
import { Box, Flex, HStack, Text, VStack, Badge, IconButton, Tooltip } from '@chakra-ui/react';
import { DebugMetrics } from '../../lib/types/session';

interface DebugOverlayProps {
  metrics: DebugMetrics;
  phase: string;
  reps: number;
  isOpen: boolean;
  onToggle: () => void;
}

export const DebugOverlay: React.FC<DebugOverlayProps> = ({
  metrics,
  phase,
  reps,
  isOpen,
  onToggle,
}) => {
  return (
    <>
      {/* Subtle HUD Toggle Button */}
      <Tooltip label={isOpen ? 'Hide Developer Telemetry (Shift+D)' : 'Show Developer Telemetry (Shift+D)'}>
        <IconButton
          size="xs"
          aria-label="Toggle Debug HUD"
          variant="solid"
          bg={isOpen ? 'rgba(0, 242, 254, 0.2)' : 'rgba(15, 22, 36, 0.75)'}
          color={isOpen ? '#00F2FE' : 'gray.400'}
          border="1px solid"
          borderColor={isOpen ? '#00F2FE' : 'surface.border'}
          backdropFilter="blur(6px)"
          _hover={{ bg: 'surface.elevated', color: '#00F2FE' }}
          onClick={onToggle}
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          }
        />
      </Tooltip>

      {/* Developer HUD Panel */}
      {isOpen && (
        <Box
          position="absolute"
          top={12}
          right={3}
          w="250px"
          bg="rgba(8, 12, 20, 0.92)"
          border="1px solid"
          borderColor="rgba(0, 242, 254, 0.3)"
          borderRadius="lg"
          p={3}
          boxShadow="0 4px 20px rgba(0, 0, 0, 0.6)"
          backdropFilter="blur(10px)"
          zIndex={25}
          fontFamily="monospace"
        >
          <Flex justify="space-between" align="center" mb={2} pb={1.5} borderBottom="1px solid" borderColor="surface.border">
            <HStack spacing={1.5}>
              <Box w={2} h={2} borderRadius="full" bg="#00F2FE" />
              <Text fontSize="2xs" fontWeight="700" color="white" letterSpacing="wider">
                CV TELEMETRY HUD
              </Text>
            </HStack>
            <Badge size="xs" colorScheme="cyan" variant="subtle" fontSize="3xs">
              DEBUG
            </Badge>
          </Flex>

          <VStack align="stretch" spacing={1.5} fontSize="3xs">
            <Flex justify="space-between">
              <Text color="gray.400">FPS / Inference:</Text>
              <Text color={metrics.fps < 20 ? 'red.400' : 'green.300'} fontWeight="600">
                {metrics.fps} fps / {metrics.inferenceMs.toFixed(1)}ms
              </Text>
            </Flex>

            <Flex justify="space-between">
              <Text color="gray.400">Resolution:</Text>
              <Text color="gray.200">{metrics.canvasResolution}</Text>
            </Flex>

            <Flex justify="space-between">
              <Text color="gray.400">Tracking Status:</Text>
              <Text
                color={
                  metrics.trackingStatus === 'TRACKING'
                    ? 'green.300'
                    : metrics.trackingStatus === 'LOW_CONFIDENCE'
                    ? 'yellow.300'
                    : 'red.400'
                }
                fontWeight="600"
              >
                {metrics.trackingStatus}
              </Text>
            </Flex>

            <Flex justify="space-between">
              <Text color="gray.400">Pose Confidence:</Text>
              <Text color="cyan.300" fontWeight="600">
                {(metrics.trackingConfidence * 100).toFixed(1)}%
              </Text>
            </Flex>

            <Flex justify="space-between">
              <Text color="gray.400">FSM Phase:</Text>
              <Badge colorScheme="purple" fontSize="3xs" px={1}>
                {phase}
              </Badge>
            </Flex>

            <Flex justify="space-between">
              <Text color="gray.400">Rep Count:</Text>
              <Text color="white" fontWeight="700">
                {reps}
              </Text>
            </Flex>

            {/* Joint Angles Telemetry */}
            {Object.keys(metrics.activeJointAngles).length > 0 && (
              <Box mt={1} pt={1} borderTop="1px dashed" borderColor="surface.border">
                <Text color="gray.400" mb={1} fontWeight="600">
                  Joint Angles:
                </Text>
                {Object.entries(metrics.activeJointAngles).map(([joint, angle]) => (
                  <Flex key={joint} justify="space-between" pl={1}>
                    <Text color="gray.500">{joint}:</Text>
                    <Text color="#00F2FE">{Math.round(angle)}°</Text>
                  </Flex>
                ))}
              </Box>
            )}
          </VStack>
        </Box>
      )}
    </>
  );
};
