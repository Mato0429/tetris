
class Config {}
//ステージ設定
Config.stage_x = 10;
Config.stage_y = 20;
Config.stage_minoColors = [
    '#ffff33', //O mino
    '#ff3366', //Z mino
    '#0066ff', //J mino
    '#66ff33', //S mino
    '#ff9900', //L mino
    '#cc66ff', //T mino
    '#66ffcc', //I mino
];
Config.stage_minos = [
    [[0, 0], [-1, 0], [-1, 1], [0, 1]], //O mino
    [[0, 0], [0, -1], [-1, -1], [1, 0]], //Z mino
    [[0, 0], [-1, 0], [-1, -1], [1, 0]], //J mino
    [[0, 0], [-1, 0], [0, -1], [1, -1]], //S mino
    [[0, 0], [-1, 0], [1, 0], [1, -1]], //L mino
    [[0, 0], [-1, 0], [1, 0], [0, -1]], //T mino
    [[-1, 0], [0, 0], [1, 0], [2, 0]], //I mino
];
Config.stage_minoFallingDelay = 30; //フレーム

//ゲーム設定
Config.game_frameDelay = 1000 / 30; //ms
Config.game_rotateMinoDelay = 5; //フレーム
Config.game_moveMinoDelay = 2; //フレーム
