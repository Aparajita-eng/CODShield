import { WhatsAppAdapter, VoiceAdapter } from "./provider.interface";

export class MetaWhatsAppAdapter implements WhatsAppAdapter {
  async validateCredentials(config: any): Promise<boolean> {
    if (!config || !config.token) return false;
    return config.token.includes("meta_");
  }

  async sendVerificationMessage(phone: string, orderDetails: any, config: any): Promise<{ messageId: string; status: string }> {
    const randomId = `meta-msg-${Math.floor(Math.random() * 1000000)}`;
    return {
      messageId: randomId,
      status: "SENT",
    };
  }

  async getMessageStatus(messageId: string, config: any): Promise<string> {
    return "DELIVERED";
  }
}

export class TwilioWhatsAppAdapter implements WhatsAppAdapter {
  async validateCredentials(config: any): Promise<boolean> {
    if (!config || !config.accountSid || !config.authToken) return false;
    return config.accountSid.startsWith("AC");
  }

  async sendVerificationMessage(phone: string, orderDetails: any, config: any): Promise<{ messageId: string; status: string }> {
    const randomId = `twilio-wa-${Math.floor(Math.random() * 1000000)}`;
    return {
      messageId: randomId,
      status: "SENT",
    };
  }

  async getMessageStatus(messageId: string, config: any): Promise<string> {
    return "DELIVERED";
  }
}

export class TwilioVoiceAdapter implements VoiceAdapter {
  async validateCredentials(config: any): Promise<boolean> {
    if (!config || !config.accountSid || !config.authToken) return false;
    return config.accountSid.startsWith("AC");
  }

  async triggerConfirmationCall(phone: string, callDetails: any, config: any): Promise<{ callId: string; status: string }> {
    const randomId = `twilio-call-${Math.floor(Math.random() * 1000000)}`;
    return {
      callId: randomId,
      status: "QUEUED",
    };
  }

  async getCallStatus(callId: string, config: any): Promise<{ status: string; digitPressed?: string }> {
    // Return mock digits: "1" (confirm) or "2" (reject) based on callId ending digit to facilitate E2E verification
    const idVal = parseInt(callId.replace(/\D/g, "") || "1", 10);
    const digitPressed = idVal % 2 === 0 ? "2" : "1";
    return {
      status: "COMPLETED",
      digitPressed,
    };
  }
}

export class ExotelVoiceAdapter implements VoiceAdapter {
  async validateCredentials(config: any): Promise<boolean> {
    if (!config || !config.apiKey || !config.apiToken) return false;
    return config.apiKey.length > 5;
  }

  async triggerConfirmationCall(phone: string, callDetails: any, config: any): Promise<{ callId: string; status: string }> {
    const randomId = `exotel-call-${Math.floor(Math.random() * 1000000)}`;
    return {
      callId: randomId,
      status: "QUEUED",
    };
  }

  async getCallStatus(callId: string, config: any): Promise<{ status: string; digitPressed?: string }> {
    return {
      status: "COMPLETED",
      digitPressed: "1", // always confirm
    };
  }
}

export class DemoVoiceAdapter implements VoiceAdapter {
  async validateCredentials(config: any): Promise<boolean> {
    return true;
  }

  async triggerConfirmationCall(phone: string, callDetails: any, config: any): Promise<{ callId: string; status: string }> {
    const randomId = `demo-voice-call-${Math.floor(Math.random() * 1000000)}`;
    return {
      callId: randomId,
      status: "COMPLETED",
    };
  }

  async getCallStatus(callId: string, config: any): Promise<{ status: string; digitPressed?: string }> {
    return {
      status: "COMPLETED",
      digitPressed: "1", // auto confirm
    };
  }
}
