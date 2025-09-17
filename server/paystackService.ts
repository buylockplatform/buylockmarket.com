// Paystack API service for subaccount and transfer management
interface PaystackConfig {
  secretKey: string;
  baseUrl: string;
}

interface PaystackSubaccountData {
  business_name: string;
  settlement_bank: string;
  account_number: string;
  percentage_charge: number;
  description?: string;
  primary_contact_email?: string;
  primary_contact_name?: string;
  primary_contact_phone?: string;
  metadata?: Record<string, any>;
}

interface PaystackTransferData {
  source: string;
  amount: number;
  recipient: string;
  reason?: string;
  currency?: string;
}

interface PaystackTransferRecipientData {
  type: string;
  name: string;
  account_number: string;
  bank_code: string;
  currency?: string;
  description?: string;
  metadata?: Record<string, any>;
}

export class PaystackService {
  private config: PaystackConfig;
  private isConfigured: boolean;

  constructor(secretKey?: string) {
    const key = secretKey ?? process.env.PAYSTACK_SECRET_KEY ?? '';
    this.config = {
      secretKey: key,
      baseUrl: 'https://api.paystack.co',
    };
    this.isConfigured = !!key;
    
    if (!this.isConfigured && process.env.NODE_ENV === 'production') {
      throw new Error('Paystack secret key is required in production');
    }
    
    if (!this.isConfigured) {
      console.warn('Paystack disabled: missing PAYSTACK_SECRET_KEY');
    }
  }

  private async makeRequest(endpoint: string, method: 'GET' | 'POST' = 'GET', data?: any): Promise<any> {
    if (!this.isConfigured) {
      throw new Error('Paystack not configured');
    }
    const url = `${this.config.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.config.secretKey}`,
      'Content-Type': 'application/json',
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (data && method === 'POST') {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `Paystack API error: ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error(`Paystack API request failed:`, error);
      throw error;
    }
  }

  // Create a subaccount for a vendor
  async createSubaccount(subaccountData: PaystackSubaccountData): Promise<any> {
    console.log('Creating Paystack subaccount:', subaccountData.business_name);
    
    try {
      const response = await this.makeRequest('/subaccount', 'POST', subaccountData);
      return response.data;
    } catch (error) {
      console.error('Failed to create Paystack subaccount:', error);
      throw error;
    }
  }

  // Get subaccount details
  async getSubaccount(subaccountCode: string): Promise<any> {
    try {
      const response = await this.makeRequest(`/subaccount/${subaccountCode}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get Paystack subaccount:', error);
      throw error;
    }
  }

  // Update subaccount
  async updateSubaccount(subaccountCode: string, updateData: Partial<PaystackSubaccountData>): Promise<any> {
    try {
      const response = await this.makeRequest(`/subaccount/${subaccountCode}`, 'POST', updateData);
      return response.data;
    } catch (error) {
      console.error('Failed to update Paystack subaccount:', error);
      throw error;
    }
  }

  // Create transfer recipient
  async createTransferRecipient(recipientData: PaystackTransferRecipientData): Promise<any> {
    console.log('Creating transfer recipient:', recipientData.name);
    
    try {
      const response = await this.makeRequest('/transferrecipient', 'POST', recipientData);
      return response.data;
    } catch (error) {
      console.error('Failed to create transfer recipient:', error);
      throw error;
    }
  }

  // Initiate transfer
  async initiateTransfer(transferData: PaystackTransferData): Promise<any> {
    console.log('Initiating transfer:', transferData.amount, 'kobo to', transferData.recipient);
    
    try {
      const response = await this.makeRequest('/transfer', 'POST', transferData);
      return response.data;
    } catch (error) {
      console.error('Failed to initiate transfer:', error);
      throw error;
    }
  }

  // Get transfer details
  async getTransfer(transferId: string): Promise<any> {
    try {
      const response = await this.makeRequest(`/transfer/${transferId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get transfer details:', error);
      throw error;
    }
  }

  // Verify transfer
  async verifyTransfer(transferCode: string): Promise<any> {
    try {
      const response = await this.makeRequest(`/transfer/verify/${transferCode}`);
      return response.data;
    } catch (error) {
      console.error('Failed to verify transfer:', error);
      throw error;
    }
  }

  // Get list of banks for Kenya
  async getBanks(country: string = 'kenya'): Promise<any[]> {
    try {
      const response = await this.makeRequest(`/bank?country=${country}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get banks list:', error);
      throw error;
    }
  }

  // Resolve bank account details
  async resolveAccountNumber(accountNumber: string, bankCode: string): Promise<any> {
    try {
      const response = await this.makeRequest(`/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`);
      return response.data;
    } catch (error) {
      console.error('Failed to resolve bank account:', error);
      throw error;
    }
  }

  // Convert amount from KES to kobo (Paystack uses kobo as the smallest unit)
  kesToKobo(amountInKes: number): number {
    return Math.round(amountInKes * 100);
  }

  // Convert amount from kobo to KES
  koboToKes(amountInKobo: number): number {
    return amountInKobo / 100;
  }

  // Helper method to create subaccount for vendor
  async createVendorSubaccount(vendor: {
    businessName: string;
    contactName: string;
    email: string;
    bankName: string;
    bankCode?: string;
    accountNumber: string;
    accountName: string;
  }): Promise<{ subaccountId: string; subaccountCode: string }> {
    // First, resolve the bank code if not provided
    let bankCode = vendor.bankCode;
    if (!bankCode) {
      const banks = await this.getBanks();
      const bank = banks.find(b => 
        b.name.toLowerCase().includes(vendor.bankName.toLowerCase()) ||
        vendor.bankName.toLowerCase().includes(b.name.toLowerCase())
      );
      if (!bank) {
        throw new Error(`Bank not found: ${vendor.bankName}`);
      }
      bankCode = bank.code;
    }

    // Verify the account details
    try {
      await this.resolveAccountNumber(vendor.accountNumber, bankCode!);
    } catch (error) {
      throw new Error(`Invalid account details: ${error}`);
    }

    // Create the subaccount
    const subaccountData: PaystackSubaccountData = {
      business_name: vendor.businessName,
      settlement_bank: bankCode!,
      account_number: vendor.accountNumber,
      percentage_charge: 80, // Vendor gets 80%, platform gets 20%
      description: `Subaccount for ${vendor.businessName}`,
      primary_contact_email: vendor.email,
      primary_contact_name: vendor.contactName,
      metadata: {
        account_name: vendor.accountName,
        created_by: 'buylock_marketplace',
        vendor_email: vendor.email
      }
    };

    const subaccount = await this.createSubaccount(subaccountData);
    
    return {
      subaccountId: subaccount.id.toString(),
      subaccountCode: subaccount.subaccount_code
    };
  }

  // Helper method to process vendor payout
  async processVendorPayout(vendor: {
    businessName: string;
    contactName: string;
    email: string;
    bankName: string;
    bankCode?: string;
    accountNumber: string;
    accountName: string;
  }, amount: number, reason?: string): Promise<{ transferId: string; transferCode: string }> {
    // Check if we're in demo mode (development environment)
    const isDemoMode = process.env.NODE_ENV === 'development' || process.env.PAYSTACK_DEMO_MODE === 'true';
    
    if (isDemoMode) {
      // Simulate payout processing for demo purposes
      console.log(`🎭 DEMO MODE: Simulating payout to ${vendor.businessName}`);
      console.log(`💰 Amount: KES ${amount.toLocaleString()}`);
      console.log(`🏦 Bank: ${vendor.bankName} - Account: ****${vendor.accountNumber.slice(-4)}`);
      console.log(`📝 Reason: ${reason || `Payout to ${vendor.businessName}`}`);
      
      // Generate mock transfer data
      const mockTransferId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const mockTransferCode = `TRF_${Math.random().toString(36).substr(2, 12)}`;
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log(`✅ DEMO: Mock transfer created - ID: ${mockTransferId}, Code: ${mockTransferCode}`);
      
      return {
        transferId: mockTransferId,
        transferCode: mockTransferCode
      };
    }

    // Production mode - actual Paystack integration
    // First, resolve the bank code if not provided
    let bankCode = vendor.bankCode;
    if (!bankCode) {
      const banks = await this.getBanks();
      const bank = banks.find(b => 
        b.name.toLowerCase().includes(vendor.bankName.toLowerCase()) ||
        vendor.bankName.toLowerCase().includes(b.name.toLowerCase())
      );
      if (!bank) {
        throw new Error(`Bank not found: ${vendor.bankName}`);
      }
      bankCode = bank.code;
    }

    // Create transfer recipient
    const recipientData: PaystackTransferRecipientData = {
      type: 'nuban',
      name: vendor.accountName,
      account_number: vendor.accountNumber,
      bank_code: bankCode!,
      currency: 'KES',
      description: `Transfer recipient for ${vendor.businessName}`,
      metadata: {
        business_name: vendor.businessName,
        vendor_email: vendor.email,
        created_by: 'buylock_marketplace'
      }
    };

    const recipient = await this.createTransferRecipient(recipientData);

    // Initiate transfer
    const transferData: PaystackTransferData = {
      source: 'balance',
      amount: this.kesToKobo(amount),
      recipient: recipient.recipient_code,
      reason: reason || `Payout to ${vendor.businessName}`,
      currency: 'KES'
    };

    const transfer = await this.initiateTransfer(transferData);

    return {
      transferId: transfer.id.toString(),
      transferCode: transfer.transfer_code
    };
  }
}