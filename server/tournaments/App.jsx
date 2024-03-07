import noUiSlider from 'nouislider'
import 'nouislider/dist/nouislider.css';

import '/src/styles/App.css'
import './styles/App.css'

import Nav from '/src/components/Nav'
import Sidebar from './components/Sidebar.jsx'
import Content from './components/Content.jsx'

import data from '/data/tournaments.json';

function App() {
  return (
    <>
      <Nav />
      <Sidebar />
      <Content
        data = {data}
      />
    </>
  )
}

export default App

window.addEventListener('load', onPageLoad)

function onPageLoad() {
  generateCategoryFilterDropdown()
  dropdownHandler()
  generateSliders()
}

function generateCategoryFilterDropdown() {
  let container = document.getElementById('filter-category')
  let list = container.querySelector('.menu')
  let selected = container.querySelector('.selected')

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
  return ["League of Legends", "Poker", "Chess", "Fortnite", "Football", "Coding"]
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

function generateSliders() {
  let entryFeeSlider = document.querySelector('#filter-entryFee .slider')
  let minDisplay = document.querySelector('#filter-entryFee .value-min')
  let maxDisplay = document.querySelector('#filter-entryFee .value-max')
  let max = getHighestEntryFee()
  noUiSlider.create(entryFeeSlider, {
    start: [0, max],
    connect: true,
    range: {
      'min': 0,
      'max': max
    }
  })
  entryFeeSlider.noUiSlider.on('update', () => {
    minDisplay.innerText = entryFeeSlider.noUiSlider.get()[0]
    maxDisplay.innerText = entryFeeSlider.noUiSlider.get()[1]
  })
}

function getFilterFormData() {

}

function getHighestEntryFee() {
  let highest = 0
  data.forEach(tourney => {
    if(tourney.entryFee > highest) {
      highest = tourney.entryFee
    }
  })
  return highest
}