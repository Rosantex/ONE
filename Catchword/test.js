$(function() {

    var blob = new Blob(["self.onmessage = function(e) { postMessage(e.data); }"], {
        type: 'application/javascript'
    });
    var worker = new Worker(URL.createObjectURL(blob));

    var DB = $.ajax({
        url: 'https://raw.githubusercontent.com/Legacy-K/common/master/En.txt',
        async: false
    }).responseText;

    var ROBOT_START_DELAY = [4000, 3000, 2000, 1000, 500];

    var $stage = $('#stage'),
        $start = $('#start'),
        $title = $('#title'),
        $display = $('#display'),
        $mission = $('#mission'),
        $chain = $('#chain'),
        $timer = $('#timer'),
        $talk = $('#talk');

    var data = {
        title: '', round: 0,
        player: [], count: 0,
        turn: null, lastTurn: null,
        word: '', char: '',
        mission: '', chain: 0,
        score: {}
    };

    function random(x, y) {
        return y ? x + Math.floor(Math.random() * (y - x + 1)) : random(0, x);
    }

    var images = ['img1', 'img2', 'img3', 'img4'].shuffle();

    // Class: Player
    function Player(name) {
        this.name = name;
        this.idx = data.count;
        this.id = '#' + name;
        data.player[data.count++] = this;
        data.score[name] = 0;

        var $player = $('<div id="' + name + '" />').text(name).addClass('player ' + images.pop()),
            $score = $('<div class="score" id="' + name + 'score">0</div>');

        $player.append($score).appendTo($stage);
    };

    // Class: User
    User.__extends(Player);

    function User(name) {
        Player.call(this, name);
    }

    // Class: Robot
    Robot.__extends(Player);

    function Robot(name, level) {
        Player.call(this, name);
        this.level = level;
        this.delay = ROBOT_START_DELAY[level];
    }

    Robot.prototype.go = function() {
        setTimeout(setWord, this.delay, data.word = getWord(data.char), 1);
    };

    var robot1 = new Robot('Alpha', 2),
        robot2 = new Robot('Beta', 1),
        robot3 = new Robot('Gamma', 2),
        user = new User('You');

    function getWord(chr, len) {
        var res = DB.match(new RegExp('\\b' + chr + '.' + (len ? '{' + (len - chr.length) + '}' : '+') + '\\b', 'g'));
        return res.random();
    }    

    function setTitle() {
        if (data.lastTurn)
            setScore('new-game');
            
        data.round = 0;
        $title.text(data.title = getWord(String.fromCharCode(97 + random(25)), random(3, 4)));
    }

    function setRound() {
        if (data.round >= data.title.length)
            return gameEnd();

        data.turn = data.turn || data.player[0];
        $(data.turn.id).removeClass('turn die');
        $display.text(data.char = data.title[data.round++]);
        $chain.text(data.chain = 0);
        setMission();
        setTimeout(turnStart, 1000);
    }

    function setMission() {
        if (data.word.indexOf(data.mission) !== -1)
            $mission.text(data.mission = String.fromCharCode(97 + random(25)));
    }

    function setScore(c) {
        var s = data.score[data.turn.name],
            sc = 0,
            $sc = $(data.turn.id + 'score');

        switch (c) {
            case 'new-game':
                $.each(data.score, function(player, score) {
                    data.score[player] = 0
                });
                $('.score').text(0);
                return;
            case 'time-over':
                sc = Math.floor(s * -0.3);
                break;
            case 'turn-end':
                var w = data.word,
                    m = w.split(data.mission).length - 1;
                sc += w.length * random(10, 20);

                while (--m > 0)
                    sc += random(10, 99);

                break;
        }

        $(data.turn.id).append($('<div>')
            .css($sc.position())
            .text((c !== 'time-over' ? '+' : '') + sc)
            .addClass('delta'));

        $({ val: s }).animate({ val: s + sc }, {
            duration: 700,
            step: function step() {
                $sc.text(Math.floor(this.val));
            },
            complete: function complete() {
                $sc.text(Math.floor(this.val));
            }
        });

        data.score[data.turn.name] = s + sc;
    }
    
    function setWord(wd, idx) {
        if (idx === 1) {
            turnEnd();
            setQuake(wd.length);
        }

        if (idx < wd.length) {
            var ch = wd[idx++];
            $display.append(ch === data.mission ? '<label style="color: #66FF66;">' + ch + '</label>' : ch);
            setTimeout(setWord, (800 - 7 * data.chain) / data.word.length, wd, idx);
        } else {
            setTimeout(function() {
                setMission();
                $display.text(data.char = wd.slice(-1));

                setTimeout(turnStart, 500 - 5 * data.chain);
            }, 400 - 4 * data.chain);
        }
    }
    
    function setQuake(pow) {
        if (pow < 1)
            return;

        $stage.css('padding-top', 2 * pow);
        setTimeout(function() {
            $stage.css('padding-top', 0);
            setTimeout(setQuake, 50, pow * 0.7);
        }, 50);
    }
    
    function setRank() {
        var i = 0, pv = -1, 
            len = data.count,
            rank = {},   
            res = [],
            idx, p;
        
        res = Object._entries(data.score).sort(function(x, y) {
            return y[1] - x[1];
        });
    
        for (; i < len; i++) {
            rank[res[i][0]] = res[i][1] === pv ? rank[res[i - 1][0]] : i;
            pv = res[i][1];
        }
    
        for (idx in data.player) {
            p = data.player[idx];
            $(p.id).css('top', -10 * (data.count - rank[p.name]));
        }
    }

    function timeStart() {
        $timer.width('').animate({
            width: 0
        }, 10000 - 100 * data.chain, timeEnd);
    }

    function timeEnd() {
        $(data.turn.id).addClass('die');
        setScore('time-over');
        setTimeout(setRound, 2000);
    }

    function turnStart() {
        $('.delta').remove();
        if ($(data.turn.id).hasClass('die') || data.lastTurn && $(data.lastTurn.id).hasClass('die'))
            return;

        $(data.turn.id).addClass('turn');
        timeStart();
        data.turn instanceof Robot ? data.turn.go() : $talk.focus();
    }

    function turnEnd() {
        $timer.stop(true);
        $chain.text(++data.chain);
        setScore('turn-end');
        $(data.turn.id).removeClass('turn');
        data.lastTurn = data.turn;
        data.turn = data.player[(data.turn.idx + 1) % data.count];
    }

    function gameStart() {
        $start.hide();
        setTitle();
        setRound();
    }

    function gameEnd() {
        setRank();
        $start.show();
    }

    worker.onmessage = function(event) {
        var msg = event.data;

        switch (msg) {
            case 'talk':
                var wd = $talk.val();
                if (data.turn === user && !$(user.id).hasClass('die') && wd.charAt(0) === data.char && new RegExp('\\b' + wd + '\\b').test(DB))
                    setWord(data.word = wd, 1);

                $talk.val('');
                break;
        }
    };
    
    $start.click(gameStart);

    $talk.keydown(function(e) {
        if (e.keyCode === 13)
            worker.postMessage('talk');
    });

    $(window).on('unload', function() {
        worker.terminate();
        worker = undefined;
    });
    
});
