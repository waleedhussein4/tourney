function CarouselItems({ data }) {
  return Array.from(data).map((item) => <CarouselItem key={item.id} data={item} />)
}

function CarouselItem({ data }) {
  return (
    <a href={`/tournament/${data.id}`}>
      <div className="carousel-item">
        <div className="carousel-item__img carousel-item__art" data-category={data.category}>
          <span>{data.category?.replace(/-/g, ' ')}</span>
        </div>
        <div className="carousel-item__details">
          <h5 className="carousel-item__details--title">{data.title}</h5>
          <h6 className="carousel-item__details--subtitle">
            {data.participantCount}/{data.maxCapacity} · {data.totalPrize} credits
          </h6>
        </div>
      </div>
    </a>
  )
}

export default CarouselItems