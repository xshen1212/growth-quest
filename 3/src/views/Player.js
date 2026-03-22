
(function(){

var ns = Q.use("fish"), game = ns.game;

var Player = ns.Player = function(props)
{
	this.id = null;
	this.coin = 0;
	this.shotScore = 0; // 开炮分数
	this.numCapturedFishes = 0;
	
	this.cannon = null;
	this.cannonMinus = null;
	this.cannonPlus = null;
	this.coinNum = null;
	this.shotScoreNum = null; // 开炮分数显示
	
	props = props || {};
	Q.merge(this, props, true);
	
	this.init();
};

Player.prototype.init = function()
{
	var me = this, power = 1;
	
	this.cannon = new ns.Cannon(ns.R.cannonTypes[power]);
	this.cannon.id = "cannon";
	this.cannon.x = game.bottom.x + 425;
	this.cannon.y = game.bottom.y + 60;
	this.cannon.y = game.height - 10;
	
	this.cannonMinus = new Q.Button(ns.R.cannonMinus);
	this.cannonMinus.id = "cannonMinus";
	this.cannonMinus.x = game.bottom.x + 340;
	this.cannonMinus.y = game.bottom.y + 36;
	this.cannonMinus.onEvent = function(e)
	{
		if(e.type == game.events[1])
		{
			me.cannon.setPower(-1, true);
		}
	};
	
	this.cannonPlus = new Q.Button(ns.R.cannonPlus);
	this.cannonPlus.id = "cannonPlus";
	this.cannonPlus.x = this.cannonMinus.x + 140;
	this.cannonPlus.y = this.cannonMinus.y;
	this.cannonPlus.onEvent = function(e)
	{
		if(e.type == game.events[1])
		{
			me.cannon.setPower(1, true);
		}
	};
	
	this.coinNum = new ns.Num({id:"coinNum", src:ns.R.numBlack, max:6, gap:3, autoAddZero:true});
	this.coinNum.x = game.bottom.x + 20;
	this.coinNum.y = game.bottom.y + 44;
	this.updateCoin(this.coin);
	
	// 添加开炮分数显示
	this.shotScoreNum = new ns.Num({id:"shotScoreNum", src:ns.R.numBlack, max:6, gap:3, autoAddZero:true});
	this.shotScoreNum.x = game.bottom.x + 620;
	this.shotScoreNum.y = game.bottom.y + 44;
	// 从本地存储读取开炮分数，默认为0
	let gameData = JSON.parse(localStorage.getItem('gq_game_data') || '{}');
	if(gameData.shotScore) {
		this.shotScore = gameData.shotScore;
	} else {
		this.shotScore = 0;
	}
	this.updateShotScore(this.shotScore);
	
	// 添加开炮分数标签
	this.shotScoreLabel = document.createElement('div');
	this.shotScoreLabel.style.cssText = 'position:absolute; left:' + (game.bottom.x + 540) + 'px; top:' + (game.bottom.y + 46) + 'px; color:#fff; font-size:12px; font-weight:bold; text-shadow:1px 1px 1px #000;';
	this.shotScoreLabel.textContent = '开炮分数:';
	game.container.appendChild(this.shotScoreLabel);
	
	game.stage.addChild(this.cannon, this.cannonMinus, this.cannonPlus, this.coinNum, this.shotScoreNum);
};

Player.prototype.fire = function(targetPoint)
{	
	var cannon = this.cannon, power = cannon.power, speed = 5;
	if(this.shotScore < power) return;
	
	//cannon fire
	var dir = ns.Utils.calcDirection(cannon, targetPoint), degree = dir.degree;
	if(degree == -90) degree = 0;
	else if(degree < 0 && degree > -90) degree = -degree;
	else if(degree >= 180 && degree <= 270) degree = 180 - degree;
	cannon.fire(degree);
	
	//fire a bullet
	var sin = Math.sin(degree*Q.DEG_TO_RAD), cos = Math.cos(degree*Q.DEG_TO_RAD);
	var bullet = new ns.Bullet(ns.R.bullets[power - 1]);
	bullet.x = cannon.x + (cannon.regY + 20) * sin;
	bullet.y = cannon.y - (cannon.regY + 20) * cos;
	bullet.rotation = degree;
	bullet.power = power;
	bullet.speedX = speed * sin;
	bullet.speedY = speed * cos;
	game.stage.addChild(bullet);
	
	//deduct shot score
	this.updateShotScore(-power, true);
}

Player.prototype.captureFish = function(fish)
{
	this.updateCoin(fish.coin, true);
	this.numCapturedFishes++;
};

Player.prototype.updateCoin = function(coin, increase)
{
	if(increase) this.coin += coin;
	else this.coin = coin;
	if(this.coin > 999999) this.coin = 999999;
	this.coinNum.setValue(this.coin);
};

Player.prototype.updateShotScore = function(score, increase)
{
	var me = this;
	if(increase) this.shotScore += score;
	else this.shotScore = score;
	if(this.shotScore > 999999) this.shotScore = 999999;
	if(this.shotScore < 0) this.shotScore = 0;
	this.shotScoreNum.setValue(this.shotScore);
	
	// 更新本地存储
	let gameData = JSON.parse(localStorage.getItem('gq_game_data') || '{}');
	gameData.shotScore = this.shotScore;
	localStorage.setItem('gq_game_data', JSON.stringify(gameData));
	
	// 当开炮分数归0时，延迟5秒后将金币转换到商店
	if(this.shotScore === 0 && this.coin > 0 && !this.convertTimer) {
		var coinsToConvert = this.coin;
		this.convertTimer = setTimeout(function() {
			// 发送消息到主页
			if(window.parent !== window) {
				window.parent.postMessage({
					type: 'convertCoins',
					coins: coinsToConvert
				}, '*');
			}
			// 清空金币
			me.coin = 0;
			me.coinNum.setValue(me.coin);
			me.convertTimer = null;
		}, 5000);
	}
};

})();