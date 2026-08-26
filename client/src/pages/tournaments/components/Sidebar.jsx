 
import '../styles/Sidebar.css'
import { useEffect, useState } from 'react'

function Sidebar({ setFilters }) {

  const [categories, setCategories] = useState([])

  const handleClick = () => {
    submitForm()
  }

  const getCategories = async () => {
    const response = await fetch('/api/tournaments/categories')
    if (!response.ok) return
    const data = await response.json()
    setCategories(data.categories)
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

  function defaults() {
    document.getElementById('applyFilters').addEventListener('click', (e) => { e.preventDefault() })


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
          <select id='filter-category-input' defaultValue="All">
            <option value="All">All categories</option>
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>{category.name}</option>
            ))}
          </select>
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