/* eslint-disable react/prop-types */
import '../styles/Sidebar.css'
import search_icon from '/src/assets/search-icon.png'
import dropdown_button from '/src/assets/menu-down.svg'
import { useEffect } from 'react'

function Sidebar({tournaments, setTournaments, filters, setFilters, filteredTourneys, setFilteredTourneys}) {

  // on submit button click
  const handleClick = () => {
    setFilters(getFilterFormData)
  }

  // on filters change
  useEffect(() => {
    const filteredData = () => {
      return tournaments.filter( (tournament) => {      
        return (tournament.category.toLowerCase() == filters.category.toLowerCase() || filters.category.toLowerCase() == "all")
            && (tournament.entryFee <= filters.entryFee[1] || filters.entryFee[1] == '')
            && (tournament.entryFee >= filters.entryFee[0] || filters.entryFee[0] == '')
            && (tournament.type.toLowerCase() == filters.type.toLowerCase() || filters.type.toLowerCase() == 'any')
            && (tournament.accessibility.toLowerCase() == filters.accessibility.toLowerCase() || filters.accessibility.toLowerCase() == 'any')
      })
    }

    setFilteredTourneys(filteredData)
  }, [filters])

  // on sidebar load
  useEffect(() => {
    generateCategoryFilterDropdown()
    dropdownHandler()
    defaults()
  }, [])

  return (
    <div id="sidebar">
      <form id='search' action="" method='get'>
        <input id='searchbar' type="search" placeholder='ID, title...' name='search' />
        <button type='submit'><img className='search_icon' src={search_icon} alt="" /></button>
      </form>
      <span className='filters-header'>Filters</span>
      <form id="filters">
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
              <input id='radio-anyType' type="radio" name='type' value="any" defaultChecked={true} readOnly={true} />
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
              <input id='radio-anyAccessibility' type="radio" name='accessibility' value="any" defaultChecked={true} readOnly={true} />
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

function getHighestEntryFee(tournaments) {
  let highest = 0
  tournaments.forEach(tourney => {
    if(tourney.entryFee > highest) {
      highest = tourney.entryFee
    }
  })
  return highest
}


function getFilterFormData() {

  const data = {
    "category" : document.querySelector('#filter-category .active').innerText,
    "entryFee" : [document.querySelector('#filter-entryFee .value-min').value, document.querySelector('#filter-entryFee .value-max').value],
    "type" : document.querySelector('#filter-type input[name="type"]:checked').value,
    "accessibility" : document.querySelector('#filter-accessibility input[name="accessibility"]:checked').value,
  }
  
  return data

}

function defaults() {
  document.getElementById('applyFilters').addEventListener('click', (e) => { e.preventDefault() })
  document.querySelector('#search button').addEventListener('click', (e) => { e.preventDefault() })
}

export default Sidebar