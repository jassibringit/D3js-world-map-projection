(function() {


    var height = window.innerHeight,
        width = window.innerWidth;

    var svg = d3.select("body")
        .append("svg")
        .attr("height", height)
        .attr("width", width);

    var defs = svg.append("defs");

    //filter, it really slows down the performance

    // var filter = defs.append("filter")
    //     .attr("id", "glow");

    // filter.append("feGaussianBlur")
    //     .attr("stdDeviation", "0.5")
    //     .attr("in", "SourceGraphic")
    //     .attr("result", "coloredBlur");

    // var feMerge = filter.append("feMerge");
    // feMerge.append("feMergeNode")
    //     .attr("in", "coloredBlur");
    // feMerge.append("feMergeNode")
    //     .attr("in", "SourceGraphic");



    // var filter2 = defs.append("filter")
    //     .attr("id", "grad")
    // var grad = filter2.append("linearGradient")
    // grad.append("stop")
    //     .attr("stop-opacity", "1")
    //     .attr("offset", "0")
    // grad.append("stop")
    //     .attr("stop-opacity", "0")
    //     .attr("offset", "1")


    var graph = svg.append("g")


    // load all the files concurrently(same time)
    d3.queue()
        .defer(d3.json, "https://d3js.org/world-110m.v1.json")
        .await(ready)



    // create a new projection
    // this converts longitude and latitude, things from glob that will exist on screen
    var projection = d3.geoMercator ()

    .translate([width / 2, height / 2 + 100])

    // .scale(w);
    .scale(height / (Math.PI + .5));


    /*
      Create a path using projection
    */
    var path = d3.geoPath()
        .projection(projection)


    function ready(error, map, lines) {


        if (error) throw error;
        var countries = topojson.feature(map, map.objects.countries).features

        graph.selectAll(".country")
            .data(countries)
            .enter().append("path")
            .attr("class", "country")
            .attr("d", path)


        // socket io

        var socket = io("http://localhost:3000");
        socket.on("draw", function(data) {
            console.log("data coming", data)

            links = [];
            links.push({
                type: "LineString",
                coordinates: [
                    [data.p1[1], data.p1[0]],
                    [data.p2[1], data.p2[0]]
                ]
            });

            var transformLines = [];

            var pi = projection([data.p1[1], data.p1[0]]);

            transformLines.push({ x: pi[0], y: pi[1] });
            var py = projection([data.p2[1], data.p2[0]]);
            transformLines.push({ x: py[0], y: py[1] });

            var transform = d3.line()
                .curve(d3.curveStep)
                .x(function(d) {
                    return d.x
                })
                .y(function(d) {
                    return d.y
                })


            var x1 = transformLines[0].x,
                x2 = transformLines[1].x,
                y1 = transformLines[0].y,
                y2 = transformLines[1].y

            var length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
            if(length === 0){
                //return out of the function
                return;
            }
            var midPoint = [(x1 + x2) / 2, (y1 + y2) / 2];
            var slope = (y2 - y1) / (x2 - x1);
            var inverseTheta = Math.atan(-1 / slope);
            var vector = [Math.cos(inverseTheta), Math.sin(inverseTheta)];

            var maxArc = length / 4;
            var minArc = length / 10;

            var newPath = d3.path();
            newPath.moveTo(transformLines[0].x, transformLines[0].y);
            newPath.arcTo(transformLines[1].x, transformLines[1].y, midPoint[0] + 10, midPoint[1] - 10, 0);

            var sPath = "";
            var curveoffset = (Math.random() * (maxArc - minArc) + minArc);

            sPath += "M" + transformLines[0].x + "," + transformLines[0].y;
            if (transformLines[0].x < transformLines[1].x) {
                sPath += "S" + (midPoint[0] + vector[0] * curveoffset) + "," + (midPoint[1] - vector[1] * curveoffset);
                sPath += "," + transformLines[1].x + "," + transformLines[1].y;
            } else {
                sPath += "S" + (midPoint[0] - vector[0] * curveoffset) + "," + (midPoint[1] - vector[1] * curveoffset);
                sPath += "," + transformLines[1].x + "," + transformLines[1].y;
            }

             var lineGroup = svg.append("g")
                .attr("class", "arc-group");

            var drawLine = lineGroup
                .data(transformLines)
                .append("path")
                .attr('class', 'arc')
                .attr("d", sPath)
                .style("stroke", data.color)
                .style("animation", "delayAnimation " + (data.timeout / 2 / 4) + "s")
                //.style("filter","url(#glow)") // Very expensive graphically
                //.style("filter","url(#grad)") // Very expensive graphically

            var totalLength = drawLine.node().getTotalLength();

            // ===================================================================


            var LineEndTime = 1 / (length / width) + length * 10;

            var totalArcs = d3.selectAll(".arc")

            function doTransition(line1, line2) {
                var transition = d3.select(this).transition();
                lineGroup.append("circle")
                    .attr("class", "rings")
                    .attr("fill", "red")
                    .attr("stroke", "red")
                    .attr("stroke-width",8)
                    .attr("cx", line1)
                    .attr("cy", line2)
                    .attr("r", 0)
                    .attr("opacity", .4)
                    .attr("fill-opacity", .7)
                    // transitioning and changing radius and opacity
                    .transition()
                    .duration(2000)
                    .attr("r", 100)
                    .attr("stroke-width",3)
                    .attr("fill-opacity", .01)
                    .attr("opacity", 0)
                    .remove();
            }

            // doTransition(x1, y1);

            // cannot pass parameters to a function pointer
            setTimeout(function() {
                doTransition(x2, y2)
            }, LineEndTime-1000)


            drawLine.attr("stroke-dasharray", "20px" + " " + totalLength)
                .attr("stroke-dashoffset", totalLength)
                .transition()
                //time it takes to complete the line animation
                .duration(1 / (length / width) + length * 10)
                //.duration(length * 20)
                .attr("stroke-dashoffset", 20)

            setTimeout(function() {
                lineGroup.remove();
                // circles.remove();
            }, data.timeout * 1000 / 2 / 4)

        });

    } //ready

})();
