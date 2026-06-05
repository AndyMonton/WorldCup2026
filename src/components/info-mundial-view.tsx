"use client";

import React, { useState } from "react";
import {
  Globe,
  Trophy,
  MapPin,
  Calendar,
  Sparkles,
  Info,
  ChevronRight,
  Star,
  Users,
  Search,
  BookOpen,
  X,
  History,
} from "lucide-react";

// --- DATOS DE LOS ESTADIOS ---
interface Stadium {
  id: string;
  name: string;
  city: string;
  country: "Estados Unidos" | "México" | "Canadá";
  capacity: number;
  opened: number;
  image: string;
  history: string;
  highlights: string[];
}

const STADIUMS: Stadium[] = [
  {
    id: "azteca",
    name: "Estadio Azteca",
    city: "Ciudad de México",
    country: "México",
    capacity: 87523,
    opened: 1966,
    image: "/images/estadio_azteca.png",
    history: "El templo sagrado del fútbol mundial. Será el único estadio en la historia en albergar la inauguración de tres Copas del Mundo (1970, 1986 y 2026). Fue el escenario donde Pelé alzó su tercera Copa en 1970 y donde Diego Armando Maradona inmortalizó 'La Mano de Dios' y 'El Gol del Siglo' ante Inglaterra en 1986.",
    highlights: [
      "Único en albergar 3 inauguraciones de Mundiales (1970, 1986, 2026)",
      "Sede de la final en 1970 (Brasil 4-1 Italia) y 1986 (Argentina 3-2 Alemania)",
      "Estadio donde Maradona anotó 'El Gol del Siglo'",
      "El estadio más alto del torneo (2.200 metros sobre el nivel del mar)"
    ]
  },
  {
    id: "metlife",
    name: "MetLife Stadium",
    city: "New York/New Jersey",
    country: "Estados Unidos",
    capacity: 82500,
    opened: 2010,
    image: "/images/metlife_stadium.png",
    history: "Ubicado en East Rutherford, Nueva Jersey, este monumental estadio ha sido seleccionado para albergar la gran Final de la Copa del Mundo el 19 de julio de 2026. Casa de los New York Giants y New York Jets de la NFL, ha sido el escenario de eventos masivos como el Super Bowl XLVIII y la histórica final de la Copa América Centenario 2016.",
    highlights: [
      "Elegido para la gran Final del Mundial el 19 de julio de 2026",
      "Sede de la final de la Copa América Centenario 2016",
      "Equipado con tecnología LED de última generación que tiñe su exterior de colores",
      "Costó aproximadamente 1.600 millones de dólares"
    ]
  },
  {
    id: "sofi",
    name: "SoFi Stadium",
    city: "Los Ángeles",
    country: "Estados Unidos",
    capacity: 70240,
    opened: 2020,
    image: "/images/sofi_stadium.png",
    history: "Considerado el estadio más costoso y tecnológicamente avanzado del planeta (cerca de 5.000 millones de dólares). Ubicado en Inglewood, Los Ángeles, cuenta con un techo de ETFE translúcido y la pantalla gigante de doble cara 'Infinity Screen by Samsung' que cuelga sobre el campo. Será el escenario del partido debut de la selección de Estados Unidos.",
    highlights: [
      "El estadio más moderno y costoso del planeta",
      "Posee la pantalla gigante 'Infinity Screen' de doble cara (360 grados)",
      "Albergó el Super Bowl LVI y múltiples conciertos de calibre mundial",
      "Sede del debut de la Selección de Estados Unidos en el torneo"
    ]
  },
  {
    id: "dallas",
    name: "AT&T Stadium",
    city: "Dallas (Arlington)",
    country: "Estados Unidos",
    capacity: 80000,
    opened: 2009,
    image: "/images/stadium_banner.png",
    history: "Conocido popularmente como 'Jerry World' (por el dueño de los Dallas Cowboys, Jerry Jones), es una colosal obra arquitectónica famosa por su techo retráctil gigante y su imponente pantalla central colgada de 55 metros de largo. Este estadio albergará múltiples partidos decisivos, incluyendo una de las semifinales.",
    highlights: [
      "Capacidad expandible hasta 105.000 espectadores para eventos masivos",
      "Posee una de las pantallas de video colgantes más grandes del mundo",
      "Sede elegida para albergar una de las Semifinales de la Copa del Mundo 2026",
      "Posee puertas de vidrio de extremo a extremo que se abren en minutos"
    ]
  },
  {
    id: "atlanta",
    name: "Mercedes-Benz Stadium",
    city: "Atlanta",
    country: "Estados Unidos",
    capacity: 71000,
    opened: 2017,
    image: "/images/stadium_banner.png",
    history: "Famoso por su vanguardista diseño con un techo retráctil de ocho paneles que funciona de forma circular imitando el diafragma de una cámara fotográfica. Tiene una pantalla circular continua de 360 grados ('Halo Board') justo debajo del techo. Este estadio albergará partidos de eliminación y una de las semifinales.",
    highlights: [
      "Innovador techo retráctil en forma de pétalos",
      "Pantalla gigante circular ('Halo Board') de 360 grados única en su tipo",
      "Certificado con el nivel LEED Platinum por su alta sustentabilidad ambiental",
      "Sede de una de las Semifinales de la Copa del Mundo 2026"
    ]
  },
  {
    id: "monterrey",
    name: "Estadio BBVA",
    city: "Monterrey",
    country: "México",
    capacity: 53500,
    opened: 2015,
    image: "/images/stadium_banner.png",
    history: "Conocido como 'El Gigante de Acero' debido a su espectacular estructura metálica exterior. Es famoso a nivel internacional por la espectacular vista del Cerro de la Silla que los aficionados pueden contemplar directamente desde las tribunas. Su diseño aerodinámico rinde homenaje a la industria siderúrgica local.",
    highlights: [
      "Reconocido mundialmente por sus vistas panorámicas al Cerro de la Silla",
      "Diseño arquitectónico simulando una ola de acero brillante",
      "Uno de los estadios más nuevos y con mejor acústica de México",
      "Diseñado por la firma internacional de arquitectura Populous"
    ]
  },
  {
    id: "guadalajara",
    name: "Estadio Akron",
    city: "Guadalajara",
    country: "México",
    capacity: 48071,
    opened: 2010,
    image: "/images/stadium_banner.png",
    history: "Un diseño ecológico revolucionario que asemeja un volcán coronado por una gran nube (la cubierta blanca del techo). La estructura exterior está completamente cubierta de pasto natural, integrándose de forma armónica con el paisaje boscoso circundante. Es el hogar de las populares Chivas de Guadalajara.",
    highlights: [
      "Diseño orgánico en forma de volcán ecológico cubierto de pasto",
      "Capta y recicla agua de lluvia para el riego de su pasto natural",
      "Albergó la final de ida de la Copa Libertadores 2010",
      "Hogar del histórico Club Deportivo Guadalajara"
    ]
  },
  {
    id: "vancouver",
    name: "BC Place",
    city: "Vancouver",
    country: "Canadá",
    capacity: 54500,
    opened: 1983,
    image: "/images/stadium_banner.png",
    history: "Un estadio icónico a orillas del mar en la costa oeste de Canadá. Cuenta con el techo retráctil sostenido por cables más grande del mundo. Fue completamente renovado y sirvió como escenario principal para las ceremonias de apertura y clausura de los Juegos Olímpicos de Invierno de Vancouver 2010.",
    highlights: [
      "El techo retráctil sostenido por cables más grande del mundo",
      "Sede principal de los Juegos Olímpicos de Invierno de Vancouver 2010",
      "Ubicado en el pintoresco centro costero de la ciudad de Vancouver",
      "Albergó la final de la Copa Mundial Femenina de la FIFA en 2015"
    ]
  },
  {
    id: "toronto",
    name: "BMO Field",
    city: "Toronto",
    country: "Canadá",
    capacity: 45000,
    opened: 2007,
    image: "/images/stadium_banner.png",
    history: "Hogar del Toronto FC y de la Selección Nacional de Canadá. Es un estadio clásico de estilo inglés ubicado en Exhibition Place, junto al espectacular Lago Ontario. Está siendo sometido a una importante expansión temporal en sus tribunas norte y sur para llegar a la capacidad requerida de 45.000 espectadores.",
    highlights: [
      "Hogar histórico de la Selección Nacional de Canadá",
      "Ubicación céntrica privilegiada a orillas del Lago Ontario",
      "Ampliado temporalmente de 30.000 a 45.000 asientos para el Mundial",
      "Primer estadio específico para fútbol construido en Canadá en la era moderna"
    ]
  },
  {
    id: "houston",
    name: "NRG Stadium",
    city: "Houston",
    country: "Estados Unidos",
    capacity: 72220,
    opened: 2002,
    image: "/images/stadium_banner.png",
    history: "El primer estadio de la NFL en construirse con un techo retráctil. Es un espacio multifuncional gigantesco que alberga desde partidos de fútbol de la Copa Oro y Copa América hasta el famosísimo Houston Livestock Show and Rodeo. Cuenta con una gran flexibilidad de configuración.",
    highlights: [
      "Primer estadio en la historia de la NFL con techo retráctil",
      "Albergó el Super Bowl XXXVIII (2004) y el Super Bowl LI (2017)",
      "Sede frecuente de partidos internacionales de fútbol de la Selección Mexicana",
      "Posee una estructura exterior de vidrio de gran impacto visual"
    ]
  },
  {
    id: "kansas",
    name: "Arrowhead Stadium",
    city: "Kansas City",
    country: "Estados Unidos",
    capacity: 76416,
    opened: 1972,
    image: "/images/stadium_banner.png",
    history: "Un estadio con forma de tazón abierto famoso por poseer el récord Guinness oficial como el estadio deportivo más ruidoso del planeta (alcanzando 142.2 decibelios en 2014). Su diseño curvo ofrece una de las mejores líneas de visión del campo de juego en todo Estados Unidos.",
    highlights: [
      "Récord Guinness oficial como el estadio más ruidoso del mundo (142.2 dB)",
      "Un clásico americano con un icónico diseño en forma de cuenco",
      "Conocido por su ambiente festivo previo a los partidos y sus barbacoas",
      "Sede de múltiples partidos de grupos y rondas eliminatorias"
    ]
  },
  {
    id: "miami",
    name: "Hard Rock Stadium",
    city: "Miami (Gardens)",
    country: "Estados Unidos",
    capacity: 64767,
    opened: 1987,
    image: "/images/stadium_banner.png",
    history: "Una de las sedes de entretenimiento más famosas del mundo. Ha albergado 6 ediciones de Super Bowl, la Copa de Tenis de Miami y cuenta con un circuito de Fórmula 1 en su estacionamiento. Fue renovado con un gran dosel de acero que cubre el 90% de los asientos contra el sol tropical.",
    highlights: [
      "Ha albergado 6 Super Bowls y la Copa de Tenis de Miami",
      "Posee una pista de Fórmula 1 permanente rodeando el estadio",
      "Gran visera de acero de 14.000 toneladas agregada para protección del sol",
      "Sede del partido por el tercer puesto de la Copa del Mundo 2026"
    ]
  },
  {
    id: "philadelphia",
    name: "Lincoln Financial Field",
    city: "Filadelfia",
    country: "Estados Unidos",
    capacity: 67594,
    opened: 2003,
    image: "/images/stadium_banner.png",
    history: "Apodado 'The Linc', es reconocido mundialmente por sus masivos esfuerzos ecológicos. El estadio genera parte de su propia energía mediante la instalación de 11.000 paneles solares y 14 microturbinas eólicas en su estructura superior. Alberga a los Philadelphia Eagles de la NFL.",
    highlights: [
      "Genera su propia energía limpia con paneles solares y microturbinas eólicas",
      "Diseño imponente con gradas laterales que simulan las alas de un águila",
      "Certificado 'Zero Waste' al reciclar o compostar el 99% de sus residuos",
      "Albergará partidos de fase de grupos y octavos de final"
    ]
  },
  {
    id: "seattle",
    name: "Lumen Field",
    city: "Seattle",
    country: "Estados Unidos",
    capacity: 68740,
    opened: 2002,
    image: "/images/stadium_banner.png",
    history: "Famoso por su diseño acústico único: las tribunas laterales están cubiertas por grandes techos curvos de metal que rebotan el sonido de los fanáticos de vuelta hacia el campo. Esto genera una atmósfera ensordecedora, temida por los equipos rivales de los Seattle Sounders y Seattle Seahawks.",
    highlights: [
      "Diseño acústico curvo que potencia el sonido del público en el campo",
      "Vistas espectaculares del skyline de Seattle desde su tribuna norte",
      "Hogar de una de las aficiones de fútbol más apasionadas de Estados Unidos",
      "Albergará el debut de la Selección de Canadá en el torneo"
    ]
  },
  {
    id: "sanfrancisco",
    name: "Levi's Stadium",
    city: "San Francisco (Santa Clara)",
    country: "Estados Unidos",
    capacity: 68500,
    opened: 2014,
    image: "/images/stadium_banner.png",
    history: "Situado en el corazón tecnológico de Silicon Valley, fue el primer estadio profesional en Estados Unidos en recibir la prestigiosa certificación ecológica LEED Gold. Cuenta con un techo ecológico cubierto de vegetación nativa y es el estadio más conectado digitalmente del torneo.",
    highlights: [
      "Primer estadio en recibir la certificación ecológica LEED Gold",
      "Equipado con un techo verde con vegetación nativa ('Green Roof')",
      "El estadio más conectado a internet de alta densidad del torneo",
      "Albergó el Super Bowl 50 en el año 2016"
    ]
  },
  {
    id: "boston",
    name: "Gillette Stadium",
    city: "Boston (Foxborough)",
    country: "Estados Unidos",
    capacity: 65878,
    opened: 2002,
    image: "/images/stadium_banner.png",
    history: "Ubicado a las afueras de Boston, es el hogar de los exitosos New England Patriots de la NFL. Cuenta con un diseño único que incluye un faro gigante de 67 metros de altura en su extremo norte, un homenaje a los tradicionales faros costeros de la histórica región de Nueva Inglaterra.",
    highlights: [
      "Posee un icónico faro gigante que corona la entrada del estadio",
      "Hogar de los New England Patriots y de la dinastía de Tom Brady",
      "Sometido a una renovación masiva de 250 millones de dólares finalizada en 2023",
      "Sede de múltiples partidos de eliminación directa en el torneo"
    ]
  }
];

// --- CAMPEONES MUNDIALES ---
interface ChampionInfo {
  year: number;
  host: string;
  champion: string;
  runnerUp: string;
  result: string;
  stars: number;
}

const CHAMPIONS: ChampionInfo[] = [
  { year: 2022, host: "Catar", champion: "Argentina", runnerUp: "Francia", result: "3-3 (Pen. 4-2)", stars: 3 },
  { year: 2018, host: "Rusia", champion: "Francia", runnerUp: "Croacia", result: "4-2", stars: 2 },
  { year: 2014, host: "Brasil", champion: "Alemania", runnerUp: "Argentina", result: "1-0 (pró.)", stars: 4 },
  { year: 2010, host: "Sudáfrica", champion: "España", runnerUp: "Países Bajos", result: "1-0 (pró.)", stars: 1 },
  { year: 2006, host: "Alemania", champion: "Italia", runnerUp: "Francia", result: "1-1 (Pen. 5-3)", stars: 4 },
  { year: 2002, host: "Corea/Japón", champion: "Brasil", runnerUp: "Alemania", result: "2-0", stars: 5 },
  { year: 1998, host: "Francia", champion: "Francia", runnerUp: "Brasil", result: "3-0", stars: 2 },
  { year: 1994, host: "EE.UU.", champion: "Brasil", runnerUp: "Italia", result: "0-0 (Pen. 3-2)", stars: 5 },
  { year: 1990, host: "Italia", champion: "Alemania", runnerUp: "Argentina", result: "1-0", stars: 4 },
  { year: 1986, host: "México", champion: "Argentina", runnerUp: "Alemania", result: "3-2", stars: 3 },
  { year: 1982, host: "España", champion: "Italia", runnerUp: "Alemania", result: "3-1", stars: 4 },
  { year: 1978, host: "Argentina", champion: "Argentina", runnerUp: "Países Bajos", result: "3-1 (pró.)", stars: 3 },
  { year: 1974, host: "Alemania", champion: "Alemania", runnerUp: "Países Bajos", result: "2-1", stars: 4 },
  { year: 1970, host: "México", champion: "Brasil", runnerUp: "Italia", result: "4-1", stars: 5 },
  { year: 1966, host: "Inglaterra", champion: "Inglaterra", runnerUp: "Alemania", result: "4-2 (pró.)", stars: 1 },
  { year: 1962, host: "Chile", champion: "Brasil", runnerUp: "Checoslovaquia", result: "3-1", stars: 5 },
  { year: 1958, host: "Suecia", champion: "Brasil", runnerUp: "Suecia", result: "5-2", stars: 5 },
  { year: 1954, host: "Suiza", champion: "Alemania", runnerUp: "Hungría", result: "3-2", stars: 4 },
  { year: 1950, host: "Brasil", champion: "Uruguay", runnerUp: "Brasil", result: "2-1 ('Maracanazo')", stars: 2 },
  { year: 1938, host: "Francia", champion: "Italia", runnerUp: "Hungría", result: "4-2", stars: 4 },
  { year: 1934, host: "Italia", champion: "Italia", runnerUp: "Checoslovaquia", result: "2-1 (pró.)", stars: 4 },
  { year: 1930, host: "Uruguay", champion: "Uruguay", runnerUp: "Argentina", result: "4-2", stars: 2 }
];

const TOP_TEAMS = [
  { country: "Brasil", titles: 5, years: "1958, 1962, 1970, 1994, 2002" },
  { country: "Alemania", titles: 4, years: "1954, 1974, 1990, 2014" },
  { country: "Italia", titles: 4, years: "1934, 1938, 1982, 2006" },
  { country: "Argentina", titles: 3, years: "1978, 1986, 2022" },
  { country: "Francia", titles: 2, years: "1998, 2018" },
  { country: "Uruguay", titles: 2, years: "1930, 1950" },
  { country: "España", titles: 1, years: "2010" },
  { country: "Inglaterra", titles: 1, years: "1966" }
];

export function InfoMundialView() {
  const [activeTab, setActiveTab] = useState<"stadiums" | "history" | "trivia">("stadiums");
  const [selectedStadium, setSelectedStadium] = useState<Stadium | null>(null);
  const [stadiumFilter, setStadiumFilter] = useState<string>("ALL");

  const filteredStadiums = STADIUMS.filter((stadium) => {
    if (stadiumFilter === "ALL") return true;
    return stadium.country === stadiumFilter;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Cabecera Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2.5">
            <Globe className="w-8 h-8 text-primary animate-spin-slow" />
            Información del Mundial 2026
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Explorá la historia del torneo más grande del mundo, las sedes oficiales y curiosidades del torneo.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border/80 pb-px">
        <button
          onClick={() => setActiveTab("stadiums")}
          className={`flex items-center gap-2 px-6 py-3.5 text-sm font-semibold border-b-2 outline-none cursor-pointer transition-all ${
            activeTab === "stadiums"
              ? "border-primary text-primary font-bold bg-primary/5"
              : "border-transparent text-slate-400 hover:text-foreground"
          }`}
        >
          <MapPin className="w-4 h-4" />
          Estadios Sedes
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 px-6 py-3.5 text-sm font-semibold border-b-2 outline-none cursor-pointer transition-all ${
            activeTab === "history"
              ? "border-primary text-primary font-bold bg-primary/5"
              : "border-transparent text-slate-400 hover:text-foreground"
          }`}
        >
          <Trophy className="w-4 h-4" />
          Historia y Campeones
        </button>

        <button
          onClick={() => setActiveTab("trivia")}
          className={`flex items-center gap-2 px-6 py-3.5 text-sm font-semibold border-b-2 outline-none cursor-pointer transition-all ${
            activeTab === "trivia"
              ? "border-primary text-primary font-bold bg-primary/5"
              : "border-transparent text-slate-400 hover:text-foreground"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Datos y Curiosidades
        </button>
      </div>

      {/* --- PESTAÑA: ESTADIOS --- */}
      {activeTab === "stadiums" && (
        <div className="space-y-6">
          {/* Filtros de Países */}
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Todos los Estadios", value: "ALL" },
              { label: "Estados Unidos", value: "Estados Unidos" },
              { label: "México", value: "México" },
              { label: "Canadá", value: "Canadá" },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setStadiumFilter(f.value)}
                className={`px-4 py-2 text-sm md:text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                  stadiumFilter === f.value
                    ? "btn-premium border-primary"
                    : "bg-slate-900/50 text-slate-400 border-border/80 hover:text-foreground hover:bg-slate-900"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Grid de Estadios */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStadiums.map((stadium) => (
              <div
                key={stadium.id}
                onClick={() => setSelectedStadium(stadium)}
                className="glass-panel border border-border rounded-2xl overflow-hidden shadow-lg bg-slate-950 flex flex-col hover:border-primary/50 hover:shadow-primary/5 transition-all cursor-pointer group"
              >
                <div className="relative h-40 w-full overflow-hidden">
                  <img
                    src={stadium.image}
                    alt={stadium.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-4">
                    <div>
                      <span className="text-xs md:text-[9px] px-2 py-0.5 rounded-full bg-primary/20 border border-primary/30 text-primary font-bold uppercase tracking-wider">
                        {stadium.country}
                      </span>
                      <h4 className="font-extrabold text-base text-white mt-1 group-hover:text-primary transition-colors">
                        {stadium.name}
                      </h4>
                    </div>
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1 text-xs md:text-[11px] text-slate-400 font-semibold uppercase">
                      <MapPin className="w-3.5 h-3.5 text-primary" />
                      {stadium.city}
                    </div>
                    <p className="text-sm md:text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                      {stadium.history}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-border/50 flex justify-between items-center text-sm md:text-xs text-slate-400">
                    <span className="font-medium">
                      Capacidad: <strong className="text-slate-200">{stadium.capacity.toLocaleString()}</strong>
                    </span>
                    <span className="text-primary font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Detalles <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- PESTAÑA: HISTORIA --- */}
      {activeTab === "history" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna Izquierda: Tabla e Intro */}
          <div className="lg:col-span-2 space-y-6">
            {/* Intro Origen */}
            <div className="glass-panel border border-border rounded-2xl p-6 bg-slate-900/10 space-y-3">
              <h3 className="text-lg font-black tracking-tight text-slate-100 uppercase flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                El Origen del Mundial
              </h3>
              <p className="text-sm md:text-base text-slate-400 leading-relaxed">
                La Copa del Mundo de la FIFA nació gracias a la visión de dirigentes como <strong>Jules Rimet</strong>. La primera edición se disputó en <strong>Uruguay en 1930</strong>, con solo 13 selecciones invitadas. Con el correr de las décadas, el torneo se convirtió en el evento unificador y de entretenimiento deportivo más sintonizado del planeta. En esta edición 2026, el Mundial alcanza una escala histórica al expandirse a <strong>48 equipos participantes</strong> y ser coorganizado por tres países de forma conjunta.
              </p>
            </div>

            {/* Tabla de Campeones */}
            <div className="glass-panel border border-border rounded-2xl overflow-hidden shadow-lg bg-slate-900/10">
              <div className="p-5 border-b border-border/60 bg-slate-900/20">
                <h4 className="font-bold text-base flex items-center gap-2">
                  <Trophy className="w-4.5 h-4.5 text-gold" />
                  Cronología de Campeones
                </h4>
              </div>
              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-slate-900/50 text-xs md:text-sm text-slate-400 uppercase font-extrabold tracking-wider">
                      <th className="px-5 py-3">Año</th>
                      <th className="px-5 py-3">Sede</th>
                      <th className="px-5 py-3">Campeón</th>
                      <th className="px-5 py-3">Subcampeón</th>
                      <th className="px-5 py-3 text-right">Resultado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 text-slate-300 text-sm md:text-base">
                    {CHAMPIONS.map((c) => (
                      <tr key={c.year} className="hover:bg-slate-900/20 transition-colors">
                        <td className="px-5 py-3 font-bold text-slate-200">{c.year}</td>
                        <td className="px-5 py-3 text-slate-400">{c.host}</td>
                        <td className="px-5 py-3">
                          <span className="font-bold text-foreground flex items-center gap-1.5">
                            {c.champion}
                            <span className="flex text-gold text-xs md:text-sm">
                              {"★".repeat(c.stars)}
                            </span>
                          </span>
                        </td>
                        <td className="px-5 py-3 text-slate-400">{c.runnerUp}</td>
                        <td className="px-5 py-3 text-right font-mono font-semibold text-slate-200">{c.result}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Top Campeones */}
          <div className="lg:col-span-1 space-y-6">
            <div className="glass-panel border border-border rounded-2xl p-6 bg-slate-900/10">
              <h4 className="font-bold text-base mb-6 uppercase tracking-wider text-slate-200 border-b border-border/20 pb-2 flex items-center gap-2">
                <Star className="w-4.5 h-4.5 text-gold" />
                Máximos Campeones
              </h4>

              <div className="space-y-4">
                {TOP_TEAMS.map((t, idx) => (
                  <div
                    key={t.country}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                      idx === 0
                        ? "bg-gold/5 border-gold/25"
                        : "bg-slate-950 border-border/50 hover:border-slate-800"
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm md:text-base shadow ${
                        idx === 0
                          ? "bg-gold text-slate-900"
                          : "bg-slate-800 text-slate-300"
                      }`}
                    >
                      #{idx + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-sm md:text-base text-foreground">{t.country}</span>
                        <span className="text-sm md:text-base font-black text-primary flex items-center gap-0.5">
                          {t.titles} Mundiales
                        </span>
                      </div>
                      <p className="text-xs md:text-sm text-slate-500 font-mono mt-1">
                        Años: {t.years}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- PESTAÑA: CURIOSIDADES --- */}
      {activeTab === "trivia" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Tarjeta 1: Debutantes de 2026 */}
          <div className="glass-panel border border-border rounded-2xl overflow-hidden flex flex-col bg-slate-950/20 shadow-xl">
            <div className="relative h-48 w-full">
              <img
                src="/images/world_cup_map.png"
                alt="Mapa del Mundial"
                className="w-full h-full object-cover border-b border-border/30"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent flex items-end p-5">
                <div>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-primary/20 border border-primary/30 text-primary font-bold uppercase tracking-wider">
                    Mundial 2026
                  </span>
                  <h3 className="font-extrabold text-lg text-white mt-1">
                    Debutantes y Expansión a 48 Selecciones
                  </h3>
                </div>
              </div>
            </div>
            <div className="p-5 flex-1 space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                El Mundial de 2026 pasará a la historia al ser el primero en contar con <strong>48 países participantes</strong>, un incremento sustancial frente a las 32 selecciones que competían desde Francia 1998. 
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Esta expansión abre las puertas de forma directa a confederaciones que históricamente han tenido pocos cupos, permitiendo que selecciones que nunca han clasificado sueñen con su debut, y facilitando el retorno de naciones históricas que llevaban décadas fuera de la cita.
              </p>
              <div className="p-3 bg-slate-900/50 border border-border/50 rounded-xl">
                <h5 className="font-bold text-xs text-slate-200 mb-1 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-primary" />
                  ¿Sabías qué?
                </h5>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Los tres países coorganizadores (Estados Unidos, México y Canadá) ya tienen asegurados sus boletos directos al torneo por ser anfitriones, liberando cupos extras en la CONCACAF.
                </p>
              </div>
            </div>
          </div>

          {/* Tarjeta 2: Selecciones con Menos Mundiales */}
          <div className="glass-panel border border-border rounded-2xl overflow-hidden flex flex-col bg-slate-950/20 shadow-xl">
            <div className="relative h-48 w-full">
              <img
                src="/images/news_ball.png"
                alt="Balón oficial histórico"
                className="w-full h-full object-cover border-b border-border/30"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent flex items-end p-5">
                <div>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-primary/20 border border-primary/30 text-primary font-bold uppercase tracking-wider">
                    Historial FIFA
                  </span>
                  <h3 className="font-extrabold text-lg text-white mt-1">
                    Selecciones con Menos Mundiales (Una Sola Vez)
                  </h3>
                </div>
              </div>
            </div>
            <div className="p-5 flex-1 space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Alcanzar un Mundial es la máxima gloria deportiva, y para muchas selecciones pequeñas, conseguirlo aunque sea una única vez representa un hito eterno en su historia deportiva nacional.
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Países que han logrado disputar **exactamente un solo Mundial** en su historia:
              </p>
              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div className="p-2.5 bg-slate-900/30 border border-border/30 rounded-lg">
                  <span className="font-bold text-foreground">América</span>
                  <p className="text-slate-450 mt-0.5">Haití (1974)</p>
                  <p className="text-slate-450">Cuba (1938)</p>
                  <p className="text-slate-450">Jamaica (1998)</p>
                </div>
                <div className="p-2.5 bg-slate-900/30 border border-border/30 rounded-lg">
                  <span className="font-bold text-foreground">África y Asia</span>
                  <p className="text-slate-450 mt-0.5">Angola (2006)</p>
                  <p className="text-slate-450">Togo (2006)</p>
                  <p className="text-slate-450">Irak (1986)</p>
                  <p className="text-slate-450">Kuwait (1982)</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Otras selecciones como Islandia y Panamá consiguieron su primera y única clasificación en Rusia 2018, emocionando a todo el mundo del fútbol con su espíritu deportivo.
              </p>
            </div>
          </div>

          {/* Tarjeta 3: Goleadores Históricos */}
          <div className="glass-panel border border-border rounded-2xl overflow-hidden flex flex-col bg-slate-950/20 shadow-xl">
            <div className="relative h-48 w-full">
              <img
                src="/images/news_trophy.png"
                alt="Trofeo de la Copa del Mundo"
                className="w-full h-full object-cover border-b border-border/30"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent flex items-end p-5">
                <div>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-primary/20 border border-primary/30 text-primary font-bold uppercase tracking-wider">
                    Leyendas
                  </span>
                  <h3 className="font-extrabold text-lg text-white mt-1">
                    Goleadores Históricos de los Mundiales
                  </h3>
                </div>
              </div>
            </div>
            <div className="p-5 flex-1 space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                El gol es la esencia del fútbol, y un grupo selecto de artilleros ha dejado una huella imborrable al liderar la tabla histórica de anotadores en la máxima cita mundialista.
              </p>
              <div className="space-y-2">
                {[
                  { name: "Miroslav Klose", country: "Alemania", goals: 16, matches: 24, status: "1°" },
                  { name: "Ronaldo Nazário", country: "Brasil", goals: 15, matches: 19, status: "2°" },
                  { name: "Gerd Müller", country: "Alemania", goals: 14, matches: 13, status: "3°" },
                  { name: "Just Fontaine", country: "Francia", goals: 13, matches: 6, status: "4°" },
                  { name: "Lionel Messi", country: "Argentina", goals: 13, matches: 26, status: "4°" },
                  { name: "Pelé", country: "Brasil", goals: 12, matches: 14, status: "6°" },
                ].map((player, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 bg-slate-900/30 border border-border/30 rounded-lg text-xs">
                    <span className="font-semibold text-slate-200">
                      <span className="text-primary mr-1.5">{player.status}</span>
                      {player.name} <span className="text-[10px] text-slate-400 font-normal">({player.country})</span>
                    </span>
                    <span className="font-bold text-primary font-mono">{player.goals} goles <span className="text-[10px] text-slate-500 font-normal">({player.matches} PJ)</span></span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tarjeta 4: Arqueros Récord */}
          <div className="glass-panel border border-border rounded-2xl overflow-hidden flex flex-col bg-slate-950/20 shadow-xl">
            <div className="relative h-48 w-full">
              <img
                src="/images/countdown_ref.png"
                alt="Arquero y Valla Invicta"
                className="w-full h-full object-cover border-b border-border/30"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent flex items-end p-5">
                <div>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-primary/20 border border-primary/30 text-primary font-bold uppercase tracking-wider">
                    Defensa de Acero
                  </span>
                  <h3 className="font-extrabold text-lg text-white mt-1">
                    Murallas del Arco en los Mundiales
                  </h3>
                </div>
              </div>
            </div>
            <div className="p-5 flex-1 space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Mantener el arco en cero en una Copa del Mundo es una tarea titánica. Estos son los guardametas que rompieron todos los récords de invulnerabilidad:
              </p>
              
              <div className="space-y-2.5">
                <div className="p-3 bg-slate-900/40 border border-border/40 rounded-xl space-y-1">
                  <span className="text-[10px] text-primary font-bold uppercase tracking-wider block">Menos goles recibidos (Mundial completo)</span>
                  <span className="font-bold text-xs text-slate-200">Pascal Zuberbühler (Suiza)</span>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Logró mantener su arco invicto con <strong>0 goles recibidos</strong> en 4 partidos en Alemania 2006. Suiza quedó eliminada en octavos de final por penales (sin encajar goles en el tiempo reglamentario ni prórroga).
                  </p>
                </div>

                <div className="p-3 bg-slate-900/40 border border-border/40 rounded-xl space-y-1">
                  <span className="text-[10px] text-primary font-bold uppercase tracking-wider block">Menos goles encajados siendo campeón</span>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    <strong>Fabien Barthez</strong> (Francia, 1998), <strong>Gianluigi Buffon</strong> (Italia, 2006) e <strong>Iker Casillas</strong> (España, 2010) comparten el récord con solo <strong>2 goles recibidos</strong> en su camino al título.
                  </p>
                </div>

                <div className="p-3 bg-slate-900/40 border border-border/40 rounded-xl space-y-1">
                  <span className="text-[10px] text-primary font-bold uppercase tracking-wider block">Récords Adicionales</span>
                  <ul className="text-[10.5px] text-slate-400 space-y-1 list-disc pl-3">
                    <li><strong>Walter Zenga (Italia)</strong>: Récord de imbatibilidad consecutiva con <strong>517 minutos</strong> en Italia 1990.</li>
                    <li><strong>Fabien Barthez (Francia) y Peter Shilton (Inglaterra)</strong>: Más partidos totales con la valla invicta (<strong>10 vallas invictas</strong> cada uno).</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Tarjeta 5: Curiosidades y Hitos */}
          <div className="glass-panel border border-border rounded-2xl overflow-hidden flex flex-col bg-slate-950/20 shadow-xl">
            <div className="relative h-48 w-full">
              <img
                src="/images/stadium_banner.png"
                alt="Hitos del fútbol"
                className="w-full h-full object-cover border-b border-border/30"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent flex items-end p-5">
                <div>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-primary/20 border border-primary/30 text-primary font-bold uppercase tracking-wider">
                    Curiosidades
                  </span>
                  <h3 className="font-extrabold text-lg text-white mt-1">
                    Datos Curiosos y Hitos Legendarios
                  </h3>
                </div>
              </div>
            </div>
            <div className="p-5 flex-1 space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                La historia de los mundiales está llena de momentos insólitos, marcas asombrosas y récords que parecen casi imposibles de superar en el fútbol moderno:
              </p>
              
              <div className="grid grid-cols-1 gap-3 text-xs">
                <div className="p-2.5 bg-slate-900/30 border border-border/30 rounded-lg">
                  <span className="font-bold text-foreground">⏱️ El gol más rápido de la historia</span>
                  <p className="text-slate-400 mt-1">
                    El turco <strong>Hakan Şükür</strong> tardó solo <strong>11 segundos</strong> en anotarle a Corea del Sur en el partido por el tercer puesto del Mundial 2002.
                  </p>
                </div>
                
                <div className="p-2.5 bg-slate-900/30 border border-border/30 rounded-lg">
                  <span className="font-bold text-foreground">⚽ Mayor cantidad de goles en un partido</span>
                  <p className="text-slate-450 mt-1">
                    El ruso <strong>Oleg Salenko</strong> anotó <strong>5 goles</strong> en la victoria por 6-1 de Rusia sobre Camerún en el Mundial de EE.UU. 1994.
                  </p>
                </div>

                <div className="p-2.5 bg-slate-900/30 border border-border/30 rounded-lg">
                  <span className="font-bold text-foreground">🔥 Récord goleador en un solo torneo</span>
                  <p className="text-slate-400 mt-1">
                    El francés <strong>Just Fontaine</strong> convirtió la increíble cifra de <strong>13 goles</strong> en solo 6 partidos disputados en Suecia 1958.
                  </p>
                </div>

                <div className="p-2.5 bg-slate-900/30 border border-border/30 rounded-lg">
                  <span className="font-bold text-foreground">👴 El jugador más longevo</span>
                  <p className="text-slate-400 mt-1">
                    El portero egipcio <strong>Essam El-Hadary</strong> disputó el Mundial de Rusia 2018 con <strong>45 años y 161 días</strong>, atajando incluso un penal en la fase de grupos.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- DIÁLOGO / MODAL DETALLE DEL ESTADIO --- */}
      {selectedStadium && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-2xl glass-panel border border-border rounded-3xl shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col">
            {/* Botón cerrar */}
            <button
              onClick={() => setSelectedStadium(null)}
              className="absolute top-4 right-4 p-2 text-white bg-black/60 backdrop-blur-md hover:bg-black/80 rounded-full transition-all outline-none z-10 cursor-pointer border border-white/10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Imagen Principal en Modal */}
            <div className="relative h-60 md:h-72 w-full flex-shrink-0">
              <img
                src={selectedStadium.image}
                alt={selectedStadium.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent flex items-end p-6">
                <div>
                  <span className="text-xs md:text-[10px] px-2 py-0.5 rounded-full bg-primary/20 border border-primary/30 text-primary font-bold uppercase tracking-wider">
                    Sede Oficial 2026 &bull; {selectedStadium.country}
                  </span>
                  <h3 className="font-black text-2xl md:text-3xl text-white mt-1">
                    {selectedStadium.name}
                  </h3>
                </div>
              </div>
            </div>

            {/* Contenido en Modal */}
            <div className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1">
              {/* Grid Datos Clave */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-slate-900/60 border border-border/60 rounded-2xl">
                  <MapPin className="w-4 h-4 text-primary mx-auto mb-1.5" />
                  <span className="block text-xs md:text-[9px] text-slate-500 uppercase tracking-widest font-bold">Ciudad</span>
                  <span className="text-sm md:text-xs font-bold text-slate-200">{selectedStadium.city}</span>
                </div>
                <div className="p-3 bg-slate-900/60 border border-border/60 rounded-2xl">
                  <Users className="w-4 h-4 text-primary mx-auto mb-1.5" />
                  <span className="block text-xs md:text-[9px] text-slate-500 uppercase tracking-widest font-bold">Capacidad</span>
                  <span className="text-sm md:text-xs font-bold text-slate-200">{selectedStadium.capacity.toLocaleString()}</span>
                </div>
                <div className="p-3 bg-slate-900/60 border border-border/60 rounded-2xl">
                  <Calendar className="w-4 h-4 text-primary mx-auto mb-1.5" />
                  <span className="block text-xs md:text-[9px] text-slate-500 uppercase tracking-widest font-bold">Inaugurado</span>
                  <span className="text-sm md:text-xs font-bold text-slate-200">{selectedStadium.opened}</span>
                </div>
              </div>

              {/* Historia */}
              <div className="space-y-2">
                <h4 className="font-extrabold text-sm text-slate-250 uppercase tracking-wide flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-primary" />
                  Reseña Histórica
                </h4>
                <p className="text-sm md:text-xs text-slate-400 leading-relaxed">
                  {selectedStadium.history}
                </p>
              </div>

              {/* Datos Destacados / Highlights */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-sm text-slate-250 uppercase tracking-wide flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-primary" />
                  Datos Destacados
                </h4>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedStadium.highlights.map((h, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs md:text-[11px] text-slate-400 leading-relaxed bg-slate-900/20 border border-border/30 p-2.5 rounded-xl">
                      <span className="text-primary font-bold mt-0.5">•</span>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
