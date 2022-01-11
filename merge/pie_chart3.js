function display_graph3(svg_already_exists,svg3) {

    console.log("=========================SVG3=========================");
    if(svg_already_exists) {
        svg3.selectAll('*').remove();
    }

    var tooltip = d3
        .select("body")
        .append("div")
        .attr("class", "hidden tooltip");
    let width = 700;
    let height = 550;
    let margin = 40;
    let total_height = height * 1.1;
    let total_width = width * 1.1;

    let radius = Math.min(width, height) / 2 - margin

    var arcGenerator = d3.arc()
    .innerRadius(100)
    .outerRadius(radius)

    // append the svg object to the div called 'my_dataviz'
    if(!svg_already_exists) {
        svg3 = d3.select("svg3")
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
    }

    d3.json(urlplayersjson).then((json) => {
    transform_data_for_bar(json);
    data = DataCleaning(
        json,
        document.getElementById("user-select").value
    );

    console.log(data);
    inf = "1970-01-01";
    nbJours = get_nb_days_to_display();
    todate = new Date(TODAY);
    inf = formatDate(
        new Date(todate.setDate(todate.getDate() - nbJours))
    );
    inf2 = formatDate(
        new Date(new Date(inf).setDate(new Date(inf).getDate() + 1))
    );
    //console.log(TODAY, " | ", inf, " | ", inf2);
    gameTimePerDay = {};
    while (inf != TODAY) {
            games = [];
            for (entry of Object.values(data)) {
                if ((!games.includes(entry.game_name)) && entry.game_end.includes(inf)) {
                    games.push(entry.game_name)
                }
                gameTimePerDay[inf] = {}
                gameTimePerDay[inf]["total"] = "0:0:0";
                if (games.length != 0) {
                    for (game of games) {
                        gameTimePerDay[inf][game] = {}
                        gameTimePerDay[inf][game]["time"] = "0:0:0";
                        for (entry of Object.keys(data)) {
                            if (data[entry].game_end.includes(inf) && game == data[entry].game_name) {
                                gameTimePerDay[inf][game]["time"] = SumDurations(
                                    gameTimePerDay[inf][game]["time"],
                                    data[entry].game_duration
                                );

                                gameTimePerDay[inf]["total"] = SumDurations(
                                    gameTimePerDay[inf]["total"],
                                    data[entry].game_duration
                                );
                                gameTimePerDay[inf][game]["id"] = data[entry].game_id;
                            }
                        }
                    }
                }
            }
            inf = formatDate(
                new Date(new Date(inf).setDate(new Date(inf).getDate() + 1))
            );
        }
        console.log("GTPD : ", gameTimePerDay);
        gamesIds = {}
        //apiKey = "F6F2A22B759FEE0F79940A8783603562" 

        for(date of Object.values(gameTimePerDay)) {
            for (game of Object.keys(date)) {
                if(!Object.keys(gamesIds).includes(game)) {
                    gamesIds[game] = date[game]["id"];
                }
            }
        }
        console.log(gamesIds);
            //console.log(Object.keys(gameDescriptions),"   ",Object.keys(gameDescriptions).length)
            console.log("GTPD : ", gameTimePerDay);
            console.log("game infos : ", gameInfos);
            console.log("GTPD : ", gameTimePerDay);
            genreTimePerPeriod = {};
            for(day of Object.keys(gameTimePerDay)) {
                if(gameTimePerDay[day].total == "0:0:0") {
                    continue;
                } else {
                    for(game of Object.keys(gameTimePerDay[day])) {
                        if(game == "total") {
                            continue;
                        } else {
                            console.log("GTPD : ",gameTimePerDay);
                            console.log(game,"   ", gameTimePerDay[day]);
                            tags = gameInfos[game]["genres"];
                            console.log(tags);
                            for (tag of tags) {
                                if (!Object.keys(genreTimePerPeriod).includes(tag.description)) {
                                    genreTimePerPeriod[tag.description] = gameTimePerDay[day][game]["time"];
                                } else {
                                    genreTimePerPeriod[tag.description] = SumDurations(genreTimePerPeriod[tag.description], gameTimePerDay[day][game]["time"]);
                                }
                            }
                        }
                    }
                }
            }
            delete genreTimePerPeriod["Early Access"];
            delete genreTimePerPeriod["Free to Play"];
            id = 0;
            for(genre of Object.keys(genreTimePerPeriod)) {
                timeArray = genreTimePerPeriod[genre].split(":");
                genreTimePerPeriod[genre] = timeArray[0]*3600 + timeArray[1] * 60 + timeArray[0];
            }
            console.log(genreTimePerPeriod);
            
            datas = [];
            id = 0;
            for (game of Object.keys(genreTimePerPeriod)) {
                obj = {}
                obj["id"] = id;
                obj["genre"] = game;
                obj["time"] = genreTimePerPeriod[game];
                datas.push(obj);
                id ++;
            }
            var color = d3.scaleOrdinal()
                        .domain([0, d3.max(datas, function (d) { return d.id; })])
                        .range(['#FF6633', '#FFB399', '#FF33FF', '#FFFF99', '#00B3E6',
                            '#E6B333', '#3366E6', '#999966', '#99FF99', '#B34D4D',
                            '#80B300', '#809900', '#E6B3B3', '#6680B3', '#66991A',
                            '#FF99E6', '#CCFF1A', '#FF1A66', '#E6331A', '#33FFCC',
                            '#66994D', '#B366CC', '#4D8000', '#B33300', '#CC80CC',
                            '#66664D', '#991AFF', '#E666FF', '#4DB3FF', '#1AB399',
                            '#E666B3', '#33991A', '#CC9999', '#B3B31A', '#00E680',
                            '#4D8066', '#809980', '#E6FF80', '#1AFF33', '#999933',
                            '#FF3380', '#CCCC00', '#66E64D', '#4D80CC', '#9900B3',
                            '#E64D66', '#4DB380', '#FF4D4D', '#99E6E6', '#6666FF'])
            var pie = d3.pie()
            .value(function (d) {
                return d.time;
            })
            var data_ready = pie(datas);
            console.log("dr : ", data_ready);

            svg3
            .selectAll('arcs')
            .data(data_ready)
            .enter()
            .append('path')
            .attr('d', arcGenerator)
            .attr('fill', function (d) { return (color(d.data.id)) })
            .attr("class","pie")
            .on("mousemove", function (e, d) {
                // on recupere la position de la souris,
                // e est l'object event d
                theData = d.data;
                var mousePosition = [e.x, e.y];
                //console.log(mousePosition);
                // on affiche le toolip

                tooltip
                    .classed("hidden", false)
                    // on positionne le tooltip en fonction
                    // de la position de la souris
                    .attr(
                        "style",
                        "left:" +
                        (mousePosition[0] + 15) +
                        "px; top:" +
                        (mousePosition[1] - 35) +
                        "px"
                    )
                    // on recupere le nom de l'etat
                    .html(
                        theData.genre +
                        " | Temps total : " +
                        parseInt(theData.time / 3600) +
                        " h " +
                        parseInt(
                            (theData.time - parseInt(theData.time / 3600) * 3600) / 60
                        ) +
                        " m " +
                        (theData.time -
                            (parseInt(theData.time / 3600) * 3600 +
                                parseInt(
                                    (theData.time - parseInt(theData.time / 3600) * 3600) / 60
                                ) *
                                60)) +
                        " s."
                    );
            })
            /*.on("mouseout", function () {
                tooltip.classed("hidden", true);
            });*/


            addLegend_pie(color,datas,total_width,0,0);
    });

}

var addLegend_pie = function (colors,keys,total_width,start_margin,margin) {
    d3.select("svg3").selectAll(".legendDetails").remove();
    let legendCellSize = 20;
    let maxCarac = d3.max(keys,(d)=> d.date.length);
    var spacingBetweenCells = legendCellSize + maxCarac * 7 + 5;
    colorsKeys = [];
    for (let i=0;i<keys.length;++i) {
        colorsKeys.push(colors(keys[i].date));
    }
    //console.log("legend removed");
    let legend = d3
                    .select("svg3")
                    .append("svg")
                    .attr("width", total_width)
                    .attr("height", 400)
                    .attr(
                        "transform",
                        "translate(" + start_margin + "," + margin + ")"
                    )
                    .attr("class","legendDetails");
        
    legend.selectAll()
        .data(colorsKeys)
        .enter().append('rect')
            .attr('height', legendCellSize + 'px')
            .attr('width', legendCellSize + 'px')
            .attr('x', function (d,i) {
                return i%4 * spacingBetweenCells;
            })
            .attr('y', function (d,i) {
                return Math.floor(i/4)*legendCellSize+Math.floor(i/4)*10;
            })
            .style("fill", d => d);
    
    legend.selectAll()
        .data(keys)
        .enter().append('text')
            .attr("transform", (d,i) => "translate(" + (i%4 * spacingBetweenCells + legendCellSize + 5) + ", " + 0 + ")")
            .attr("dy", function (d, i) {
                return Math.floor(i/4)*legendCellSize+Math.floor(i/4)*10 + legendCellSize / 1.6;
            }) // Pour centrer le texte par rapport aux carrés
            .style("font-size", "13px")
            .style("fill", "grey")
            .text(d => d.genre);

        }