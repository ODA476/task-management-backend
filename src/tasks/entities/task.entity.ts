import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Exclude } from 'class-transformer';
import { User } from 'src/auth/entities/auth.entity';
import { Subtask } from './subtask.entity';

// 1. We define an Enum to restrict the status to specific values
export enum TaskStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}

@Entity() // This tells TypeORM: "Make a table called 'task' for this class"
export class Task {
  @PrimaryGeneratedColumn('uuid') // Automatically generates a unique ID (UUID)
  id: string;

  @Column() // A standard text column
  title: string;

  @Column()
  description: string;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.OPEN, // New tasks are 'OPEN' by default
  })
  status: TaskStatus;

  // @Column('simple-array', { nullable: true })
  // aiSubSteps: string[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.tasks, { eager: false })
  @Exclude({ toPlainOnly: true }) // Prevents the user entity ownership data from showing in JSON
  user: User;

  @OneToMany(() => Subtask, (subtask) => subtask.task, { cascade: true, eager: true })
  subtasks: Subtask[];
}
