import type { IconType } from "react-icons";
import { BiUser } from "react-icons/bi";
import { GoLocation } from "react-icons/go";
import { GiVendingMachine } from "react-icons/gi";
import { GrHostMaintenance } from "react-icons/gr";

export type ResultsIconKey = "BiUser" | "GoLocation" | "GiVendingMachine" | "GrHostMaintenance";

const map: Record<ResultsIconKey, IconType> = {
  BiUser,
  GoLocation,
  GiVendingMachine,
  GrHostMaintenance,
};

export function getResultsIconByKey(key?: string): IconType {
  const k = (key ?? "").trim() as ResultsIconKey;
  return map[k] ?? BiUser;
}

export const resultsIconOptions: Array<{ key: ResultsIconKey; label: string }> = [
  { key: "BiUser", label: "User" },
  { key: "GoLocation", label: "Location" },
  { key: "GiVendingMachine", label: "Vending machine" },
  { key: "GrHostMaintenance", label: "Maintenance" },
];

