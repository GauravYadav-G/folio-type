import { Cursor, ScrollBar, SmoothScroll } from "./lib/shell";
import Folio from "./Folio";

export default function App() {
  return (
    <>
      <SmoothScroll />
      <Cursor />
      <ScrollBar tone="#ff4a24" />
      <Folio />
    </>
  );
}
