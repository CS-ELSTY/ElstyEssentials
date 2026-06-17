// Elsty Essentials - getPlaceholder Function
// Replace placeholders in format string with actual values

export function getPlaceholder(format, data) {
  if (!format || !data || !Array.isArray(data) || data.length === 0) {
    return format || "";
  }

  const values = data[0];
  let result = format;

  // Replace all placeholders
  for (const [key, value] of Object.entries(values)) {
    const placeholder = `@${key}`;
    result = result.split(placeholder).join(String(value !== undefined && value !== null ? value : ""));
  }

  return result;
}