
function display_graph1(svg_already_exists, svg, change = undefined) {
    var tooltip = d3
        .select("body")
        .append("div")
        .attr("class", "hidden tooltip");
    var distance_between_bars = 50;
    var bar_width = 30;
    var start_margin = 100;
    var margin = 20;
    var width = 8000;
    var height = 650;
    var total_height = height * 1.1;
    var total_width = width * 1.1;
    d3.json(urlplayersjson).then((json) => {
        //console.log(json);
        transform_data_for_bar(json);
        data = DataCleaning(
            json,
            document.getElementById("user-select").value
          );
        //console.log(data);

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
            if (document.getElementById("details-checkbox").checked) {
                games = [];
                for (entry of Object.values(data)) {
                    if ((!games.includes(entry.game_name)) && entry.game_end.includes(inf)) {
                        games.push(entry.game_name)
                    }
                    gameTimePerDay[inf] = {}
                    gameTimePerDay[inf]["total"] = "0:0:0";
                    if (games.length != 0) {
                        for (game of games) {
                            gameTimePerDay[inf][game] = "0:0:0";
                            for (entry of Object.keys(data)) {
                                if (data[entry].game_end.includes(inf) && game == data[entry].game_name ) {
                                    gameTimePerDay[inf][game] = SumDurations(
                                        gameTimePerDay[inf][game],
                                        data[entry].game_duration
                                    );

                                    gameTimePerDay[inf]["total"] = SumDurations(
                                        gameTimePerDay[inf]["total"],
                                        data[entry].game_duration
                                    );
                                }
                            }
                        }
                    }
                }
            } else {
                gameTimePerDay[inf] = "0:0:0";
                for (entry of Object.keys(data)) {
                    if (data[entry].game_end.includes(inf)) {
                        gameTimePerDay[inf] = SumDurations(
                            gameTimePerDay[inf],
                            data[entry].game_duration
                        );
                        //console.log(
                        // "inf : " + inf + "   " + data[entry].game_duration
                        //);
                    }
                }
            }
            inf = formatDate(
                new Date(new Date(inf).setDate(new Date(inf).getDate() + 1))
            );
        }
        //console.log("GTPD : ",gameTimePerDay);
        datas = [];
        var id = 0;
        if (document.getElementById("details-checkbox").checked) {
            gamesPlayed = [];
            for (val of Object.values(gameTimePerDay)) {
                element = {}
                element["date"] = Object.keys(gameTimePerDay)[id];
                element["id"] = id
                for (game of Object.keys(val)) {
                    if (game != "total") {
                        if(!gamesPlayed.includes(game))gamesPlayed.push(game);
                        splitVal = val[game].split(":");
                        valInSeconds =
                            splitVal[2] * Math.pow(60, 0) +
                            splitVal[1] * Math.pow(60, 1) +
                            splitVal[0] * Math.pow(60, 2);
                        element[game] = valInSeconds;
                    }
                }
                datas.push(element);
                id++;
            }
        } else {
            for (val of Object.values(gameTimePerDay)) {
                element = {};
                element["id"] = id;
    
                // Date formatting
                element["date"] = Object.keys(gameTimePerDay)[id];
    
                splitVal = val.split(":");
                valInSeconds =
                    splitVal[2] * Math.pow(60, 0) +
                    splitVal[1] * Math.pow(60, 1) +
                    splitVal[0] * Math.pow(60, 2);
                element["playtime"] = valInSeconds;
                //console.log(splitVal, " | ", valInSeconds);
                datas.push(element);
                id++;
            }
        }

        
        if(!svg_already_exists){
            svg1 = d3
                .select("svg1")
                .append("svg")
                .attr("width", total_width)
                .attr("height", total_height)
                .attr(
                    "transform",
                    "translate(" + start_margin + "," + margin + ")"
                );
        }
        else {
            svg1 = svg;
        }

        if (document.getElementById("details-checkbox").checked) {
            var color = d3
                            .scaleQuantize()
                            .range(['#FF6633', '#FFB399', '#FF33FF', '#FFFF99', '#00B3E6', 
                            '#E6B333', '#3366E6', '#999966', '#99FF99', '#B34D4D',
                            '#80B300', '#809900', '#E6B3B3', '#6680B3', '#66991A', 
                            '#FF99E6', '#CCFF1A', '#FF1A66', '#E6331A', '#33FFCC',
                            '#66994D', '#B366CC', '#4D8000', '#B33300', '#CC80CC', 
                            '#66664D', '#991AFF', '#E666FF', '#4DB3FF', '#1AB399',
                            '#E666B3', '#33991A', '#CC9999', '#B3B31A', '#00E680', 
                            '#4D8066', '#809980', '#E6FF80', '#1AFF33', '#999933',
                            '#FF3380', '#CCCC00', '#66E64D', '#4D80CC', '#9900B3', 
                            '#E64D66', '#4DB380', '#FF4D4D', '#99E6E6', '#6666FF']);
                            //.range(["#edf8e9", "#bae4b3", "#74c476", "#31a354", "#006d2c"])
            color.domain([0,gamesPlayed.length]);
            //console.log("datas : ", datas, " gamesPlayes : ", gamesPlayed);
            datas.map((d) => {
                for (game of gamesPlayed) {
                    if (!Object.keys(d).includes(game)) {
                        d[game] = 0;
                    }
                }
            });
            //console.log("datas : ", datas);
            const stack = d3.stack()
                            .keys(gamesPlayed)
                            .order(d3.stackOrderNone)
                            .offset(d3.stackOffsetNone);
            var series = stack(datas);
            //console.log(series);
            var x = d3.scaleBand()
                    .domain(datas.map(d => d.date))
                    .range([0, distance_between_bars])

            var y = d3.scaleLinear()
                        .domain([0, d3.max(series[series.length - 1], d => d[1])])
                        .range([height, margin]);
            svg1.selectAll(".games").selectAll("rect").remove();
            svg1.selectAll(".games").remove();
            var groups = svg1.selectAll("g.games")
                            .data(series)
                            .enter()
                            .append("g")
                            .style("fill", (d, i) => color(i))
                            .attr("class","games");
        }

        var xScale = d3
            .scaleLinear()
            .domain(d3.range(datas.length))
            .range([0, distance_between_bars]);

        var x_axis = d3.axisBottom().scale(xScale);

        /*console.log(
            "max : ",
            d3.max(datas, (d) => d.playtime)
        );*/
        var yScale = d3
            .scaleLinear()
            .domain([0, d3.max(datas, (d) => d.playtime)])
            .range([height, margin]);

        
        var y_axis = (document.getElementById("details-checkbox").checked ? d3.axisLeft().scale(y).tickFormat((d) =>  hhmmss(d)):d3.axisLeft().scale(yScale).tickFormat((d) =>  hhmmss(d)));
        //var y_axis = d3.axisLeft().scale(yScale);
        if (change == "details") {
            if (document.getElementById("details-checkbox").checked) {
                console.log("checked");
                svg1.selectAll(".bar").classed("hidden", true);
                svg1.selectAll(".games").classed("hidden", false);
            } else {
                console.log("unchecked");
                svg1.selectAll(".bar").classed("hidden", false);
                svg1.selectAll(".games").classed("hidden", true);
            }
        }

        if (!svg_already_exists) {
        svg1
            .append("g")
            .attr("transform", "translate(" + start_margin + "," + height + ")")
            .attr("class","abscisses")
            .call(x_axis)
            //.text("Day");

        svg1
            .append("g")
            .call(y_axis)
            .attr("transform", "translate(" + start_margin + ",0)")
            .attr("class","ordonnees")
            //.text("Time played");
        } else {
            svg1.selectAll(".abscisses").transition().duration(1000).call(x_axis)
            svg1.selectAll(".ordonnees").transition().duration(1000).call(y_axis)
        }

        

        if (!document.getElementById("details-checkbox").checked) {
            if(!svg_already_exists) {
                svg1
                .selectAll(".bar")
                .data(datas)
                .enter()
                .append("rect")
                .attr("class", "bar")
                .attr("x", function (d) {
                    //console.log(xScale(d.id));
                    return xScale(d.id) + start_margin;
                })
                .attr("y", function (d) {
                    //console.log(d.playtime_forever);
                    return yScale(d.playtime);
                })
                .attr("width", bar_width)
                .attr("height", function (d) {
                    return height - yScale(d.playtime);
                })
                .on("mousemove", function (e, d) {
                    // on recupere la position de la souris,
                    // e est l'object event d
                    //console.log(d);
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
                            d.date +
                            " | Temps de jeu : " +
                            parseInt(d.playtime / 3600) +
                            " h " +
                            parseInt(
                                (d.playtime - parseInt(d.playtime / 3600) * 3600) / 60
                            ) +
                            " m " +
                            (d.playtime -
                                (parseInt(d.playtime / 3600) * 3600 +
                                    parseInt(
                                        (d.playtime - parseInt(d.playtime / 3600) * 3600) / 60
                                    ) *
                                    60)) +
                            " s."
                        );
                })
                .on("mouseout", function () {
                    tooltip.classed("hidden", true);
                });
            } else {
                svg1.selectAll(".bar")
                    .transition()
                    .duration(1000)
                    .attr("y", height)
                    .attr("height", 0);
                svg1
                    .selectAll(".bar")
                    .data(datas)
                    .transition()
                    .duration(1000)
                    .attr("x", function (d) {
                        //console.log(xScale(d.id));
                        return xScale(d.id) + start_margin;
                    })
                    .attr("y", function (d) {
                        //console.log(d.playtime_forever);
                        return yScale(d.playtime);
                    })
                    .attr("height", function (d) {
                        return height - yScale(d.playtime);
                    })
            }
        } else {
            if(change=="details") {
                groups
                .selectAll("rect")
                .data(d => d)
                .enter()
                .append("rect")
                //.attr("class","bar")
                .attr("x",(d) => {
                    //console.log("scale xScale : ",xScale(d.data.id), "   id : ",d.data.id, "   d : ", d);
                    return xScale(d.data.id) + start_margin;})
                .attr("width", bar_width)
                .attr("y",(d)=> y(d[1]))
                .attr("height", (d)=> height - y(d[1]-d[0]))
                .attr("class","rectGames")
                .on("mousemove", function (e, d) {
                    // on recupere la position de la souris,
                    // e est l'object event d
                    //console.log(d);
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
                            d.data.date +
                            " | Jeu : " + Object.keys(d.data).find(key => d.data[key] === d[1] - d[0]) + " | Temps de jeu : " +
                            parseInt((d[1] - d[0]) / 3600) +
                            " h " +
                            parseInt(
                                ((d[1] - d[0]) - parseInt((d[1] - d[0]) / 3600) * 3600) / 60
                            ) +
                            " m " +
                            ((d[1] - d[0]) -
                                (parseInt((d[1] - d[0]) / 3600) * 3600 +
                                    parseInt(
                                        ((d[1] - d[0]) - parseInt((d[1] - d[0]) / 3600) * 3600) / 60
                                    ) *
                                    60)) +
                            " s."
                        );
                })
                .on("mouseout", function () {
                    tooltip.classed("hidden", true);
                });
            } else {

                groups
                .selectAll("rect")
                .data(d => d)
                .enter()
                .append("rect")
                .transition()
                .duration(1000)
                .attr("x",(d) => {console.log("scale xScale : ",xScale(d.data.id), "   id : ",d.data.id, "   d : ", d); return xScale(d.data.id) + start_margin;})
                .attr("width", bar_width)
                .attr("y",(d)=> y(d[1]))
                .attr("height", (d)=> height - y(d[1]-d[0]))
                .attr("class","rectGames")
                groups
                .selectAll("rect")
                .on("mousemove", function (e, d) {
                    // on recupere la position de la souris,
                    // e est l'object event d
                    //console.log(d);
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
                            d.data.date +
                            " | Jeu : " + Object.keys(d.data).find(key => d.data[key] === d[1] - d[0]) + " | Temps de jeu : " +
                            parseInt((d[1] - d[0]) / 3600) +
                            " h " +
                            parseInt(
                                ((d[1] - d[0]) - parseInt((d[1] - d[0]) / 3600) * 3600) / 60
                            ) +
                            " m " +
                            ((d[1] - d[0]) -
                                (parseInt((d[1] - d[0]) / 3600) * 3600 +
                                    parseInt(
                                        ((d[1] - d[0]) - parseInt((d[1] - d[0]) / 3600) * 3600) / 60
                                    ) *
                                    60)) +
                            " s."
                        );
                })
                .on("mouseout", function () {
                    tooltip.classed("hidden", true);
                });
            }
        }

        set_legende_graph1(datas);
        d3.select("svg1").selectAll(".legendDetails").remove();
        if(document.getElementById("details-checkbox").checked) addLegend(color,gamesPlayed,total_width,start_margin,margin);
        
        d3.select("#user-select").on("change", (event) => {
            console.log("change");
            //svg2.selectAll('*').remove();
            display_graph2(true);
            display_graph1(true, svg1);

        });

        d3.select("#period-select").on("change", (event) => {
            console.log("change");
            //svg2.selectAll('*').remove();
            display_graph1(true, svg1);
            display_graph2(true);
        });

        d3.select("#details-checkbox").on("change", (event) => {
            display_graph1(true, svg1,"details");
        });


        
    });
}


function addLegend(colors,keys,total_width,start_margin,margin, legendPerLines = 4) {
    legendCellSize = 20,
    maxCarac = d3.max(keys,(d)=> d.length);
    spacingBeetweenCells = legendCellSize + maxCarac * 7 + 5;
    colorsKeys = [];
    for (var i in keys) {
        colorsKeys.push(colors(i));
    }
    //console.log("legend removed");
    let legend = d3
                    .select("svg1")
                    .append("svg")
                    .attr("width", total_width)
                    .attr("height", 30 * (Math.floor(keys.length/legendPerLines) + 1)+15)
                    .attr(
                        "transform",
                        "translate(" + 2*start_margin + "," + margin + ")"
                    )
                    .attr("class","legendDetails");
        
    legend.selectAll()
        .data(colorsKeys)
        .enter().append('rect')
            .attr('height', legendCellSize + 'px')
            .attr('width', legendCellSize + 'px')
            .attr('x', (d,i) => i%legendPerLines * spacingBeetweenCells)
            .attr('y', (d,i) => Math.floor(i/legendPerLines)*legendCellSize+Math.floor(i/legendPerLines)*10)
            .style("fill", d => d);
    
    legend.selectAll()
        .data(keys)
        .enter().append('text')
            .attr("transform", (d,i) => "translate(" + (i%legendPerLines * spacingBeetweenCells + legendCellSize + 5) + ", " + 0 + ")")
            .attr("dy", (d,i) => Math.floor(i/legendPerLines)*legendCellSize+Math.floor(i/legendPerLines)*10 + legendCellSize / 1.6) // Pour centrer le texte par rapport aux carrés
            .style("font-size", "13px")
            .style("fill", "grey")
            .text(d => d);
}