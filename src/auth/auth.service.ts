import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string, businessId: string): Promise<User> {
    const user = await this.usersService.findByEmail(email, businessId);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) throw new UnauthorizedException('Invalid credentials');
    return user;
  }

  private buildToken(user: User): { access_token: string } {
    const roles = (user.user_roles ?? []).map((ur) => ur.role?.name).filter(Boolean);
    const payload = {
      sub: user.id,
      email: user.email,
      business_id: user.business_id,
      roles,
    };
    return { access_token: this.jwtService.sign(payload) };
  }

  async login(loginDto: LoginDto): Promise<{ access_token: string; user: Omit<User, 'password'> }> {
    const user = await this.validateUser(loginDto.email, loginDto.password, loginDto.business_id);
    const token = this.buildToken(user);
    const { password: _pw, ...userWithoutPassword } = user as User & { password: string };
    return { ...token, user: userWithoutPassword as Omit<User, 'password'> };
  }

  async register(registerDto: RegisterDto): Promise<{ access_token: string; user: Omit<User, 'password'> }> {
    const existing = await this.usersService.findByEmail(registerDto.email, registerDto.business_id);
    if (existing) throw new ConflictException('User with this email already exists in this business');
    const user = await this.usersService.create(registerDto);
    const freshUser = await this.usersService.findByEmail(user.email, user.business_id) as User;
    const token = this.buildToken(freshUser);
    const { password: _pw, ...userWithoutPassword } = freshUser as User & { password: string };
    return { ...token, user: userWithoutPassword as Omit<User, 'password'> };
  }
}
