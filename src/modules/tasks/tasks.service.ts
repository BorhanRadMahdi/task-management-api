import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Task } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { FilterTaskDto } from './dto/filter-task.dto';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
  ) { }

  async create(createTaskDto: CreateTaskDto, userId: string): Promise<Task> {
    const task = this.taskRepository.create({
      ...createTaskDto,
      userId,
    });

    return await this.taskRepository.save(task);
  }

  async findAll(
    userId: string | undefined,
    userRole: string,
    filters?: FilterTaskDto,
  ): Promise<Task[]> {
    const query: any = {};

    // اگه user عادی باشه، فقط تسک‌های خودش رو ببینه
    if (userRole !== UserRole.ADMIN && userId) {
      query.userId = userId;
    }

    // فیلترها
    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.priority) {
      query.priority = filters.priority;
    }

    // جستجو در عنوان
    if (filters?.search) {
      return await this.taskRepository.find({
        where: {
          ...query,
          title: Like(`%${filters.search}%`),
        },
        relations: ['user'],
        order: { createdAt: 'DESC' },
      });
    }

    return await this.taskRepository.find({
      where: query,
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string, userRole: string): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // چک کردن مالکیت (اگه admin نباشه)
    if (userRole !== UserRole.ADMIN && task.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return task;
  }

  async update(
    id: string,
    updateTaskDto: UpdateTaskDto,
    userId: string,
    userRole: string,
  ): Promise<Task> {
    const task = await this.findOne(id, userId, userRole);

    Object.assign(task, updateTaskDto);
    return await this.taskRepository.save(task);
  }

  async remove(id: string, userId: string, userRole: string): Promise<void> {
    const task = await this.findOne(id, userId, userRole);
    await this.taskRepository.remove(task);
  }

  // آمار برای dashboard
  async getStats(userId: string, userRole: string) {
    const query: any = {};

    if (userRole !== UserRole.ADMIN) {
      query.userId = userId;
    }

    const [total, todo, inProgress, done] = await Promise.all([
      this.taskRepository.count({ where: query }),
      this.taskRepository.count({ where: { ...query, status: 'todo' } }),
      this.taskRepository.count({ where: { ...query, status: 'in_progress' } }),
      this.taskRepository.count({ where: { ...query, status: 'done' } }),
    ]);

    return {
      total,
      todo,
      inProgress,
      done,
    };
  }
}
