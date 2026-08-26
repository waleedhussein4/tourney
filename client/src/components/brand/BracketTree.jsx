/**
 * A full elimination tree, drawn as line work.
 *
 * The signature motif at its largest: used as a faint backdrop behind empty
 * states, the 404, and the home hero — never as content. It is generated rather
 * than hand-drawn so the geometry is exactly the one the bracket view uses.
 */

const COLUMN = 110
const ROW = 30
const TOP = 15

/** @returns {string[]} One `d` per connector, first round outwards. */
function connectors(entrants) {
  const paths = []
  let slots = Array.from({ length: entrants }, (_, index) => ({ x: 10, y: TOP + index * ROW }))

  while (slots.length > 1) {
    const next = []
    for (let i = 0; i < slots.length; i += 2) {
      const [upper, lower] = [slots[i], slots[i + 1]]
      const spine = upper.x + COLUMN * 0.62
      const middle = (upper.y + lower.y) / 2
      const out = upper.x + COLUMN

      // The two entrants folding into a spine, then the winner advancing.
      paths.push(`M${upper.x} ${upper.y}H${spine}V${lower.y}H${lower.x}`)
      paths.push(`M${spine} ${middle}H${out}`)
      next.push({ x: out, y: middle })
    }
    slots = next
  }

  return paths
}

/**
 * @param {object} props
 * @param {number} [props.entrants] A power of two.
 */
export function BracketTree({ entrants = 8, className = '', ...rest }) {
  const paths = connectors(entrants)
  const height = TOP * 2 + (entrants - 1) * ROW
  const width = 10 + COLUMN * Math.log2(entrants) + 20

  return (
    <svg
      className={className}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      aria-hidden="true"
      {...rest}
    >
      {paths.map((d) => (
        <path key={d} d={d} stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      ))}
      <circle cx={width - 20} cy={height / 2} r="3.5" fill="currentColor" />
    </svg>
  )
}
