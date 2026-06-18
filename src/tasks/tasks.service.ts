import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTaskDto } from './dto/create-task.dto';
import { Task, TaskStatus } from './entities/task.entity';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { User } from 'src/auth/entities/auth.entity';
import { UpdateTaskDescriptionDto } from './dto/update-task-description.dto';
import { GetTaskFilterDto } from './dto/get-tasks-filter.dto';
import { AiService } from 'src/ai/ai.service';

@Injectable()
export class TasksService {
  // Inject the TypeORM repository for the Task entity
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    private readonly aiService: AiService,
  ) {}

  // Teiggrt AI sub-steps action
  async addAiSubSteps(id: string, user: User): Promise<Task> {
    // 1. Fetch the task (ensuring this user owns it)
    const task = await this.findOne(id, user);

    if (!task) {
      throw new NotFoundException(`Task with ID "${id}" not found`);
    }

    // 2. Call the AI service passing the task details
    const suggestedSteps = await this.aiService.generateTaskBreakdown(task.title, task.description);

    // 3. Update the entity field and save it to PostgreSQL
    task.aiSubSteps = suggestedSteps;
    return await this.taskRepository.save(task);
  }

  // Write the create method
  async create(createTaskDto: CreateTaskDto, user: User): Promise<Omit<Task, 'user'>> {
    const { title, description } = createTaskDto;

    // Create a new task instance
    const task = this.taskRepository.create({
      title,
      description,
      status: TaskStatus.OPEN,
      user,
    });

    return await this.taskRepository.save(task);
  }

  // Fetch all records from the task table
  async findAll(filterDto: GetTaskFilterDto, user: User): Promise<{tasks: Task[], total: number}> {
    const { status, search, page = 1, limit = 10 } = filterDto;

    // 1. Create a query builder linked to the 'task' table alias
    const query = this.taskRepository.createQueryBuilder('task');

    // 2. ALWAYS filter down to the current user's items first
    query.where('task.userId = :userId', { userId: user.id });

    // 3. if the client provided a status filter, add an AND clause
    if (status) {
      query.andWhere('task.status = :status', { status });
    }

    // 4. If the client provided a search keyword, add a text matching check
    if (search) {
      query.andWhere(
        '(LOWER(task.title) LIKE LOWER(:search) OR LOWER(task.description) LIKE LOWER(:search))',
        { search: `%${search}%` }, // Using standard SQL wildcard matching
      );
    }

    const skip = (page - 1) * limit; // Math: page 2 with limit 10 skips the first 10 records

    query.skip(skip); // Skip the previous pages' item
    query.take(limit); // Fetch exactly the amount requested

    // 5. Run the generated SQL query and grab the matching records
    const [tasks, total] = await query.getManyAndCount();
    return { total, tasks };
  }

  // Fetch a single task by ID; throw an HTTP 404 if it does not exist
  async findOne(id: string, user: User): Promise<Task> {
    const found = await this.taskRepository.findOneBy({ id, user: { id: user.id } });

    if (!found) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return found;
  }

  // Update the status of a specific task
  async updateStatus(id: string, updateTaskStatusDto: UpdateTaskStatusDto, user: User): Promise<Task> {
    const task = await this.findOne(id, user); // Reuses findOne logic to auto-throw 404 if invalid
    task.status = updateTaskStatusDto.status;
    return await this.taskRepository.save(task);
  }

  // Update the description of a specific task
  async updateDescrption(id: string, updateTaskDescriptionDto: UpdateTaskDescriptionDto, user: User): Promise<Task> {
    const task = await this.findOne(id, user); // Reuses findOne logic to auto-throw 404 if invalid
    task.description = updateTaskDescriptionDto.description;
    return await this.taskRepository.save(task);
  }

  // Delete a task entirely from the database
  async remove(id: string, user: User): Promise<void> {
    const result = await this.taskRepository.delete({ id, user: { id: user.id } });

    // If affected rows count is 0, nothing was deleted
    if (result.affected === 0) {
      throw new NotFoundException(`Task with ID "${id}" not found`);
    }
  }
}
