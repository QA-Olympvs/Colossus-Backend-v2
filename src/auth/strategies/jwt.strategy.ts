import { Injectable, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { AuthService } from '../auth.service';

export interface JwtPayload {
  sub: string;
  email: string;
  branch_id?: string;
  customer_id?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly authService: AuthService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    const cacheKey = `jwt_profile:${payload.sub}`;
    const cached = await this.cacheManager.get<{
      roles: string[];
      permissions: string[];
    }>(cacheKey);

    if (cached) {
      return {
        id: payload.sub,
        email: payload.email,
        branch_id: payload.branch_id,
        customer_id: payload.customer_id,
        roles: cached.roles,
        permissions: cached.permissions,
      };
    }

    const profile = await this.authService.getProfile(payload.sub);

    await this.cacheManager.set(
      cacheKey,
      {
        roles: profile.roles,
        permissions: profile.permissions,
      },
      300000,
    );

    return {
      id: payload.sub,
      email: payload.email,
      branch_id: payload.branch_id,
      customer_id: payload.customer_id,
      roles: profile.roles,
      permissions: profile.permissions,
    };
  }
}
