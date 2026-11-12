import type { DonationConfig } from "@/config/donations";

export type DonationMethod =
  | { id: "gcash"; label: "GCash"; qrImagePath: string; displayName?: string; instructions?: string; allowDownload: boolean }
  | { id: "international"; label: string; url: string };

export function configuredDonationMethods(config: DonationConfig, assetExists: (path: string) => boolean): DonationMethod[] {
  const methods: DonationMethod[] = [];
  const gcash = config.gcash;
  const localImage = /^\/images\/donations\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.(?:png|jpe?g|webp)$/i;
  if (gcash.enabled && localImage.test(gcash.qrImagePath) && assetExists(gcash.qrImagePath)) {
    methods.push({
      id: "gcash",
      label: "GCash",
      qrImagePath: gcash.qrImagePath,
      displayName: gcash.displayName,
      instructions: gcash.instructions,
      allowDownload: gcash.allowDownload,
    });
  }

  const international = config.international;
  if (international.enabled && international.providerName.trim()) {
    try {
      const url = new URL(international.url);
      if (url.protocol === "https:" && !url.username && !url.password && url.hostname.includes(".")) {
        methods.push({ id: "international", label: international.providerName.trim(), url: url.href });
      }
    } catch { /* An incomplete source configuration keeps this method hidden. */ }
  }
  return methods;
}
