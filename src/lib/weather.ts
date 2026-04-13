// =============================================================================
// NaKmetiji.si — Weather Utilities
// Open-Meteo API (free, no key required) + WMO weather code mappings
// =============================================================================

export interface CurrentWeather {
  temp: number;           // °C rounded
  feelsLike: number;      // °C rounded
  humidity: number;       // %
  windSpeed: number;      // km/h rounded
  windDir: number;        // degrees
  precipitation: number;  // mm last hour
  uvIndex: number;        // rounded
  code: number;           // WMO weather code
  emoji: string;
  label: string;
  isGood: boolean;        // "good weather" flag
}

export interface DayForecast {
  date: string;           // ISO date YYYY-MM-DD
  code: number;
  emoji: string;
  label: string;
  tempMax: number;
  tempMin: number;
  precipProb: number;     // %
  precipSum: number;      // mm
}

export interface WeatherData {
  current: CurrentWeather;
  daily: DayForecast[];
  fetchedAt: number;
}

// ─── WMO weather code table (Slovenian labels) ─────────────────────────────

const WMO: Record<number, { emoji: string; label: string; good: boolean }> = {
  0:  { emoji: "☀️",  label: "Jasno",              good: true  },
  1:  { emoji: "🌤️", label: "Pretežno jasno",      good: true  },
  2:  { emoji: "⛅",  label: "Delno oblačno",       good: true  },
  3:  { emoji: "☁️",  label: "Oblačno",             good: false },
  45: { emoji: "🌫️", label: "Megla",               good: false },
  48: { emoji: "🌫️", label: "Ledena megla",        good: false },
  51: { emoji: "🌦️", label: "Lahka rosivica",      good: false },
  53: { emoji: "🌦️", label: "Rosivica",            good: false },
  55: { emoji: "🌧️", label: "Gosta rosivica",      good: false },
  56: { emoji: "🌧️", label: "Zmrzujoča rosivica",  good: false },
  57: { emoji: "🌧️", label: "Zmrzujoča rosivica",  good: false },
  61: { emoji: "🌧️", label: "Lahek dež",           good: false },
  63: { emoji: "🌧️", label: "Dež",                 good: false },
  65: { emoji: "🌧️", label: "Močan dež",           good: false },
  66: { emoji: "🌧️", label: "Zmrzujoč dež",        good: false },
  67: { emoji: "🌧️", label: "Zmrzujoč dež",        good: false },
  71: { emoji: "🌨️", label: "Lahek sneg",          good: false },
  73: { emoji: "🌨️", label: "Sneg",                good: false },
  75: { emoji: "❄️",  label: "Močan sneg",          good: false },
  77: { emoji: "🌨️", label: "Snežne zrne",         good: false },
  80: { emoji: "🌦️", label: "Plohe",               good: false },
  81: { emoji: "🌧️", label: "Zmerne plohe",        good: false },
  82: { emoji: "⛈️",  label: "Močne plohe",         good: false },
  85: { emoji: "🌨️", label: "Snežne plohe",        good: false },
  86: { emoji: "❄️",  label: "Močne snežne plohe",  good: false },
  95: { emoji: "⛈️",  label: "Nevihta",             good: false },
  96: { emoji: "⛈️",  label: "Nevihta s točo",      good: false },
  99: { emoji: "⛈️",  label: "Nevihta z velikimi točami", good: false },
};

export function wmoInfo(code: number) {
  return WMO[code] ?? { emoji: "🌡️", label: "Neznano", good: false };
}

/** Wind direction degrees → short compass label (Slovenian) */
export function windDirLabel(deg: number): string {
  const dirs = ["S", "SSV", "SV", "VSV", "V", "VJV", "JV", "JJV",
                "J", "JJZ", "JZ", "ZJZ", "Z", "ZSZ", "SZ", "SSZ"];
  return dirs[Math.round(deg / 22.5) % 16];
}

/** UV index → Slovenian label */
export function uvLabel(uv: number): string {
  if (uv <= 2) return "Nizek";
  if (uv <= 5) return "Zmeren";
  if (uv <= 7) return "Visok";
  if (uv <= 10) return "Zelo visok";
  return "Ekstremen";
}

/** Short day name from ISO date */
export function shortDay(isoDate: string): string {
  const d = new Date(isoDate + "T12:00:00");
  return d.toLocaleDateString("sl-SI", { weekday: "short" });
}

// ─── In-memory client cache (30 min TTL) ────────────────────────────────────
// Prevents re-fetching the proxy on every WeatherWidget re-render in the same
// browser tab. The real 1-hour server cache lives in /api/weather.

const CACHE = new Map<string, WeatherData>();
const CACHE_TTL = 30 * 60 * 1000;

function cacheKey(lat: number, lng: number) {
  return `${lat.toFixed(2)},${lng.toFixed(2)}`;
}

// ─── Fetcher (goes through /api/weather proxy, not Open-Meteo directly) ─────

export async function fetchWeather(
  lat: number,
  lng: number
): Promise<WeatherData | null> {
  const key = cacheKey(lat, lng);
  const cached = CACHE.get(key);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) return cached;

  try {
    // Use our server-side proxy which has Vercel Data Cache (1h revalidation).
    // This keeps Open-Meteo hidden from the browser and shares cache across users.
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const resp = await fetch(
      `${origin}/api/weather?lat=${lat.toFixed(4)}&lng=${lng.toFixed(4)}`
    );
    if (!resp.ok) return null;

    const raw = await resp.json();
    const c = raw.current;
    const d = raw.daily;
    const info = wmoInfo(c.weather_code);

    const current: CurrentWeather = {
      temp:          Math.round(c.temperature_2m),
      feelsLike:     Math.round(c.apparent_temperature),
      humidity:      Math.round(c.relative_humidity_2m),
      windSpeed:     Math.round(c.wind_speed_10m),
      windDir:       Math.round(c.wind_direction_10m),
      precipitation: c.precipitation ?? 0,
      uvIndex:       Math.round(c.uv_index ?? 0),
      code:          c.weather_code,
      emoji:         info.emoji,
      label:         info.label,
      isGood:        info.good && c.temperature_2m >= 8,
    };

    const daily: DayForecast[] = (d.time as string[]).map(
      (date: string, i: number) => {
        const di = wmoInfo(d.weather_code[i]);
        return {
          date,
          code:        d.weather_code[i],
          emoji:       di.emoji,
          label:       di.label,
          tempMax:     Math.round(d.temperature_2m_max[i]),
          tempMin:     Math.round(d.temperature_2m_min[i]),
          precipProb:  d.precipitation_probability_max[i] ?? 0,
          precipSum:   Math.round((d.precipitation_sum[i] ?? 0) * 10) / 10,
        };
      }
    );

    const result: WeatherData = { current, daily, fetchedAt: Date.now() };
    CACHE.set(key, result);
    return result;
  } catch {
    return null;
  }
}
