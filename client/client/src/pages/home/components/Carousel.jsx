import CarouselItems from './CarouselItems'

import '../styles/Carousel.css'

function Carousel({ data, title }) {
  return (
    <section className="carousel">
      <h2 className="categories__title">{title}</h2>
      <div className="carousel__container">
        <CarouselItems data={data} />
      </div>
    </section>
  )
}

export default Carousel