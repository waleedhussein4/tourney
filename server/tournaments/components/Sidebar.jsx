/* eslint-disable react/prop-types */
import '../styles/Sidebar.css'
import dropdown_button from '/src/assets/menu-down.svg'
import { useEffect } from 'react'

// load > getParams > getTourneys > Display > filter tourneys

function Sidebar({tournaments, setTournaments, filters, setFilters, filteredTourneys, setFilteredTourneys}) {

  // on submit button click
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

  // on sidebar load
  useEffect(() => {
    generateCategoryFilterDropdown()
    dropdownHandler()
    defaults()

    let urlFilters = getFiltersFromURL()
    console.log(urlFilters)
    setFilters(urlFilters)
    refillFiltersForm(urlFilters)
  }, [])

  return (
    <div id="sidebar">
      <span className='filters-header'>Search</span>
      <form id="filters">
        <div id='filter-search' className="filter" data-name="search">
          <span className="name">Search</span>
          <input id='searchbar' type="search" placeholder='ID, title...' name='search' />
        </div>
        <div id='filter-category' className="filter dropdown" data-name="category">
          <span className="name">Category</span>
          <div className="select">
            <div className="selected-wrapper">
              <span className="selected"></span>
            </div>
            <div className="imgContainer">
              <img src={dropdown_button} alt="" />
            </div>
          </div>
          <ul className='menu category'></ul>
        </div>
        <div id='filter-entryFee' className="filter" data-name="entryFee">
          <span className="name">Entry Fee</span>
          <div className="slider"></div>
          <div className="valueDisplay">
            <div className="minInput">
              <span>Min: </span>
              <input className="value-min" />
            </div>
            <div className="maxInput">
              <span>Max: </span>
              <input className="value-max" />
            </div>
          </div>
        </div>
        <div id="filter-type" className="filter" data-name="type">
          <span className="name">Type</span>
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

function generateCategoryFilterDropdown() {
  let container = document.getElementById('filter-category')
  let list = container.querySelector('.menu')
  let selected = container.querySelector('.selected')

  let all = document.createElement('li')
  all.setAttribute("data-value", "All")
  all.innerHTML = "All"
  list.appendChild(all)

  let categories = api_getCategories()
  categories.forEach(category => {
    let li = document.createElement('li')
    li.setAttribute("data-value", category)
    li.innerHTML = category

    list.appendChild(li)
  })

  let first = list.childNodes[0]
  selected.innerText = first.innerText
  first.classList.add('active')
}

function api_getCategories() {
  return ["Fortnite", "Football", "Baskbetball", "Counter Strike", "Valorant", "League of Legends", "Tennis"]
}

function dropdownHandler() {
  let dropdowns = document.querySelectorAll(".dropdown")

  Array.from(dropdowns).forEach(dropdown => {
    let name = dropdown.dataset.name
    let select = dropdown.querySelector('.select')
    select.addEventListener('click', () => { toggledropdown(name) } )

    Array.from(dropdown.querySelectorAll('.menu li')).forEach(option => {
      option.addEventListener('click', () => {
        let value = option.dataset.value
        let selected = dropdown.querySelector('.selected')
        let active = dropdown.querySelector('.active')
        active.classList.remove('active')
        option.classList.add('active')
        selected.innerText = value
        toggledropdown(name)
      })
    })
  })
}

function toggledropdown(name) {
  let menu = document.querySelector(".menu." + name)
  let display = window.getComputedStyle(menu).display
  if(display == "none") {
    menu.style.display = "block"
  }
  else {
    menu.style.display = "none"
  }
}

function getFilterFormData() {

  let search = document.getElementById('searchbar').value
  let category = document.querySelector('#filter-category .active').innerText
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
  let el_category_selected = document.querySelector('#filter-category .selected')
  el_category_selected.innerHTML = urlFilters.category
  document.querySelector('.active').classList.remove('active')

  function findCategory() {
    let items = document.querySelectorAll('.menu li')
    let target = undefined
    Array.from(items).forEach(item => {
      if(item.dataset.value == urlFilters.category) {
        target = item
      }
    })
    return target
  }

  findCategory().classList.add('active')

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

function defaults() {
  document.getElementById('applyFilters').addEventListener('click', (e) => { e.preventDefault() })
}

export default Sidebar