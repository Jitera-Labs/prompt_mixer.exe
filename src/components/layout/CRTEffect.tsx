import React from 'react';
import { useSettingsStore } from '../../stores/settingsStore';

/**
 * CRTEffect - Fixed overlay that renders scanline effect
 * Provides authentic CRT monitor appearance
 * Only renders when enableCRTEffect is true in settings
 */
const CRTEffect: React.FC = () => {
  const enableCRTEffect = useSettingsStore((state) => state.enableCRTEffect);

  if (!enableCRTEffect) return null;

  return <div className="crt-scanline" />;
};

export default CRTEffect;
