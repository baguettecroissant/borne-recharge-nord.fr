// Programmatic Content Engine - Nord (59) - Borne de Recharge
// Generates highly unique, localized, helpful content for each commune in the Nord department.
// Uses a multi-dimensional sentence-level spintax matrix to avoid duplicate content penalties
// and provides rich technical details (E-E-A-T) optimized for local search queries in 59.

import { getNearbyCommunes } from './geoLinks';
import communes from '../data/communes.json';

export function spin(text: string, seed: string): string {
  let result = text;
  const spintaxRegex = /{([^{}]+)}/g;
  
  while (spintaxRegex.test(result)) {
    result = result.replace(spintaxRegex, (match, choicesStr) => {
      if (['VILLE', 'CODE_POSTAL', 'PRIX_MIN', 'PRIX_MAX', 'VARIANTE_INTRO'].includes(choicesStr)) {
        return match;
      }
      const choices = choicesStr.split('|');
      let hash = 0;
      for (let i = 0; i < seed.length; i++) {
        hash = (hash * 31 + seed.charCodeAt(i)) | 0;
      }
      hash = hash + choicesStr.length;
      const index = Math.abs(hash) % choices.length;
      return choices[index];
    });
  }
  return result;
}

export interface Commune {
  nom: string;
  slug: string;
  codeInsee: string;
  codePostal: string;
  population: number;
  altitude?: number;
  prixM2Moyen?: number;
  logements?: number;
  logementsMaison?: number;
  vehiculesElectriques?: number;
  croissanceVE?: number;
  bornesPubliques?: number;
  intercommunalite?: string;
  canton?: string;
  latitude?: number;
  longitude?: number;
}

export interface ExternalLink {
  label: string;
  url: string;
  description: string;
}

export interface GuideLink {
  href: string;
  label: string;
  desc: string;
}

export interface LocalContent {
  introParagraph: string;
  logisticsAlert: string;
  useCaseText: string;
  pricesContext: string;
  faqItems: { question: string; answer: string }[];
  ecoText: string;
  localContext: string;
  climateZoneLabel: string;
  localAgencyName: string;
  externalLinks: ExternalLink[];
  communeDataInsight: string;
  expertTip: string;
  tableIntro: string;
  guideLinks: GuideLink[];
  savingsEstimate: string;
  lastUpdated: string;
  realEstateInsight: string;
  populationTierContent: string;
}

export type ClimateZone = 'littoral-nord' | 'metropole-lille' | 'bassin-minier-avesnois';

const CATEGORY_OFFSETS: Record<string, number> = {
  main: 0,
  copropriete: 100,
  wallbox: 200
};

export function getClimateZone(codePostal: string, slug: string): ClimateZone {
  const cp = codePostal.trim();
  
  const littoralSlugs = new Set([
    'dunkerque', 'grande-synthe', 'coudekerque-branche', 'saint-pol-sur-mer', 'gravelines',
    'loon-plage', 'malo-les-bains', 'rosendael', 'bray-dunes', 'tetheghem'
  ]);
  if (littoralSlugs.has(slug) || cp.startsWith('59140') || cp.startsWith('59240') || cp.startsWith('59760') || cp.startsWith('59210')) {
    return 'littoral-nord';
  }
  
  const melSlugs = new Set([
    'lille', 'roubaix', 'tourcoing', 'villeneuve-d-ascq', 'marcq-en-baroeul', 'lambersart',
    'wasquehal', 'la-madeleine', 'armentieres', 'loos', 'wattrelos', 'ronchin',
    'faches-thumesnil', 'mons-en-baroeul', 'halluin', 'hem', 'croix', 'neuville-en-ferrain',
    'seclin', 'wambrechies', 'comines', 'bondues'
  ]);
  if (melSlugs.has(slug) || cp.startsWith('59000') || cp.startsWith('59160') || cp.startsWith('59170') || cp.startsWith('59260') || cp.startsWith('59800')) {
    return 'metropole-lille';
  }
  
  return 'bassin-minier-avesnois';
}

export function getLocalAgency(codePostal: string, slug: string): { name: string; detail: string; website: string } {
  const melSlugs = new Set([
    'lille', 'roubaix', 'tourcoing', 'villeneuve-d-ascq', 'marcq-en-baroeul', 'lambersart',
    'wasquehal', 'la-madeleine', 'armentieres', 'loos', 'wattrelos', 'ronchin',
    'faches-thumesnil', 'mons-en-baroeul', 'halluin', 'hem', 'croix', 'neuville-en-ferrain',
    'seclin', 'wambrechies', 'comines', 'bondues'
  ]);
  
  if (melSlugs.has(slug) || codePostal.startsWith('59000') || codePostal.startsWith('59100') || codePostal.startsWith('59200')) {
    return {
      name: "la Maison de l'Habitat Durable de la Métropole de Lille",
      detail: "le guichet d'information de la MEL pour la transition écologique",
      website: "maisonhabitatdurable-lillemetropole.fr"
    };
  }
  return {
    name: "l'Espace Conseil France Rénov' du Nord (animé par l'ADIL 59)",
    detail: "l'Espace Info Énergie de l'ADIL du Nord",
    website: "adil59.org"
  };
}

export function getVariantIndex(slug: string, offset: number, maxVariants: number): number {
  let hash = offset * 31;
  for (let i = 0; i < slug.length; i++) {
    hash = ((hash << 5) - hash + slug.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % maxVariants;
}

export function getDynamicPrices(commune: Commune) {
  const priceFactor = commune.population > 100000 || ['bondues', 'marcq-en-baroeul', 'lille'].includes(commune.slug) ? 1.05 : commune.population > 25000 ? 1.02 : 0.97;
  return {
    greenUp: { min: Math.round(380 * priceFactor), max: Math.round(680 * priceFactor) },
    wallbox7kW: { min: Math.round(1150 * priceFactor), max: Math.round(1750 * priceFactor) },
    wallbox11kW: { min: Math.round(1450 * priceFactor), max: Math.round(2100 * priceFactor) },
    wallbox22kW: { min: Math.round(1950 * priceFactor), max: Math.round(3350 * priceFactor) },
    copro: { min: Math.round(2400 * priceFactor), max: Math.round(4300 * priceFactor) },
    triUpgrade: { min: Math.round(480 * priceFactor), max: Math.round(1150 * priceFactor) },
    priceFactor
  };
}

function getExternalLinks(category: string, codePostal: string, slug: string): ExternalLink[] {
  const agency = getLocalAgency(codePostal, slug);
  const agencyUrl = agency.website.startsWith('http') ? agency.website : `https://www.${agency.website}`;
  const common: ExternalLink[] = [
    {
      label: "Programme ADVENIR — Subventions Bornes de Recharge",
      url: "https://advenir.mobi",
      description: "Site officiel du programme ADVENIR détaillant les primes pour particuliers en copropriété, syndics et entreprises."
    },
    {
      label: `${agency.name} — Service Public local`,
      url: agencyUrl,
      description: "Accompagnement de proximité gratuit pour votre transition énergétique et aides financières dans le Nord."
    },
    {
      label: "Annuaire des Électriciens qualifiés IRVE",
      url: "https://www.qualifelec.fr",
      description: "Vérifiez la qualification IRVE (Infrastructure de Recharge pour Véhicules Électriques) de votre électricien."
    }
  ];

  return common;
}

function getGuideLinks(category: string): GuideLink[] {
  const allGuides = [
    { href: '/guides/prix-installation-borne-recharge-nord-2026/', label: 'Prix Borne Nord 2026', desc: 'Budget complet pour équiper votre maison dans le 59.' },
    { href: '/guides/recharge-vehicule-electrique-hiver-nord/', label: 'Recharge & Froid Nordiste', desc: 'Comment préserver votre autonomie et recharger par températures négatives.' },
    { href: '/guides/aide-advenir-2026-nord-59/', label: 'Aides Financières Nord 2026', desc: "Cumuler ADVENIR, crédit d'impôt de 500€ et aides MEL." }
  ];
  return allGuides;
}

export function generateCommuneContent(
  commune: Commune,
  category: 'main' | 'copropriete' | 'wallbox'
): LocalContent {
  const resolvedCategory = category;
  const climateZone = getClimateZone(commune.codePostal, commune.slug);
  const agency = getLocalAgency(commune.codePostal, commune.slug);
  const catOffset = CATEGORY_OFFSETS[category] || 0;
  
  const nearby = getNearbyCommunes(commune.slug, communes as Commune[], 3);
  const nearbyNames = nearby.map(c => c.nom).join(', ');

  const zoneLabels = {
    'littoral-nord': "Dunkerquois & Flandre Littorale",
    'metropole-lille': "Métropole Lilloise & Plaine de la Lys",
    'bassin-minier-avesnois': "Bassin Minier, Douaisis & Sud-Avesnois"
  };

  // Spintax pools
  const introVariations = [
    "Le Nord est le 1er département des Hauts-de-France pour l'immatriculation de véhicules électriques en 2026",
    "La prime ADVENIR finance jusqu'à 50% de votre borne en copropriété lilloise — dossier monté par l'installateur",
    "Avec un garage et une prise standard, la recharge prend 30 heures. Avec une wallbox 7kW, seulement 6 heures",
    "La métropole européenne de Lille (MEL) subventionne l'installation de bornes pour ses 95 communes",
    "En copropriété à Roubaix ou Tourcoing, le droit à la prise (décret 2020) vous permet d'installer votre borne",
    "Un propriétaire du Nord qui recharge à domicile dépense 2€/100km au lieu de 15€/100km en essence",
    "Valenciennes, Douai et Cambrai concentrent les plus fortes progressions de VE du département",
    "L'hiver nordique réduit l'autonomie de votre VE de 20-30% — une wallbox rapide compense ce déficit"
  ];

  const patrimoineAnecdotes = {
    'littoral-nord': [
      `Le saviez-vous ? Dans le secteur de ${commune.nom}, à deux pas du port de Dunkerque ou des plages ventées de Flandre, les embruns marins imposent d'installer une borne de recharge extérieure certifiée IP54 et résistante à la corrosion. Pas de place pour l'improvisation si vous voulez recharger votre voiture après une balade dominicale sur la digue.`,
      `Entre le vent marin et le célèbre carnaval qui anime la côte nordiste, ${commune.nom} cultive un esprit d'innovation et de convivialité. C'est dans ce cadre dynamique que la transition vers la mobilité électrique s'accélère, portée par des électriciens IRVE attachés à la qualité et au travail bien fait, typiques des gens du Nord.`
    ],
    'metropole-lille': [
      `À ${commune.nom}, au cœur de la Métropole Européenne de Lille, la brique rouge traditionnelle abrite aujourd'hui des trésors de technologie. Rénover son garage flamand ou sa cour pavée pour y installer une wallbox blanche discrète, connectée aux heures creuses d'Enedis, c'est allier le charme de l'ancien au confort de 2026. C'est idéal pour partir le matin vers la Grand Place de Lille ou le Vieux-Lille l'esprit tranquille.`,
      `Avoir sa wallbox à ${commune.nom}, c'est s'assurer d'une recharge rapide à domicile plutôt que de chercher une borne publique occupée un jour de Braderie de Lille ou de grand match du LOSC. Nos installateurs locaux connaissent le bâti lillois sur le bout des doigts pour faire passer les câbles discrètement à travers les murs épais.`
    ],
    'bassin-minier-avesnois': [
      `Sous le regard bienveillant des anciens terrils reconvertis en réserves écologiques ou des fières églises de l'Avesnois, ${commune.nom} s'engage pleinement dans le transport vert. Installer sa borne de recharge individuelle dans une ancienne maison de mineur ou un pavillon de Valenciennes ou Douai redonne un coup de jeune au logement, tout en réduisant l'empreinte carbone locale.`,
      `À ${commune.nom}, les hivers sont froids et humides. Le gel qui s'installe sur les routes du bassin minier rappelle que les batteries de voitures électriques ont besoin d'une charge optimale et d'une wallbox abritée dans un garage ou installée sur un pied de borne hermétique pour fonctionner à plein régime.`
    ]
  };

  const localIntroPools = [
    `Pour les propriétaires de ${commune.nom} (${commune.codePostal}), disposer d'un point de recharge rapide à domicile est devenu indispensable. Avec une population de ${commune.population?.toLocaleString('fr-FR')} habitants et un parc immobilier composé à ${commune.logementsMaison}% de maisons individuelles, la configuration locale est idéale pour la pose d'une wallbox 7.4 kW ou 22 kW dans un garage ou une allée privée.`,
    `Faire installer une borne de recharge de voiture électrique à ${commune.nom} par un électricien agréé IRVE permet de bénéficier de garanties uniques. Dans le Nord, où l'humidité et les températures négatives hivernales sollicitent fortement la chimie des batteries de VE, la recharge rapide protège la longévité de votre véhicule.`,
    `Que vous habitiez dans une maison de ville en briques de la MEL, un pavillon à Douai ou une résidence en copropriété à Roubaix, nos installateurs partenaires réalisent votre étude technique de raccordement électrique gratuitement dans les plus brefs délais.`
  ];

  const localContextText = [
    localIntroPools[getVariantIndex(commune.slug, 1, localIntroPools.length)],
    patrimoineAnecdotes[climateZone][getVariantIndex(commune.slug, 2, patrimoineAnecdotes[climateZone].length)],
    `L'Espace Conseil ${agency.name} (que vous pouvez joindre au sujet des aides locales) recommande l'installation de bornes équipées du protocole de communication OCPP pour piloter précisément la charge en fonction de la production solaire ou du tarif d'électricité Enedis local.`
  ].join(' ');

  const pricing = getDynamicPrices(commune);

  const localFaq = [
    {
      question: `Faut-il modifier mon compteur Enedis Nord pour une borne à ${commune.nom} ?`,
      answer: `Si votre compteur électrique actuel à ${commune.nom} délivre une puissance de 6 kVA en monophasé, il est généralement conseillé de passer à 9 kVA pour pouvoir utiliser une wallbox de 7.4 kW sans coupure de disjoncteur. Pour recharger en 11 kW ou 22 kW, vous devez impérativement disposer d'une installation en triphasé (3 phases + neutre), ce qui nécessite une intervention d'Enedis Nord pour modifier votre raccordement.`
    },
    {
      question: `La borne de recharge craint-elle le gel ou la pluie à ${commune.nom} ?`,
      answer: `Non, les bornes posées par nos techniciens IRVE à ${commune.nom} possèdent un indice de protection minimal IP54 (étanchéité à la poussière et aux projections d'eau) et IK08 (résistance aux chocs mécaniques). Elles sont conçues pour fonctionner sans aucun problème entre -25°C et +50°C, résistant ainsi aux hivers rigoureux et aux gelées récurrentes dans le Nord.`
    },
    {
      question: `Puis-je bénéficier de l'aide ADVENIR pour une maison individuelle à ${commune.nom} ?`,
      answer: `Depuis les réformes récentes, la prime ADVENIR individuelle n'est plus applicable aux maisons individuelles isolées. En revanche, le crédit d'impôt national a été revalorisé à 500 € par point de recharge en 2026 pour tous les contribuables du Nord. De plus, la TVA réduite à 5,5% s'applique directement sur la facture de l'installateur qualifié IRVE.`
    }
  ];

  return {
    introParagraph: `Vous cherchez un installateur de borne de recharge à ${commune.nom} dans le Nord ? ${introVariations[getVariantIndex(commune.slug, 3, introVariations.length)]}. Les électriciens certifiés IRVE du 59 installent votre wallbox entre ${pricing.wallbox7kW.min.toLocaleString('fr-FR')}€ et ${pricing.wallbox7kW.max.toLocaleString('fr-FR')}€ TTC, aide ADVENIR et crédit d'impôt déduits.`,
    logisticsAlert: `⚠️ **Certification obligatoire** : N'oubliez pas que l'installation d'une puissance supérieure à 3.7 kW doit obligatoirement être réalisée par un professionnel titulaire d'une qualification IRVE en cours de validité sous peine de nullité de vos assurances en cas de sinistre.`,
    useCaseText: `Pour recharger une Tesla, une Renault Megane E-Tech, une Peugeot e-208 ou tout autre véhicule électrique à ${commune.nom}, la Wallbox monophasée 7.4 kW est le choix le plus populaire. Elle permet de récupérer environ 40 km d'autonomie par heure de charge. Pour les véhicules équipés d'un chargeur embarqué triphasé puissant (comme la Renault Zoe ou la Tesla Model 3), la wallbox 11 kW ou 22 kW réduit le temps d'attente à moins de 2 heures pour une recharge complète.`,
    pricesContext: `Les tarifs indiqués ci-dessus correspondent à une pose standard avec moins de 10 mètres de liaison câble de type 2 entre le tableau électrique principal et l'emplacement de la borne. Les prix varient selon les travaux de terrassement ou la mise aux normes du tableau.`,
    faqItems: localFaq,
    ecoText: `En passant d'une voiture essence à l'électrique à ${commune.nom}, et en chargeant votre voiture à domicile pendant les heures creuses (souvent gérées par Enedis de 22h à 6h dans le 59), vous divisez par 6 votre budget carburant, tout en bénéficiant d'un confort de conduite appréciable au quotidien.`,
    localContext: localContextText,
    climateZoneLabel: zoneLabels[climateZone],
    localAgencyName: agency.name,
    externalLinks: getExternalLinks(resolvedCategory, commune.codePostal, commune.slug),
    communeDataInsight: `Les données Enedis montrent qu'à ${commune.nom}, le nombre de véhicules électriques est en hausse constante avec environ ${commune.vehiculesElectriques} VE immatriculés localement. Le taux de croissance annuel du parc électrique de la commune est d'environ ${commune.croissanceVE}%.`,
    expertTip: `Conseil d'expert : Pour les foyers de ${commune.nom} équipés de compteurs Linky, l'installation d'un module de délestage dynamique est fortement recommandée. Il permet d'adapter la puissance de la borne en temps réel aux autres consommations de la maison (four, chauffage, lave-linge) pour éviter toute disjonction générale du compteur.`,
    tableIntro: `Voici un récapitulatif des coûts moyens constatés pour l'installation d'équipements de charge à ${commune.nom} en 2026 :`,
    guideLinks: getGuideLinks(resolvedCategory),
    savingsEstimate: `environ 1 200 € d'économie de carburant par an pour 15 000 km parcourus dans le Nord.`,
    lastUpdated: `Juin 2026`,
    realEstateInsight: `Installer une borne de recharge à ${commune.nom} valorise votre patrimoine. Les agences immobilières du 59 confirment qu'une place de parking équipée d'une borne IRVE ou un garage câblé pour wallbox augmente l'attractivité d'une maison à la vente de 3% à 5%, facilitant la négociation sur le secteur de Lille et de la métropole.`,
    populationTierContent: `Avec ses ${commune.population} habitants, ${commune.nom} dispose de ${commune.bornesPubliques} bornes de recharge publiques. Recharger chez soi reste cependant la solution la plus économique et la plus pratique au quotidien.`
  };
}
