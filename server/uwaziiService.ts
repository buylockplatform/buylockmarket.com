interface UwaziiResponse {
  ErrorCode?: number;
  ErrorDescription?: string;
  Data?: Array<{
    MessageId: string;
  }>;
  // Alternative format: phone number as key with array of id_state objects
  [phoneNumber: string]: Array<{
    id_state: number;
  }>;
}

export class UwaziiSMSService {
  private apiKey: string;
  private senderId: string;
  private baseUrl = 'https://api2.uwaziimobile.com/send';

  constructor() {
    this.apiKey = process.env.UWAZII_API_KEY || '';
    this.senderId = process.env.UWAZII_SENDER_ID || '';
    
    if (!this.apiKey || !this.senderId) {
      console.error('Uwazii SMS credentials not configured');
    }
  }

  async sendSMS(phone: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.apiKey || !this.senderId) {
      return { success: false, error: 'SMS service not configured' };
    }

    try {
      // Format phone number for Kenya (remove + and ensure it starts with 254)
      const formattedPhone = this.formatPhoneNumber(phone);
      
      const requestUrl = `${this.baseUrl}?token=${encodeURIComponent(this.apiKey)}&phone=${encodeURIComponent(formattedPhone)}&senderID=${encodeURIComponent(this.senderId)}&text=${encodeURIComponent(message)}`;
      
      console.log(`📱 Sending SMS to ${formattedPhone} via Uwazii`);
      
      const response = await fetch(requestUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'BuyLock-SMS-Service/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();
      console.log(`📋 Uwazii API raw response: ${responseText}`);
      let responseObject: UwaziiResponse;
      
      try {
        responseObject = JSON.parse(responseText);
        console.log(`📋 Uwazii API parsed response:`, responseObject);
      } catch (parseError) {
        console.error('Failed to parse Uwazii response:', responseText);
        return { success: false, error: 'Invalid response from SMS service' };
      }

      // Check if response has ErrorCode format
      if (responseObject.ErrorCode !== undefined) {
        if (responseObject.ErrorCode === 0) {
          const messageId = responseObject.Data?.[0]?.MessageId;
          console.log(`✅ SMS sent successfully to ${formattedPhone}, MessageId: ${messageId}`);
          return { success: true, messageId };
        } else {
          console.error(`❌ SMS failed for ${formattedPhone}. ErrorCode: ${responseObject.ErrorCode}, ErrorDescription: "${responseObject.ErrorDescription}"`);
          return { success: false, error: responseObject.ErrorDescription || `Error code: ${responseObject.ErrorCode}` };
        }
      }
      
      // Check if response has phone number key format (successful response)
      const phoneData = responseObject[formattedPhone];
      if (phoneData) {
        // Handle array format: [{"id_state": 123}, {"id_state": 124}]
        if (Array.isArray(phoneData) && phoneData.length > 0) {
          const messageIds = phoneData.map(item => item.id_state.toString());
          console.log(`✅ SMS sent successfully to ${formattedPhone}, MessageIds: ${messageIds.join(', ')}`);
          return { success: true, messageId: messageIds[0] };
        }
        // Handle string format: "556594022"
        else if (typeof phoneData === 'string') {
          console.log(`✅ SMS sent successfully to ${formattedPhone}, MessageId: ${phoneData}`);
          return { success: true, messageId: phoneData };
        }
        // Handle number format: 556594022
        else if (typeof phoneData === 'number') {
          console.log(`✅ SMS sent successfully to ${formattedPhone}, MessageId: ${phoneData.toString()}`);
          return { success: true, messageId: phoneData.toString() };
        }
      }
      
      // If we reach here, the response format is unexpected
      console.error(`❌ Unexpected UWAZII response format for ${formattedPhone}:`, responseObject);
      return { success: false, error: 'Unexpected response format from SMS service' };
    } catch (error) {
      console.error('Uwazii SMS error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '');
    
    // Handle Kenyan phone numbers
    if (cleaned.startsWith('254')) {
      return cleaned; // Already in correct format
    } else if (cleaned.startsWith('0')) {
      return '254' + cleaned.substring(1); // Replace leading 0 with 254
    } else if (cleaned.startsWith('7') || cleaned.startsWith('1')) {
      return '254' + cleaned; // Add country code
    }
    
    return cleaned; // Return as-is for other formats
  }
}

export const uwaziiService = new UwaziiSMSService();