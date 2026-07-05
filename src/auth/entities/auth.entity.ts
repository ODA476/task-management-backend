import { Exclude } from "class-transformer";
import { Task } from "src/tasks/entities/task.entity";
import { Entity, PrimaryGeneratedColumn, Column, Unique, OneToMany, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity({ name: 'users' })
@Unique(['email'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  email: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  @Exclude({ toPlainOnly: true }) // Hides this field completely when converting to JSON
  password: string; // We mark this optional or string to safely strip it out during queries later

  @Column({ default: false })
  isConfirmed: boolean;

  @Column({ type: 'varchar', nullable: true })
  @Exclude({ toPlainOnly: true })
  confirmationToken: string | null;

  @Column({ type: 'varchar', nullable: true })
  @Exclude({ toPlainOnly: true })
  resetPasswordToken: string | null;

  @Column({ type: 'timestamp', nullable: true })
  @Exclude({ toPlainOnly: true })
  resetPasswordExpires: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @OneToMany(() => Task, (task) => task.user, { eager: false })
  tasks: Task[];
}
