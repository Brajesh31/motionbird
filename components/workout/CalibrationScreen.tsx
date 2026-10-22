import React, { useEffect, useState } from 'react';
import { Box, Flex, HStack, Text, VStack, Button, Progress } from '@chakra-ui/react';
import { TrackingQuality } from '../../lib/types/pose';
import { audioCue } from '../../lib/feedback/audio-cue';

interface CalibrationScreenProps {
  exerciseName: string;
  trackingQuality: TrackingQuality;
  onCalibrationComplete: () => void;
  onCancel: () => void;
}

export const CalibrationScreen: React.FC<CalibrationScreenProps> = ({
  exerciseName,
  trackingQuality,
  onCalibrationComplete,
  onCancel,
}) => {
  // Required consecutive stable frames (~3 seconds at ~30 FPS = ~90 frames, or 3 timer seconds)
  const [secondsRemaining, setSecondsRemaining] = useState<number>(3);
  const [isStable, setIsStable] = useState<boolean>(false);

  useEffect(() => {
    const isQualityGood =
      trackingQuality.status === 'TRACKING' && trackingQuality.confidence >= 0.6;
    setIsStable(isQualityGood);

    if (!isQualityGood) {
      setSecondsRemaining(3);
      return;
    }

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          audioCue.playRepSuccess();
          onCalibrationComplete();
          return 0;
        }
        audioCue.playBeep(600 + (3 - prev) * 150, 0.08);
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [trackingQuality, onCalibrationComplete]);

  const progressPercent = ((3 - secondsRemaining) / 3) * 100;

  return (
    <Flex
      position="absolute"
      inset={0}
      bg="rgba(8, 12, 20, 0.88)"
      backdropFilter="blur(8px)"
      direction="column"
      align="center"
      justify="center"
      p={6}
      zIndex={25}
    >
      <VStack spacing={6} maxW="md" w="100%" textAlign="center">
        {/* Header */}
        <VStack spacing={1}>
          <Text fontSize="xs" fontWeight="700" color="#00F2FE" letterSpacing="widest" textTransform="uppercase">
            CALIBRATION &bull; {exerciseName}
          </Text>
          <Text fontSize="xl" fontWeight="800" color="white">
            Movement Baseline Calibration
          </Text>
          <Text fontSize="xs" color="gray.400">
            Hold your starting posture still while MotionBird aligns landmark kinematics.
          </Text>
        </VStack>

        {/* Countdown Visualizer */}
        <Box position="relative" w="120px" h="120px" display="flex" alignItems="center" justifyContent="center">
          <Flex
            w="120px"
            h="120px"
            borderRadius="full"
            border="3px solid"
            borderColor={isStable ? '#00F2FE' : 'yellow.500'}
            align="center"
            justify="center"
            boxShadow={isStable ? '0 0 25px rgba(0, 242, 254, 0.35)' : 'none'}
            transition="all 0.3s ease"
            bg="rgba(15, 22, 36, 0.8)"
          >
            <Text fontSize="4xl" fontWeight="900" color={isStable ? 'white' : 'yellow.400'}>
              {secondsRemaining > 0 ? secondsRemaining : 'GO!'}
            </Text>
          </Flex>
        </Box>

        {/* Stability Status & Progress */}
        <VStack w="100%" spacing={2}>
          <Progress
            value={progressPercent}
            size="xs"
            w="100%"
            borderRadius="full"
            colorScheme="cyan"
            bg="surface.border"
          />
          <HStack spacing={2} fontSize="xs">
            <Box
              w={2.5}
              h={2.5}
              borderRadius="full"
              bg={isStable ? 'green.400' : 'yellow.400'}
            />
            <Text color={isStable ? 'green.300' : 'yellow.300'} fontWeight="600">
              {isStable
                ? 'Body detected & stable. Calibrating...'
                : 'Hold still and maintain full body in view'}
            </Text>
          </HStack>
        </VStack>

        {/* Action Buttons */}
        <HStack spacing={3}>
          <Button size="sm" variant="ghost" color="gray.400" onClick={onCancel}>
            Back to Setup
          </Button>
          <Button
            size="sm"
            variant="outline"
            borderColor="surface.border"
            color="gray.300"
            _hover={{ bg: 'surface.elevated', color: 'white' }}
            onClick={onCalibrationComplete}
          >
            Skip Calibration
          </Button>
        </HStack>
      </VStack>
    </Flex>
  );
};
