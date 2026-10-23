const euro = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

export const formatPrice = (cents: number) => euro.format(cents / 100);
