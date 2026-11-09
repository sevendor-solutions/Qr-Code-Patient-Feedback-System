import { Module, Global } from '@nestjs/common';
import { SmsNotificationService } from './sms.service';

@Global()
@Module({
  providers: [SmsNotificationService],
  exports: [SmsNotificationService],
})
export class NotificationsModule {}
