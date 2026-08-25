import { beforeEach, describe, expect, it } from "vitest";
import { ERA_YEARS } from "../eras/eraConfig";
import { useEraStore } from "./eraStore";

describe("era store", () => {
  beforeEach(() => {
    useEraStore.setState({
      eraIndex: 0,
      audioEnabled: false,
      viewPreset: "default",
      playMode: false,
    });
  });

  it("starts on 1945 with audio off", () => {
    const s = useEraStore.getState();
    expect(s.eraIndex).toBe(0);
    expect(s.getEra().year).toBe(1945);
    expect(s.audioEnabled).toBe(false);
    expect(s.playMode).toBe(false);
  });

  it("clamps setEra into the six-stop range", () => {
    const { setEra } = useEraStore.getState();
    setEra(-3);
    expect(useEraStore.getState().eraIndex).toBe(0);
    setEra(99);
    expect(useEraStore.getState().eraIndex).toBe(ERA_YEARS.length - 1);
    setEra(3);
    expect(useEraStore.getState().getEra().year).toBe(2005);
  });

  it("next/prev wrap around the loop", () => {
    const store = useEraStore.getState;
    store().setEra(ERA_YEARS.length - 1);
    store().nextEra();
    expect(store().eraIndex).toBe(0);
    store().prevEra();
    expect(store().eraIndex).toBe(ERA_YEARS.length - 1);
  });

  it("toggles audio and play flags independently", () => {
    const { toggleAudio, togglePlay } = useEraStore.getState();
    toggleAudio();
    togglePlay();
    let s = useEraStore.getState();
    expect(s.audioEnabled).toBe(true);
    expect(s.playMode).toBe(true);
    toggleAudio();
    s = useEraStore.getState();
    expect(s.audioEnabled).toBe(false);
    expect(s.playMode).toBe(true);
  });

  it("stores view presets", () => {
    useEraStore.getState().setViewPreset("closeup");
    expect(useEraStore.getState().viewPreset).toBe("closeup");
  });
});
