import { Module, Global } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { WebsocketGateway } from './websocket.gateway';

@Global()
@Module({
  imports: [AuthModule],
  providers: [WebsocketGateway],
  exports: [WebsocketGateway],
})
export class WebsocketModule {}
