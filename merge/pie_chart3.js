var DataCleaning2 = function (data, user) {
    //console.log("data : ", data, "  user : ", user);
    /*
    var datasUser = Object.values(data.players).filter(
      (player) => player.persona_name == user
      //document.getElementById("user-select").value
    );*/
    //console.log("datasUser : ", datasUser);
    //console.log(data);
    var datasUser = data;
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
    .innerRadius(0)
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
        data = DataCleaning2(
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
            console.log(gameTimePerDay);
            tags = {}
            //apiKey = "F6F2A22B759FEE0F79940A8783603562" 

            for(date of Object.values(gameTimePerDay)) {
                for (game of Object.keys(date)) {
                    if(!Object.keys(tags).includes(game)) {
                        tags[game] = date[game]["id"];
                        //url = "https://api.steampowered.com/ISteamNews/GetNewsForApp/v0002/?appid="+date[game]["id"]+"&count=3&maxlength=300&format=json";
                    }
                }
            }
            console.log(tags);
    });



}