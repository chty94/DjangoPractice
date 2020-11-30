// Document Ready
$(document).ready(function () {
    // init
    $('#progress-section').css('display', 'none');
    $('#wrapper').css('display', 'none');
    $('#graph-row').css('display', 'none');
    $('.view-detail').css('margin-bottom', '20px');
    $('.explain').css('display', 'none');

    $("#textSummonerName").keyup(function (e) {
        if (e.keyCode == 13) {
            searchStart();
        }
    });
});

// Copy sCAUt.GG URL
$(function () {
    var clipboard = new Clipboard('#share-button');

    clipboard.on('success', function (e) {
        swal({
            title: "Notice",
            text: "URL Copied!"
        });
    });
});

// Ajax Summoner Search
function searchStart() {
    // Progress Section → Display: block
    var section = document.getElementById('progress-section');
    section.style.display = 'none';
    $('.wait').text('Please wait...');
    $('.match-count').text('');

    // Variables
    var summonerName = document.getElementById("textSummonerName").value;
    var progress = document.getElementById("pbar");
    // show progress section
    section.style.display = 'block';
    $('#progress-section').css('display', 'block');

    var width = 1;
    // Reset Datas
    progress.value = 0;
    document.getElementById("progress_1").src = "/static/img/icon_none.PNG";
    document.getElementById("progress_2").src = "/static/img/icon_none.PNG";
    document.getElementById("progress_3").src = "/static/img/icon_none.PNG";
    document.getElementById("progress_4").src = "/static/img/icon_none.PNG";
    $('.hand').css({
        'transform': 'rotate(-90deg)'
    });
    $('#wrapper').css('display', 'none');
    $('#graph-row').css('display', 'none');
    $('.view-detail').css('margin-bottom', '20px');
    $('.view-detail').text('View Details');
    destroyChart();

    console.log('검색 시작');
    // First Request
    var search_api = summonerName + '/search';
    $.ajax({
        crossOrigin: true,
        dataType: "json",
        url: search_api
    });

    var crolling = false;
    var getMatchlist = false;
    var getMatches = null;
    var runModel = 0;
    var countMatch = 0;
    var totalMatch = 0;
    var sName = '';
    var sWin = 0;
    var sLose = 0;
    var sLp = 0;
    var sTier = 0;

    var progress_1_finish = false;
    var progress_2_finish = false;
    var progress_3_finish = false;
    var progress_4_finish = false;

    // not exist flag
    var ajaxEnd = false;

    var i = 0;
    var check_api = summonerName + '/check';
    var progressing = setInterval(function () {
        if (runModel == true) {
            clearInterval(progressing);
        }

        $.ajax({
            crossOrigin: true,
            dataType: "json",
            url: check_api,
            success: function (data) {
                crolling = data['crolling'];
                getMatchlist = data['getMatchlist'];
                getMatches = data['getMatches'];
                runModel = data['createDatas'];
                sName = data['summonerName'];
                sWin = data['wins'];
                sLose = data['losses'];
                sLp = data['lp'];
                sTier = data['tier'];
                if (getMatches != null) {
                    countMatch = getMatches.split(',')[0];
                    totalMatch = getMatches.split(',')[1];
                }

                // crolling: true → Search Summoner Finish
                if (crolling == true && !progress_1_finish) {
                    console.log('1번 들어옴');
                    progress_1_finish = true;

                    var progress_1_fill = setInterval(function () {
                        width++;
                        progress.value = width;

                        if (width >= 5) {
                            console.log('1번 이미지 수정 부분 들어옴');
                            document.getElementById("progress_1").src = "/static/img/icon_check.PNG";
                            clearInterval(progress_1_fill);
                        }
                    }, 10)
                }
                // getMatchlist: true → Get Match List Finish
                else if (getMatchlist == true && !progress_2_finish && progress_1_finish) {
                    console.log('2번 들어옴');
                    progress_2_finish = true;

                    var progress_2_fill = setInterval(function () {
                        width++;
                        progress.value = width;

                        if (width >= 35) {
                            console.log('2번 이미지 수정 부분 들어옴');
                            document.getElementById("progress_2").src = "/static/img/icon_check.PNG";
                            clearInterval(progress_2_fill);
                        }
                    }, 10)
                }
                // getMatches: not null → Get Matches Counting
                else if (getMatches != null && !progress_3_finish && progress_2_finish && progress_1_finish) {
                    console.log('3번 들어옴');
                    progress_3_finish = true;

                    var progress_3_fill = setInterval(function () {
                        if (width < 65) {
                            let temp = (30 / totalMatch) * countMatch;
                            width = 35 + temp;
                            progress.value = width;
                        }

                        var tempCal;
                        try {
                            tempCal = (countMatch / totalMatch) * 100;
                            $('.match-count').text('( ' + Math.floor(tempCal) + '%)');
                        }
                        catch(e) {
                            $('.match-count').text('(0%)');
                        }

                        // $('.match-count').text('(' + countMatch + '/' + totalMatch + ')');

                        if (width >= 65) {
                            if (Number(countMatch) == Number(totalMatch)) {
                                console.log('3번 이미지 수정 부분 들어옴');
                                document.getElementById("progress_3").src = "/static/img/icon_check.PNG";
                                width = 65;
                                clearInterval(progress_3_fill);
                            }
                        }
                    }, 10)
                }
                // runModel: true → Run Model Finish
                else if (runModel == true && !progress_4_finish && progress_3_finish && progress_2_finish && progress_1_finish) {
                    console.log('4번 들어옴');
                    progress_4_finish = true;

                    var progress_4_fill = setInterval(function () {
                        if (width <= 99) {
                            width++;
                            progress.value = width;
                        }

                        if (width >= 91) {
                            console.log('4번 이미지 수정 부분 들어옴');
                            document.getElementById("progress_4").src = "/static/img/icon_check.PNG";
                        }

                        if (width >= 100) {
                            clearInterval(progress_4_fill);

                            // summoner Info Update
                            predictByMeter(sName, sLp, sWin, sLose, sTier);
                        }
                    }, 10)
                }
                console.log(crolling, getMatchlist, getMatches, runModel, countMatch, totalMatch);
                console.log('runModel(createDatas): ' + runModel);
            },
            error: function (request, status, error) {
                if (!ajaxEnd) {
                    ajaxEnd = true;
                    var alert = function(msg){
                        swal({
                            title: '',
                            text: msg
                        });
                    }
                    alert('Not exist summoner, search again please!!!');
                    clearInterval(progressing);
                    // hide progress
                    section.style.display = 'none';
                    $('#progress-section').css('display', 'none');
                    return;
                }
            }
        });

        i++;
        console.log(i);

    }, 500);
}

// Summoner Info Update
function UpdateSummonerInfo(summonerName, lp, wins, losses, tier) {
    var rank_text = '';
    var promo_rank_text = '';
    var demo_rank_text = '';
    if (tier == 1) {
        demo_rank_text = '-';
        rank_text = 'Iron IV';
        promo_rank_text = 'Iron III';
    } else if (tier == 2) {
        demo_rank_text = 'Iron IV';
        rank_text = 'Iron III';
        promo_rank_text = 'Iron II';
    } else if (tier == 3) {
        demo_rank_text = 'Iron III';
        rank_text = 'Iron II';
        promo_rank_text = 'Iron I';
    } else if (tier == 4) {
        demo_rank_text = 'Iron II';
        rank_text = 'Iron I';
        promo_rank_text = 'Bronze IV';
    } else if (tier == 5) {
        demo_rank_text = 'Iron I';
        rank_text = 'Bronze IV';
        promo_rank_text = 'Bronze III';
    } else if (tier == 6) {
        demo_rank_text = 'Bronze IV';
        rank_text = 'Bronze III';
        promo_rank_text = 'Bronze II';
    } else if (tier == 7) {
        demo_rank_text = 'Bronze III';
        rank_text = 'Bronze II';
        promo_rank_text = 'Bronze I';
    } else if (tier == 8) {
        demo_rank_text = 'Bronze II';
        rank_text = 'Bronze I';
        promo_rank_text = 'Silver IV';
    } else if (tier == 9) {
        demo_rank_text = 'Bronze I';
        rank_text = 'Silver IV';
        promo_rank_text = 'Silver III';
    } else if (tier == 10) {
        demo_rank_text = 'Silver IV';
        rank_text = 'Silver III';
        promo_rank_text = 'Silver II';
    } else if (tier == 11) {
        demo_rank_text = 'Silver III';
        rank_text = 'Silver II';
        promo_rank_text = 'Silver I';
    } else if (tier == 12) {
        demo_rank_text = 'Silver II';
        rank_text = 'Silver I';
        promo_rank_text = 'Gold IV';
    } else if (tier == 13) {
        demo_rank_text = 'Silver I';
        rank_text = 'Gold IV';
        promo_rank_text = 'Gold III';
    } else if (tier == 14) {
        demo_rank_text = 'Gold IV';
        rank_text = 'Gold III';
        promo_rank_text = 'Gold II';
    } else if (tier == 15) {
        demo_rank_text = 'Gold III';
        rank_text = 'Gold II';
        promo_rank_text = 'Gold I';
    } else if (tier == 16) {
        demo_rank_text = 'Gold II';
        rank_text = 'Gold I';
        promo_rank_text = 'Platinum IV';
    } else if (tier == 17) {
        demo_rank_text = 'Gold I';
        rank_text = 'Platinum IV';
        promo_rank_text = 'Platinum III';
    } else if (tier == 18) {
        demo_rank_text = 'Platinum IV';
        rank_text = 'Platinum III';
        promo_rank_text = 'Platinum II';
    } else if (tier == 19) {
        demo_rank_text = 'Platinum III';
        rank_text = 'Platinum II';
        promo_rank_text = 'Platinum I';
    } else if (tier == 20) {
        demo_rank_text = 'Platinum II';
        rank_text = 'Platinum I';
        promo_rank_text = 'Diamond IV';
    } else if (tier == 21) {
        demo_rank_text = 'Platinum I';
        rank_text = 'Diamond IV';
        promo_rank_text = 'Diamond III';
    } else if (tier == 22) {
        demo_rank_text = 'Diamond IV';
        rank_text = 'Diamond III';
        promo_rank_text = 'Diamond II';
    } else if (tier == 23) {
        demo_rank_text = 'Diamond III';
        rank_text = 'Diamond II';
        promo_rank_text = 'Diamond I';
    } else if (tier == 24) {
        demo_rank_text = 'Diamond II';
        rank_text = 'Diamond I';
        promo_rank_text = 'Master';
    } else if (tier == 25) {
        demo_rank_text = 'Diamond';
        rank_text = 'Master';
        promo_rank_text = 'Grandmaster';
    } else if (tier == 26) {
        demo_rank_text = 'Master';
        rank_text = 'Grandmaster';
        promo_rank_text = 'Challenger';
    } else if (tier == 27) {
        demo_rank_text = 'Grandmaster';
        rank_text = 'Challenger';
        promo_rank_text = '-';
    }

    // info update
    $('.summoner-rank').text(rank_text);
    $('.summoner-name').text(summonerName);
    $('.summoner-lp').text(lp);
    $('.summoner-wins').text(wins);
    $('.summoner-lose').text(losses);
    $(".now-tier").attr("src", "/static/img/emblems/" + tier + '.png');

    // meter update
    $('.demotion-rank').text(demo_rank_text);
    $('.promotion-rank').text(promo_rank_text);
    $(".demotion-tier").attr("src", "/static/img/emblems/" + (tier - 1) + '.png');
    $(".promotion-tier").attr("src", "/static/img/emblems/" + (tier + 1) + '.png');
}

// Predict By Meter
function predictByMeter(summonerName, lp, wins, losses, tier) {
    var promotion = 0;
    var api = summonerName + '/result';
    $.ajax({
        crossOrigin: true,
        dataType: "json",
        url: api,
        success: function (data) {
            // update summoner info
            $('.wait').text('Analysis Completed!');
            UpdateSummonerInfo(summonerName, lp, wins, losses, tier);
            $('#wrapper').css('display', 'flex');

            promotion = data.user_promotion;
            console.log('승급률: ' + promotion);

            var hand = $('.hand');
            var tempDeg = -90;
            var inputVal = tempDeg + (Math.floor(180 * promotion));

            // Edit Summary
            $('.summary-content').text(data.summary);

            // promotion : tier
            if (promotion > 0.5) {
                $('.d-tier').addClass('deactive');
                $('.d-tier').removeClass('active');
                $('.p-tier').addClass('active');
                $('.p-tier').removeClass('deactive');
            } else if (promotion < 0.5) {
                $('.d-tier').addClass('active');
                $('.d-tier').removeClass('deactive');
                $('.p-tier').addClass('deactive');
                $('.p-tier').removeClass('active');
            } else {
                $('.d-tier').addClass('deactive');
                $('.d-tier').removeClass('active');
                $('.p-tier').addClass('deactive');
                $('.p-tier').removeClass('active');
            }

            var intervalRate = 0;
            if (inputVal > tempDeg + 150) {
                intervalRate = 10;
            } else if (inputVal > tempDeg + 110) {
                intervalRate = 8;
            } else if (inputVal > tempDeg + 80) {
                intervalRate = 6;
            } else if (inputVal > tempDeg + 50) {
                intervalRate = 4;
            } else {
                intervalRate = 2;
            }

            var i = tempDeg;
            var timer = setInterval(function () {
                $('.hand').css({
                    'transform': 'rotate(' + (i++) + 'deg)'
                });

                if (i > inputVal) {
                    clearInterval(timer);
                }
            }, 1000 / (60 * intervalRate));

            // create chart
            var indicator = [0, 0, 0, 0, 0, 0, 0, 0];
            indicator[0] = data.user_info[0].win;       // 0~1 사이값 유저 result
            indicator[1] = data.user_info[0].kills;     // 0~1 사이값 유저 result
            indicator[2] = data.user_info[0].deaths;
            indicator[3] = data.user_info[0].assists;
            indicator[4] = data.user_info[0].killingSprees;
            indicator[5] = data.user_info[0].largestKillingSpree;
            indicator[6] = data.user_info[0].totalDamageDealt;
            indicator[7] = data.user_info[0].totalMinionsKilled;
            createGraphData(indicator, tier);
        }
    });
}

// Toggle Graphs
function toggleGraphs() {
    if ($('#graph-row').css('display') == 'flex') {
        $('.view-detail').css('margin-bottom', '20px');
        $('.view-detail').text('View Details');
        $('.explain').css('display', 'none');
    } else {
        $('.view-detail').css('margin-bottom', '0');
        $('.view-detail').text('Hide');
        $('.explain').css('display', 'flex');
    }
    $('#graph-row').slideToggle();
}

// Create Graph
function createGraphData(indicator, tier) {
    var league = 16; // = tier
    var api = '/league/' + tier;

    // p: promotion, d: demotion
    var pTempData = [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    ];
    var dTempData = [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    ];

    $.ajax({
        crossOrigin: true,
        dataType: "json",
        url: api,
        success: function (data) {
            let i = 0;
            while (data[i] != undefined) {
                if (data[i].promotion == true) {
                    // wins
                    if (0.0 <= data[i].win && data[i].win < 0.1) pTempData[0][0]++;
                    else if (0.1 <= data[i].win && data[i].win < 0.2) pTempData[0][1]++;
                    else if (0.2 <= data[i].win && data[i].win < 0.3) pTempData[0][2]++;
                    else if (0.3 <= data[i].win && data[i].win < 0.4) pTempData[0][3]++;
                    else if (0.4 <= data[i].win && data[i].win < 0.5) pTempData[0][4]++;
                    else if (0.5 <= data[i].win && data[i].win < 0.6) pTempData[0][5]++;
                    else if (0.6 <= data[i].win && data[i].win < 0.7) pTempData[0][6]++;
                    else if (0.7 <= data[i].win && data[i].win < 0.8) pTempData[0][7]++;
                    else if (0.8 <= data[i].win && data[i].win < 0.9) pTempData[0][8]++;
                    else if (0.9 <= data[i].win && data[i].win < 1.0) pTempData[0][9]++;

                    // kills
                    if (0.0 <= data[i].kills && data[i].kills < 0.1) pTempData[1][0]++;
                    else if (0.1 <= data[i].kills && data[i].kills < 0.2) pTempData[1][1]++;
                    else if (0.2 <= data[i].kills && data[i].kills < 0.3) pTempData[1][2]++;
                    else if (0.3 <= data[i].kills && data[i].kills < 0.4) pTempData[1][3]++;
                    else if (0.4 <= data[i].kills && data[i].kills < 0.5) pTempData[1][4]++;
                    else if (0.5 <= data[i].kills && data[i].kills < 0.6) pTempData[1][5]++;
                    else if (0.6 <= data[i].kills && data[i].kills < 0.7) pTempData[1][6]++;
                    else if (0.7 <= data[i].kills && data[i].kills < 0.8) pTempData[1][7]++;
                    else if (0.8 <= data[i].kills && data[i].kills < 0.9) pTempData[1][8]++;
                    else if (0.9 <= data[i].kills && data[i].kills < 1.0) pTempData[1][9]++;

                    // deaths
                    if (0.0 <= data[i].deaths && data[i].deaths < 0.1) pTempData[2][0]++;
                    else if (0.1 <= data[i].deaths && data[i].deaths < 0.2) pTempData[2][1]++;
                    else if (0.2 <= data[i].deaths && data[i].deaths < 0.3) pTempData[2][2]++;
                    else if (0.3 <= data[i].deaths && data[i].deaths < 0.4) pTempData[2][3]++;
                    else if (0.4 <= data[i].deaths && data[i].deaths < 0.5) pTempData[2][4]++;
                    else if (0.5 <= data[i].deaths && data[i].deaths < 0.6) pTempData[2][5]++;
                    else if (0.6 <= data[i].deaths && data[i].deaths < 0.7) pTempData[2][6]++;
                    else if (0.7 <= data[i].deaths && data[i].deaths < 0.8) pTempData[2][7]++;
                    else if (0.8 <= data[i].deaths && data[i].deaths < 0.9) pTempData[2][8]++;
                    else if (0.9 <= data[i].deaths && data[i].deaths < 1.0) pTempData[2][9]++;

                    // assists
                    if (0.0 <= data[i].assists && data[i].assists < 0.1) pTempData[3][0]++;
                    else if (0.1 <= data[i].assists && data[i].assists < 0.2) pTempData[3][1]++;
                    else if (0.2 <= data[i].assists && data[i].assists < 0.3) pTempData[3][2]++;
                    else if (0.3 <= data[i].assists && data[i].assists < 0.4) pTempData[3][3]++;
                    else if (0.4 <= data[i].assists && data[i].assists < 0.5) pTempData[3][4]++;
                    else if (0.5 <= data[i].assists && data[i].assists < 0.6) pTempData[3][5]++;
                    else if (0.6 <= data[i].assists && data[i].assists < 0.7) pTempData[3][6]++;
                    else if (0.7 <= data[i].assists && data[i].assists < 0.8) pTempData[3][7]++;
                    else if (0.8 <= data[i].assists && data[i].assists < 0.9) pTempData[3][8]++;
                    else if (0.9 <= data[i].assists && data[i].assists < 1.0) pTempData[3][9]++;

                    // killingSprees
                    if (0.0 <= data[i].killingSprees && data[i].killingSprees < 0.1) pTempData[4][0]++;
                    else if (0.1 <= data[i].killingSprees && data[i].killingSprees < 0.2) pTempData[4][1]++;
                    else if (0.2 <= data[i].killingSprees && data[i].killingSprees < 0.3) pTempData[4][2]++;
                    else if (0.3 <= data[i].killingSprees && data[i].killingSprees < 0.4) pTempData[4][3]++;
                    else if (0.4 <= data[i].killingSprees && data[i].killingSprees < 0.5) pTempData[4][4]++;
                    else if (0.5 <= data[i].killingSprees && data[i].killingSprees < 0.6) pTempData[4][5]++;
                    else if (0.6 <= data[i].killingSprees && data[i].killingSprees < 0.7) pTempData[4][6]++;
                    else if (0.7 <= data[i].killingSprees && data[i].killingSprees < 0.8) pTempData[4][7]++;
                    else if (0.8 <= data[i].killingSprees && data[i].killingSprees < 0.9) pTempData[4][8]++;
                    else if (0.9 <= data[i].killingSprees && data[i].killingSprees < 1.0) pTempData[4][9]++;

                    // largestKillingSpree
                    if (0.0 <= data[i].largestKillingSpree && data[i].largestKillingSpree < 0.1) pTempData[5][0]++;
                    else if (0.1 <= data[i].largestKillingSpree && data[i].largestKillingSpree < 0.2) pTempData[5][1]++;
                    else if (0.2 <= data[i].largestKillingSpree && data[i].largestKillingSpree < 0.3) pTempData[5][2]++;
                    else if (0.3 <= data[i].largestKillingSpree && data[i].largestKillingSpree < 0.4) pTempData[5][3]++;
                    else if (0.4 <= data[i].largestKillingSpree && data[i].largestKillingSpree < 0.5) pTempData[5][4]++;
                    else if (0.5 <= data[i].largestKillingSpree && data[i].largestKillingSpree < 0.6) pTempData[5][5]++;
                    else if (0.6 <= data[i].largestKillingSpree && data[i].largestKillingSpree < 0.7) pTempData[5][6]++;
                    else if (0.7 <= data[i].largestKillingSpree && data[i].largestKillingSpree < 0.8) pTempData[5][7]++;
                    else if (0.8 <= data[i].largestKillingSpree && data[i].largestKillingSpree < 0.9) pTempData[5][8]++;
                    else if (0.9 <= data[i].largestKillingSpree && data[i].largestKillingSpree < 1.0) pTempData[5][9]++;

                    // totalDamageDealt
                    if (0.0 <= data[i].totalDamageDealt && data[i].totalDamageDealt < 0.1) pTempData[6][0]++;
                    else if (0.1 <= data[i].totalDamageDealt && data[i].totalDamageDealt < 0.2) pTempData[6][1]++;
                    else if (0.2 <= data[i].totalDamageDealt && data[i].totalDamageDealt < 0.3) pTempData[6][2]++;
                    else if (0.3 <= data[i].totalDamageDealt && data[i].totalDamageDealt < 0.4) pTempData[6][3]++;
                    else if (0.4 <= data[i].totalDamageDealt && data[i].totalDamageDealt < 0.5) pTempData[6][4]++;
                    else if (0.5 <= data[i].totalDamageDealt && data[i].totalDamageDealt < 0.6) pTempData[6][5]++;
                    else if (0.6 <= data[i].totalDamageDealt && data[i].totalDamageDealt < 0.7) pTempData[6][6]++;
                    else if (0.7 <= data[i].totalDamageDealt && data[i].totalDamageDealt < 0.8) pTempData[6][7]++;
                    else if (0.8 <= data[i].totalDamageDealt && data[i].totalDamageDealt < 0.9) pTempData[6][8]++;
                    else if (0.9 <= data[i].totalDamageDealt && data[i].totalDamageDealt < 1.0) pTempData[6][9]++;

                    // totalMinionsKilled
                    if (0.0 <= data[i].totalMinionsKilled && data[i].totalMinionsKilled < 0.1) pTempData[7][0]++;
                    else if (0.1 <= data[i].totalMinionsKilled && data[i].totalMinionsKilled < 0.2) pTempData[7][1]++;
                    else if (0.2 <= data[i].totalMinionsKilled && data[i].totalMinionsKilled < 0.3) pTempData[7][2]++;
                    else if (0.3 <= data[i].totalMinionsKilled && data[i].totalMinionsKilled < 0.4) pTempData[7][3]++;
                    else if (0.4 <= data[i].totalMinionsKilled && data[i].totalMinionsKilled < 0.5) pTempData[7][4]++;
                    else if (0.5 <= data[i].totalMinionsKilled && data[i].totalMinionsKilled < 0.6) pTempData[7][5]++;
                    else if (0.6 <= data[i].totalMinionsKilled && data[i].totalMinionsKilled < 0.7) pTempData[7][6]++;
                    else if (0.7 <= data[i].totalMinionsKilled && data[i].totalMinionsKilled < 0.8) pTempData[7][7]++;
                    else if (0.8 <= data[i].totalMinionsKilled && data[i].totalMinionsKilled < 0.9) pTempData[7][8]++;
                    else if (0.9 <= data[i].totalMinionsKilled && data[i].totalMinionsKilled < 1.0) pTempData[7][9]++;
                } else {
                    // wins
                    if (0.0 <= data[i].win && data[i].win < 0.1) dTempData[0][0]++;
                    else if (0.1 <= data[i].win && data[i].win < 0.2) dTempData[0][1]++;
                    else if (0.2 <= data[i].win && data[i].win < 0.3) dTempData[0][2]++;
                    else if (0.3 <= data[i].win && data[i].win < 0.4) dTempData[0][3]++;
                    else if (0.4 <= data[i].win && data[i].win < 0.5) dTempData[0][4]++;
                    else if (0.5 <= data[i].win && data[i].win < 0.6) dTempData[0][5]++;
                    else if (0.6 <= data[i].win && data[i].win < 0.7) dTempData[0][6]++;
                    else if (0.7 <= data[i].win && data[i].win < 0.8) dTempData[0][7]++;
                    else if (0.8 <= data[i].win && data[i].win < 0.9) dTempData[0][8]++;
                    else if (0.9 <= data[i].win && data[i].win < 1.0) dTempData[0][9]++;

                    // kills
                    if (0.0 <= data[i].kills && data[i].kills < 0.1) dTempData[1][0]++;
                    else if (0.1 <= data[i].kills && data[i].kills < 0.2) dTempData[1][1]++;
                    else if (0.2 <= data[i].kills && data[i].kills < 0.3) dTempData[1][2]++;
                    else if (0.3 <= data[i].kills && data[i].kills < 0.4) dTempData[1][3]++;
                    else if (0.4 <= data[i].kills && data[i].kills < 0.5) dTempData[1][4]++;
                    else if (0.5 <= data[i].kills && data[i].kills < 0.6) dTempData[1][5]++;
                    else if (0.6 <= data[i].kills && data[i].kills < 0.7) dTempData[1][6]++;
                    else if (0.7 <= data[i].kills && data[i].kills < 0.8) dTempData[1][7]++;
                    else if (0.8 <= data[i].kills && data[i].kills < 0.9) dTempData[1][8]++;
                    else if (0.9 <= data[i].kills && data[i].kills < 1.0) dTempData[1][9]++;

                    // deaths
                    if (0.0 <= data[i].deaths && data[i].deaths < 0.1) dTempData[2][0]++;
                    else if (0.1 <= data[i].deaths && data[i].deaths < 0.2) dTempData[2][1]++;
                    else if (0.2 <= data[i].deaths && data[i].deaths < 0.3) dTempData[2][2]++;
                    else if (0.3 <= data[i].deaths && data[i].deaths < 0.4) dTempData[2][3]++;
                    else if (0.4 <= data[i].deaths && data[i].deaths < 0.5) dTempData[2][4]++;
                    else if (0.5 <= data[i].deaths && data[i].deaths < 0.6) dTempData[2][5]++;
                    else if (0.6 <= data[i].deaths && data[i].deaths < 0.7) dTempData[2][6]++;
                    else if (0.7 <= data[i].deaths && data[i].deaths < 0.8) dTempData[2][7]++;
                    else if (0.8 <= data[i].deaths && data[i].deaths < 0.9) dTempData[2][8]++;
                    else if (0.9 <= data[i].deaths && data[i].deaths < 1.0) dTempData[2][9]++;

                    // assists
                    if (0.0 <= data[i].assists && data[i].assists < 0.1) dTempData[3][0]++;
                    else if (0.1 <= data[i].assists && data[i].assists < 0.2) dTempData[3][1]++;
                    else if (0.2 <= data[i].assists && data[i].assists < 0.3) dTempData[3][2]++;
                    else if (0.3 <= data[i].assists && data[i].assists < 0.4) dTempData[3][3]++;
                    else if (0.4 <= data[i].assists && data[i].assists < 0.5) dTempData[3][4]++;
                    else if (0.5 <= data[i].assists && data[i].assists < 0.6) dTempData[3][5]++;
                    else if (0.6 <= data[i].assists && data[i].assists < 0.7) dTempData[3][6]++;
                    else if (0.7 <= data[i].assists && data[i].assists < 0.8) dTempData[3][7]++;
                    else if (0.8 <= data[i].assists && data[i].assists < 0.9) dTempData[3][8]++;
                    else if (0.9 <= data[i].assists && data[i].assists < 1.0) dTempData[3][9]++;

                    // killingSprees
                    if (0.0 <= data[i].killingSprees && data[i].killingSprees < 0.1) dTempData[4][0]++;
                    else if (0.1 <= data[i].killingSprees && data[i].killingSprees < 0.2) dTempData[4][1]++;
                    else if (0.2 <= data[i].killingSprees && data[i].killingSprees < 0.3) dTempData[4][2]++;
                    else if (0.3 <= data[i].killingSprees && data[i].killingSprees < 0.4) dTempData[4][3]++;
                    else if (0.4 <= data[i].killingSprees && data[i].killingSprees < 0.5) dTempData[4][4]++;
                    else if (0.5 <= data[i].killingSprees && data[i].killingSprees < 0.6) dTempData[4][5]++;
                    else if (0.6 <= data[i].killingSprees && data[i].killingSprees < 0.7) dTempData[4][6]++;
                    else if (0.7 <= data[i].killingSprees && data[i].killingSprees < 0.8) dTempData[4][7]++;
                    else if (0.8 <= data[i].killingSprees && data[i].killingSprees < 0.9) dTempData[4][8]++;
                    else if (0.9 <= data[i].killingSprees && data[i].killingSprees < 1.0) dTempData[4][9]++;

                    // largestKillingSpree
                    if (0.0 <= data[i].largestKillingSpree && data[i].largestKillingSpree < 0.1) dTempData[5][0]++;
                    else if (0.1 <= data[i].largestKillingSpree && data[i].largestKillingSpree < 0.2) dTempData[5][1]++;
                    else if (0.2 <= data[i].largestKillingSpree && data[i].largestKillingSpree < 0.3) dTempData[5][2]++;
                    else if (0.3 <= data[i].largestKillingSpree && data[i].largestKillingSpree < 0.4) dTempData[5][3]++;
                    else if (0.4 <= data[i].largestKillingSpree && data[i].largestKillingSpree < 0.5) dTempData[5][4]++;
                    else if (0.5 <= data[i].largestKillingSpree && data[i].largestKillingSpree < 0.6) dTempData[5][5]++;
                    else if (0.6 <= data[i].largestKillingSpree && data[i].largestKillingSpree < 0.7) dTempData[5][6]++;
                    else if (0.7 <= data[i].largestKillingSpree && data[i].largestKillingSpree < 0.8) dTempData[5][7]++;
                    else if (0.8 <= data[i].largestKillingSpree && data[i].largestKillingSpree < 0.9) dTempData[5][8]++;
                    else if (0.9 <= data[i].largestKillingSpree && data[i].largestKillingSpree < 1.0) dTempData[5][9]++;

                    // totalDamageDealt
                    if (0.0 <= data[i].totalDamageDealt && data[i].totalDamageDealt < 0.1) dTempData[6][0]++;
                    else if (0.1 <= data[i].totalDamageDealt && data[i].totalDamageDealt < 0.2) dTempData[6][1]++;
                    else if (0.2 <= data[i].totalDamageDealt && data[i].totalDamageDealt < 0.3) dTempData[6][2]++;
                    else if (0.3 <= data[i].totalDamageDealt && data[i].totalDamageDealt < 0.4) dTempData[6][3]++;
                    else if (0.4 <= data[i].totalDamageDealt && data[i].totalDamageDealt < 0.5) dTempData[6][4]++;
                    else if (0.5 <= data[i].totalDamageDealt && data[i].totalDamageDealt < 0.6) dTempData[6][5]++;
                    else if (0.6 <= data[i].totalDamageDealt && data[i].totalDamageDealt < 0.7) dTempData[6][6]++;
                    else if (0.7 <= data[i].totalDamageDealt && data[i].totalDamageDealt < 0.8) dTempData[6][7]++;
                    else if (0.8 <= data[i].totalDamageDealt && data[i].totalDamageDealt < 0.9) dTempData[6][8]++;
                    else if (0.9 <= data[i].totalDamageDealt && data[i].totalDamageDealt < 1.0) dTempData[6][9]++;

                    // totalMinionsKilled
                    if (0.0 <= data[i].totalMinionsKilled && data[i].totalMinionsKilled < 0.1) dTempData[7][0]++;
                    else if (0.1 <= data[i].totalMinionsKilled && data[i].totalMinionsKilled < 0.2) dTempData[7][1]++;
                    else if (0.2 <= data[i].totalMinionsKilled && data[i].totalMinionsKilled < 0.3) dTempData[7][2]++;
                    else if (0.3 <= data[i].totalMinionsKilled && data[i].totalMinionsKilled < 0.4) dTempData[7][3]++;
                    else if (0.4 <= data[i].totalMinionsKilled && data[i].totalMinionsKilled < 0.5) dTempData[7][4]++;
                    else if (0.5 <= data[i].totalMinionsKilled && data[i].totalMinionsKilled < 0.6) dTempData[7][5]++;
                    else if (0.6 <= data[i].totalMinionsKilled && data[i].totalMinionsKilled < 0.7) dTempData[7][6]++;
                    else if (0.7 <= data[i].totalMinionsKilled && data[i].totalMinionsKilled < 0.8) dTempData[7][7]++;
                    else if (0.8 <= data[i].totalMinionsKilled && data[i].totalMinionsKilled < 0.9) dTempData[7][8]++;
                    else if (0.9 <= data[i].totalMinionsKilled && data[i].totalMinionsKilled < 1.0) dTempData[7][9]++;
                }
                i++;
            }

            var pData = [
                [{
                        x: 0,
                        y: pTempData[0][0]
                    },
                    {
                        x: 1,
                        y: pTempData[0][1]
                    },
                    {
                        x: 2,
                        y: pTempData[0][2]
                    },
                    {
                        x: 3,
                        y: pTempData[0][3]
                    },
                    {
                        x: 4,
                        y: pTempData[0][4]
                    },
                    {
                        x: 5,
                        y: pTempData[0][5]
                    },
                    {
                        x: 6,
                        y: pTempData[0][6]
                    },
                    {
                        x: 7,
                        y: pTempData[0][7]
                    },
                    {
                        x: 8,
                        y: pTempData[0][8]
                    },
                    {
                        x: 9,
                        y: pTempData[0][9]
                    },
                    {
                        x: 10,
                        y: pTempData[0][9]
                    }
                ],
                [{
                        x: 0,
                        y: pTempData[1][0]
                    },
                    {
                        x: 1,
                        y: pTempData[1][1]
                    },
                    {
                        x: 2,
                        y: pTempData[1][2]
                    },
                    {
                        x: 3,
                        y: pTempData[1][3]
                    },
                    {
                        x: 4,
                        y: pTempData[1][4]
                    },
                    {
                        x: 5,
                        y: pTempData[1][5]
                    },
                    {
                        x: 6,
                        y: pTempData[1][6]
                    },
                    {
                        x: 7,
                        y: pTempData[1][7]
                    },
                    {
                        x: 8,
                        y: pTempData[1][8]
                    },
                    {
                        x: 9,
                        y: pTempData[1][9]
                    },
                    {
                        x: 10,
                        y: pTempData[1][9]
                    }
                ],
                [{
                        x: 0,
                        y: pTempData[2][0]
                    },
                    {
                        x: 1,
                        y: pTempData[2][1]
                    },
                    {
                        x: 2,
                        y: pTempData[2][2]
                    },
                    {
                        x: 3,
                        y: pTempData[2][3]
                    },
                    {
                        x: 4,
                        y: pTempData[2][4]
                    },
                    {
                        x: 5,
                        y: pTempData[2][5]
                    },
                    {
                        x: 6,
                        y: pTempData[2][6]
                    },
                    {
                        x: 7,
                        y: pTempData[2][7]
                    },
                    {
                        x: 8,
                        y: pTempData[2][8]
                    },
                    {
                        x: 9,
                        y: pTempData[2][9]
                    },
                    {
                        x: 10,
                        y: pTempData[2][9]
                    }
                ],
                [{
                        x: 0,
                        y: pTempData[3][0]
                    },
                    {
                        x: 1,
                        y: pTempData[3][1]
                    },
                    {
                        x: 2,
                        y: pTempData[3][2]
                    },
                    {
                        x: 3,
                        y: pTempData[3][3]
                    },
                    {
                        x: 4,
                        y: pTempData[3][4]
                    },
                    {
                        x: 5,
                        y: pTempData[3][5]
                    },
                    {
                        x: 6,
                        y: pTempData[3][6]
                    },
                    {
                        x: 7,
                        y: pTempData[3][7]
                    },
                    {
                        x: 8,
                        y: pTempData[3][8]
                    },
                    {
                        x: 9,
                        y: pTempData[3][9]
                    },
                    {
                        x: 10,
                        y: pTempData[3][9]
                    }
                ],
                [{
                        x: 0,
                        y: pTempData[4][0]
                    },
                    {
                        x: 1,
                        y: pTempData[4][1]
                    },
                    {
                        x: 2,
                        y: pTempData[4][2]
                    },
                    {
                        x: 3,
                        y: pTempData[4][3]
                    },
                    {
                        x: 4,
                        y: pTempData[4][4]
                    },
                    {
                        x: 5,
                        y: pTempData[4][5]
                    },
                    {
                        x: 6,
                        y: pTempData[4][6]
                    },
                    {
                        x: 7,
                        y: pTempData[4][7]
                    },
                    {
                        x: 8,
                        y: pTempData[4][8]
                    },
                    {
                        x: 9,
                        y: pTempData[4][9]
                    },
                    {
                        x: 10,
                        y: pTempData[4][9]
                    }
                ],
                [{
                        x: 0,
                        y: pTempData[5][0]
                    },
                    {
                        x: 1,
                        y: pTempData[5][1]
                    },
                    {
                        x: 2,
                        y: pTempData[5][2]
                    },
                    {
                        x: 3,
                        y: pTempData[5][3]
                    },
                    {
                        x: 4,
                        y: pTempData[5][4]
                    },
                    {
                        x: 5,
                        y: pTempData[5][5]
                    },
                    {
                        x: 6,
                        y: pTempData[5][6]
                    },
                    {
                        x: 7,
                        y: pTempData[5][7]
                    },
                    {
                        x: 8,
                        y: pTempData[5][8]
                    },
                    {
                        x: 9,
                        y: pTempData[5][9]
                    },
                    {
                        x: 10,
                        y: pTempData[5][9]
                    }
                ],
                [{
                        x: 0,
                        y: pTempData[6][0]
                    },
                    {
                        x: 1,
                        y: pTempData[6][1]
                    },
                    {
                        x: 2,
                        y: pTempData[6][2]
                    },
                    {
                        x: 3,
                        y: pTempData[6][3]
                    },
                    {
                        x: 4,
                        y: pTempData[6][4]
                    },
                    {
                        x: 5,
                        y: pTempData[6][5]
                    },
                    {
                        x: 6,
                        y: pTempData[6][6]
                    },
                    {
                        x: 7,
                        y: pTempData[6][7]
                    },
                    {
                        x: 8,
                        y: pTempData[6][8]
                    },
                    {
                        x: 9,
                        y: pTempData[6][9]
                    },
                    {
                        x: 10,
                        y: pTempData[6][9]
                    }
                ],
                [{
                        x: 0,
                        y: pTempData[7][0]
                    },
                    {
                        x: 1,
                        y: pTempData[7][1]
                    },
                    {
                        x: 2,
                        y: pTempData[7][2]
                    },
                    {
                        x: 3,
                        y: pTempData[7][3]
                    },
                    {
                        x: 4,
                        y: pTempData[7][4]
                    },
                    {
                        x: 5,
                        y: pTempData[7][5]
                    },
                    {
                        x: 6,
                        y: pTempData[7][6]
                    },
                    {
                        x: 7,
                        y: pTempData[7][7]
                    },
                    {
                        x: 8,
                        y: pTempData[7][8]
                    },
                    {
                        x: 9,
                        y: pTempData[7][9]
                    },
                    {
                        x: 10,
                        y: pTempData[7][9]
                    }
                ],
            ];

            var dData = [
                [{
                        x: 0,
                        y: dTempData[0][0]
                    },
                    {
                        x: 1,
                        y: dTempData[0][1]
                    },
                    {
                        x: 2,
                        y: dTempData[0][2]
                    },
                    {
                        x: 3,
                        y: dTempData[0][3]
                    },
                    {
                        x: 4,
                        y: dTempData[0][4]
                    },
                    {
                        x: 5,
                        y: dTempData[0][5]
                    },
                    {
                        x: 6,
                        y: dTempData[0][6]
                    },
                    {
                        x: 7,
                        y: dTempData[0][7]
                    },
                    {
                        x: 8,
                        y: dTempData[0][8]
                    },
                    {
                        x: 9,
                        y: dTempData[0][9]
                    },
                    {
                        x: 10,
                        y: dTempData[0][9]
                    }
                ],
                [{
                        x: 0,
                        y: dTempData[1][0]
                    },
                    {
                        x: 1,
                        y: dTempData[1][1]
                    },
                    {
                        x: 2,
                        y: dTempData[1][2]
                    },
                    {
                        x: 3,
                        y: dTempData[1][3]
                    },
                    {
                        x: 4,
                        y: dTempData[1][4]
                    },
                    {
                        x: 5,
                        y: dTempData[1][5]
                    },
                    {
                        x: 6,
                        y: dTempData[1][6]
                    },
                    {
                        x: 7,
                        y: dTempData[1][7]
                    },
                    {
                        x: 8,
                        y: dTempData[1][8]
                    },
                    {
                        x: 9,
                        y: dTempData[1][9]
                    },
                    {
                        x: 10,
                        y: dTempData[1][9]
                    }
                ],
                [{
                        x: 0,
                        y: dTempData[2][0]
                    },
                    {
                        x: 1,
                        y: dTempData[2][1]
                    },
                    {
                        x: 2,
                        y: dTempData[2][2]
                    },
                    {
                        x: 3,
                        y: dTempData[2][3]
                    },
                    {
                        x: 4,
                        y: dTempData[2][4]
                    },
                    {
                        x: 5,
                        y: dTempData[2][5]
                    },
                    {
                        x: 6,
                        y: dTempData[2][6]
                    },
                    {
                        x: 7,
                        y: dTempData[2][7]
                    },
                    {
                        x: 8,
                        y: dTempData[2][8]
                    },
                    {
                        x: 9,
                        y: dTempData[2][9]
                    },
                    {
                        x: 10,
                        y: dTempData[2][9]
                    }
                ],
                [{
                        x: 0,
                        y: dTempData[3][0]
                    },
                    {
                        x: 1,
                        y: dTempData[3][1]
                    },
                    {
                        x: 2,
                        y: dTempData[3][2]
                    },
                    {
                        x: 3,
                        y: dTempData[3][3]
                    },
                    {
                        x: 4,
                        y: dTempData[3][4]
                    },
                    {
                        x: 5,
                        y: dTempData[3][5]
                    },
                    {
                        x: 6,
                        y: dTempData[3][6]
                    },
                    {
                        x: 7,
                        y: dTempData[3][7]
                    },
                    {
                        x: 8,
                        y: dTempData[3][8]
                    },
                    {
                        x: 9,
                        y: dTempData[3][9]
                    },
                    {
                        x: 10,
                        y: dTempData[3][9]
                    }
                ],
                [{
                        x: 0,
                        y: dTempData[4][0]
                    },
                    {
                        x: 1,
                        y: dTempData[4][1]
                    },
                    {
                        x: 2,
                        y: dTempData[4][2]
                    },
                    {
                        x: 3,
                        y: dTempData[4][3]
                    },
                    {
                        x: 4,
                        y: dTempData[4][4]
                    },
                    {
                        x: 5,
                        y: dTempData[4][5]
                    },
                    {
                        x: 6,
                        y: dTempData[4][6]
                    },
                    {
                        x: 7,
                        y: dTempData[4][7]
                    },
                    {
                        x: 8,
                        y: dTempData[4][8]
                    },
                    {
                        x: 9,
                        y: dTempData[4][9]
                    },
                    {
                        x: 10,
                        y: dTempData[4][9]
                    }
                ],
                [{
                        x: 0,
                        y: dTempData[5][0]
                    },
                    {
                        x: 1,
                        y: dTempData[5][1]
                    },
                    {
                        x: 2,
                        y: dTempData[5][2]
                    },
                    {
                        x: 3,
                        y: dTempData[5][3]
                    },
                    {
                        x: 4,
                        y: dTempData[5][4]
                    },
                    {
                        x: 5,
                        y: dTempData[5][5]
                    },
                    {
                        x: 6,
                        y: dTempData[5][6]
                    },
                    {
                        x: 7,
                        y: dTempData[5][7]
                    },
                    {
                        x: 8,
                        y: dTempData[5][8]
                    },
                    {
                        x: 9,
                        y: dTempData[5][9]
                    },
                    {
                        x: 10,
                        y: dTempData[5][9]
                    }
                ],
                [{
                        x: 0,
                        y: dTempData[6][0]
                    },
                    {
                        x: 1,
                        y: dTempData[6][1]
                    },
                    {
                        x: 2,
                        y: dTempData[6][2]
                    },
                    {
                        x: 3,
                        y: dTempData[6][3]
                    },
                    {
                        x: 4,
                        y: dTempData[6][4]
                    },
                    {
                        x: 5,
                        y: dTempData[6][5]
                    },
                    {
                        x: 6,
                        y: dTempData[6][6]
                    },
                    {
                        x: 7,
                        y: dTempData[6][7]
                    },
                    {
                        x: 8,
                        y: dTempData[6][8]
                    },
                    {
                        x: 9,
                        y: dTempData[6][9]
                    },
                    {
                        x: 10,
                        y: dTempData[6][9]
                    }
                ],
                [{
                        x: 0,
                        y: dTempData[7][0]
                    },
                    {
                        x: 1,
                        y: dTempData[7][1]
                    },
                    {
                        x: 2,
                        y: dTempData[7][2]
                    },
                    {
                        x: 3,
                        y: dTempData[7][3]
                    },
                    {
                        x: 4,
                        y: dTempData[7][4]
                    },
                    {
                        x: 5,
                        y: dTempData[7][5]
                    },
                    {
                        x: 6,
                        y: dTempData[7][6]
                    },
                    {
                        x: 7,
                        y: dTempData[7][7]
                    },
                    {
                        x: 8,
                        y: dTempData[7][8]
                    },
                    {
                        x: 9,
                        y: dTempData[7][9]
                    },
                    {
                        x: 10,
                        y: dTempData[7][9]
                    }
                ],
            ];
            createChart(pData[0], dData[0], indicator[0], 'Wins');
            createChart(pData[1], dData[1], indicator[1], 'Kills');
            createChart(pData[2], dData[2], indicator[2], 'Deaths');
            createChart(pData[3], dData[3], indicator[3], 'Assists');
            createChart(pData[4], dData[4], indicator[4], 'KillingSprees');
            createChart(pData[5], dData[5], indicator[5], 'LargestKillingSpree');
            createChart(pData[6], dData[6], indicator[6], 'TotalDamageDealt');
            createChart(pData[7], dData[7], indicator[7], 'TotalMinionsKilled');
        }
    });
}

var graphs = []

// Create Charts
function createChart(promotionData, demotionData, indicator, category) {
    if (category == 'Wins')
        var ctx = document.getElementById("canvas-1").getContext("2d");
    else if (category == 'Kills')
        var ctx = document.getElementById("canvas-2").getContext("2d");
    else if (category == 'Deaths')
        var ctx = document.getElementById("canvas-3").getContext("2d");
    else if (category == 'Assists')
        var ctx = document.getElementById("canvas-4").getContext("2d");
    else if (category == 'KillingSprees')
        var ctx = document.getElementById("canvas-5").getContext("2d");
    else if (category == 'LargestKillingSpree')
        var ctx = document.getElementById("canvas-6").getContext("2d");
    else if (category == 'TotalDamageDealt')
        var ctx = document.getElementById("canvas-7").getContext("2d");
    else if (category == 'TotalMinionsKilled')
        var ctx = document.getElementById("canvas-8").getContext("2d");

    // 그라데이션
    var gradientPromo = ctx.createLinearGradient(0, 0, 0, 450);
    var gradientDemo = ctx.createLinearGradient(0, 0, 0, 450);

    gradientPromo.addColorStop(0, 'rgba(18, 132, 152, 0.5)');
    gradientPromo.addColorStop(0.25, 'rgba(0, 0, 0, 0.5)');

    gradientDemo.addColorStop(0, 'rgba(84, 84, 84, 0.5)');
    gradientDemo.addColorStop(0.25, 'rgba(0, 0, 0, 0.5)');

    var chartData = {
        labels: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
        datasets: [{
                type: 'line',
                label: 'Demotion',
                data: demotionData,
                pointRadius: 0,
                borderColor: "rgba(84, 84, 84, 1)",
                borderWidth: 1,
                backgroundColor: gradientDemo,
                fill: true,
            },
            {
                type: 'line',
                label: 'Promotion',
                data: promotionData,
                pointRadius: 0,
                borderColor: "rgba(18, 132, 152, 1)",
                borderWidth: 1,
                backgroundColor: gradientPromo,
                fill: true,
            }
        ]
    };

    // 차트 에어리어 색
    Chart.pluginService.register({
        beforeDraw: function (chart, easing) {
            if (chart.config.options.chartArea && chart.config.options
                .chartArea
                .backgroundColor) {
                var helpers = Chart.helpers;
                var ctx = chart.chart.ctx;
                var chartArea = chart.chartArea;

                ctx.save();
                ctx.fillStyle = chart.config.options.chartArea
                    .backgroundColor;
                ctx.fillRect(chartArea.left, chartArea.top, chartArea
                    .right -
                    chartArea.left, chartArea
                    .bottom - chartArea.top);
                ctx.restore();
            }
        }
    });

    var graph = new Chart(ctx, {
        type: "line",
        data: chartData,
        options: {
            annotation: {
                annotations: [{
                    drawTime: "afterDatasetsDraw",
                    type: "line",
                    mode: "vertical",
                    scaleID: "x-axis-0",
                    value: indicator * 10,
                    borderWidth: 0.7,
                    borderColor: "#C8AA6E",
                    label: {
                        // content: "0.52",
                        enabled: true,
                        position: "top"
                    }
                }]
            },
            responsive: false,
            chartArea: {
                backgroundColor: 'rgba(48, 48, 48, 0.1)'
            },
            legend: {
                display: false
            },
            scales: {
                xAxes: [{
                    type: 'linear',
                    position: 'bottom',
                    gridLines: {
                        display: true
                    },
                    ticks: {
                        fontColor: 'white',
                        fontSize: 8,
                        callback: function (value, index, values) {
                            if (index == 0)
                                return '0';
                            else if (index == 2)
                                return '1';
                            else
                                return '';
                        }
                    }
                }],
                yAxes: [{
                    display: false,
                    gridLines: {
                        display: false
                    },
                    ticks: {
                        suggestedMin: 0,
                    },
                    scaleLabel: {
                        display: true,
                        labelString: 'y축'
                    }
                }]
            }
        }
    });
    graphs.push(graph)
}

// Destroy Charts
function destroyChart() {
    if (graphs) {
        for (var i = 0; i < graphs.length; i++) {
            graphs[i].update();
            graphs[i].destroy();
        }
    }
    graphs = []
}