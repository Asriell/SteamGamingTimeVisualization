var svg1;
var svg2;
var svg3;

function traitement_data(x) {
    return parseInt(x);
}


function transform_data_for_bar(dataset) {
    //console.log(dataset.players);
    Object.entries(dataset).forEach(([key, value]) => {
        value.playtime = traitement_data(value.playtime);
    });
    //console.log(dataset);
}

function set_legende_graph1(datas) {
    let periode = document.getElementById("period-select").value;
    let final_text = periode + " du " + d3.min(datas, (d) => d.date) + " au " + d3.max(datas, (d) => d.date);
    document.getElementById("legende1").innerHTML = final_text;
}


function transform_data_for_pie(dataset) {
    dataset.sort((a, b) => {
        return b.playtime_forever - a.playtime_forever;
    })
    let newId = 0;
    dataset.forEach(element => {
        // Logify les données pour lisibilité
        element.playtime_forever = traitement_data(element.playtime_forever);

        // Ajouter id pour le bar chart
        element.id = newId;
        newId++;
    });
    //console.log(dataset);
}

$.get("https://store.steampowered.com/api/appdetails/?appids=242050", function (data) {
    $(".result").html(data);
    alert("Load was performed.");
    //console.log(data);
});

function get_nb_days_to_display() {
    let periode = document.getElementById("period-select").value;
    if(periode == "semaine") {
        return 7;
    }
    if(periode == "mois") {
        return 30;
    }
    else {
        //console.error("WRONG DAYS ARGH");
    }
}

function formatDate(date) {
    let ddDate = String(date.getDate()).padStart(2, "0");
    let mmDate = String(date.getMonth() + 1).padStart(2, "0"); //January is 0!
    let yyyyDate = date.getFullYear();
    return yyyyDate + "-" + mmDate + "-" + ddDate;
}

function formatDateObject(date) {
    let ddDate = String(date.getDate()).padStart(2, "0");
    let mmDate = String(date.getMonth() + 1).padStart(2, "0"); //January is 0!
    let yyyyDate = date.getFullYear();
    return new Date(yyyyDate, mmDate, ddDate);
}

var ParseDuration = function (duration) {
    return duration.split(":");
};

var SumDurations = function (duration1, duration2) {
    let d1 = ParseDuration(duration1).map((d) => parseInt(d));
    let d2 = ParseDuration(duration2).map((d) => parseInt(d));
    let h = d1[0] + d2[0];
    let m = d1[1] + d2[1];
    let s = d1[2] + d2[2];
    if (s > 60) {
        m += 1;
        s = s % 60;
    }
    if (m > 60) {
        h += 1;
        m = m % 60;
    }
    return String(h) + ":" + String(m) + ":" + String(s);
};

var DataCleaning = function (data, user) {
    //console.log("data : ", data, "  user : ", user);
    var datasUser = Object.values(data.players).filter(
      (player) => player.persona_name == user
      //document.getElementById("user-select").value
    );
    //console.log("datasUser : ", datasUser);
    //console.log(data);
    tmpData = {};
    for (var entry in datasUser) {
      if (!datasUser[entry].game_duration.includes("day")) {
        if (entry != 0) {
          date1 = new Date(datasUser[entry - 1].game_end);
          date2 = new Date(datasUser[entry].game_end);
          datediff = Math.abs(date2 - date1) / 1000;
          dureeJeuSecondes = parseInt(
            parseInt(ParseDuration(datasUser[entry].game_duration)[0]) *
              3600 +
              parseInt(ParseDuration(datasUser[entry].game_duration)[1]) *
                60 +
              parseInt(ParseDuration(datasUser[entry].game_duration)[2])
          );
          if (datediff > 5 && datediff >= dureeJeuSecondes) {
            /*
            console.log(
              datasUser[entry].game_end,
              "   ",
              datediff,
              "   ",
              ParseDuration(datasUser[entry].game_duration),
              "  ",
              dureeJeuSecondes
            );
            */
            tmpData[datasUser[entry].game_end] = datasUser[entry];
            if (
              parseInt(ParseDuration(datasUser[entry].game_duration)[0]) >
              12
            ) {
              tmpData[datasUser[entry].game_end].game_duration = "12:00:00";
            }
          }
        } else {
          tmpData[datasUser[entry].game_end] = datasUser[entry];
          if (
            parseInt(ParseDuration(datasUser[entry].game_duration)[0]) > 12
          ) {
            tmpData[datasUser[entry].game_end].game_duration = "12:00:00";
          }
        }
      }
    }
    //console.log("tmpData : ", tmpData);
    return tmpData;
  };


//var USER = "Asriel";
//var PERIOD = "1 Month";
var TODAY = formatDate(new Date());
const urlRaw = "https://raw.githubusercontent.com/Asriell/ProjetSteamDataviz/gh-pages/data/games.csv"
const urlplayersjson = "https://raw.githubusercontent.com/Asriell/ProjetSteamDataviz/gh-pages/data/steam-players-data.json"

function display_graph1(svg_already_exists, svg) {
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

<<<<<<< HEAD
        var y_axis = d3.axisLeft().scale(yScale);
        //console.log(xScale(5));
=======
        
        var y_axis = (document.getElementById("details-checkbox").checked ? d3.axisLeft().scale(y):d3.axisLeft().scale(yScale));
        //var y_axis = d3.axisLeft().scale(yScale);
        console.log(xScale(5));
>>>>>>> 9f14f611e1000b2cbb48bcb8e626a5b612ff7bd0

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
            if(!svg_already_exists) {
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
                .on("mousemove", function (e, d) {
                    // on recupere la position de la souris,
                    // e est l'object event d
                    //console.log(d);
                    var mousePosition = [e.x, e.y];
                    console.log(mousePosition);
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
                .attr("height", (d)=> height - y(d[1]-d[0]));
            }
        }

        set_legende_graph1(datas);
        if(document.getElementById("details-checkbox").checked) addLegend(color,gamesPlayed,svg1);
        
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
            svg1.remove();
            display_graph1(false, undefined);
        });


        
    });
}


function addLegend(colors,keys,svg1) {
    legendCellSize = 20,
    colorsKeys = [];
    for (var i in keys) {
        colorsKeys.push(colors(i));
    }
    svg1.selectAll(".legendDetails").remove();
    //console.log("legend removed");
    let legend = svg1.append('g')
        .attr('transform', 'translate(10, 20)')
        .attr("class","legendDetails");
        
    legend.selectAll()
        .data(colorsKeys)
        .enter().append('rect')
            .attr('height', legendCellSize + 'px')
            .attr('width', legendCellSize + 'px')
            .attr('x', 5)
            .attr('y', (d,i) => i * legendCellSize)
            .style("fill", d => d);
    
    legend.selectAll()
        .data(keys)
        .enter().append('text')
            .attr("transform", (d,i) => "translate(" + (legendCellSize + 10) + ", " + (i * legendCellSize) + ")")
            .attr("dy", legendCellSize / 1.6) // Pour centrer le texte par rapport aux carrés
            .style("font-size", "13px")
            .style("fill", "grey")
            .text(d => d);
}


function display_graph2(svg_already_exists) {
    if(svg_already_exists) {
        svg2.selectAll('*').remove();
    }
    var tooltip = d3
        .select("body")
        .append("div")
        .attr("class", "hidden tooltip");
    let width = 600
    height = 450
    margin = 40

    // The radius of the pieplot is half the width or half the height (smallest one). I subtract a bit of margin.
    let radius = Math.min(width, height) / 2 - margin

    // append the svg object to the div called 'my_dataviz'
    if(!svg_already_exists) {
        svg2 = d3.select("svg2")
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
    }

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
                                if (data[entry].game_end.includes(inf) && game == data[entry].game_name) {
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
        //console.log("GTPD : ", gameTimePerDay);
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
                        if (!gamesPlayed.includes(game)) gamesPlayed.push(game);
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

        //get total playtime par jour
        datas.forEach(function (entry) {
            Object.keys(entry).forEach(function (d) {
                let total_p = 0;
                if (d != "id" && d != "date") {
                    total_p += parseInt(entry[d]);
                }
                //console.log(entry[d]);
                entry.total_playtime = total_p;
            });
        });
        
        console.log(datas);


        // Pie : pour chaque jour, je veux le playtime total
        // set the color scale
        var color = d3.scaleOrdinal()
            .domain([0, d3.max(datas, function (d) { return d.total_playtime; })])
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

        // Compute the position of each group on the pie:
        var pie = d3.pie()
            .value(function (d) {
                return d.total_playtime;
            })

        var data_ready = pie(datas)
        //console.log(data_ready);

        // Build the pie chart: Basically, each part of the pie is a path that we build using the arc function.
        svg2
            .selectAll('arcs')
            .data(data_ready)
            .enter()
            .append('path')
            .attr('d', d3.arc()
                .innerRadius(0)
                .outerRadius(radius)
            )
            .attr('fill', function (d) { return (color(d.data.date)) })
            .attr("stroke", "black")
            .style("stroke-width", "2px")
            .style("opacity", 0.7)
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
                        theData.date +
                        " | Temps de jeu : " +
                        parseInt(theData.total_playtime / 3600) +
                        " h " +
                        parseInt(
                            (theData.total_playtime - parseInt(theData.total_playtime / 3600) * 3600) / 60
                        ) +
                        " m " +
                        (theData.total_playtime -
                            (parseInt(theData.total_playtime / 3600) * 3600 +
                                parseInt(
                                    (theData.total_playtime - parseInt(theData.total_playtime / 3600) * 3600) / 60
                                ) *
                                60)) +
                        " s."
                    );
            })
            .on("mouseout", function () {
                tooltip.classed("hidden", true);
            });

        d3.select("#user-select").on("change", (event) => {
            console.log("change");
            display_graph2(true, svg2);
            display_graph1(true, svg1);

        });

        d3.select("#period-select").on("change", (event) => {
            console.log("change");
            display_graph1(true, svg1);
            display_graph2(true, svg2);
        });            
    });
}
