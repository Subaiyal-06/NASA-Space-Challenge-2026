// SlotHost: shows one UI slot. Uses the plugged-in component if there is one, otherwise the
// placeholder. If the real component crashes, it falls back to the placeholder and reports a
// warning, so one bad module never takes the app down.
import React, { useEffect } from "react";
import Placeholder from "./Placeholder.jsx";
import { getSlotComponent } from "../integrations/resolve.js";
import { validateSlotProps } from "../contracts/ui.js";
import { reportWarning } from "./warnings.js";

class Boundary extends React.Component {
  state = { crashed: false };
  static getDerivedStateFromError() { return { crashed: true }; }
  componentDidCatch(error) { reportWarning(this.props.name, `Component crashed, showing placeholder: ${error?.message ?? error}`); }
  render() { return this.state.crashed ? this.props.fallback : this.props.children; }
}

/**
 * <SlotHost name="Timeline" year={1981} ... />   (all other props go to the slot)
 * `override` lets tests or the dev panel try a specific component without changing the registry.
 */
export default function SlotHost({ name, override, ...props }) {
  const Real = override ?? getSlotComponent(name);
  const problems = validateSlotProps(name, props).join("; ");
  useEffect(() => { if (problems) reportWarning(name, problems); }, [name, problems]);

  const fallback = <Placeholder name={name} props={props} note={problems ? `Prop problem: ${problems}` : undefined} />;
  if (!Real) return fallback;
  return (
    <Boundary name={name} fallback={fallback} key={Real.name || name}>
      <Real {...props} />
    </Boundary>
  );
}
