/**
 * Official list of the 35 barangays of the City of San Fernando, Pampanga.
 * Single source of truth for every barangay dropdown / filter in the app.
 */
export const SAN_FERNANDO_BARANGAYS = [
  'Alasas',
  'Baliti',
  'Bulaon',
  'Calulut',
  'Del Carmen',
  'Del Pilar',
  'Del Rosario',
  'Dela Paz Norte',
  'Dela Paz Sur',
  'Dolores',
  'Juliana',
  'Lara',
  'Lourdes',
  'Magliman',
  'Maimpis',
  'Malino',
  'Malpitic',
  'Pandaras',
  'Panipuan',
  'Pulung Bulu (Pulung Bulo)',
  'Quebiawan',
  'Saguin',
  'San Agustin',
  'San Felipe',
  'San Isidro',
  'San Jose',
  'San Juan',
  'San Nicolas',
  'San Pedro (San Pedro Cutud)',
  'Santa Lucia',
  'Santa Teresita',
  'Santo Niño',
  'Santo Rosario (Poblacion)',
  'Sindalan',
  'Telabastagan',
];

/** Ready-made `{ value, label }` options for <Select> components. */
export const BARANGAY_OPTIONS = SAN_FERNANDO_BARANGAYS.map((b) => ({ value: b, label: b }));

export default SAN_FERNANDO_BARANGAYS;
