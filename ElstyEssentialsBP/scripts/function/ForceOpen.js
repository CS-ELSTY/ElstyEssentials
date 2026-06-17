// Elsty Essentials - ForceOpen UI Helper
// Wrapper for showing forms with error handling

export async function ForceOpen(player, form) {
  try {
    const result = await form.show(player);
    return result;
  } catch (error) {
    console.warn("[ForceOpen] Error showing form:", error);
    return { canceled: true, selection: 0, formValues: [] };
  }
}