import CarouselItems from './CarouselItems'

import '../styles/Carousel.css'

function Carousel(props) {
  return (
    <section className="carousel">
      <h2 className="categories__title">{props.title}</h2>
      <div className="carousel__container">
        <CarouselItems data={props.data} />
      </div>
    </section>
  )
}

export default Carousel