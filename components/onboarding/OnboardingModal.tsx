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
  Select,
  Input,
  SimpleGrid,
} from '@chakra-ui/react';
import { UserProfile } from '../../lib/types/session';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveProfile: (profile: Partial<UserProfile>) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onSaveProfile,
}) => {
  const [name, setName] = useState<string>('Athlete');
  const [goal, setGoal] = useState<UserProfile['goal']>('General Fitness');
  const [experience, setExperience] = useState<UserProfile['experienceLevel']>('Beginner');
  const [duration, setDuration] = useState<number>(20);

  const handleComplete = () => {
    onSaveProfile({
      name: name.trim() || 'Athlete',
      goal,
      experienceLevel: experience,
      preferredDurationMinutes: duration,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
      <ModalOverlay bg="rgba(8, 12, 20, 0.9)" backdropFilter="blur(8px)" />
      <ModalContent bg="surface.card" border="1px solid" borderColor="surface.border" borderRadius="2xl" color="white">
        <ModalHeader borderBottom="1px solid" borderColor="surface.border" pb={4}>
          <Text fontSize="xl" fontWeight="900">
            Welcome to Motion<Text as="span" color="#00F2FE">Bird</Text>
          </Text>
          <Text fontSize="xs" color="gray.400" fontWeight="400">
            Tailor your real-time computer-vision training experience
          </Text>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody p={6}>
          <VStack spacing={4} align="stretch">
            <Box>
              <Text fontSize="2xs" color="gray.400" fontWeight="700" textTransform="uppercase" mb={1}>
                Your Name
              </Text>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                bg="surface.elevated"
                borderColor="surface.border"
                borderRadius="lg"
              />
            </Box>

            <Box>
              <Text fontSize="2xs" color="gray.400" fontWeight="700" textTransform="uppercase" mb={1}>
                Primary Fitness Goal
              </Text>
              <Select
                value={goal}
                onChange={(e) => setGoal(e.target.value as UserProfile['goal'])}
                bg="surface.elevated"
                borderColor="surface.border"
                borderRadius="lg"
              >
                <option value="General Fitness" style={{ background: '#0F1624' }}>General Fitness & Health</option>
                <option value="Strength & Muscle" style={{ background: '#0F1624' }}>Strength & Hypertrophy</option>
                <option value="Consistency" style={{ background: '#0F1624' }}>Building a Daily Workout Habit</option>
                <option value="Form Mastery" style={{ background: '#0F1624' }}>Learning & Correcting Movement Form</option>
                <option value="Mobility" style={{ background: '#0F1624' }}>Joint Mobility & Range of Motion</option>
              </Select>
            </Box>

            <Box>
              <Text fontSize="2xs" color="gray.400" fontWeight="700" textTransform="uppercase" mb={1}>
                Experience Level
              </Text>
              <SimpleGrid columns={3} spacing={2}>
                {(['Beginner', 'Intermediate', 'Advanced'] as const).map((lvl) => (
                  <Button
                    key={lvl}
                    size="sm"
                    variant={experience === lvl ? 'solid' : 'outline'}
                    colorScheme={experience === lvl ? 'cyan' : 'gray'}
                    borderColor="surface.border"
                    onClick={() => setExperience(lvl)}
                  >
                    {lvl}
                  </Button>
                ))}
              </SimpleGrid>
            </Box>

            <Box>
              <Text fontSize="2xs" color="gray.400" fontWeight="700" textTransform="uppercase" mb={1}>
                Target Session Length
              </Text>
              <Select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                bg="surface.elevated"
                borderColor="surface.border"
                borderRadius="lg"
              >
                <option value={10} style={{ background: '#0F1624' }}>10 Minutes (Quick Micro-Session)</option>
                <option value={20} style={{ background: '#0F1624' }}>20 Minutes (Standard Routine)</option>
                <option value={30} style={{ background: '#0F1624' }}>30 Minutes (Comprehensive)</option>
                <option value={45} style={{ background: '#0F1624' }}>45+ Minutes (Power Session)</option>
              </Select>
            </Box>

            <HStack spacing={3} pt={3}>
              <Button flex="1" colorScheme="cyan" size="lg" fontWeight="800" onClick={handleComplete}>
                Get Started →
              </Button>
              <Button variant="ghost" color="gray.500" onClick={onClose} size="lg">
                Skip for now
              </Button>
            </HStack>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
