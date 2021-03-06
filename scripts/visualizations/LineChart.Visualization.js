define([
    "jquery",
    "underscore",
    "d3",
    "d3.tip",
    "text!app/templates/ProposalHover.Template.html"
], function(
    $,
    _,
    d3,
    tip,
    ProposalHoverTemplate
) {
    return function() {
        var chart, data, key,
            yMax = 0.08,
            yMin = 0,
            tickValues = [0, 0.04, 0.08],
            width = 250,
            height = 75,
            padding = {right: 35, left: 10, top: 15, bottom: 15},
            lines, circles, hoverCircles, x, y, reverseY, reverseX, line, drag,
            tip = d3.tip().attr('class', 'd3-tip')
                .direction("e")
                .style("pointer-events", "none")
                .html(function(d) {
                    return _.template(ProposalHoverTemplate, d); 
                }),
            moveTip = d3.tip().attr('class', 'd3-tip')
                .direction("e")
                .style("pointer-events", "none")
                .html(function(rate) {
                    return (rate * 100).toFixed(1) + "%"; 
                });

        function lineChart(selection) {
            x = d3.scale.linear()
                .domain([1, 4])
                .range([0, width - (padding.right + padding.left)]);
            y = d3.scale.linear()
                .domain([yMin, yMax])
                .range([height - (padding.top + padding.bottom), 0]);
            reverseY = d3.scale.linear()
                .domain([height - (padding.top + padding.bottom), 0])
                .range([yMin, yMax]);
            reverseX = d3.scale.linear()
                .domain([0, width - (padding.right + padding.left)])
                .range([1, 4]);
            line = d3.svg.line()
                    .x(function(d, i) {return x(d.year); })
                    .y(function(d, i) {return y(d.rate)});
            var yAxis = d3.svg.axis()
                    .scale(y).tickValues(tickValues)
                    .tickFormat(d3.format("%"))
                    .orient("right");

            chart = d3.select(selection).append("svg")
                .attr("width", width).attr("height", height);

            var axis = chart.append("g")
                .attr("class", "yAxis")
                .attr("transform", "translate(" + (width - padding.right) + "," + padding.top + ")")
                .call(yAxis);

            if (_.flatten(data).length > 0) {
                lines = chart.append("g")
                    .attr("class", "line")
                    .attr("transform", "translate(" + padding.left + "," + padding.top + ")")
                    .selectAll("path.line")
                    .data(data).enter().append("path")
                    .classed("line", true)
                    .attr("d", line)
                    .attr("fill", "none")
                    .attr("stroke", function(d) {return app.colors[_.chain(d).pluck("party").uniq().value()]; });

                circles = chart.append("g")
                    .attr("class", "circles")
                    .attr("transform", "translate(" + padding.left + "," + padding.top + ")")
                    .selectAll("circle.dot")
                    .data(_.flatten(data)).enter().append("circle")
                    .attr("class", "dot")
                    .attr("cx", function(d, i) {return x(d.year)})
                    .attr("cy", function(d) {return y(d.rate)})
                    .attr("r", 3)
                    .attr("fill", function(d) {return app.colors[d.party]});

                hoverCircles = chart.append("g")
                    .attr("class", "hoverCircles")
                    .attr("transform", "translate(" + padding.left + "," + padding.top + ")")
                    .selectAll("circle.dotHover")
                    .data(_.flatten(data)).enter().append("circle")
                    .attr("class", "dotHover")
                    .attr("cx", function(d, i) {return x(d.year)})
                    .attr("cy", function(d) {return y(d.rate)})
                    .attr("r", 10)
                    .call(tip)
                    .call(moveTip)
                    .on("mouseover", tip.show)
                    .on("mouseleave", tip.hide)
                    .call(drag);
            }
            

        }

        lineChart.update = function(duration) {
            duration = (duration !== undefined ? duration : 750)
            if (_.flatten(data).length > 0) {
                lines.data(data).transition().duration(duration).attr("d", line);
                chart.selectAll("g.line").selectAll("path.line")
                    .data(data).enter().append("path")
                    .classed("line", true)
                    .attr("d", line)
                    .attr("fill", "none")
                    .attr("stroke", function(d) {return app.colors[_.chain(d).pluck("party").uniq().value()]; });
                chart.selectAll("g.line").selectAll("path.line")
                    .data(data).exit().remove();
                lines = chart.selectAll("path.line");

                circles.data(_.flatten(data)).transition().duration(duration)
                    .attr("cx", function(d, i) {return x(d.year)})
                    .attr("cy", function(d) {return y(d.rate)});
                chart.selectAll("g.circles").selectAll("circle.dot")
                    .data(_.flatten(data)).enter().append("circle")
                    .attr("class", "dot")
                    .attr("cx", function(d, i) {return x(d.year)})
                    .attr("cy", function(d) {return y(d.rate)})
                    .attr("r", 3)
                    .attr("fill", function(d) {return app.colors[d.party]});
                chart.selectAll("g.circles").selectAll("circle.dot")
                    .data(_.flatten(data)).exit().remove();
                circles = chart.selectAll("circle.dot");

                hoverCircles.data(_.flatten(data)).transition().duration(duration)
                    .attr("cx", function(d, i) {return x(d.year)})
                    .attr("cy", function(d) {return y(d.rate)});
                chart.selectAll("g.hoverCircles").selectAll("circle.dotHover")
                    .data(_.flatten(data)).enter().append("circle")
                    .attr("class", "dotHover")
                    .attr("cx", function(d, i) {return x(d.year)})
                    .attr("cy", function(d) {return y(d.rate)})
                    .attr("r", 10);
                chart.selectAll("g.hoverCircles").selectAll("circle.dotHover")
                    .data(_.flatten(data)).exit().remove();
                hoverCircles = chart.selectAll("circle.dotHover")
                    .call(tip)
                    .call(moveTip)
                    .on("mouseover", tip.show)
                    .on("mouseleave", tip.hide)
                    .call(drag);

            } else {
                lines.remove();
                circles.remove();
                hoverCircles.remove();
            }
        }

        /* events */
        drag = d3.behavior.drag()
            .on("dragstart", function(d) {
                app.dragging = true;
            })
            .on("drag", function(d) {
                if (app.editable) {
                    var x = d.year - 1,
                        rate = reverseY(d3.event.y),
                        array = (d.party === "BART" ? data[0] : data[1]),
                        k = key + "," + d.party; 
                    rate = (rate < yMin ? yMin : rate);
                    rate = (rate > yMax ? yMax : rate);
                    d3.event.target = this;
                    moveTip.show(rate);

                    array = _.pluck(array, "rate");
                    array[x] = rate;
                    array = _.map(array, function(r) {return (r * 100).toFixed(1)});
                    
                    $(chart[0][0]).trigger("chart:update", [k, array]);

                }
            }).on("dragend", function(d) {
                app.dragging = false;
                $(chart[0][0]).trigger("updateURL");
                moveTip.hide(d);
            });

        lineChart.editing = function() {
            tip.style("display", "none");
            hoverCircles.style("cursor", "move");
        }

        lineChart.notEditing = function() {
            tip.style("display", "block");
            hoverCircles.style("cursor", "default");
        }

        /* getter/setters */
        lineChart.key = function(value) {
            if (!arguments.length) return key;
            key = value;
            return lineChart;
        }

        lineChart.data = function(value) {
            if (!arguments.length) return data;
            data = _.filter(value, function(array) {
                return array.length > 0;
            });
            return lineChart;
        }

        lineChart.yMax = function(value) {
            if (!arguments.length) return yMax;
            yMax = value;
            tickValues = [yMin, (yMin + yMax) / 2, yMax];
            return lineChart;
        }

        lineChart.yMin = function(value) {
            if (!arguments.length) return yMin;
            yMin = value;
            tickValues = [yMin, (yMin + yMax) / 2, yMax];
            return lineChart;
        }

        return lineChart;
    }
});