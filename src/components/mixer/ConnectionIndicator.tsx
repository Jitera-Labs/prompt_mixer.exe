import { useEffect, useState } from 'react';
import { useMixerStore } from '../../stores/mixerStore';

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

export function ConnectionIndicator() {
  const connectionStatus = useMixerStore(s => s.connectionStatus);
  const status = useMixerStore(s => s.status);
  const [frame, setFrame] = useState(0);

  const isBusy = status === 'Mixing' || status === 'Writing';

  useEffect(() => {
    if (!isBusy) return;
    const interval = setInterval(() => {
      setFrame(f => (f + 1) % SPINNER_FRAMES.length);
    }, 80);
    return () => clearInterval(interval);
  }, [isBusy]);

  let stateClass = '';
  if (connectionStatus === 'error') stateClass = 'error';
  else if (isBusy) stateClass = 'busy';
  else if (connectionStatus === 'connected') stateClass = 'connected';
  else stateClass = 'disconnected';

  return (
    <div className={`connection-indicator ${stateClass}`}>
      {isBusy ? SPINNER_FRAMES[frame] : ''}
    </div>
  );
}
