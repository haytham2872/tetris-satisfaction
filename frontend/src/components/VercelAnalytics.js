import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from "@vercel/speed-insights/react"

const VercelAnalytics = () => {
  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
};

export default VercelAnalytics;