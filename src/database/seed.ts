import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/user.entity';
import { Role, TaskStatus, ActionType } from '../common/enums';
import { Task } from '../tasks/task.entity';
import { AuditLog } from '../audit-log/audit-log.entity';

import * as dotenv from 'dotenv';
dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL || 'postgresql://postgres:yourpassword@localhost:5432/taskdb',
  synchronize: true,
  entities: [User, Task, AuditLog],
});

async function bootstrap() {
  await AppDataSource.initialize();
  console.log('Database connected...');

  const userRepository = AppDataSource.getRepository(User);

  const sharedPassword = await bcrypt.hash('123456', 10);

  // Determine if users exist
  const existingAdmin = await userRepository.findOneBy({ email: 'admin@gmail.com' });
  if (!existingAdmin) {
    const admin = userRepository.create({
      email: 'admin@gmail.com',
      password: sharedPassword,
      role: Role.ADMIN,
    });
    await userRepository.save(admin);
    console.log('Admin user created.');
  }

  const existingUser = await userRepository.findOneBy({ email: 'user@gmail.com' });
  if (!existingUser) {
    const user = userRepository.create({
      email: 'user@gmail.com',
      password: sharedPassword,
      role: Role.USER,
    });
    await userRepository.save(user);
    console.log('Standard user created.');
  }

  const taskRepository = AppDataSource.getRepository(Task);
  const auditLogRepository = AppDataSource.getRepository(AuditLog);

  const adminUser = await userRepository.findOneBy({ email: 'admin@gmail.com' });
  const standardUser = await userRepository.findOneBy({ email: 'user@gmail.com' });

  const existingTasks = await taskRepository.count();
  if (existingTasks === 0 && standardUser && adminUser) {
    const tasksData = [
      {
        title: 'Review Project Requirements',
        description: 'Read the latest BRD and provide feedback before the Monday meeting.',
        status: TaskStatus.DONE,
        assignedTo: standardUser,
      },
      {
        title: 'Develop User Authentication JWT',
        description: 'Implement JWT based authentication in NestJS including guards and strategies.',
        status: TaskStatus.PROCESSING,
        assignedTo: standardUser,
      },
      {
        title: 'Design Database Schema',
        description: 'Create ER diagrams for the new Analytics module tables.',
        status: TaskStatus.PENDING,
        assignedTo: standardUser,
      }
    ];

    const savedTasks = await taskRepository.save(
      tasksData.map(data => taskRepository.create(data))
    );
    console.log('Seed tasks created.');

    const logsToCreate = savedTasks.map(task => auditLogRepository.create({
      actor: adminUser,
      actionType: ActionType.TASK_CREATED,
      task: task,
      beforeData: null,
      afterData: { title: task.title, status: task.status }
    }));
    await auditLogRepository.save(logsToCreate);
    console.log('Seed audit logs created.');
  }

  console.log('Seed execution finished.');
  await AppDataSource.destroy();
}

bootstrap().catch(console.error);
