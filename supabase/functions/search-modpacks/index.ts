const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SearchParams {
  query: string;
  versions: string[];
  genres: string[];
  loaders: string[];
  limit: number;
  offset: number;
  platform: "modrinth" | "curseforge" | "all";
}

interface PlatformTotals {
  modrinth: number;
  curseforge: number;
}

interface NormalizedModpack {
  id: string;
  name: string;
  slug: string;
  description: string;
  long_description: string;
  author: string;
  loader: string;
  minecraft_versions: string[];
  genres: string[];
  tags: string[];
  performance_impact: string;
  difficulty: string;
  mod_count: number;
  downloads: number;
  rating: number;
  image_url: string | null;
  download_url: string | null;
  wiki_url: string | null;
  featured: boolean;
  platform: "modrinth" | "curseforge";
  external_url: string;
}

// Our internal genre name -> Modrinth API category slug
const MODRINTH_GENRE_MAP: Record<string, string> = {
  "kitchen-sink": "kitchen-sink",
  "tech": "technology",
  "magic": "magic",
  "adventure": "adventure",
  "rpg": "adventure",
  "vanilla-plus": "optimization",
  "skyblock": "adventure",
  "hardcore": "challenging",
  "quests": "quests",
  "optimization": "optimization",
  "lightweight": "lightweight",
  "multiplayer": "multiplayer",
  "combat": "combat",
  "exploration": "adventure",
  "challenging": "challenging",
  "sci-fi": "adventure",
  "horror": "adventure",
  "mini-game": "adventure",
  "map-based": "adventure",
  "expert": "challenging",
};

// Modrinth API slug -> our internal genre name (reverse mapping for normalizing results)
const MODRINTH_REVERSE_MAP: Record<string, string> = {
  "kitchen-sink": "kitchen-sink",
  "technology": "tech",
  "magic": "magic",
  "adventure": "adventure",
  "optimization": "optimization",
  "lightweight": "lightweight",
  "multiplayer": "multiplayer",
  "combat": "combat",
  "quests": "quests",
  "challenging": "challenging",
};

// Our internal genre name -> CurseForge category ID
const CURSEFORGE_CATEGORY_MAP: Record<string, number> = {
  "tech": 4472,
  "magic": 4473,
  "adventure": 4475,
  "rpg": 4475,
  "hardcore": 4479,
  "skyblock": 4736,
  "quests": 4478,
  "multiplayer": 4484,
  "combat": 4483,
  "exploration": 4476,
  "sci-fi": 4474,
  "horror": 7418,
  "mini-game": 4477,
  "map-based": 4480,
  "expert": 9243,
  "vanilla-plus": 5128,
  "lightweight": 4481,
};

// CurseForge category slug -> our internal genre name (for normalizing results)
const CURSEFORGE_SLUG_MAP: Record<string, string> = {
  "tech": "tech",
  "magic": "magic",
  "adventure-and-rpg": "adventure",
  "hardcore": "hardcore",
  "skyblock": "skyblock",
  "quests": "quests",
  "multiplayer": "multiplayer",
  "combat-pvp": "combat",
  "exploration": "exploration",
  "sci-fi": "sci-fi",
  "horror": "horror",
  "mini-game": "mini-game",
  "map-based": "map-based",
  "expert": "expert",
  "vanilla": "vanilla-plus",
  "small-light": "lightweight",
};

const CURSEFORGE_GAME_ID = 432;
const CURSEFORGE_CLASS_ID_MODPACK = 4471;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const queryParams = url.searchParams;

    const platformParam = (queryParams.get("platform") as "modrinth" | "curseforge" | "all") || "all";
    const limit = Math.min(parseInt(queryParams.get("limit") || "50"), 100);
    const offset = parseInt(queryParams.get("offset") || "0");

    // Page number for external APIs (1-indexed for Modrinth, CurseForge uses index)
    const modrinthPage = Math.floor(offset / 50) + 1;
    const curseforgeIndex = offset;

    const params: SearchParams = {
      query: queryParams.get("query") || "",
      versions: queryParams.getAll("versions"),
      genres: queryParams.getAll("genres"),
      loaders: queryParams.getAll("loaders"),
      limit,
      offset,
      platform: platformParam,
    };

    const results: NormalizedModpack[] = [];
    const totals: PlatformTotals = { modrinth: 0, curseforge: 0 };
    const shouldFetchModrinth = params.platform === "all" || params.platform === "modrinth";
    const shouldFetchCurseForge = params.platform === "all" || params.platform === "curseforge";

    const promises: Promise<void>[] = [];

    if (shouldFetchModrinth) {
      promises.push(fetchModrinth(params, results, modrinthPage, totals));
    }

    if (shouldFetchCurseForge) {
      promises.push(fetchCurseForge(params, results, curseforgeIndex, totals));
    }

    await Promise.all(promises);

    results.sort((a, b) => b.downloads - a.downloads);

    const sliced = results.slice(0, params.limit);

    return new Response(
      JSON.stringify({ results: sliced, total: results.length, totals }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to search modpacks", details: String(err) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function fetchModrinth(params: SearchParams, results: NormalizedModpack[], page: number, totals: PlatformTotals): Promise<void> {
  try {
    const facets: string[][] = [["project_type:modpack"]];

    if (params.loaders.length > 0) {
      facets.push(params.loaders.map((l) => `categories:${l.toLowerCase()}`));
    }

    if (params.versions.length > 0) {
      facets.push(params.versions.map((v) => `versions:${v}`));
    }

    // Build genre facets: map each internal genre to Modrinth slug(s), OR them together
    if (params.genres.length > 0) {
      const genreFacets: string[] = [];
      for (const g of params.genres) {
        const modrinthSlug = MODRINTH_GENRE_MAP[g];
        if (modrinthSlug) {
          genreFacets.push(`categories:${modrinthSlug}`);
        }
      }
      if (genreFacets.length > 0) {
        facets.push(genreFacets);
      }
    }

    const searchUrl = new URL("https://api.modrinth.com/v2/search");
    if (params.query) {
      searchUrl.searchParams.set("query", params.query);
    }
    searchUrl.searchParams.set("facets", JSON.stringify(facets));
    searchUrl.searchParams.set("limit", "50");
    searchUrl.searchParams.set("index", "downloads");
    searchUrl.searchParams.set("page", String(page - 1));

    const response = await fetch(searchUrl.toString(), {
      headers: {
        "User-Agent": "UltimateModpackBrowser/1.0",
      },
    });

    if (!response.ok) {
      console.error(`Modrinth API error: ${response.status}`);
      return;
    }

    const data = await response.json();
    const hits = data.hits || [];
    totals.modrinth = (data.total_hits || hits.length) as number;

    const loaderSlugs = ["forge", "fabric", "quilt", "neoforge"];

    for (const hit of hits) {
      const loaders = (hit.categories || []).filter((c: string) =>
        loaderSlugs.includes(c.toLowerCase())
      );

      const primaryLoader = loaders.length > 0
        ? loaders[0].charAt(0).toUpperCase() + loaders[0].slice(1)
        : "Unknown";

      // Normalize Modrinth categories to our internal genre names
      const genres = (hit.categories || [])
        .filter((c: string) => !loaderSlugs.includes(c.toLowerCase()))
        .map((c: string) => MODRINTH_REVERSE_MAP[c] || c);

      const versions = hit.versions || [];

      results.push({
        id: `modrinth_${hit.project_id}`,
        name: hit.title || "Unknown",
        slug: hit.slug || hit.project_id,
        description: hit.description || "",
        long_description: hit.description || "",
        author: hit.author || "Unknown",
        loader: primaryLoader,
        minecraft_versions: versions,
        genres: genres.length > 0 ? genres : ["kitchen-sink"],
        tags: (hit.display_categories || []).slice(0, 8),
        performance_impact: "Medium",
        difficulty: "Normal",
        mod_count: 0,
        downloads: hit.downloads || 0,
        rating: Math.min(((hit.follows || 0) / 1000) * 0.5 + 3, 5),
        image_url: hit.icon_url || null,
        download_url: null,
        wiki_url: null,
        featured: false,
        platform: "modrinth",
        external_url: `https://modrinth.com/modpack/${hit.slug}`,
      });
    }
  } catch (err) {
    console.error("Modrinth fetch error:", err);
  }
}

async function getCurseForgeKey(): Promise<string | null> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) return null;

  try {
    const resp = await fetch(`${supabaseUrl}/rest/v1/app_config?select=value&key=eq.curseforge_api_key`, {
      headers: {
        "apikey": serviceRoleKey,
        "Authorization": `Bearer ${serviceRoleKey}`,
      },
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    return data.length > 0 ? data[0].value : null;
  } catch {
    return null;
  }
}

async function fetchCurseForge(params: SearchParams, results: NormalizedModpack[], index: number, totals: PlatformTotals): Promise<void> {
  const curseforgeKey = await getCurseForgeKey();
  if (!curseforgeKey) {
    console.log("CurseForge API key not configured, skipping");
    return;
  }

  try {
    const searchUrl = new URL("https://api.curseforge.com/v1/mods/search");
    searchUrl.searchParams.set("gameId", CURSEFORGE_GAME_ID.toString());
    searchUrl.searchParams.set("classId", CURSEFORGE_CLASS_ID_MODPACK.toString());
    if (params.query) {
      searchUrl.searchParams.set("searchFilter", params.query);
    }
    searchUrl.searchParams.set("pageSize", "50");
    searchUrl.searchParams.set("sortField", "2");
    searchUrl.searchParams.set("sortOrder", "desc");
    searchUrl.searchParams.set("index", String(index));

    if (params.versions.length > 0) {
      searchUrl.searchParams.set("gameVersion", params.versions[0]);
    }

    if (params.loaders.length > 0) {
      const modLoaderMap: Record<string, number> = {
        "Forge": 1,
        "Fabric": 4,
        "Quilt": 5,
        "NeoForge": 6,
      };
      const loaderId = modLoaderMap[params.loaders[0]];
      if (loaderId) {
        searchUrl.searchParams.set("modLoaderType", loaderId.toString());
      }
    }

    if (params.genres.length > 0) {
      const categoryId = CURSEFORGE_CATEGORY_MAP[params.genres[0]];
      if (categoryId) {
        searchUrl.searchParams.set("categoryId", categoryId.toString());
      }
    }

    const response = await fetch(searchUrl.toString(), {
      headers: {
        "x-api-key": curseforgeKey,
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      console.error(`CurseForge API error: ${response.status}`);
      return;
    }

    const data = await response.json();
    const mods = data.data || [];
    totals.curseforge = (data.pagination?.totalCount || mods.length) as number;

    for (const mod of mods) {
      const loaders = (mod.modLoaders || []).map((l: any) => l.name);
      const primaryLoader = loaders.length > 0 ? loaders[0] : "Unknown";

      // Normalize CurseForge category slugs to our internal genre names
      // Keep all subcategories — only filter out the root "Modpacks" class category
      const genres = (mod.categories || [])
        .filter((c: any) => !c.isClass && c.classId === CURSEFORGE_CLASS_ID_MODPACK)
        .map((c: any) => CURSEFORGE_SLUG_MAP[c.slug] || c.slug || c.name);

      const versions = (mod.latestFilesIndexes || []).map((f: any) => f.gameVersion);

      const thumb = mod.logo?.thumbnailUrl || mod.logo?.url || null;
      const description = mod.summary || "";
      const longDesc = mod.description || description;

      results.push({
        id: `curseforge_${mod.id}`,
        name: mod.name || "Unknown",
        slug: mod.slug || String(mod.id),
        description,
        long_description: longDesc,
        author: mod.authors?.map((a: any) => a.name).join(", ") || "Unknown",
        loader: primaryLoader,
        minecraft_versions: versions.length > 0 ? versions : ["Unknown"],
        genres: genres.length > 0 ? genres : ["kitchen-sink"],
        tags: (mod.categories || []).slice(0, 8).map((c: any) => c.slug || c.name),
        performance_impact: "Medium",
        difficulty: "Normal",
        mod_count: 0,
        downloads: mod.downloadCount || 0,
        rating: Math.min(((mod.rating || 0) / 20), 5),
        image_url: thumb,
        download_url: null,
        wiki_url: mod.websiteUrl || null,
        featured: mod.isFeatured || false,
        platform: "curseforge",
        external_url: mod.websiteUrl || `https://www.curseforge.com/minecraft/modpacks/${mod.slug}`,
      });
    }
  } catch (err) {
    console.error("CurseForge fetch error:", err);
  }
}
