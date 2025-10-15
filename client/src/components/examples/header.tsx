import { ThemeProvider } from "../theme-provider";
import { Header } from "../header";

export default function HeaderExample() {
  return (
    <ThemeProvider>
      <Header />
    </ThemeProvider>
  );
}
