import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../app/globals.css";
import "../app/guardian.css";
import "../app/reading.css";
import Home from "../app/page";
import { FaqPage, LegalPage } from "./pages";
import type { LegalSlug } from "../lib/legal";

/* どの頁を描くかは、その頁の html が data-page で指定する */
const el = document.getElementById("root")!;
const page = el.dataset.page ?? "home";
const slug = el.dataset.slug as LegalSlug | undefined;

createRoot(el).render(
  <StrictMode>
    {page === "faq" ? <FaqPage />
      : page === "legal" && slug ? <LegalPage slug={slug} />
      : <Home />}
  </StrictMode>
);
