/* eslint-disable react/prop-types */
import '../styles/Sidebar.css'
import { useEffect } from 'react'

function Sidebar({tournaments, setTournaments, filters, setFilters, filteredTourneys, setFilteredTourneys}) {

  const handleClick = () => {
    submitForm()
  }

  useEffect(() => {
    if(filters.length == 0) return

    const filteredData = tournaments.filter( (tournament) => { 
      return (tournament.title.toLowerCase().includes(filters.search.toLowerCase()) || filters.search == '')
          && (tournament.category.toLowerCase() == filters.category.toLowerCase() || filters.category.toLowerCase() == "all")
          && (tournament.entryFee <= filters.entryFee.substring(filters.entryFee.indexOf(",")+1) || filters.entryFee.substring(filters.entryFee.indexOf(",")+1) == '')
          && (tournament.entryFee >= filters.entryFee.substring(0, filters.entryFee.indexOf(",")) || filters.entryFee.substring(0, filters.entryFee.indexOf(",")) == '')
          && (tournament.type.toLowerCase() == filters.type.toLowerCase() || filters.type.toLowerCase() == 'any')
          && (tournament.accessibility.toLowerCase() == filters.accessibility.toLowerCase() || filters.accessibility.toLowerCase() == 'any')
    })

    setFilteredTourneys(filteredData)
  }, [tournaments])

  useEffect(() => {
    defaults()

    let urlFilters = getFiltersFromURL()
    setFilters(urlFilters)
    refillFiltersForm(urlFilters)
  }, [])

  return (
    <div id="sidebar">
      <span className='filters-header'>Search</span>
      <form id="filters">
        <div id='filter-search' className="filter" data-name="search">
          <span className="name">Enter Tourney Name / ID</span>
          <input id='searchbar' type="search" placeholder='ID, title...' name='search' />
        </div>
        <div id='filter-category' className="filter" data-name="category">
          <span className="name">Category</span>
          <input id='filter-category-input' type="text" placeholder='Search' />
          <div id="category-search-results"></div>
        </div>
        <div id='filter-entryFee' className="filter" data-name="entryFee">
          <span className="name">Set Entry Fee</span>
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
          <span className="name">Select Tourney Type</span>
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
          <span className="name">Select Accessibility</span>
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

function getFilterFormData() {

  let search = document.getElementById('searchbar').value
  let category = document.getElementById('filter-category-input').value
  let entryFee = [document.querySelector('#filter-entryFee .value-min').value, document.querySelector('#filter-entryFee .value-max').value]
  let type = document.querySelector('#filter-type input[name="type"]:checked').value
  let accessibility = document.querySelector('#filter-accessibility input[name="accessibility"]:checked').value

  const urlParams = new URLSearchParams(window.location.search);

  urlParams.set('search', search)
  urlParams.set('category', category);
  urlParams.set('entryFee', entryFee);
  urlParams.set('type', type);
  urlParams.set('accessibility', accessibility);

  window.location.search = urlParams;

}

function getFiltersFromURL() {
  let search =  new URLSearchParams(window.location.search).get('search');
  let category =  new URLSearchParams(window.location.search).get('category');
  let entryFee =  new URLSearchParams(window.location.search).get('entryFee');
  let type =  new URLSearchParams(window.location.search).get('type');
  let accessibility =  new URLSearchParams(window.location.search).get('accessibility');

  if(!category) {category = "All"}
  if(!type) {type = "Any"}
  if(!accessibility) {accessibility = "Any"}

  let data = {
    "search" : search,
    "category" : category,
    "entryFee" : entryFee,
    "type" : type,
    "accessibility" : accessibility,
  }

  data = JSON.stringify(data, function (key, value) {
    if(!value) {
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
  if(urlFilters.category != "All") {
    let el_category = document.getElementById('filter-category-input')
    el_category.value = urlFilters.category
  }

  // entry fee
  document.querySelector('.value-min').value = urlFilters.entryFee.substring(0, urlFilters.entryFee.indexOf(","));
  document.querySelector('.value-max').value = urlFilters.entryFee.substring(urlFilters.entryFee.indexOf(",")+1);

  // type
  Array.from(document.querySelectorAll('#filter-type .radio-item')).forEach(e => {
    e.checked = false
  })
  
  function findType() {
    let items = document.querySelectorAll('#filter-type .radio-item')
    let target = undefined
    Array.from(items).forEach(item => {
      if(item.querySelector('input').value == urlFilters.type) {
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
      if(item.querySelector('input').value == urlFilters.accessibility) {
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
  if(searchResults.innerHTML && searchResults.innerHTML != '' && document.getElementById('filter-category-input').value) {
    searchResults.style.display = 'block'
  }
}

const getCategorySearchResults = async () => {

  const URL = 'https://api.npoint.io/6d1404adfb577cda1149'

  let results
  let resultsDiv = document.getElementById('category-search-results')
  let input = document.getElementById('filter-category-input')

  await fetch(URL)
  .then(res => res.json())
  .then(data => {
    results = data
    resultsDiv.innerHTML = ''

    if(!results) {
      resultsDiv.innerHTML = 'No results'
      return
    }
  
    Array.from(results).forEach(e => {
      if(!(e.name.toLowerCase().includes(input.value.toLowerCase()))) {
        return
      }
      let div = document.createElement('div')
      div.classList.add('category-search-result')
      div.addEventListener('click', () => {
        hideCategorySearchResults()
        document.getElementById('filter-category-input').value = e.name
        try {
          document.querySelector('.active-category').classList.remove('active-category')
        }
        catch(e) {
          console.log(e)
        }
        div.classList.add('active-category')
      })

      let imgDiv = document.createElement('div')
      imgDiv.classList.add('category-search-result-img')

      let img = document.createElement('img')
      img.src = e.img

      let p = document.createElement('p')
      p.innerHTML = e.name

      imgDiv.appendChild(img)
      div.appendChild(imgDiv)
      div.appendChild(p)
      resultsDiv.appendChild(div)
    })

    showCategorySearchResults()

  })



}

function defaults() {
  document.getElementById('applyFilters').addEventListener('click', (e) => { e.preventDefault() })

  document.getElementById('filter-category-input').addEventListener('input', (e) => {

    if(!e.target.value) {
      hideCategorySearchResults()

      return
    }

    getCategorySearchResults()

  })

  document.getElementById('filter-category-input').addEventListener('focus', showCategorySearchResults)
}

export default Sidebar