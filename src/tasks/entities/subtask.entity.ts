import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Task } from './task.entity';
import { Exclude } from 'class-transformer';

@Entity({ name: 'subtasks' })
export class Subtask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ default: false })
  isDone: boolean;

  // Many subtasks belong to one single task
  @ManyToOne(() => Task, (task) => task.subtasks, { onDelete: 'CASCADE' })
  @Exclude({ toPlainOnly: true }) // Exclude parent task object to avoid infinite JSON loops!
  task: Task;
}
