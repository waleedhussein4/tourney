import '../styles/Sidebar.css'
import search_icon from '/src/assets/search-icon.png'
import dropdown_button from '/src/assets/menu-down.svg'

function Sidebar() {
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
              <span className="selected"></span>
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
            <span>Min: </span>
            <span className="value-min"></span>
            <br />
            <span>Max: </span>
            <span className="value-max"></span>
          </div>
        </div>
        <div id="filter-type" className="filter" data-name="type">
          <span className="name">Type</span>
          <div className="radio">
            <div className="radio-item">
              <input id='radio-brackets' type="radio" name='type' value="Brackets" defaultChecked={true} readOnly={true} />
              <label htmlFor="radio-brackets">Brackets</label>
            </div>
            <div className="radio-item">
              <input id='radio-br' type="radio" name='type' value="Battle Royale" />
              <label htmlFor="radio-br">Battle Royale</label>
            </div>
          </div>
        </div>
        <ul>
          <li>tournament type</li>
          <li>public/private</li>
        </ul>
      </form>
    </div>
  )
}

export default Sidebar