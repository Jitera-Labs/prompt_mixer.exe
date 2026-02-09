import { useMixerStore } from '../../stores/mixerStore';

export function ConnectionIndicator() {
  const connectionStatus = useMixerStore(s => s.connectionStatus);

  return (
    <div className={`connection-indicator ${connectionStatus}`} />
  );
}
