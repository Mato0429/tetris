

class Button{
    constructor(buttonElement){
        buttonElement.ontouchstart = () => this.pressed = true;
        buttonElement.ontouchend = () => this.pressed = false;
    }
}


class Game{
    constructor(){
        //キー入力を取得するイベントを作成
        document.onkeydown = (e) => {
            this.key[e.key] = true;
        }

        document.onkeyup = (e) => {
            this.key[e.key] = false;
        }

        //ボタン要素を取得、入力を取得するイベントを作成
        this.ctrl_left = new Button(document.querySelector('#ctrl_left'));
        this.ctrl_right = new Button(document.querySelector('#ctrl_right'));
        this.ctrl_up = new Button(document.querySelector('#ctrl_up'));
        this.ctrl_down = new Button(document.querySelector('#ctrl_down'));

        //キャンバス要素を取得
        this.screen = document.querySelector('#screen');
        this.screen_ctx= this.screen.getContext('2d');
        this.vscreen = document.querySelector('#vscreen');
        this.vscreen_ctx = this.vscreen.getContext('2d');

        //スクリーンの設定
        let screen_height = window.innerHeight;
        let screen_width = screen_height / Config.stage_y * Config.stage_x;
        Config.stage_minoSize = screen_height / Config.stage_y;

        this.screen.width = screen_width;
        this.screen.height = screen_height;
        this.vscreen.width = screen_width;
        this.vscreen.height = screen_height;

        this.minos = [
            [[0, 0], [-1, 0], [-1, 1], [0, 1]], //O mino
            [[0, 0], [0, -1], [-1, -1], [1, 0]], //Z mino
            [[0, 0], [-1, 0], [-1, -1], [1, 0]], //J mino
            [[0, 0], [-1, 0], [0, -1], [1, -1]], //S mino
            [[0, 0], [-1, 0], [1, 0], [1, -1]], //L mino
            [[0, 0], [-1, 0], [1, 0], [0, -1]], //T mino
            [[0, 0], [0, -1], [0, -2], [0, -3]], //I mino
        ];
        this.minoQueue = []
        this.deadzone = [Math.floor(Config.stage_x / 2), 0]

        this.initializeGame();
    }


    randint(a, b){
        return Math.floor(Math.random() * (b + 1 - a)) + a;
    }


    initializeGame(){
        //ゲームを初期化
        this.key = {};
        this.frameCount = 0;
        this.rotateMinoDelay = 0;
        this.moveMinoDelay = 0;

        //ステージを初期化
        this.stage = [];
        for (let i = 0; i < Config.stage_x; i++) this.stage.push(Array(Config.stage_y).fill(false));

        this.resetMino();
    }


    tick(){
        //キー入力情報を更新
        this.update_input();

        //背景を描画
        this.draw_background();

        if (this.stage[this.deadzone[0]][this.deadzone[1]]){
            //ブロックがこれ以上設置できないのでリセット
            this.initializeGame();
            return;
        }

        //ミノ操作
        this.controlMino();

        //操作ミノを描画
        this.drawMino();

        //設置済みミノを描画
        this.draw_tiles();

        //ゲーム画面を表示
        this.draw_screen();

        this.frameCount += 1;
    }


    update_input(){
        this.key_left = this.key['ArrowLeft'] || this.ctrl_left.pressed;
        this.key_right = this.key['ArrowRight'] || this.ctrl_right.pressed;
        this.key_up = this.key['ArrowUp'] || this.ctrl_up.pressed;
        this.key_down = this.key['ArrowDown']|| this.ctrl_down.pressed;
    }


    resetMinoQueue(){
        this.minoQueue = [...Array(this.minos.length).keys()].sort((a, b) => this.randint(-1, 1));
    }


    resetMino(){
        //ミノを初期化
        if (this.minoQueue.length == 0){
            this.resetMinoQueue();
        }
        this.minoID = this.minoQueue.pop();
        this.minoX = Math.floor(Config.stage_x / 2);
        this.minoY = 0;
        this.controlingMino = this.minos[this.minoID];
        this.minoFallingDelay = this.frameCount + Config.stage_minoFallingDelay;
    }


    drawMino(){
        this.controlingMino.forEach((p) => {
            this.draw_tile(this.minoX + p[0], this.minoY + p[1]);
        })
    }


    rotateMino(){
        if (this.minoID == 0) return; //O mino(ID0)は回転無効

        for (let i = 0; i < 4; i++){
            let tempX = this.controlingMino[i][0] * -1;
            let tempY = this.controlingMino[i][1];
            this.controlingMino[i][0] = tempY;
            this.controlingMino[i][1] = tempX;
        }
    }


    checkMinoCanRotate(){
        for (let i = 0; i < 4; i++){
            let tempX = this.controlingMino[i][0] * -1;
            let tempY = this.controlingMino[i][1];
            let absX = tempY + this.minoX;
            let absY = tempX + this.minoY;
            if (absX < 0 || Config.stage_x <= absX || Config.stage_y <= absY + 1){
                return false;
            }
            else if (this.stage[absX][absY]){
                return false;
            }
        }
        return true;
    }


    checkMinoCanMove(xOffset){
        for (let i = 0; i < 4; i++){
            let absX = this.controlingMino[i][0] + this.minoX + xOffset;
            let absY = this.controlingMino[i][1] + this.minoY;
            if (absX < 0 || Config.stage_x <= absX){
                return false;
            }
            else if (this.stage[absX][absY]){
                return false;
            }
        }
        return true;
    }


    checkMinoLanding(){
        for (let i = 0; i < 4; i++){
            let absX = this.controlingMino[i][0] + this.minoX;
            let absY = this.controlingMino[i][1] + this.minoY;
            if (this.stage[absX][absY + 1] || Config.stage_y <= absY + 1){
                return true;
            }
        }
        return false;
    }


    placeMino(){
        for (let i = 0; i < 4; i++){
            let absX = this.controlingMino[i][0] + this.minoX;
            let absY = this.controlingMino[i][1] + this.minoY;
            this.stage[absX][absY] = true;
        }
    }


    indentLines(){
        while (true){
            let matrix = this.stage[0].map((_, y) => this.stage.map((arr) => arr[y]));
            let line = matrix.findIndex((arrX) => arrX.every((value) => Boolean(value)));
            if (line == -1) {
                break;
            }
            else{
                this.indentLine(line);
            }
        }
    }


    indentLine(line){
        this.stage = this.stage.map((arrY) => [false].concat(arrY.filter((value, index) => index != line)));
    }


    controlMino(){
        //ミノを回転する
        if (this.key_up){
            if (this.rotateMinoDelay < this.frameCount){
                if (this.checkMinoCanRotate()){
                    this.rotateMino();
                }
                this.rotateMinoDelay = this.frameCount + Config.game_rotateMinoDelay;
            }
        }

        //ミノを移動する
        if (this.moveMinoDelay < this.frameCount){
            if (this.key_left){
                if (this.checkMinoCanMove(-1)) this.minoX -= 1;
            }
            if (this.key_right){
                if (this.checkMinoCanMove(1)) this.minoX += 1;
            }
            if (this.key_down && !this.checkMinoLanding()){
                this.minoY += 1;
            }
            else if (this.minoFallingDelay < this.frameCount){
                if (this.checkMinoLanding()){
                    this.placeMino();
                    this.indentLines();
                    this.resetMino();
                }
                else{
                    //ミノを自由落下させる
                    this.minoY += 1;
                    this.minoFallingDelay = this.frameCount + Config.stage_minoFallingDelay;
                }
            }
            this.moveMinoDelay = this.frameCount + Config.game_moveMinoDelay;
        }
    }


    draw_screen(){
        this.screen_ctx.drawImage(this.vscreen, 0, 0, this.vscreen.width, this.vscreen.height);
    }


    draw_background(){
        this.vscreen_ctx.fillStyle = '#000000';
        this.vscreen_ctx.fillRect(0, 0, this.vscreen.width, this.vscreen.height);
    }


    draw_tiles(){
        for (let y = 0; y < Config.stage_y; y++){
            for (let x = 0; x < Config.stage_x; x++){
                if (this.stage[x][y]){
                    this.draw_tile(x, y);
                }
            }
        }
    }


    draw_tile(x, y){
        this.vscreen_ctx.fillStyle = Config.stage_minoColor;
        let sx = x * Config.stage_minoSize;
        let sy = y * Config.stage_minoSize;
        this.vscreen_ctx.fillRect(sx, sy, Config.stage_minoSize, Config.stage_minoSize);
    }
}



document.addEventListener('DOMContentLoaded', () => {
    alert('スマホでプレイする際は画面を横向きにしてサイトをリロードしてください');
    const game = new Game();
    setInterval(game.tick.bind(game), Config.game_frameDelay);
})
