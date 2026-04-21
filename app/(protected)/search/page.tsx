import { SearchResults } from "@/features/search/search-results";
import { getDisplayTimeZone } from "@/server/display-settings-service";
import { searchResources } from "@/server/headscale-service";

export default async function SearchPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const results = query ? await searchResources(query) : {
    users: [],
    nodes: [],
    routes: [],
    preAuthKeys: [],
    apiKeys: []
  };
  const timeZone = await getDisplayTimeZone();

  return <SearchResults query={query} results={results} timeZone={timeZone} />;
}
