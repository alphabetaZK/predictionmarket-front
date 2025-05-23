interface LeoWallet {
  connect(): Promise<boolean>;
  enable?(): Promise<boolean>; // Méthode alternative
  getAccount(): Promise<string | null>;
  decrypt?(): Promise<any>; // Autre méthode possible
  execute(params: {
    programId: string;
    functionName: string;
    inputs: string[];
    fee?: number;
  }): Promise<string>; // Returns transaction ID
  on(event: 'accountsChanged' | 'chainChanged' | 'disconnect', listener: (data: any) => void): void;
  // Autres méthodes et événements du wallet Leo
}

interface Window {
  leoWallet?: LeoWallet;
} 