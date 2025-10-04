// URL to fetch Cameroon Internet Penetration data from World Bank API
const url = 'https://api.worldbank.org/v2/country/CM/indicator/IT.NET.USER.ZS?format=json&per_page=500';

const chartContainer = document.getElementById('chart');
const padding = 60;
let dataset = [];

// Safe chart width
function getChartWidth() {
  const containerWidth = chartContainer.offsetWidth || 0;
  return Math.max(containerWidth > 900 ? 900 : containerWidth - 20, 300);
}

function drawChart(data) {
  const w = getChartWidth();
  const h = 450;

  // Clear previous chart
  d3.select('#chart').selectAll('*').remove();

  const svg = d3.select('#chart')
    .append('svg')
    .attr('width', w)
    .attr('height', h);

  // Scales
  const xScale = d3.scaleTime()
    .domain([new Date(data[data.length-1][0]), new Date(data[0][0])])
    .range([padding, w - padding]);

  const yScale = d3.scaleLinear()
    .domain([0, 100]) // Internet penetration % max 100
    .range([h - padding, padding]);

  // Axes
  const xAxis = d3.axisBottom(xScale).ticks(10).tickFormat(d3.timeFormat('%Y'));
  const yAxis = d3.axisLeft(yScale).ticks(10).tickFormat(d => d + '%');

  svg.append('g')
    .attr('id', 'x-axis')
    .attr('transform', `translate(0, ${h - padding})`)
    .call(xAxis);

  svg.append('g')
    .attr('id', 'y-axis')
    .attr('transform', `translate(${padding}, 0)`)
    .call(yAxis);

  // Axis Labels
  svg.append('text')
    .attr('x', w / 2)
    .attr('y', h - 15)
    .attr('text-anchor', 'middle')
    .attr('font-size', '14px')
    .text('Year');

  svg.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -h / 2)
    .attr('y', 20 - padding) // moves label left of tick numbers
    .attr('text-anchor', 'middle')
    .attr('font-size', '14px')
    .text('Internet Users (%)');

  const tooltip = d3.select('#tooltip');

  // Draw scatter points
  svg.selectAll('circle')
    .data(data)
    .enter()
    .append('circle')
    .attr('cx', d => xScale(new Date(d[0])))
    .attr('cy', d => yScale(d[1]))
    .attr('r', 6)
    .attr('data-year', d => d[0])
    .attr('data-value', d => d[1])
    .on('mouseover', (event, d) => {
      tooltip.style('opacity', 1)
        .html(`<strong>${d[0]}</strong><br>${d[1].toFixed(1)}%`)
        .attr('data-year', d[0])
        .style('left', event.pageX + 15 + 'px')
        .style('top', event.pageY - 40 + 'px');
    })
    .on('mouseout', () => tooltip.style('opacity', 0));

  // Trend line (linear regression)
  const xSeries = data.map(d => new Date(d[0]).getTime());
  const ySeries = data.map(d => d[1]);
  const lr = linearRegression(ySeries, xSeries);

  const trendLine = d3.line()
    .x(d => xScale(new Date(d[0])))
    .y(d => yScale(lr.intercept + lr.slope * new Date(d[0]).getTime()));

  svg.append('path')
    .datum(data)
    .attr('class', 'trendline')
    .attr('d', trendLine)
    .attr('stroke', 'red')
    .attr('stroke-width', 2)
    .attr('fill', 'none');
}

// Linear Regression function
function linearRegression(y, x) {
  const n = y.length;
  const sumX = x.reduce((a,b) => a+b,0);
  const sumY = y.reduce((a,b) => a+b,0);
  const sumXY = x.reduce((a,b,i) => a + b*y[i],0);
  const sumXX = x.reduce((a,b) => a + b*b,0);
  const slope = (n*sumXY - sumX*sumY)/(n*sumXX - sumX*sumX);
  const intercept = (sumY - slope*sumX)/n;
  return {slope, intercept};
}

// Fetch Data
document.addEventListener('DOMContentLoaded', () => {
  fetch(url)
    .then(res => res.json())
    .then(data => {
      dataset = data[1]
        .filter(d => d.value !== null)
        .map(d => [d.date, d.value]); // [year, %]
      drawChart(dataset);
    })
    .catch(err => console.error('Error fetching data:', err));

  window.addEventListener('resize', () => {
    if (dataset.length) drawChart(dataset);
  });
});
