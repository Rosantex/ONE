$(function() {

    var blob = new Blob(["self.onmessage = function(e) { postMessage(e.data); }" ], { type: 'application/javascript' });
    var worker = new Worker(URL.createObjectURL(blob));
   
    var DB = $.ajax({
        url: 'https://raw.githubusercontent.com/Legacy-K/common/master/En.txt',
        async: false
    }).responseText;

    var ROBOT_START_DELAY = [2000, 1500, 1000, 500, 50];
    
    var $stage = $('#stage'),
        $start = $('#start'),
        $title = $('#title'),
        $display = $('#display'),
        $mission = $('#mission'),
        $chain = $('#chain'),
        $timer = $('#timer'),
        $talk = $('#talk');
    
    var D = {
        title: '', round: 0,
        player: [], count: 0,
        turn: null, lastTurn: null,
        word: '', char: '',
        mission: '', chain: 0,
        score: {}
    };
    
    var T = setTimeout;
    
    function R(x, y) {
        return y ? x + Math.floor(Math.random() * (y - x + 1)) : R(0, x);
    }
    
    var images = ['img1', 'img2', 'img3', 'img4'].shuffle();
    
    // Class: Player
    function Player(name) {
        this.name = name;
        this.idx = D.count;
        this.id = '#' + name;
        D.player[D.count++] = this;
        D.score[name] = 0;

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
        T(setWord, this.delay, D.word = getWord(D.char), 1);
    };

    var robot1 = new Robot('Alpha', 2),
        robot2 = new Robot('Beta', 3),
        robot3 = new Robot('Gamma', 4),
        user = new User('You');

    function isValid(w) {
        return w[0] === D.char && new RegExp('\\b' + w + '\\b').test(DB);
    }

    function vibrate(len) {
        if (len < 1) 
           return;

        $stage.css('padding-top', 2 * len);
        T(function() {
            $stage.css('padding-top', 0);
            T(vibrate, 50, len * 0.7);
        }, 50);
    }

    function getWord(f, d) {
        var res = DB.match(new RegExp('\\b' + f + '.{' + (d ? d - f.length : '1,') + '}\\b', 'g'));
        return res.random();
    }

    function setWord(wd, idx) {
        if (idx === 1) {
            turnEnd();
            vibrate(wd.length);
        }

        if (idx < wd.length) {
            var ch = wd[idx++];
            $display.append(ch === D.mission ? '<label style="color: #66FF66;">' + ch + '</label>' : ch);
            T(setWord, (800 - 7 * D.chain) / D.word.length, wd, idx);
        } else {
            T(function() {
                setMission();
                $display.text(D.char = wd.slice(-1));

                T(turnStart, 500 - 5 * D.chain);
            }, 400 - 4 * D.chain);
        }
    }

    function setTitle() {
        D.round = 0;
        $title.text(D.title = getWord(String.fromCharCode(97 + R(25)), R(2, 2)));
    }

    function setRound() {
        if (D.round >= D.title.length) 
            return gameEnd();

        D.turn = D.turn || D.player[0];
        $(D.turn.id).removeClass('turn die');
        $display.text(D.char = D.title[D.round++]);
        $chain.text(D.chain = 0);
        setMission();
        T(turnStart, 1000);
    }

    function setMission() {
        if (D.word.indexOf(D.mission) !== -1) 
            $mission.text(D.mission = String.fromCharCode(97 + R(25)));
    }

    function setScore(c) {
        var s = D.score[D.turn.name],
            sc = 0,
            $sc = $(D.turn.id + 'score');

        switch (c) {
            case 'new-game':
                $.each(D.score, function(player, score) {
                    D.score[player] = 0
                });
                $('.score').text(0);
                return;
            case 'time-over':
                sc = Math.floor(s * -0.3);
                break;
            case 'turn-end':
                var w = D.word,
                    m = w.split(D.mission).length - 1;
                sc += w.length * R(10, 20);

                while (--m > 0)
                    sc += R(10, 99);
                
                break;
        }

        $(D.turn.id).append($('<div>')
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

        D.score[D.turn.name] = s + sc;
    }

    function timeStart() {
        $timer.width('').animate({
            width: 0
        }, 10000 - 100 * D.chain, timeEnd);
    }

    function timeEnd() {
        $(D.turn.id).addClass('die');
        setScore('time-over');
        T(setRound, 2000);
    }

    function turnStart() {
        $('.delta').remove();
        if ($(D.turn.id).hasClass('die') || D.lastTurn && $(D.lastTurn.id).hasClass('die'))
            return;

        $(D.turn.id).addClass('turn');
        timeStart();
        D.turn instanceof Robot ? D.turn.go() : $talk.focus();
    }

    function turnEnd() {
        $timer.stop(true);
        $chain.text(++D.chain);
        setScore('turn-end');
        $(D.turn.id).removeClass('turn');
        D.lastTurn = D.turn;
        D.turn = D.player[(D.turn.idx + 1) % D.count];
    }

    function gameStart() {
        $start.hide();
        if (D.lastTurn) 
            setScore('new-game');

        setTitle();
        setRound();
    }

    function gameEnd() {
        alert('End');
        $start.show();
    }

    $start.click(gameStart);

    $talk.keydown(function(e) {
        if (e.keyCode === 13)
            worker.postMessage('talk');
    });
    
    worker.onmessage = function(event) {
        var msg = event.data;
    
        switch(msg) {
            case 'talk':
                var input = $talk.val();
                if (D.turn === user && !$(user.id).hasClass('die') && isValid(input)) 
                setWord(D.word = input, 1);
                
                $talk.val('').focus();
                break;
        }
    };
    
    $(window).on('unload', function() {
        worker.terminate();
        worker = undefined;
    });
}); 
