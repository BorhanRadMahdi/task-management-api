import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) { }

  async register(registerDto: RegisterDto) {
    const user = await this.usersService.create({
      ...registerDto,
      role: UserRole.USER,
    });

    const { password, ...result } = user;
    const token = await this.generateToken(user.id, user.email, user.role);

    return {
      user: result,
      access_token: token,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User is inactive');
    }

    const token = await this.generateToken(user.id, user.email, user.role);
    const { password, ...result } = user;

    return {
      user: result,
      access_token: token,
    };
  }

  async validateUser(userId: string) {
    return await this.usersService.findOne(userId);
  }

  private async generateToken(userId: string, email: string, role: UserRole): Promise<string> {
    const payload = {
      sub: userId,
      email,
      role,
    };

    return await this.jwtService.signAsync(payload);
  }
}