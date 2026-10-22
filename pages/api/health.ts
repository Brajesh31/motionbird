import type { NextApiRequest, NextApiResponse } from 'next';

type HealthData = {
  status: string;
  name: string;
  version: string;
  timestamp: string;
};

export default function handler(
  _req: NextApiRequest,
  res: NextApiResponse<HealthData>
) {
  res.status(200).json({
    status: 'healthy',
    name: 'MotionBird Movement Engine',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
  });
}
