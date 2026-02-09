import { SpinnerGap } from '@phosphor-icons/react';
import { useMixerStore } from '../../stores/mixerStore';

export function MixerStatus() {
  const status = useMixerStore(s => s.status);

  if (!status) return null;

  return (
    <div className="mixer-status">
      {status === 'Mixing' && <SpinnerGap size={16} className="mr-2 inline-block animate-spin" />}
      {status}
    </div>
  );
}
