/**
 * Colombian departments and their municipalities.
 * Used in the registration wizard city selector.
 *
 * Departments are listed alphabetically.
 * Cities within each department are also listed alphabetically.
 *
 * Only the selected city is saved to the database — the department
 * is used purely to filter the city list in the UI.
 */

export interface ColombianDepartment {
  name: string;
  cities: string[];
}

export const COLOMBIA_DEPARTMENTS: ColombianDepartment[] = [
  {
    name: "Amazonas",
    cities: ["Leticia", "Puerto Nariño"],
  },
  {
    name: "Antioquia",
    cities: [
      "Apartadó",
      "Bello",
      "Caucasia",
      "Envigado",
      "Itagüí",
      "Medellín",
      "Rionegro",
      "Sabaneta",
      "Santa Fe de Antioquia",
      "Turbo",
      "Urabá",
    ],
  },
  {
    name: "Arauca",
    cities: ["Arauca", "Arauquita", "Fortul", "Saravena", "Tame"],
  },
  {
    name: "Atlántico",
    cities: [
      "Barranquilla",
      "Baranoa",
      "Malambo",
      "Manatí",
      "Sabanagrande",
      "Sabanalarga",
      "Soledad",
    ],
  },
  {
    name: "Bogotá D.C.",
    cities: ["Bogotá"],
  },
  {
    name: "Bolívar",
    cities: [
      "Cartagena",
      "Magangué",
      "Mompox",
      "San Juan Nepomuceno",
      "Turbaco",
    ],
  },
  {
    name: "Boyacá",
    cities: [
      "Chiquinquirá",
      "Duitama",
      "Monguí",
      "Paipa",
      "Sogamoso",
      "Tunja",
      "Villa de Leyva",
    ],
  },
  {
    name: "Caldas",
    cities: [
      "Anserma",
      "La Dorada",
      "Manizales",
      "Riosucio",
      "Villamaría",
    ],
  },
  {
    name: "Caquetá",
    cities: ["Florencia", "San Vicente del Caguán"],
  },
  {
    name: "Casanare",
    cities: ["Aguazul", "Monterrey", "Paz de Ariporo", "Villanueva", "Yopal"],
  },
  {
    name: "Cauca",
    cities: [
      "Caldono",
      "El Tambo",
      "Guapi",
      "Patía",
      "Popayán",
      "Puerto Tejada",
      "Santander de Quilichao",
      "Silvia",
    ],
  },
  {
    name: "Cesar",
    cities: [
      "Aguachica",
      "Bosconia",
      "Chiriguaná",
      "Codazzi",
      "Curumani",
      "La Paz",
      "Valledupar",
    ],
  },
  {
    name: "Chocó",
    cities: ["Istmina", "Quibdó", "Riosucio", "Tumaco"],
  },
  {
    name: "Córdoba",
    cities: [
      "Cereté",
      "Lorica",
      "Montería",
      "Montelíbano",
      "Planeta Rica",
      "Sahagún",
    ],
  },
  {
    name: "Cundinamarca",
    cities: [
      "Chía",
      "Cota",
      "Facatativá",
      "Fusagasugá",
      "Girardot",
      "La Mesa",
      "Madrid",
      "Mosquera",
      "Soacha",
      "Sopo",
      "Tabio",
      "Tocancipá",
      "Zipaquirá",
    ],
  },
  {
    name: "Guainía",
    cities: ["Inírida"],
  },
  {
    name: "Guaviare",
    cities: ["San José del Guaviare"],
  },
  {
    name: "Huila",
    cities: [
      "Garzón",
      "La Plata",
      "Neiva",
      "Pitalito",
      "San Agustín",
    ],
  },
  {
    name: "La Guajira",
    cities: ["Maicao", "Manaure", "Riohacha", "Uribia"],
  },
  {
    name: "Magdalena",
    cities: [
      "Ciénaga",
      "El Banco",
      "Fundación",
      "Plato",
      "Santa Marta",
    ],
  },
  {
    name: "Meta",
    cities: [
      "Acacías",
      "Granada",
      "Puerto Gaitán",
      "Puerto López",
      "Villavicencio",
    ],
  },
  {
    name: "Nariño",
    cities: [
      "Ipiales",
      "La Unión",
      "Pasto",
      "Tumaco",
      "Túquerres",
    ],
  },
  {
    name: "Norte de Santander",
    cities: [
      "Cúcuta",
      "Los Patios",
      "Ocaña",
      "Pamplona",
      "Villa del Rosario",
    ],
  },
  {
    name: "Putumayo",
    cities: ["Mocoa", "Puerto Asís", "Puerto Leguízamo", "Sibundoy"],
  },
  {
    name: "Quindío",
    cities: ["Armenia", "Calarcá", "Montenegro", "Quimbaya"],
  },
  {
    name: "Risaralda",
    cities: ["Dos Quebradas", "La Virginia", "Pereira", "Santa Rosa de Cabal"],
  },
  {
    name: "San Andrés y Providencia",
    cities: ["San Andrés", "Providencia"],
  },
  {
    name: "Santander",
    cities: [
      "Barrancabermeja",
      "Bucaramanga",
      "Floridablanca",
      "Girón",
      "Lebrija",
      "Málaga",
      "Piedecuesta",
      "San Gil",
      "Socorro",
      "Vélez",
    ],
  },
  {
    name: "Sucre",
    cities: ["Corozal", "Sampués", "Sincelejo", "Tolú"],
  },
  {
    name: "Tolima",
    cities: [
      "Espinal",
      "Ibagué",
      "Líbano",
      "Melgar",
      "Purificación",
    ],
  },
  {
    name: "Valle del Cauca",
    cities: [
      "Buga",
      "Buenaventura",
      "Cali",
      "Cartago",
      "Jamundí",
      "Palmira",
      "Tuluá",
      "Yumbo",
    ],
  },
  {
    name: "Vaupés",
    cities: ["Mitú"],
  },
  {
    name: "Vichada",
    cities: ["Puerto Carreño"],
  },
];
