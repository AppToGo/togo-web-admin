/**
 * Colombian departments and their municipalities — lista completa del DANE
 * (divipola, 1119 municipios en los 33 departamentos), usada en el selector
 * de departamento/ciudad del registro de negocios y en el formulario de sedes.
 *
 * Solo se guarda la ciudad seleccionada en la base de datos — el departamento
 * se usa únicamente para filtrar la lista de ciudades en el UI.
 *
 * RAW_DEPARTMENTS no está tipeado en orden alfabético a propósito (sigue el
 * agrupamiento por subregión del DANE). COLOMBIA_DEPARTMENTS se deriva
 * ordenando departamentos y ciudades alfabéticamente (localeCompare "es") en
 * tiempo de carga del módulo.
 */

export interface ColombianDepartment {
  name: string;
  cities: string[];
}

const RAW_DEPARTMENTS: ColombianDepartment[] = [
  {
    name: "Amazonas",
    cities: [
      "El Encanto",
      "La Chorrera",
      "La Pedrera",
      "La Victoria",
      "Leticia",
      "Miriti-Paraná",
      "Puerto Alegría",
      "Puerto Arica",
      "Puerto Nariño",
      "Puerto Santander",
      "Tarapacá",
    ],
  },
  {
    name: "Antioquia",
    cities: [
      "Cáceres", "Caucasia", "El Bagre", "Nechí", "Tarazá", "Zaragoza",
      "Caracolí", "Maceo", "Puerto Berrío", "Puerto Nare", "Puerto Triunfo", "Yondó",
      "Amalfi", "Anorí", "Cisneros", "Remedios", "San Roque", "Santo Domingo", "Segovia", "Vegachí", "Yalí", "Yolombó",
      "Angostura", "Belmira", "Briceño", "Campamento", "Carolina Del Príncipe", "Don Matías", "Entrerríos", "Gómez Plata", "Guadalupe", "Ituango", "San Andrés De Cuerquía", "San José De La Montaña", "San Pedro De Los Milagros", "Santa Rosa De Osos", "Toledo", "Valdivia", "Yarumal",
      "Abriaquí", "Anzá", "Armenia", "Buriticá", "Cañasgordas", "Dabeiba", "Ebéjico", "Frontino", "Giraldo", "Heliconia", "Liborina", "Olaya", "Peque", "Sabanalarga", "San Jerónimo", "Santa Fe De Antioquia", "Sopetrán", "Uramita",
      "Abejorral", "Alejandría", "Argelia", "El Carmen De Viboral", "Cocorná", "Concepción", "Granada", "Guarne", "Guatapé", "La Ceja", "La Unión", "Marinilla", "Nariño", "Peñol", "Retiro", "Rionegro", "San Carlos", "San Francisco", "San Luis", "San Rafael", "San Vicente Ferrer", "Santuario", "Sonsón",
      "Amagá", "Andes", "Angelópolis", "Betania", "Betulia", "Caicedo", "Caramanta", "Ciudad Bolívar", "Concordia", "Fredonia", "Hispania", "Jardín", "Jericó", "La Pintada", "Montebello", "Pueblorrico", "Salgar", "Santa Bárbara", "Támesis", "Tarso", "Titiribí", "Urrao", "Valparaíso", "Venecia",
      "Apartadó", "Arboletes", "Carepa", "Chigorodó", "Murindó", "Mutatá", "Necoclí", "San Juan De Urabá", "San Pedro De Urabá", "Turbo", "Vigía Del Fuerte",
      "Barbosa", "Bello", "Caldas", "Copacabana", "Envigado", "Girardota", "Itagüí", "La Estrella", "Medellín", "Sabaneta",
    ],
  },
  {
    name: "Arauca",
    cities: ["Arauca", "Arauquita", "Cravo Norte", "Fortul", "Puerto Rondón", "Saravena", "Tame"],
  },
  {
    name: "San Andrés y Providencia",
    cities: ["Providencia y Santa Catalina", "San Andrés"],
  },
  {
    name: "Atlántico",
    cities: [
      "Barranquilla", "Galapa", "Malambo", "Puerto Colombia", "Soledad",
      "Campo De La Cruz", "Candelaria", "Luruaco", "Manatí", "Repelón", "Santa Lucía", "Suán",
      "Baranoa", "Palmar De Varela", "Polonuevo", "Ponedera", "Sabanagrande", "Sabanalarga", "Santo Tomás",
      "Juan De Acosta", "Piojó", "Tubará", "Usiacurí",
    ],
  },
  {
    name: "Bogotá D.C.",
    cities: ["Bogotá"],
  },
  {
    name: "Bolívar",
    cities: [
      "Cicuco", "Hatillo De Loba", "Margarita", "Mompós", "San Fernando", "Talaigua Nuevo",
      "Arjona", "Arroyohondo", "Calamar", "Cartagena", "Clemencia", "Mahates", "San Cristóbal", "San Estanislao", "Santa Catalina", "Santa Rosa De Lima", "Soplaviento", "Turbaco", "Turbaná", "Villanueva",
      "Altos Del Rosario", "Barranco De Loba", "El Peñón", "Regidor", "Río Viejo", "San Martín De Loba",
      "Arenal", "Cantagallo", "Morales", "San Pablo", "Santa Rosa Del Sur", "Simití",
      "Achí", "Magangué", "Montecristo", "Pinillos", "San Jacinto Del Cauca", "Tiquisio",
      "Carmen De Bolívar", "Córdoba", "El Guamo", "María La Baja", "San Jacinto", "San Juan Nepomuceno", "Zambrano",
    ],
  },
  {
    name: "Boyacá",
    cities: [
      "Chíquiza", "Chivatá", "Cómbita", "Cucaita", "Motavita", "Oicatá", "Samacá", "Siachoque", "Sora", "Soracá", "Sotaquirá", "Toca", "Tunja", "Tuta", "Ventaquemada",
      "Chiscas", "Cubará", "El Cocuy", "El Espino", "Guacamayas", "Güicán", "Panqueba",
      "Labranzagrande", "Pajarito", "Paya", "Pisba",
      "Berbeo", "Campohermoso", "Miraflores", "Páez", "San Eduardo", "Zetaquira",
      "Boyacá", "Ciénega", "Jenesano", "Nuevo Colón", "Ramiriquí", "Rondón", "Tibaná", "Turmequé", "Úmbita", "Viracachá",
      "Chinavita", "Garagoa", "Macanal", "Pachavita", "San Luis De Gaceno", "Santa María",
      "Boavita", "Covarachía", "La Uvita", "San Mateo", "Sativanorte", "Sativasur", "Soatá", "Susacón", "Tipacoque",
      "Briceño", "Buenavista", "Caldas", "Chiquinquirá", "Cóper", "La Victoria", "Maripí", "Muzo", "Otanche", "Pauna", "Puerto Boyacá", "Quípama", "Saboyá", "San Miguel De Sema", "San Pablo De Borbur", "Tununguá",
      "Almeida", "Chivor", "Guateque", "Guayatá", "La Capilla", "Somondoco", "Sutatenza", "Tenza",
      "Arcabuco", "Chitaraque", "Gachantivá", "Moniquirá", "Ráquira", "Sáchica", "San José De Pare", "Santa Sofía", "Santana", "Sutamarchán", "Tinjacá", "Togüí", "Villa De Leyva",
      "Aquitania", "Cuítiva", "Firavitoba", "Gámeza", "Iza", "Mongua", "Monguí", "Nobsa", "Pesca", "Sogamoso", "Tibasosa", "Tópaga", "Tota",
      "Belén", "Busbanzá", "Cerinza", "Corrales", "Duitama", "Floresta", "Paipa", "Santa Rosa De Viterbo", "Tutazá",
      "Betéitiva", "Chita", "Jericó", "Paz De Río", "Socha", "Socotá", "Tasco",
    ],
  },
  {
    name: "Caldas",
    cities: [
      "Filadelfia", "La Merced", "Marmato", "Riosucio", "Supía",
      "Manzanares", "Marquetalia", "Marulanda", "Pensilvania",
      "Anserma", "Belalcázar", "Risaralda", "San José", "Viterbo",
      "Chinchiná", "Manizales", "Neira", "Palestina", "Villamaría",
      "Aguadas", "Aranzazu", "Pácora", "Salamina",
      "La Dorada", "Norcasia", "Samaná", "Victoria",
    ],
  },
  {
    name: "Caquetá",
    cities: [
      "Albania", "Belén De Los Andaquíes", "Cartagena Del Chairá", "Currillo", "El Doncello", "El Paujil",
      "Florencia", "La Montañita", "Milán", "Morelia", "Puerto Rico", "San José Del Fragua",
      "San Vicente Del Caguán", "Solano", "Solita", "Valparaíso",
    ],
  },
  {
    name: "Casanare",
    cities: [
      "Aguazul", "Chámeza", "Hato Corozal", "La Salina", "Maní", "Monterrey", "Nunchía", "Orocué",
      "Paz De Ariporo", "Pore", "Recetor", "Sabanalarga", "Sácama", "San Luis De Palenque", "Támara",
      "Tauramena", "Trinidad", "Villanueva", "Yopal",
    ],
  },
  {
    name: "Cauca",
    cities: [
      "Cajibío", "El Tambo", "La Sierra", "Morales", "Piendamó", "Popayán", "Rosas", "Sotará", "Timbío",
      "Buenos Aires", "Caloto", "Corinto", "Miranda", "Padilla", "Puerto Tejada", "Santander De Quilichao", "Suárez", "Villa Rica",
      "Guapi", "López", "Timbiquí",
      "Caldono", "Inzá", "Jámbaló", "Páez", "Puracé", "Silvia", "Toribío", "Totoró",
      "Almaguer", "Argelia", "Balboa", "Bolívar", "Florencia", "La Vega", "Mercaderes", "Patía", "Piamonte", "San Sebastián", "Santa Rosa", "Sucre",
    ],
  },
  {
    name: "Cesar",
    cities: [
      "Becerril", "Chimichagua", "Chiriguaná", "Curumaní", "La Jagua De Ibirico", "Pailitas", "Tamalameque",
      "Astrea", "Bosconia", "El Copey", "El Paso",
      "Agustín Codazzi", "La Paz", "Manaure", "Pueblo Bello", "San Diego", "Valledupar",
      "Aguachica", "Gamarra", "González", "La Gloria", "Pelaya", "Río De Oro", "San Alberto", "San Martín",
    ],
  },
  {
    name: "Chocó",
    cities: [
      "Atrato", "Bagadó", "Bojayá", "El Carmen De Atrato", "Lloró", "Medio Atrato", "Quibdó", "Río Quito",
      "Acandí", "Belén De Bajirá", "Carmen Del Darién", "Riosucio", "Unguía",
      "Bahía Solano", "Juradó", "Nuquí",
      "Alto Baudó", "Bajo Baudó", "El Litoral Del San Juan", "Medio Baudó",
      "Cantón De San Pablo", "Certegui", "Condoto", "Istmina", "Medio San Juan", "Nóvita", "Río Frío", "San José Del Palmar", "Sipí", "Tadó", "Unión Panamericana",
    ],
  },
  {
    name: "Córdoba",
    cities: [
      "Tierralta", "Valencia",
      "Chimá", "Cotorra", "Lorica", "Momil", "Purísima",
      "Montería",
      "Canalete", "Los Córdobas", "Moñitos", "Puerto Escondido", "San Antero", "San Bernardo Del Viento",
      "Chinú", "Sahagún", "San Andrés Sotavento",
      "Ayapel", "Buenavista", "La Apartada", "Montelíbano", "Planeta Rica", "Pueblo Nuevo", "Puerto Libertador",
      "Cereté", "Ciénaga De Oro", "San Carlos", "San Pelayo",
    ],
  },
  {
    name: "Cundinamarca",
    cities: [
      "Chocontá", "Machetá", "Manta", "Sesquilé", "Suesca", "Tibirita", "Villapinzón",
      "Agua De Dios", "Girardot", "Guataquí", "Jerusalén", "Nariño", "Nilo", "Ricaurte", "Tocaima",
      "Caparrapí", "Guaduas", "Puerto Salgar",
      "Albán", "La Peña", "La Vega", "Nimaima", "Nocaima", "Quebradanegra", "San Francisco", "Sasaima", "Supatá", "Útica", "Vergara", "Villeta",
      "Gachalá", "Gachetá", "Gama", "Guasca", "Guatavita", "Junín", "La Calera", "Ubalá",
      "Beltrán", "Bituima", "Chaguaní", "Guayabal De Síquima", "Puli", "San Juan De Río Seco", "Vianí",
      "Medina", "Paratebueno",
      "Cáqueza", "Chipaque", "Choachí", "Fómeque", "Fosca", "Guayabetal", "Gutiérrez", "Quetame", "Ubaque", "Une",
      "El Peñón", "La Palma", "Pacho", "Paime", "San Cayetano", "Topaipí", "Villagómez", "Yacopí",
      "Cajicá", "Chía", "Cogua", "Gachancipá", "Nemocón", "Sopó", "Tabio", "Tocancipá", "Zipaquirá",
      "Bojacá", "Cota", "El Rosal", "Facatativá", "Funza", "Madrid", "Mosquera", "Subachoque", "Tenjo", "Zipacón",
      "Sibaté", "Soacha",
      "Arbeláez", "Cabrera", "Fusagasugá", "Granada", "Pandi", "Pasca", "San Bernardo", "Silvania", "Tibacuy", "Venecia",
      "Anapoima", "Anolaima", "Apulo", "Cachipay", "El Colegio", "La Mesa", "Quipile", "San Antonio Del Tequendama", "Tena", "Viotá",
      "Carmen De Carupa", "Cucunubá", "Fúquene", "Guachetá", "Lenguazaque", "Simijaca", "Susa", "Sutatausa", "Tausa", "Ubaté",
    ],
  },
  {
    name: "Guainía",
    cities: ["Barranco Minas", "Cacahual", "Inírida", "La Guadalupe", "Mapiripana", "Morichal", "Pana Pana", "Puerto Colombia", "San Felipe"],
  },
  {
    name: "Guaviare",
    cities: ["Calamar", "El Retorno", "Miraflores", "San José Del Guaviare"],
  },
  {
    name: "Huila",
    cities: [
      "Agrado", "Altamira", "Garzón", "Gigante", "Guadalupe", "Pital", "Suaza", "Tarqui",
      "Aipe", "Algeciras", "Baraya", "Campoalegre", "Colombia", "Hobo", "Íquira", "Neiva", "Palermo", "Rivera", "Santa María", "Tello", "Teruel", "Villavieja", "Yaguará",
      "La Argentina", "La Plata", "Nátaga", "Paicol", "Tesalia",
      "Acevedo", "Elías", "Isnos", "Oporapa", "Palestina", "Pitalito", "Saladoblanco", "San Agustín", "Timaná",
    ],
  },
  {
    name: "La Guajira",
    cities: [
      "Albania", "Dibulla", "Maicao", "Manaure", "Riohacha", "Uribia",
      "Barrancas", "Distracción", "El Molino", "Fonseca", "Hatonuevo", "La Jagua Del Pilar", "San Juan Del Cesar", "Urumita", "Villanueva",
    ],
  },
  {
    name: "Magdalena",
    cities: [
      "Ariguaní", "Chibolo", "Nueva Granada", "Plato", "Sabanas De San Ángel", "Tenerife",
      "Algarrobo", "Aracataca", "Ciénaga", "El Retén", "Fundación", "Pueblo Viejo", "Zona Bananera",
      "Cerro San Antonio", "Concordia", "El Piñón", "Pedraza", "Pivijay", "Remolino", "Salamina", "Sitionuevo", "Zapayán",
      "Santa Marta",
      "El Banco", "Guamal", "Pijiño Del Carmen", "San Sebastián De Buenavista", "San Zenón", "Santa Ana", "Santa Bárbara De Pinto",
    ],
  },
  {
    name: "Meta",
    cities: [
      "El Castillo", "El Dorado", "Fuente De Oro", "Granada", "La Macarena", "La Uribe", "Lejanías", "Mapiripán", "Mesetas", "Puerto Concordia", "Puerto Lleras", "Puerto Rico", "San Juan De Arama", "Vista Hermosa",
      "Villavicencio",
      "Acacías", "Barranca De Upía", "Castilla La Nueva", "Cumaral", "El Calvario", "Guamal", "Restrepo", "San Carlos De Guaroa", "San Juanito", "San Luis De Cubarral", "San Martín",
      "Cabuyaro", "Puerto Gaitán", "Puerto López",
    ],
  },
  {
    name: "Nariño",
    cities: [
      "Chachagüí", "Consacá", "El Peñol", "El Tambo", "La Florida", "Nariño", "Pasto", "Sandoná", "Tangua", "Yacuanquer",
      "Ancuya", "Guaitarilla", "La Llanada", "Linares", "Los Andes", "Mallama", "Ospina", "Providencia", "Ricaurte", "Samaniego", "Santacruz", "Sapuyes", "Túquerres",
      "Barbacoas", "El Charco", "Francisco Pizarro", "La Tola", "Magüí", "Mosquera", "Olaya Herrera", "Roberto Payán", "Santa Bárbara", "Tumaco",
      "Albán", "Arboleda", "Belén", "Buesaco", "Colón", "Cumbitara", "El Rosario", "El Tablón De Gómez", "La Cruz", "La Unión", "Leiva", "Policarpa", "San Bernardo", "San Lorenzo", "San Pablo", "San Pedro De Cartago", "Taminango",
      "Aldana", "Contadero", "Córdoba", "Cuaspud", "Cumbal", "Funes", "Guachucal", "Gualmatán", "Iles", "Imués", "Ipiales", "Potosí", "Puerres", "Pupiales",
    ],
  },
  {
    name: "Norte de Santander",
    cities: [
      "Arboledas", "Cucutilla", "Gramalote", "Lourdes", "Salazar", "Santiago", "Villa Caro",
      "Bucarasica", "El Tarra", "Sardinata", "Tibú",
      "Ábrego", "Cachirá", "Convención", "El Carmen", "Hacarí", "La Esperanza", "La Playa", "Ocaña", "San Calixto", "Teorama",
      "Cúcuta", "El Zulia", "Los Patios", "Puerto Santander", "San Cayetano", "Villa Del Rosario",
      "Cácota", "Chitagá", "Mutiscua", "Pamplona", "Pamplonita", "Silos",
      "Bochalema", "Chinácota", "Durania", "Herrán", "Labateca", "Ragonvalia", "Toledo",
    ],
  },
  {
    name: "Putumayo",
    cities: [
      "Colón", "Mocoa", "Orito", "Puerto Asís", "Puerto Caicedo", "Puerto Guzmán", "Puerto Leguízamo",
      "San Francisco", "San Miguel", "Santiago", "Sibundoy", "Valle Del Guamuez", "Villagarzón",
    ],
  },
  {
    name: "Quindío",
    cities: [
      "Armenia", "Córdoba", "Génova", "Pijao", "Filandia", "Salento",
      "Circasia", "La Tebaida", "Montenegro", "Quimbaya", "Buenavista", "Calarcá",
    ],
  },
  {
    name: "Risaralda",
    cities: [
      "Dosquebradas", "La Virginia", "Marsella", "Pereira", "Santa Rosa De Cabal",
      "Apía", "Balboa", "Belén De Umbría", "Guática", "La Celia", "Quinchía", "Santuario",
      "Mistrató", "Pueblo Rico",
    ],
  },
  {
    name: "Santander",
    cities: [
      "Chima", "Confines", "Contratación", "El Guacamayo", "Galán", "Gámbita", "Guadalupe", "Guapotá", "Hato", "Oiba", "Palmar", "Palmas Del Socorro", "Santa Helena Del Opón", "Simacota", "Socorro", "Suaita",
      "Capitanejo", "Carcasí", "Cepitá", "Cerrito", "Concepción", "Enciso", "Guaca", "Macaravita", "Málaga", "Molagavita", "San Andrés", "San José De Miranda", "San Miguel",
      "Aratoca", "Barichara", "Cabrera", "Charalá", "Coromoro", "Curití", "Encino", "Jordán", "Mogotes", "Ocamonte", "Onzaga", "Páramo", "Pinchote", "San Gil", "San Joaquín", "Valle De San José", "Villanueva",
      "Barrancabermeja", "Betulia", "El Carmen De Chucurí", "Puerto Wilches", "Sabana De Torres", "San Vicente De Chucurí", "Zapatoca",
      "Bucaramanga", "California", "Charta", "El Playón", "Floridablanca", "Girón", "Lebrija", "Los Santos", "Matanza", "Piedecuesta", "Rionegro", "Santa Bárbara", "Suratá", "Tona", "Vetas",
      "Aguada", "Albania", "Barbosa", "Bolívar", "Chipatá", "Cimitarra", "El Peñón", "Florián", "Guavatá", "Güepsa", "Jesús María", "La Belleza", "La Paz", "Landázuri", "Puente Nacional", "Puerto Parra", "San Benito", "Sucre", "Vélez",
    ],
  },
  {
    name: "Sucre",
    cities: [
      "Guaranda", "Majagual", "Sucre",
      "Chalán", "Coloso", "Morroa", "Ovejas", "Sincelejo",
      "Coveñas", "Palmito", "San Onofre", "Santiago De Tolú", "Tolú Viejo",
      "Buenavista", "Corozal", "El Roble", "Galeras", "Los Palmitos", "Sampués", "San Juan De Betulia", "San Pedro", "Sincé",
      "Caimito", "La Unión", "San Benito Abad", "San Marcos",
    ],
  },
  {
    name: "Tolima",
    cities: [
      "Casabianca", "Herveo", "Lérida", "Líbano", "Murillo", "Santa Isabel", "Venadillo", "Villahermosa",
      "Ambalema", "Armero", "Falán", "Fresno", "Honda", "Mariquita", "Palocabildo",
      "Carmen De Apicalá", "Cunday", "Icononzo", "Melgar", "Villarrica",
      "Ataco", "Chaparral", "Coyaima", "Natagaima", "Ortega", "Planadas", "Rioblanco", "Roncesvalles", "San Antonio",
      "Alvarado", "Anzoátegui", "Cajamarca", "Coello", "Espinal", "Flandes", "Ibagué", "Piedras", "Rovira", "San Luis", "Valle De San Juan",
      "Alpujarra", "Dolores", "Guamo", "Prado", "Purificación", "Saldaña", "Suárez",
    ],
  },
  {
    name: "Valle del Cauca",
    cities: [
      "Andalucía", "Buga", "Bugalagrande", "Calima", "El Cerrito", "Ginebra", "Guacarí", "Restrepo", "Riofrío", "San Pedro", "Trujillo", "Tuluá", "Yotoco",
      "Alcalá", "Ansermanuevo", "Argelia", "Bolívar", "Cartago", "El Águila", "El Cairo", "El Dovio", "La Unión", "La Victoria", "Obando", "Roldanillo", "Toro", "Ulloa", "Versalles", "Zarzal",
      "Buenaventura",
      "Caicedonia", "Sevilla",
      "Cali", "Candelaria", "Dagua", "Florida", "Jamundí", "La Cumbre", "Palmira", "Pradera", "Vijes", "Yumbo",
    ],
  },
  {
    name: "Vaupés",
    cities: ["Carurú", "Mitú", "Pacoa", "Papunaua", "Taraira", "Yavaraté"],
  },
  {
    name: "Vichada",
    cities: ["Cumaribo", "La Primavera", "Puerto Carreño", "Santa Rosalía"],
  },
];

export const COLOMBIA_DEPARTMENTS: ColombianDepartment[] = RAW_DEPARTMENTS
  .map((dept) => ({
    ...dept,
    cities: [...dept.cities].sort((a, b) => a.localeCompare(b, "es")),
  }))
  .sort((a, b) => a.name.localeCompare(b.name, "es"));
