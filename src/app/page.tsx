import { HomeScreen } from "@/components/home/home-screen";
import { getHomepageViewData } from "@/lib/home/get-homepage-view-data";

export default async function Home() {
  const { isAuthenticated, role, eventDatetime } = await getHomepageViewData();

  return (
    <HomeScreen
      isAuthenticated={isAuthenticated}
      role={role}
      eventDatetime={eventDatetime}
    />
  );
}
