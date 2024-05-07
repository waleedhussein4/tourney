/* eslint-disable react/prop-types */
import '../styles/Sidebar.css'
import { useEffect, useState } from 'react'

function Sidebar({ setFilters }) {

  const [categories, setCategories] = useState([])

  const handleClick = () => {
    submitForm()
  }

  const getCategories = async () => {
    const URL = 'http://localhost:2000/api/tournement/getTournamentCategoriesWithImages'

    await fetch(URL)
      .then(res => res.json())
      .then(data => {
        setCategories(data)
      })
  }

  function getFilterFormData() {

    let search = document.getElementById('searchbar').value
    let category = document.getElementById('filter-category-input').value
    let minEntryFee = document.querySelector('.value-min').value
    let maxEntryFee = document.querySelector('.value-max').value
    let type = document.querySelector('#filter-type input[name="type"]:checked').value
    let accessibility = document.querySelector('#filter-accessibility input[name="accessibility"]:checked').value

    const urlParams = new URLSearchParams(window.location.search);

    urlParams.set('search', search)
    urlParams.set('category', category);
    urlParams.set('minEntryFee', minEntryFee);
    urlParams.set('maxEntryFee', maxEntryFee);
    urlParams.set('type', type);
    urlParams.set('accessibility', accessibility);

    window.location.search = urlParams;

  }

  function getFiltersFromURL() {
    let search = new URLSearchParams(window.location.search).get('search');
    let category = new URLSearchParams(window.location.search).get('category');
    let minEntryFee = new URLSearchParams(window.location.search).get('minEntryFee');
    let maxEntryFee = new URLSearchParams(window.location.search).get('maxEntryFee');
    let type = new URLSearchParams(window.location.search).get('type');
    let accessibility = new URLSearchParams(window.location.search).get('accessibility');

    if (!category) { category = "All" }
    if (!type) { type = "Any" }
    if (!accessibility) { accessibility = "Any" }

    let data = {
      "search": search,
      "category": category,
      "minEntryFee": minEntryFee,
      "maxEntryFee": maxEntryFee,
      "type": type,
      "accessibility": accessibility,
    }

    data = JSON.stringify(data, function (key, value) {
      if (!value) {
        return ''
      }
      return value
    });

    return JSON.parse(data)
  }

  function submitForm() {
    getFilterFormData()
  }

  function refillFiltersForm(urlFilters) {

    // searchbar
    let el_search = document.getElementById('searchbar')
    el_search.value = urlFilters.search

    // category
    if (urlFilters.category != "All") {
      let el_category = document.getElementById('filter-category-input')
      el_category.value = urlFilters.category
    }

    // entry fee
    document.querySelector('.value-min').value = urlFilters.minEntryFee
    document.querySelector('.value-max').value = urlFilters.maxEntryFee
    // type
    Array.from(document.querySelectorAll('#filter-type .radio-item')).forEach(e => {
      e.checked = false
    })

    function findType() {
      let items = document.querySelectorAll('#filter-type .radio-item')
      let target = undefined
      Array.from(items).forEach(item => {
        if (item.querySelector('input').value == urlFilters.type) {
          target = item.querySelector('input')
        }
      })
      return target
    }

    findType().checked = true

    // accessibility
    Array.from(document.querySelectorAll('#filter-type .radio-item')).forEach(e => {
      e.checked = false
    })

    function findAccessibility() {
      let items = document.querySelectorAll('#filter-accessibility .radio-item')
      let target = undefined
      Array.from(items).forEach(item => {
        if (item.querySelector('input').value == urlFilters.accessibility) {
          target = item.querySelector('input')
        }
      })
      return target
    }

    findAccessibility().checked = true

  }

  function hideCategorySearchResults() {
    let searchResults = document.getElementById('category-search-results')
    searchResults.style.display = 'none'
  }

  function showCategorySearchResults() {
    let searchResults = document.getElementById('category-search-results')
    if (searchResults.innerHTML && searchResults.innerHTML != '' && document.getElementById('filter-category-input').value) {
      searchResults.style.display = 'block'
    }
  }

  const getCategorySearchResults = async () => {

    // Function to calculate Jaro-Winkler distance between two strings
    function jaroWinklerDistance(s1, s2) {
      const prefixMatchScale = 0.1;
      const maxPrefixLength = 4;

      if (s1 === s2) return 1;

      const s1Length = s1.length;
      const s2Length = s2.length;
      const matchDistance = Math.floor(Math.max(s1Length, s2Length) / 2) - 1;

      const s1Matches = new Array(s1Length).fill(false);
      const s2Matches = new Array(s2Length).fill(false);

      let matches = 0;
      for (let i = 0; i < s1Length; i++) {
        const start = Math.max(0, i - matchDistance);
        const end = Math.min(i + matchDistance + 1, s2Length);

        for (let j = start; j < end; j++) {
          if (!s2Matches[j] && s1[i] === s2[j]) {
            s1Matches[i] = true;
            s2Matches[j] = true;
            matches++;
            break;
          }
        }
      }

      if (matches === 0) return 0;

      let transpositions = 0;
      let k = 0;
      for (let i = 0; i < s1Length; i++) {
        if (s1Matches[i]) {
          while (!s2Matches[k]) k++;
          if (s1[i] !== s2[k]) transpositions++;
          k++;
        }
      }

      const jaro = (matches / s1Length + matches / s2Length + (matches - transpositions / 2) / matches) / 3;

      const prefixLength = Math.min(maxPrefixLength, Math.min(s1Length, s2Length));
      let commonPrefix = 0;
      for (let i = 0; i < prefixLength; i++) {
        if (s1[i] === s2[i]) commonPrefix++;
        else break;
      }

      const jaroWinkler = jaro + commonPrefix * prefixMatchScale * (1 - jaro);

      return jaroWinkler;
    }

    // Function to find categories similar to the query using Jaro-Winkler distance
    function findSimilarCategories(query, categories, threshold) {
      return categories.filter(category => {
        const distance = jaroWinklerDistance(query.toLowerCase(), category.name.toLowerCase());
        return distance >= threshold;
      });
    }

    // Function to find best match for the query in categories
    function findBestMatch(query, categories, threshold) {
      const matches = categories.filter(category => {
        return category.name.toLowerCase().includes(query.toLowerCase());
      });

      if (matches.length === 0) {
        // If there's no exact match, try finding similar categories
        return findSimilarCategories(query, categories, threshold);
      }

      return matches;
    }

    let resultsDiv = document.getElementById('category-search-results');
    let input = document.getElementById('filter-category-input').value.toLowerCase();

    if (!categories || categories.length === 0) {
      resultsDiv.innerHTML = 'No results';
      return;
    }

    // Clear previous search results
    resultsDiv.innerHTML = '';

    // Find categories similar to the query
    const similarCategories = findBestMatch(input, categories, 0.7); // You can adjust the threshold as needed

    if (similarCategories.length === 0) {
      resultsDiv.innerHTML = 'No results';
      return;
    }

    Array.from(similarCategories).forEach(e => {
      let div = document.createElement('div')
      div.classList.add('category-search-result')
      div.addEventListener('click', () => {
        hideCategorySearchResults()
        document.getElementById('filter-category-input').value = e.name
        try {
          document.querySelector('.active-category').classList.remove('active-category')
        }
        catch (e) {
          console.log(e)
        }
        div.classList.add('active-category')
      })

      let imgDiv = document.createElement('div')
      imgDiv.classList.add('category-search-result-img')

      let img = document.createElement('img')
      img.src = e.image

      let p = document.createElement('p')
      p.innerHTML = e.name.charAt(0).toUpperCase() + e.name.slice(1);

      imgDiv.appendChild(img)
      div.appendChild(imgDiv)
      div.appendChild(p)
      resultsDiv.appendChild(div)
    })

    showCategorySearchResults()



  }

  function defaults() {
    document.getElementById('applyFilters').addEventListener('click', (e) => { e.preventDefault() })

    document.getElementById('filter-category-input').addEventListener('input', (e) => {

      if (!e.target.value) {
        hideCategorySearchResults()

        return
      }

      getCategorySearchResults()

    })

    document.getElementById('filter-category-input').addEventListener('focus', showCategorySearchResults)
  }

  useEffect(() => {
    defaults()

    let urlFilters = getFiltersFromURL()
    setFilters(urlFilters)
    refillFiltersForm(urlFilters)

    getCategories()
  }, [])

  return (
    <div id="sidebar">
      <span className='filters-header'>Search</span>
      <form id="filters">
        <div id='filter-search' className="filter" data-name="search">
          <span className="name">Search Tourneys</span>
          <input autoComplete='off' id='searchbar' type="search" placeholder='Title, description, game, ...' name='search' />
        </div>
        <div id='filter-category' className="filter" data-name="category">
          <span className="name">Category</span>
          <input autoComplete='off' onInput={getCategorySearchResults} id='filter-category-input' type="text" placeholder='Search' />
          <div id="category-search-results"></div>
        </div>
        <div id='filter-entryFee' className="filter" data-name="entryFee">
          <span className="name">Entry Fee</span>
          <div className="slider"></div>
          <div className="valueDisplay">
            <div className="minInput">
              <span>Minimum: </span>
              <input className="value-min" />
            </div>
            <div className="maxInput">
              <span>Maximum: </span>
              <input className="value-max" />
            </div>
          </div>
        </div>
        <div id="filter-type" className="filter" data-name="type">
          <span className="name">Tourney Type</span>
          <div className="radio">
            <div className="radio-item">
              <input id='radio-anyType' type="radio" name='type' value="Any" defaultChecked={true} readOnly={true} />
              <label htmlFor="radio-anyType">Any</label>
            </div>
            <div className="radio-item">
              <input id='radio-brackets' type="radio" name='type' value="Brackets" />
              <label htmlFor="radio-brackets">Brackets</label>
            </div>
            <div className="radio-item">
              <input id='radio-br' type="radio" name='type' value="Battle Royale" />
              <label htmlFor="radio-br">Battle Royale</label>
            </div>
          </div>
        </div>
        <div id="filter-accessibility" className="filter" data-name="accessibility">
          <span className="name">Accessibility</span>
          <div className="radio">
            <div className="radio-item">
              <input id='radio-anyAccessibility' type="radio" name='accessibility' value="Any" defaultChecked={true} readOnly={true} />
              <label htmlFor="radio-anyAccessibility">Any</label>
            </div>
            <div className="radio-item">
              <input id='radio-open' type="radio" name='accessibility' value="Open" />
              <label htmlFor="radio-open">Open</label>
            </div>
            <div className="radio-item">
              <input id='radio-app' type="radio" name='accessibility' value="Application Required" />
              <label htmlFor="radio-app">Application Required</label>
            </div>
          </div>
        </div>
        <button id='applyFilters' onClick={handleClick}>Apply</button>
      </form>
    </div>
  )
}



export default Sidebar