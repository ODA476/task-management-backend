import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTaskDto } from './dto/create-task.dto';
import { Task, TaskStatus } from './entities/task.entity';
import { User } from 'src/auth/entities/auth.entity';
import { GetTaskFilterDto } from './dto/get-tasks-filter.dto';
import { AiService } from 'src/ai/ai.service';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Subtask } from './entities/subtask.entity';

@Injectable()
export class TasksService {
  // Inject the TypeORM repository for the Task entity
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(Subtask)
    private readonly subtaskRepository: Repository<Subtask>,
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
    await this.subtaskRepository.delete({ task: { id: task.id } });

    // Transform string descriptions into structured entities bound to this task
    const subtasks = suggestedSteps.map((title) => {
      return this.subtaskRepository.create({
        title,
        isDone: false, // Explicit tracking state flag
        task,
      });
    });

    // Save subtasks to database and assign them to the task entity
    task.subtasks = await this.subtaskRepository.save(subtasks);
    return await this.taskRepository.save(task);
  }

  async toggleSubtask(subtaskId: string, user: User): Promise<Task> {
    // Find the subtask along with its parent task and the owner user to maintain strict isolation boundaries
    const subtask = await this.subtaskRepository.findOne({
      where: { id: subtaskId },
      relations: {
        task: {
          user: true,
        },
      },
    });

    if (!subtask || subtask.task.user.id !== user.id) {
      throw new NotFoundException(`Subtask with ID "${subtaskId}" not found.`);
    }

    // Toggle status flag cleanly
    subtask.isDone = !subtask.isDone;
    await this.subtaskRepository.save(subtask);

    return await this.findOne(subtask.task.id, user);
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
  async findAll(filterDto: GetTaskFilterDto, user: User) /*: Promise<Task[]>*/ {
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
    // return tasks;

    const totalPages = Math.ceil(total / limit);

    return {
      items: tasks,
      total,
      page,
      limit,
      totalPages,
    };
  }

  // Fetch a single task by ID; throw an HTTP 404 if it does not exist
  async findOne(id: string, user: User): Promise<Task> {
    const found = await this.taskRepository.findOneBy({ id, user: { id: user.id } });

    if (!found) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return found;
  }

  // Update a specific task
  async update(id: string, updateTaskDto: UpdateTaskDto, user: User): Promise<Task> {
    const task = await this.findOne(id, user);

    // Only overwrites properties sent in the frontend body input
    if (updateTaskDto.title !== undefined) task.title = updateTaskDto.title;
    if (updateTaskDto.description !== undefined) task.description = updateTaskDto.description;
    if (updateTaskDto.status !== undefined) task.status = updateTaskDto.status;

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
