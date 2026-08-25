import PatronFigure from "./PatronFigure";

/**
 * Occupant placement: four regulars seated at the tables, the barista
 * behind the counter, one patron hovering by the music corner.
 */
const SPOTS: Array<{
  pos: [number, number, number];
  rotY: number;
  patronIndex: number;
  standing?: boolean;
}> = [
  { pos: [-3.2, 0, 2.62], rotY: Math.PI, patronIndex: 0 },
  { pos: [-2.16, 0, 1.6], rotY: -Math.PI / 2, patronIndex: 1 },
  { pos: [-0.42, 0, 3.58], rotY: Math.PI, patronIndex: 2 },
  { pos: [-1.42, 0, 2.6], rotY: Math.PI / 2, patronIndex: 0 },
  { pos: [6.32, 0, -1.95], rotY: -Math.PI / 2, patronIndex: 1, standing: true },
  { pos: [-5.3, 0, -4.15], rotY: 0.75, patronIndex: 2, standing: true },
];

export default function Patrons() {
  return (
    <group>
      {SPOTS.map((spot) => (
        <PatronFigure
          key={`${spot.pos[0]}:${spot.pos[2]}`}
          position={spot.pos}
          rotationY={spot.rotY}
          patronIndex={spot.patronIndex}
          standing={spot.standing}
        />
      ))}
    </group>
  );
}
