EXPENSE_RULES = [
    ("Goodwill", [
        "goodwill", "lc chairman", "lc1", "lc 1", "chairman",
        "appreciation", "thank you payment",
    ]),
    ("Land Preparation", [
        "digging holes", "digging hole", "tractor", "trees cutting",
        "tree cutting", "land opening", "land clearing", "ploughing",
        "plowing", "harrowing", "stumping", "bush clearing",
    ]),
    ("Tools", [
        "hoe", "panga", "machete", "slasher", "secateur", "secateurs",
        "honing", "wheelbarrow", "rake", "spade", "shovel", "axe",
        "pickaxe", "file ", "sharpening",
    ]),
    ("Seedlings", [
        "sucker", "suckers", "banana plant", "banana plants",
        "coffee plant", "coffee plants", "seedling", "seedlings",
        "saplings", "sapling",
    ]),
    ("PPE/Equipment", [
        "gumboot", "gumboots", "boots", "overall", "overalls",
        "gloves", "helmet", "mask", "goggles", "raincoat",
        "ppe", "uniform",
    ]),
    ("Meals", [
        "meal", "meals", "lunch", "breakfast", "dinner",
        "food", "tea ", "snacks", "snack", "drinks", "water",
        "soda", "posho", "matooke", "rice", "beans",
    ]),
    ("Labor", [
        "labour", "labor", "workers", "worker", "casual",
        "wages", "wage", "porter", "porters", "weeding",
        "pruning", "harvesting", "planting team", "digger",
        "diggers", "manual work",
    ]),
    ("Supplies", [
        "fertilizer", "fertiliser", "manure", "compost",
        "pesticide", "herbicide", "insecticide", "fungicide",
        "spray", "chemical", "chemicals", "lime", "urea",
        "rope", "twine", "polythene", "stakes", "stake",
    ]),
    ("Community/Admin", [
        "community", "meeting", "admin", "office",
        "registration", "permit", "license", "stationery",
        "printing", "photocopy", "airtime", "data bundle",
        "phone", "subscription",
    ]),
    ("Transport", [
        "transport", "boda", "taxi", "fare", "fuel",
        "petrol", "diesel", "motorcycle", "vehicle hire",
        "lorry", "truck hire", "delivery",
    ]),
]

INCOME_RULES = [
    ("Tree Sales", [
        "tree sale", "trees sale", "tree sales", "trees sales",
        "log", "logs", "eucalyptus", "pine sale", "tree harvest",
    ]),
    ("Timber", [
        "timber", "lumber", "planks", "plank", "sawmill",
    ]),
    ("Coffee Sales", [
        "coffee sale", "coffee sales", "kiboko", "coffee beans",
        "parchment", "cherries", "robusta", "arabica",
    ]),
    ("Seedling Sales", [
        "seedling sale", "seedling sales", "sucker sale",
        "sapling sale", "plant sale",
    ]),
    ("Rental", [
        "rent", "rental", "lease", "land rent", "tenant",
    ]),
    ("Grant / Support", [
        "grant", "support", "donation", "donor", "ngo",
        "subsidy", "funding", "sponsor",
    ]),
]


def classify_expense(text: str) -> str:
    if not text:
        return "Other"
    t = text.lower()
    for category, keywords in EXPENSE_RULES:
        for kw in keywords:
            if kw in t:
                return category
    return "Other"


def classify_income(text: str) -> str:
    if not text:
        return "Other"
    t = text.lower()
    for source, keywords in INCOME_RULES:
        for kw in keywords:
            if kw in t:
                return source
    return "Other"
