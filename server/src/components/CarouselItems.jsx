function CarouselItems(props) {

  let items = []

  Array.from(props.data).forEach(item => {
    console.log('item: ' + item)
    items.push(CarouselItem(item))
  })

  return (
    items
  )
}

function CarouselItem(data) {
  console.log(data)
  return (
    <a href={`/tournament/?UUID=${data.UUID}`}>
      <div className="carousel-item">
        <img
          className="carousel-item__img"
          src={data.image}
        />
        <div className="carousel-item__details">
          <div className="controls">
            <span className="fas fa-play-circle"></span>
            <span className="fas fa-plus-circle"></span>
          </div>
          <h5 className="carousel-item__details--title">{data.title}</h5>
          <h6 className="carousel-item__details--subtitle">{data.description}</h6>
        </div>
      </div>
    </a>
  )
}

export default CarouselItems