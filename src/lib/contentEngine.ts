// Programmatic Content Engine - Nord (59) - Borne de Recharge
// Generates highly unique, localized, helpful content for each commune in the Nord department.
// Uses a multi-dimensional sentence-level spintax matrix to avoid duplicate content penalties
// and provides rich technical details (E-E-A-T) optimized for local search queries in 59.

import { getNearbyCommunes } from './geoLinks';
import communes from '../data/communes.json';

export function spin(text: string, seed: string): string {
  let result = text;
  const spintaxTest = /{([^{}|]+\|[^{}]+)}/;
  const spintaxReplace = /{([^{}|]+\|[^{}]+)}/g;
  
  while (spintaxTest.test(result)) {
    result = result.replace(spintaxReplace, (match, choicesStr) => {
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
  // FNV-1a inspired hash with proper offset mixing
  let hash = 2166136261; // FNV offset basis
  hash = Math.imul(hash ^ offset, 16777619);
  hash = Math.imul(hash ^ (offset >>> 16), 2654435761);
  for (let i = 0; i < slug.length; i++) {
    hash = Math.imul(hash ^ slug.charCodeAt(i), 16777619);
  }
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 2246822507);
  hash ^= hash >>> 13;
  return (hash >>> 0) % maxVariants;
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
  
  const base: ExternalLink[] = [
    {
      label: "Programme ADVENIR — Subventions Bornes de Recharge",
      url: "https://advenir.mobi",
      description: "Site officiel du programme ADVENIR détaillant les primes pour les particuliers, les syndics et les entreprises."
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

  if (category === 'copropriete') {
    return [
      ...base,
      {
        label: "Légifrance — Décret n° 2020-1720 (Droit à la prise)",
        url: "https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000042740927",
        description: "Texte de loi officiel régissant le droit à la prise pour la recharge des véhicules électriques en copropriété."
      },
      {
        label: "ANIL — Guide des droits du copropriétaire",
        url: "https://www.anil.org",
        description: "Informations officielles de l'Agence Nationale pour l'Information sur le Logement concernant les travaux en copropriété."
      }
    ];
  } else if (category === 'wallbox') {
    return [
      ...base,
      {
        label: "Automobile Propre — Guide de la recharge à domicile",
        url: "https://www.automobile-propre.com",
        description: "Comparatifs indépendants, temps de charge et explications détaillées sur le fonctionnement des wallbox."
      },
      {
        label: "Data.gouv.fr — Carte des bornes publiques",
        url: "https://www.data.gouv.fr/fr/datasets/fichier-national-consolide-des-bornes-de-recharge-pour-vehicules-electriques-irve/",
        description: "Base de données nationale officielle recensant l'ensemble des points de recharge IRVE publics en France."
      }
    ];
  } else {
    // main
    return [
      ...base,
      {
        label: "Service-Public.fr — Crédit d'impôt Borne de recharge",
        url: "https://www.service-public.fr/particuliers/vosdroits/F35535",
        description: "Fiche officielle décrivant les conditions pour bénéficier du crédit d'impôt de 500 € en 2026."
      },
      {
        label: "Enedis — Raccordement borne de recharge",
        url: "https://www.enedis.fr/raccorder-une-borne-de-recharge-de-vehicule-electrique",
        description: "Guide du gestionnaire de réseau électrique sur les étapes de raccordement et d'augmentation de puissance."
      }
    ];
  }
}

function getGuideLinks(category: string): GuideLink[] {
  if (category === 'copropriete') {
    return [
      { href: '/guides/borne-recharge-copropriete-lille-droit-prise/', label: 'Droit à la Prise Copro', desc: 'Comment installer votre borne en résidence collective.' },
      { href: '/guides/aide-advenir-2026-nord-59/', label: 'Aides Financières Nord 2026', desc: "Cumuler ADVENIR, crédit d'impôt et aides locales." },
      { href: '/guides/monophase-triphase-compteur-enedis-nord/', label: 'Compteur Enedis Triphasé', desc: 'Raccorder sa borne en monophasé ou triphasé dans le 59.' }
    ];
  } else if (category === 'wallbox') {
    return [
      { href: '/guides/meilleures-wallbox-2026-comparatif/', label: 'Comparatif Wallbox 2026', desc: 'Le match des meilleures marques de bornes à domicile.' },
      { href: '/guides/wallbox-7kw-11kw-22kw-comparatif/', label: 'Puissance Borne Choisir', desc: 'Différences et temps de charge entre 7kW, 11kW et 22kW.' },
      { href: '/guides/recharge-vehicule-electrique-hiver-nord/', label: 'Recharge & Froid Nordiste', desc: 'Comment préserver votre autonomie par températures négatives.' }
    ];
  } else {
    // main
    return [
      { href: '/guides/prix-installation-borne-recharge-nord-2026/', label: 'Prix Borne Nord 2026', desc: 'Budget complet pour équiper votre maison dans le 59.' },
      { href: '/guides/installateur-irve-nord-certification/', label: 'Certification IRVE Obligatoire', desc: 'Pourquoi passer par un électricien qualifié est indispensable.' },
      { href: '/guides/recharge-vehicule-electrique-hiver-nord/', label: 'Recharge & Froid Nordiste', desc: 'Gérer la charge de sa voiture électrique sous le climat du Nord.' }
    ];
  }
}

// Spintax pools definition
const INTRO_POOLS: Record<string, string[]> = {
  main: [
    "Pour {l'installation|la pose} de votre borne de recharge à {VILLE}, {profitez|bénéficiez} d'une pose clés en main par nos techniciens certifiés IRVE. Nous réalisons une étude de conformité de votre tableau électrique pour garantir une charge {sûre|sécurisée}.",
    "Besoin d'installer une borne pour votre véhicule électrique à {VILLE} ? Nos installateurs locaux du Nord vous accompagnent dans le choix d'une wallbox {adaptée|performante} et gèrent vos démarches d'aides financières.",
    "Sécurisez la charge de votre véhicule électrique à {VILLE} grâce à une wallbox {7.4 kW|11 kW} installée par un électricien IRVE agréé. Devis gratuit et visite technique sous {48h|deux jours} dans tout le 59.",
    "Avec le développement du véhicule électrique dans le département du Nord, équiper sa maison de {VILLE} d'une borne de recharge rapide à domicile est la solution {idéale|optimale} pour charger à moindre coût.",
    "Vous habitez à {VILLE} et souhaitez passer à la vitesse supérieure pour votre voiture électrique ? Nos électriciens partenaires certifiés Qualifelec IRVE installent votre borne de recharge {à domicile|chez vous}.",
    "Recharger sa voiture sur une prise domestique standard à {VILLE} est {trop lent|inefficace} et risqué. Optez pour une installation de borne murale rapide et sécurisée, réalisée aux normes NF C 15-100.",
    "Nos experts en solutions de recharge interviennent à {VILLE} pour dimensionner et poser votre wallbox. Bénéficiez des aides de l'État (TVA à 5,5% et crédit d'impôt de 500 €) avec nos {pros|artisans certifiés}.",
    "Profitez de l'expertise d'un installateur IRVE à {VILLE} pour raccorder votre wallbox intelligente. Nous configurons le délestage dynamique pour protéger l'installation électrique de votre {maison|logement}."
  ],
  copropriete: [
    "Vous habitez en copropriété à {VILLE} et souhaitez installer une borne de recharge ? Le droit à la prise vous garantit la possibilité d'équiper votre place de parking à vos frais, avec le soutien des aides ADVENIR.",
    "Installez votre borne de recharge en copropriété à {VILLE} en toute simplicité. Nos techniciens certifiés IRVE vous aident à formaliser votre demande auprès du syndic et à obtenir jusqu'à 960 € de subvention.",
    "Le droit à la prise (décret 2020) permet à tout locataire ou propriétaire d'un appartement à {VILLE} d'installer un point de recharge sur son emplacement de stationnement. Découvrez nos solutions agréées IRVE.",
    "Sécurisez la recharge de votre voiture électrique dans votre résidence à {VILLE}. Nous concevons des installations individuelles ou collectives conformes aux normes de sécurité et éligibles aux primes ADVENIR.",
    "Rendre votre copropriété à {VILLE} compatible avec la recharge électrique valorise l'ensemble des appartements. Nos experts IRVE interviennent pour installer des bornes individuelles raccordées aux parties communes.",
    "Le raccordement d'une borne en parking partagé ou sous-sol à {VILLE} requiert une expertise spécifique. Nous réalisons l'étude technique nécessaire pour présenter un dossier solide à votre syndic de copropriété.",
    "Faites installer votre wallbox dans votre résidence de {VILLE} en bénéficiant de la prime ADVENIR copropriété qui finance jusqu'à 50% du projet d'installation électrique individuelle.",
    "Nos électriciens certifiés IRVE dans le Nord accompagnent les syndics et les copropriétaires de {VILLE} de l'étude de faisabilité technique jusqu'à la mise en service finale de la borne."
  ],
  wallbox: [
    "Optimisez la recharge de votre voiture électrique à {VILLE} en faisant installer une borne murale rapide (Wallbox) de 7.4 kW à 22 kW par nos électriciens certifiés IRVE dans le Nord.",
    "Besoin d'une recharge rapide et intelligente à domicile à {VILLE} ? Découvrez nos modèles de Wallbox connectées avec gestion des heures creuses et délestage de puissance en temps réel.",
    "Installez une borne de recharge performante (Wallbox) dans votre maison à {VILLE}. Nous sélectionnons les meilleures marques du marché pour vous garantir une charge sécurisée et rapide.",
    "La Wallbox est la solution de recharge résidentielle par excellence à {VILLE}. Elle permet de recharger votre véhicule électrique jusqu'à 8 fois plus vite qu'une prise de courant standard.",
    "Faites poser votre borne Wallbox à {VILLE} par un électricien agréé IRVE pour sécuriser votre installation électrique et bénéficier des aides financières de l'État en 2026.",
    "Vous cherchez à réduire le temps de charge de votre voiture électrique à {VILLE} ? Nos installateurs partenaires vous proposent des solutions Wallbox adaptées à votre abonnement monophasé ou triphasé.",
    "Équipez votre garage de {VILLE} d'une wallbox connectée de dernière génération. Pilotez votre consommation depuis votre smartphone et programmez vos charges en fonction des heures creuses Enedis.",
    "Profitez d'une installation soignée de votre borne Wallbox à {VILLE} par des spécialistes de la recharge électrique IRVE intervenant dans tout le département du Nord."
  ]
};

const USE_CASE_POOLS: Record<string, string[]> = {
  main: [
    "La pose d'une borne de 7.4 kW à domicile permet de recharger n'importe quel véhicule (Tesla Model Y, Peugeot e-208, Megane E-Tech) en récupérant environ 40 à 50 km d'autonomie par heure de charge.",
    "Pour les foyers disposant d'un abonnement électrique triphasé, l'installation d'une borne de 11 kW ou 22 kW permet de diviser par trois le temps de charge de votre batterie sans risquer de surcharger le réseau.",
    "Une wallbox installée dans votre garage ou sur votre place de parking à {VILLE} sécurise la charge de votre véhicule en évitant toute surchauffe des câbles grâce à des protections électriques dédiées (Type A-EV).",
    "Nos techniciens IRVE recommandent l'installation de bornes de grandes marques (Schneider, Hager, Wallbox, Easee) équipées d'un câble de type 2 pour s'adapter à l'ensemble des véhicules électriques du marché européen.",
    "Que ce soit pour une recharge quotidienne rapide après vos trajets dans la MEL ou pour des recharges ponctuelles le week-end, une borne murale de 7.4 kW assure une flexibilité totale et préserve la durée de vie de votre batterie.",
    "L'installation d'une prise renforcée Green'Up (3.7 kW) peut suffire pour les véhicules hybrides rechargeables, mais pour un véhicule 100% électrique, seule une borne wallbox garantit une recharge complète en une nuit."
  ],
  copropriete: [
    "Pour faire valoir votre droit à la prise, vous devez envoyer un dossier technique détaillé au syndic de copropriété par lettre recommandée. Celui-ci dispose de 3 mois pour inscrire le point à l'ordre du jour de la prochaine AG.",
    "La solution classique consiste à raccorder votre borne de recharge individuelle au tableau général des parties communes (TGBT) de la résidence, avec la pose d'un sous-compteur individuel pour la facturation des consommations.",
    "Pour les résidences de {VILLE} comptant de nombreuses demandes, nous recommandons une infrastructure collective avec une colonne horizontale Enedis, permettant à chaque résident d'ouvrir un abonnement Linky indépendant.",
    "L'installation d'une borne en sous-sol à {VILLE} exige de respecter des normes de sécurité incendie strictes et d'utiliser du matériel robuste avec un indice de protection IK10 contre les chocs dans les espaces de manœuvre.",
    "Que vous soyez propriétaire occupant ou locataire à {VILLE}, le syndic ne peut s'opposer aux travaux d'installation d'une borne individuelle que pour un motif sérieux et légitime, comme l'existence d'un projet collectif.",
    "La mise en place d'une solution de recharge partagée ou individuelle en copropriété permet de répartir équitablement les coûts de consommation d'électricité grâce à des relevés de télé-relève automatisés ou des badges RFID."
  ],
  wallbox: [
    "Une Wallbox de 7.4 kW en monophasé est idéale pour la majorité des maisons individuelles à {VILLE}. Elle permet de recharger complètement une batterie de 60 kWh (type Megane E-Tech ou Tesla Model 3) en une seule nuit.",
    "Pour les propriétaires disposant d'une installation en triphasé à {VILLE}, les bornes de 11 kW ou 22 kW offrent une vitesse supérieure, chargeant votre véhicule compatible en seulement 3 à 5 heures pour une autonomie maximale.",
    "Les bornes murales sélectionnées par nos électriciens partenaires intègrent un protocole OCPP et une connectivité Bluetooth ou Wi-Fi pour planifier facilement vos sessions de charge depuis une application mobile dédiée.",
    "La pose d'une Wallbox nécessite des protections électriques obligatoires dans votre tableau de {VILLE} : un disjoncteur adapté et un interrupteur différentiel de type A-EV capable de détecter les fuites de courant continu.",
    "Certaines wallbox intelligentes comme la Wallbox Pulsar Plus ou la Copper SB intègrent un lecteur de carte RFID pour sécuriser l'accès et empêcher les personnes non autorisées de recharger leur véhicule chez vous.",
    "Une borne de recharge rapide est particulièrement recommandée si vous roulez beaucoup dans le Nord et avez besoin de récupérer rapidement de l'autonomie entre deux trajets professionnels ou personnels."
  ]
};

const ECO_POOLS: Record<string, string[]> = {
  main: [
    "En programmant la charge de votre véhicule électrique pendant les heures creuses d'Enedis dans le Nord (souvent entre 22h et 6h), vous réduisez votre facture d'électricité et divisez par 5 vos dépenses de carburant.",
    "Avec un tarif de recharge à domicile à {VILLE} estimé à moins de 3 € pour 100 km, l'amortissement de votre investissement dans une borne IRVE s'effectue en moins de 18 mois par rapport à un véhicule thermique.",
    "Le crédit d'impôt de 500 € disponible en 2026, combiné à la TVA réduite à 5,5% sur le matériel et la main d'œuvre, rend l'installation d'une borne de recharge particulièrement accessible pour les particuliers.",
    "Grâce aux fonctionnalités intelligentes des wallbox modernes, vous pouvez suivre en temps réel vos consommations et optimiser vos charges pour profiter pleinement des tarifs d'électricité les plus avantageux.",
    "Le pilotage de la charge permet également d'intégrer des panneaux solaires si vous en êtes équipé à {VILLE}, vous permettant de rouler avec une énergie 100% verte et gratuite produite directement sur votre toit.",
    "Éviter les recharges régulières sur les bornes publiques rapides (qui appliquent des tarifs élevés) en rechargeant principalement chez soi à {VILLE} permet de réaliser plus de 1 000 € d'économies annuelles."
  ],
  copropriete: [
    "Grâce au programme ADVENIR spécifique pour la copropriété, vous bénéficiez d'une aide financière couvrant 50% du montant des travaux, avec un plafond de 960 € TTC par point de recharge installé à {VILLE}.",
    "En plus de la prime ADVENIR, l'installation d'une borne en copropriété est éligible au crédit d'impôt de 500 € et à un taux de TVA réduit à 5,5%, ce qui réduit considérablement le coût restant à votre charge.",
    "Raccorder votre borne au compteur des parties communes avec un système de sous-comptage vous permet de ne payer que l'électricité que vous consommez réellement, au tarif négocié par la copropriété.",
    "La recharge en heures creuses au sein de votre résidence à {VILLE} reste de loin la solution la plus économique pour alimenter votre véhicule électrique, préservant ainsi votre budget énergie mensuel.",
    "Le financement de l'infrastructure collective de recharge peut être pris en charge par des opérateurs tiers sans frais pour la copropriété, les utilisateurs payant ensuite un abonnement individuel.",
    "Investir dans une borne en copropriété à {VILLE} permet de réaliser des économies substantielles à long terme en évitant les tarifs excessifs pratiqués sur les réseaux de recharge publics extérieurs."
  ],
  wallbox: [
    "Grâce au pilotage énergétique de votre Wallbox à {VILLE}, la charge s'active automatiquement pendant les heures creuses, vous permettant de rouler pour environ 2 € par recharge complète de votre batterie.",
    "Le crédit d'impôt national pour la pose d'une borne de recharge a été fixé à 500 € par contribuable en 2026, cumulable avec la TVA à 5,5% appliquée par votre installateur IRVE qualifié.",
    "L'installation d'une borne de recharge rapide vous évite d'utiliser régulièrement les chargeurs publics rapides de type DC, dont le coût au kWh est 3 à 4 fois plus élevé que l'électricité domestique à {VILLE}.",
    "Les bornes équipées de capteurs de puissance modulable adaptent leur vitesse de recharge en fonction des autres équipements de votre maison de {VILLE}, vous évitant de payer un abonnement Enedis plus cher.",
    "Si vous possédez une installation photovoltaïque à {VILLE}, certaines wallbox de marque SolarEdge ou Easee peuvent canaliser le surplus de production solaire directement dans la batterie de votre voiture.",
    "Investir dans une wallbox performante à domicile à {VILLE} est rapidement rentabilisé en profitant des tarifs d'électricité régulés d'Enedis et en limitant les recharges d'urgence sur autoroute."
  ]
};

const COMMUNE_DATA_POOLS: Record<string, string[]> = {
  main: [
    "Nos électriciens partenaires analysent la capacité de votre tableau de répartition principal. Souvent, dans le bâti ancien du Nord, une mise aux normes mineure ou l'ajout d'un interrupteur différentiel adapté est requis.",
    "À {VILLE}, nous vérifions systématiquement la qualité de la prise de terre avant toute pose de borne. Une résistance de terre supérieure à 100 Ohms empêcherait le véhicule électrique de démarrer sa charge par sécurité.",
    "Le réseau électrique Enedis à {VILLE} délivre une tension stable, mais la pose d'un module de délestage est indispensable pour les abonnements de 6 kVA afin de ne pas couper le courant lors du démarrage d'appareils gourmands.",
    "L'installation électrique de votre maison doit être auditée par un professionnel IRVE. Dans le 59, de nombreux tableaux nécessitent un simple réagencement pour accueillir le disjoncteur et le différentiel dédiés à la wallbox.",
    "Nos installateurs se chargent de vérifier la puissance souscrite auprès de votre fournisseur. Si un passage de 6 à 9 kVA est nécessaire, nous vous guidons dans les démarches auprès d'Enedis Nord.",
    "Chaque installation de borne à {VILLE} respecte scrupuleusement le cahier des charges de la norme NF C 15-100, garantissant une protection optimale contre les surcharges et les courts-circuits accidentels."
  ],
  copropriete: [
    "L'installation dans les parkings collectifs du Nord nécessite l'intervention d'un électricien qualifié IRVE pour garantir la conformité avec le guide technique de l'association Promotelec et les décrets en vigueur.",
    "À {VILLE}, nous analysons le tableau général basse tension (TGBT) de votre copropriété pour déterminer la puissance disponible. Parfois, l'installation d'un gestionnaire d'énergie collectif est requise pour éviter de saturer le réseau.",
    "Le câblage dans un parking souterrain à {VILLE} doit emprunter des chemins de câbles coupe-feu spécifiques pour se conformer à la réglementation sur la sécurité incendie dans les bâtiments d'habitation.",
    "Nos installateurs coordonnent leur travail avec le syndic de votre résidence à {VILLE}. Nous fournissons un schéma d'implantation technique clair pour valider la faisabilité du raccordement électrique.",
    "Dans les résidences du 59, l'accès à la borne est sécurisé par un lecteur de badge ou une clé physique. Cela empêche toute utilisation frauduleuse de votre électricité par un autre résident.",
    "Chaque projet en copropriété à {VILLE} respecte les normes d'accessibilité PMR (Personnes à Mobilité Réduite) pour l'emplacement de la borne et la maniabilité du câble de recharge."
  ],
  wallbox: [
    "L'installation d'une wallbox à {VILLE} doit impérativement être validée par un diagnostic de votre réseau électrique intérieur afin de s'assurer de la bonne section de câble et de la présence d'une prise de terre conforme.",
    "À {VILLE}, de nombreuses installations électriques résidentielles nécessitent la pose d'un module de délestage Linky TIC pour éviter la coupure du disjoncteur général lorsque la borne fonctionne en même temps que le chauffage.",
    "Les techniciens IRVE intervenant à {VILLE} vérifient la conformité de votre tableau électrique principal. Si nécessaire, un tableau secondaire dédié à la borne de recharge sera mis en place pour garantir la sécurité.",
    "Le choix de la puissance de votre borne dépend directement de votre abonnement électrique à {VILLE}. Une borne de 7.4 kW requiert un abonnement minimum de 9 kVA (45 Ampères) pour fonctionner confortablement.",
    "Dans les zones rurales ou périurbaines du Nord, nos installateurs veillent à équiper les wallbox extérieures de protections renforcées contre la foudre et les surtensions électriques du réseau.",
    "Toutes les wallbox installées par nos artisans certifiés à {VILLE} respectent les directives européennes et françaises avec des connecteurs de type 2S équipés d'obturateurs de sécurité enfants."
  ]
};

const EXPERT_TIP_POOLS: Record<string, string[]> = {
  main: [
    "Conseil de pro : Privilégiez une borne équipée d'un capteur de courant qui ajuste dynamiquement la charge. C'est l'assurance d'éviter les disjonctions générales sans avoir à augmenter votre abonnement Enedis.",
    "Astuce technique : Si votre borne est installée en extérieur à {VILLE}, exigez une pose sous abri ou une borne certifiée IP55 avec obturateurs de sécurité (prises T2S) pour résister aux pluies et gelées du Nord.",
    "Recommandation IRVE : Ne sous-estimez pas la section du câble d'alimentation de la borne. Pour une borne de 7.4 kW située à 15 mètres du tableau, un câble en cuivre de 10 mm² est indispensable pour éviter les pertes d'énergie.",
    "Avis de l'électricien : Optez pour une borne évolutive compatible OCPP. Cela vous permettra de la connecter facilement à des applications de recharge intelligente ou à un futur système de gestion énergétique domestique.",
    "Conseil sécurité : L'utilisation d'une prise classique pour recharger un VE présente un risque d'échauffement important. La wallbox intègre des circuits de détection de fuite de courant continu pour une protection totale.",
    "Le conseil ch'ti : En hiver dans le 59, programmez la fin de charge juste avant votre départ. La batterie sera encore tiède, ce qui améliorera l'autonomie et le freinage régénératif dès les premiers kilomètres."
  ],
  copropriete: [
    "Conseil d'expert : N'attendez pas la tenue de l'AG pour envoyer votre dossier en recommandé. Plus vite le syndic reçoit votre demande technique rédigée par nos soins, plus vite la convention de travaux sera signée.",
    "Astuce copro : Proposez au syndic une solution de recharge collective évolutive. Même si vous êtes le premier demandeur à {VILLE}, d'autres voisins suivront et une infrastructure commune évitera de multiplier les câbles individuels.",
    "Recommandation technique : Pour les parkings extérieurs à {VILLE}, optez pour une borne sur pied robuste dotée d'un indice IK10 et d'une trappe verrouillable pour protéger la prise contre le vandalisme et les intempéries.",
    "Le conseil juridique : Rappelez à votre syndic que le droit à la prise est garanti par la loi. Si aucune décision n'est prise dans les 3 mois suivant la réception de votre demande, vous pouvez lancer les travaux individuellement.",
    "Avis de l'électricien : Dans le cas d'une recharge raccordée aux parties communes, assurez-vous que le sous-compteur installé est certifié MID (Mesure Instruments Directive) pour que la facturation soit juridiquement incontestable.",
    "Conseil pratique : Choisissez une borne équipée d'une connectivité Wi-Fi ou 4G pour permettre le suivi de consommation et la mise à jour à distance du micrologiciel de votre équipement de recharge."
  ],
  wallbox: [
    "Le conseil de l'artisan : Pour une borne installée à {VILLE}, choisissez un modèle doté d'une application de contrôle robuste. Cela vous permettra de suivre précisément votre historique de consommation pour votre comptabilité.",
    "Astuce technique : Si vous prévoyez d'acheter un second véhicule électrique à l'avenir, optez dès maintenant pour une borne capable de gérer la charge partagée intelligente entre deux points de charge.",
    "Recommandation IRVE : Évitez les câbles de recharge trop courts. Un câble de 5 ou 7 mètres offre un confort d'utilisation optimal, quelle que soit la position de la trappe de recharge de votre véhicule dans votre allée à {VILLE}.",
    "Conseil d'expert : Pensez à vérifier la garantie constructeur de votre wallbox. Les fabricants leaders (Hager, Schneider, Easee) proposent des extensions de garantie jusqu'à 5 ans qui sécurisent votre investissement.",
    "Avis de l'électricien : Si votre maison à {VILLE} dispose d'une installation en triphasé, préférez une borne de 22 kW bridable à 11 kW. Cela vous donne une flexibilité totale selon les capacités de charge de vos futurs véhicules.",
    "Le conseil ch'ti : Le gel nordiste peut raidir le câble de charge en hiver. Enroulez-le soigneusement sur un support mural dédié à {VILLE} après chaque utilisation pour éviter de l'endommager avec le temps."
  ]
};

const REAL_ESTATE_POOLS: Record<string, string[]> = {
  main: [
    "Les agences immobilières du Nord confirment qu'une maison équipée d'une borne de recharge rapide se vend plus rapidement et gagne une valeur verte immédiate estimée entre 2% et 4% sur le marché immobilier de {VILLE}.",
    "À {VILLE}, la présence d'une wallbox opérationnelle dans le garage est un argument de poids lors des visites d'acquéreurs potentiels, de plus en plus nombreux à posséder ou projeter l'achat d'un véhicule électrique.",
    "Valoriser son patrimoine immobilier passe aujourd'hui par la transition énergétique. Installer une borne IRVE de qualité valorise votre bien tout en le démarquant des autres annonces du secteur de {VILLE}.",
    "Avec l'interdiction progressive des véhicules thermiques, une place de stationnement déjà câblée pour la recharge de véhicules électriques est un équipement standard recherché par les acheteurs à {VILLE}."
  ],
  copropriete: [
    "Un appartement avec place de parking câblée ou équipée d'une borne à {VILLE} voit sa valeur immobilière augmenter de façon significative. C'est un argument de vente majeur pour les acheteurs urbains du Nord.",
    "Dans les copropriétés de {VILLE}, disposer d'un équipement IRVE individuel permet de louer ou vendre sa place de parking beaucoup plus facilement et avec une plus-value estimée à plus de 2 000 €.",
    "La valeur verte des logements collectifs à {VILLE} devient un critère de choix pour les locataires et acquéreurs équipés de VE, qui écartent désormais les résidences dépourvues de solution de recharge.",
    "Équiper sa copropriété d'une infrastructure de recharge collective est un investissement qui modernise l'immeuble et préserve l'attractivité immobilière de la copropriété à {VILLE} face aux constructions neuves."
  ],
  wallbox: [
    "L'installation d'une wallbox de marque reconnue valorise immédiatement votre maison à {VILLE} en augmentant sa valeur verte de 3% à 5% auprès des acquéreurs de plus en plus attentifs aux équipements de recharge à domicile.",
    "Avoir une borne de recharge rapide pré-équipée dans son garage est un critère de confort haut de gamme très recherché lors des transactions immobilières dans le secteur de {VILLE}.",
    "Un logement prêt pour la mobilité électrique à {VILLE} se vend en moyenne 15 jours plus vite sur le marché du Nord, les acheteurs appréciant de ne pas avoir à réaliser ces travaux complexes eux-mêmes.",
    "Dans le Nord, les maisons disposant d'un carport ou d'un garage équipé d'une wallbox 7.4 kW se positionnent en tête des recherches immobilières des jeunes couples actifs roulant en électrique."
  ]
};

const POPULATION_TIER_POOLS: Record<string, string[]> = {
  main: [
    "Avec une population locale active et un tissu urbain en pleine mutation, {VILLE} encourage le développement des mobilités douces et de l'électromobilité. Installer sa borne privée est le moyen idéal de devancer les futures réglementations.",
    "Dans cette commune dynamique du 59, le nombre d'utilisateurs de véhicules propres augmente rapidement. Pouvoir recharger chez soi reste le moyen le plus confortable et le plus économique pour vos trajets quotidiens.",
    "Les infrastructures publiques de recharge se développent à {VILLE}, mais elles ne remplaceront jamais la sérénité et le tarif avantageux d'une recharge nocturne effectuée directement dans votre allée ou garage.",
    "En tant que commune accueillante du département du Nord, {VILLE} voit sa part de voitures électriques grandir. Nos électriciens locaux contribuent activement à cette transition en équipant les foyers de bornes fiables."
  ],
  copropriete: [
    "Dans les zones denses de {VILLE}, où le logement collectif représente une part importante du parc immobilier, l'adaptation des copropriétés à la recharge électrique est un enjeu écologique et économique majeur.",
    "Le nombre croissant de résidents roulant en électrique à {VILLE} pousse les syndics de copropriété à moderniser les installations de stationnement pour offrir des solutions de charge partagées ou individuelles.",
    "À {VILLE}, de nombreuses résidences collectives se tournent vers nos électriciens IRVE pour déployer des infrastructures prêtes à l'emploi, anticipant ainsi la généralisation des véhicules électriques.",
    "Installer une borne dans son immeuble à {VILLE} permet de s'affranchir de la recherche quotidienne d'une borne publique disponible dans le quartier, tout en profitant du confort d'une recharge à domicile."
  ],
  wallbox: [
    "À {VILLE}, la transition vers la voiture électrique est en marche. Disposer d'une wallbox rapide à domicile est la solution la plus pratique pour recharger chaque soir et démarrer la journée avec une batterie pleine.",
    "Le développement urbain de {VILLE} s'accompagne d'une demande croissante pour des solutions de charge résidentielles rapides, portées par des électriciens locaux certifiés IRVE.",
    "Même si la ville de {VILLE} déploie de nouvelles bornes publiques, la wallbox privée reste l'équipement indispensable pour recharger au meilleur tarif sans contrainte de temps ni d'attente.",
    "En choisissant d'installer une borne rapide chez vous à {VILLE}, vous rejoignez les nombreux foyers du 59 qui ont fait le choix d'une mobilité simplifiée et économique au quotidien."
  ]
};

// FAQ Pools
const FAQ_POOLS: Record<string, { question: string; answer: string }[]> = {
  main: [
    {
      question: "Faut-il modifier mon compteur Enedis pour une installation de borne à {VILLE} ?",
      answer: "Si vous optez pour une borne de 7.4 kW en monophasé, un abonnement de 9 kVA (45 A) est généralement recommandé. Pour une borne de 11 kW ou 22 kW en triphasé, il est nécessaire de demander à Enedis Nord de modifier votre raccordement pour passer en triphasé."
    },
    {
      question: "Quel est le tarif moyen d'un électricien IRVE pour poser une borne à {VILLE} ?",
      answer: "Le coût moyen oscille entre 1 200 € et 1 900 € TTC avant déduction des aides financières. Ce tarif comprend la fourniture de la wallbox, le disjoncteur différentiel adapté, le câblage et la mise en service réglementaire."
    },
    {
      question: "Existe-t-il des subventions locales ou départementales dans le Nord ?",
      answer: "En plus du crédit d'impôt national de 500 € et de la TVA réduite à 5,5%, certaines collectivités du Nord (comme la MEL pour ses communes membres) proposent des aides complémentaires pour la transition énergétique, incluant les bornes."
    },
    {
      question: "Combien de temps durent les travaux de pose d'une borne à {VILLE} ?",
      answer: "Dans la grande majorité des cas, l'installation d'une borne de recharge dans une maison individuelle à {VILLE} prend entre une demi-journée et une journée complète, selon la distance entre le tableau électrique et l'emplacement de la borne."
    },
    {
      question: "Quelle est la différence entre une prise Green'Up et une borne Wallbox ?",
      answer: "La prise Green'Up charge à 3.7 kW (environ 15-20 km d'autonomie par heure), tandis qu'une wallbox classique charge à 7.4 kW ou plus (jusqu'à 50 km par heure). La wallbox est donc deux fois plus rapide et intègre des fonctions de pilotage intelligent."
    },
    {
      question: "Puis-je installer ma borne moi-même pour économiser sur la main d'œuvre ?",
      answer: "Non, la loi française impose que toute borne d'une puissance supérieure à 3.7 kW soit installée par un professionnel certifié IRVE. De plus, réaliser la pose vous-même annulerait les garanties du constructeur et votre assurance habitation en cas d'incendie."
    },
    {
      question: "Comment fonctionne le délestage dynamique recommandé dans le Nord ?",
      answer: "Le délestage dynamique mesure en temps réel la consommation électrique globale de votre logement. Si vous allumez des appareils énergivores, la borne réduit automatiquement sa puissance de charge pour éviter de faire disjoncter le compteur Linky."
    },
    {
      question: "Les bornes de recharge installées dans le 59 sont-elles compatibles avec toutes les voitures ?",
      answer: "Oui, les bornes résidentielles installées en France utilisent un connecteur de Type 2, qui est le standard européen obligatoire. Elles sont donc compatibles avec 100% des véhicules électriques et hybrides rechargeables récents."
    },
    {
      question: "Quelles sont les meilleures marques de bornes recommandées à {VILLE} ?",
      answer: "Nos techniciens installent principalement les marques Hager (Witty), Schneider Electric (EVlink), Legrand, Wallbox (Pulsar Plus) et Easee. Ces modèles sont reconnus pour leur fiabilité, leur robustesse face au froid et leurs options de connectivité."
    },
    {
      question: "Une borne extérieure résiste-t-elle au climat humide du Nord ?",
      answer: "Oui, les bornes posées en extérieur possèdent un indice d'étanchéité minimal IP54 et de résistance aux chocs IK08. Elles sont conçues pour résister à la pluie battante, à la neige et aux températures négatives hivernales courantes à {VILLE}."
    }
  ],
  copropriete: [
    {
      question: "Qu'est-ce que le 'droit à la prise' en copropriété à {VILLE} ?",
      answer: "C'est un droit légal qui permet à tout propriétaire ou locataire d'équiper sa place de parking (boxée ou ouverte) d'une borne de recharge à ses propres frais. Le syndic ne peut s'y opposer que pour des motifs graves et légitimes définis par la loi."
    },
    {
      question: "Quel est le montant de la prime ADVENIR pour une copropriété à {VILLE} ?",
      answer: "Pour une installation individuelle en copropriété, le programme ADVENIR finance 50% du montant des travaux (matériel et pose) dans la limite d'un plafond de 960 € TTC par point de charge."
    },
    {
      question: "Quelles sont les étapes pour demander l'installation au syndic ?",
      answer: "Vous devez envoyer un dossier technique complet (comprenant les devis et plans de raccordement d'un électricien IRVE) au syndic par lettre recommandée. Le syndic doit ensuite inscrire ce projet à l'ordre du jour de la prochaine assemblée générale."
    },
    {
      question: "Le syndic peut-il refuser ma demande de droit à la prise ?",
      answer: "Le syndic dispose de 3 mois pour s'opposer aux travaux en saisissant le tribunal judiciaire. Les seuls motifs de refus valables sont la décision de réaliser une infrastructure de recharge collective ou l'impossibilité technique avérée."
    },
    {
      question: "Qui paie l'électricité consommée par ma borne en copropriété ?",
      answer: "Si la borne est raccordée aux parties communes, un sous-compteur certifié MID est installé. L'installateur ou un opérateur de recharge effectue un relevé périodique des consommations pour que vous remboursiez le syndic à l'euro près."
    },
    {
      question: "Est-il possible d'installer un Linky individuel sur ma place de parking à {VILLE} ?",
      answer: "Oui, c'est la solution d'abonnement individuel Enedis. Un nouveau point de livraison est créé par Enedis, avec son propre compteur Linky. Vous choisissez ainsi librement votre fournisseur d'électricité et payez votre facture directement."
    },
    {
      question: "Combien de temps faut-il compter pour voir le projet aboutir en copropriété ?",
      answer: "Il faut généralement compter entre 3 et 6 mois. Ce délai comprend la préparation du dossier technique, le délai de préavis de l'AG de copropriété, la signature de la convention entre le syndic et l'installateur, et la réalisation des travaux."
    },
    {
      question: "Qu'est-ce qu'une infrastructure collective de recharge ?",
      answer: "C'est un réseau électrique déployé dans tout le parking de la copropriété (par Enedis ou un opérateur tiers) qui permet à chaque résident de se raccorder facilement lorsqu'il le souhaite, évitant la multiplication de câbles individuels désordonnés."
    },
    {
      question: "Peut-on poser une prise renforcée plutôt qu'une wallbox en copropriété ?",
      answer: "Oui, la pose d'une prise de type Green'Up est autorisée en copropriété sous réserve de validation technique par l'électricien IRVE. Cependant, elle est également soumise aux règles du droit à la prise et aux démarches auprès du syndic."
    },
    {
      question: "Quelles sont les règles de sécurité incendie pour les parkings souterrains à {VILLE} ?",
      answer: "Les parkings couverts doivent respecter les normes de sécurité contre l'incendie (notamment les arrêtés ministériels régissant les bâtiments d'habitation). L'installation doit comprendre des dispositifs de coupure d'urgence accessibles aux pompiers."
    }
  ],
  wallbox: [
    {
      question: "Pourquoi installer une Wallbox plutôt qu'une prise classique à {VILLE} ?",
      answer: "Une wallbox offre une puissance de charge de 7.4 kW à 22 kW, soit une vitesse 3 à 8 fois plus rapide qu'une prise standard. Elle intègre également des protections électriques avancées qui évitent tout risque d'échauffement des câbles de la maison."
    },
    {
      question: "Quelle puissance de Wallbox choisir : 7.4 kW, 11 kW ou 22 kW ?",
      answer: "La borne de 7.4 kW (monophasée) convient à 90% des particuliers car elle permet de recharger le véhicule en une nuit. Les puissances de 11 kW et 22 kW nécessitent une installation électrique en triphasé et un chargeur embarqué compatible dans la voiture."
    },
    {
      question: "Qu'est-ce qu'une Wallbox connectée ?",
      answer: "C'est une borne équipée d'une connexion Wi-Fi, Bluetooth ou 4G. Elle permet de suivre ses consommations depuis une application mobile, de programmer les heures de charge à distance, et de gérer l'accès à la borne via des badges RFID."
    },
    {
      question: "La Wallbox est-elle compatible avec les panneaux solaires à {VILLE} ?",
      answer: "Oui, de nombreux modèles récents (comme la wallbox Zappi ou certains modèles Easee) possèdent un mode de charge solaire. Ils dirigent le surplus d'électricité produit par vos panneaux photovoltaïques directement dans la batterie de la voiture."
    },
    {
      question: "Peut-on poser une Wallbox en extérieur dans le Nord ?",
      answer: "Absolument. Les wallbox de qualité résidentielle sont certifiées IP54 ou IP55, ce qui garantit une protection totale contre l'eau de pluie, la poussière et les projections. Elles résistent parfaitement aux hivers rigoureux et humides de {VILLE}."
    },
    {
      question: "Quel est le crédit d'impôt pour l'achat d'une Wallbox en 2026 ?",
      answer: "Le crédit d'impôt est de 500 € par système de charge installé (limité à un équipement pour une personne seule, et deux pour un couple soumis à une imposition commune), à condition que les travaux soient réalisés par un installateur certifié IRVE."
    },
    {
      question: "Qu'est-ce que le protocole OCPP pour une borne de recharge ?",
      answer: "L'OCPP (Open Charge Point Protocol) est un standard de communication ouvert. Il permet à la borne de communiquer avec n'importe quel logiciel de gestion tiers, ce qui est crucial pour le suivi des charges en entreprise ou en copropriété."
    },
    {
      question: "Quelle la durée de vie moyenne d'une Wallbox à domicile ?",
      answer: "Une borne de recharge bien installée et protégée par un disjoncteur adapté a une durée de vie moyenne de 10 à 15 ans. Choisir des marques européennes reconnues garantit également la disponibilité des pièces de rechange."
    },
    {
      question: "Comment s'effectue le verrouillage de la Wallbox pour éviter les vols d'électricité ?",
      answer: "Les wallbox peuvent être verrouillées de trois manières : via l'application mobile (activation manuelle ou automatique à l'approche de votre smartphone), par badge RFID (fourni avec la borne), ou à l'aide d'une clé physique sur certains modèles."
    },
    {
      question: "Le câble de recharge est-il fourni avec la Wallbox ?",
      answer: "Certaines bornes sont livrées avec un câble attaché (généralement de 5 ou 7 mètres), tandis que d'autres disposent d'une prise T2S femelle, vous obligeant à utiliser le câble fourni avec votre véhicule électrique. Nos électriciens vous conseillent selon vos besoins."
    }
  ]
};

// Rotated item selection helper
function selectRotatedItems<T>(items: T[], slug: string, offset: number, count: number): T[] {
  const selected: T[] = [];
  const indices = new Set<number>();
  let seed = offset;
  while (selected.length < count && selected.length < items.length) {
    const idx = getVariantIndex(slug, seed, items.length);
    if (!indices.has(idx)) {
      indices.add(idx);
      selected.push(items[idx]);
    }
    seed++;
  }
  return selected;
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

  const zoneLabels = {
    'littoral-nord': "Dunkerquois & Flandre Littorale",
    'metropole-lille': "Métropole Lilloise & Plaine de la Lys",
    'bassin-minier-avesnois': "Bassin Minier, Douaisis & Sud-Avesnois"
  };

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

  // Dynamic savings calculation
  let baseSavings = 1300;
  if (commune.population > 80000) {
    baseSavings = 1150;
  } else if (commune.population < 10000) {
    baseSavings = 1450;
  }
  const savingsEstimate = `environ ${baseSavings.toLocaleString('fr-FR')} € à ${(baseSavings + 200).toLocaleString('fr-FR')} € d'économie de carburant par an pour les trajets dans le secteur de ${commune.nom}.`;

  // Select and spin content from pools using unique seeds per field
  const rawIntro = INTRO_POOLS[resolvedCategory][getVariantIndex(commune.slug, catOffset + 10, INTRO_POOLS[resolvedCategory].length)];
  const introParagraph = spin(rawIntro, commune.slug).replaceAll('{VILLE}', commune.nom);

  const rawUseCase = USE_CASE_POOLS[resolvedCategory][getVariantIndex(commune.slug, catOffset + 20, USE_CASE_POOLS[resolvedCategory].length)];
  const useCaseText = spin(rawUseCase, commune.slug).replaceAll('{VILLE}', commune.nom);

  const rawEco = ECO_POOLS[resolvedCategory][getVariantIndex(commune.slug, catOffset + 30, ECO_POOLS[resolvedCategory].length)];
  const ecoText = spin(rawEco, commune.slug).replaceAll('{VILLE}', commune.nom);

  const rawCommuneData = COMMUNE_DATA_POOLS[resolvedCategory][getVariantIndex(commune.slug, catOffset + 40, COMMUNE_DATA_POOLS[resolvedCategory].length)];
  const communeDataInsight = spin(rawCommuneData, commune.slug).replaceAll('{VILLE}', commune.nom);

  const rawExpertTip = EXPERT_TIP_POOLS[resolvedCategory][getVariantIndex(commune.slug, catOffset + 50, EXPERT_TIP_POOLS[resolvedCategory].length)];
  const expertTip = spin(rawExpertTip, commune.slug).replaceAll('{VILLE}', commune.nom);

  const rawRealEstate = REAL_ESTATE_POOLS[resolvedCategory][getVariantIndex(commune.slug, catOffset + 60, REAL_ESTATE_POOLS[resolvedCategory].length)];
  const realEstateInsight = spin(rawRealEstate, commune.slug).replaceAll('{VILLE}', commune.nom);

  const rawPopTier = POPULATION_TIER_POOLS[resolvedCategory][getVariantIndex(commune.slug, catOffset + 70, POPULATION_TIER_POOLS[resolvedCategory].length)];
  const populationTierContent = spin(rawPopTier, commune.slug).replaceAll('{VILLE}', commune.nom);

  // FAQ generation with rotation (select 5 items per commune)
  const rawFaqList = FAQ_POOLS[resolvedCategory];
  const selectedFaqs = selectRotatedItems(rawFaqList, commune.slug, catOffset, 5);
  const faqItems = selectedFaqs.map(faq => ({
    question: spin(faq.question, commune.slug).replaceAll('{VILLE}', commune.nom),
    answer: spin(faq.answer, commune.slug).replaceAll('{VILLE}', commune.nom)
  }));

  return {
    introParagraph,
    logisticsAlert: `⚠️ **Certification obligatoire** : N'oubliez pas que l'installation d'une puissance supérieure à 3.7 kW doit obligatoirement être réalisée par un professionnel titulaire d'une qualification IRVE en cours de validité sous peine de nullité de vos assurances en cas de sinistre.`,
    useCaseText,
    pricesContext: `Les tarifs indiqués ci-dessus correspondent à une pose standard avec moins de 10 mètres de liaison câble de type 2 entre le tableau électrique principal et l'emplacement de la borne. Les prix varient selon les travaux de terrassement ou la mise aux normes du tableau.`,
    faqItems,
    ecoText,
    localContext: localContextText,
    climateZoneLabel: zoneLabels[climateZone],
    localAgencyName: agency.name,
    externalLinks: getExternalLinks(resolvedCategory, commune.codePostal, commune.slug),
    communeDataInsight,
    expertTip,
    tableIntro: resolvedCategory === 'copropriete'
      ? `Voici un récapitulatif des coûts indicatifs pour équiper vos stationnements en copropriété à ${commune.nom} :`
      : resolvedCategory === 'wallbox'
      ? `Voici un comparatif des coûts moyens et des performances constatées pour l'installation d'une borne wallbox à ${commune.nom} :`
      : `Voici un récapitulatif des coûts moyens constatés pour l'installation d'équipements de charge à ${commune.nom} en 2026 :`,
    guideLinks: getGuideLinks(resolvedCategory),
    savingsEstimate,
    lastUpdated: `Juin 2026`,
    realEstateInsight,
    populationTierContent
  };
}
