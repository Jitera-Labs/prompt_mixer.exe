export function EmptyState() {
  return (
    <div className="flex flex-col items-start justify-center h-full p-8 text-xl leading-relaxed">
      <div className="text-[var(--nc-yellow)] font-bold">C:\SYSTEM\AI&gt;</div>
      <div className="text-[var(--nc-white)] pl-4">SYSTEM READY.</div>
      <div className="text-[var(--nc-white)] pl-4">NO CHAT LOADED.</div>
      <div className="text-[var(--nc-white)] pl-4">SELECT A CHAT FROM HISTORY OR CREATE NEW_CHAT.BAT</div>
    </div>
  );
}
