export type DonationConfig = {
  gcash: {
    enabled: boolean;
    qrImagePath: string;
    displayName?: string;
    instructions?: string;
    allowDownload: boolean;
  };
  international: {
    enabled: boolean;
    providerName: string;
    url: string;
  };
};

// Only enable a method after its official receiving details are approved for
// public display. GCash assets belong in public/images/donations/.
export const donationConfig: DonationConfig = {
  gcash: {
    enabled: false,
    qrImagePath: "",
    allowDownload: true,
  },
  international: {
    enabled: false,
    providerName: "",
    url: "",
  },
};
