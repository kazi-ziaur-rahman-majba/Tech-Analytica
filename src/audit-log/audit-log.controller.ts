import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditLogController {
  constructor(private auditLogService: AuditLogService) {}

  @Get()
  @Roles(Role.ADMIN)
  async getAuditLogs() {
    const logs = await this.auditLogService.findAll();
    return logs.map((log) => ({
      id: log.id,
      actionType: log.actionType,
      actorEmail: log.actor?.email,
      taskTitle: log.task?.title,
      beforeData: log.beforeData,
      afterData: log.afterData,
      createdAt: log.createdAt,
    }));
  }
}
