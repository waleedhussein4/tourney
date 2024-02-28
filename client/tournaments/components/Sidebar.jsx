import '../styles/Sidebar.css'
import search_icon from '/src/assets/search-icon.png'

function Sidebar() {
  return (
    <div id="sidebar">
      <form id='search' action="" method='get'>
        <input id='searchbar' type="search" placeholder='ID, title...' name='search' />
        <button type='submit'><img className='search_icon' src={search_icon} alt="" /></button>
      </form>
      <span>Filters</span>
      <ul>
        <li>category</li>
        <li>Entry fee</li>
        <li>tournament type</li>
        <li>public/private</li>
      </ul>
    </div>
  )
}

export default Sidebar