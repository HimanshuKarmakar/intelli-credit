# ============================================
# INTELLI-CREDIT — Demo Data Models
# 5 Indian Corporate Cases (ported from JS)
# ============================================

DEMO_COMPANIES = [
    {
        "id": "bharat-steel",
        "name": "Bharat Steel Industries Pvt Ltd",
        "cin": "U27100MH2012PTC234567",
        "gstin": "27AABCB1234A1Z5",
        "sector": "Manufacturing - Steel",
        "promoters": ["Rajesh Kumar Agarwal", "Suresh Kumar Agarwal"],
        "incorporationDate": "2012-03-15",
        "riskLevel": "medium",
        "decision": "Approve",
        "requestedAmount": 250000000,
        "recommendedLimit": 180000000,
        "score": 62,
        "lastUpdated": "2026-02-25T10:30:00Z",
        "financials": {
            "years": ["FY22", "FY23", "FY24", "FY25", "FY26"],
            "revenue": [18500, 21200, 24800, 22100, 26500],
            "ebitda": [2405, 2968, 3720, 2873, 3710],
            "pat": [1110, 1484, 2108, 1326, 1987],
            "netWorth": [8200, 9684, 11792, 13118, 15105],
            "totalDebt": [12400, 14200, 13800, 15200, 14600],
            "currentAssets": [6800, 7200, 8100, 7500, 8900],
            "currentLiabilities": [4200, 4800, 5100, 5300, 5600],
            "totalAssets": [24600, 28400, 30200, 33100, 35200],
            "inventory": [3200, 3800, 4100, 3900, 4300],
            "receivables": [2800, 2600, 3100, 2900, 3400],
            "cashFlow": [1800, 2100, 2500, 1600, 2800],
            "capex": [800, 1200, 1500, 2200, 1800]
        },
        "ratios": {
            "currentRatio": [1.62, 1.50, 1.59, 1.42, 1.59],
            "debtEquity": [1.51, 1.47, 1.17, 1.16, 0.97],
            "dscr": [1.35, 1.42, 1.58, 1.22, 1.55],
            "interestCoverage": [2.1, 2.4, 2.9, 2.0, 2.7],
            "roe": [13.5, 15.3, 17.9, 10.1, 13.2],
            "debtorDays": [55, 45, 46, 48, 47],
            "inventoryDays": [63, 65, 60, 64, 59]
        },
        "gstData": {
            "gstr3b": [1850, 1920, 2100, 2250, 1980, 2150, 2320, 2180, 2050, 2280, 2400, 2350],
            "gstr2a": [1780, 1880, 2050, 2180, 1920, 2080, 2250, 2100, 1980, 2200, 2320, 2280],
            "bankInflows": [2050, 2120, 2300, 2480, 2180, 2350, 2520, 2380, 2250, 2480, 2600, 2550],
            "months": ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"],
            "mismatchFlags": [
                {"month": "Jul", "type": "timing_mismatch", "severity": "low", "detail": "₹70L timing difference between GSTR-3B and bank inflows"},
                {"month": "Oct", "type": "minor_variance", "severity": "low", "detail": "₹70L ITC mismatch between 2A and 3B"}
            ]
        },
        "litigation": [
            {"court": "NCLT Mumbai", "type": "Recovery Suit", "amount": 4500000, "status": "Pending", "date": "2024-08-15", "risk": "medium", "url": "https://ecourts.gov.in/case/NCL-MUM-2024-8892"},
            {"court": "High Court Bombay", "type": "Environmental Compliance", "amount": 0, "status": "Disposed", "date": "2023-02-10", "risk": "low", "url": "https://ecourts.gov.in/case/HC-BOM-2023-1234"}
        ],
        "research": [
            {"source": "Economic Times", "title": "Steel sector outlook positive for FY27 - Demand up 8%", "date": "2026-01-15", "riskType": "positive", "impact": 5, "url": "https://economictimes.com/industry/steel/outlook-positive"},
            {"source": "MCA Portal", "title": "Annual filing compliant - No defaults", "date": "2025-07-20", "riskType": "positive", "impact": 0, "url": "https://mca.gov.in/filing/bharat-steel"},
            {"source": "RBI Circular", "title": "RBI maintains repo rate - Manufacturing sector lending stable", "date": "2026-02-01", "riskType": "neutral", "impact": 0, "url": "https://rbi.org.in/circular/2026-02-rates"}
        ],
        "collateral": {"type": "Industrial Land + Plant & Machinery", "value": 280000000, "coverage": 1.56},
        "creditRating": "BBB+",
        "ratingAgency": "CRISIL",
        "sanctions": ["Minimum DSCR of 1.25x", "Debt-Equity ratio not to exceed 2:1", "Quarterly stock audit"],
        "qualitativeNotes": ""
    },
    {
        "id": "greenleaf-agro",
        "name": "GreenLeaf Agro Pvt Ltd",
        "cin": "U01100KA2015PTC289012",
        "gstin": "29AADCG5678B1Z3",
        "sector": "Agriculture - Organic Food Processing",
        "promoters": ["Anitha Sharma", "Vikram Sharma"],
        "incorporationDate": "2015-06-22",
        "riskLevel": "low",
        "decision": "Approve",
        "requestedAmount": 80000000,
        "recommendedLimit": 75000000,
        "score": 78,
        "lastUpdated": "2026-02-24T14:00:00Z",
        "financials": {
            "years": ["FY22", "FY23", "FY24", "FY25", "FY26"],
            "revenue": [6200, 8400, 11200, 14800, 18500],
            "ebitda": [930, 1344, 1904, 2516, 3145],
            "pat": [465, 756, 1120, 1554, 2035],
            "netWorth": [3200, 3956, 5076, 6630, 8665],
            "totalDebt": [2800, 3200, 4100, 4800, 5200],
            "currentAssets": [2100, 2800, 3600, 4500, 5800],
            "currentLiabilities": [1200, 1500, 1900, 2200, 2600],
            "totalAssets": [7200, 9200, 11800, 14200, 17100],
            "inventory": [800, 1100, 1400, 1800, 2200],
            "receivables": [900, 1200, 1500, 1900, 2400],
            "cashFlow": [600, 900, 1300, 1800, 2400],
            "capex": [400, 600, 800, 1200, 1500]
        },
        "ratios": {
            "currentRatio": [1.75, 1.87, 1.89, 2.05, 2.23],
            "debtEquity": [0.88, 0.81, 0.81, 0.72, 0.60],
            "dscr": [1.65, 1.78, 1.92, 2.10, 2.35],
            "interestCoverage": [3.2, 3.8, 4.2, 4.8, 5.5],
            "roe": [14.5, 19.1, 22.1, 23.4, 23.5],
            "debtorDays": [53, 52, 49, 47, 47],
            "inventoryDays": [47, 48, 46, 44, 43]
        },
        "gstData": {
            "gstr3b": [1540, 1580, 1620, 1680, 1720, 1750, 1800, 1820, 1850, 1900, 1940, 1980],
            "gstr2a": [1520, 1560, 1600, 1660, 1700, 1730, 1780, 1800, 1830, 1880, 1920, 1960],
            "bankInflows": [1650, 1700, 1740, 1800, 1840, 1880, 1930, 1950, 1990, 2040, 2080, 2120],
            "months": ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"],
            "mismatchFlags": []
        },
        "litigation": [],
        "research": [
            {"source": "Business Standard", "title": "Organic food market growing at 25% CAGR in India", "date": "2026-01-20", "riskType": "positive", "impact": 8, "url": "https://business-standard.com/organic-growth"},
            {"source": "FSSAI", "title": "Company holds valid organic certification", "date": "2025-12-01", "riskType": "positive", "impact": 3, "url": "https://fssai.gov.in/cert/greenleaf"},
            {"source": "Inc42", "title": "GreenLeaf secures distribution tie-up with BigBasket", "date": "2025-11-15", "riskType": "positive", "impact": 5, "url": "https://inc42.com/greenleaf-bigbasket"}
        ],
        "collateral": {"type": "Agricultural Land + Processing Plant", "value": 120000000, "coverage": 1.60},
        "creditRating": "A-",
        "ratingAgency": "ICRA",
        "sanctions": ["DSCR above 1.5x", "Quarterly financials submission"],
        "qualitativeNotes": ""
    },
    {
        "id": "pinnacle-infra",
        "name": "Pinnacle Infrastructure Ltd",
        "cin": "U45200DL2008PLC178901",
        "gstin": "07AABCP9012C1Z1",
        "sector": "Infrastructure - Construction",
        "promoters": ["Deepak Malhotra", "Priya Malhotra"],
        "incorporationDate": "2008-11-03",
        "riskLevel": "high",
        "decision": "Reject",
        "requestedAmount": 500000000,
        "recommendedLimit": 0,
        "score": 32,
        "lastUpdated": "2026-02-26T09:15:00Z",
        "financials": {
            "years": ["FY22", "FY23", "FY24", "FY25", "FY26"],
            "revenue": [32000, 28500, 24200, 19800, 16500],
            "ebitda": [4160, 2850, 1694, 594, -825],
            "pat": [1600, 570, -484, -1782, -2805],
            "netWorth": [18500, 19070, 18586, 16804, 13999],
            "totalDebt": [28000, 31200, 34500, 38200, 42000],
            "currentAssets": [12000, 10500, 9200, 7800, 6200],
            "currentLiabilities": [14000, 15500, 17200, 19800, 22000],
            "totalAssets": [52000, 54800, 55600, 58200, 58400],
            "inventory": [4500, 4200, 3800, 3200, 2800],
            "receivables": [6200, 5500, 4800, 4100, 3000],
            "cashFlow": [2800, 1200, -200, -1500, -2800],
            "capex": [3200, 2000, 800, 200, 100]
        },
        "ratios": {
            "currentRatio": [0.86, 0.68, 0.53, 0.39, 0.28],
            "debtEquity": [1.51, 1.64, 1.86, 2.27, 3.00],
            "dscr": [1.12, 0.85, 0.62, 0.35, 0.12],
            "interestCoverage": [1.4, 0.9, 0.5, 0.2, -0.2],
            "roe": [8.6, 3.0, -2.6, -10.6, -20.0],
            "debtorDays": [71, 70, 72, 76, 66],
            "inventoryDays": [51, 54, 57, 59, 62]
        },
        "gstData": {
            "gstr3b": [1650, 1580, 1520, 1480, 1420, 1380, 1350, 1300, 1250, 1200, 1150, 1100],
            "gstr2a": [1300, 1250, 1200, 1180, 1120, 1080, 1050, 1020, 980, 950, 900, 870],
            "bankInflows": [1200, 1150, 1100, 1050, 1000, 980, 950, 920, 880, 850, 820, 780],
            "months": ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"],
            "mismatchFlags": [
                {"month": "Apr", "type": "revenue_inflation", "severity": "high", "detail": "₹350L GSTR-3B exceeds 2A by 27% — possible revenue inflation"},
                {"month": "Jun", "type": "circular_trading", "severity": "critical", "detail": "Bank inflows ₹420L below GST turnover — circular trading suspected"},
                {"month": "Sep", "type": "round_tripping", "severity": "high", "detail": "Related party transactions detected — round-tripping pattern"},
                {"month": "Dec", "type": "duplicate_gstin", "severity": "medium", "detail": "Duplicate GSTIN exposure found with sister concern"}
            ]
        },
        "litigation": [
            {"court": "NCLT Delhi", "type": "Insolvency Proceedings", "amount": 120000000, "status": "Admitted", "date": "2025-09-20", "risk": "critical", "url": "https://ecourts.gov.in/case/NCL-DEL-2025-5567"},
            {"court": "High Court Delhi", "type": "Contract Dispute", "amount": 35000000, "status": "Pending", "date": "2025-03-12", "risk": "high", "url": "https://ecourts.gov.in/case/HC-DEL-2025-2890"},
            {"court": "Labour Court", "type": "Worker Compensation", "amount": 8000000, "status": "Pending", "date": "2024-11-05", "risk": "medium", "url": "https://ecourts.gov.in/case/LC-DEL-2024-1122"},
            {"court": "NCLAT", "type": "Appeal against Insolvency", "amount": 120000000, "status": "Listed", "date": "2026-01-28", "risk": "critical", "url": "https://ecourts.gov.in/case/NCLAT-2026-0234"}
        ],
        "research": [
            {"source": "Moneycontrol", "title": "Pinnacle Infra faces NCLT insolvency proceedings", "date": "2025-10-01", "riskType": "negative", "impact": -25, "url": "https://moneycontrol.com/pinnacle-nclt"},
            {"source": "Economic Times", "title": "Infrastructure sector NPA risk rising — RBI flags concerns", "date": "2026-01-10", "riskType": "negative", "impact": -10, "url": "https://economictimes.com/infra-npa-risk"},
            {"source": "MCA Portal", "title": "Delayed annual filing — 2 years pending", "date": "2025-06-30", "riskType": "negative", "impact": -8, "url": "https://mca.gov.in/filing/pinnacle-infra"},
            {"source": "LiveLaw", "title": "Promoter Deepak Malhotra named in financial fraud investigation", "date": "2025-12-15", "riskType": "negative", "impact": -20, "url": "https://livelaw.in/malhotra-fraud-investigation"}
        ],
        "collateral": {"type": "Under-construction projects (disputed)", "value": 150000000, "coverage": 0.36},
        "creditRating": "D",
        "ratingAgency": "CRISIL",
        "sanctions": ["Account classified as SMA-2", "No fresh disbursement"],
        "qualitativeNotes": ""
    },
    {
        "id": "techvista",
        "name": "TechVista Solutions Pvt Ltd",
        "cin": "U72200KA2017PTC312345",
        "gstin": "29AADCT3456D1Z8",
        "sector": "IT Services - Enterprise Software",
        "promoters": ["Arjun Nair", "Meera Krishnan"],
        "incorporationDate": "2017-01-10",
        "riskLevel": "low",
        "decision": "Approve",
        "requestedAmount": 150000000,
        "recommendedLimit": 140000000,
        "score": 81,
        "lastUpdated": "2026-02-23T16:45:00Z",
        "financials": {
            "years": ["FY22", "FY23", "FY24", "FY25", "FY26"],
            "revenue": [4800, 7200, 10800, 15200, 21000],
            "ebitda": [1200, 1944, 3024, 4408, 6300],
            "pat": [720, 1224, 2052, 3040, 4410],
            "netWorth": [2800, 4024, 6076, 9116, 13526],
            "totalDebt": [1200, 1600, 2000, 2400, 2800],
            "currentAssets": [2400, 3600, 5200, 7400, 10200],
            "currentLiabilities": [800, 1200, 1800, 2400, 3200],
            "totalAssets": [5200, 7600, 11200, 15800, 22000],
            "inventory": [0, 0, 0, 0, 0],
            "receivables": [1600, 2400, 3400, 4800, 6600],
            "cashFlow": [800, 1400, 2200, 3200, 4800],
            "capex": [200, 300, 400, 600, 800]
        },
        "ratios": {
            "currentRatio": [3.00, 3.00, 2.89, 3.08, 3.19],
            "debtEquity": [0.43, 0.40, 0.33, 0.26, 0.21],
            "dscr": [3.20, 3.50, 3.80, 4.20, 4.60],
            "interestCoverage": [8.0, 9.2, 10.5, 12.0, 14.0],
            "roe": [25.7, 30.4, 33.8, 33.3, 32.6],
            "debtorDays": [122, 122, 115, 115, 115],
            "inventoryDays": [0, 0, 0, 0, 0]
        },
        "gstData": {
            "gstr3b": [1750, 1780, 1820, 1860, 1900, 1940, 1980, 2020, 2060, 2100, 2140, 2180],
            "gstr2a": [1740, 1770, 1810, 1850, 1890, 1930, 1970, 2010, 2050, 2090, 2130, 2170],
            "bankInflows": [1900, 1930, 1970, 2010, 2050, 2090, 2130, 2170, 2220, 2260, 2300, 2340],
            "months": ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"],
            "mismatchFlags": []
        },
        "litigation": [],
        "research": [
            {"source": "YourStory", "title": "TechVista bags ₹45Cr deal with top PSU bank", "date": "2025-12-20", "riskType": "positive", "impact": 10, "url": "https://yourstory.com/techvista-psu-deal"},
            {"source": "NASSCOM", "title": "Indian IT services sector to grow 12% in FY27", "date": "2026-02-05", "riskType": "positive", "impact": 5, "url": "https://nasscom.in/report/fy27-outlook"},
            {"source": "MCA Portal", "title": "All filings up to date - Clean record", "date": "2025-09-15", "riskType": "positive", "impact": 2, "url": "https://mca.gov.in/filing/techvista"}
        ],
        "collateral": {"type": "Commercial Office Space + FD Lien", "value": 200000000, "coverage": 1.43},
        "creditRating": "A",
        "ratingAgency": "ICRA",
        "sanctions": ["Revenue growth > 15% YoY", "Key manpower retention above 85%"],
        "qualitativeNotes": ""
    },
    {
        "id": "mahalakshmi-textiles",
        "name": "Mahalakshmi Textiles Pvt Ltd",
        "cin": "U17100TN2005PTC045678",
        "gstin": "33AABCM7890E1Z2",
        "sector": "Textiles - Fabric Manufacturing",
        "promoters": ["Subramaniam Iyer"],
        "incorporationDate": "2005-08-18",
        "riskLevel": "critical",
        "decision": "Reject",
        "requestedAmount": 120000000,
        "recommendedLimit": 0,
        "score": 18,
        "lastUpdated": "2026-02-26T11:00:00Z",
        "financials": {
            "years": ["FY22", "FY23", "FY24", "FY25", "FY26"],
            "revenue": [9800, 8200, 6100, 4200, 2800],
            "ebitda": [980, 410, -305, -840, -1120],
            "pat": [294, -246, -915, -1680, -2240],
            "netWorth": [5200, 4954, 4039, 2359, 119],
            "totalDebt": [8500, 9200, 10800, 12500, 14000],
            "currentAssets": [3200, 2800, 2200, 1600, 1000],
            "currentLiabilities": [5800, 6500, 7400, 8800, 10200],
            "totalAssets": [16200, 15800, 15200, 14800, 14200],
            "inventory": [1800, 1600, 1400, 1100, 800],
            "receivables": [1100, 900, 600, 350, 150],
            "cashFlow": [500, -200, -800, -1500, -2000],
            "capex": [200, 100, 50, 0, 0]
        },
        "ratios": {
            "currentRatio": [0.55, 0.43, 0.30, 0.18, 0.10],
            "debtEquity": [1.63, 1.86, 2.67, 5.30, 117.65],
            "dscr": [0.82, 0.45, 0.12, -0.15, -0.35],
            "interestCoverage": [0.9, 0.4, -0.3, -0.7, -0.9],
            "roe": [5.7, -5.0, -22.7, -71.2, -1882.4],
            "debtorDays": [41, 40, 36, 30, 20],
            "inventoryDays": [67, 71, 84, 96, 104]
        },
        "gstData": {
            "gstr3b": [420, 400, 380, 350, 320, 300, 280, 260, 240, 220, 200, 180],
            "gstr2a": [250, 230, 220, 200, 180, 170, 160, 140, 130, 120, 110, 100],
            "bankInflows": [180, 170, 160, 150, 140, 130, 120, 110, 100, 90, 80, 70],
            "months": ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"],
            "mismatchFlags": [
                {"month": "Apr", "type": "revenue_inflation", "severity": "critical", "detail": "₹170L GSTR-3B vs ₹250L GSTR-2A vs ₹180L bank inflows — massive revenue inflation"},
                {"month": "Jun", "type": "circular_trading", "severity": "critical", "detail": "GSTR-3B ₹380L vs bank inflows ₹160L — ₹220L unaccounted revenue"},
                {"month": "Sep", "type": "round_tripping", "severity": "critical", "detail": "Related party payments with no corresponding goods movement"},
                {"month": "Nov", "type": "revenue_inflation", "severity": "critical", "detail": "Bank inflows dropped to ₹110L while GST shows ₹260L — 136% inflation"},
                {"month": "Feb", "type": "duplicate_gstin", "severity": "high", "detail": "Multiple GSTIN registrations with overlapping turnover"},
                {"month": "Mar", "type": "circular_trading", "severity": "critical", "detail": "Year-end circular invoicing detected with shell entities"}
            ]
        },
        "litigation": [
            {"court": "NCLT Chennai", "type": "Insolvency - Section 7", "amount": 85000000, "status": "Admitted", "date": "2025-06-10", "risk": "critical", "url": "https://ecourts.gov.in/case/NCL-CHE-2025-3344"},
            {"court": "High Court Madras", "type": "Fraud by Promoter", "amount": 35000000, "status": "Pending", "date": "2025-08-22", "risk": "critical", "url": "https://ecourts.gov.in/case/HC-MAD-2025-7788"},
            {"court": "ED", "type": "Money Laundering Investigation", "amount": 0, "status": "Under Investigation", "date": "2025-11-01", "risk": "critical", "url": "https://enforcementdirectorate.gov.in/case/ML-2025-0456"},
            {"court": "GST Tribunal", "type": "GST Evasion", "amount": 15000000, "status": "Show Cause Issued", "date": "2025-04-18", "risk": "high", "url": "https://gst.gov.in/tribunal/SCN-2025-1122"},
            {"court": "Labour Court Chennai", "type": "Unpaid Wages", "amount": 2000000, "status": "Pending", "date": "2024-12-05", "risk": "medium", "url": "https://ecourts.gov.in/case/LC-CHE-2024-9901"}
        ],
        "research": [
            {"source": "The Hindu", "title": "Mahalakshmi Textiles promoter under ED scanner for money laundering", "date": "2025-11-05", "riskType": "negative", "impact": -30, "url": "https://thehindu.com/mahalakshmi-ed"},
            {"source": "Moneycontrol", "title": "Indian textile sector faces worst slowdown in a decade", "date": "2026-01-25", "riskType": "negative", "impact": -8, "url": "https://moneycontrol.com/textile-slowdown"},
            {"source": "RBI Circular", "title": "RBI tightens NBFC lending norms for stressed sectors", "date": "2025-12-20", "riskType": "negative", "impact": -10, "url": "https://rbi.org.in/circular/2025-12-nbfc"},
            {"source": "MCA Portal", "title": "Multiple director disqualifications — ROC compliance failure", "date": "2025-08-01", "riskType": "negative", "impact": -15, "url": "https://mca.gov.in/filing/mahalakshmi"},
            {"source": "CIBIL", "title": "Promoter CIBIL score: 480 — Multiple defaults", "date": "2025-10-15", "riskType": "negative", "impact": -20, "url": "https://cibil.com/report/subramaniam-iyer"}
        ],
        "collateral": {"type": "Old Machinery (Obsolete) + Personal Guarantee", "value": 25000000, "coverage": 0.21},
        "creditRating": "D",
        "ratingAgency": "CARE",
        "sanctions": ["Account NPA — Classified as D3", "Wilful defaulter proceedings initiated"],
        "qualitativeNotes": ""
    }
]


# --- Helper functions ---
def format_currency(amount):
    if amount >= 10000000:
        return f"₹{amount / 10000000:.2f} Cr"
    if amount >= 100000:
        return f"₹{amount / 100000:.2f} L"
    return f"₹{amount:,.0f}"


def format_lakhs(val):
    return f"₹{val:,.0f} L"


def get_score_class(score):
    if score >= 70:
        return "low"
    if score >= 50:
        return "medium"
    if score >= 30:
        return "high"
    return "critical"


def get_company_by_id(company_id):
    return next((c for c in DEMO_COMPANIES if c["id"] == company_id), None)


def get_dashboard_stats():
    total = len(DEMO_COMPANIES)
    approved = sum(1 for c in DEMO_COMPANIES if c["decision"] == "Approve")
    rejected = total - approved
    avg_score = round(sum(c["score"] for c in DEMO_COMPANIES) / total)
    fraud_alerts = sum(len(c["gstData"]["mismatchFlags"]) for c in DEMO_COMPANIES)
    return {"total": total, "approved": approved, "rejected": rejected, "avgScore": avg_score, "fraudAlerts": fraud_alerts}
