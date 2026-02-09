import { useMixerStore } from '../../stores/mixerStore';
import { DEFAULT_ANCHORS } from '../../lib/constants';
import { IconRenderer } from '../ui/IconRenderer';

export function ValueDisplay() {
  const emotionValues = useMixerStore(s => s.emotionValues);

  return (
    <div className="flex-grow nc-scroll overflow-y-auto p-3 pt-4 text-lg grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-2">
      {DEFAULT_ANCHORS.map(anchor => {
        const value = emotionValues[anchor.name] || 0;
        const percentage = value * 100;
        return (
          <div key={anchor.name} className="mb-1">
            <div className="flex justify-between mb-1">
              <span className="flex items-center gap-2">
                <span className="text-[var(--nc-yellow)]">
                  <IconRenderer icon={anchor.icon} />
                </span>
                <span>{anchor.name.toUpperCase()}</span>
              </span>
              <span className="text-[var(--nc-cyan)]">{value.toFixed(2)}</span>
            </div>
            <div className="relative h-4 bg-black border border-white">
              <div
                className="absolute top-0 left-0 h-full bg-[var(--nc-cyan)]"
                style={{ width: `${percentage}%` }}
              />
              <div
                className="absolute top-[-1px] h-[18px] w-3 bg-[var(--nc-yellow)] border border-black ml-[-6px]"
                style={{ left: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
