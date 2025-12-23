import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { FilterTaskDto } from './dto/filter-task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('tasks')
@Controller('tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class TasksController {
  constructor(private readonly tasksService: TasksService) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({ status: 201, description: 'Task created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @Body() createTaskDto: CreateTaskDto,
    @CurrentUser() user: any,
  ) {
    return await this.tasksService.create(createTaskDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tasks for current user' })
  @ApiQuery({ name: 'status', required: false, enum: ['todo', 'in_progress', 'done'] })
  @ApiQuery({ name: 'priority', required: false, enum: ['low', 'medium', 'high'] })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Tasks retrieved successfully' })
  async findAll(
    @CurrentUser() user: any,
    @Query() filters: FilterTaskDto,
  ) {
    return await this.tasksService.findAll(user.id, user.role, filters);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get task statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStats(@CurrentUser() user: any) {
    return await this.tasksService.getStats(user.id, user.role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific task' })
  @ApiResponse({ status: 200, description: 'Task found' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return await this.tasksService.findOne(id, user.id, user.role);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a task' })
  @ApiResponse({ status: 200, description: 'Task updated successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @CurrentUser() user: any,
  ) {
    return await this.tasksService.update(id, updateTaskDto, user.id, user.role);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a task' })
  @ApiResponse({ status: 204, description: 'Task deleted successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return await this.tasksService.remove(id, user.id, user.role);
  }

  @Get('admin/all')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all tasks (Admin only)' })
  @ApiResponse({ status: 200, description: 'All tasks retrieved' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async findAllForAdmin(@Query() filters: FilterTaskDto) {
    return await this.tasksService.findAll(undefined, UserRole.ADMIN, filters);
  }
}
