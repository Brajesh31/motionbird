import React from 'react';
import {
  Box,
  Flex,
  HStack,
  Text,
  Badge,
  IconButton,
  Button,
  Tooltip,
} from '@chakra-ui/react';
import { ExerciseDefinition } from '../../lib/types/exercise';

export type ActiveTab = 'dashboard' | 'workout' | 'exercises' | 'history' | 'progress';

interface HeaderProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  activeExercise: ExerciseDefinition;
  onOpenWorkoutBuilder: () => void;
  onOpenProfile: () => void;
  isAudioMuted: boolean;
  onToggleAudio: () => void;
  isVoiceEnabled: boolean;
  onToggleVoice: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  activeExercise,
  onOpenWorkoutBuilder,
  onOpenProfile,
  isAudioMuted,
  onToggleAudio,
  isVoiceEnabled,
  onToggleVoice,
}) => {
  return (
    <Box
      as="header"
      w="100%"
      borderBottom="1px solid"
      borderColor="surface.border"
      bg="surface.card"
      px={{ base: 4, md: 8 }}
      py={3}
      position="sticky"
      top={0}
      zIndex={30}
      backdropFilter="blur(8px)"
    >
      <Flex
        maxW="7xl"
        mx="auto"
        alignItems="center"
        justifyContent="space-between"
        flexWrap="wrap"
        gap={3}
      >
        {/* Brand Logo & Title */}
        <HStack spacing={3} onClick={() => onSelectTab('dashboard')} cursor="pointer">
          <Box
            w="36px"
            h="36px"
            borderRadius="lg"
            bg="linear-gradient(135deg, #00F2FE 0%, #4FACFE 100%)"
            display="flex"
            alignItems="center"
            justifyContent="center"
            boxShadow="0 0 16px rgba(0, 242, 254, 0.35)"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#080C14"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </Box>
          <Box>
            <HStack spacing={2} alignItems="baseline">
              <Text fontSize="xl" fontWeight="900" letterSpacing="-0.02em" color="white">
                Motion<Text as="span" color="#00F2FE">Bird</Text>
              </Text>
              <Badge
                variant="subtle"
                fontSize="2xs"
                px={1.5}
                py={0.2}
                borderRadius="md"
                bg="rgba(0, 242, 254, 0.12)"
                color="#00F2FE"
                border="1px solid"
                borderColor="rgba(0, 242, 254, 0.25)"
              >
                Movement Intelligence
              </Badge>
            </HStack>
          </Box>
        </HStack>

        {/* Center Navigation Tabs */}
        <HStack spacing={1} bg="surface.elevated" p={1} borderRadius="xl" border="1px solid" borderColor="surface.border" overflowX="auto">
          <Button
            size="xs"
            variant="ghost"
            px={3}
            borderRadius="lg"
            bg={activeTab === 'dashboard' ? '#00F2FE' : 'transparent'}
            color={activeTab === 'dashboard' ? '#080C14' : 'gray.400'}
            fontWeight="700"
            _hover={{ bg: activeTab === 'dashboard' ? '#00F2FE' : 'surface.border' }}
            onClick={() => onSelectTab('dashboard')}
          >
            Dashboard
          </Button>

          <Button
            size="xs"
            variant="ghost"
            px={3}
            borderRadius="lg"
            bg={activeTab === 'workout' ? '#00F2FE' : 'transparent'}
            color={activeTab === 'workout' ? '#080C14' : 'gray.400'}
            fontWeight="700"
            _hover={{ bg: activeTab === 'workout' ? '#00F2FE' : 'surface.border' }}
            onClick={() => onSelectTab('workout')}
          >
            Workout
          </Button>

          <Button
            size="xs"
            variant="ghost"
            px={3}
            borderRadius="lg"
            bg={activeTab === 'exercises' ? '#00F2FE' : 'transparent'}
            color={activeTab === 'exercises' ? '#080C14' : 'gray.400'}
            fontWeight="700"
            _hover={{ bg: activeTab === 'exercises' ? '#00F2FE' : 'surface.border' }}
            onClick={() => onSelectTab('exercises')}
          >
            Exercises
          </Button>

          <Button
            size="xs"
            variant="ghost"
            px={3}
            borderRadius="lg"
            bg={activeTab === 'history' ? '#00F2FE' : 'transparent'}
            color={activeTab === 'history' ? '#080C14' : 'gray.400'}
            fontWeight="700"
            _hover={{ bg: activeTab === 'history' ? '#00F2FE' : 'surface.border' }}
            onClick={() => onSelectTab('history')}
          >
            History
          </Button>

          <Button
            size="xs"
            variant="ghost"
            px={3}
            borderRadius="lg"
            bg={activeTab === 'progress' ? '#00F2FE' : 'transparent'}
            color={activeTab === 'progress' ? '#080C14' : 'gray.400'}
            fontWeight="700"
            _hover={{ bg: activeTab === 'progress' ? '#00F2FE' : 'surface.border' }}
            onClick={() => onSelectTab('progress')}
          >
            Progress
          </Button>
        </HStack>

        {/* Right Controls: Choose Routine, Voice, Audio, Privacy */}
        <HStack spacing={3}>
          {/* Quick Workout / Exercise Picker */}
          <Button
            size="sm"
            colorScheme="cyan"
            variant="outline"
            borderColor="surface.border"
            fontWeight="700"
            fontSize="xs"
            onClick={onOpenWorkoutBuilder}
            leftIcon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            }
          >
            Routine: {activeExercise.name}
          </Button>

          {/* Voice Coach Toggle */}
          <Tooltip label={isVoiceEnabled ? 'Voice Coach: Enabled' : 'Voice Coach: Disabled'}>
            <IconButton
              size="sm"
              aria-label="Toggle Voice Coach"
              variant="outline"
              borderColor="surface.border"
              bg={isVoiceEnabled ? 'rgba(0, 242, 254, 0.15)' : 'surface.elevated'}
              color={isVoiceEnabled ? '#00F2FE' : 'gray.500'}
              _hover={{ bg: 'surface.border' }}
              onClick={onToggleVoice}
              icon={
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              }
            />
          </Tooltip>

          {/* Audio Beep Toggle */}
          <Tooltip label={isAudioMuted ? 'Rep Audio: Muted' : 'Rep Audio: Active'}>
            <IconButton
              size="sm"
              aria-label="Toggle Rep Audio"
              variant="outline"
              borderColor="surface.border"
              bg="surface.elevated"
              color={isAudioMuted ? 'gray.500' : '#00F2FE'}
              _hover={{ bg: 'surface.border' }}
              onClick={onToggleAudio}
              icon={
                isAudioMuted ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="1" y1="1" x2="23" y2="23" />
                    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                  </svg>
                )
              }
            />
          </Tooltip>

          {/* User Profile Button */}
          <Tooltip label="Athlete Profile & Goals">
            <IconButton
              size="sm"
              aria-label="Open Athlete Profile"
              variant="outline"
              borderColor="surface.border"
              bg="surface.elevated"
              color="gray.300"
              _hover={{ bg: 'surface.border', color: 'white' }}
              onClick={onOpenProfile}
              icon={
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              }
            />
          </Tooltip>
        </HStack>
      </Flex>
    </Box>
  );
};
