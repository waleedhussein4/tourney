/*
 * The geometry behind each category card.
 *
 * One abstract composition per category, drawn on a 320x180 grid in the card's
 * hue. They are figures, not pictures: a shrinking ring for a battle royale, a
 * reticle for a tactical shooter, three converging lanes for a MOBA. Nothing
 * here depicts, quotes, or resembles any real game — there is no third-party
 * artwork anywhere in this repository, and this is the file that keeps it that
 * way.
 *
 * Every stroke paints in `currentColor`, which the card sets to its hue. The
 * slug-to-figure mapping lives in CategoryArt, so this file exports nothing
 * but components.
 */

const line = { stroke: 'currentColor', fill: 'none', strokeLinecap: 'round' }

/** A shrinking play zone. */
export const BattleRoyale = () => (
  <g {...line}>
    {[74, 56, 38, 20].map((r, index) => (
      <circle key={r} cx="228" cy="72" r={r} strokeWidth="1.5" opacity={0.28 + index * 0.16} />
    ))}
    <circle cx="228" cy="72" r="5" fill="currentColor" stroke="none" />
    {[
      [96, 34],
      [132, 118],
      [76, 92],
      [166, 40],
    ].map(([cx, cy]) => (
      <circle key={`${cx}`} cx={cx} cy={cy} r="2.5" fill="currentColor" stroke="none" opacity="0.5" />
    ))}
  </g>
)

/** A reticle on a sightline. */
export const TacticalShooter = () => (
  <g {...line} strokeWidth="1.6">
    <circle cx="226" cy="74" r="46" opacity="0.85" />
    <circle cx="226" cy="74" r="26" opacity="0.4" />
    <path d="M226 16v26M226 106v26M168 74h26M258 74h26" opacity="0.85" />
    <circle cx="226" cy="74" r="3.5" fill="currentColor" stroke="none" />
    <path d="M40 128h120l32-32" opacity="0.35" strokeDasharray="4 7" />
  </g>
)

/** Three lanes between two bases. */
export const Moba = () => (
  <g {...line} strokeWidth="1.8">
    {/* Top lane, middle lane, bottom lane. */}
    <path d="M48 138V50h216" opacity="0.8" />
    <path d="M48 138h216V50" opacity="0.8" />
    <path d="M48 138 264 50" opacity="0.55" strokeDasharray="7 9" />
    {[
      [104, 116],
      [160, 94],
      [208, 74],
    ].map(([cx, cy]) => (
      <circle key={cx} cx={cx} cy={cy} r="3" fill="currentColor" stroke="none" opacity="0.7" />
    ))}
    <circle cx="264" cy="50" r="8" fill="currentColor" stroke="none" />
    <circle cx="48" cy="138" r="8" fill="currentColor" stroke="none" opacity="0.55" />
  </g>
)

/** Two fighters closing, and the point of contact. */
export const Fighting = () => (
  <g {...line} strokeWidth="2.2">
    <path d="M104 30 156 82l-52 52" opacity="0.85" />
    <path d="M78 46 118 82l-40 36" opacity="0.4" />
    <path d="M252 30 200 82l52 52" opacity="0.85" />
    <path d="M278 46 238 82l40 36" opacity="0.4" />
    <path d="M172 60v-18M184 60v-18M178 116v18" opacity="0.7" strokeWidth="1.6" />
    <circle cx="178" cy="82" r="6" fill="currentColor" stroke="none" />
  </g>
)

/** A chicane, taken at speed. */
export const Racing = () => (
  <g {...line}>
    <path d="M28 122c56 0 44-84 104-84s52 84 116 84" strokeWidth="2.2" opacity="0.9" />
    <path d="M28 142c56 0 44-84 104-84s52 84 116 84" strokeWidth="1.4" opacity="0.35" />
    {[
      [24, 34, 84],
      [42, 52, 60],
      [60, 26, 46],
    ].map(([y, x, length]) => (
      <path key={y} d={`M${x} ${y}h${length}`} strokeWidth="2" opacity="0.5" />
    ))}
  </g>
)

/** Territory, on an isometric board. */
export const Strategy = () => (
  <g {...line} strokeWidth="1.5">
    {[0, 1, 2].map((row) =>
      [0, 1, 2].map((column) => {
        const x = 168 + (column - row) * 42
        const y = 52 + (column + row) * 22
        const filled = row === 1 && column === 1
        return (
          <path
            key={`${row}-${column}`}
            d={`M${x} ${y}l42 22-42 22-42-22z`}
            fill={filled ? 'currentColor' : 'none'}
            opacity={filled ? 0.55 : 0.4 + row * 0.12}
          />
        )
      })
    )}
  </g>
)

/** A floodlight over the terraces. */
export const SportsSim = () => (
  <g {...line} strokeWidth="1.6">
    <path d="M244 44 186 142h116z" opacity="0.18" fill="currentColor" stroke="none" />
    <path d="M244 44 186 142h116z" opacity="0.5" />
    <path d="M244 44v96" opacity="0.35" />
    <rect x="230" y="32" width="28" height="12" rx="3" opacity="0.9" />
    {[0, 1, 2].map((index) => (
      <path
        key={index}
        d={`M48 ${132 - index * 20}q52 -${18 + index * 6} 104 -${4 + index * 8}`}
        opacity={0.5 - index * 0.12}
      />
    ))}
  </g>
)

/** A hand, fanned. */
export const CardGame = () => (
  <g {...line} strokeWidth="1.8">
    {[-16, 0, 16].map((angle, index) => (
      <rect
        key={angle}
        x="196"
        y="34"
        width="62"
        height="92"
        rx="8"
        opacity={0.4 + index * 0.22}
        transform={`rotate(${angle} 227 128)`}
      />
    ))}
    <circle cx="227" cy="80" r="4" fill="currentColor" stroke="none" opacity="0.8" />
  </g>
)

/** A pitch, from above. */
export const Football = () => (
  <g {...line} strokeWidth="1.6">
    <rect x="146" y="26" width="152" height="112" rx="4" opacity="0.55" />
    <path d="M222 26v112" opacity="0.55" />
    <circle cx="222" cy="82" r="26" opacity="0.85" />
    <circle cx="222" cy="82" r="3.5" fill="currentColor" stroke="none" />
    <path d="M146 56h20v52h-20" opacity="0.4" />
    <path d="M298 56h-20v52h20" opacity="0.4" />
  </g>
)

/** A shot, from the arc. */
export const Basketball = () => (
  <g {...line} strokeWidth="1.8">
    <path d="M292 30v120" opacity="0.4" />
    <path d="M292 52h-30v76h30" opacity="0.5" />
    <path d="M262 50a60 60 0 0 0 0 80" opacity="0.9" />
    <circle cx="262" cy="90" r="5" fill="currentColor" stroke="none" />
    <path d="M64 140c14-72 108-102 194-56" opacity="0.45" strokeDasharray="5 9" />
    <circle cx="64" cy="140" r="9" opacity="0.9" />
    <path d="M55 140h18M64 131v18" opacity="0.5" strokeWidth="1.2" />
  </g>
)

/** A rally across the net. */
export const Tennis = () => (
  <g {...line} strokeWidth="1.6">
    <path d="M170 34h130l24 100H146z" opacity="0.5" />
    <path d="M158 90h150" opacity="0.85" strokeDasharray="5 6" />
    <path d="M182 62h108" opacity="0.35" />
    <path d="M170 118c48-64 96-64 140 0" opacity="0.7" strokeDasharray="4 8" />
    <circle cx="240" cy="72" r="5" fill="currentColor" stroke="none" />
  </g>
)

/** The net, and the ball going over it. */
export const Volleyball = () => (
  <g {...line} strokeWidth="1.5">
    <path d="M158 56h124v48H158z" opacity="0.6" />
    {[1, 2, 3, 4, 5].map((index) => (
      <path key={index} d={`M${158 + index * 20.6} 56v48`} opacity="0.3" />
    ))}
    {[1, 2].map((index) => (
      <path key={index} d={`M158 ${56 + index * 16}h124`} opacity="0.3" />
    ))}
    <path d="M220 142V56" opacity="0.5" />
    <path d="M62 130C84 56 152 34 214 44" opacity="0.7" strokeDasharray="4 8" />
    <circle cx="62" cy="130" r="7" fill="currentColor" stroke="none" />
  </g>
)

/** A knight's move. */
export const Chess = () => (
  <g {...line} strokeWidth="1.4">
    {[0, 1, 2, 3].map((row) =>
      [0, 1, 2, 3].map((column) => (
        <rect
          key={`${row}-${column}`}
          x={172 + column * 32}
          y={26 + row * 28}
          width="32"
          height="28"
          fill={(row + column) % 2 ? 'currentColor' : 'none'}
          opacity={(row + column) % 2 ? 0.22 : 0.45}
        />
      ))
    )}
    <path d="M188 124V68h64" strokeWidth="2.2" opacity="0.95" />
    <circle cx="188" cy="124" r="5" fill="currentColor" stroke="none" opacity="0.6" />
    <circle cx="252" cy="68" r="6" fill="currentColor" stroke="none" />
  </g>
)
