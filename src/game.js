

class Button{
    constructor(buttonElement){
        buttonElement.ontouchstart = () => this.pressed = true;
        buttonElement.ontouchend = () => this.pressed = false;
    }
}



class ControllingMino{
    constructor(minoID, stage, render){
        this.blocks = Config.stage_minos[minoID];
        this.id = minoID;
        this.x = Math.floor(Config.stage_x / 2) - 1;
        this.y = -1;

        this.stage = stage;
        this.render = render;
    }

    isWrongPos(x, y){
        if (0 > x || Config.stage_x <= x || Config.stage_y <= y) return true;
        else if (0 <= y) return this.stage.get_tile(x, y) != -1;
    }

    //操作ミノの座標を回転させたものに変更する
    rotate(){
        if (this.id == 0) return; //O mino(ID0)は回転無効

        for (let i = 0; i < 4; i++){
            let tempX = this.blocks[i][0] * -1;
            let tempY = this.blocks[i][1];
            this.blocks[i][0] = tempY;
            this.blocks[i][1] = tempX;
        }
    }


    check_canRotate(){
        let blockWrongPos = false;
        for (let i = 0; i < 4; i++){
            let tempY = this.blocks[i][0] * -1;
            let tempX = this.blocks[i][1];
            if (this.isWrongPos(tempX + this.x, tempY + this.y)){
                blockWrongPos = true
            }
        }

        return !blockWrongPos
    }


    check_canMove(x, y){
        let blockWrongPos = false;
        for (let i = 0; i < 4; i++){
            let tempX = this.blocks[i][0] + x;
            let tempY = this.blocks[i][1] + y;
            if (this.isWrongPos(tempX + this.x, tempY + this.y)){
                blockWrongPos = true
            }
        }

        return !blockWrongPos
    }


    place(){
        this.blocks.forEach((block) => {
            this.stage.place_tile(block[0] + this.x, block[1] + this.y, this.id)
        })
    }


    draw(){
        this.blocks.forEach(block => {
            this.render.draw_tile(block[0] + this.x, block[1] + this.y, Config.stage_minoColors[this.id]);
        });
    }
}



class minoQueue{
    constructor(){
        this.reset();
    }


    randint(a, b){
        return Math.floor(Math.random() * (b + 1 - a)) + a;
    }


    reset(){
        this.minoQueue = [...Array(Config.stage_minos.length).keys()].sort((a, b) => this.randint(-1, 1));
    }


    dequeue(){
        if (this.minoQueue.length == 0){
            this.reset();
        }

        return this.minoQueue.pop();
    }
}



class Stage{
    constructor(render){
        this.stage = [];
        for (let i = 0; i < Config.stage_y; i++) this.stage.push(Array(Config.stage_x).fill(-1));

        this.render = render
    }


    get_tile(x, y){
        return this.stage[y][x];
    }


    place_tile(x, y, value){
        this.stage[y][x] = value;
    }


    indent_lines(){
        do{
            let line_index = this.stage.findIndex((line) => line.every((tile) => tile != -1));
            if (line_index == -1) break;
            this.indent_line(line_index);
        }
        while (true);
    }


    indent_line(line){
        this.stage = [Array(Config.stage_x).fill(-1)].concat(this.stage.filter((e, index) => index != line));
    }


    draw(){
        for (let y = 0; y < Config.stage_y; y++){
            for (let x = 0; x < Config.stage_x; x++){
                let tile = this.get_tile(x, y);
                if (tile != -1){
                    this.render.draw_tile(x, y, Config.stage_minoColors[tile]);
                }
            }
        }
    }
}



class Render{
    constructor(){
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
    }


    draw_screen(){
        this.screen_ctx.drawImage(this.vscreen, 0, 0, this.vscreen.width, this.vscreen.height);
    }


    draw_background(){
        this.vscreen_ctx.fillStyle = '#000000';
        this.vscreen_ctx.fillRect(0, 0, this.vscreen.width, this.vscreen.height);
    }


    draw_tile(x, y, color){
        this.vscreen_ctx.fillStyle = color;
        let sx = x * Config.stage_minoSize;
        let sy = y * Config.stage_minoSize;
        this.vscreen_ctx.fillRect(sx, sy, Config.stage_minoSize, Config.stage_minoSize);
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

        //レンダーを初期化
        this.render = new Render();

        this.initialize_game();
    }


    initialize_game(){
        //ゲームを初期化
        this.key = {};
        this.frameCount = 0;
        this.rotateMinoDelay = 0;
        this.moveMinoDelay = 0;

        //ステージを初期化
        this.stage = new Stage(this.render);

        //ミノキューを初期化
        this.minoQueue = new minoQueue();

        this.reset_mino();
    }


    reset_minoQueue(){
        this.minoQueue = [...Array(Config.stage_minos.length).keys()].sort((a, b) => this.randint(-1, 1));
    }


    reset_mino(){
        this.mino = new ControllingMino(this.minoQueue.dequeue(), this.stage, this.render);
        this.minoFallingDelay = this.frameCount + Config.stage_minoFallingDelay;
    }


    update_input(){
        this.key_left = this.key['ArrowLeft'] || this.ctrl_left.pressed;
        this.key_right = this.key['ArrowRight'] || this.ctrl_right.pressed;
        this.key_up = this.key['ArrowUp'] || this.ctrl_up.pressed;
        this.key_down = this.key['ArrowDown']|| this.ctrl_down.pressed;
    }


    tick(){
        //キー入力情報を更新
        this.update_input();

        //背景を描画
        this.render.draw_background();

        /*
        if (Boolean(this.stage[this.deadzone[0]][this.deadzone[1]])){
            //ブロックがこれ以上設置できないのでリセット
            this.initializeGame();
            return;
        }
        */

        //ミノ操作
        this.control();

        //操作ミノを描画
        this.mino.draw();

        //ミノアシストを描画
        //this.draw_assistMino();

        //ステージの設置済みミノを描画
        this.stage.draw();

        //ゲーム画面を表示
        this.render.draw_screen();

        this.frameCount += 1;
    }


    control(){
        //ミノを回転する
        if (this.key_up){
            if (this.rotateMinoDelay < this.frameCount){
                if (this.mino.check_canRotate()) this.mino.rotate();
                this.rotateMinoDelay = this.frameCount + Config.game_rotateMinoDelay;
            }
        }

        //ミノを移動する
        if (this.moveMinoDelay < this.frameCount){
            if (this.key_left && this.mino.check_canMove(-1, 0)){
                this.mino.x -= 1;
            }
            if (this.key_right && this.mino.check_canMove(1, 0)){
                this.mino.x += 1;
            }
            if (this.key_down && this.mino.check_canMove(0, 1)){
                this.mino.y += 1;
            }
            else if (this.minoFallingDelay < this.frameCount){
                if (this.mino.check_canMove(0, 1)){
                    //ミノを自由落下させる
                    this.mino.y += 1;
                    this.minoFallingDelay = this.frameCount + Config.stage_minoFallingDelay;
                }
                else{
                    //ミノを設置する
                    this.mino.place();
                    this.stage.indent_lines(19);
                    this.reset_mino();
                }
            }
            this.moveMinoDelay = this.frameCount + Config.game_moveMinoDelay;
        }
    }
}



document.addEventListener('DOMContentLoaded', () => {
    alert('スマホでプレイする際は画面を横向きにしてサイトをリロードしてください');
    const game = new Game();
    setInterval(game.tick.bind(game), Config.game_frameDelay);
})
