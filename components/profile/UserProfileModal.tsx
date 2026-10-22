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
  Input,
  Select,
  SimpleGrid,
  Badge,
} from '@chakra-ui/react';
import { UserProfile } from '../../lib/types/session';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSaveProfile: (updated: Partial<UserProfile>) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
}) => {
  const [name, setName] = useState<string>(profile.name);
  const [goal, setGoal] = useState<UserProfile['goal']>(profile.goal);
  const [experience, setExperience] = useState<UserProfile['experienceLevel']>(profile.experienceLevel);
  const [duration, setDuration] = useState<number>(profile.preferredDurationMinutes);

  const handleSave = () => {
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
      <ModalOverlay bg="rgba(8, 12, 20, 0.85)" backdropFilter="blur(8px)" />
      <ModalContent bg="surface.card" border="1px solid" borderColor="surface.border" borderRadius="2xl" color="white">
        <ModalHeader borderBottom="1px solid" borderColor="surface.border" pb={4}>
          <Text fontSize="lg" fontWeight="800">
            Athlete Profile & Training Setup
          </Text>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody p={6}>
          <VStack spacing={4} align="stretch">
            {/* Quick Stats Summary */}
            <SimpleGrid columns={3} spacing={3} p={3.5} borderRadius="xl" bg="surface.elevated" border="1px solid" borderColor="surface.border">
              <Box textAlign="center">
                <Text fontSize="2xs" color="gray.500" fontWeight="700">WORKOUTS</Text>
                <Text fontSize="xl" fontWeight="900" color="white">{profile.completedWorkoutsCount}</Text>
              </Box>
              <Box textAlign="center">
                <Text fontSize="2xs" color="gray.500" fontWeight="700">TOTAL REPS</Text>
                <Text fontSize="xl" fontWeight="900" color="#00F2FE">{profile.totalRepsLogged}</Text>
              </Box>
              <Box textAlign="center">
                <Text fontSize="2xs" color="gray.500" fontWeight="700">STREAK</Text>
                <Text fontSize="xl" fontWeight="900" color="#10B981">{profile.currentStreakDays} Days</Text>
              </Box>
            </SimpleGrid>

            {/* Editable Profile Inputs */}
            <Box>
              <Text fontSize="2xs" color="gray.400" fontWeight="700" textTransform="uppercase" mb={1}>
                Athlete Name
              </Text>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
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
              <Select
                value={experience}
                onChange={(e) => setExperience(e.target.value as UserProfile['experienceLevel'])}
                bg="surface.elevated"
                borderColor="surface.border"
                borderRadius="lg"
              >
                <option value="Beginner" style={{ background: '#0F1624' }}>Beginner (Focus on form calibration)</option>
                <option value="Intermediate" style={{ background: '#0F1624' }}>Intermediate (Standard training)</option>
                <option value="Advanced" style={{ background: '#0F1624' }}>Advanced (High volume & strict tempo)</option>
              </Select>
            </Box>

            <Box>
              <Text fontSize="2xs" color="gray.400" fontWeight="700" textTransform="uppercase" mb={1}>
                Target Session Duration
              </Text>
              <Select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                bg="surface.elevated"
                borderColor="surface.border"
                borderRadius="lg"
              >
                <option value={10} style={{ background: '#0F1624' }}>10 Minutes</option>
                <option value={20} style={{ background: '#0F1624' }}>20 Minutes</option>
                <option value={30} style={{ background: '#0F1624' }}>30 Minutes</option>
                <option value={45} style={{ background: '#0F1624' }}>45+ Minutes</option>
              </Select>
            </Box>

            <HStack spacing={3} pt={2}>
              <Button flex="1" colorScheme="cyan" onClick={handleSave}>
                Save Changes
              </Button>
              <Button variant="outline" borderColor="surface.border" onClick={onClose}>
                Cancel
              </Button>
            </HStack>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
