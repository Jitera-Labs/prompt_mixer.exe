export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-xl leading-relaxed text-center">
      <div className="text-[var(--nc-yellow)] font-bold">C:\SYSTEM\AI&gt;</div>
      <div className="text-[var(--nc-white)] mt-2">SYSTEM READY.</div>
      <div className="text-[var(--nc-white)]">NO CHAT LOADED.</div>
      <div className="text-[var(--nc-white)]">SELECT A CHAT FROM HISTORY OR CREATE NEW_CHAT.BAT</div>
    </div>
  );
}
