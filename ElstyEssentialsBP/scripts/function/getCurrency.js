// Elsty Essentials - getCurrency Function
// Get currency symbol

const currencyDB = new Map();

export function getCurrency(player) {
  try {
    // Get currency symbol from world settings
    const currency = world.getDynamicProperty("currency_symbol");
    if (currency) {
      return String(currency);
    }
    return "$";
  } catch (error) {
    console.warn("[getCurrency] Error:", error);
    return "$";
  }
}

export function getDefaultCurrency() {
  try {
    const currency = world.getDynamicProperty("currency_symbol");
    if (currency) {
      return String(currency);
    }
    return "$";
  } catch (error) {
    return "$";
  }
}

export { currencyDB };