import { Controller, Get, Post, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BoardService } from './board.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/board')
export class BoardController {
  constructor(private readonly boardService: BoardService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async getBoard() {
    return this.boardService.getFullBoard();
  }

  @Post('reset')
  @UseGuards(AuthGuard('jwt'))
  async resetBoard(@Req() req: any) {
    return this.boardService.resetBoard(req.user);
  }
  
  @Post('seed-default')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  async seedDefaultBoard(@Req() req: any) {
    // req.user заповнюється з Passport/JWT Strategy
    return await this.boardService.seedDefaultBoard(req.user);
  }
}