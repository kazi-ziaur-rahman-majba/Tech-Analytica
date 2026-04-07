import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ActionType } from 'src/common/enums';
import { User } from 'src/users/user.entity';
import { Task } from 'src/tasks/task.entity';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user: User) => user.auditLogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'actorId' })
  actor: User;

  @Column()
  actorId: string;

  @Column({ type: 'enum', enum: ActionType })
  actionType: ActionType;

  @ManyToOne(() => Task, (task: Task) => task.auditLogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'taskId' })
  task: Task;

  @Column()
  taskId: string;

  @Column({ type: 'jsonb', nullable: true })
  beforeData: any;

  @Column({ type: 'jsonb', nullable: true })
  afterData: any;

  @CreateDateColumn()
  createdAt: Date;
}
