const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

/** 272 -> "04:32"; 3725 -> "1:02:05" */
export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export function formatTime(date: Date): string {
  const hours = date.getHours();
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${h12}:${pad(date.getMinutes())} ${suffix}`;
}

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** "Today", "Yesterday" or "18 Nov". */
export function formatDayLabel(date: Date, now: Date = new Date()): string {
  const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

/** Section heading for a call: "Today", "Yesterday" or "18 Nov". */
export function callDayHeading(iso: string): string {
  return formatDayLabel(new Date(iso));
}

/** "Today, 9:42 AM" */
export function formatCallDate(iso: string): string {
  const date = new Date(iso);
  return `${formatDayLabel(date)}, ${formatTime(date)}`;
}

export function greetingFor(date: Date = new Date()): string {
  const hour = date.getHours();
  if (hour < 5) return 'Good evening';
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}
