import type {
  FraudCenterSeverity,
  FraudCenterStatus,
} from "@/lib/fraud-center-ui";

export interface FraudCenterEvent {
  id: string;
  severity: FraudCenterSeverity;
  detectedPattern: string;
  linkedOrderCount: number;
  linkedOrderIds: string[];
  investigationStatus: FraudCenterStatus;
  timeline: string;
  city: string;
  pincode: string;
}

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 60 * 60 * 1000).toISOString();
}

function daysAgo(d: number, h = 0): string {
  return new Date(Date.now() - (d * 24 + h) * 60 * 60 * 1000).toISOString();
}

/** 14 rows — Indian cities/pincodes aligned with Dashboard Showcase mock data. */
export const FRAUD_CENTER_EVENTS: FraudCenterEvent[] = [
  {
    id: "FE-2401",
    severity: "Critical",
    detectedPattern: "Repeat refusal — same device",
    linkedOrderCount: 5,
    linkedOrderIds: ["#ORD-91204", "#ORD-48291", "#ORD-33102", "#ORD-22891", "#ORD-11903"],
    investigationStatus: "Open",
    timeline: hoursAgo(2),
    city: "Jaipur",
    pincode: "302001",
  },
  {
    id: "FE-2402",
    severity: "High",
    detectedPattern: "Address mismatch cluster",
    linkedOrderCount: 3,
    linkedOrderIds: ["#ORD-76291", "#ORD-55120", "#ORD-44018"],
    investigationStatus: "Investigating",
    timeline: hoursAgo(5),
    city: "New Delhi",
    pincode: "110044",
  },
  {
    id: "FE-2403",
    severity: "High",
    detectedPattern: "Rapid order velocity",
    linkedOrderCount: 4,
    linkedOrderIds: ["#ORD-88231", "#ORD-88245", "#ORD-88267", "#ORD-88289"],
    investigationStatus: "Open",
    timeline: hoursAgo(8),
    city: "Mumbai",
    pincode: "400072",
  },
  {
    id: "FE-2404",
    severity: "Medium",
    detectedPattern: "Disposable email domain at checkout",
    linkedOrderCount: 2,
    linkedOrderIds: ["#ORD-54129", "#ORD-54188"],
    investigationStatus: "Investigating",
    timeline: hoursAgo(14),
    city: "Bangalore",
    pincode: "560034",
  },
  {
    id: "FE-2405",
    severity: "Low",
    detectedPattern: "Pincode risk spike — first-time buyer",
    linkedOrderCount: 1,
    linkedOrderIds: ["#ORD-12908"],
    investigationStatus: "Dismissed",
    timeline: hoursAgo(20),
    city: "Pune",
    pincode: "411001",
  },
  {
    id: "FE-2406",
    severity: "Critical",
    detectedPattern: "Shared phone across 4 merchant accounts",
    linkedOrderCount: 6,
    linkedOrderIds: ["#ORD-91204", "#ORD-76291", "#ORD-33290", "#ORD-22810", "#ORD-11892", "#ORD-00931"],
    investigationStatus: "Investigating",
    timeline: daysAgo(1, 3),
    city: "Kolkata",
    pincode: "700091",
  },
  {
    id: "FE-2407",
    severity: "Medium",
    detectedPattern: "OTP verification bypass attempt",
    linkedOrderCount: 2,
    linkedOrderIds: ["#ORD-33290", "#ORD-33291"],
    investigationStatus: "Resolved",
    timeline: daysAgo(1, 9),
    city: "Jaipur",
    pincode: "302001",
  },
  {
    id: "FE-2408",
    severity: "High",
    detectedPattern: "Known RTO address — Surat corridor",
    linkedOrderCount: 3,
    linkedOrderIds: ["#ORD-48291", "#ORD-48302", "#ORD-48319"],
    investigationStatus: "Open",
    timeline: daysAgo(2),
    city: "Ahmedabad",
    pincode: "380009",
  },
  {
    id: "FE-2409",
    severity: "Low",
    detectedPattern: "Unusual checkout hour pattern",
    linkedOrderCount: 1,
    linkedOrderIds: ["#ORD-88231"],
    investigationStatus: "Resolved",
    timeline: daysAgo(3),
    city: "Mumbai",
    pincode: "400072",
  },
  {
    id: "FE-2410",
    severity: "Medium",
    detectedPattern: "High-value COD spike — new pincode",
    linkedOrderCount: 2,
    linkedOrderIds: ["#ORD-76291", "#ORD-76310"],
    investigationStatus: "Open",
    timeline: daysAgo(4),
    city: "Gurugram",
    pincode: "122001",
  },
  {
    id: "FE-2411",
    severity: "High",
    detectedPattern: "Repeat refusal — same device",
    linkedOrderCount: 3,
    linkedOrderIds: ["#ORD-91204", "#ORD-91218", "#ORD-91233"],
    investigationStatus: "Resolved",
    timeline: daysAgo(6),
    city: "Noida",
    pincode: "201301",
  },
  {
    id: "FE-2412",
    severity: "Critical",
    detectedPattern: "Coordinated ring — 8 linked phones",
    linkedOrderCount: 8,
    linkedOrderIds: ["#ORD-10001", "#ORD-10002", "#ORD-10003", "#ORD-10004", "#ORD-10005", "#ORD-10006", "#ORD-10007", "#ORD-10008"],
    investigationStatus: "Investigating",
    timeline: daysAgo(8),
    city: "Hyderabad",
    pincode: "500081",
  },
  {
    id: "FE-2413",
    severity: "Low",
    detectedPattern: "Minor address formatting anomaly",
    linkedOrderCount: 1,
    linkedOrderIds: ["#ORD-54129"],
    investigationStatus: "Dismissed",
    timeline: daysAgo(12),
    city: "Chennai",
    pincode: "600041",
  },
  {
    id: "FE-2414",
    severity: "Medium",
    detectedPattern: "Claims history overlap — same pincode",
    linkedOrderCount: 2,
    linkedOrderIds: ["#ORD-33290", "#ORD-33301"],
    investigationStatus: "Resolved",
    timeline: daysAgo(25),
    city: "Pune",
    pincode: "411001",
  },
];
