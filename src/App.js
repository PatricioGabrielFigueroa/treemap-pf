import './App.css';
import * as d3 from 'd3';
import { useRef, useEffect, useState } from 'react';

function App() {
  // eslint-disable-next-line
  const divRef = useRef(null);
  // eslint-disable-next-line
  const legendRef = useRef(null);
  const [ currentDataset, setCurrentDataset ] = useState('videogames');
  const [ title, setTitle ] = useState('VIDEO GAME SALES');
  const [ description, setDescription ] = useState('Top 100 Most Sold Games Grouped by Platform');
  const [ buttonText, setButtonText ] = useState('Change to Movies Data');
  const [ origin, setOrigin ] = useState('Platform:');

  const DATASET = {
    videogames: {
      TITLE: 'VIDEO GAME SALES',
      DESCRIPTION: 'Top 100 Most Sold Games Grouped by Platform',
      PATH: 'https://cdn.freecodecamp.org/testable-projects-fcc/data/tree_map/video-game-sales-data.json'
    },
    movies: {
      TITLE: 'MOVIE SALES',
      DESCRIPTION: 'Top Most Profitable Movies',
      PATH: 'https://cdn.freecodecamp.org/testable-projects-fcc/data/tree_map/movie-data.json'
    },
    kickstarter: {
      TITLE: 'Kickstarter Pledges',
      DESCRIPTION: 'Top 100 Most Pledged Kickstarter Campaigns Grouped By Category',
      PATH: 'https://cdn.freecodecamp.org/testable-projects-fcc/data/tree_map/kickstarter-funding-data.json'
    }
  };

  const toggleDataset = () => {
    setButtonText(prev => (prev === 'Change to Movies Data' ? 'Change to Kickstarters Data' : 'Change to Video Games Data'));
    setCurrentDataset(prev => (prev === 'videogames' ? 'movies' : 'kickstarter'));
    setTitle(prev => (prev === 'VIDEO GAME SALES' ? 'MOVIE SALES' : 'Kickstarter Pledges'));
    setDescription( 
      prev => (prev === 'Top 100 Most Sold Games Grouped by Platform' ? 'Top Most Profitable Movies' :
        'Top 100 Most Pledged Kickstarter Campaigns Grouped By Category'        
      )
    );
    setOrigin(prev => (prev === 'Platform:' ? 'Genre:' : 'Campaign Type:'));

    if (currentDataset === 'kickstarter') { // Restart the Cycle (go back to Video Games Data)
      setButtonText(prev => (prev === 'Change to Video Games Data' ? 'Change to Movies Data': 'Change to Kickstarters Data'));
      setCurrentDataset(prev => (prev === 'kickstarter' ? 'videogames' : 'movies'));
      setTitle(prev => (prev === 'Kickstarter Pledges' ? 'VIDEO GAME SALES' : 'MOVIE SALES'));
      setDescription( 
        prev => (prev === 'Top 100 Most Pledged Kickstarter Campaigns Grouped By Category' ? 'Top 100 Most Sold Games Grouped by Platform' : 
          'Top Most Profitable Movies'
        )
      );
      setOrigin(prev => (prev === 'Campaign Type:' ? 'Platform:' : 'Genre:'));
    }
  };

  const height = 600;
  const width = 1000;
  const margin = {
    top: 30,
    right: 32,
    bottom: 30,
    left: 32
  };
  // eslint-disable-next-line
  const innerHeight = height - margin.top - margin.bottom;
  const innerWidth = width - margin.left - margin.right;

  useEffect(() => {
    // Create svg, legend, tooltip
    const svg = d3.select(divRef.current).append('svg').attr('height', height).attr('width', width).style('border', '1px solid  black');
    const legendSvg = d3.select(legendRef.current).append('svg').attr('height', height / 7).attr('width', width);
    const legend = legendSvg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);
    const tooltip = d3.select('body').append('div').attr('class', 'tooltip');

    d3.json(DATASET[currentDataset].PATH)
    .then(d => {
      const root = d3.hierarchy(d)
      .sum(d => d.value)
      .sort((a, b) => b.value - a.value);

      const treemap = d3.treemap() // Setting the treemap
      .tile(d3.treemapSquarify) // treemapSliceDice for vertical order
      .size([width, height])
      .padding(1)
      .round(true);

      treemap(root); // Call treemap

      var cell = svg // Create leaves or cells
      .selectAll('g')
      .data(root.leaves())
      .enter()
      .append('g')
      .attr('class', 'group')
      .attr('transform', d => 'translate(' + d.x0 + ',' + d.y0 + ')');

      const categories = Array.from(new Set(root.leaves().map(d => d.data.category)));
      const color = d3.scaleOrdinal(categories, d3.schemeTableau10);
      // const color = d3.scaleOrdinal() --> Same result
      // .domain(categories)
      // .range(d3.schemeTableau10);

      const xScale = d3.scaleLinear()
      .domain([0, categories.length]) // Map from 0 to the number of categories
      .range([0, innerWidth]);

      legend.selectAll('rect').data(categories)
      .enter().append('rect')
      .attr('width', 10)
      .attr('height', 10)
      .attr('x', (d, i) => xScale(i) - 5)
      .attr('y', 10)
      .attr('fill', d => color(d)); 
    
        cell.append('rect')
          .attr('width', d => d.x1 - d.x0)
          .attr('height', d => d.y1 - d.y0)
          .attr('fill', d => color(d.data.category))
          .on('mousemove', (e, d) => { //mouseout also works perfectly fine
              tooltip.style('opacity', 0.9)
              .html(`Name: <b>${d.data.name}</b><br>Value: <b>${d.data.value}</b><br>${origin} <b>${d.data.category}</b>`)
              .style('left', (e.pageX + 10) + 'px')
              .style('top', (e.pageY + 10) + 'px')
          })
          .on('mouseout', (e, d) => {
            tooltip.style('opacity', 0)
          })

        cell.append('text') // Adding text in tspans within the rectangles/cells/leaves
          .selectAll("tspan")
          .data(d => d.data.name.split(/(?=[A-Z][a-z])|\s+/g)) // Split name and format value ".concat(d3.format(d.value))""
          .join("tspan")
          .attr("x", 3)
          .attr("y", (d, i, nodes) => `${1.1 + i * 0.9}em`) // (i === nodes.length - 1) * 0.01 +  --> Add a tiny offset at the last element
          .text(d => d)
          .attr('font-size', function(d, i, nodes) {
            const parentData = d3.select(nodes[i].parentNode).datum(); // Get the parent data (the rectangle)
            return Math.min(parentData.x1 - parentData.x0, parentData.y1 - parentData.y0) / 6; // Adjust font size based on rectangle size
            });

      // Create the x-axis
      const xAxis = d3.axisBottom(xScale)
      .tickFormat((d, i) => categories[i]) // Format ticks to show category names
      .ticks(categories.length); // Set the number of ticks

      // Append the axis to the legend
      legend.append('g')
      .attr('transform', `translate(0, 20)`) // Position the axis below the legend items
      .call(xAxis)
      .select('.domain')
      .remove();

      // Modify the tick text to use tspans for multi-word categories
      legend.selectAll('.tick text')
        .each(function(d, i) {
          const categoryName = categories[i]; // Get the category name
          const currentText = d3.select(this); // Select the current text element

          // Check if categoryName is valid (not null, undefined, or empty)
          if (categoryName) {
            const words = categoryName.split(/\s+/);// Split the category name into words
            currentText.text(null);  // Clear the text content of the tick, clear existing text and tspans before modifying
            currentText.selectAll('tspan') // Create new tspans for each word
              .data(words).enter()
              .append('tspan') // Append new tspans for each word
              .attr('x', 0) // Align all tspans to the same x position
              .attr('y', 11)
              .attr('dy', (d, j) => j === 0 ? 0 : '1.2em') // Add space between lines for multi-line text
              .text(d => d); // Set the text for each tspan
          }
        });
        
    legend.selectAll('line')
    .remove();
      // cell.append('title') // Append title here
      // .text(d => `Name: ${d.data.name}\nValue: ${d.data.value}\nPlatform: ${d.data.category}`); // Use newline for better formatting;
    });

    return () => {
      // eslint-disable-next-line
      d3.select(divRef.current).select('svg').remove();
      // eslint-disable-next-line
      d3.select(legendRef.current).select('svg').remove();
    }// eslint-disable-next-line
    // eslint-disable-next-line
  }, [currentDataset]);

  return (
    <div className="App">
      <button onClick={toggleDataset}>{buttonText}</button>
      <h1>{title}</h1>
      <h3>{description}</h3>
      <div ref={legendRef}></div>
      <div ref={divRef}></div>
    </div>
  );
}

export default App;
