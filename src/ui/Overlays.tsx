import EraInfoPanel from "./EraInfoPanel";
import TimelineSlider from "./TimelineSlider";
import ViewControls from "./ViewControls";

/** All semantic overlay UI lives OUTSIDE the Canvas (plan convention). */
export default function Overlays() {
  return (
    <div className="overlays">
      <TimelineSlider />
      <EraInfoPanel />
      <ViewControls />
    </div>
  );
}
