import React from 'react';
import { HStack, Box, Text, Tooltip } from '@chakra-ui/react';
import { TrackingQuality } from '../../lib/types/pose';

interface TrackingStatusBadgeProps {
  quality: TrackingQuality;
}

export const TrackingStatusBadge: React.FC<TrackingStatusBadgeProps> = ({ quality }) => {
  const getStatusConfig = () => {
    switch (quality.status) {
      case 'TRACKING':
        return {
          dotColor: '#10B981',
          bg: 'rgba(16, 185, 129, 0.12)',
          border: 'rgba(16, 185, 129, 0.3)',
          textColor: '#10B981',
          label: `Tracking Active (${Math.round(quality.confidence * 100)}%)`,
          tooltip: 'All key landmarks visible and tracked reliably.',
        };
      case 'LOW_CONFIDENCE':
        return {
          dotColor: '#F59E0B',
          bg: 'rgba(245, 158, 11, 0.12)',
          border: 'rgba(245, 158, 11, 0.3)',
          textColor: '#F59E0B',
          label: 'Low Confidence — Adjust Position',
          tooltip: 'Some joints are partially occluded or camera lighting is low.',
        };
      case 'TRACKING_LOST':
        return {
          dotColor: '#EF4444',
          bg: 'rgba(239, 68, 68, 0.12)',
          border: 'rgba(239, 68, 68, 0.3)',
          textColor: '#EF4444',
          label: 'Tracking Lost — Step Into Frame',
          tooltip: 'Body landmarks not detected. Move fully into camera frame.',
        };
      case 'INITIALIZING':
      default:
        return {
          dotColor: '#00F2FE',
          bg: 'rgba(0, 242, 254, 0.12)',
          border: 'rgba(0, 242, 254, 0.3)',
          textColor: '#00F2FE',
          label: 'Detecting Pose...',
          tooltip: 'Initializing computer-vision pose engine.',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Tooltip label={config.tooltip} placement="top">
      <HStack
        spacing={2}
        px={3}
        py={1.5}
        borderRadius="full"
        bg={config.bg}
        border="1px solid"
        borderColor={config.border}
        backdropFilter="blur(6px)"
      >
        <Box
          w={2.5}
          h={2.5}
          borderRadius="full"
          bg={config.dotColor}
          boxShadow={`0 0 8px ${config.dotColor}`}
        />
        <Text fontSize="xs" fontWeight="700" color={config.textColor}>
          {config.label}
        </Text>
      </HStack>
    </Tooltip>
  );
};
