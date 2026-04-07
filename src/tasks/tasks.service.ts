import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { AuditLogService } from '../audit-log/audit-log.service';
import { ActionType } from '../common/enums';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    private auditLogService: AuditLogService,
  ) {}

  async findAllForAdmin(): Promise<Task[]> {
    return this.tasksRepository.find({ relations: ['assignedTo'] });
  }

  async findAllForUser(userId: string): Promise<Task[]> {
    return this.tasksRepository.find({
      where: { assignedToId: userId },
      relations: ['assignedTo'],
    });
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.tasksRepository.findOne({ where: { id }, relations: ['assignedTo'] });
    if (!task) {
      throw new NotFoundException(`Task with id ${id} not found`);
    }
    return task;
  }

  async create(createTaskDto: CreateTaskDto, adminId: string): Promise<Task> {
    const task = this.tasksRepository.create(createTaskDto);
    const savedTask = await this.tasksRepository.save(task);

    await this.auditLogService.log({
      actorId: adminId,
      actionType: ActionType.TASK_CREATED,
      taskId: savedTask.id,
      afterData: savedTask,
    });

    return savedTask;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, adminId: string): Promise<Task> {
    const task = await this.findOne(id);
    const beforeData = { ...task };
    
    let actionType = ActionType.TASK_UPDATED;
    if (updateTaskDto.assignedToId !== undefined && updateTaskDto.assignedToId !== task.assignedToId) {
      actionType = ActionType.TASK_ASSIGNED;
    }

    Object.assign(task, updateTaskDto);
    const updatedTask = await this.tasksRepository.save(task);

    await this.auditLogService.log({
      actorId: adminId,
      actionType,
      taskId: updatedTask.id,
      beforeData,
      afterData: updatedTask,
    });

    return updatedTask;
  }

  async updateStatus(id: string, updateStatusDto: UpdateStatusDto, userId: string): Promise<Task> {
    const task = await this.findOne(id);
    const beforeData = { status: task.status };

    task.status = updateStatusDto.status;
    const updatedTask = await this.tasksRepository.save(task);

    await this.auditLogService.log({
      actorId: userId,
      actionType: ActionType.STATUS_CHANGED,
      taskId: updatedTask.id,
      beforeData,
      afterData: { status: updatedTask.status },
    });

    return updatedTask;
  }

  async remove(id: string, adminId: string): Promise<void> {
    const task = await this.findOne(id);
    const beforeData = { ...task };

    await this.tasksRepository.delete(id);

    await this.auditLogService.log({
      actorId: adminId,
      actionType: ActionType.TASK_DELETED,
      taskId: id,
      beforeData,
    });
  }
}
