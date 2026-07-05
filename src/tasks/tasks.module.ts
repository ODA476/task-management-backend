import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { Task } from './entities/task.entity';
import { AuthModule } from 'src/auth/auth.module';
import { AiService } from 'src/ai/ai.service';
import { Subtask } from './entities/subtask.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, Subtask]),
    AuthModule,
  ],
  controllers: [TasksController],
  providers: [TasksService, AiService],
})
export class TasksModule {}
