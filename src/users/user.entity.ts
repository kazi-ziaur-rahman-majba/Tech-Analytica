import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Role } from 'src/common/enums';
import { Task } from 'src/tasks/task.entity';
import { AuditLog } from 'src/audit-log/audit-log.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password?: string;

  @Column({ type: 'enum', enum: Role, default: Role.USER })
  role: Role;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Task, (task: Task) => task.assignedTo)
  tasks: Task[];

  @OneToMany(() => AuditLog, (log: AuditLog) => log.actor)
  auditLogs: AuditLog[];
}
