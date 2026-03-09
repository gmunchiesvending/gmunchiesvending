"use client";

import "./Results.css";
import { GiVendingMachine } from "react-icons/gi";
import ResultCard from "@/components/ui/ResultCard"
import { GoLocation } from "react-icons/go";
import { BiUser } from "react-icons/bi";
import { GrHostMaintenance } from "react-icons/gr";
import { titleCaseEyebrow } from "@/lib/text";

export default function Counter() {
  return (
    <section className="section-full rsfWrapper">
      <div className="section-regular">
        <div className="headingWrapper">
        <p className="beforeHeading">{titleCaseEyebrow("Our Growth")}</p>
        <h2 className="h2">Results</h2>
        <p className="afterHeading">From a single vending machine to a full refreshment program, we provide solutions tailored to your workplace.</p>
      </div>

        <div className="rsCardsWrapper">

          <ResultCard headline="Happy Clients" target={45} Icon={BiUser}/>
          <ResultCard headline="Locations" target={150} Icon={GoLocation}/>
          {/* <ResultCard headline="Maintenance" target={14000} Icon={GrHostMaintenance}/> */}
        </div>
      </div>
    </section>
  );
}
