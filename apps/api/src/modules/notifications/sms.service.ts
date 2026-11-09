import { Injectable, Logger } from '@nestjs/common';

export interface SentSms {
  id: string;
  mobile: string;
  message: string;
  timestamp: Date;
  status: 'SENT' | 'DELIVERED' | 'FAILED';
}

@Injectable()
export class SmsNotificationService {
  private readonly logger = new Logger(SmsNotificationService.name);
  private readonly sentMessages: SentSms[] = [];

  async sendSms(mobile: string, message: string): Promise<boolean> {
    const record: SentSms = {
      id: `SMS-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      mobile,
      message,
      timestamp: new Date(),
      status: 'DELIVERED',
    };

    this.sentMessages.push(record);
    // In production, integration with CDAC / NIC SMS Gateway / Gov SMS API
    this.logger.log(`[MOCK SMS GATEWAY] To: ${mobile} | Message: "${message}"`);
    return true;
  }

  async sendFeedbackAcknowledgement(mobile: string, ticketId: string, departmentName: string): Promise<boolean> {
    const message = `Thank you for your valuable feedback for ${departmentName} at eSushrut G5 Hospital. Your reference ID is ${ticketId}. - C-DAC eSushrut`;
    return this.sendSms(mobile, message);
  }

  async sendComplaintAcknowledgement(mobile: string, ticketId: string, departmentName: string): Promise<boolean> {
    const message = `Your query/complaint regarding ${departmentName} has been registered with Ticket ID ${ticketId}. Track status at hospital portal. - C-DAC eSushrut`;
    return this.sendSms(mobile, message);
  }

  async sendComplaintStatusUpdate(
    mobile: string,
    ticketId: string,
    status: string,
    remarks: string,
  ): Promise<boolean> {
    const message = `Update on Ticket ${ticketId}: Status changed to ${status}. Remarks: ${remarks.slice(0, 80)}. - C-DAC eSushrut`;
    return this.sendSms(mobile, message);
  }

  async sendLowRatingAlert(
    deptHeadEmail: string | null | undefined,
    deptHeadPhone: string | null | undefined,
    deptName: string,
    overallRating: number,
    mobile: string,
  ): Promise<boolean> {
    const alertMsg = `ALERT: Low patient rating (${overallRating}/5) received in ${deptName} from patient ${mobile}. Please review immediately.`;
    this.logger.warn(`[SMS / EMAIL ALERT] To Head (${deptHeadEmail || deptHeadPhone || 'N/A'}): ${alertMsg}`);
    if (deptHeadPhone) {
      await this.sendSms(deptHeadPhone, alertMsg);
    }
    return true;
  }

  getRecentSentMessages(): SentSms[] {
    return [...this.sentMessages].reverse().slice(0, 50);
  }
}
