import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './audit-log.entity';
import { ActionType } from '../common/enums';

export interface LogParams {
  actorId: string;
  actionType: ActionType;
  taskId: string;
  beforeData?: any;
  afterData?: any;
}

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async log(params: LogParams): Promise<AuditLog> {
    const newLog = this.auditLogRepository.create(params);
    return this.auditLogRepository.save(newLog);
  }

  async findAll(): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      order: { createdAt: 'DESC' },
      relations: ['actor', 'task'],
    });
  }
}
