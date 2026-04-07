import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/user.entity';
import { Role } from '../common/enums';
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

  const adminPassword = await bcrypt.hash('admin123', 10);
  const userPassword = await bcrypt.hash('user123', 10);

  // Determine if users exist
  const existingAdmin = await userRepository.findOneBy({ email: 'admin@example.com' });
  if (!existingAdmin) {
    const admin = userRepository.create({
      email: 'admin@example.com',
      password: adminPassword,
      role: Role.ADMIN,
    });
    await userRepository.save(admin);
    console.log('Admin user created.');
  }

  const existingUser = await userRepository.findOneBy({ email: 'user@example.com' });
  if (!existingUser) {
    const user = userRepository.create({
      email: 'user@example.com',
      password: userPassword,
      role: Role.USER,
    });
    await userRepository.save(user);
    console.log('Standard user created.');
  }

  console.log('Seed execution finished.');
  await AppDataSource.destroy();
}

bootstrap().catch(console.error);
