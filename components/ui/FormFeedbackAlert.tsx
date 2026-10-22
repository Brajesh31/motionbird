import React, { useEffect, useState } from 'react';
import { Box, Flex, Text, HStack } from '@chakra-ui/react';
import { FormFeedback } from '../../lib/types/exercise';

interface FormFeedbackAlertProps {
  feedback: FormFeedback | null | undefined;
}

export const FormFeedbackAlert: React.FC<FormFeedbackAlertProps> = ({ feedback }) => {
  const [currentFeedback, setCurrentFeedback] = useState<FormFeedback | null>(null);

  useEffect(() => {
    if (feedback) {
      setCurrentFeedback(feedback);
      const timer = setTimeout(() => {
        setCurrentFeedback(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  if (!currentFeedback) {
    return null;
  }

  const getAlertStyles = () => {
    switch (currentFeedback.severity) {
      case 'warning':
        return {
          bg: 'rgba(245, 158, 11, 0.16)',
          border: '1px solid #F59E0B',
          iconColor: '#F59E0B',
          textColor: '#FDE68A',
        };
      case 'success':
        return {
          bg: 'rgba(16, 185, 129, 0.16)',
          border: '1px solid #10B981',
          iconColor: '#10B981',
          textColor: '#A7F3D0',
        };
      case 'error':
        return {
          bg: 'rgba(239, 68, 68, 0.16)',
          border: '1px solid #EF4444',
          iconColor: '#EF4444',
          textColor: '#FECACA',
        };
      case 'info':
      default:
        return {
          bg: 'rgba(0, 242, 254, 0.16)',
          border: '1px solid #00F2FE',
          iconColor: '#00F2FE',
          textColor: '#CFFAFE',
        };
    }
  };

  const style = getAlertStyles();

  return (
    <Box
      w="100%"
      p={3.5}
      borderRadius="xl"
      bg={style.bg}
      border={style.border}
      boxShadow="0 4px 16px rgba(0, 0, 0, 0.3)"
      backdropFilter="blur(8px)"
      animation="fadeIn 0.2s ease-in-out"
    >
      <HStack spacing={3} align="center">
        <Box color={style.iconColor} flexShrink={0}>
          {currentFeedback.severity === 'warning' ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          ) : currentFeedback.severity === 'success' ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          )}
        </Box>
        <Flex direction="column">
          <Text fontSize="xs" fontWeight="700" textTransform="uppercase" letterSpacing="0.05em" color={style.iconColor}>
            Form Feedback
          </Text>
          <Text fontSize="sm" fontWeight="600" color={style.textColor}>
            {currentFeedback.message}
          </Text>
        </Flex>
      </HStack>
    </Box>
  );
};
