// Time system utility functions

export function getTimeData() {
  const now = new Date();
  
  return {
    year: now.getFullYear(),
    month: String(now.getMonth() + 1).padStart(2, '0'), // Month is 0-indexed
    day: String(now.getDate()).padStart(2, '0'),
    hour: String(now.getHours()).padStart(2, '0'),
    minute: String(now.getMinutes()).padStart(2, '0'),
    second: String(now.getSeconds()).padStart(2, '0')
  };
}