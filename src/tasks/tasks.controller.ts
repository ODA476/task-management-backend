import { Controller, Post, Body, Get, Param, Patch, Delete, HttpCode, HttpStatus, Query, UseGuards, ParseArrayPipe } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { User } from 'src/auth/entities/auth.entity';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { GetTaskFilterDto } from './dto/get-tasks-filter.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@ApiTags('Tasks')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Bearer token missing or completely invalid.' }) // Applied globally to the controller
@Controller('tasks') // This means all routes in this file start with /tasks
@UseGuards(AuthGuard())
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new task for the current logged-in user' })
  @ApiCreatedResponse({ description: 'The task records were successfully generated.' })
  create(@Body() createTaskDto: CreateTaskDto, @GetUser() user: User) {
    return this.tasksService.create(createTaskDto, user);
  }

  @Get(':id') // Notice the path parameter ':id' instead of a query parameter
  @ApiOperation({ summary: 'Fetch a specific owned task by its unique UUID' })
  @ApiOkResponse({ description: 'Task matching the provided ID found and returned.' })
  @ApiNotFoundResponse({ description: 'Task ID does not exist or user does not own it.' })
  getTaskById(@Param('id') id: string, @GetUser() user: User) {
    return this.tasksService.findOne(id, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update specific fields (title, description, or status) of an owned task' })
  @ApiOkResponse({ description: 'Task updated successfully.' })
  @ApiNotFoundResponse({ description: 'Task ID does not exist or user does not own it.' })
  update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto, 
    @GetUser() user: User,
  ) {
    return this.tasksService.update(id, updateTaskDto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Permanently remove a task from the user profile database' })
  @ApiResponse({ status: 242, description: 'Task successfully removed. No body content returned.' })
  @ApiNotFoundResponse({ description: 'Task ID does not exist or user does not own it.' })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @GetUser() user: User) {
    return this.tasksService.remove(id, user);
  }

  @Get()
  @ApiOperation({ summary: 'Fetch tasks with optional searching and filtering' })
  findAll(@Query() filterDto: GetTaskFilterDto, @GetUser() user: User) {
    return this.tasksService.findAll(filterDto, user);
  }

  @Post(':id/ai-suggest')
  @ApiOperation({ summary: 'Generate automated smart execution sub-steps using AI' })
  @ApiOkResponse({ description: 'AI sub-steps generated and saved successfully' })
  @ApiNotFoundResponse({ description: 'Task not found' })
  generateAiSteps(@Param('id') id: string, @GetUser() user: User) {
    return this.tasksService.addAiSubSteps(id, user);
  }

  @Patch('/subtasks/:id/toggle')
  @ApiOperation({ summary: 'Toggle the completion check status of a specific subtask' })
  @ApiOkResponse({ description: 'Subtask execution state updated successfully' })
  async toggleSubtaskCheck(
    @Param('id') id: string,
    @GetUser() user: User) {
    return this.tasksService.toggleSubtask(id, user);
  }
}
