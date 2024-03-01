import '../styles/Sidebar.css'
import search_icon from '/src/assets/search-icon.png'

function Sidebar() {
  return (
    <div id="sidebar">
      <form id='search' action="" method='get'>
        <input id='searchbar' type="search" placeholder='ID, title...' name='search' />
        <button type='submit'><img className='search_icon' src={search_icon} alt="" /></button>
      </form>
      <span className='filters-header'>Filters</span>
      <div id="filters">
        <div className="filter dropdown" data-name="category">
          <span className="name">Category</span>
          <div className="select">
              <span className="selected">Fortnite</span>
              <div className="imgContainer">
                <img src="/src/assets/menu-down.svg" alt="" />
              </div>
          </div>
          <ul className='menu category'>
            <li data-value="Coding">Coding</li>
            <li data-value="League of Legends">League of Legends</li>
            <li data-value="Poker">Poker</li>
            <li data-value="Chess">Chess</li>
            <li data-value="Fortnite" className="active">Fortnite</li>
            <li data-value="Football">Football</li>
          </ul>
        </div>
        <ul>
          <li>Entry fee</li>
          <li>tournament type</li>
          <li>public/private</li>
        </ul>
      </div>
    </div>
  )
}

export default Sidebar