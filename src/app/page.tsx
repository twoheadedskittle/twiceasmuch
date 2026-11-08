import { ExperienceLoader } from "@/components/ExperienceLoader";
import { SiteIndex } from "@/components/SiteIndex";

export default function Home() {
  return (
    <main className="room">
      <SiteIndex />
      <ExperienceLoader />
    </main>
  );
}
