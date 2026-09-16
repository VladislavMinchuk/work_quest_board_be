import { Controller, Get, Post, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BoardService } from './board.service';

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
}