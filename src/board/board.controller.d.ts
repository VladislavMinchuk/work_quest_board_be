import { BoardService } from './board.service';
export declare class BoardController {
    private readonly boardService;
    constructor(boardService: BoardService);
    getBoard(): Promise<Record<string, import("./types/board.types").CellData>>;
    resetBoard(req: any): Promise<Record<string, import("./types/board.types").CellData>>;
}
