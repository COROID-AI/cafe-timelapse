import { getAllEraConfigs } from "../eras/eraConfig";
import { formatPrice } from "../eras/menus";
import { getProgram } from "../audio/musicPrograms";
import { useEraStore } from "../state/eraStore";

/** Display names for each music-source prop id (AC6 lineage). */
const SOURCE_NAMES: Record<string, string> = {
  "wireless-radio": "Valve wireless set",
  jukebox: "Seeburg-style jukebox",
  boombox: "Boombox & cassette deck",
  "ipod-dock": "iPod hi-fi dock",
  "smartphone-speaker": "Smart speaker + phone",
  "holographic-orb": "Holographic resonance orb",
};

/** Collapsible dossier of everything the selected era transforms. */
export default function EraInfoPanel() {
  const eraIndex = useEraStore((s) => s.eraIndex);
  const config = getAllEraConfigs()[eraIndex];
  const program = getProgram(config.musicProgramId);

  return (
    <aside className="panel info-panel">
      <details open>
        <summary>
          <strong>{config.year}</strong> · {config.label}
        </summary>

        <p className="tagline">{config.tagline}</p>

        <dl>
          <dt>Furniture</dt>
          <dd>{config.furnitureStyle}</dd>
          <dt>Coffee equipment</dt>
          <dd>{config.coffeeMachineKind}</dd>
          <dt>Counter tech</dt>
          <dd>{config.counterTechKind}</dd>
          <dt>Signage</dt>
          <dd>{config.signageStyle} — “{config.signageText}”</dd>
          <dt>Tableware</dt>
          <dd>{config.tablewareSet}</dd>
          <dt>Lighting</dt>
          <dd>{config.lighting.style}</dd>
          <dt>Music</dt>
          <dd>
            {SOURCE_NAMES[config.musicSourcePropId] ?? config.musicSourcePropId} ·{" "}
            {program.name}
          </dd>
        </dl>

        <h2 className="info-heading">Menu board</h2>
        <ul className="menu-list">
          {config.menuItems.map((item) => (
            <li key={item.name}>
              {item.name} <span>{formatPrice(item.price, config.year)}</span>
            </li>
          ))}
        </ul>

        <h2 className="info-heading">On the walls</h2>
        <ul className="poster-list">
          {config.posters.map((poster) => (
            <li key={poster.title}>
              “{poster.title}” <span>— {poster.artist}</span>
            </li>
          ))}
        </ul>

        <h2 className="info-heading">In the room</h2>
        <ul className="patron-list">
          {config.patrons.map((patron) => (
            <li key={patron.name}>
              <strong>{patron.name}</strong> ({patron.role})<br />
              {patron.outfit.label}; {patron.hairstyle}; carries{" "}
              {patron.gadget.toLowerCase()}
            </li>
          ))}
        </ul>
      </details>
    </aside>
  );
}
