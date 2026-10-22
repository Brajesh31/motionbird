import React, { useEffect, useState } from 'react';
import {
  Box,
  Flex,
  Text,
  VStack,
  HStack,
  Button,
  IconButton,
  Progress,
} from '@chakra-ui/react';
import { audioCue } from '../../lib/feedback/audio-cue';
import { voiceCoach } from '../../lib/feedback/voice-coach';

interface RestTimerCardProps {
  initialSeconds: number;
  nextExerciseName: string;
  nextSetNumber: number;
  totalSets: number;
  nextTargetReps: number;
  onFinishRest: () => void;
}

export const RestTimerCard: React.FC<RestTimerCardProps> = ({
  initialSeconds,
  nextExerciseName,
  nextSetNumber,
  totalSets,
  nextTargetReps,
  onFinishRest,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(initialSeconds);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const totalDuration = initialSeconds;

  useEffect(() => {
    if (isPaused) return;

    if (secondsRemaining <= 0) {
      audioCue.playRepSuccess();
      voiceCoach.announceRestComplete();
      onFinishRest();
      return;
    }

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsRemaining, isPaused, onFinishRest]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleAdjustTime = (delta: number) => {
    setSecondsRemaining((prev) => Math.max(5, prev + delta));
  };

  const progressPercent = Math.max(0, Math.min(100, (secondsRemaining / totalDuration) * 100));

  return (
    <Box
      position="absolute"
      inset={0}
      bg="rgba(8, 12, 20, 0.94)"
      backdropFilter="blur(8px)"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      p={6}
      zIndex={25}
    >
      <VStack
        spacing={5}
        maxW="md"
        w="100%"
        bg="surface.card"
        p={6}
        borderRadius="2xl"
        border="1px solid"
        borderColor="surface.border"
        boxShadow="0 8px 32px rgba(0, 0, 0, 0.6)"
        textAlign="center"
      >
        <Text fontSize="xs" fontWeight="700" color="#00F2FE" textTransform="uppercase" letterSpacing="0.1em">
          Rest Interval
        </Text>

        {/* Big Countdown */}
        <Text
          fontSize={{ base: '6xl', md: '7xl' }}
          fontWeight="900"
          fontFamily="monospace"
          lineHeight="1"
          color="white"
          textShadow="0 0 24px rgba(0, 242, 254, 0.3)"
        >
          {formatTime(secondsRemaining)}
        </Text>

        <Progress
          value={progressPercent}
          size="xs"
          w="100%"
          colorScheme="cyan"
          borderRadius="full"
          bg="surface.elevated"
        />

        {/* Adjust & Pause Controls */}
        <HStack spacing={3}>
          <Button size="xs" variant="outline" borderColor="surface.border" onClick={() => handleAdjustTime(-15)}>
            -15s
          </Button>
          <Button
            size="xs"
            variant="solid"
            bg="surface.elevated"
            color="white"
            onClick={() => setIsPaused(!isPaused)}
          >
            {isPaused ? 'Resume' : 'Pause'}
          </Button>
          <Button size="xs" variant="outline" borderColor="surface.border" onClick={() => handleAdjustTime(+15)}>
            +15s
          </Button>
        </HStack>

        {/* Up Next Preview */}
        <Box
          w="100%"
          p={3}
          borderRadius="lg"
          bg="surface.elevated"
          border="1px solid"
          borderColor="surface.border"
          textAlign="left"
        >
          <Text fontSize="2xs" color="gray.500" fontWeight="700" textTransform="uppercase">
            Up Next
          </Text>
          <Flex justify="space-between" align="baseline" mt={0.5}>
            <Text fontSize="sm" fontWeight="800" color="white">
              {nextExerciseName}
            </Text>
            <Text fontSize="xs" color="#00F2FE" fontWeight="700">
              Set {nextSetNumber} of {totalSets} &bull; {nextTargetReps} Reps
            </Text>
          </Flex>
        </Box>

        {/* Action Button */}
        <Button
          w="100%"
          size="md"
          colorScheme="cyan"
          fontWeight="700"
          onClick={onFinishRest}
        >
          Skip Rest & Start Next Set →
        </Button>
      </VStack>
    </Box>
  );
};
