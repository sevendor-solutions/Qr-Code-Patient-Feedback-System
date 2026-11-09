import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EscalationService } from './escalation.service';

@Injectable()
export class EscalationCronService {
  private readonly logger = new Logger(EscalationCronService.name);

  constructor(private readonly escalationService: EscalationService) {}

  // Run SLA scan every 5 minutes
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleCron() {
    this.logger.debug('Running SLA complaint auto-escalation check...');
    try {
      const result = await this.escalationService.processSlaEscalations();
      if (result.processedCount > 0) {
        this.logger.log(
          `SLA Auto-Escalation completed. Breached tickets: ${result.processedCount} (${result.escalatedTickets.join(
            ', ',
          )})`,
        );
      }
    } catch (err: any) {
      this.logger.error(`Error in SLA Escalation Cron: ${err.message}`, err.stack);
    }
  }
}
